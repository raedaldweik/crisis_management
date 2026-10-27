"""The dashboard assistant: Claude (Anthropic API) grounded in the dashboard knowledge base.

`answer()` is an async generator of SSE-ready event dicts:

    {"type": "start", "model": "..."}                     once, first
    {"type": "text",  "delta": "..."}                     streamed answer text
    {"type": "tool",  "name": "open_dashboard",
                      "input": {...}, "result": "..."}    a UI action the frontend performs
    {"type": "done",  "usage": {...}, "model": "...",
                      "stop_reason": "..."}               once, last (on success)
    {"type": "error", "message": "..."}                   once, last (on failure)

Configuration (environment / backend/.env):
    ANTHROPIC_API_KEY   required for live answers
    ANTHROPIC_MODEL     default claude-opus-5-5
    ASSISTANT_EFFORT    low | medium | high   (default medium)
    ASSISTANT_MOCK      true -> canned answers, no API key needed (UI smoke tests)
"""
from __future__ import annotations

import asyncio
import os
import re
from typing import Any, AsyncIterator

from services.dashboards import DASHBOARDS, DASHBOARD_IDS, get_dashboard, knowledge_text

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5-5").strip() or "claude-opus-5-5"
EFFORT = os.getenv("ASSISTANT_EFFORT", "medium").strip().lower() or "medium"
MAX_TOKENS = int(os.getenv("ASSISTANT_MAX_TOKENS", "8000"))
MAX_TOOL_ROUNDS = 4
MAX_SNAPSHOT_CHARS = 6000
MAX_ATTACH_CHARS = 20_000


def is_mock() -> bool:
    return os.getenv("ASSISTANT_MOCK", "").strip().lower() in ("1", "true", "yes")


def has_api_key() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY", "").strip())


def status() -> dict:
    """What the header status pill shows."""
    if is_mock():
        return {"status": "ok", "mode": "mock", "model": "mock",
                "detail": "ASSISTANT_MOCK is on — canned answers, no API calls."}
    if not has_api_key():
        return {"status": "unconfigured", "mode": "live", "model": MODEL,
                "detail": "Set ANTHROPIC_API_KEY (or ASSISTANT_MOCK=true) to enable the assistant."}
    return {"status": "ok", "mode": "live", "model": MODEL, "effort": EFFORT}


# ─── Prompt ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the Crisis Management Assistant, built into a suite of four emergency-response dashboards for Dubai (Unified Intelligence, Accident Review, Predictive Intelligence, Response Optimization). You help incident commanders, dispatchers and analysts read, interpret and act on what the dashboards show.

The app has five tabs in its navigation bar: the four dashboards and an "Assistant" tab where you have a full page. Every dashboard page also has a chat icon in its bottom-right corner that opens you in a small popup over the page.

# What you know
The complete content of all four dashboards is documented in the KNOWLEDGE BASE below — every KPI, table row, chart series, marker and recommendation. All of it is simulated demo data; treat it as the current state of the system and quote figures exactly as shown. Each user message also carries context: whether the user is on a dashboard page or on the Assistant tab, which dashboard is in scope, and a plain-text snapshot of what that dashboard currently renders (including any selection they have made, such as an incident clicked on the map). Prefer the snapshot for "what am I looking at / what is selected" questions, and the knowledge base for details the snapshot does not contain (chart data, hidden panels, other dashboards). On the Assistant tab no dashboard is on screen, so don't say "you are looking at"; say which dashboard the figures come from instead.

