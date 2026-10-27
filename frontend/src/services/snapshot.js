/**
 * Plain-text snapshot of what a dashboard iframe currently shows — KPIs, the selected
 * incident's panel, table rows, alert text… — so the assistant can answer "what am I
 * looking at" questions about live UI state. The dashboards are same-origin, so the
 * iframe document is readable.
 */
export function snapshotFrame(iframe, { limit = 6000 } = {}) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc?.body) return null;
    const parts = [];
    if (doc.title) parts.push(`Page title: ${doc.title}`);
    for (const sel of doc.querySelectorAll('select')) {
      const opt = sel.options[sel.selectedIndex];
      if (opt) parts.push(`Dropdown ${sel.id || sel.name || 'select'} = "${opt.text}"`);
    }
    parts.push(doc.body.innerText || '');
    let out = parts.join('\n')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .trim();
    if (out.length > limit) out = out.slice(0, limit) + ' …[truncated]';
    return out;
  } catch {
    return null;
  }
}
