import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Loader2, Sparkles, Maximize2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';

const SUGGESTIONS = [
  "Résume mes projets actifs",
  "Quelles factures sont en retard?",
  "Génère une estimation cuisine",
  "Comment créer un devis?",
];

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Bonjour! Je suis votre assistant MONFLUX. Comment puis-je vous aider?' }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput('');
    const history = messages.filter(m => m.role !== 'assistant' || m.content !== 'Bonjour! Je suis votre assistant MONFLUX. Comment puis-je vous aider?');
    const userMsg = { role: 'user', content };
    const next = [...history, userMsg];
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    const aiMsg = { role: 'assistant', content: '' };
    setMessages(m => [...m, aiMsg]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'text') {
              setMessages(m => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:c[c.length-1].content+evt.text}; return c; });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(m => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:'Désolé, une erreur est survenue.'}; return c; });
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-105"
        style={{ background: '#F26522' }}
        title="Assistant IA MONFLUX"
      >
        {open
          ? <X size={20} className="text-white" />
          : <MessageSquare size={20} className="text-white" />
        }
        {!open && messages.filter(m=>m.role==='user').length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 w-80 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100"
          style={{ height: '460px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0" style={{ background: '#F26522' }}>
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Assistant IA</p>
              <p className="text-white/70 text-xs">MONFLUX</p>
            </div>
            <button
              onClick={() => { setOpen(false); navigate('/chat'); }}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
              title="Plein écran"
            >
              <Maximize2 size={13} className="text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {messages.length <= 1 && messages[0]?.role === 'assistant' && (
              <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="text-left text-xs border border-gray-200 rounded-lg px-2 py-2 hover:border-orange-400 hover:text-orange-600 transition-colors leading-tight"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5" style={{ background: '#F26522' }}>
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                )}
                <div className={`rounded-xl px-3 py-1.5 text-xs max-w-[85%] leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-800'
                }`} style={m.role === 'user' ? { background: '#F26522' } : {}}>
                  {m.content
                    ? m.content.split('\n').map((l, j) => <span key={j}>{j > 0 && <br />}{l}</span>)
                    : <span className="flex gap-1"><span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'0ms'}}/><span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'150ms'}}/><span className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'300ms'}}/></span>
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 flex gap-1.5 flex-shrink-0">
            <input
              ref={inputRef}
              className="input flex-1 text-sm py-1.5"
              placeholder="Posez une question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
            />
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
              style={{ background: '#F26522' }}
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
