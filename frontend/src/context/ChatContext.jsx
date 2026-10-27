import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { streamChat } from '../services/api';

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

function initialState() {
  const saved = load();
  if (saved) {
    const active = saved.chats.some(c => c.id === saved.activeChatId) ? saved.activeChatId : saved.chats[0].id;
    return { chats: saved.chats, activeChatId: active };
  }
  const c = freshChat();
  return { chats: [c], activeChatId: c.id };
}

/**
 * Conversation state + the streaming send loop, shared by the Assistant tab and the
 * floating chat widget so a reply keeps streaming whichever view is open.
 * `onNavigate(dashboardId)` is called when the assistant uses its open_dashboard tool.
 */
export function ChatProvider({ children, onNavigate }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const navRef = useRef(onNavigate);
  navRef.current = onNavigate;

  const [loading, setLoading] = useState(false);
  const [liveSteps, setLiveSteps] = useState([]);
  const abortRef = useRef(null);

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

  /**
   * Ask the assistant. ctx = { dashboard, snapshot, attachments, view } — which dashboard
   * the question is about, a text snapshot of it, optional [{name, text}], and whether the
   * user is on a dashboard ('dashboard') or on the Assistant tab ('assistant').
   */
  const send = useCallback(async (question, ctx = {}) => {
    const q = (question || '').trim();
    if (!q || abortRef.current) return;
    const chatId = stateRef.current.activeChatId;
    const chat = stateRef.current.chats.find(c => c.id === chatId);
    const history = (chat?.messages || [])
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.type === 'structured' ? (m.data?.answer || '') : (m.content || '') }))
      .filter(m => m.content.trim());

    const attachments = ctx.attachments && ctx.attachments.length ? ctx.attachments : null;
    addMessage(chatId, { role: 'user', type: 'text', content: q, attachmentName: attachments?.[0]?.name });
    const answerId = newId();
    addMessage(chatId, {
      id: answerId, role: 'assistant', type: 'structured', query: q,
      data: { answer: '', toolCalls: [], streaming: true, dashboard: ctx.dashboard },
    });
    const patch = (fn) => updateMessage(chatId, answerId, m => ({ ...m, data: fn(m.data) }));

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setLiveSteps([]);
    let finished = false;
    try {
      await streamChat({
        messages: [...history, { role: 'user', content: q }],
        dashboard: ctx.dashboard || null,
        snapshot: ctx.snapshot || null,
        attachments,
        view: ctx.view || 'dashboard',
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
              setLiveSteps(s => [...s, { key: `${ev.name}-${s.length}`, icon: '↗', label: ev.name === 'open_dashboard' ? 'Opening a dashboard…' : 'Working…' }]);
              break;
            case 'tool':
              patch(d => ({ ...d, toolCalls: [...(d.toolCalls || []), { name: ev.name, input: ev.input, output: ev.result, isError: ev.isError }] }));
              if (ev.name === 'open_dashboard' && ev.input?.dashboard && !ev.isError) navRef.current?.(ev.input.dashboard);
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
  }, [addMessage, updateMessage]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return (
    <ChatContext.Provider value={{ chats, activeChat, activeChatId, setActiveChatId, createNewChat, renameChat, deleteChat, send, stop, loading, liveSteps }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
