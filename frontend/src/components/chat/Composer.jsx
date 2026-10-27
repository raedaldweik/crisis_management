import { useState, useRef, useEffect } from 'react';
import VoiceInput from '../VoiceInput';
import { extractAttachment } from '../../services/api';

const Clip = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
  </svg>
);

/**
 * Suggestion chips + attachment chip + the input bar (attach, voice, text, send/stop).
 * onSend(text, attachment|null) — attachment is { name, text, chars, truncated }.
 */
export default function Composer({ onSend, onStop, loading, placeholder, suggestions, suggestionsLabel, compact = false, autoFocus = false }) {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  useEffect(() => { if (!loading) inputRef.current?.focus(); }, [loading]);

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

  const submit = (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');
    const a = attachment;
    setAttachment(null);
    setAttachError(null);
    onSend(q, a);
  };

  const pad = compact ? 'px-3' : 'px-5';

  return (
    <>
      {suggestions && suggestions.length > 0 && (
        <div className={`${pad} pb-1 relative z-[1] animate-fade-up`}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-faint)' }}>
            Try asking{suggestionsLabel ? ` · ${suggestionsLabel}` : ''}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button key={s} className="suggestion-chip" onClick={() => submit(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {(attachment || attaching || attachError) && (
        <div className={`${pad} pt-1 relative z-[1] animate-fade-up`}>
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold max-w-full"
              style={{ background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.30)', color: 'var(--accent-hi)' }}>
              <Clip size={12} />
              <span className="truncate">{attachment.name}</span>
              <span className="font-normal whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                {attachment.truncated ? `first ${Math.round(attachment.text.length / 1000)}k chars` : `${(attachment.chars / 1000).toFixed(1)}k chars`}
                {compact ? '' : ' · sent with your next question'}
              </span>
              <button onClick={() => setAttachment(null)} className="font-bold hover:opacity-70" style={{ color: 'var(--text-dim)' }}>✕</button>
            </div>
          )}
        </div>
      )}

      <div className={`${pad} pb-4 pt-2 relative z-[1]`}>
        <div className="input-bar">
          <input ref={fileRef} type="file" className="hidden" onChange={pickFile}
            accept=".pdf,.docx,.txt,.md,.csv,.json,.log,.xml,.html,.yaml,.yml,.sql,.py" />
          <button onClick={() => fileRef.current?.click()} disabled={attaching || loading}
            title="Attach a document (PDF, DOCX, TXT, CSV…) — its text is sent with your question"
            className="icon-btn disabled:opacity-40" style={{ color: attachment ? 'var(--accent-hi)' : undefined }}>
            <Clip />
          </button>

          <VoiceInput onTranscript={text => submit(text)} disabled={loading} />

          <textarea ref={inputRef} rows="1" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-[13px] py-2 px-2 resize-none leading-relaxed min-w-0"
            style={{ color: 'var(--text)' }} />

          {loading ? (
            <button onClick={onStop} title="Stop"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform"
              style={{ background: 'rgba(255,71,87,0.85)', boxShadow: '0 3px 12px rgba(255,71,87,0.30)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
            </button>
          ) : (
            <button onClick={() => submit()} title="Send"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform"
              style={{ background: 'var(--accent-grad)', boxShadow: '0 3px 12px rgba(124,92,255,0.40)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
