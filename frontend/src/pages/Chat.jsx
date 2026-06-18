import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { ai } from '../api';
import { Send, Loader2, Plus, Sparkles } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';

const SUGGESTIONS = [
  "Montre-moi les projets en retard",
  "Génère une estimation pour une rénovation de cuisine 200 pi²",
  "Résume les factures impayées",
  "Comment créer une soumission?",
];

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const newConversation = async () => {
    const { data } = await ai.newConversation({ context_type: 'general' });
    setActiveConvId(data.id);
    setMessages([]);
  };

  const send = async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput('');
    const userMsg = { role: 'user', content };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    const aiMsg = { role: 'assistant', content: '' };
    setMessages((m) => [...m, aiMsg]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, conversation_id: activeConvId }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'text') {
            setMessages((m) => {
              const c = [...m];
              c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + evt.text };
              return c;
            });
          }
        }
      }
    } catch {
      setMessages((m) => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:"Erreur. Réessayez."}; return c; });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex h-full" style={{ height: 'calc(100vh - 48px)' }}>
        {/* Sidebar conversations - future feature stub */}
        <div className="w-48 border-r border-gray-100 flex flex-col p-3 gap-2 flex-shrink-0">
          <button className="btn-primary w-full justify-center text-xs py-1.5" onClick={newConversation}>
            <Plus size={13} /> Nouvelle conversation
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Sparkles size={15} className="text-brand" />
            <span className="text-sm font-semibold text-gray-900">Assistant IA MONFLUX</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'#F26522'}}>
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Comment puis-je vous aider?</p>
                  <p className="text-sm text-gray-400 mt-1">Posez une question ou essayez une suggestion</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-lg mt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="text-left text-xs border border-gray-200 rounded-lg px-3 py-2.5 hover:border-brand hover:text-brand transition-colors"
                      onClick={() => send(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5" style={{background:'#F26522'}}>
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                )}
                <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  {m.content
                    ? m.content.split('\n').map((l, j) => <p key={j} className={j>0?'mt-1':''}>{l}</p>)
                    : <span className="flex gap-1 py-0.5"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span>
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Écrivez votre message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
              autoFocus
            />
            <button className="btn-primary flex-shrink-0" onClick={() => send()} disabled={loading || !input.trim()}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
