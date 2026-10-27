import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ConversationList from './ConversationList';
import AssistantMark, { StatusPill } from './chat/AssistantMark';
import MessageList from './chat/MessageList';
import Composer from './chat/Composer';
import { dashboardById } from '../dashboards';

/**
 * The floating chat on every dashboard: a round launcher icon at the bottom-right that
 * opens a compact popup over the page (the dashboard keeps its full width).
 */
export default function ChatWidget({ open, onOpen, onClose, onExpand, dashboardId, getSnapshot, health }) {
  const { activeChat, createNewChat, send, stop, loading, liveSteps } = useChat();
  const [historyOpen, setHistoryOpen] = useState(false);
  const dashboard = dashboardById(dashboardId);
  const messages = activeChat?.messages || [];

  const handleSend = (text, attachment) => send(text, {
    dashboard: dashboardId,
    snapshot: getSnapshot(dashboardId),
    attachments: attachment ? [{ name: attachment.name, text: attachment.text }] : null,
    view: 'dashboard',
  });

  if (!open) {
    return (
      <button className="chat-launcher animate-fade-up" onClick={onOpen} title="Ask the assistant about this dashboard" aria-label="Open the assistant">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {loading && <span className="chat-launcher-dot" />}
      </button>
    );
  }

  return (
    <section className="chat-popup glass-card animate-slide-up" aria-label="Assistant">
      <div className="flex items-center gap-2.5 px-3 py-2.5 relative z-[5]" style={{ borderBottom: '1px solid var(--hairline)' }}>
        <AssistantMark size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text)' }}>Crisis Assistant</span>
            <StatusPill health={health} />
          </div>
          <div className="text-[10.5px] truncate" style={{ color: 'var(--text-dim)' }}>{activeChat?.title || 'New conversation'}</div>
        </div>
        <div className="flex items-center shrink-0">
          <button className="icon-btn" title="Recent conversations" onClick={() => setHistoryOpen(o => !o)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
            </svg>
          </button>
          <button className="icon-btn" title="New conversation" onClick={() => { createNewChat(); setHistoryOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className="icon-btn" title="Open the Assistant tab" onClick={onExpand}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
          <button className="icon-btn" title="Minimise" onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {historyOpen && <ConversationList variant="drawer" onClose={() => setHistoryOpen(false)} />}

      <MessageList messages={messages} liveSteps={liveSteps} compact />

      <Composer compact autoFocus
        onSend={handleSend} onStop={stop} loading={loading}
        placeholder={`Ask about ${dashboard?.label || 'this dashboard'}…`}
        suggestions={messages.length <= 1 && !loading ? dashboard?.suggestions : null}
        suggestionsLabel={dashboard?.label} />
    </section>
  );
}
