"""Tests pour le score ATS piloté par l'IA : endpoint /api/ats-score + ai_engine.score_ats."""
from unittest.mock import patch

import pytest

import ai_engine

_HTML = "<div><h1>Jean Dupont</h1><p>Développeur Python, Docker</p></div>"
_JOB  = "Recherche développeur Python senior maîtrisant Docker et Kubernetes."

_VALID_PAYLOAD = {"html": _HTML, "job_desc": _JOB}

_AI_RESULT = {
    "score": 72,
    "matched_skills": ["Python", "Docker"],
    "missing_hard_skills": ["Kubernetes"],
    "missing_nice_to_have": [],
}


# ---- Endpoint /api/ats-score ------------------------------------------------

def test_ats_score_missing_html_returns_400(client):
    resp = client.post("/api/ats-score", json={"job_desc": _JOB})
    assert resp.status_code == 400


def test_ats_score_missing_job_desc_returns_400(client):
    resp = client.post("/api/ats-score", json={"html": _HTML})
    assert resp.status_code == 400


def test_ats_score_quota_exceeded_returns_429(client):
    with patch("app.quota.check_and_increment", return_value=False):
        resp = client.post("/api/ats-score", json=_VALID_PAYLOAD)
    assert resp.status_code == 429


def test_ats_score_user_key_bypasses_quota(client):
    with patch("app.ai_engine.score_ats", return_value=_AI_RESULT), \
         patch("app.quota.check_and_increment") as mock_quota:
        resp = client.post(
            "/api/ats-score",
            json=_VALID_PAYLOAD,
            headers={"X-Api-Key": "AIzaUserKey"},
        )
    mock_quota.assert_not_called()
    assert resp.status_code == 200


def test_ats_score_valid_returns_structured_json(client):
    with patch("app.ai_engine.score_ats", return_value=_AI_RESULT), \
         patch("app.quota.check_and_increment", return_value=True):
        resp = client.post("/api/ats-score", json=_VALID_PAYLOAD)

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["score"] == 72
    assert "Python" in data["matched_skills"]
    assert "Kubernetes" in data["missing_hard_skills"]


def test_ats_score_runtime_error_returns_429(client):
    with patch("app.ai_engine.score_ats", side_effect=RuntimeError("Quota Gemini épuisé")), \
         patch("app.quota.check_and_increment", return_value=True):
        resp = client.post("/api/ats-score", json=_VALID_PAYLOAD)
    assert resp.status_code == 429


def test_ats_score_generic_error_returns_500(client):
    with patch("app.ai_engine.score_ats", side_effect=Exception("boom")), \
         patch("app.quota.check_and_increment", return_value=True):
        resp = client.post("/api/ats-score", json=_VALID_PAYLOAD)
    assert resp.status_code == 500


# ---- ai_engine.score_ats (parsing / validation) ----------------------------

def test_score_ats_parses_valid_json():
    raw = '{"score": 80, "matched_skills": ["Python"], "missing_hard_skills": ["Go"], "missing_nice_to_have": ["AWS"]}'
    with patch("ai_engine._complete_gemini", return_value=raw):
        result = ai_engine.score_ats(_HTML, _JOB, api_key="AIzaTest")
    assert result["score"] == 80
    assert result["matched_skills"] == ["Python"]
    assert result["missing_hard_skills"] == ["Go"]


def test_score_ats_strips_markdown_fences():
    raw = '```json\n{"score": 50, "matched_skills": [], "missing_hard_skills": [], "missing_nice_to_have": []}\n```'
    with patch("ai_engine._complete_gemini", return_value=raw):
        result = ai_engine.score_ats(_HTML, _JOB, api_key="AIzaTest")
    assert result["score"] == 50


def test_score_ats_clamps_out_of_range_score():
    raw = '{"score": 250, "matched_skills": [], "missing_hard_skills": [], "missing_nice_to_have": []}'
    with patch("ai_engine._complete_gemini", return_value=raw):
        result = ai_engine.score_ats(_HTML, _JOB, api_key="AIzaTest")
    assert result["score"] == 100


def test_score_ats_dedupes_and_coerces_skills():
    raw = '{"score": 60, "matched_skills": ["Python", "python", "  Docker  "], "missing_hard_skills": [], "missing_nice_to_have": []}'
    with patch("ai_engine._complete_gemini", return_value=raw):
        result = ai_engine.score_ats(_HTML, _JOB, api_key="AIzaTest")
    assert result["matched_skills"] == ["Python", "Docker"]


def test_score_ats_invalid_json_raises_valueerror():
    with patch("ai_engine._complete_gemini", return_value="pas du tout du json"):
        with pytest.raises(ValueError, match="JSON malformé"):
            ai_engine.score_ats(_HTML, _JOB, api_key="AIzaTest")


def test_score_ats_missing_key_raises_valueerror(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(ValueError, match="Aucune clé API"):
        ai_engine.score_ats(_HTML, _JOB, api_key=None)
