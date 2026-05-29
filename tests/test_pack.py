"""Tests pour le Pack candidature : endpoint /api/generate-pack + ai_engine.generate_pack."""
from unittest.mock import patch

import pytest

import ai_engine

_HTML = '<div><span class="personal-data__name">Jean Dupont</span><p>Développeur Python, Docker</p></div>'
_CSS  = ':root{--resume-template-customization-color:#c9c6c1;} body{font-family:Helvetica;}'
_JOB  = "Recherche développeur Python senior maîtrisant Docker et Kubernetes."

_VALID_PAYLOAD = {"html": _HTML, "css": _CSS, "job_desc": _JOB, "company": "Acme", "role": "Dev"}

_AI_RESULT = {
    "letter_html": '<div class="lm"><p>Madame, Monsieur,</p><p>Corps.</p></div>',
    "letter_css":  "body{font-family:Helvetica;}",
    "email":       "Objet : Candidature Dev\n\nBonjour,\nVoici ma candidature.\nCordialement, Jean",
}


# ---- Endpoint /api/generate-pack -------------------------------------------

def test_pack_missing_html_returns_400(client):
    resp = client.post("/api/generate-pack", json={"job_desc": _JOB})
    assert resp.status_code == 400


def test_pack_missing_job_desc_returns_400(client):
    resp = client.post("/api/generate-pack", json={"html": _HTML})
    assert resp.status_code == 400


def test_pack_quota_exceeded_returns_429(client):
    with patch("app.quota.check_and_increment", return_value=False):
        resp = client.post("/api/generate-pack", json=_VALID_PAYLOAD)
    assert resp.status_code == 429


def test_pack_user_key_bypasses_quota(client):
    with patch("app.ai_engine.generate_pack", return_value=_AI_RESULT), \
         patch("app.quota.check_and_increment") as mock_quota:
        resp = client.post(
            "/api/generate-pack",
            json=_VALID_PAYLOAD,
            headers={"X-Api-Key": "AIzaUserKey"},
        )
    mock_quota.assert_not_called()
    assert resp.status_code == 200


def test_pack_valid_returns_structured_json(client):
    with patch("app.ai_engine.generate_pack", return_value=_AI_RESULT), \
         patch("app.quota.check_and_increment", return_value=True):
        resp = client.post("/api/generate-pack", json=_VALID_PAYLOAD)

    assert resp.status_code == 200
    data = resp.get_json()
    assert "Madame, Monsieur" in data["letter_html"]
    assert data["letter_css"]
    assert "Objet" in data["email"]


def test_pack_runtime_error_returns_429(client):
    with patch("app.ai_engine.generate_pack", side_effect=RuntimeError("Quota Gemini épuisé")), \
         patch("app.quota.check_and_increment", return_value=True):
        resp = client.post("/api/generate-pack", json=_VALID_PAYLOAD)
    assert resp.status_code == 429


def test_pack_generic_error_returns_500(client):
    with patch("app.ai_engine.generate_pack", side_effect=Exception("boom")), \
         patch("app.quota.check_and_increment", return_value=True):
        resp = client.post("/api/generate-pack", json=_VALID_PAYLOAD)
    assert resp.status_code == 500


# ---- ai_engine.generate_pack (parsing / validation) ------------------------

def test_generate_pack_parses_valid_json():
    raw = '{"letter_html": "<div>LM</div>", "letter_css": "body{}", "email": "Objet : X"}'
    with patch("ai_engine._complete_gemini", return_value=raw):
        result = ai_engine.generate_pack(_HTML, _CSS, _JOB, api_key="AIzaTest")
    assert result["letter_html"] == "<div>LM</div>"
    assert result["letter_css"] == "body{}"
    assert result["email"] == "Objet : X"


def test_generate_pack_strips_markdown_fences():
    raw = '```json\n{"letter_html": "<p>x</p>", "letter_css": "", "email": "Objet"}\n```'
    with patch("ai_engine._complete_gemini", return_value=raw):
        result = ai_engine.generate_pack(_HTML, _CSS, _JOB, api_key="AIzaTest")
    assert result["letter_html"] == "<p>x</p>"


def test_generate_pack_missing_letter_raises_valueerror():
    raw = '{"email": "Objet : X"}'
    with patch("ai_engine._complete_gemini", return_value=raw):
        with pytest.raises(ValueError, match="letter_html"):
            ai_engine.generate_pack(_HTML, _CSS, _JOB, api_key="AIzaTest")


def test_generate_pack_invalid_json_raises_valueerror():
    with patch("ai_engine._complete_gemini", return_value="pas du json"):
        with pytest.raises(ValueError, match="JSON malformé"):
            ai_engine.generate_pack(_HTML, _CSS, _JOB, api_key="AIzaTest")


def test_generate_pack_missing_key_raises_valueerror(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(ValueError, match="Aucune clé API"):
        ai_engine.generate_pack(_HTML, _CSS, _JOB, api_key=None)
