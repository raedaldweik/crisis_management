/** The assistant's avatar: a radar-style mark in the dashboards' purple. */
export default function AssistantMark({ size = 32 }) {
  return (
    <div className="shrink-0 rounded-lg flex items-center justify-center"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, rgba(124,92,255,.55), rgba(124,92,255,.18))', border: '1px solid rgba(124,92,255,.45)' }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="22" stroke="#fff" strokeWidth="4" opacity=".45"/>
        <circle cx="32" cy="32" r="13" stroke="#fff" strokeWidth="4" opacity=".8"/>
        <circle cx="32" cy="32" r="5" fill="#ff4757"/>
      </svg>
    </div>
  );
}

/** What the connection pill shows for a /api/health result. */
export function statusText(health) {
  if (health == null) return { label: 'Connecting…', color: 'var(--amber)', pulse: true };
  if (health.status === 'down') return { label: 'Backend offline', color: 'var(--red)', pulse: true };
  if (health.mode === 'mock') return { label: 'Mock mode', color: 'var(--amber)', pulse: false };
  if (health.status === 'unconfigured') return { label: 'API key missing', color: 'var(--red)', pulse: true };
  return { label: `Connected · ${health.model || 'Claude'}`, color: 'var(--green)', pulse: false };
}

export function StatusPill({ health }) {
  const s = statusText(health);
  return (
    <span className="status-pill">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.pulse ? 'animate-pulse' : ''}`} style={{ background: s.color }} />
      <span className="truncate">{s.label}</span>
    </span>
  );
}
