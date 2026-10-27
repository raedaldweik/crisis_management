import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatProvider } from './context/ChatContext';
import NavBar from './components/NavBar';
import DashboardFrame from './components/DashboardFrame';
import ChatWidget from './components/ChatWidget';
import ChatPage from './pages/ChatPage';
import { NAV_TABS, ASSISTANT_TAB, DEFAULT_DASHBOARD, dashboardById, isTab } from './dashboards';
import { getHealth } from './services/api';
import { snapshotFrame } from './services/snapshot';

// #/unified, #/accident, #/predictive, #/response, #/assistant — shareable, survives reload
const idFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  return isTab(id) ? id : DEFAULT_DASHBOARD;
};

export default function App() {
  const [active, setActive] = useState(idFromHash);
  const activeRef = useRef(active);
  activeRef.current = active;
  // The dashboard the assistant reasons about while the Assistant tab is open
  const [lastDashboard, setLastDashboard] = useState(() => dashboardById(idFromHash()) ? idFromHash() : DEFAULT_DASHBOARD);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const framesRef = useRef({});

  useEffect(() => {
    const onHash = () => setActive(idFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (dashboardById(active)) setLastDashboard(active);
    const tab = NAV_TABS.find(t => t.id === active);
    document.title = `${tab?.label || 'Dashboard'} · Crisis Management`;
    if (window.location.hash !== `#/${active}`) window.history.replaceState(null, '', `#/${active}`);
  }, [active]);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: 'down' }));
  }, []);

  const navigate = useCallback((id) => {
    if (isTab(id)) {
      setActive(id);
      window.location.hash = `#/${id}`;
    }
  }, []);

  // The assistant's open_dashboard tool: switch to the dashboard; if the user was on the
  // Assistant tab, pop the widget open so the answer stays in view.
  const assistantNavigate = useCallback((id) => {
    if (!dashboardById(id)) return;
    if (activeRef.current === ASSISTANT_TAB.id) setWidgetOpen(true);
    navigate(id);
  }, [navigate]);

  const getSnapshot = useCallback((id) => snapshotFrame(framesRef.current[id]), []);

  const onAssistantTab = active === ASSISTANT_TAB.id;
  const shownDashboard = onAssistantTab ? lastDashboard : active;

  return (
    <ChatProvider onNavigate={assistantNavigate}>
      <div className="app-shell">
        <NavBar active={active} onSelect={navigate} />
        <div className="workspace">
          <DashboardFrame active={shownDashboard} framesRef={framesRef} hidden={onAssistantTab} />
          {onAssistantTab ? (
            <ChatPage dashboardId={lastDashboard} getSnapshot={getSnapshot} health={health} />
          ) : (
            <ChatWidget open={widgetOpen} onOpen={() => setWidgetOpen(true)} onClose={() => setWidgetOpen(false)}
              onExpand={() => { setWidgetOpen(false); navigate(ASSISTANT_TAB.id); }}
              dashboardId={active} getSnapshot={getSnapshot} health={health} />
          )}
        </div>
      </div>
    </ChatProvider>
  );
}
