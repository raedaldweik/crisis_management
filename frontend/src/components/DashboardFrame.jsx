import { useEffect, useState } from 'react';
import { DASHBOARDS } from '../dashboards';

/**
 * Hosts the dashboards as same-origin iframes. A dashboard is mounted the first time it is
 * opened and then kept alive (hidden, not unmounted) so its state — map position, the
 * selected incident, heatmap selection — survives tab switches, and the assistant can
 * snapshot it at any time.
 */
export default function DashboardFrame({ active, framesRef }) {
  const [mounted, setMounted] = useState(() => new Set([active]));
  const [loaded, setLoaded] = useState(() => new Set());

  useEffect(() => {
    setMounted(prev => prev.has(active) ? prev : new Set(prev).add(active));
  }, [active]);

  return (
    <div className="frame-stage">
      {DASHBOARDS.filter(d => mounted.has(d.id)).map(d => (
        <iframe
          key={d.id}
          title={d.label}
          src={`/dashboards/${d.file}`}
          className={`frame ${d.id === active ? 'frame-active' : ''}`}
          ref={el => { if (el) framesRef.current[d.id] = el; else delete framesRef.current[d.id]; }}
          onLoad={() => setLoaded(prev => new Set(prev).add(d.id))}
        />
      ))}
      {!loaded.has(active) && (
        <div className="frame-loading">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-hi)' }} />
          Loading dashboard…
        </div>
      )}
    </div>
  );
}
