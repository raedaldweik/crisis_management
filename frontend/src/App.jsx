import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatProvider } from './context/ChatContext';
import NavBar from './components/NavBar';
import DashboardFrame from './components/DashboardFrame';
import ChatPanel from './components/ChatPanel';
import { DASHBOARDS, DEFAULT_DASHBOARD, dashboardById } from './dashboards';
import { getHealth } from './services/api';
import { snapshotFrame } from './services/snapshot';

const CHAT_KEY = 'cm_chat_open';

// #/unified, #/accident, #/predictive, #/response — shareable, survives reload
const idFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  return dashboardById(id) ? id : DEFAULT_DASHBOARD;
};

export default function App() {
  const [active, setActive] = useState(idFromHash);
  const [chatOpen, setChatOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_KEY);
      if (saved != null) return saved === '1';
    } catch { /* private mode */ }
    return window.innerWidth >= 1100;
  });
  const [health, setHealth] = useState(null);
  const framesRef = useRef({});

  useEffect(() => {
    const onHash = () => setActive(idFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = `${dashboardById(active)?.label || 'Dashboard'} · Crisis Management`;
    if (window.location.hash !== `#/${active}`) window.history.replaceState(null, '', `#/${active}`);
  }, [active]);

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, chatOpen ? '1' : '0'); } catch { /* ignore */ }
  }, [chatOpen]);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: 'down' }));
  }, []);

  const navigate = useCallback((id) => {
    if (dashboardById(id)) {
      setActive(id);
      window.location.hash = `#/${id}`;
    }
  }, []);

  const getSnapshot = useCallback(() => snapshotFrame(framesRef.current[active]), [active]);

  return (
    <ChatProvider>
      <div className="app-shell">
        <NavBar active={active} onSelect={navigate} chatOpen={chatOpen} onToggleChat={() => setChatOpen(o => !o)} />
        <div className="workspace">
          <DashboardFrame active={active} framesRef={framesRef} />
          {chatOpen && (
            <ChatPanel activeId={active} getSnapshot={getSnapshot} onNavigate={navigate}
              onClose={() => setChatOpen(false)} health={health} />
          )}
        </div>
      </div>
    </ChatProvider>
  );
}

export { DASHBOARDS };
