import { NAV_TABS, ASSISTANT_TAB } from '../dashboards';

/** Top navigation: brand, the four dashboards in order, then the Assistant tab. */
export default function NavBar({ active, onSelect }) {
  return (
    <header className="nav">
      <div className="nav-brand">
        <div className="nav-icon">🛰️</div>
        <div className="min-w-0">
          <div className="nav-title">Crisis Management</div>
          <div className="nav-sub">Incident command · Dubai</div>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Pages">
        {NAV_TABS.map(t => (
          <button key={t.id} onClick={() => onSelect(t.id)}
            className={`nav-tab ${t.id === active ? 'active' : ''} ${t.id === ASSISTANT_TAB.id ? 'nav-tab-assistant' : ''}`}
            aria-current={t.id === active ? 'page' : undefined}>
            {t.id === ASSISTANT_TAB.id && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            )}
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
