import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAiResponse, saveMessage, getChatHistory,
  createSession, toMs,
} from '../services/hrService';
import { ChatMessage, GeminiMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const MicIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const ThumbUp = ({ filled }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);
const ThumbDown = ({ filled }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
);
const SparkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const PROMPTS = [
  { tag: "Leave balance", text: "How many vacation days do I have left this year?" },
  { tag: "Request time off", text: "I'd like to request sick leave for tomorrow." },
  { tag: "Performance review", text: "When is my next performance review and how should I prepare?" },
  { tag: "Remote policy", text: "What is the remote work policy?" },
  { tag: "Raise a concern", text: "I need to report a workplace concern confidentially." },
  { tag: "Benefits", text: "What benefits and perks am I entitled to?" },
];

const fmtTime = (ts: ChatMessage['timestamp']) =>
  new Date(toMs(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const fmtDateLabel = (ts: ChatMessage['timestamp']) => {
  const d = new Date(toMs(ts));
  const today = new Date();
  const diff = Math.floor(
    (new Date(today).setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / 86400000
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

function groupMessages(msgs: ChatMessage[]) {
  const groups: { label: string; msgs: ChatMessage[] }[] = [];
  msgs.forEach(m => {
    const label = fmtDateLabel(m.timestamp);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.msgs.push(m);
    else groups.push({ label, msgs: [m] });
  });
  return groups;
}

function RichText({ text }: { text: string }) {
  if (!text) return <span style={{ opacity: 0.3 }}>···</span>;
  return (
    <>
      {text.split('\n').map((line, i) => {
        const isBullet = /^[-•]\s/.test(line.trim());
        const content = isBullet ? line.trim().slice(2) : line;
        const rendered = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-semibold">{p.slice(2, -2)}</strong>
            : <React.Fragment key={j}>{p}</React.Fragment>
        );
        return isBullet
          ? <span key={i} className="flex gap-2 my-0.5"><span className="mt-2 w-1 h-1 rounded-full bg-current shrink-0 opacity-40"/><span>{rendered}</span></span>
          : <span key={i} className={i > 0 ? 'block mt-1' : ''}>{rendered}</span>;
      })}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 h-5 px-1">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="block w-1.5 h-1.5 rounded-full"
          style={{ background: 'rgba(167,139,250,0.8)' }}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function Bubble({ msg, isLast, photoURL }: { msg: ChatMessage; isLast: boolean; photoURL?: string }) {
  const isUser = msg.sender === 'user';
  const isError = msg.sender === 'ai' && msg.text.startsWith('⚠️');
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const copy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
      className={`group flex gap-3 items-end ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {isUser ? (
        <div className="shrink-0 w-7 h-7 rounded-xl overflow-hidden border border-white/10 shadow-md">
          {photoURL
            ? <img src={photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
            : <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">Y</div>
          }
        </div>
      ) : (
        <div className="shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ background: isError ? '#7f1d1d' : 'linear-gradient(135deg,#7c3aed,#4338ca)', boxShadow: isError ? '0 4px 14px rgba(127,29,29,0.35)' : '0 4px 14px rgba(124,58,237,0.35)' }}>
          {isError ? <AlertIcon /> : <SparkIcon />}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
          style={isUser ? {
            background: 'linear-gradient(135deg,#6d28d9,#4338ca)',
            color: '#f0eeff', borderBottomRightRadius: 4,
            boxShadow: '0 4px 20px rgba(109,40,217,0.25)',
          } : isError ? {
            background: 'rgba(127,29,29,0.3)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', borderBottomLeftRadius: 4,
          } : {
            background: 'rgba(255,255,255,0.055)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#cbd5e1', borderBottomLeftRadius: 4,
          }}
        >
          <RichText text={msg.text} />
        </div>

        <div className={`flex items-center gap-1.5 px-1 transition-all duration-200 ${isLast ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'}`}>
          <span className="text-[10px] tabular-nums" style={{ color: '#4b5563', fontFamily: 'DM Mono, monospace' }}>
            {fmtTime(msg.timestamp)}
          </span>
          {!isUser && msg.text && !isError && (
            <>
              <span className="text-slate-800">·</span>
              <button onClick={copy} className="hover:text-slate-300 transition-colors text-slate-600">
                {copied ? <span className="text-[10px] text-emerald-400 font-medium">Copied!</span> : <CopyIcon />}
              </button>
              <button onClick={() => setVote(vote === 'up' ? null : 'up')} className={`transition-colors ${vote === 'up' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-300'}`}>
                <ThumbUp filled={vote === 'up'} />
              </button>
              <button onClick={() => setVote(vote === 'down' ? null : 'down')} className={`transition-colors ${vote === 'down' ? 'text-rose-400' : 'text-slate-600 hover:text-slate-300'}`}>
                <ThumbDown filled={vote === 'down'} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatPanel() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([]);
    setSessionId(null);
  }, [user?.uid]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (!showScrollBtn) scrollToBottom();
  }, [messages, isStreaming]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 132) + 'px';
  };

  const send = async (overrideText?: string) => {
    const rawText = (overrideText ?? input).trim();
    if (!rawText || !user || isStreaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowScrollBtn(false);

    const tempId = `optimistic-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempId, userId: user.uid,
      sessionId: sessionId ?? '',
      text: rawText, sender: 'user', timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setTimeout(scrollToBottom, 50);

    try {
      let activeSession = sessionId;
      if (!activeSession) {
        activeSession = await createSession(user.uid, rawText);
        setSessionId(activeSession);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sessionId: activeSession! } : m));
      }

      const history: GeminiMessage[] = messages
        .filter(m => m.text)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
      history.push({ role: 'user', parts: [{ text: rawText }] });

      const stream = await getAiResponse(user.uid, rawText, history, profile ?? undefined);

      let aiText = '';
      const aiId = `ai-${Date.now()}`;
      setMessages(prev => [...prev, { id: aiId, userId: user.uid, sessionId: activeSession!, text: '', sender: 'ai', timestamp: new Date() }]);
      setIsStreaming(false);

      for await (const chunk of stream) {
        aiText += chunk.text;
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: aiText } : m));
      }

      const msgCount = messages.length;
      saveMessage(user.uid, activeSession!, rawText, 'user', msgCount);
      saveMessage(user.uid, activeSession!, aiText, 'ai', msgCount + 1);

    } catch (err: unknown) {
      setIsStreaming(false);
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, userId: user.uid,
        sessionId: sessionId ?? '',
        text: `⚠️ ${msg}`,
        sender: 'ai', timestamp: new Date(),
      }]);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearSession = () => {
    setMessages([]);
    setSessionId(null);
  };

  const groups = groupMessages(messages);
  const empty = messages.length === 0;

  return (
    <div className="h-full flex flex-col rounded-3xl overflow-hidden relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: 'linear-gradient(160deg,#0a0818 0%,#0d0f24 55%,#0a0c1a 100%)', boxShadow: '0 32px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        .lm-scroll::-webkit-scrollbar{width:3px}
        .lm-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.2);border-radius:99px}
        .lm-glow:focus-within{box-shadow:0 0 0 1.5px rgba(124,58,237,0.5),0 8px 30px rgba(109,40,217,0.15)!important}
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)' }}/>
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle,#4f46e5,transparent 70%)' }}/>
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,8,24,0.6)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4338ca)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              <div className="scale-110"><SparkIcon /></div>
            </div>
            <motion.span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: '#34d399', borderColor: '#0a0818' }}
              animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}/>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-tight leading-none mb-0.5">Lumina AI</p>
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase" style={{ color: '#7c3aed', fontFamily: 'DM Mono, monospace' }}>HR Intelligence · Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={clearSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}>
              <TrashIcon /><span className="hidden sm:inline">New chat</span>
            </motion.button>
          )}
          <div className="px-3 py-1.5 text-[10px] font-medium rounded-xl"
            style={{ color: '#4b5563', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace' }}>
            {messages.length} msg{messages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="lm-scroll relative z-10 flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence>
          {empty && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center h-full text-center pt-4 pb-10">
              <motion.div animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.04, 1] }} transition={{ duration: 5, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7 text-violet-400"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 8px 40px rgba(124,58,237,0.15)', fontSize: 32 }}>
                <div className="scale-[2.2]"><SparkIcon /></div>
              </motion.div>
              <h3 className="text-white font-semibold text-xl tracking-tight mb-2">Hi {profile?.displayName?.split(' ')[0] || 'there'} 👋</h3>
              <p className="text-sm max-w-xs leading-relaxed mb-10" style={{ color: '#64748b' }}>
                I'm Lumina — your intelligent HR companion. Ask me anything about leaves, policies, performance, or benefits.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {PROMPTS.map((p, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}
                    whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={() => send(p.text)}
                    className="text-left p-3.5 rounded-2xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#c4b5fd' }}>{p.tag}</p>
                    <p className="text-[11px] leading-relaxed truncate" style={{ color: '#475569' }}>{p.text}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          {groups.map(({ label, msgs }) => (
            <div key={label} className="space-y-3">
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }}/>
                <span className="text-[10px] px-3 py-1 rounded-full font-medium tracking-widest uppercase"
                  style={{ color: '#475569', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', background: 'rgba(255,255,255,0.02)' }}>
                  {label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }}/>
              </div>
              {msgs.map((m, idx) => <Bubble key={m.id} msg={m} isLast={idx === msgs.length - 1} photoURL={profile?.photoURL} />)}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isStreaming && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-3 items-end mt-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4338ca)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                <SparkIcon />
              </div>
              <div className="px-4 py-2.5 rounded-2xl text-violet-300"
                style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 }}>
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-2"/>
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0, scale: 0.8, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { setShowScrollBtn(false); scrollToBottom(); }}
            className="absolute bottom-[88px] right-5 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4338ca)', boxShadow: '0 4px 20px rgba(124,58,237,0.45)' }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <ChevronDownIcon />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 pb-4 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,8,24,0.4)', backdropFilter: 'blur(20px)' }}>
        <div className="lm-glow flex items-end gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <textarea ref={textareaRef} rows={1} value={input} onChange={onInputChange} onKeyDown={onKeyDown}
            disabled={isStreaming}
            placeholder="Ask about leave, policies, performance, benefits…"
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed py-0.5 max-h-32 placeholder-slate-600 disabled:opacity-40"
            style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}/>
          <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
            <button title="Voice input (coming soon)" className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
              <MicIcon />
            </button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isStreaming ? 'linear-gradient(135deg,#7c3aed,#4338ca)' : 'rgba(255,255,255,0.06)',
                boxShadow: input.trim() && !isStreaming ? '0 4px 18px rgba(124,58,237,0.45)' : 'none',
                color: input.trim() && !isStreaming ? '#fff' : '#374151',
              }}>
              <SendIcon />
            </motion.button>
          </div>
        </div>
        <p className="text-center mt-2 text-[10px] tracking-wider" style={{ color: '#1f2937', fontFamily: 'DM Mono, monospace' }}>
          Enter to send · Shift+Enter for new line · Powered by Gemini 2.0 Flash
        </p>
      </div>
    </div>
  );
}