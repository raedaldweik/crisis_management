"""
Crisis Management suite — FastAPI backend.

Serves the four dashboards (../dashboards), the React shell (../frontend/dist) and the
assistant API (/api/*).

Local dev:
    uvicorn main:app --reload --port 8000        # API + dashboards (UI via Vite on :5173)

Production (Docker / Railway):
    uvicorn main:app --host 0.0.0.0 --port $PORT  # frontend pre-built at ../frontend/dist

See backend/.env.example for configuration.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

from routers import chat as chat_router          # noqa: E402  (after load_dotenv)
from services import assistant                   # noqa: E402
from services.dashboards import DASHBOARDS_DIR   # noqa: E402

app = FastAPI(
    title="Crisis Management suite",
    description="Four emergency-response dashboards for Dubai + a Claude-powered assistant",
    version="0.1.0",
)

# CORS — permissive in dev; in prod the frontend is same-origin so CORS is moot
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router.router)

print(f"✓ Assistant: {assistant.status()}")

# ─── The four dashboards (static HTML, embedded by the shell in iframes) ───
if os.path.isdir(DASHBOARDS_DIR):
    app.mount("/dashboards", StaticFiles(directory=DASHBOARDS_DIR), name="dashboards")
    print(f"✓ Serving dashboards from {DASHBOARDS_DIR}")
else:
    print(f"⚠ No dashboards directory at {DASHBOARDS_DIR}")

# ─── Static frontend (same pattern as the Roads RAM UI) ──────────────
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist"))

if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{filename:path}")
    def serve_spa(filename: str):
        if filename.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = os.path.abspath(os.path.join(FRONTEND_DIST, filename))
        if candidate.startswith(FRONTEND_DIST + os.sep) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    print(f"✓ Serving frontend from {FRONTEND_DIST}")
else:
    @app.get("/")
    def root() -> dict:
        return {
            "service": "Crisis Management suite",
            "status": "operational (dev mode — no frontend build found)",
            "assistant": assistant.status(),
            "hint": "run 'npm run build' in frontend/ for production, or run the Vite dev server on :5173",
        }

    print(f"⚠ No frontend build at {FRONTEND_DIST} — API-only mode")
