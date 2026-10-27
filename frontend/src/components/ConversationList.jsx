import { useState } from 'react';
import { useChat } from '../context/ChatContext';

/**
 * "Recent conversations": switch, rename, delete, create.
 * variant="sidebar" renders as the Assistant page's left column; variant="drawer" as an
 * overlay inside the floating widget (with a close button).
 */
export default function ConversationList({ variant = 'sidebar', onClose }) {
  const { chats, activeChatId, setActiveChatId, renameChat, deleteChat, createNewChat } = useChat();
  const [chatMenu, setChatMenu] = useState(null);
  const [renamingChat, setRenamingChat] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (chat) => { setRenamingChat(chat.id); setRenameValue(chat.title); setChatMenu(null); };
  const finishRename = (id) => { if (renameValue.trim()) renameChat(id, renameValue.trim()); setRenamingChat(null); };
  const isDrawer = variant === 'drawer';

  return (
    <div className={isDrawer ? 'history-drawer animate-fade-up' : 'flex flex-col h-full'}>
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--hairline)' }}>
        <p className="panel-title">Recent conversations</p>
        {isDrawer && (
          <button onClick={onClose} className="icon-btn" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.map(chat => {
          const isRenaming = renamingChat === chat.id;
          const menuOpen = chatMenu === chat.id;
          const isActive = chat.id === activeChatId;
          return (
            <div key={chat.id} className="relative group">
              {isRenaming ? (
                <div className="px-2 py-1.5">
                  <input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => finishRename(chat.id)} onKeyDown={e => e.key === 'Enter' && finishRename(chat.id)} autoFocus
                    className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--accent)', color: 'var(--text)' }} />
                </div>
              ) : (
                <div className="flex items-center">
                  <button onClick={() => { setActiveChatId(chat.id); if (isDrawer) onClose?.(); }}
                    className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-left transition-all"
                    style={isActive
                      ? { color: '#fff', fontWeight: 600, background: 'rgba(124,92,255,0.16)', border: '1px solid rgba(124,92,255,0.35)', borderLeft: '3px solid var(--accent)' }
                      : { color: 'var(--text-md)', border: '1px solid transparent' }
                    }>
                    <span className="text-sm">💬</span>
                    <span className="truncate flex-1 chat-title">{chat.title}</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); setChatMenu(menuOpen ? null : chat.id); }}
                    className="icon-btn opacity-0 group-hover:opacity-100 shrink-0 ml-0.5" title="More">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              )}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setChatMenu(null)} />
                  <div className="absolute right-0 top-full mt-0.5 rounded-xl overflow-hidden z-50 min-w-[130px] animate-fade-up popover">
                    <button onClick={() => startRename(chat)} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-[rgba(124,92,255,0.14)]" style={{ color: 'var(--text-md)' }}>
                      Rename
                    </button>
                    <button onClick={() => {
                      setChatMenu(null);
                      if (chat.messages.length <= 1 || window.confirm('Delete this conversation?')) deleteChat(chat.id);
                    }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-[var(--red-bg)]" style={{ color: '#ff8a94' }}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3" style={{ borderTop: '1px solid var(--hairline)' }}>
        <button onClick={() => { createNewChat(); if (isDrawer) onClose?.(); }}
          className="w-full py-2.5 rounded-lg text-xs font-bold transition-all hover:bg-[rgba(124,92,255,0.12)]"
          style={{ border: '2px dashed rgba(124,92,255,0.45)', color: 'var(--accent-hi)', background: 'rgba(124,92,255,0.05)' }}>
          + New conversation
        </button>
      </div>
    </div>
  );
}
