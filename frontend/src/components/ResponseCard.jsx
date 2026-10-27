import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dashboardById } from '../dashboards';

const markdownComponents = {
  p: ({node, ...props}) => <p className="my-1 leading-[1.75]" {...props} />,
  strong: ({node, ...props}) => <strong style={{ color: 'var(--accent-hi)', fontWeight: 700 }} {...props} />,
  em: ({node, ...props}) => <em style={{ color: 'var(--text-md)' }} {...props} />,
  a: ({node, ...props}) => <a target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hi)', textDecoration: 'underline' }} {...props} />,
  ul: ({node, ...props}) => <ul className="my-1.5 space-y-0.5 pl-5 list-disc" {...props} />,
  ol: ({node, ...props}) => <ol className="my-1.5 space-y-0.5 pl-5 list-decimal" {...props} />,
  li: ({node, ...props}) => <li className="leading-[1.7]" {...props} />,
  h1: ({node, ...props}) => <h1 className="text-[15px] font-bold my-2" style={{ color: 'var(--accent-hi)' }} {...props} />,
  h2: ({node, ...props}) => <h2 className="text-[14px] font-bold my-2" style={{ color: 'var(--accent-hi)' }} {...props} />,
  h3: ({node, ...props}) => <h3 className="text-[13px] font-semibold my-1.5" style={{ color: 'var(--text)' }} {...props} />,
  table: ({node, ...props}) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-[12px] w-full" style={{ border: '1px solid rgba(124,92,255,0.25)' }} {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead style={{ background: 'rgba(124,92,255,0.12)' }} {...props} />,
  th: ({node, ...props}) => <th className="px-2 py-1.5 text-left font-semibold" style={{ border: '1px solid rgba(124,92,255,0.22)', color: 'var(--accent-hi)' }} {...props} />,
  td: ({node, ...props}) => <td className="px-2 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.10)' }} {...props} />,
  code: ({node, inline, className, ...props}) => inline || !className
    ? <code className="px-1 py-0.5 rounded text-[12px]" style={{ background: 'rgba(124,92,255,0.14)', color: 'var(--accent-hi)' }} {...props} />
    : <code className="block p-2 rounded my-1 text-[12px] overflow-x-auto" style={{ background: 'rgba(0,0,0,0.35)' }} {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="pl-3 my-2 italic" style={{ borderLeft: '2px solid var(--accent)', color: 'var(--text-md)' }} {...props} />,
  hr: ({node, ...props}) => <hr className="my-2" style={{ borderColor: 'var(--hairline)' }} {...props} />,
};

/** Typing indicator with the live activity steps (tool calls) recorded so far. */
export function Thinking({ steps = [] }) {
  return (
    <div className="min-w-[160px]">
      {steps.length > 0 && (
        <div className="mb-2.5 space-y-1.5">
          {steps.slice(-6).map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2 text-[11.5px] animate-fade-up"
              style={{ color: i === arr.length - 1 ? 'var(--accent-hi)' : 'var(--text-dim)' }}>
              <span className="text-[10px] w-4 text-center shrink-0">{s.icon}</span>
              <span className="truncate font-medium">{s.label}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" className="shrink-0 ml-auto">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(j => (
            <span key={j} className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent-hi)', opacity: 0.3, animation: `pop 1.4s ease-in-out infinite ${j * 0.15}s` }} />
          ))}
        </div>
        {steps.length > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {steps.length} step{steps.length !== 1 ? 's' : ''} so far
          </span>
        )}
      </div>
    </div>
  );
}

/** Human wording for a tool call the assistant made. */
function actionLabel(call) {
  if (call.name === 'open_dashboard') {
    const d = dashboardById(call.input?.dashboard);
    return call.isError ? 'Could not open that dashboard' : `Opened ${d ? d.label : 'a dashboard'}`;
  }
  return call.name;
}

/** Renders one assistant answer: streamed markdown plus the actions it took. */
export default function ResponseCard({ data, liveSteps }) {
  if (!data) return null;
  const waiting = data.streaming && !data.answer && !data.error;
  const actions = data.toolCalls || [];

  return (
    <div className="animate-slide-up space-y-2 max-w-full">
      <div className="msg-bot-bubble px-4 py-3">
        {waiting ? (
          <Thinking steps={liveSteps} />
        ) : (
          <div className="text-[13px]" style={{ color: 'var(--text)' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {data.answer || (data.error ? '' : '_(empty answer)_')}
            </ReactMarkdown>
            {data.streaming && <span className="stream-caret" />}
          </div>
        )}
        {data.error && (
          <div className="mt-2 px-3 py-2 rounded-lg text-[12px]"
            style={{ background: 'var(--red-bg)', border: '1px solid rgba(255,71,87,0.30)', color: '#ff8a94' }}>
            {data.error}
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {actions.map((call, i) => (
            <span key={i} className="action-chip">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
              {actionLabel(call)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