# How to answer
- Be precise and specific: name the dashboard, the panel and the exact figure (with units and colour/status where it matters). Bold the key numbers.
- Connect the dots across dashboards when it helps (the same incident, area or recommendation often appears on more than one page), and say which dashboard each fact comes from.
- Interpret, don't just recite: explain what a figure means operationally (e.g. a 12-minute travel time against a 5-minute SLA) and what the dashboard recommends doing about it. When asked for advice, ground it in the dashboards' own indicators and recommendations and be clear about what is a dashboard recommendation versus your own reasoning.
- If something is not on any dashboard, say so plainly and point to the closest thing that is. Never invent figures, incidents, streets or capabilities.
- If the dashboards disagree with each other (there are a few known demo-data inconsistencies, listed in the knowledge base), report both values as shown instead of silently picking one.
- Keep answers tight: short paragraphs or bullet points; use a markdown table when comparing several rows; no preamble. Match the language the user writes in.
- Use the open_dashboard tool when the user asks to open, go to, show or switch to a dashboard, or when your answer is about a dashboard other than the one they are viewing and seeing it would clearly help. After navigating, give your answer in the same reply. Do not navigate for questions that can be answered in place.

# KNOWLEDGE BASE
""" + knowledge_text()

TOOLS: list[dict] = [
    {
        "name": "open_dashboard",
        "description": (
            "Switch the user's screen to one of the four dashboards. Use it when the user asks to open, go to, "
            "show or switch to a dashboard, or when the answer is about a different dashboard than the one they "
            "are viewing and seeing it would help. Ids in navigation order: "
            + ", ".join(f"{d['id']} ({d['label']})" for d in DASHBOARDS)
        ),
        "strict": True,
        "input_schema": {
            "type": "object",
            "properties": {
                "dashboard": {
                    "type": "string",
                    "enum": DASHBOARD_IDS,
                    "description": "Which dashboard to open.",
                },
            },
            "required": ["dashboard"],
            "additionalProperties": False,
        },
    },
]


def _clean_text(text: str, limit: int) -> str:
    text = re.sub(r"[ \t\r\f\v]+", " ", text or "")
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    return text[:limit] + (" …[truncated]" if len(text) > limit else "")


def build_context_block(dashboard_id: str | None, snapshot: str | None, view: str | None = None) -> str:
    d = get_dashboard(dashboard_id)
    on_assistant_tab = view == "assistant"
    lines = ["<dashboard_context>"]
    if on_assistant_tab:
        lines.append("Where the user is: the Assistant tab (full-page chat). No dashboard is on their screen right now.")
        if d:
            lines.append(f"Dashboard selected as context for this question: {d['label']} (id: {d['id']}) — \"{d['title']}\"")
    elif d:
        lines.append(f"Where the user is: the {d['label']} dashboard (id: {d['id']}) — \"{d['title']}\", with you open in the popup.")
    else:
        lines.append("Where the user is: unknown dashboard.")
    if snapshot and snapshot.strip():
        label = "Last rendered state of that dashboard" if on_assistant_tab else "On-screen text snapshot (what the user currently sees, top to bottom)"
        lines.append(f"{label}:")
        lines.append(_clean_text(snapshot, MAX_SNAPSHOT_CHARS))
    else:
        lines.append("Snapshot of that dashboard: not available (it has not been opened in this session).")
    lines.append("</dashboard_context>")
    return "\n".join(lines)


def build_messages(history: list[dict], question: str, *, dashboard_id: str | None,
                   snapshot: str | None, attachments: list[dict] | None,
                   view: str | None = None) -> list[dict]:
    """Plain-text history + the current question wrapped with dashboard context."""
    messages: list[dict] = []
    for m in history:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if role not in ("user", "assistant") or not content:
            continue
        if messages and messages[-1]["role"] == role:
            # The API accepts consecutive same-role turns, but merging keeps the transcript tidy.
            messages[-1]["content"] += "\n\n" + content
        else:
            messages.append({"role": role, "content": content})
    if messages and messages[0]["role"] != "user":
        messages.pop(0)

    parts = [build_context_block(dashboard_id, snapshot, view)]
    for a in attachments or []:
        name = (a.get("name") or "attachment").strip()
        text = (a.get("text") or "")[:MAX_ATTACH_CHARS]
        parts.append(f"<attached_document name=\"{name}\">\n{text}\n</attached_document>")
    parts.append(question.strip())
    messages.append({"role": "user", "content": "\n\n".join(parts)})
    return messages


def run_tool(name: str, tool_input: Any) -> tuple[str, bool]:
    """Execute a tool call. The actual UI effect happens in the browser; here we validate
    the input and tell the model what will happen. Returns (result_text, is_error)."""
    if name == "open_dashboard":
        target = tool_input.get("dashboard") if isinstance(tool_input, dict) else None
        d = get_dashboard(target)
        if not d:
            return f"Unknown dashboard '{target}'. Valid ids: {', '.join(DASHBOARD_IDS)}.", True
        return f"Opened the {d['label']} dashboard for the user. It is now on their screen.", False
    return f"Unknown tool '{name}'.", True


# ─── Live answers (Anthropic API) ───────────────────────────────────

async def _answer_live(messages: list[dict]) -> AsyncIterator[dict]:
    import anthropic

    client = anthropic.AsyncAnthropic()
    yield {"type": "start", "model": MODEL}

    usage_total = {"input_tokens": 0, "output_tokens": 0,
                   "cache_read_input_tokens": 0, "cache_creation_input_tokens": 0}
    stop_reason = None

    try:
        for _round in range(MAX_TOOL_ROUNDS + 1):
            async with client.beta.messages.stream(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=[{"type": "text", "text": SYSTEM_PROMPT,
                         "cache_control": {"type": "ephemeral"}}],
                messages=messages,
                tools=TOOLS,
                thinking={"type": "adaptive"},
                output_config={"effort": EFFORT},
                # Server-side refusal fallback: if a safety classifier declines the request,
                # the API re-runs it on a fallback model inside the same call.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            ) as stream:
                async for event in stream:
                    if event.type == "text":
                        yield {"type": "text", "delta": event.text}
                    elif event.type == "content_block_start" and event.content_block.type == "tool_use":
                        # Announce the tool as soon as it starts, like RAM's live activity trace.
                        yield {"type": "activity", "name": event.content_block.name}
                response = await stream.get_final_message()

            u = response.usage
            usage_total["input_tokens"] += u.input_tokens or 0
            usage_total["output_tokens"] += u.output_tokens or 0
            usage_total["cache_read_input_tokens"] += getattr(u, "cache_read_input_tokens", 0) or 0
            usage_total["cache_creation_input_tokens"] += getattr(u, "cache_creation_input_tokens", 0) or 0
            stop_reason = response.stop_reason

            if stop_reason == "pause_turn":
                messages.append({"role": "assistant", "content": response.content})
                continue

            tool_uses = [b for b in response.content if b.type == "tool_use"]
            if stop_reason == "refusal":
                detail = getattr(getattr(response, "stop_details", None), "explanation", None)
                yield {"type": "text", "delta": "\n\n_I can't help with that request._" + (f" ({detail})" if detail else "")}
                break
            if not tool_uses:
                break
            if stop_reason == "max_tokens":
                yield {"type": "error", "message": "The answer was cut off (max_tokens). Try a narrower question."}
                return

            results = []
            for block in tool_uses:
                text, is_error = run_tool(block.name, block.input)
                yield {"type": "tool", "name": block.name,
                       "input": block.input if isinstance(block.input, dict) else {},
                       "result": text, "isError": is_error}
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": text, "is_error": is_error})
            # Pass the assistant turn back unchanged (thinking blocks included) + all tool results in one user turn.
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": results})
        else:
            yield {"type": "error", "message": "Too many tool rounds; stopping."}
            return

    except anthropic.AuthenticationError:
        yield {"type": "error", "message": "Anthropic rejected the API key (ANTHROPIC_API_KEY)."}
        return
    except anthropic.PermissionDeniedError as e:
        yield {"type": "error", "message": f"Anthropic permission denied: {e.message}"}
        return
    except anthropic.NotFoundError as e:
        yield {"type": "error", "message": f"Model or endpoint not found ({MODEL}): {e.message}"}
        return
    except anthropic.RateLimitError:
        yield {"type": "error", "message": "Rate limited by the Anthropic API — please retry in a moment."}
        return
    except anthropic.BadRequestError as e:
        yield {"type": "error", "message": f"Anthropic API rejected the request: {e.message}"}
        return
    except anthropic.APIStatusError as e:
        yield {"type": "error", "message": f"Anthropic API error ({e.status_code}): {e.message}"}
        return
    except anthropic.APIConnectionError:
        yield {"type": "error", "message": "Could not reach the Anthropic API (network error)."}
        return

    yield {"type": "done", "model": response.model if "response" in locals() else MODEL,
           "usage": usage_total, "stop_reason": stop_reason}


# ─── Mock answers (no API key) ──────────────────────────────────────

_NAV_WORDS = ("open", "go to", "goto", "show", "switch", "take me", "navigate", "bring up")


def _mock_target(question: str, current: str | None) -> dict | None:
    q = question.lower()
    if not any(w in q for w in _NAV_WORDS):
        return None
    # Full label or id first ("predictive intelligence"), then the distinctive first word
    # ("predictive") — never the shared second word ("intelligence").
    for d in DASHBOARDS:
        if d["id"] != current and (d["label"].lower() in q or d["id"] in q):
            return d
    for d in DASHBOARDS:
        if d["id"] != current and d["label"].lower().split()[0] in q:
            return d
    return None


async def _answer_mock(question: str, dashboard_id: str | None, snapshot: str | None,
                       view: str | None = None) -> AsyncIterator[dict]:
    yield {"type": "start", "model": "mock"}
    d = get_dashboard(dashboard_id)
    target = _mock_target(question, dashboard_id)
    if target:
        yield {"type": "activity", "name": "open_dashboard"}
        await asyncio.sleep(0.4)
        text, _ = run_tool("open_dashboard", {"dashboard": target["id"]})
        yield {"type": "tool", "name": "open_dashboard", "input": {"dashboard": target["id"]},
               "result": text, "isError": False}
        d = target
    snap = _clean_text(snapshot or "", 400) if snapshot else ""
    answer = (
        f"**Mock mode** — no `ANTHROPIC_API_KEY` is configured, so this is a canned reply.\n\n"
        f"You asked: _{question.strip()}_\n\n"
        + (f"{'Context dashboard' if view == 'assistant' and not target else 'You are now looking at the'} **{d['label']}** dashboard — {d['description']}\n\n" if d else "")
        + (f"On-screen snapshot I would reason over:\n\n> {snap}\n\n" if snap else "")
        + "Set `ANTHROPIC_API_KEY` in the environment (and remove `ASSISTANT_MOCK`) to get real answers "
          "grounded in all four dashboards."
    )
    for chunk in re.split(r"(?<=\s)", answer):
        if chunk:
            yield {"type": "text", "delta": chunk}
            await asyncio.sleep(0.012)
    yield {"type": "done", "model": "mock", "usage": {"input_tokens": 0, "output_tokens": 0}, "stop_reason": "end_turn"}


# ─── Entry point ────────────────────────────────────────────────────

async def answer(*, history: list[dict], question: str, dashboard_id: str | None,
                 snapshot: str | None, attachments: list[dict] | None,
                 view: str | None = None) -> AsyncIterator[dict]:
    if is_mock():
        async for ev in _answer_mock(question, dashboard_id, snapshot, view):
            yield ev
        return
    if not has_api_key():
        yield {"type": "error", "message": "The assistant is not configured: set ANTHROPIC_API_KEY "
                                            "(or ASSISTANT_MOCK=true for a demo without the API)."}
        return
    messages = build_messages(history, question, dashboard_id=dashboard_id,
                              snapshot=snapshot, attachments=attachments, view=view)
    async for ev in _answer_live(messages):
        yield ev
