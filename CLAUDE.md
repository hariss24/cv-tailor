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

Run the MCP server standalone (it speaks stdio JSON-RPC, useful for debugging — Claude desktop spawns it on its own):
```bash
python mcp_server.py
```

Quick syntax check across all Python modules:
```bash
python -m py_compile app.py mcp_server.py archive.py pdf_engine.py api/index.py
```

There is no test suite. When validating changes, write a temporary `test_*.py` script that exercises the relevant entry point (Flask via `urllib.request` against `http://127.0.0.1:5050`, MCP via `subprocess.Popen` + JSON-RPC over stdin/stdout), run it, then delete it.

## Architecture

Two independent frontends and a Serverless API share a single rendering and archival backend:

```text
Browser ──HTTP──▶ app.py (Flask + tkinter)        ┐
                                                   ├──▶ pdf_engine.html_to_pdf_bytes()  (sync Playwright)
Claude desktop ──stdio MCP──▶ mcp_server.py       ┘   ──▶ archive.save_document()       (local fs + history.json)
                                                                │
Vercel Serverless ──HTTP──▶ api/index.py          ──────────────┼─▶ Vercel Blob Storage (if BLOB_READ_WRITE_TOKEN)
```

`pdf_engine.py` is the **only** place that talks to Playwright. It exposes one sync function `html_to_pdf_bytes(html, page_format, margin, background) -> bytes`. Anything that needs PDF rendering must go through it.

`archive.py` handles storage. 
- In **Local Mode**: writes to disk under `~/Documents/CV-Archive/`. It owns `history.json`.
- In **Serverless Mode** (Vercel / AWS Lambda): `/tmp` is read-only except for `/tmp/CV-Archive/`. It detects this via environment variables (`VERCEL`).
- **Blob Storage**: If `BLOB_READ_WRITE_TOKEN` is present, it uploads generated PDFs and HTML to Vercel Blob Storage, returning permanent URLs (`pdf_blob_url`, `html_blob_url`).

`app.py` is a single Flask file containing the local launcher and the UI.
- The two HTML pages (`PAGE`, `HISTORY_PAGE`) are inline triple-quoted strings.
- Uses Monaco editor on the left and a sandboxed `<iframe srcdoc>` preview on the right.
- **Mobile Responsive**: The layout stacks vertically under 768px. The Javascript splitter (`initSplitter`) adapts dynamically to handle `touchmove` and vertical resizing.
- **Photo Base64 Injection**: Local images are encoded to Base64 in JavaScript and injected into the editor using Monaco's `insertSnippet`. It targets `<!-- URL_DE_VOTRE_PHOTO_ICI -->` or inserts at the cursor. Large Base64 strings are wrapped in `<!-- #region Photo_Base64 --> ... <!-- #endregion -->` to allow native editor code folding.
- **AI Assistant**: A modal that generates ChatGPT/Claude prompts based on the current template and job offer. The `job_desc` field is sent to `/convert` and permanently saved in the archive history.

`api/index.py` is the Vercel Serverless entry point. It wraps `app.py` using `werkzeug.middleware.dispatcher`.

`mcp_server.py` uses `FastMCP` and exposes PDF conversion tools.

## Conventions and gotchas

- `PAGE` in `app.py` is a **raw string** (`r"""..."""`) because the inline JS contains regex literals with `\w` and `\s` — without `r`, Python 3.12+ emits `SyntaxWarning`.
- The web UI's `/convert` endpoint always archives. Don't add a "skip archive" flag.
- **History Fallback**: The frontend `load()` prioritizes `localStorage` over the `/api/history` route because the serverless environment loses local disk state between cold starts.
- `OWNER = "Hariss"` in `archive.py` is hardcoded into filenames. Change it there if reusing the project for someone else.
- `app.py` calls `os.startfile()` and `subprocess.run(["explorer", "/select,", ...])` — Windows-only. These are hidden from the UI when running on Vercel.

## MCP integration

Claude desktop config lives at `%APPDATA%\Claude\claude_desktop_config.json` (Windows). The `mcpServers.html-to-pdf` entry already points to `mcp_server.py`. After any change to `mcp_server.py`, restart Claude desktop fully to pick it up.
