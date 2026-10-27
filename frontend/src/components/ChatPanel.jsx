import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat, newId } from '../context/ChatContext';
import ResponseCard from './ResponseCard';
import ConversationList from './ConversationList';
import VoiceInput from './VoiceInput';
import { streamChat, extractAttachment } from '../services/api';
import { dashboardById } from '../dashboards';

export function AssistantMark({ size = 32 }) {
  return (
    <div className="shrink-0 rounded-lg flex items-center justify-center"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, rgba(124,92,255,.55), rgba(124,92,255,.18))', border: '1px solid rgba(124,92,255,.45)' }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="22" stroke="#fff" strokeWidth="4" opacity=".45"/>
        <circle cx="32" cy="32" r="13" stroke="#fff" strokeWidth="4" opacity=".8"/>
        <circle cx="32" cy="32" r="5" fill="#ff4757"/>
      </svg>
    </div>
  );
}

function statusText(health) {
  if (health == null) return { label: 'Connecting…', color: 'var(--amber)', pulse: true };
  if (health.status === 'down') return { label: 'Backend offline', color: 'var(--red)', pulse: true };
  if (health.mode === 'mock') return { label: 'Mock mode', color: 'var(--amber)', pulse: false };
  if (health.status === 'unconfigured') return { label: 'API key missing', color: 'var(--red)', pulse: true };
  return { label: `Connected · ${health.model || 'Claude'}`, color: 'var(--green)', pulse: false };
}

