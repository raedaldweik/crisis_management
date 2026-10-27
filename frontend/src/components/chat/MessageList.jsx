import { useEffect, useRef } from 'react';
import ResponseCard from '../ResponseCard';
import AssistantMark from './AssistantMark';

/** The transcript: user bubbles, assistant cards, live typing indicator. */
export default function MessageList({ messages, liveSteps, compact = false }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, liveSteps]);

  return (
    <div className={`flex-1 overflow-y-auto relative z-[1] ${compact ? 'px-3 py-3 space-y-3' : 'px-6 py-5 space-y-5'}`}>
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        return (
          <div key={msg.id || i} className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'user' ? (
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(124,92,255,0.14)', border: '1px solid rgba(124,92,255,0.35)', color: 'var(--accent-hi)' }}>
                You
              </div>
            ) : (
              <AssistantMark />
            )}
            <div className={`min-w-0 ${compact ? 'max-w-[88%]' : 'max-w-[72%]'}`}>
              {msg.type === 'structured' ? (
                <ResponseCard data={msg.data} liveSteps={isLast ? liveSteps : []} />
              ) : (
                <div className={`px-4 py-3 text-[13px] leading-[1.75] ${msg.role === 'user' ? 'msg-user-bubble' : 'msg-bot-bubble'}`}
                  style={{ color: 'var(--text)' }}>
                  {msg.attachmentName && (
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md text-[11px] font-semibold w-fit"
                      style={{ background: 'rgba(124,92,255,0.14)', border: '1px solid rgba(124,92,255,0.30)', color: 'var(--accent-hi)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                      {msg.attachmentName}
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
