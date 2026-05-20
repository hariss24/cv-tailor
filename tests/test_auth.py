from unittest.mock import patch


def test_local_mode_leaves_history_api_open(client, monkeypatch):
    monkeypatch.delenv("APP_MODE", raising=False)
    monkeypatch.delenv("REMOTE_AUTH_PASSWORD", raising=False)
    monkeypatch.delenv("AUTH_PASSWORD", raising=False)
    monkeypatch.delenv("VERCEL", raising=False)

    with patch("app.archive.list_documents", return_value=[]):
        resp = client.get("/api/history")

    assert resp.status_code == 200
    assert resp.get_json() == []


def test_remote_mode_requires_auth_for_history_api(client, monkeypatch):
    monkeypatch.setenv("APP_MODE", "remote")
    monkeypatch.setenv("REMOTE_AUTH_PASSWORD", "secret")

    resp = client.get("/api/history")

    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Authentication required."


def test_remote_mode_redirects_page_requests_to_login(client, monkeypatch):
    monkeypatch.setenv("APP_MODE", "remote")
    monkeypatch.setenv("REMOTE_AUTH_PASSWORD", "secret")

    resp = client.get("/history")

    assert resp.status_code == 302
    assert "/login" in resp.headers["Location"]


def test_remote_login_rejects_wrong_password(client, monkeypatch):
    monkeypatch.setenv("APP_MODE", "remote")
    monkeypatch.setenv("REMOTE_AUTH_PASSWORD", "secret")

    resp = client.post("/login", json={"password": "wrong"})

    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid password."


def test_remote_login_allows_history_api(client, monkeypatch):
    monkeypatch.setenv("APP_MODE", "remote")
    monkeypatch.setenv("REMOTE_AUTH_PASSWORD", "secret")

    login = client.post("/login", json={"password": "secret"})
    assert login.status_code == 200

    with patch("app.archive.list_documents", return_value=[{"id": "doc-1"}]):
        resp = client.get("/api/history")

    assert resp.status_code == 200
    assert resp.get_json() == [{"id": "doc-1"}]


def test_remote_mode_without_password_reports_setup_error(client, monkeypatch):
    monkeypatch.setenv("APP_MODE", "remote")
    monkeypatch.delenv("REMOTE_AUTH_PASSWORD", raising=False)
    monkeypatch.delenv("AUTH_PASSWORD", raising=False)

    resp = client.get("/api/history")

    assert resp.status_code == 503
    assert "REMOTE_AUTH_PASSWORD" in resp.get_json()["error"]