/** The assistant panel — the Roads RAM chat UI, re-skinned for the dashboards. */
export default function ChatPanel({ activeId, getSnapshot, onNavigate, onClose, health }) {
  const { activeChat, activeChatId, addMessage, updateMessage, createNewChat } = useChat();
  const messages = activeChat?.messages || [];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveSteps, setLiveSteps] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Ad-hoc attachment: text is extracted server-side and sent with the next question
  const [attachment, setAttachment] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState(null);

  const inputRef = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);

  const dashboard = dashboardById(activeId);
  const status = statusText(health);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachError(null);
    setAttaching(true);
    try { setAttachment(await extractAttachment(file)); }
    catch (err) { setAttachError(err.message); }
    setAttaching(false);
  };

  const send = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    const attached = attachment;
    setAttachment(null);
    setAttachError(null);

    // History = what is in the transcript before this question (welcome message excluded)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.type === 'structured' ? (m.data?.answer || '') : (m.content || '') }))
      .filter(m => m.content.trim());

    addMessage(activeChatId, { role: 'user', type: 'text', content: q, attachmentName: attached?.name });
    const answerId = newId();
    addMessage(activeChatId, {
      id: answerId, role: 'assistant', type: 'structured', query: q,
      data: { answer: '', toolCalls: [], streaming: true, dashboard: activeId },
    });
    const patch = (fn) => updateMessage(activeChatId, answerId, m => ({ ...m, data: fn(m.data) }));

    setLoading(true);
    setLiveSteps([]);
    const controller = new AbortController();
    abortRef.current = controller;
    let finished = false;
    try {
      await streamChat({
        messages: [...history, { role: 'user', content: q }],
        dashboard: activeId,
        snapshot: getSnapshot?.(),
        attachments: attached ? [{ name: attached.name, text: attached.text }] : null,
      }, {
        signal: controller.signal,
        onEvent: (ev) => {
          switch (ev.type) {
            case 'start':
              patch(d => ({ ...d, model: ev.model }));
              break;
            case 'text':
              patch(d => ({ ...d, answer: d.answer + ev.delta }));
              break;
            case 'activity':
              setLiveSteps(s => [...s, { key: `${ev.name}-${s.length}`, icon: '🛠', label: ev.name }]);
              break;
            case 'tool':
              patch(d => ({ ...d, toolCalls: [...(d.toolCalls || []), { name: ev.name, input: ev.input, output: ev.result, isError: ev.isError }] }));
              if (ev.name === 'open_dashboard' && ev.input?.dashboard && !ev.isError) onNavigate?.(ev.input.dashboard);
              break;
            case 'done':
              finished = true;
              patch(d => ({ ...d, streaming: false, usage: ev.usage, model: ev.model || d.model, stopReason: ev.stop_reason }));
              break;
            case 'error':
              finished = true;
              patch(d => ({ ...d, streaming: false, error: ev.message }));
              break;
            default:
              break;
          }
        },
      });
      if (!finished) patch(d => ({ ...d, streaming: false, error: d.answer ? undefined : 'The stream ended without an answer.' }));
    } catch (err) {
      const aborted = err?.name === 'AbortError';
      patch(d => ({ ...d, streaming: false, error: aborted ? (d.answer ? undefined : 'Stopped.') : `Error: ${err.message}` }));
    }
    abortRef.current = null;
    setLoading(false);
    setLiveSteps([]);
    inputRef.current?.focus();
  }, [input, loading, attachment, messages, activeChatId, activeId, addMessage, updateMessage, getSnapshot, onNavigate]);

  const stop = () => abortRef.current?.abort();

  const showSuggestions = messages.length <= 1 && !loading;
  const suggestions = dashboard?.suggestions || [];

  return (
    <aside className="chat-panel glass-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 relative z-[5]" style={{ borderBottom: '1px solid var(--hairline)' }}>
        <AssistantMark />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>Crisis Assistant</span>
            <span className="status-pill">
              <span className={`w-1.5 h-1.5 rounded-full ${status.pulse ? 'animate-pulse' : ''}`} style={{ background: status.color }} />
              {status.label}
            </span>
          </div>
          <div className="text-[11px] truncate" style={{ color: 'var(--text-dim)' }}>{activeChat?.title || 'New conversation'}</div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button className="icon-btn" title="Recent conversations" onClick={() => setHistoryOpen(o => !o)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
            </svg>
          </button>
          <button className="icon-btn" title="New conversation" onClick={() => { createNewChat(); setHistoryOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className="icon-btn" title="Close assistant" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {historyOpen && <ConversationList onClose={() => setHistoryOpen(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-[1]">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          return (
            <div key={msg.id || i} className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'user' ? (
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'rgba(124,92,255,0.14)', border: '1px solid rgba(124,92,255,0.35)', color: 'var(--accent-hi)' }}>
                  You
                </div>
              ) : (
                <AssistantMark />
              )}
              <div className="max-w-[85%] min-w-0">
                {msg.type === 'structured' ? (
                  <ResponseCard data={msg.data} liveSteps={isLast ? liveSteps : []} />
                ) : (
                  <div className={`px-4 py-3 text-[13px] leading-[1.75] ${msg.role === 'user' ? 'msg-user-bubble' : 'msg-bot-bubble'}`}
                    style={{ color: 'var(--text)' }}>
                    {msg.attachmentName && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md text-[11px] font-semibold w-fit"
                        style={{ background: 'rgba(124,92,255,0.14)', border: '1px solid rgba(124,92,255,0.30)', color: 'var(--accent-hi)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                        {msg.attachmentName}
                      </div>
                    )}
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Suggestions for the dashboard in view */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="px-4 pb-1 relative z-[1] animate-fade-up">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-faint)' }}>
            Try asking · {dashboard?.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment chip / status */}
      {(attachment || attaching || attachError) && (
        <div className="px-4 pt-1 relative z-[1] animate-fade-up">
          {attachError ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px]"
              style={{ background: 'var(--red-bg)', border: '1px solid rgba(255,71,87,0.30)', color: '#ff8a94' }}>
              {attachError}
              <button onClick={() => setAttachError(null)} className="font-bold hover:opacity-70">✕</button>
            </div>
          ) : attaching ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px]"
              style={{ background: 'rgba(124,92,255,0.10)', border: '1px solid rgba(124,92,255,0.25)', color: 'var(--text-dim)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-hi)' }} />
              Reading document…
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold"
              style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.30)', color: 'var(--accent-hi)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
              {attachment.name}
              <span className="font-normal" style={{ color: 'var(--text-dim)' }}>
                {attachment.truncated ? `first ${Math.round(attachment.text.length / 1000)}k chars` : `${(attachment.chars / 1000).toFixed(1)}k chars`}
                {' '}· sent with your next question
              </span>
              <button onClick={() => setAttachment(null)} className="font-bold hover:opacity-70" style={{ color: 'var(--text-dim)' }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 relative z-[1]">
        <div className="input-bar">
          <input ref={fileRef} type="file" className="hidden" onChange={pickFile}
            accept=".pdf,.docx,.txt,.md,.csv,.json,.log,.xml,.html,.yaml,.yml,.sql,.py" />
          <button onClick={() => fileRef.current?.click()} disabled={attaching || loading}
            title="Attach a document (PDF, DOCX, TXT, CSV…) — its text is sent with your question"
            className="icon-btn disabled:opacity-40" style={{ color: attachment ? 'var(--accent-hi)' : undefined }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          <VoiceInput onTranscript={text => send(text)} disabled={loading} />

          <textarea ref={inputRef} rows="1" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask about ${dashboard?.label || 'the dashboards'}…`}
            className="flex-1 bg-transparent border-none outline-none text-[13px] py-2 px-2 resize-none leading-relaxed"
            style={{ color: 'var(--text)' }} />

          {loading ? (
            <button onClick={stop} title="Stop"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform"
              style={{ background: 'rgba(255,71,87,0.85)', boxShadow: '0 3px 12px rgba(255,71,87,0.30)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
            </button>
          ) : (
            <button onClick={() => send()} title="Send"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform"
              style={{ background: 'var(--accent-grad)', boxShadow: '0 3px 12px rgba(124,92,255,0.40)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
