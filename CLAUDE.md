# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Install (Python 3.10+):
```bash
pip install -r requirements.txt
python -m playwright install chromium   # required, ~250 MB Chromium binary
```

Run the web UI (opens browser on http://127.0.0.1:5050 + a tkinter control window):
```bash
python app.py
```

Run the MCP server standalone:
```bash
python mcp_server.py
```

Run the test suite:
```bash
pytest
```

Quick syntax check across all Python modules:
```bash
python -m py_compile app.py mcp_server.py archive.py pdf_engine.py ai_engine.py quota.py
```

## Architecture

Three entry points share a common rendering/archive backend:

```text
Browser ──HTTP──▶ app.py (Flask + tkinter)     ┐
                                                ├──▶ pdf_engine.html_to_pdf_bytes()
Claude desktop ──stdio MCP──▶ mcp_server.py    ┘   ──▶ archive.save_document()
                                                          │
                                               ┌──────────┘
                                               ├── SQLite (local): ~/Documents/CV-Archive/history.db
                                               └── MongoDB (serverless, if MONGODB_URI set)
```

> Note: `api/index.py` (Vercel serverless entry point) has been removed. The `api/` folder is empty.

### Modules

**`pdf_engine.py`** — PDF rendering. Two backends, auto-selected:
- Playwright (default, local) — Chromium, high fidelity
- WeasyPrint (serverless / forced via `PDF_ENGINE=weasyprint`) — pure Python, no Chromium

Exposes one public function: `html_to_pdf_bytes(html, page_format, margin, background) -> bytes`.

**`archive.py`** — storage abstraction.
- **Local**: SQLite WAL (`~/Documents/CV-Archive/history.db`). One-shot migration from legacy `history.json` runs automatically on first start.
- **Serverless** (`RENDER` or `AWS_LAMBDA_FUNCTION_NAME` env var): `/tmp/CV-Archive/history.db`.
- **MongoDB** (`MONGODB_URI` env var): replaces SQLite entirely. Detected via `_IS_SERVERLESS`.
- `OWNER = ""` in `archive.py` — add a name there if you want it in generated filenames.

**`ai_engine.py`** — AI calls (Gemini + Anthropic), streaming and non-streaming.
- Default model: `GEMINI_MODEL` env var, falls back to `gemini-3.1-flash-lite`.
- Key routing: keys starting with `sk-ant-` → Anthropic (claude-haiku-4-5); otherwise → Gemini.
- Anthropic does not support image input — PDF conversion requires a Gemini key.
- Users can pass their own key via the `X-Api-Key` request header; otherwise the server `GEMINI_API_KEY` env var is used.

**`quota.py`** — in-memory daily counter for server-key usage. Default limit: 50 req/day, overridable via `DAILY_QUOTA` env var. Thread-safe. Resets at midnight. User-supplied keys bypass the quota.

**`app.py`** — Flask application + local launcher (tkinter control window).
- Templates are in `templates/` (Jinja2): `index.html`, `history.html`, `login.html`.
- Uses Monaco editor + sandboxed `<iframe srcdoc>` preview.
- Mobile responsive: layout stacks vertically under 768 px.
- Photo Base64 injection: targets `<!-- URL_DE_VOTRE_PHOTO_ICI -->` or inserts at cursor. Large base64 strings are wrapped in `<!-- #region Photo_Base64 -->` for editor code folding.

**`mcp_server.py`** — FastMCP server. Tools: `convert_html_to_pdf`, `list_recent_documents`, `get_archive_dir`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Main editor page |
| GET | `/history` | History page |
| POST | `/convert` | HTML → PDF download. Returns PDF + `X-Archive-Entry` header (JSON). Does **not** save to server — archive is client-side (IndexedDB). |
| GET | `/api/history/<doc_id>/html` | Serve archived HTML from disk (legacy fallback for pre-IndexedDB entries). |
| GET | `/api/status` | Quota and API key status. |
| POST | `/api/text-to-html` | Text/CV → filled HTML skeleton. SSE streaming. |
| POST | `/api/pdf-to-html` | PDF pages → filled HTML skeleton (Gemini only, multipart). SSE streaming. |
| POST | `/api/tailor` | Adapt HTML CV to a job offer (3 levels: `peu`/`adapte`/`hyper`). SSE streaming. |
| POST | `/api/editor-chat` | AI chat for CV editing. Returns `{ reply, proposals }` JSON (non-streaming). |

## Security

**CSRF**: JSON endpoints (`Content-Type: application/json`) are implicitly safe against CSRF. The multipart endpoint `/api/pdf-to-html` requires the `X-CSRF-Token` header matching the session token returned by `_get_csrf_token()`.

**Input validation**: `VALID_FORMATS` and `VALID_MARGINS` whitelists in `pdf_engine.py` prevent CSS injection. `MAX_HTML_BYTES` = 8 MB, `MAX_PDF_BYTES` = 20 MB.

**Filename sanitization**: `_safe_filename()` in `archive.py` prevents path traversal and Windows reserved names.

## Tests

Test suite uses pytest. Files in `tests/`:
- `test_ai_engine.py` — streaming and non-streaming AI calls
- `test_archive.py` — SQLite CRUD, migration from JSON
- `test_auth.py` — CSRF protection
- `test_editor_chat.py` — AI chat endpoint
- `test_endpoints.py` — Flask routes
- `test_pdf_engine.py` — Playwright and WeasyPrint backends
- `test_quota.py` — daily counter, reset logic

## Conventions and gotchas

- **Templates in `templates/`**: pages are Jinja2 files, not inline strings. The old `PAGE`/`HISTORY_PAGE` raw string approach has been replaced.
- **SSE streaming**: AI endpoints yield `data: <json>\n\n` chunks; final chunk is `data: [DONE]\n\n`; errors are `data: [ERROR] <msg>\n\n`.
- **History fallback**: `IndexedDB` is the source of truth in the browser. The `/api/history/<id>/html` route is only for documents created before the migration to 100%-browser storage.
- **Archive does not save on `/convert`**: PDF conversion only returns the file as a download + a JSON header. The browser is responsible for persisting the entry in IndexedDB. `archive.save_document()` is only called by the MCP server.
- **`OWNER`** in `archive.py` is an empty string — set it to inject a name into generated PDF filenames.
- `app.py` calls `os.startfile()` and `subprocess.run(["explorer", ...])` — Windows-only.
- After any change to `mcp_server.py`, restart Claude desktop fully.

## MCP integration

Claude desktop config: `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

```json
{
  "mcpServers": {
    "html-to-pdf": {
      "command": "python",
      "args": ["C:\\Users\\tahet\\projects\\html-to-pdf\\mcp_server.py"]
    }
  }
}
```
