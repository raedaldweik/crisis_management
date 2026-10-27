// Dev uses the Vite proxy to :8000. Same-origin in prod.
const API = '';

async function req(path, opts = {}) {
  const r = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: 'Connection error' }));
    throw new Error(e.detail || `HTTP ${r.status}`);
  }
  return r.json();
}

export const getHealth = () => req('/api/health');

// Extract text from an uploaded file (multipart — no JSON headers)
export const extractAttachment = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`${API}/api/extract`, { method: 'POST', body: fd });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(e.detail || `HTTP ${r.status}`);
  }
  return r.json();
};

/**
 * POST /api/chat and consume the Server-Sent Events stream.
 * body: { messages:[{role, content}], dashboard, snapshot, attachments }
 * onEvent receives each parsed JSON event: {type:'start'|'text'|'activity'|'tool'|'done'|'error', ...}
 */
export async function streamChat(body, { signal, onEvent }) {
  const r = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok || !r.body) {
    const e = await r.json().catch(() => ({ detail: 'Connection error' }));
    throw new Error(e.detail || `HTTP ${r.status}`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  const handleChunk = (chunk) => {
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try { onEvent(JSON.parse(json)); } catch { /* ignore malformed frames */ }
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      handleChunk(buf.slice(0, idx));
      buf = buf.slice(idx + 2);
    }
  }
  buf += decoder.decode();
  if (buf.trim()) handleChunk(buf);
}
