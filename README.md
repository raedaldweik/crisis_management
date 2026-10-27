# Crisis Management suite

Four emergency-response dashboards for Dubai, served behind one navigation bar, with a
Claude-powered assistant (Anthropic API) that answers questions about what the dashboards
show. The app is a single Docker image that deploys to Railway as-is.

| Nav tab | File | Content |
|---|---|---|
| Unified Intelligence | `dashboards/unified_intelligence.html` | Live Mapbox map of incidents + patrol ops, city KPIs, risk gauges, AI recommendations |
| Accident Review | `dashboards/accident.html` | Post-incident review of #67582749: timeline, responders, SLA-breach investigation |
| Predictive Intelligence | `dashboards/predictive.html` | 24-hour forecast, early-warning alert, weekly high-risk heatmap, risk drivers |
| Response Optimization | `dashboards/simulation.html` | Next-hour staffing needs, high-risk segments, unit repositioning, workforce status |

The dashboards are untouched standalone HTML files. The React shell embeds them (same-origin
iframes, kept alive across tab switches), adds the navigation bar, and hosts the assistant.

## The assistant

The chat UI is the same one as the Roads RAM UI (glass panels, streamed markdown answers,
typing indicator with live activity, tool-call trace, suggestion chips, voice input, document
attachments, conversation history with rename/delete), re-skinned to the dashboards' dark
palette. Behind it, a FastAPI backend calls Claude through the official `anthropic` SDK:

- **Grounded in the dashboards.** `backend/knowledge/*.md` documents every KPI, table row,
  chart series, map marker and recommendation on the four pages, plus the threads that
  connect them (the same incident on two pages, the Rashidiya staffing gap, the Al Qusais
  hotspot…). It is sent as a cached system prompt, so follow-up turns are cheap.
- **Sees what you see.** Each question carries a plain-text snapshot of the active
  dashboard's iframe (KPIs, the incident you clicked on the map, dropdown values…), so
  "what is selected right now?" works.
- **Can navigate.** The model has one tool, `open_dashboard`, so "show me the forecast"
  switches tabs and then answers.
- **Streams.** Answers arrive token by token over Server-Sent Events; Stop cancels.

Defaults: model `claude-opus-5-5` with adaptive thinking at `medium` effort, prompt caching
on the system prompt, and the API's server-side refusal fallback enabled. All configurable
(see below).

### Keeping the knowledge base current

If you change a dashboard's data, update the matching file in `backend/knowledge/` — the
assistant answers from those notes (plus the live snapshot), not by reading the HTML.

## Project layout

```
dashboards/        the four HTML dashboards + Accident_image.jpg (served at /dashboards/*)
frontend/          React + Vite + Tailwind shell: NavBar, DashboardFrame (iframes), ChatPanel
backend/           FastAPI: /api/chat (SSE), /api/health, /api/extract; serves dashboards + dist
  knowledge/       the dashboard knowledge base (markdown)
  services/assistant.py   Claude call: streaming, tool loop, caching, mock mode
Dockerfile         node build stage → python runtime, one port
railway.json       Railway config (Dockerfile builder, /api/health healthcheck)
```

## Run locally

```bash
# backend (terminal 1)
cd backend
pip install -r requirements.txt
cp .env.example .env            # put your ANTHROPIC_API_KEY in it
uvicorn main:app --reload --port 8000

# frontend (terminal 2)
cd frontend
npm install
npm run dev                     # http://localhost:5173 — proxies /api and /dashboards to :8000
```

No API key yet? Set `ASSISTANT_MOCK=true` instead: the whole UI works against canned
answers (including the navigation tool) so you can smoke-test the deployment.

Production build on one port:

```bash
cd frontend && npm run build && cd ../backend && uvicorn main:app --port 8000
# http://localhost:8000
```

## Deploy to Railway

1. Push this repo to GitHub, then in Railway: **New Project → Deploy from GitHub repo** and
   pick it. Railway reads `railway.json` and builds the `Dockerfile` — no build settings
   needed. Railway injects `PORT`; the image listens on it.
2. In the service's **Variables** tab set:

   | Variable | Required | Notes |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | yes | from https://console.anthropic.com/ |
   | `ANTHROPIC_MODEL` | no | default `claude-opus-5-5` |
   | `ASSISTANT_EFFORT` | no | `low` / `medium` (default) / `high` — reasoning depth vs. latency |
   | `ASSISTANT_MAX_TOKENS` | no | default `8000` |
   | `ASSISTANT_MOCK` | no | `true` to run without the API (canned answers) |

3. Generate a public domain under **Settings → Networking**. The health check hits
   `/api/health`; the UI is at `/`, and `#/unified`, `#/accident`, `#/predictive`,
   `#/response` deep-link to a dashboard.

Notes:
- Conversations are stored in the browser (localStorage), not on the server.
- The Mapbox token used by the Unified Intelligence map is the public token already in the
  dashboard HTML; restrict it to your Railway domain in the Mapbox console if you want.
- Anyone with the URL can use the assistant (and your API key's quota). Keep the URL
  private or put access control in front of it.

## API

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | assistant status (`ok` / `unconfigured`), mode (`live` / `mock`), model, dashboard list |
| `/api/dashboards` | GET | the dashboard registry |
| `/api/chat` | POST | `{messages, dashboard, snapshot, attachments}` → SSE stream of `{type: start\|text\|activity\|tool\|done\|error}` |
| `/api/extract` | POST | multipart file → extracted text (PDF, DOCX, TXT, CSV, MD, JSON…) |
| `/dashboards/*` | GET | the static dashboards |
