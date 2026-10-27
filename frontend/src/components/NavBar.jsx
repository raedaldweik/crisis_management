import { DASHBOARDS } from '../dashboards';

/** Top navigation: brand, the four dashboards in order, assistant toggle. */
export default function NavBar({ active, onSelect, chatOpen, onToggleChat }) {
  return (
    <header className="nav">
      <div className="nav-brand">
        <div className="nav-icon">🛰️</div>
        <div className="min-w-0">
          <div className="nav-title">Crisis Management</div>
          <div className="nav-sub">Incident command · Dubai</div>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Dashboards">
        {DASHBOARDS.map(d => (
          <button key={d.id} onClick={() => onSelect(d.id)}
            className={`nav-tab ${d.id === active ? 'active' : ''}`}
            aria-current={d.id === active ? 'page' : undefined}>
            {d.label}
          </button>
        ))}
      </nav>

      <div className="nav-right">
        <button onClick={onToggleChat} className={`assistant-btn ${chatOpen ? 'on' : ''}`}
          title={chatOpen ? 'Hide the assistant' : 'Open the assistant'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Assistant</span>
        </button>
      </div>
    </header>
  );
}
