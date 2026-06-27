import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onboarding } from '../api';
import { useAuthStore } from '../store';
import { Send, Loader2, CheckCircle, Check, ArrowRight, X } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';

const WELCOME = `Bonjour! 👋 Je suis l'assistant MONFLUX.

Je vais configurer ton espace en quelques questions — ton métier, ton rôle dans les projets, et les vues qui te seront utiles. Commençons : **quel est le nom de ton entreprise?** (ou ton nom si tu gères tes propres projets)`;

// Retire les blocs de contrôle du texte affiché et extrait les options cliquables.
const CONTROL_RE = /<OPTIONS(?:\s+multi)?>[\s\S]*?<\/OPTIONS>|<PROFILE_COMPLETE>[\s\S]*?<\/PROFILE_COMPLETE>/g;
function parseAssistant(raw = '') {
  let options = null, multi = false;
  const m = raw.match(/<OPTIONS(\s+multi)?>([\s\S]*?)<\/OPTIONS>/);
  if (m) {
    multi = !!m[1];
    try { const arr = JSON.parse(m[2].trim()); if (Array.isArray(arr)) options = arr; } catch {}
  }
  let text = raw.replace(CONTROL_RE, '');
  // Pendant le streaming, masque les balises encore incomplètes.
  text = text.replace(/<OPTIONS[\s\S]*$/, '').replace(/<PROFILE_COMPLETE[\s\S]*$/, '');
  return { text: text.trim(), options, multi };
}

export default function Onboarding() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState([]);
  const bottomRef = useRef(null);
  const { setCompany, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTourMode = searchParams.get('tour') === '1';

  // Fermeture via Échap
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !loading && !completing) {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, completing, navigate]);

  useEffect(() => {
    onboarding.session().then(({ data }) => setSessionId(data.session_id)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (textArg) => {
    const content = (typeof textArg === 'string' ? textArg : input).trim();
    if (!content || loading) return;
    const userMsg = { role: 'user', content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSelected([]);
    setLoading(true);

    const aiMsg = { role: 'assistant', content: '' };
    setMessages((m) => [...m, aiMsg]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/onboarding/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: nextMessages, session_id: sessionId }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let detectedProfile = null;

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'text') {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + evt.text };
              return copy;
            });
          }
          if (evt.type === 'profile_ready') {
            detectedProfile = evt.profile;
            setProfile(evt.profile);
          }
        }
      }
      if (detectedProfile) {
        // Auto-complete after a short delay so user sees the last message
        setTimeout(() => completeOnboarding(detectedProfile, nextMessages), 1200);
      }
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: "Désolé, une erreur s'est produite. Réessayez." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (p, msgs) => {
    setCompleting(true);
    try {
      const { data } = await onboarding.complete({ profile: p || profile, session_id: sessionId });
      setCompany({ id: data.company_id });
      setDone(true);
      // Signal GuidedTour to launch after redirect
      localStorage.setItem('mf_tour_pending', '1');
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <CheckCircle size={48} className="text-green-500" />
        <p className="text-lg font-semibold text-gray-900">Profil créé !</p>
        <p className="text-sm text-gray-500">Redirection vers votre tableau de bord…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl flex flex-col" style={{ height: '85vh' }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'#F26522'}}>
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {isTourMode ? 'Visite guidée' : profile ? 'Mise à jour du profil' : 'Configuration du compte'}
            </p>
            <p className="text-xs text-gray-400">{isTourMode ? 'Redécouvrez les fonctionnalités MONFLUX' : 'Appuyez sur Échap ou cliquez × pour continuer plus tard'}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isTourMode && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Reprendre plus tard
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              title="Fermer"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
          {messages.map((m, i) => {
            const isAssistant = m.role === 'assistant';
            const parsed = isAssistant ? parseAssistant(m.content) : null;
            const display = isAssistant ? parsed.text : m.content;
            const isLast = i === messages.length - 1;
            const showChips = isAssistant && isLast && parsed?.options?.length && !loading && !completing && !profile;
            return (
              <div key={i} className={isAssistant ? 'flex justify-start fade-in' : 'flex justify-end fade-in'}>
                {isAssistant && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5" style={{background:'#F26522'}}>
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                )}
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div className={isAssistant ? 'chat-bubble-ai' : 'chat-bubble-user'}>
                    {display
                      ? display.split('\n').map((line, j) => (
                          <p key={j} className={j > 0 ? 'mt-1' : ''} dangerouslySetInnerHTML={{
                            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }} />
                        ))
                      : <span className="flex gap-1 py-0.5"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span>
                    }
                  </div>

                  {showChips && (
                    <div className="flex flex-wrap gap-2">
                      {parsed.multi ? (
                        <>
                          {parsed.options.map((opt) => {
                            const on = selected.includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => setSelected((s) => on ? s.filter((x) => x !== opt) : [...s, opt])}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${on ? 'border-brand bg-orange-50 text-brand font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                              >
                                {on && <Check size={12} />}{opt}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => send(selected.join(', '))}
                            disabled={!selected.length}
                            className="text-xs px-3 py-1.5 rounded-full bg-brand text-white font-medium flex items-center gap-1 disabled:opacity-40"
                          >
                            Continuer <ArrowRight size={12} />
                          </button>
                        </>
                      ) : (
                        parsed.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => send(opt)}
                            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand hover:text-brand hover:bg-orange-50 transition-colors"
                          >
                            {opt}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && messages[messages.length - 1]?.content === '' && null}
          {completing && (
            <div className="flex items-center gap-2 text-sm text-gray-500 self-center mt-2">
              <Loader2 size={14} className="animate-spin text-brand" />
              Création de votre entreprise…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
          <input
            className="input flex-1"
            placeholder="Votre réponse…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading || completing}
            autoFocus
          />
          <button
            className="btn-primary flex-shrink-0"
            onClick={send}
            disabled={loading || completing || !input.trim()}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
