import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import ConversationList from '../components/ConversationList';
import { StatusPill } from '../components/chat/AssistantMark';
import MessageList from '../components/chat/MessageList';
import Composer from '../components/chat/Composer';
import { DASHBOARDS, dashboardById } from '../dashboards';

/** Dropdown to pick which dashboard a question is about (like the RAM UI's agent selector). */
function ContextSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = dashboardById(value);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,92,255,0.35)', color: 'var(--text)', minWidth: 210 }}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
        <span className="flex-1 text-left truncate">{selected?.label || 'Choose a dashboard'}</span>
        <span className="text-[8.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
          style={{ background: 'rgba(124,92,255,0.18)', color: 'var(--accent-hi)' }}>
          context
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hi)" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50 w-[300px] animate-fade-up popover">
            <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>Ask about</p>
            {DASHBOARDS.map(d => {
              const isActive = d.id === value;
              return (
                <button key={d.id} onClick={() => { onChange(d.id); setOpen(false); }}
                  className="w-full text-left px-3 py-2 transition-all hover:bg-[rgba(124,92,255,0.14)]"
                  style={isActive ? { background: 'rgba(124,92,255,0.16)', borderLeft: '3px solid var(--accent)' } : { borderLeft: '3px solid transparent' }}>
                  <p className="text-[12px] font-semibold truncate" style={{ color: isActive ? '#fff' : 'var(--text)' }}>{d.label}</p>
                  <p className="text-[10.5px] truncate" style={{ color: 'var(--text-dim)' }}>{d.description}</p>
                </button>
              );
            })}
            <div className="pb-1.5" />
          </div>
        </>
      )}
    </div>
  );
}

/** The Assistant tab: full-page chat with the "Recent conversations" column (the Roads RAM layout). */
export default function ChatPage({ dashboardId, getSnapshot, health }) {
  const { activeChat, send, stop, loading, liveSteps } = useChat();
  const [ctx, setCtx] = useState(dashboardId);
  const [historyOpen, setHistoryOpen] = useState(false);   // narrow screens: the column becomes a drawer
  useEffect(() => { setCtx(dashboardId); }, [dashboardId]);
  const dashboard = dashboardById(ctx);
  const messages = activeChat?.messages || [];

  const handleSend = (text, attachment) => send(text, {
    dashboard: ctx,
    snapshot: getSnapshot(ctx),
    attachments: attachment ? [{ name: attachment.name, text: attachment.text }] : null,
    view: 'assistant',
  });

  return (
    <div className="chat-page">
      <aside className="chat-sidebar glass-card">
        <ConversationList variant="sidebar" />
      </aside>

      <section className="chat-main glass-card">
        <svg className="chat-watermark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="22" stroke="#fff" strokeWidth="3"/>
          <circle cx="32" cy="32" r="13" stroke="#fff" strokeWidth="3"/>
          <circle cx="32" cy="32" r="5" fill="#fff"/>
        </svg>

        <div className="flex items-center justify-between gap-3 px-5 py-3 relative z-[5]" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button className="icon-btn only-narrow" title="Recent conversations" onClick={() => setHistoryOpen(o => !o)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
              </svg>
            </button>
            <span className="w-[3px] h-4 rounded shrink-0" style={{ background: 'var(--accent-grad)' }} />
            <span className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{activeChat?.title || 'New conversation'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusPill health={health} />
            <ContextSelector value={ctx} onChange={setCtx} />
          </div>
        </div>

        {historyOpen && <ConversationList variant="drawer" onClose={() => setHistoryOpen(false)} />}

        <MessageList messages={messages} liveSteps={liveSteps} />

        <Composer autoFocus
          onSend={handleSend} onStop={stop} loading={loading}
          placeholder={`Ask about ${dashboard?.label || 'the dashboards'}…`}
          suggestions={messages.length <= 1 && !loading ? dashboard?.suggestions : null}
          suggestionsLabel={dashboard?.label} />
      </section>
    </div>
  );
}
