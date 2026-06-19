import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { ai } from '../api';
import { Send, Loader2, Plus, Sparkles, Mic, ImagePlus } from 'lucide-react';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const autoSent = useRef(false);
  const [usage, setUsage] = useState(null);
  const [quotaHit, setQuotaHit] = useState(false);
  const [buying, setBuying] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { media_type, data, url }
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);

  // Voice input via the browser Web Speech API (no backend, fr-CA)
  const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleVoice = () => {
    if (!SpeechRec) { alert("La saisie vocale n'est pas supportée par ce navigateur. Essayez Chrome."); return; }
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SpeechRec();
    rec.lang = 'fr-CA';
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      setInput((finalText + interim).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  // Photo attachment — read as base64 for Claude vision
  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image trop volumineuse (max 5 Mo).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1];
      setPendingImage({ media_type: file.type, data: base64, url: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadUsage = () => ai.usage().then(({ data }) => setUsage(data)).catch(() => {});
  useEffect(() => { loadUsage(); }, []);

  const buyCredits = async () => {
    setBuying(true);
    try { const { data } = await ai.buyCredits(100); setUsage(data); setQuotaHit(false); }
    catch {} finally { setBuying(false); }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Auto-send a question passed via ?q= (e.g. from the dashboard AI ask-bar)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !autoSent.current) {
      autoSent.current = true;
      setSearchParams({}, { replace: true });
      send(q);
    }
  }, [searchParams]);

  const newConversation = async () => {
    const { data } = await ai.newConversation({ context_type: 'general' });
    setActiveConvId(data.id);
    setMessages([]);
  };

  const send = async (text) => {
    const typed = text || input.trim();
    const img = pendingImage;
    if ((!typed && !img) || loading) return;
    setInput('');
    setPendingImage(null);

    // Build message content: array of blocks when an image is attached, else a plain string
    let content;
    if (img) {
      content = [];
      if (typed) content.push({ type: 'text', text: typed });
      content.push({ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } });
    } else {
      content = typed;
    }

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

      // Quota exceeded (or other non-streaming error) → JSON body, not SSE
      if (!res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.status === 429 || data.code === 'ai_quota_exceeded') {
          setQuotaHit(true);
          setMessages((m) => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:`⚠️ Vous avez atteint votre limite de ${data.limit ?? ''} requêtes IA ce mois-ci. Achetez des crédits supplémentaires pour continuer.`}; return c; });
        } else {
          setMessages((m) => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:data.error||"Erreur. Réessayez."}; return c; });
        }
        return;
      }

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
      loadUsage();
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
            {usage && (
              <span className="ml-auto flex items-center gap-2">
                <span className={`text-xs ${usage.remaining <= 5 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {Math.max(0, usage.remaining)} requête{usage.remaining > 1 ? 's' : ''} restante{usage.remaining > 1 ? 's' : ''} ce mois
                </span>
                {usage.remaining <= 10 && (
                  <button onClick={buyCredits} disabled={buying} className="text-xs px-2 py-1 rounded-lg bg-brand/10 text-brand font-medium hover:bg-brand/20">
                    {buying ? '…' : '+100 crédits'}
                  </button>
                )}
              </span>
            )}
          </div>

          {/* Quota banner */}
          {quotaHit && (
            <div className="mx-5 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Limite IA mensuelle atteinte</p>
                <p className="text-xs text-amber-600">Achetez des crédits supplémentaires pour continuer à utiliser l'assistant.</p>
              </div>
              <button onClick={buyCredits} disabled={buying} className="btn-primary text-xs py-1.5 flex-shrink-0">
                {buying ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>} Acheter 100 crédits
              </button>
            </div>
          )}

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
                  {Array.isArray(m.content) ? (
                    <div className="space-y-2">
                      {m.content.map((block, j) =>
                        block.type === 'image' ? (
                          <img
                            key={j}
                            src={`data:${block.source.media_type};base64,${block.source.data}`}
                            alt="Photo"
                            className="rounded-lg max-w-[220px] max-h-[220px] object-cover"
                          />
                        ) : (
                          block.text?.split('\n').map((l, k) => <p key={`${j}-${k}`} className={k>0?'mt-1':''}>{l}</p>)
                        )
                      )}
                    </div>
                  ) : m.content ? (
                    m.content.split('\n').map((l, j) => <p key={j} className={j>0?'mt-1':''}>{l}</p>)
                  ) : (
                    <span className="flex gap-1 py-0.5"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {pendingImage && (
            <div className="px-5 pt-3 flex items-center gap-2">
              <div className="relative">
                <img src={pendingImage.url} alt="Aperçu" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs"
                  title="Retirer"
                >×</button>
              </div>
              <span className="text-xs text-gray-400">Photo prête à envoyer</span>
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 items-center">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickImage} />
            <button
              className="flex-shrink-0 w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors"
              onClick={() => fileRef.current?.click()}
              title="Joindre une photo"
              disabled={loading}
            ><ImagePlus size={16} /></button>
            <button
              className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${listening ? 'border-red-400 text-red-500 bg-red-50 animate-pulse' : 'border-gray-200 text-gray-400 hover:text-brand hover:border-brand'}`}
              onClick={toggleVoice}
              title={listening ? 'Arrêter' : 'Dictée vocale'}
              disabled={loading}
            ><Mic size={16} /></button>
            <input
              className="input flex-1"
              placeholder={listening ? 'Parlez…' : 'Écrivez, dictez, ou joignez une photo…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading}
              autoFocus
            />
            <button className="btn-primary flex-shrink-0" onClick={() => send()} disabled={loading || (!input.trim() && !pendingImage)}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
