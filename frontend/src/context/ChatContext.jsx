import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ChatContext = createContext();

export const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  type: 'text',
  content: "Hi — I'm the Crisis Management assistant. Ask me about anything on the four dashboards: the incidents on the map, the #67582749 review, the 24-hour forecast, or staffing and repositioning. I can also open a dashboard for you.",
};

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const NEW_TITLE = 'New conversation';
const STORAGE_KEY = 'cm_chats_v1';

const freshChat = () => ({ id: newId(), title: NEW_TITLE, messages: [WELCOME], createdAt: Date.now() });

// Conversations live in this browser (localStorage). A reload mid-stream leaves an
// unfinished answer behind — mark it so it is not shown as "still typing".
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || !Array.isArray(raw.chats) || raw.chats.length === 0) return null;
    const chats = raw.chats.map(c => ({
      ...c,
      messages: (c.messages || []).map(m => {
        if (m.type === 'structured' && m.data?.streaming) {
          return { ...m, data: { ...m.data, streaming: false, error: m.data.answer ? undefined : 'Interrupted before an answer arrived.' } };
        }
        return m;
      }),
    }));
    return { chats, activeChatId: raw.activeChatId };
  } catch {
    return null;
  }
}

export function ChatProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = load();
    if (saved) {
      const active = saved.chats.some(c => c.id === saved.activeChatId) ? saved.activeChatId : saved.chats[0].id;
      return { chats: saved.chats, activeChatId: active };
    }
    const c = freshChat();
    return { chats: [c], activeChatId: c.id };
  });
  const { chats, activeChatId } = state;
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Persist (debounced — streaming updates arrive token by token)
  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const setActiveChatId = useCallback((id) => setState(s => ({ ...s, activeChatId: id })), []);

  const createNewChat = useCallback(() => {
    const c = freshChat();
    setState(s => ({ chats: [c, ...s.chats], activeChatId: c.id }));
    return c.id;
  }, []);

  const addMessage = useCallback((chatId, msg) => {
    const withId = msg.id ? msg : { ...msg, id: newId() };
    setState(s => ({
      ...s,
      chats: s.chats.map(c => {
        if (c.id !== chatId) return c;
        const updated = { ...c, messages: [...c.messages, withId], updatedAt: Date.now() };
        if (withId.role === 'user' && c.title === NEW_TITLE)
          updated.title = withId.content.slice(0, 40) + (withId.content.length > 40 ? '…' : '');
        return updated;
      }),
    }));
    return withId.id;
  }, []);

  // Update one message in place (used while an answer streams in)
  const updateMessage = useCallback((chatId, messageId, updater) => {
    setState(s => ({
      ...s,
      chats: s.chats.map(c => c.id !== chatId ? c : {
        ...c,
        messages: c.messages.map(m => m.id === messageId ? updater(m) : m),
      }),
    }));
  }, []);

  const renameChat = useCallback((chatId, newTitle) => {
    setState(s => ({ ...s, chats: s.chats.map(c => c.id === chatId ? { ...c, title: newTitle } : c) }));
  }, []);

  const deleteChat = useCallback((chatId) => {
    setState(s => {
      const filtered = s.chats.filter(c => c.id !== chatId);
      const next = filtered.length === 0 ? [freshChat()] : filtered;
      return { chats: next, activeChatId: next.some(c => c.id === s.activeChatId) ? s.activeChatId : next[0].id };
    });
  }, []);

  return (
    <ChatContext.Provider value={{ chats, activeChat, activeChatId, setActiveChatId, createNewChat, addMessage, updateMessage, renameChat, deleteChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
