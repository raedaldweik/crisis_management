"""API routes the frontend calls."""
from __future__ import annotations

import io
import json

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import assistant
from services.dashboards import DASHBOARDS

router = APIRouter(prefix="/api", tags=["assistant"])

MAX_ATTACH_CHARS = assistant.MAX_ATTACH_CHARS
MAX_HISTORY_TURNS = 40


class Message(BaseModel):
    role: str
    content: str


class Attachment(BaseModel):
    name: str
    text: str


class ChatRequest(BaseModel):
    messages: list[Message]                 # full transcript, last one is the new user question
    dashboard: str | None = None            # active dashboard id
    snapshot: str | None = None             # innerText of the active dashboard
    attachments: list[Attachment] | None = None


@router.get("/health")
async def health():
    return {**assistant.status(), "dashboards": DASHBOARDS}


@router.get("/dashboards")
async def dashboards():
    return DASHBOARDS


@router.post("/chat")
async def chat(body: ChatRequest):
    """Stream the assistant's answer as Server-Sent Events (one JSON object per `data:` line)."""
    if not body.messages or body.messages[-1].role != "user" or not body.messages[-1].content.strip():
        raise HTTPException(status_code=400, detail="The last message must be a non-empty user message.")
    question = body.messages[-1].content
    history = [m.model_dump() for m in body.messages[:-1]][-MAX_HISTORY_TURNS:]
    attachments = [a.model_dump() for a in body.attachments] if body.attachments else None

    async def gen():
        try:
            async for ev in assistant.answer(history=history, question=question,
                                             dashboard_id=body.dashboard, snapshot=body.snapshot,
                                             attachments=attachments):
                yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
        except Exception as e:  # last-resort guard so the stream always terminates cleanly
            yield f"data: {json.dumps({'type': 'error', 'message': f'Assistant failure: {e}'})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ─── Attachments (ad-hoc documents, inlined into the question) ─────
@router.post("/extract")
async def extract(file: UploadFile = File(...)):
    """Extract plain text from an uploaded document so it can be sent with a question."""
    data = await file.read()
    name = file.filename or "attachment"
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

    if ext == "pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")
        if not text.strip():
            raise HTTPException(status_code=422, detail=(
                "This PDF contains no extractable text (it looks scanned), so the assistant can't read it."))
    elif ext == "docx":
        try:
            from docx import Document
        except ImportError:
            raise HTTPException(status_code=415, detail="DOCX support requires python-docx.")
        try:
            doc = Document(io.BytesIO(data))
            text = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not read DOCX: {e}")
    elif ext in ("txt", "md", "csv", "json", "log", "xml", "html", "yaml", "yml", "sql", "py"):
        text = data.decode("utf-8", errors="replace")
    elif ext in ("png", "jpg", "jpeg", "gif", "bmp", "webp", "tif", "tiff"):
        raise HTTPException(status_code=415, detail="Images aren't supported as attachments — export the content as a PDF or text file.")
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: .{ext or '?'}")

    truncated = len(text) > MAX_ATTACH_CHARS
    return {"name": name, "text": text[:MAX_ATTACH_CHARS], "chars": len(text), "truncated": truncated}
