"""Dashboard registry + the curated knowledge base the assistant answers from.

The four dashboards are static HTML files in ../dashboards, served by the backend at
/dashboards/<file>. The order here is the navigation order. The ids are shared with the
frontend (frontend/src/dashboards.js) and with the assistant's `open_dashboard` tool.
"""
from __future__ import annotations

import os
from functools import lru_cache

HERE = os.path.dirname(os.path.abspath(__file__))
KNOWLEDGE_DIR = os.path.join(os.path.dirname(HERE), "knowledge")
DASHBOARDS_DIR = os.path.abspath(os.path.join(os.path.dirname(HERE), "..", "dashboards"))

DASHBOARDS: list[dict] = [
    {
        "id": "unified",
        "label": "Unified Intelligence",
        "title": "Simulation for Unified Operational Intelligence",
        "file": "unified_intelligence.html",
        "description": "Live operational map of Dubai with active incidents, patrol ops, city KPIs, "
                       "per-incident risk gauges and AI recommendations.",
    },
    {
        "id": "accident",
        "label": "Accident Review",
        "title": "Post-Incident Response Review - #67582749",
        "file": "accident.html",
        "description": "After-action review of incident #67582749 (Al Qusais): response timeline, "
                       "responder performance and the SLA-breach investigation note.",
    },
    {
        "id": "predictive",
        "label": "Predictive Intelligence",
        "title": "Predictive Accident Forecasting & Intelligence",
        "file": "predictive.html",
        "description": "Next-24-hour accident forecast, early-warning alert, weekly high-risk hours "
                       "heatmap and explainable risk drivers.",
    },
    {
        "id": "response",
        "label": "Response Optimization",
        "title": "Simulation for Incident Response Optimization",
        "file": "simulation.html",
        "description": "Next-hour staffing and vehicle needs, high-risk street segments, unit "
                       "repositioning recommendations and workforce status.",
    },
]

DASHBOARD_IDS = [d["id"] for d in DASHBOARDS]


def get_dashboard(dashboard_id: str | None) -> dict | None:
    return next((d for d in DASHBOARDS if d["id"] == dashboard_id), None)


@lru_cache(maxsize=1)
def knowledge_text() -> str:
    """All knowledge files concatenated in filename order (00_overview, 01_unified, ...)."""
    parts: list[str] = []
    for name in sorted(os.listdir(KNOWLEDGE_DIR)):
        if not name.endswith(".md"):
            continue
        with open(os.path.join(KNOWLEDGE_DIR, name), encoding="utf-8") as fh:
            parts.append(fh.read().strip())
    return "\n\n---\n\n".join(parts)
