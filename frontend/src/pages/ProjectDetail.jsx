import { useEffect, useState, useRef } from 'react';
import { useT } from '../hooks/useT';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import Layout from '../components/Layout';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi, invoices as invoicesApi, quotes as quotesApi, quittances as quittancesApi, changeOrders as changeOrdersApi, subcontractors as subsApi, companies as companiesApi, rfqs as rfqsApi, contracts as contractsApi, materialOrders as materialOrdersApi, siteMedia as siteMediaApi, ai as aiApi, pdf, contacts as contactsApi, documents as documentsApi } from '../api';
import { ArrowLeft, QrCode, Plus, Loader2, MapPin, Calendar, DollarSign, CheckCircle, Pencil, StickyNote, Receipt, FileText, GitBranch, Shield, Link2, ExternalLink, MessageCircle, MessageSquare, Globe, FileEdit, Trash2, Copy, CheckCheck, TrendingUp, HardHat, FolderOpen, Eye, EyeOff, X, ClipboardCheck, Send, Camera, Sparkles, CreditCard, FileSignature, Briefcase, Users, UserPlus, LayoutDashboard, Wrench, FolderClosed, AlertCircle, Clock, Package, Image, ShieldAlert, Wand2, AlertTriangle, Mic, GripVertical, Video, Square, Paperclip, Upload, Share2, Download, Repeat, Pin } from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const money = (v) => (Number(v) || 0).toLocaleString('fr-CA', { maximumFractionDigits: 0 }) + '$';
const BRAND = '#E8794E';
const BRAND_DARK = '#C85A2B';
const BRAND_SOFT = '#FFF1EB';
const BRAND_BORDER = '#F9D5C0';

const DETAIL_TOC_SECTIONS = [
  { id: 's-estimation', icon: '📊', label: 'Estimation approximative' },
  { id: 's-pipeline', icon: '🏗️', label: 'Phases du projet' },
  { id: 's-media', icon: '📷', label: 'Photos & médias' },
  { id: 's-expenses', icon: '💸', label: 'Dépenses' },
  { id: 's-punch', icon: '⏱️', label: 'Punch' },
  { id: 's-orders', icon: '📦', label: 'Commandes' },
  { id: 's-soumission', icon: '📄', label: 'Devis précis' },
  { id: 's-rfqs', icon: '📨', label: 'RFQ' },
  { id: 's-contracts', icon: '✍️', label: 'Contrats' },
  { id: 's-invoices', icon: '🧾', label: 'Factures' },
  { id: 's-quotes', icon: '📋', label: 'Soumissions' },
  { id: 's-documents', icon: '📁', label: 'Documents' },
  { id: 's-quittances', icon: '✅', label: 'Quittances', badge: 'QC' },
  { id: 's-portal', icon: '🌐', label: 'Portails d\'accès' },
  { id: 's-feed', icon: '📰', label: 'Fil du chantier' },
  { id: 's-plans', icon: '🏛', label: 'Plans & rendus', badge: 'B8' },
  { id: 's-comms', icon: '✉', label: 'Courriels & comms', badge: 'B9' },
  { id: 's-co', icon: '📝', label: 'Avenants' },
];

function InlineField({ value, onSave, placeholder = '—', multiline = false, style = {}, displayStyle = {} }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [committed, setCommitted] = useState(value || '');
  const inputRef = useRef(null);
  // Sync from parent only when value prop changes — NOT when editing toggles (prevents committed reset before API responds)
  useEffect(() => { if (!editing) { setVal(value || ''); setCommitted(value || ''); } }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = () => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const cancel = () => { setVal(committed); setEditing(false); };
  const save = () => {
    const trimmed = val.trim();
    setCommitted(trimmed);
    setEditing(false);
    if (trimmed !== (value || '').trim()) onSave(trimmed);
  };
  const base = { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', padding: 0, ...style };
  if (editing) return multiline
    ? <textarea ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Escape' && cancel()} style={{ ...base, width: '100%', minHeight: 48, resize: 'vertical' }} />
    : <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }} style={{ ...base, width: '100%' }} />;
  const display = committed;
  return (
    <span onClick={start} title="Cliquer pour modifier" style={{ cursor: 'text', borderBottom: '1px dashed transparent', transition: 'border-color .15s', ...displayStyle }}
      onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'rgba(232,121,78,.5)'}
      onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
      {display || <span style={{ color: '#B0B3BA', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
}

// ── Capture multimodale : texte, dictée vocale (Web Speech API), photo, vidéo, document ──
function CaptureModal({ projectId, projectName, onClose, onAdded }) {
  const BRAND = '#E8794E', BRAND_DARK = '#C85A2B';
  const MAX_BYTES = 45 * 1024 * 1024; // ~45 Mo (limite body 50 Mo côté serveur)
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]); // { uid, kind:'photo'|'video'|'document', name, mime, dataUrl, size }
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const recogRef = useRef(null);
  const baseTextRef = useRef('');
  const finalRef = useRef('');
  const uidRef = useRef(0);
  const photoInput = useRef(null), videoInput = useRef(null), docInput = useRef(null);

  useEffect(() => () => { try { recogRef.current?.stop(); } catch {} }, []);

  const fmtSize = (b) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(b / 1024)} Ko`;

  const readFiles = (fileList, kind) => {
    setError('');
    Array.from(fileList).forEach(file => {
      if (file.size > MAX_BYTES) { setError(`« ${file.name} » dépasse 45 Mo — trop volumineux.`); return; }
      const reader = new FileReader();
      reader.onload = () => setFiles(prev => [...prev, {
        uid: ++uidRef.current, kind, name: file.name, mime: file.type || 'application/octet-stream',
        dataUrl: reader.result, size: file.size,
      }]);
      reader.onerror = () => setError(`Impossible de lire « ${file.name} ».`);
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (uid) => setFiles(prev => prev.filter(f => f.uid !== uid));

  const toggleDictation = () => {
    if (listening) { try { recogRef.current?.stop(); } catch {} return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("La dictée vocale n'est pas supportée par ce navigateur. Essayez Chrome ou Safari, ou tapez votre texte."); return; }
    setError('');
    const recog = new SR();
    recogRef.current = recog;
    recog.lang = 'fr-CA';
    recog.continuous = true;
    recog.interimResults = true;
    baseTextRef.current = text ? text.replace(/\s+$/, '') + ' ' : '';
    finalRef.current = '';
    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += seg + ' ';
        else interim += seg;
      }
      setText(baseTextRef.current + finalRef.current + interim);
    };
    recog.onerror = (e) => {
      setError(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? "Accès au micro refusé. Autorisez le micro dans votre navigateur pour dicter."
        : `Erreur de dictée : ${e.error}`);
      setListening(false);
    };
    recog.onend = () => setListening(false);
    try { recog.start(); setListening(true); } catch { setError('Impossible de démarrer la dictée.'); }
  };

  const submit = async () => {
    if (!text.trim() && files.length === 0) { setError('Ajoutez du texte, une photo, une vidéo ou un document.'); return; }
    if (listening) { try { recogRef.current?.stop(); } catch {} }
    setSaving(true); setError('');
    try {
      const createdMedia = [];
      if (text.trim()) {
        const { data } = await siteMediaApi.create({
          project_id: projectId, type: 'note',
          transcript: text.trim(), caption: text.trim().slice(0, 90),
        });
        createdMedia.push(data);
      }
      for (const f of files) {
        if (f.kind === 'document') {
          await documentsApi.upload({
            project_id: projectId, type: 'other', name: f.name,
            file_url: f.dataUrl, mime_type: f.mime, file_size: f.size,
          });
        } else {
          const { data } = await siteMediaApi.create({
            project_id: projectId, type: f.kind,
            url: f.dataUrl, mime_type: f.mime, caption: f.name,
          });
          createdMedia.push(data);
        }
      }
      onAdded(createdMedia, files.some(f => f.kind === 'document'));
      onClose();
    } catch {
      setError("Échec de l'enregistrement. Vérifiez votre connexion et réessayez.");
    } finally { setSaving(false); }
  };

  const inputs = [
    { ref: photoInput, kind: 'photo', accept: 'image/*', icon: Camera, label: 'Photo' },
    { ref: videoInput, kind: 'video', accept: 'video/*', icon: Video, label: 'Vidéo' },
    { ref: docInput, kind: 'document', accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf', icon: Paperclip, label: 'Document' },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, boxShadow: '0 24px 70px rgba(0,0,0,.3)', overflow: 'hidden' }}>
        {/* Entête */}
        <div style={{ background: `linear-gradient(135deg,#F0A884 0%,${BRAND} 52%,${BRAND_DARK} 100%)`, color: '#fff', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sparkles size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Ajouter au projet</h3>
            <p style={{ fontSize: 12, margin: '2px 0 0', color: 'rgba(255,255,255,.9)' }}>{projectName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: 9, padding: 7, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: 22 }}>
          {/* Zone texte + dictée */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Écris ou dicte une note, une mesure, une observation… L'IA classera l'info au bon endroit."
              rows={5}
              style={{ width: '100%', border: '1px solid #E8EAED', borderRadius: 12, padding: '14px 14px 44px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#15171C', boxSizing: 'border-box' }}
            />
            <button onClick={toggleDictation} title={listening ? 'Arrêter la dictée' : 'Dicter (micro)'}
              style={{ position: 'absolute', left: 10, bottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 9, padding: '7px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, transition: 'all .15s',
                background: listening ? '#FEE2E2' : '#F4F4F5', color: listening ? '#DC2626' : '#52525B' }}>
              {listening ? <><Square size={13} fill="#DC2626" /> Arrêter</> : <><Mic size={14} /> Dicter</>}
              {listening && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#DC2626', animation: 'pulse 1s infinite' }} />}
            </button>
          </div>

          {/* Boutons multimodaux */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {inputs.map(({ ref, kind, accept, icon: Icon, label }) => (
              <span key={kind}>
                {/* capture="environment" on photo/video opens rear camera on mobile; no multiple (breaks capture on iOS) */}
                {kind === 'photo' && <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { readFiles(e.target.files, kind); e.target.value = ''; }} />}
                {kind === 'video' && <input ref={ref} type="file" accept="video/*" capture="environment" style={{ display: 'none' }} onChange={e => { readFiles(e.target.files, kind); e.target.value = ''; }} />}
                {kind === 'document' && <input ref={ref} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={e => { readFiles(e.target.files, kind); e.target.value = ''; }} />}
                <button onClick={() => ref.current?.click()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #E8EAED', background: '#fff', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#3F3F46' }}>
                  <Icon size={15} /> {label}
                </button>
              </span>
            ))}
          </div>

          {/* Aperçu des pièces jointes */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              {files.map(f => (
                <div key={f.uid} style={{ position: 'relative', border: '1px solid #E8EAED', borderRadius: 10, padding: 8, width: 110, background: '#FAFAFA' }}>
                  <button onClick={() => removeFile(f.uid)} style={{ position: 'absolute', top: -8, right: -8, background: '#15171C', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 11 }}><X size={11} /></button>
                  {f.kind === 'photo'
                    ? <img src={f.dataUrl} alt={f.name} style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 6 }} />
                    : <div style={{ width: '100%', height: 64, borderRadius: 6, background: '#EEF0F3', display: 'grid', placeItems: 'center', color: '#7C8089' }}>{f.kind === 'video' ? <Video size={26} /> : <FileText size={26} />}</div>}
                  <p style={{ fontSize: 10.5, color: '#52525B', margin: '6px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.name}>{f.name}</p>
                  <p style={{ fontSize: 9.5, color: '#A1A1AA', margin: 0 }}>{fmtSize(f.size)}</p>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ color: '#DC2626', fontSize: 12.5, margin: '14px 0 0', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={onClose} disabled={saving} style={{ flex: '0 0 auto', padding: '11px 18px', border: '1px solid #E8EAED', borderRadius: 11, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Annuler</button>
            <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 11, background: BRAND, cursor: saving ? 'wait' : 'pointer', fontSize: 13.5, fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? .7 : 1 }}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement…</> : <><Upload size={15} /> Ajouter au projet</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat IA contextuel du projet (streaming SSE) ──
const PROJ_API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';

function ProjectAIChat({ projectId, projectName, projectContext, onClose }) {
  const BRAND = '#E8794E', BRAND_DARK = '#C85A2B';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Bonjour! Je suis **Florence**, l'assistante IA de MONFLUX. Je suis là pour t'aider avec le projet **${projectName}** — questions, résumés, notes, actions. Comment puis-je t'aider?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => { try { recogRef.current?.stop(); } catch {} }, []);

  const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleVoice = () => {
    if (!SpeechRec) { alert("Dictée non supportée sur ce navigateur. Essayez Chrome."); return; }
    if (listening) { recogRef.current?.stop(); return; }
    const rec = new SpeechRec();
    recogRef.current = rec;
    rec.lang = 'fr-CA'; rec.interimResults = true; rec.continuous = false;
    let final = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setInput((final + interim).trim());
    };
    rec.onend = () => { setListening(false); if (final.trim()) setTimeout(() => inputRef.current?.focus(), 50); };
    rec.onerror = () => setListening(false);
    rec.start(); setListening(true);
  };

  const send = async (text) => {
    const typed = (text || input).trim();
    if (!typed || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: typed };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    const aiMsg = { role: 'assistant', content: '' };
    setMessages(m => [...m, aiMsg]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${PROJ_API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, context_type: 'project', project_id: projectId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMessages(m => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:d.error||"Erreur. Réessayez."}; return c; });
        return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'text') setMessages(m => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:c[c.length-1].content+evt.text}; return c; });
          } catch {}
        }
      }
    } catch {
      setMessages(m => { const c=[...m]; c[c.length-1]={...c[c.length-1],content:"Erreur de connexion. Réessayez."}; return c; });
    } finally { setLoading(false); }
  };

  const SUGGESTIONS = ['Résume l\'état du projet', 'Quelles sont les prochaines étapes?', 'Rédige une note de chantier', 'Quel est le budget restant?'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 299 }} />
      <div className="ai-chat-drawer">
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: `linear-gradient(135deg,#F0A884 0%,${BRAND} 52%,${BRAND_DARK} 100%)` }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.4)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Sparkles size={18} color="#fff" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>Florence ✦ Flo</p>
            <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.85)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{projectName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.18)', border: 'none', borderRadius: 9, padding: 7, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}><X size={16} /></button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? BRAND : '#F4F5F6',
                color: m.role === 'user' ? '#fff' : '#15171C', fontSize: 13.5, lineHeight: 1.5,
              }}>
                {m.content || (loading && i === messages.length - 1 ? <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span> : '…')}
              </div>
            </div>
          ))}
          {/* Suggestions sur message vide */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 20, padding: '6px 12px', fontSize: 12, color: '#3F3F46', cursor: 'pointer', fontWeight: 500 }}>{s}</button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #E8EAED', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: '#fff' }}>
          <button onClick={toggleVoice} title={listening ? 'Arrêter la dictée' : 'Dicter'}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: listening ? '#FEE2E2' : '#F4F5F6', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, color: listening ? '#DC2626' : '#52525B', position: 'relative' }}>
            {listening ? <Square size={14} fill="#DC2626" /> : <Mic size={16} />}
            {listening && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#DC2626', animation: 'pulse 1s infinite' }} />}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pose une question ou donne une instruction…"
            rows={1}
            style={{ flex: 1, border: '1px solid #E8EAED', borderRadius: 11, padding: '10px 12px', fontSize: 13.5, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#15171C', lineHeight: 1.5, minHeight: 38, maxHeight: 120, overflowY: 'auto' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: (!input.trim() || loading) ? '#F4F5F6' : BRAND, cursor: (!input.trim() || loading) ? 'default' : 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, color: (!input.trim() || loading) ? '#B0B3BA' : '#fff', transition: 'all .15s' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </>
  );
}

function parsePaymentTerms(terms) {
  if (!terms) return [];
  const matches = String(terms).match(/\d+(?:[.,]\d+)?/g) || [];
  const values = matches.map((value) => Number(value.replace(',', '.'))).filter((value) => value > 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!values.length || total > 100.5) return [];
  return values;
}

function paymentStepLabel(index, total) {
  if (index === 0) return 'Dépôt';
  if (index === total - 1) return total === 2 ? 'Solde final' : 'Fin des travaux';
  if (index === 1) return 'Mi-chantier';
  return `Versement ${index + 1}`;
}

const TRADE_STATUS = {
  to_find:   { label: 'À trouver', badge: 'badge-gray' },
  contacted: { label: 'Contacté',  badge: 'badge-blue' },
  quoted:    { label: 'Soumissionné', badge: 'badge-yellow' },
  confirmed: { label: 'Confirmé',  badge: 'badge-orange' },
  done:      { label: 'Terminé',   badge: 'badge-green' },
};
const EXPENSE_TYPES = {
  supplier_invoice: 'Facture fournisseur',
  material: 'Matériaux',
  equipment: 'Équipement',
  permit: 'Permis',
  rental: 'Location',
  other: 'Autre',
};

// Aperçu in-app d'un document généré (PDF de soumission/facture) ou téléversé (plan/photo).
function DocPreview({ doc, onClose }) {
  if (!doc) return null;
  const isImage = (doc.mime_type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.url || '');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ height: '85vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <Eye size={15} className="text-brand" />
            <p className="text-sm font-semibold text-gray-800 truncate">{doc.title || 'Aperçu du document'}</p>
          </div>
          <div className="flex items-center gap-1">
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1"><ExternalLink size={13} /> Ouvrir</a>
            <button className="btn-ghost text-xs py-1 px-2" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 overflow-auto flex items-center justify-center">
          {isImage
            ? <img src={doc.url} alt={doc.title} className="max-w-full max-h-full object-contain" />
            : <iframe src={doc.url} title={doc.title || 'document'} className="w-full h-full" style={{ border: 0 }} />}
        </div>
      </div>
    </div>
  );
}

const PS_BADGE = { not_started:'badge-gray', in_progress:'badge-orange', delayed:'badge-red', completed:'badge-green', cancelled:'badge-gray' };
const PS_LABEL = { not_started:'Non démarré', in_progress:'En cours', delayed:'En retard', completed:'Terminé', cancelled:'Annulé' };
const PHASE_COLORS = [BRAND,'#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#14b8a6','#ec4899'];
const PHASE_TEMPLATES = [
  { name: 'Démolition',        trade_name: 'Démolition',   durationDays: 5  },
  { name: 'Préparation',       trade_name: null,           durationDays: 3  },
  { name: 'Structure',         trade_name: 'Charpenterie', durationDays: 14 },
  { name: 'Électricité',       trade_name: 'Électricité',  durationDays: 7  },
  { name: 'Plomberie',         trade_name: 'Plomberie',    durationDays: 7  },
  { name: 'CVCA',              trade_name: 'Chauffage / CVC', durationDays: 5  },
  { name: 'Isolation',         trade_name: 'Isolation',    durationDays: 5  },
  { name: 'Gypse & finition',  trade_name: 'Gypse / cloisons', durationDays: 10 },
  { name: 'Peinture',          trade_name: 'Peinture',     durationDays: 7  },
  { name: 'Plancher',          trade_name: 'Planchers',    durationDays: 5  },
  { name: 'Nettoyage final',   trade_name: null,           durationDays: 2  },
];

const ASSIGNEE_STATUS = {
  to_find:     { label: 'À trouver',          bg: '#F3F4F6', border: '#E5E7EB', text: '#9CA3AF', dot: '#D1D5DB' },
  contacted:   { label: 'Pré-sélectionné',    bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563', dot: '#6B7280' },
  quoted:      { label: 'Devis demandé',       bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', dot: '#F59E0B' },
  negotiating: { label: 'En négociation',      bg: '#FFF7ED', border: '#FDBA74', text: '#C2410C', dot: '#F97316' },
  confirmed:   { label: 'Accepté',             bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', dot: '#22C55E' },
  done:        { label: 'Relancé',             bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', dot: '#3B82F6' },
};

function AssigneeChip({ trade, assignedToName, onSelfAssign, onUnassign }) {
  // assignedToName (self-assign stored on phase) takes priority over trade subcontractor
  const tradeName = trade?.subcontractor_name || trade?.chosen_subcontractor_name || null;
  const name = assignedToName || tradeName;
  const st = assignedToName ? ASSIGNEE_STATUS.confirmed : (ASSIGNEE_STATUS[trade?.status] || ASSIGNEE_STATUS.to_find);
  const isUnassigned = !name;
  const displayName = name || st.label;
  const tooltip = [
    name && `Assigné: ${name}`,
    trade?.trade && `Corps de métier: ${trade.trade}`,
    `Statut: ${st.label}`,
    trade?.estimated_cost && `Budget estimé: ${Number(trade.estimated_cost).toLocaleString('fr-CA')} $`,
    isUnassigned && onSelfAssign && 'Cliquer pour s\'auto-assigner',
    !isUnassigned && onUnassign && 'Cliquer pour désassigner',
  ].filter(Boolean).join('\n');

  const handleClick = isUnassigned ? (onSelfAssign || undefined) : (onUnassign || undefined);

  return (
    <div title={tooltip}
      onClick={handleClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 8px', borderRadius: 6,
        background: st.bg, border: `1px solid ${st.border}`,
        fontSize: 11, fontWeight: 600, color: st.text,
        maxWidth: 150, cursor: handleClick ? 'pointer' : 'default',
      }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }}/>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
    </div>
  );
}

const STATUS_BORDER  = { not_started:'#E5E7EB', in_progress:BRAND, done:'#22C55E', delayed:'#EF4444', on_hold:'#9CA3AF', waiting_supplier:'#A78BFA' };
const STATUS_FILL    = { not_started:'#D1D5DB', in_progress:BRAND, done:'#22C55E', delayed:'#EF4444', on_hold:'#9CA3AF', waiting_supplier:'#8B5CF6' };
const PUNCH_COLOR    = '#60A5FA'; // bleu — distingue le réel (punch) du prévu (statut)
const STATUS_LABELS  = { not_started:'Non démarré', in_progress:'En cours', done:'Terminé', delayed:'En retard', on_hold:'En attente client', waiting_supplier:'En attente fournisseur' };
const SCALE_COL_W    = { month:120, week:72, day:36, halfday:56, hour:32 };

function GanttChart({ phases, projectStart, projectEnd, trades, onDeletePhase, onEditPhase, onReorderPhases, onRenamePhase, onDatesChange, onAddPhase, onUpdatePhase, currentUserName, onSelfAssign }) {
  const [scale, setScale]         = useState('week');
  const [editCell, setEditCell]   = useState(null); // { id, field: 'datetime'|'duration' }
  const [cascade, setCascade]     = useState(true);
  const [showDates, setShowDates] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [dragIdx, setDragIdx]     = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [barDrag, setBarDrag]     = useState(null); // {phId,startX,origStart,origEnd,delta,pxPerDay}
  const [resize, setResize]       = useState(null); // {phId,side,startX,origStart,origEnd,delta,pxPerDay}
  const [tooltip, setTooltip]     = useState(null); // {ph,trade,x,y}
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [dateOffsets, setDateOffsets] = useState({}); // {`${phId}-start`|`${phId}-end`}: deltaX}
  const [freezeCols, setFreezeCols]         = useState(true);
  const [recurrenceEdit, setRecurrenceEdit] = useState(null); // { id, rect }
  const [recurrenceForm, setRecurrenceForm] = useState({ type:'weekly', count:2 });
  const [filters, setFilters]               = useState({}); // { name, start_date, assigned, status }
  const [activeFilter, setActiveFilter]     = useState(null); // header col open for filter
  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [bulkPanel, setBulkPanel]           = useState(null); // null | 'status' | 'start' | 'duration' | 'assign' | 'dep'
  const [bulkForm, setBulkForm]             = useState({});
  const [statusPicker, setStatusPicker]     = useState(null); // { phId, x, y }
  const [deps, setDeps]                     = useState({}); // { succPhId: predPhId }
  const [depFirst, setDepFirst]             = useState(null); // phase ID of first clicked in dep-connect mode
  const dateDragRef = useRef(null);
  const scrollRef   = useRef(null);
  const ganttElRef  = useRef(null);
  const todayPxRef  = useRef(0);
  const longPressRef = useRef(null);

  // Centrer sur aujourd'hui au chargement et à chaque changement de vue
  // (fixedColW hardcodé car LABEL_W/DATE_W etc. sont définis après le return null)
  useEffect(() => {
    if (!scrollRef.current || todayPxRef.current <= 0) return;
    const FIXED = 24 + 155 + 20 + 102 + 50 + 140; // CHECK_W+LABEL_W+20+DATE_W+DUR_W+ASSIGN_W // LABEL_W+20+DATE_W+DUR_W+ASSIGN_W
    const viewW = scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = Math.max(0, todayPxRef.current - (viewW - FIXED) * 0.3);
  }, [scale]);

  if (!phases || phases.length === 0) return null;

  // Date range
  const datedStarts = phases.map(ph => ph.start_date).filter(Boolean).map(d => new Date(d));
  const datedEnds   = phases.map(ph => ph.end_date).filter(Boolean).map(d => new Date(d));
  const fallbackStart = datedStarts.length ? new Date(Math.min(...datedStarts)) : new Date();
  const fallbackEnd   = datedEnds.length   ? new Date(Math.max(...datedEnds))   : new Date(fallbackStart.getTime() + 90*86400000);
  const refStart = projectStart ? new Date(projectStart) : fallbackStart;
  const rawEnd   = projectEnd   ? new Date(projectEnd)   : fallbackEnd;
  const refEnd   = new Date(Math.max(rawEnd.getTime(), fallbackEnd.getTime()) + 14*86400000);
  const totalMs  = Math.max(refEnd - refStart, 1);
  const totalDays = totalMs / 86400000;

  // Fixed-width columns (this is what makes scale switching actually "zoom")
  const colW = SCALE_COL_W[scale] || 72;
  const columns = (() => {
    if (scale === 'halfday') {
      // AM (06h-12h) et PM (12h-20h) par jour — heures de travail uniquement, cap 60 jours
      const cols = [];
      const cur = new Date(refStart); cur.setHours(0,0,0,0);
      const cap = new Date(cur); cap.setDate(cap.getDate() + 60);
      const stop = refEnd < cap ? refEnd : cap;
      while (cur <= stop && cols.length < 240) {
        const y = cur.getFullYear(), m = cur.getMonth(), d = cur.getDate();
        cols.push({ start: new Date(y,m,d,6),  end: new Date(y,m,d,11,59,59), label:'AM', showDate:true });
        cols.push({ start: new Date(y,m,d,12), end: new Date(y,m,d,19,59,59), label:'PM', showDate:false });
        cur.setDate(cur.getDate() + 1);
      }
      return cols;
    }
    if (scale === 'hour') {
      // Partir de min(refStart, aujourd'hui - 1j) pour couvrir today ET les phases futures
      const cols = [];
      const todayMinus1 = new Date(); todayMinus1.setDate(todayMinus1.getDate() - 1); todayMinus1.setMinutes(0,0,0);
      const startFrom = new Date(Math.min(refStart.getTime(), todayMinus1.getTime()));
      startFrom.setMinutes(0,0,0);
      const cur = new Date(startFrom);
      const cap = new Date(cur); cap.setDate(cap.getDate() + 60); // 60 jours
      const stop = refEnd < cap ? refEnd : cap;
      while (cur <= stop && cols.length < 1440) {
        cols.push({ start: new Date(cur), end: new Date(cur.getTime() + 3599999) });
        cur.setHours(cur.getHours() + 1);
      }
      return cols;
    }
    if (scale === 'week') {
      const cols = [];
      const mon = new Date(refStart);
      mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
      const cur = new Date(mon);
      while (cur <= refEnd) {
        const end = new Date(cur); end.setDate(end.getDate() + 6);
        cols.push({ start: new Date(cur), end });
        cur.setDate(cur.getDate() + 7);
      }
      return cols;
    }
    if (scale === 'day') {
      const cols = [];
      const cur = new Date(refStart); cur.setHours(0,0,0,0);
      while (cur <= refEnd) {
        const end = new Date(cur); end.setHours(23,59,59,999);
        cols.push({ start: new Date(cur), end });
        cur.setDate(cur.getDate() + 1);
      }
      return cols;
    }
    const cols = [];
    const cur = new Date(refStart.getFullYear(), refStart.getMonth(), 1);
    while (cur <= refEnd) {
      cols.push({ start: new Date(cur), end: new Date(cur.getFullYear(), cur.getMonth()+1, 0) });
      cur.setMonth(cur.getMonth()+1);
    }
    return cols;
  })();

  const CHECK_W  = 24;  // checkbox column
  const LABEL_W  = 155;
  const DATE_W   = 102;
  const DUR_W    = 50;
  const ASSIGN_W = 140;
  const ganttW   = Math.max(columns.length * colW, 400);
  const totalMinW = CHECK_W + LABEL_W + 20 + DATE_W + DUR_W + ASSIGN_W + ganttW;
  const hasSel = selectedIds.size > 0;

  // Sticky helpers — conditioned on freezeCols toggle (z-index high enough to cover Gantt overlays)
  const stickyH = (left, extra = {}) => freezeCols ? { position:'sticky', left, zIndex:20, ...extra } : extra;
  const stickyC = (left, extra = {}) => freezeCols ? { position:'sticky', left, zIndex:15, ...extra } : extra;

  // Effective time span — for fixed-period scales the ganttW represents only the visible columns,
  // NOT the full project span. Using the correct effMs fixes bar width in Heure/Jour/AM-PM.
  const MS_PER_COL = { week: 7*86400000, day: 86400000, halfday: 12*3600000, hour: 3600000 };
  const colMs = MS_PER_COL[scale]; // undefined for month
  const effMs  = colMs ? columns.length * colMs : totalMs;
  const effRefStart = (colMs && columns.length > 0) ? columns[0].start : refStart;

  // Snap granularity (always ≤ 1 column): week/month snaps by day, others snap by 1 column period
  const snapMs     = { month: 86400000, week: 86400000, day: 86400000, halfday: 12*3600000, hour: 3600000 }[scale] || 86400000;
  const pxPerSnap  = ganttW / (effMs / snapMs); // pixels per snap unit

  // Weekend check for a given date (only visible in day/halfday/hour scales)
  const isWeekendCol = (col) =>
    (scale==='day'||scale==='halfday'||scale==='hour') &&
    (col.start.getDay()===0 || col.start.getDay()===6);

  // Today column: the column whose range contains right now
  const _now = new Date();
  const isTodayCol = (col) => col.start <= _now && _now <= col.end;

  // Pixel helpers — use effective range so bar widths are correct in all views
  const px = (d) => Math.max(0, Math.min(ganttW, (new Date(d) - effRefStart) / effMs * ganttW));
  const todayPx = px(new Date());
  todayPxRef.current = todayPx;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : '';
  // Affiche une durée en heures sous forme "Xj Yh" (journée de travail = 8h)
  const fmtDur = (h) => {
    if (!h) return '—';
    const days = Math.floor(h / 8);
    const rem  = Math.round((h % 8) * 100) / 100;
    if (days === 0) return `${rem}h`;
    if (rem === 0)  return `${days}j`;
    return `${days}j ${rem}h`;
  };
  const weekNum = (d) => {
    const dt = new Date(d); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + 4 - (dt.getDay()||7));
    return Math.ceil(((dt - new Date(dt.getFullYear(),0,1)) / 86400000 + 1) / 7);
  };

  // Effective bar bounds (accounting for duration_hours, drag and resize previews)
  const getBarBounds = (ph) => {
    const rawStart = ph.start_date?.slice(0,10);
    const rawTime  = ph.start_time || '08:00';
    let sMs = rawStart ? new Date(rawStart + 'T' + rawTime).getTime() : effRefStart.getTime();

    let eMs;
    if (ph.duration_hours && rawStart) {
      eMs = sMs + Number(ph.duration_hours) * 3600000;
    } else {
      const rawEnd = ph.end_date?.slice(0,10);
      eMs = rawEnd ? new Date(rawEnd + 'T17:00').getTime() : sMs + 7*86400000;
    }

    if (barDrag?.phId === ph.id) {
      const dMs = (barDrag.delta || 0) * (barDrag.snapMs || 86400000);
      sMs += dMs; eMs += dMs;
    } else if (resize?.phId === ph.id) {
      const rMs = (resize.delta || 0) * (resize.snapMs || 86400000);
      if (resize.side === 'left') sMs += rMs;
      else                        eMs += rMs;
    }

    const s = new Date(sMs), e = new Date(eMs);
    const refMs = effRefStart.getTime();
    const left  = Math.max(0, Math.min(ganttW, (sMs - refMs) / effMs * ganttW));
    const width = Math.max(8, Math.min(ganttW - left, (eMs - sMs) / effMs * ganttW));
    const sDate = new Date(sMs).toISOString().slice(0,10);
    const eDate = new Date(eMs).toISOString().slice(0,10);
    return { left, width, s, e, sDate, eDate };
  };

  const tradesByName = {};
  (trades || []).forEach(t => { if (t.trade) tradesByName[t.trade.toLowerCase()] = t; });

  // Row reorder drag
  const onRowDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; };
  const onRowDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onRowDrop      = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...phases]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved);
    onReorderPhases?.(next); setDragIdx(null); setDragOverIdx(null);
  };

  // Bar drag (shift all dates) — delta in snapMs units
  const handleBarDown = (e, ph) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rawStart = ph.start_date?.slice(0,10);
    const origStartMs = rawStart ? new Date(rawStart + 'T' + (ph.start_time||'08:00')).getTime() : Date.now();
    let origEndMs;
    if (ph.duration_hours && rawStart) {
      origEndMs = origStartMs + Number(ph.duration_hours) * 3600000;
    } else if (ph.end_date) {
      origEndMs = new Date(ph.end_date.slice(0,10) + 'T17:00').getTime();
    } else {
      origEndMs = origStartMs + 8 * 3600000;
    }
    setBarDrag({ phId: ph.id, startX: e.clientX, origStartMs, origEndMs, pxPerSnap, snapMs, delta: 0 });
  };
  const handleBarMove = (e) => {
    if (!barDrag) return;
    const delta = Math.round((e.clientX - barDrag.startX) / barDrag.pxPerSnap);
    if (delta !== barDrag.delta) setBarDrag(p => ({ ...p, delta }));
  };
  const handleBarUp = (e, ph) => {
    if (!barDrag || barDrag.phId !== ph.id) return;
    const d = barDrag.delta || 0;
    if (d !== 0) {
      const newStartMs = barDrag.origStartMs + d * barDrag.snapMs;
      const ns = new Date(newStartMs);
      const nsDate = ns.toISOString().slice(0,10);
      const nsTime = `${String(ns.getHours()).padStart(2,'0')}:${String(ns.getMinutes()).padStart(2,'0')}`;
      if (ph.duration_hours) {
        onUpdatePhase?.(ph.id, { start_date: nsDate, start_time: nsTime });
      } else {
        const ne = new Date(barDrag.origEndMs + d * barDrag.snapMs);
        onDatesChange?.(ph.id, nsDate, ne.toISOString().slice(0,10), cascade);
      }
    }
    setBarDrag(null);
  };

  // Resize handles (change duration) — delta in snapMs units, saves duration_hours
  const handleResizeDown = (e, ph, side) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rawStart = ph.start_date?.slice(0,10);
    const origStartMs = rawStart ? new Date(rawStart + 'T' + (ph.start_time||'08:00')).getTime() : Date.now();
    let origEndMs;
    if (ph.duration_hours && rawStart) {
      origEndMs = origStartMs + Number(ph.duration_hours) * 3600000;
    } else if (ph.end_date) {
      origEndMs = new Date(ph.end_date.slice(0,10) + 'T17:00').getTime();
    } else {
      origEndMs = origStartMs + 8 * 3600000;
    }
    setResize({ phId: ph.id, side, startX: e.clientX, origStartMs, origEndMs, pxPerSnap, snapMs, delta: 0 });
  };
  const handleResizeMove = (e) => {
    if (!resize) return;
    const delta = Math.round((e.clientX - resize.startX) / resize.pxPerSnap);
    if (delta !== resize.delta) setResize(p => ({ ...p, delta }));
  };
  const handleResizeUp = (e, ph) => {
    e.stopPropagation();
    if (!resize || resize.phId !== ph.id) return;
    const d = resize.delta || 0;
    const snapshot = { ...resize };
    setResize(null); // annuler l'aperçu AVANT l'API pour éviter double-animation
    if (d !== 0) {
      const dMs = d * snapshot.snapMs;
      if (snapshot.side === 'left') {
        const newStartMs = snapshot.origStartMs + dMs;
        const newDurH = Math.max(0.25, (snapshot.origEndMs - newStartMs) / 3600000);
        const ns = new Date(newStartMs);
        const hh = String(ns.getHours()).padStart(2,'0');
        const mm = String(ns.getMinutes()).padStart(2,'0');
        onUpdatePhase?.(ph.id, {
          start_date: `${ns.getFullYear()}-${String(ns.getMonth()+1).padStart(2,'0')}-${String(ns.getDate()).padStart(2,'0')}`,
          start_time: `${hh}:${mm}`,
          duration_hours: Number(newDurH.toFixed(2)),
        });
      } else {
        const newEndMs = snapshot.origEndMs + dMs;
        const newDurH = Math.max(0.25, (newEndMs - snapshot.origStartMs) / 3600000);
        onUpdatePhase?.(ph.id, { duration_hours: Number(newDurH.toFixed(2)) });
      }
    }
  };

  // Date label drag handlers
  const handleDateLabelDown = (e, phId, isStart) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const key = `${phId}-${isStart ? 'start' : 'end'}`;
    dateDragRef.current = { key, startX: e.clientX, baseOffset: dateOffsets[key] || 0 };
  };
  const handleDateLabelMove = (e, phId, isStart) => {
    if (!dateDragRef.current) return;
    const key = `${phId}-${isStart ? 'start' : 'end'}`;
    if (dateDragRef.current.key !== key) return;
    const delta = e.clientX - dateDragRef.current.startX;
    setDateOffsets(prev => ({ ...prev, [key]: dateDragRef.current.baseOffset + delta }));
  };
  const handleDateLabelUp = () => { dateDragRef.current = null; };

  // Inline name edit
  const startEdit = (ph) => { setEditingId(ph.id); setEditingName(ph.name); };
  const commitEdit = (ph) => {
    const t = editingName.trim();
    if (t && t !== ph.name) onRenamePhase?.(ph.id, t);
    setEditingId(null);
  };

  const scrollToToday = () => {
    if (!scrollRef.current) return;
    const viewW = scrollRef.current.clientWidth;
    const FIXED = freezeCols ? (24 + 155 + 20 + 102 + 50 + 140) : 0;
    // centre today within the visible Gantt area (after sticky columns)
    scrollRef.current.scrollLeft = Math.max(0, todayPx - (viewW - FIXED) * 0.4);
  };

  // Filter helpers
  const setFilter = (field, val) => setFilters(f => ({ ...f, [field]: val }));
  const clearFilter = (field) => setFilters(f => { const n={...f}; delete n[field]; return n; });
  const hasFilter = (field) => !!filters[field];
  const filteredPhases = phases.filter(ph => {
    if (filters.name && !(ph.name||'').toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.start_date && !(ph.start_date||'').includes(filters.start_date)) return false;
    if (filters.assigned && !(ph.assigned_to_name||'').toLowerCase().includes(filters.assigned.toLowerCase())) return false;
    if (filters.status && ph.status !== filters.status) return false;
    return true;
  });

  // Long-press on bar → status picker
  const startLongPress = (ev, ph) => {
    const cx = ev.clientX, cy = ev.clientY;
    longPressRef.current = setTimeout(() => {
      setStatusPicker({ phId: ph.id, x: cx, y: cy });
      setBarDrag(null);
    }, 600);
  };
  const cancelLongPress = () => { clearTimeout(longPressRef.current); longPressRef.current = null; };

  // Bulk select helpers
  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll = () => setSelectedIds(new Set(filteredPhases.map(p => p.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setBulkPanel(null); };

  // Apply bulk action — applique tous les champs remplis d'un coup
  const applyBulk = async () => {
    const ids = [...selectedIds];
    if (bulkPanel === 'delete') {
      ids.forEach(id => onDeletePhase?.(id));
      clearSelection(); return;
    }
    if (bulkPanel === 'dep' && depFirst && ids.length === 1) {
      setDeps(d => ({ ...d, [ids[0]]: depFirst }));
      setDepFirst(null);
      clearSelection(); return;
    }
    // Construire l'objet update avec tous les champs non-vides
    const updates = {};
    if (bulkForm.status) updates.status = bulkForm.status;
    if (bulkForm.start_date) updates.start_date = bulkForm.start_date;
    if (bulkForm.duration_hours) updates.duration_hours = parseFloat(bulkForm.duration_hours);
    if (bulkForm.assigned_to_name) updates.assigned_to_name = bulkForm.assigned_to_name;
    if (Object.keys(updates).length > 0) ids.forEach(id => onUpdatePhase?.(id, updates));
    if (bulkPanel === 'self') ids.forEach(id => onSelfAssign?.(id, currentUserName));
    clearSelection();
  };

  const exportPdf = () => window.print();

  return (
    <>
      {/* ── Toolbar ── */}
      <div style={{ display:'flex', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid #F4F5F6', gap:5, flexWrap:'wrap' }}>
        {/* Col. fixes — tout à gauche, séparé */}
        <button onClick={() => setFreezeCols(v=>!v)}
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:5, flexShrink:0,
            border:`1px solid ${freezeCols ? BRAND_BORDER : '#E5E7EB'}`,
            background: freezeCols ? BRAND_SOFT : '#fff', fontSize:11, fontWeight:600,
            color: freezeCols ? BRAND_DARK : '#9CA3AF', cursor:'pointer' }}>
          <Pin size={10}/> Col. fixes
        </button>
        <div style={{ width:1, height:16, background:'#E5E7EB', flexShrink:0 }}/>
        <span style={{ flex:1 }}/>
        {[
          [showDates,  ()=>setShowDates(v=>!v),  <Calendar size={10}/>,  'Dates'],
          [showArrows, ()=>setShowArrows(v=>!v), <GitBranch size={10}/>, 'Dépend.'],
          [showLegend, ()=>setShowLegend(v=>!v), null,                   'Légende'],
          [cascade,    ()=>setCascade(v=>!v),    <GitBranch size={10}/>, 'Cascade'],
        ].map(([active, fn, icon, lbl], ki) => (
          <button key={ki} onClick={fn}
            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:5,
              border:`1px solid ${active ? BRAND_BORDER : '#E5E7EB'}`,
              background: active ? BRAND_SOFT : '#fff', fontSize:11, fontWeight:600,
              color: active ? BRAND_DARK : '#9CA3AF', cursor:'pointer' }}>
            {icon}{lbl}
          </button>
        ))}
        <button onClick={scrollToToday}
          style={{ padding:'4px 8px', borderRadius:7, border:'1px solid #E5E7EB', background:'#fff', fontSize:11, fontWeight:600, color:'#6B7280', cursor:'pointer' }}>
          Aujourd'hui
        </button>
        <div style={{ display:'flex', background:'#F3F4F6', borderRadius:5, padding:2 }}>
          {[['month','Mois'],['week','Sem.'],['day','Jour'],['halfday','AM/PM'],['hour','Heure']].map(([s,lbl]) => (
            <button key={s} onClick={() => setScale(s)}
              style={{ padding:'4px 9px', borderRadius:3, border:'none', fontSize:11, fontWeight:700, cursor:'pointer',
                background: scale===s ? '#fff' : 'transparent', color: scale===s ? '#15171C' : '#9CA3AF',
                boxShadow: scale===s ? '0 1px 2px rgba(0,0,0,.08)' : 'none', transition:'all .12s' }}>{lbl}</button>
          ))}
        </div>
        <button onClick={exportPdf} title="Exporter PDF"
          style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:5, border:'1px solid #E5E7EB', background:'#fff', fontSize:11, fontWeight:600, color:'#6B7280', cursor:'pointer' }}>
          <Download size={10}/> PDF
        </button>
      </div>

      {/* ── Légende ── */}
      {showLegend && (
        <div style={{ padding:'7px 18px', background:'#FAFBFC', borderBottom:'1px solid #F4F5F6', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          {/* Gauche — Assigné */}
          <div>
            <div style={{ fontSize:8, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#C0C4CC', marginBottom:4 }}>Assigné</div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {Object.entries(ASSIGNEE_STATUS).map(([key, st]) => (
                <div key={key} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 6px', borderRadius:4, background:st.bg, border:`1px solid ${st.border}`, fontSize:10, fontWeight:600, color:st.text }}>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:st.dot, flexShrink:0 }}/>
                  {st.label}
                </div>
              ))}
            </div>
          </div>
          {/* Droite — Phase */}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:8, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#C0C4CC', marginBottom:4 }}>Phase</div>
            {/* Statuts = Prévu (accolade) + Réel (punch) */}
            <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
              {/* Prévu — les 5 statuts avec accolade */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:9, color:'#9CA3AF', fontWeight:700, fontStyle:'italic' }}>Prévu&nbsp;→</span>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <div key={status} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'#6B7280' }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:STATUS_FILL[status], display:'inline-block', flexShrink:0 }}/>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Gantt scrollable ── */}
      <div ref={scrollRef} style={{ overflowX:'auto' }}>
        <div style={{ minWidth: totalMinW, position:'relative' }}>

          {/* Header */}
          <div style={{ display:'flex', borderBottom:'2px solid #EEF0F2', background:'#fff', position:'sticky', top:0, zIndex:5 }}>
            {/* Checkbox select-all */}
            <div style={{ width:CHECK_W, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', ...stickyH(0) }}>
              <input type="checkbox" checked={filteredPhases.length>0 && filteredPhases.every(p=>selectedIds.has(p.id))}
                onChange={ev => ev.target.checked ? selectAll() : clearSelection()}
                style={{ width:13, height:13, cursor:'pointer', accentColor:BRAND }}/>
            </div>
            {/* Phase header with filter */}
            <div style={{ width:LABEL_W+20, flexShrink:0, background:'#fff', ...stickyH(CHECK_W) }}>
              <div style={{ padding:'7px 0 7px 4px', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: hasFilter('name') ? BRAND : '#9CA3AF', flex:1 }}>Phase</span>
                <button onClick={() => setActiveFilter(activeFilter==='name'?null:'name')} title="Filtrer" style={{ border:'none', background:'transparent', cursor:'pointer', padding:'2px 4px', borderRadius:3, color: hasFilter('name') ? BRAND : '#C0C4CC' }}>▼</button>
                {hasFilter('name') && <button onClick={()=>clearFilter('name')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:10 }}>✕</button>}
              </div>
              {activeFilter==='name' && <input autoFocus value={filters.name||''} onChange={ev=>setFilter('name',ev.target.value)} placeholder="Filtrer…"
                style={{ display:'block', width:'calc(100% - 12px)', margin:'0 6px 4px', fontSize:10, border:`1px solid ${BRAND}`, borderRadius:4, padding:'3px 5px', outline:'none' }}/>}
            </div>
            {/* Début header with filter */}
            <div style={{ width:DATE_W, flexShrink:0, borderLeft:'1px solid #F0F1F3', background:'#fff', ...stickyH(CHECK_W+LABEL_W+20) }}>
              <div style={{ padding:'7px 6px', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: hasFilter('start_date') ? BRAND : '#9CA3AF', flex:1 }}>Début</span>
                <button onClick={() => setActiveFilter(activeFilter==='start_date'?null:'start_date')} style={{ border:'none', background:'transparent', cursor:'pointer', padding:'2px', color: hasFilter('start_date') ? BRAND : '#C0C4CC' }}>▼</button>
                {hasFilter('start_date') && <button onClick={()=>clearFilter('start_date')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:10 }}>✕</button>}
              </div>
              {activeFilter==='start_date' && <input autoFocus value={filters.start_date||''} onChange={ev=>setFilter('start_date',ev.target.value)} placeholder="juil, 2026…"
                style={{ display:'block', width:'calc(100% - 12px)', margin:'0 6px 4px', fontSize:10, border:`1px solid ${BRAND}`, borderRadius:4, padding:'3px 5px', outline:'none' }}/>}
            </div>
            {/* Durée header */}
            <div style={{ width:DUR_W, flexShrink:0, padding:'7px 6px', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#9CA3AF', borderLeft:'1px solid #F0F1F3', background:'#fff', ...stickyH(CHECK_W+LABEL_W+20+DATE_W) }}>Durée</div>
            {/* Assigné header with filter */}
            <div style={{ width:ASSIGN_W, flexShrink:0, borderLeft:'1px solid #F0F1F3', background:'#fff', boxShadow: freezeCols ? '3px 0 6px rgba(0,0,0,.06)' : 'none', ...stickyH(CHECK_W+LABEL_W+20+DATE_W+DUR_W) }}>
              <div style={{ padding:'7px 10px', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: (hasFilter('assigned')||hasFilter('status')) ? BRAND : '#9CA3AF', flex:1 }}>Assigné</span>
                <button onClick={() => setActiveFilter(activeFilter==='assigned'?null:'assigned')} style={{ border:'none', background:'transparent', cursor:'pointer', padding:'2px', color: (hasFilter('assigned')||hasFilter('status')) ? BRAND : '#C0C4CC' }}>▼</button>
                {(hasFilter('assigned')||hasFilter('status')) && <button onClick={()=>{clearFilter('assigned');clearFilter('status');}} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:10 }}>✕</button>}
              </div>
              {activeFilter==='assigned' && (
                <div style={{ padding:'0 6px 6px', display:'flex', flexDirection:'column', gap:3 }}>
                  <input value={filters.assigned||''} onChange={ev=>setFilter('assigned',ev.target.value)} placeholder="Nom…" autoFocus
                    style={{ fontSize:10, border:`1px solid ${BRAND}`, borderRadius:4, padding:'3px 5px', outline:'none' }}/>
                  <select value={filters.status||''} onChange={ev=>setFilter('status',ev.target.value)}
                    style={{ fontSize:10, border:'1px solid #E5E7EB', borderRadius:4, padding:'3px 4px', outline:'none' }}>
                    <option value="">Tous les statuts</option>
                    {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div ref={ganttElRef} style={{ width:ganttW, flexShrink:0, display:'flex', position:'relative', borderLeft:'1px solid #ECEEF0' }}>
              {columns.map((col, ci) => {
                const isToday = isTodayCol(col);
                const isWknd  = isWeekendCol(col);
                return (
                  <div key={ci} style={{ width:colW, flexShrink:0, padding:'5px 0 5px 5px', borderRight:'1px solid #ECEEF0', overflow:'hidden',
                    background: isToday ? 'rgba(232,121,78,.10)' : isWknd ? 'rgba(0,0,0,.028)' : 'transparent' }}>
                    {scale === 'month' && <>
                      <div style={{ fontSize:11, fontWeight:800, color: isToday ? BRAND : '#374151' }}>{col.start.toLocaleDateString('fr-CA',{month:'short'}).toUpperCase()}</div>
                      <div style={{ fontSize:9.5, color:'#9CA3AF', fontWeight:600 }}>{col.start.getFullYear()}</div>
                    </>}
                    {scale === 'week' && <>
                      <div style={{ fontSize:10.5, fontWeight:800, color: isToday ? BRAND : '#374151' }}>S{weekNum(col.start)}</div>
                      <div style={{ fontSize:9, color:'#9CA3AF' }}>{col.start.toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}</div>
                    </>}
                    {scale === 'day' && <>
                      <div style={{ fontSize:10, fontWeight:800, color: isToday ? BRAND : (col.start.getDay()===0||col.start.getDay()===6 ? '#D1D5DB' : '#374151') }}>{col.start.getDate()}</div>
                      <div style={{ fontSize:8.5, color: isToday ? BRAND_DARK : '#9CA3AF' }}>{col.start.toLocaleDateString('fr-CA',{weekday:'short'}).slice(0,1).toUpperCase()}</div>
                    </>}
                    {scale === 'halfday' && <>
                      <div style={{ fontSize:10, fontWeight:800, color: isToday ? BRAND : (col.label==='AM' ? '#374151' : '#6B7280') }}>{col.label}</div>
                      {col.showDate && <div style={{ fontSize:8, color:'#9CA3AF' }}>{col.start.toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}</div>}
                    </>}
                    {scale === 'hour' && <>
                      <div style={{ fontSize:9.5, fontWeight:800, color: isToday ? BRAND : (col.start.getHours()===0 ? BRAND : '#374151') }}>{String(col.start.getHours()).padStart(2,'0')}h</div>
                      {col.start.getHours()===0 && <div style={{ fontSize:8, color:'#9CA3AF' }}>{col.start.toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}</div>}
                    </>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase rows */}
          {/* Dependency arrows SVG overlay */}
          {showArrows && Object.keys(deps).length > 0 && (() => {
            const rowH = 44; // minHeight:42 + marginBottom:2
            return (
              <svg style={{ position:'absolute', top:0, left: freezeCols ? 0 : 0, width:'100%', height:filteredPhases.length * rowH, pointerEvents:'none', zIndex:4, overflow:'visible' }}>
                {Object.entries(deps).map(([succId, predId]) => {
                  const predIdx = filteredPhases.findIndex(p => String(p.id) === String(predId));
                  const succIdx = filteredPhases.findIndex(p => String(p.id) === String(succId));
                  if (predIdx < 0 || succIdx < 0) return null;
                  const pb = getBarBounds(filteredPhases[predIdx]);
                  const sb = getBarBounds(filteredPhases[succIdx]);
                  const fixedW = CHECK_W + LABEL_W + 20 + DATE_W + DUR_W + ASSIGN_W;
                  const x1 = fixedW + pb.left + pb.width;
                  const y1 = predIdx * rowH + 21;
                  const x2 = fixedW + sb.left;
                  const y2 = succIdx * rowH + 21;
                  const cx = Math.max(x1 + 20, Math.min(x2 - 20, (x1+x2)/2));
                  return (
                    <g key={`dep-${predId}-${succId}`}>
                      <path d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                        fill="none" stroke={BRAND} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.55}/>
                      <polygon points={`${x2},${y2} ${x2-6},${y2-3} ${x2-6},${y2+3}`} fill={BRAND} opacity={0.6}/>
                    </g>
                  );
                })}
              </svg>
            );
          })()}

          {filteredPhases.map((ph, i) => {
            const { left, width, s, e, sDate, eDate } = getBarBounds(ph);
            const barColor = STATUS_FILL[ph.status] || STATUS_FILL.not_started;
            const isEven = i % 2 === 0;
            const isDragOver = dragOverIdx === i;
            const isBarDrag_ = barDrag?.phId === ph.id;
            const isResize_  = resize?.phId === ph.id;
            const matchedTrade = ph.trade_name ? tradesByName[ph.trade_name.toLowerCase()] : null;
            const progress = ph.progress_pct || 0;
            const borderColor = STATUS_BORDER[ph.status] || STATUS_BORDER.not_started;
            const isSelected = selectedIds.has(ph.id);

            const rowBg = isSelected ? '#FFF8F5' : isDragOver ? '#FFF3EE' : isEven ? '#FBFCFD' : '#fff';

            return (
              <div key={ph.id} draggable={!hasSel}
                onDragStart={ev => { if (!barDrag && !resize && !hasSel) onRowDragStart(ev, i); }}
                onDragOver={ev => onRowDragOver(ev, i)} onDrop={ev => onRowDrop(ev, i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                style={{
                  display:'flex', alignItems:'center', minHeight:42,
                  background: rowBg,
                  borderTop: isDragOver ? `2px solid ${BRAND}` : isSelected ? `2px solid ${BRAND_BORDER}` : '2px solid transparent',
                  marginBottom:2, opacity: dragIdx===i ? 0.35 : 1, transition:'opacity .15s',
                }}>
                {/* Checkbox column */}
                <div style={{ width:CHECK_W, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:rowBg, alignSelf:'stretch', ...stickyC(0) }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(ph.id)}
                    style={{ width:13, height:13, cursor:'pointer', accentColor:BRAND }}/>
                </div>
                {/* Phase section — conditionally sticky (drag handle + name) */}
                <div style={{ width:LABEL_W+20, flexShrink:0, display:'flex', alignItems:'center', background:rowBg, borderLeft:`3px solid ${borderColor}`, alignSelf:'stretch', ...stickyC(CHECK_W) }}>
                  {/* Drag handle */}
                  <div style={{ width:16, flexShrink:0, display:'flex', flexDirection:'column', gap:2.5, alignItems:'center', cursor: hasSel ? 'default' : 'grab', opacity: hasSel ? 0.05 : .2, padding:'0 2px' }}>
                    {[0,1,2].map(k=><span key={k} style={{width:10,height:1.5,background:'#6B7280',borderRadius:2,display:'block'}}/>)}
                  </div>
                  {/* Name */}
                  <div style={{ width:LABEL_W, flexShrink:0, padding:'5px 6px 5px 0', display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{minWidth:0,flex:1}}>
                      {editingId===ph.id ? (
                        <input autoFocus value={editingName} onChange={ev=>setEditingName(ev.target.value)}
                          onBlur={()=>commitEdit(ph)} onClick={ev=>ev.stopPropagation()}
                          onKeyDown={ev=>{if(ev.key==='Enter')commitEdit(ph);if(ev.key==='Escape')setEditingId(null);}}
                          style={{fontSize:12,fontWeight:700,color:'#15171C',border:`1.5px solid ${BRAND}`,borderRadius:5,padding:'2px 5px',width:'100%',outline:'none',background:'#FFF8F5'}}/>
                      ):(
                        <div onClick={()=>startEdit(ph)} title="Cliquer pour renommer"
                          style={{fontSize:12,fontWeight:700,color:'#15171C',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',cursor:'text',padding:'1px 2px',borderRadius:3}}>
                          {ph.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Date/Heure de début — conditionally sticky + récurrence icon */}
                <div style={{ width:DATE_W, flexShrink:0, padding:'0 2px', borderLeft:'1px solid #F0F1F3', alignSelf:'stretch', display:'flex', alignItems:'center', background:rowBg, position:'relative', ...stickyC(CHECK_W+LABEL_W+20) }}>
                  {editCell?.id===ph.id && editCell?.field==='datetime' ? (
                    <input
                      type="datetime-local"
                      autoFocus
                      defaultValue={ph.start_date ? `${ph.start_date.slice(0,10)}T${ph.start_time||'08:00'}` : ''}
                      onBlur={ev => {
                        if (ev.target.value) {
                          const [d,t] = ev.target.value.split('T');
                          onUpdatePhase?.(ph.id, { start_date: d, start_time: t||'08:00' });
                        }
                        setEditCell(null);
                      }}
                      onKeyDown={ev => ev.key==='Escape' && setEditCell(null)}
                      style={{ width:'100%', fontSize:11, border:`1.5px solid ${BRAND}`, borderRadius:6, padding:'3px 5px', outline:'none', background:'#FFF8F5' }}
                    />
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                      <button
                        onClick={() => setEditCell({ id:ph.id, field:'datetime' })}
                        style={{ flex:1, textAlign:'left', fontSize:11, color:ph.start_date?'#374151':'#C1C6CE', background:'transparent', border:'none', cursor:'pointer', padding:'3px 4px 3px 6px', borderRadius:5, fontFamily:'inherit', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      >
                        {ph.start_date
                          ? `${new Date(ph.start_date.slice(0,10)+'T00:00').toLocaleDateString('fr-CA',{day:'numeric',month:'short'})} ${ph.start_time||'08:00'}`
                          : '— date'}
                      </button>
                      {/* Icône récurrence */}
                      <button
                        onClick={ev => { ev.stopPropagation(); const rect = ev.currentTarget.getBoundingClientRect(); setRecurrenceEdit(recurrenceEdit?.id===ph.id ? null : { id:ph.id, rect }); setRecurrenceForm({ type: ph.recurrence_type||'weekly', count: ph.recurrence_count||2 }); }}
                        title="Récurrence"
                        style={{ flexShrink:0, padding:'3px 3px', border:'none', background:'transparent', cursor:'pointer', borderRadius:3, display:'flex', alignItems:'center', opacity: ph.recurrence_type ? 1 : 0.35 }}
                      >
                        <Repeat size={9} color={ph.recurrence_type ? BRAND : '#9CA3AF'}/>
                      </button>
                    </div>
                  )}
                </div>
                {/* Durée (h) — conditionally sticky */}
                <div style={{ width:DUR_W, flexShrink:0, padding:'0 2px', borderLeft:'1px solid #F0F1F3', alignSelf:'stretch', display:'flex', alignItems:'center', background:rowBg, ...stickyC(CHECK_W+LABEL_W+20+DATE_W) }}>
                  {editCell?.id===ph.id && editCell?.field==='duration' ? (
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      step="0.5"
                      defaultValue={ph.duration_hours ?? ''}
                      onBlur={ev => {
                        const val = ev.target.value==='' ? null : parseFloat(ev.target.value);
                        onUpdatePhase?.(ph.id, { duration_hours: val });
                        setEditCell(null);
                      }}
                      onKeyDown={ev => ev.key==='Escape' && setEditCell(null)}
                      style={{ width:'100%', fontSize:11, border:`1.5px solid ${BRAND}`, borderRadius:6, padding:'3px 5px', outline:'none', background:'#FFF8F5', textAlign:'right' }}
                    />
                  ) : (
                    <button
                      onClick={() => setEditCell({ id:ph.id, field:'duration' })}
                      style={{ width:'100%', textAlign:'right', fontSize:11, color:ph.duration_hours?'#374151':'#C1C6CE', background:'transparent', border:'none', cursor:'pointer', padding:'3px 6px', borderRadius:5, fontFamily:'inherit' }}
                    >
                      {fmtDur(ph.duration_hours)}
                    </button>
                  )}
                </div>
                {/* Assignee — conditionally sticky (last fixed col, has shadow) */}
                <div style={{width:ASSIGN_W,flexShrink:0,padding:'0 10px',borderLeft:'1px solid #F0F1F3',alignSelf:'stretch',display:'flex',alignItems:'center',background:rowBg,boxShadow: freezeCols ? '3px 0 6px rgba(0,0,0,.04)' : 'none', ...stickyC(CHECK_W+LABEL_W+20+DATE_W+DUR_W)}}>
                  <AssigneeChip trade={matchedTrade}
                    assignedToName={ph.assigned_to_name||null}
                    onSelfAssign={currentUserName ? () => onSelfAssign?.(ph.id, currentUserName) : undefined}
                    onUnassign={ph.assigned_to_name ? () => onSelfAssign?.(ph.id, null) : undefined}/>
                </div>
                {/* Gantt bar area — fixed pixel width, matches header */}
                <div style={{width:ganttW,flexShrink:0,position:'relative',height:38,background:'#F8F9FA',borderLeft:'1px solid #ECEEF0'}}>
                  {/* Grid lines + weekend overlays + today column */}
                  {columns.map((col, ci) => (
                    <div key={ci}>
                      {isTodayCol(col) && <div style={{position:'absolute',top:0,bottom:0,left:ci*colW,width:colW,background:'rgba(232,121,78,.07)',zIndex:0,pointerEvents:'none'}}/>}
                      {isWeekendCol(col) && !isTodayCol(col) && <div style={{position:'absolute',top:0,bottom:0,left:ci*colW,width:colW,background:'rgba(0,0,0,.032)',zIndex:0,pointerEvents:'none'}}/>}
                      <div style={{position:'absolute',top:0,bottom:0,left:ci*colW,width:1,background:'#ECEEF0',zIndex:1,pointerEvents:'none'}}/>
                    </div>
                  ))}
                  {/* Phase bar */}
                  <div
                    onPointerDown={ev => { handleBarDown(ev, ph); startLongPress(ev, ph); }}
                    onPointerMove={ev => { cancelLongPress(); if (isBarDrag_) handleBarMove(ev); }}
                    onPointerUp={ev => { cancelLongPress(); handleBarUp(ev, ph); }}
                    onPointerCancel={() => { cancelLongPress(); setBarDrag(null); }}
                    onMouseEnter={ev => { if (!barDrag && !resize) setTooltip({ ph, trade: matchedTrade, x: ev.clientX, y: ev.clientY }); }}
                    onMouseMove={ev => { if (tooltip && !barDrag && !resize) setTooltip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : null); }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      position:'absolute', top:5, bottom:5,
                      left: left, width: width, minWidth:8,
                      borderRadius:99, background:barColor, color:'#fff',
                      display:'flex', alignItems:'center', padding:'0 12px 0 10px',
                      cursor: isBarDrag_ ? 'grabbing' : 'grab',
                      whiteSpace:'nowrap', overflow:'hidden', zIndex:3, userSelect:'none',
                      boxShadow: isBarDrag_ ? '0 4px 16px rgba(0,0,0,.28)' : '0 1px 3px rgba(0,0,0,.12)',
                      transition: (isBarDrag_||isResize_) ? 'none' : 'box-shadow .15s',
                    }}>
                    {/* Punch / réel overlay — couleur distincte du prévu */}
                    {progress>0&&<div style={{position:'absolute',top:0,bottom:0,left:0,width:`${progress}%`,borderRadius:99,background:PUNCH_COLOR,opacity:.72,zIndex:0,pointerEvents:'none'}}/>}
                    <span style={{fontSize:10.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',position:'relative',zIndex:1,flexShrink:1,minWidth:0,
                      color: (ph.status==='not_started') ? '#374151' : '#fff'}}>
                      {ph.trade_name||ph.name}
                    </span>
                    {/* Badge récurrence */}
                    {ph.recurrence_type && (ph.recurrence_count||1) > 1 && (
                      <span style={{fontSize:8.5,fontWeight:900,marginLeft:4,opacity:.95,position:'relative',zIndex:1,flexShrink:0,
                        background:'rgba(0,0,0,.2)',borderRadius:3,padding:'1px 3px',
                        color: (ph.status==='not_started') ? '#374151' : '#fff'}}>
                        x{ph.recurrence_count}
                      </span>
                    )}
                    {progress>0&&<span style={{fontSize:9,fontWeight:800,marginLeft:2,opacity:.9,position:'relative',zIndex:1,flexShrink:0,
                      color: (ph.status==='not_started') ? '#374151' : '#fff'}}>{progress}%</span>}
                    {/* Drag delta tooltip */}
                    {isBarDrag_&&(barDrag?.delta||0)!==0&&(
                      <span style={{position:'absolute',top:-26,left:'50%',transform:'translateX(-50%)',background:'#15171C',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6,whiteSpace:'nowrap',zIndex:20,pointerEvents:'none',boxShadow:'0 2px 8px rgba(0,0,0,.3)'}}>
                        {fmtDate(sDate)} → {fmtDate(eDate)}
                      </span>
                    )}
                    {/* Resize delta tooltip */}
                    {isResize_&&(resize?.delta||0)!==0&&(
                      <span style={{position:'absolute',top:-26,left:'50%',transform:'translateX(-50%)',background:'#374151',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:6,whiteSpace:'nowrap',zIndex:20,pointerEvents:'none'}}>
                        {fmtDate(sDate)} → {fmtDate(eDate)}
                      </span>
                    )}
                    {/* Resize handles — left */}
                    <div
                      onPointerDown={ev => handleResizeDown(ev, ph, 'left')}
                      onPointerMove={ev => { if (isResize_ && resize?.side==='left') handleResizeMove(ev); }}
                      onPointerUp={ev => handleResizeUp(ev, ph)}
                      onPointerCancel={() => setResize(null)}
                      style={{position:'absolute',top:0,bottom:0,left:0,width:10,cursor:'ew-resize',zIndex:5,background:'rgba(0,0,0,.18)',borderRadius:'99px 0 0 99px'}}
                    />
                    {/* Resize handles — right */}
                    <div
                      onPointerDown={ev => handleResizeDown(ev, ph, 'right')}
                      onPointerMove={ev => { if (isResize_ && resize?.side==='right') handleResizeMove(ev); }}
                      onPointerUp={ev => handleResizeUp(ev, ph)}
                      onPointerCancel={() => setResize(null)}
                      style={{position:'absolute',top:0,bottom:0,right:0,width:10,cursor:'ew-resize',zIndex:5,background:'rgba(0,0,0,.18)',borderRadius:'0 99px 99px 0'}}
                    />
                  </div>
                  {/* Recurrence bars — même style que la barre principale + hover */}
                  {ph.recurrence_type && (ph.recurrence_count||1) > 1 && ph.start_date && (() => {
                    const REC_INTERVAL = { daily:86400000, weekly:7*86400000, biweekly:14*86400000, monthly:30*86400000 };
                    const REC_LBL = { daily:'Quotidien', weekly:'Hebdomadaire', biweekly:'Aux 2 sem.', monthly:'Mensuel' };
                    const intervalMs = REC_INTERVAL[ph.recurrence_type] || 7*86400000;
                    const baseMs = new Date(ph.start_date.slice(0,10)+'T'+(ph.start_time||'08:00')).getTime();
                    const durMs  = ph.duration_hours ? ph.duration_hours*3600000 : 8*3600000;
                    const refMs  = effRefStart.getTime();
                    const total  = ph.recurrence_count||1;
                    return Array.from({ length: total-1 }, (_, ri) => {
                      const oStartMs = baseMs + (ri+1)*intervalMs;
                      const oEndMs   = oStartMs + durMs;
                      const oLeft  = Math.max(0, Math.min(ganttW, (oStartMs - refMs) / effMs * ganttW));
                      const oWidth = Math.max(8, Math.min(ganttW - oLeft, durMs / effMs * ganttW));
                      const oStart = new Date(oStartMs);
                      const oEnd   = new Date(oEndMs);
                      const textColor = barColor === STATUS_FILL.not_started ? '#374151' : '#fff';
                      return (
                        <div key={`rec-${ri}`}
                          onMouseEnter={ev => setTooltip({ ph: { ...ph,
                            _recLabel: `Récurrence ${ri+2}/${total} — ${REC_LBL[ph.recurrence_type]||''}`,
                            _recStart: oStart, _recEnd: oEnd }, trade: matchedTrade, x: ev.clientX, y: ev.clientY })}
                          onMouseMove={ev => setTooltip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : null)}
                          onMouseLeave={() => setTooltip(null)}
                          style={{
                            position:'absolute', top:5, bottom:5,
                            left:oLeft, width:oWidth, minWidth:8,
                            borderRadius:99, background:barColor,
                            opacity: Math.max(0.35, 0.65 - ri*0.08),
                            zIndex:2, cursor:'default',
                            display:'flex', alignItems:'center', padding:'0 10px',
                            overflow:'hidden', whiteSpace:'nowrap',
                            boxShadow:'0 1px 3px rgba(0,0,0,.10)',
                          }}>
                          <span style={{ fontSize:10.5, fontWeight:700, color:textColor, overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>
                            {ph.trade_name||ph.name}
                          </span>
                          <span style={{ fontSize:8.5, fontWeight:900, color:textColor, opacity:.7, flexShrink:0, marginLeft:3 }}>
                            {ri+2}/{total}
                          </span>
                        </div>
                      );
                    });
                  })()}
                  {/* Date labels outside bar — draggable horizontally */}
                  {showDates && ph.start_date && (
                    <>
                      <div
                        onPointerDown={ev => handleDateLabelDown(ev, ph.id, true)}
                        onPointerMove={ev => handleDateLabelMove(ev, ph.id, true)}
                        onPointerUp={handleDateLabelUp}
                        onPointerCancel={handleDateLabelUp}
                        style={{position:'absolute',top:'50%',transform:'translateY(-50%)',
                          right: ganttW - left + 4 - (dateOffsets[`${ph.id}-start`]||0),
                          fontSize:9,fontWeight:700,color:'#374151',whiteSpace:'nowrap',
                          zIndex:5,cursor:'ew-resize',userSelect:'none',
                          background:'rgba(255,255,255,.85)',borderRadius:3,padding:'1px 3px',
                        }}>
                        {new Date(ph.start_date.slice(0,10)+'T'+(ph.start_time||'08:00')).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})} {ph.start_time||'08:00'}
                      </div>
                      <div
                        onPointerDown={ev => handleDateLabelDown(ev, ph.id, false)}
                        onPointerMove={ev => handleDateLabelMove(ev, ph.id, false)}
                        onPointerUp={handleDateLabelUp}
                        onPointerCancel={handleDateLabelUp}
                        style={{position:'absolute',top:'50%',transform:'translateY(-50%)',
                          left: left + width + 4 + (dateOffsets[`${ph.id}-end`]||0),
                          fontSize:9,fontWeight:700,color:'#374151',whiteSpace:'nowrap',
                          zIndex:5,cursor:'ew-resize',userSelect:'none',
                          background:'rgba(255,255,255,.85)',borderRadius:3,padding:'1px 3px',
                        }}>
                        {e.toLocaleDateString('fr-CA',{day:'numeric',month:'short'})} {String(e.getHours()).padStart(2,'0')}:{String(e.getMinutes()).padStart(2,'0')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Ligne inline "nouvelle phase" ── */}
          {addingPhase && (
            <div style={{ display:'flex', alignItems:'center', minHeight:42, background:'#fff', borderLeft:`3px solid ${BRAND_BORDER}`, marginBottom:2 }}>
              <div style={{ width:LABEL_W+20, flexShrink:0, display:'flex', alignItems:'center', background:'#fff', alignSelf:'stretch', ...stickyC(0) }}>
                <div style={{ width:16, flexShrink:0 }}/>
                <div style={{ width:LABEL_W, flexShrink:0, padding:'5px 6px 5px 0', display:'flex', alignItems:'center', gap:5 }}>
                  <button onClick={() => { setAddingPhase(false); setNewPhaseName(''); }}
                    style={{width:15,height:15,borderRadius:4,border:'1px solid #E4E7EB',background:'transparent',color:'#C1C6CE',cursor:'pointer',display:'grid',placeItems:'center',flexShrink:0}}><X size={8}/></button>
                  <input autoFocus
                    value={newPhaseName}
                    onChange={ev => setNewPhaseName(ev.target.value)}
                    placeholder="Nom de la phase…"
                    onBlur={() => { if (newPhaseName.trim()) onAddPhase?.(newPhaseName.trim()); setAddingPhase(false); setNewPhaseName(''); }}
                    onKeyDown={ev => {
                      if (ev.key==='Enter' && newPhaseName.trim()) { onAddPhase?.(newPhaseName.trim()); setAddingPhase(false); setNewPhaseName(''); }
                      if (ev.key==='Escape') { setAddingPhase(false); setNewPhaseName(''); }
                    }}
                    style={{fontSize:12,fontWeight:700,color:'#15171C',border:`1.5px solid ${BRAND}`,borderRadius:5,padding:'2px 6px',width:'100%',outline:'none',background:'#FFF8F5'}}
                  />
                </div>
              </div>
              <div style={{width:DATE_W,flexShrink:0,borderLeft:'1px solid #F0F1F3',alignSelf:'stretch',background:'#fff',...stickyC(CHECK_W+LABEL_W+20)}}/>
              <div style={{width:DUR_W,flexShrink:0,borderLeft:'1px solid #F0F1F3',alignSelf:'stretch',background:'#fff',...stickyC(CHECK_W+LABEL_W+20+DATE_W)}}/>
              <div style={{width:ASSIGN_W,flexShrink:0,borderLeft:'1px solid #F0F1F3',alignSelf:'stretch',background:'#fff',...stickyC(CHECK_W+LABEL_W+20+DATE_W+DUR_W)}}/>
              <div style={{width:ganttW,flexShrink:0,height:38,background:'#F8F9FA',borderLeft:'1px solid #ECEEF0'}}/>
            </div>
          )}
          {/* ── + Phase en bas du tableau ── */}
          <div style={{ padding:'8px 16px', borderTop:'1px solid #F0F2F4' }}>
            <button onClick={() => setAddingPhase(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:5, border:`1.5px dashed ${BRAND_BORDER}`, background:'transparent', color:BRAND_DARK, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <Plus size={12}/> Ajouter une phase
            </button>
          </div>
        </div>
      </div>

      {/* ── Status picker (long press on bar) ── */}
      {statusPicker && (
        <div style={{ position:'fixed', zIndex:9999, top: statusPicker.y - 8, left: statusPicker.x + 8,
          background:'#fff', border:'1px solid #E5E7EB', borderRadius:10, padding:'8px', boxShadow:'0 6px 24px rgba(0,0,0,.16)', minWidth:160 }}
          onClick={ev => ev.stopPropagation()}>
          <div style={{ fontSize:10, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6, padding:'0 4px' }}>Statut de la phase</div>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => { onUpdatePhase?.(statusPicker.phId, { status: key }); setStatusPicker(null); }}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'6px 8px', border:'none', background:'transparent', cursor:'pointer', borderRadius:6, textAlign:'left',
                color: STATUS_FILL[key]==='#D1D5DB' ? '#374151' : '#fff', fontSize:11, fontWeight:600,
                backgroundColor: STATUS_FILL[key] }}>
              {label}
            </button>
          ))}
        </div>
      )}
      {statusPicker && <div style={{ position:'fixed', inset:0, zIndex:9998 }} onClick={() => setStatusPicker(null)}/>}

      {/* ── Bulk action bar (fixed bottom) ── */}
      {hasSel && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:9990,
          background:'#15171C', borderRadius:12, padding:'8px 12px', boxShadow:'0 8px 32px rgba(0,0,0,.4)',
          display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', maxWidth:'90vw' }}>
          <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, flexShrink:0 }}>{selectedIds.size} sélectionné{selectedIds.size>1?'s':''}</span>
          <div style={{ width:1, height:16, background:'rgba(255,255,255,.15)', flexShrink:0 }}/>

          {/* Mode modifier — formulaire multi-champs simultanés */}
          {bulkPanel === 'edit' && (
            <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
              <select value={bulkForm.status||''} onChange={ev=>setBulkForm(f=>({...f,status:ev.target.value}))}
                style={{ fontSize:11, borderRadius:5, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.08)', color:'#E5E7EB', padding:'4px 6px', outline:'none' }}>
                <option value="">Statut…</option>
                {Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k} style={{background:'#15171C'}}>{v}</option>)}
              </select>
              <input type="date" value={bulkForm.start_date||''} onChange={ev=>setBulkForm(f=>({...f,start_date:ev.target.value}))}
                title="Date de début" style={{ fontSize:11, borderRadius:5, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.08)', color:'#E5E7EB', padding:'4px 6px', outline:'none', colorScheme:'dark' }}/>
              <input type="number" min="0.25" step="0.25" value={bulkForm.duration_hours||''} placeholder="Durée (h)"
                onChange={ev=>setBulkForm(f=>({...f,duration_hours:ev.target.value}))}
                style={{ width:90, fontSize:11, borderRadius:5, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.08)', color:'#E5E7EB', padding:'4px 6px', outline:'none' }}/>
              <input value={bulkForm.assigned_to_name||''} placeholder="Assigné…"
                onChange={ev=>setBulkForm(f=>({...f,assigned_to_name:ev.target.value}))}
                style={{ width:110, fontSize:11, borderRadius:5, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.08)', color:'#E5E7EB', padding:'4px 6px', outline:'none' }}/>
              <button onClick={applyBulk}
                style={{ padding:'5px 12px', borderRadius:7, border:'none', background:BRAND, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
                Appliquer
              </button>
            </div>
          )}
          {bulkPanel === 'dep' && (
            <span style={{ fontSize:10, color:'#9CA3AF' }}>
              {depFirst ? `Lier → ${phases.find(p=>p.id===depFirst)?.name||'?'}` : 'Cliquer sur le prédécesseur dans la liste…'}
            </span>
          )}

          {/* Boutons d'action */}
          <div style={{ display:'flex', gap:4, flexShrink:0, marginLeft:'auto' }}>
            <button onClick={() => setBulkPanel(bulkPanel==='edit'?null:'edit')}
              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${bulkPanel==='edit'?BRAND:'rgba(255,255,255,.15)'}`,
                background: bulkPanel==='edit' ? BRAND : 'rgba(255,255,255,.07)', color:'#E5E7EB', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              Modifier
            </button>
            {currentUserName && (
              <button onClick={() => { setBulkPanel('self'); applyBulk(); }}
                style={{ padding:'5px 10px', borderRadius:7, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.07)', color:'#E5E7EB', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                M'assigner
              </button>
            )}
            <button onClick={() => setBulkPanel(bulkPanel==='dep'?null:'dep')}
              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${bulkPanel==='dep'?BRAND:'rgba(255,255,255,.15)'}`,
                background: bulkPanel==='dep' ? BRAND : 'rgba(255,255,255,.07)', color:'#E5E7EB', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              Lier
            </button>
            <button onClick={() => setBulkPanel(bulkPanel==='delete'?null:'delete')}
              style={{ padding:'5px 10px', borderRadius:7, border:'1px solid rgba(239,68,68,.4)', background:'rgba(255,255,255,.07)', color:'#F87171', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              {bulkPanel==='delete' ? '✓ Confirmer' : 'Supprimer'}
            </button>
            {bulkPanel==='delete' && (
              <button onClick={applyBulk}
                style={{ padding:'5px 10px', borderRadius:7, border:'none', background:'#EF4444', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                Oui, supprimer
              </button>
            )}
          </div>
          <button onClick={clearSelection}
            style={{ padding:'5px 8px', borderRadius:7, border:'1px solid rgba(255,255,255,.15)', background:'transparent', color:'#9CA3AF', fontSize:11, cursor:'pointer', marginLeft:4 }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Recurrence popover (fixed, hors contexte sticky) ── */}
      {recurrenceEdit && (() => {
        const ph = phases.find(p => p.id === recurrenceEdit.id);
        if (!ph) return null;
        const r = recurrenceEdit.rect;
        return (
          <div onClick={ev => ev.stopPropagation()}
            style={{ position:'fixed', top: r.bottom + 4, left: r.left, zIndex:9998,
              background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'12px 14px',
              boxShadow:'0 6px 20px rgba(0,0,0,.13)', minWidth:210 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
              <Repeat size={11} color={BRAND}/> Récurrence
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <select value={recurrenceForm.type}
                onChange={ev => setRecurrenceForm(f=>({...f, type:ev.target.value}))}
                style={{ fontSize:11, border:'1px solid #E5E7EB', borderRadius:5, padding:'5px 7px', outline:'none', fontFamily:'inherit', background:'#fff' }}>
                <option value="">Aucune</option>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Aux 2 semaines</option>
                <option value="monthly">Mensuel</option>
              </select>
              {recurrenceForm.type && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input type="number" min="1" max="52" value={recurrenceForm.count}
                    onChange={ev => setRecurrenceForm(f=>({...f, count:Math.max(1,parseInt(ev.target.value)||1)}))}
                    style={{ width:44, fontSize:11, border:'1px solid #E5E7EB', borderRadius:5, padding:'5px 6px', outline:'none', textAlign:'center' }}/>
                  <span style={{ fontSize:11, color:'#6B7280' }}>occurrences</span>
                </div>
              )}
              <div style={{ display:'flex', gap:5, marginTop:2 }}>
                <button
                  onClick={() => {
                    const updates = recurrenceForm.type
                      ? { recurrence_type: recurrenceForm.type, recurrence_count: recurrenceForm.count }
                      : { recurrence_type: null, recurrence_count: null };
                    onUpdatePhase?.(ph.id, updates);
                    setRecurrenceEdit(null);
                  }}
                  style={{ flex:1, padding:'6px', borderRadius:5, border:'none', background:BRAND, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                  Appliquer
                </button>
                <button onClick={() => setRecurrenceEdit(null)}
                  style={{ padding:'6px 8px', borderRadius:5, border:'1px solid #E5E7EB', background:'#fff', color:'#9CA3AF', fontSize:11, cursor:'pointer' }}>
                  <X size={11}/>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Hover tooltip (fixed position) ── */}
      {tooltip && (
        <div style={{
          position:'fixed', zIndex:9999, pointerEvents:'none',
          top: tooltip.y - 16, left: tooltip.x + 14,
          transform:'translateY(-100%)',
          background:'#15171C', color:'#fff', borderRadius:10,
          padding:'10px 14px', fontSize:12, maxWidth:240,
          boxShadow:'0 8px 28px rgba(0,0,0,.32)',
        }}>
          {(() => {
            const tph = tooltip.ph;
            const tStart = tph._recStart || (tph.start_date ? new Date(tph.start_date.slice(0,10) + 'T' + (tph.start_time||'08:00')) : null);
            const tEnd   = tph._recEnd || (tph.duration_hours && tStart
              ? new Date(tStart.getTime() + Number(tph.duration_hours)*3600000)
              : tph.end_date ? new Date(tph.end_date.slice(0,10) + 'T17:00') : null);
            const fmtDT  = (d) => d ? d.toLocaleDateString('fr-CA',{day:'numeric',month:'short'}) + ' ' + String(d.getHours()).padStart(2,'0') + 'h' + String(d.getMinutes()).padStart(2,'0') : '';
            const REC_LBL = { daily:'Quotidien', weekly:'Hebdomadaire', biweekly:'Aux 2 sem.', monthly:'Mensuel' };
            return (<>
              {tph._recLabel && <div style={{ fontSize:10, color:BRAND, fontWeight:700, marginBottom:3 }}>{tph._recLabel}</div>}
              <div style={{ fontWeight:800, fontSize:13, marginBottom:4 }}>{tph.name}</div>
              {tph.trade_name && <div style={{ color:'#9CA3AF', fontSize:11, marginBottom:2 }}>Corps: {tph.trade_name}</div>}
              {tStart && (
                <div style={{ color:'#D1D5DB', fontSize:11, marginBottom:2 }}>
                  {fmtDT(tStart)}{tEnd ? ` → ${fmtDT(tEnd)}` : ''}
                </div>
              )}
              {tph.duration_hours && (
                <div style={{ color:'#9CA3AF', fontSize:11, marginBottom:2 }}>Durée : {fmtDur(tph.duration_hours)}</div>
              )}
              {tph.status && (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, marginTop:4 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_FILL[tph.status]||'#9CA3AF', display:'block', flexShrink:0 }}/>
                  <span style={{ color:'#9CA3AF' }}>{STATUS_LABELS[tph.status]||tph.status}</span>
                </div>
              )}
              {tph.recurrence_type && (
                <div style={{ color:'#C4B5FD', fontSize:11, marginTop:4 }}>
                  <Repeat size={10} style={{display:'inline',verticalAlign:'middle',marginRight:4}}/>{REC_LBL[tph.recurrence_type]||tph.recurrence_type} × {tph.recurrence_count||1}
                </div>
              )}
              {(tph.progress_pct||0) > 0 && (
                <div style={{ marginTop:6 }}>
                  <div style={{ height:4, background:'#374151', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${tph.progress_pct}%`, background:PUNCH_COLOR, borderRadius:4 }}/>
                  </div>
                  <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{tph.progress_pct}% réel (punch)</div>
                </div>
              )}
              {tooltip.trade?.subcontractor_name && (
                <div style={{ marginTop:6, fontSize:11, color:BRAND, fontWeight:700 }}>{tooltip.trade.subcontractor_name}</div>
              )}
            </>);
          })()}
        </div>
      )}
    </>
  );
}

function PhaseModal({ projectId, phase, onClose, onSave, trades }) {
  const [form, setForm] = useState(phase ? {
    name:phase.name||'', start_date:phase.start_date?phase.start_date.slice(0,10):'',
    end_date:phase.end_date?phase.end_date.slice(0,10):'', progress_pct:phase.progress_pct||0,
    status:phase.status||'not_started', trade_name:phase.trade_name||''
  } : { name:'', start_date:'', end_date:'', progress_pct:0, status:'not_started', trade_name:'' });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      let data;
      if (phase) {
        const res = await projectsApi.updatePhase(projectId, phase.id, form);
        data = res.data;
      } else {
        const res = await projectsApi.addPhase(projectId, form);
        data = res.data;
      }
      onSave(data, !!phase);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-semibold text-gray-900 mb-4">{phase?'Modifier la phase':'Nouvelle phase'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Nom *</label><input className="input" value={form.name} onChange={f('name')} required/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Début</label><input className="input" type="date" value={form.start_date} onChange={f('start_date')}/></div>
            <div><label className="label">Fin</label><input className="input" type="date" value={form.end_date} onChange={f('end_date')}/></div>
          </div>
          <div>
            <label className="label">Corps de métier (optionnel)</label>
            {trades?.length ? (
              <select className="input" value={form.trade_name} onChange={f('trade_name')}>
                <option value="">— Aucun —</option>
                {trades.map(t => <option key={t.id} value={t.trade}>{t.trade}</option>)}
              </select>
            ) : (
              <input className="input" value={form.trade_name} onChange={f('trade_name')} placeholder="Ex: Électricité"/>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Avancement ({form.progress_pct}%)</label>
              <input className="w-full" type="range" min="0" max="100" value={form.progress_pct} onChange={f('progress_pct')}/>
            </div>
            <div><label className="label">Statut</label>
              <select className="input" value={form.status} onChange={f('status')}>
                {Object.entries(PS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving&&<Loader2 size={14} className="animate-spin"/>} {phase?'Enregistrer':'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FIELD_STATUS = {
  ok:    { label: 'Conforme',     color: '#22c55e' },
  watch: { label: 'À surveiller', color: '#f59e0b' },
  issue: { label: 'Problème',     color: '#ef4444' },
};

// Édition de l'en-tête riche du projet.
function InfoModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    payment_terms: project.payment_terms || '',
    project_manager: project.project_manager || '',
    materials_buyer: project.materials_buyer || '',
    permits_responsible: project.permits_responsible || '',
    permits_required: !!project.permits_required,
    approvers: (project.approvers || []).join(', '),
    machines: (project.machines || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        payment_terms: form.payment_terms || null,
        project_manager: form.project_manager || null,
        materials_buyer: form.materials_buyer || null,
        permits_responsible: form.permits_responsible || null,
        permits_required: form.permits_required,
        approvers: form.approvers.split(',').map((s) => s.trim()).filter(Boolean),
        machines: form.machines.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const { data } = await projectsApi.update(project.id, payload);
      onSave(data);
    } catch {} finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-4">Infos du projet</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Termes de paiement</label><input className="input" value={form.payment_terms} onChange={f('payment_terms')} placeholder="30% dépôt · 40% mi-chantier · 30% fin"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Chargé de projet</label><input className="input" value={form.project_manager} onChange={f('project_manager')} placeholder="Nom"/></div>
            <div><label className="label">Acheteur matériaux</label><input className="input" value={form.materials_buyer} onChange={f('materials_buyer')} placeholder="Nom"/></div>
          </div>
          <div><label className="label">Approbateurs (séparés par des virgules)</label><input className="input" value={form.approvers} onChange={f('approvers')} placeholder="Marie, Jean"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Responsable des permis</label><input className="input" value={form.permits_responsible} onChange={f('permits_responsible')} placeholder="Nom"/></div>
            <label className="flex items-center gap-2 text-sm text-gray-600 mt-6"><input type="checkbox" checked={form.permits_required} onChange={(e) => setForm((p) => ({ ...p, permits_required: e.target.checked }))}/> Permis requis</label>
          </div>
          <div><label className="label">Machines / équipements (virgules)</label><input className="input" value={form.machines} onChange={f('machines')} placeholder="Excavatrice, échafaudage, nacelle"/></div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving && <Loader2 size={14} className="animate-spin"/>} Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Checklist terrain (générée par métier à l'onboarding) → estimation IA du prix global.
function FieldEstimation({ project, onUpdated }) {
  const checklists = project.field_checklists || {};
  const tradeKeys = Object.keys(checklists);
  const initial = project.field_assessment || {};
  const [checks, setChecks] = useState(initial.checks || {});
  const [notOnSite, setNotOnSite] = useState(!!initial.not_on_site);
  const [estimate, setEstimate] = useState(initial.ai_estimate || null);
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [msg, setMsg] = useState(null);
  const saveTimer = useRef(null);

  const persist = (nextChecks, nextNotOnSite) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      projectsApi.update(project.id, {
        field_assessment: { ...initial, checks: nextChecks, not_on_site: nextNotOnSite },
      }).catch(() => {});
    }, 900);
  };

  const setItem = (key, label, patch) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: { label, ...(prev[key] || {}), ...patch } };
      persist(next, notOnSite);
      return next;
    });
  };

  const runEstimate = async () => {
    setEstimating(true); setMsg(null);
    try {
      const { data } = await projectsApi.estimateField(project.id, { field_assessment: { checks, not_on_site: notOnSite } });
      setEstimate(data.estimate);
      onUpdated?.();
    } catch { setMsg({ err: true, text: "L'estimation a échoué. Réessaie." }); }
    finally { setEstimating(false); }
  };

  const sendPrice = async () => {
    setSending(true);
    try {
      const { data } = await projectsApi.sendPrice(project.id, { price: estimate?.expected_price });
      setMsg({ err: false, text: data.message });
      onUpdated?.();
    } catch {} finally { setSending(false); }
  };

  const requestMedia = async () => {
    setRequesting(true);
    try {
      const items = tradeKeys.flatMap((t) => checklists[t] || []);
      const { data } = await projectsApi.requestClientMedia(project.id, {
        items, message: "Peux-tu m'envoyer des photos/vidéos de ces éléments pour finaliser l'estimation?",
      });
      setMsg({ err: false, text: data.message });
    } catch {} finally { setRequesting(false); }
  };

  if (!tradeKeys.length) {
    return (
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-2"><ClipboardCheck size={15} className="text-brand"/><h2 className="font-semibold text-gray-900 text-sm">Estimation terrain</h2></div>
        <p className="text-xs text-gray-400">Les listes de vérification terrain sont générées selon les corps de métier choisis à l'onboarding. Complète ton profil métier pour les activer ici.</p>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><ClipboardCheck size={15} className="text-brand"/><h2 className="font-semibold text-gray-900 text-sm">Estimation terrain</h2></div>
        <label className="flex items-center gap-1.5 text-xs text-gray-500"><input type="checkbox" checked={notOnSite} onChange={(e) => { setNotOnSite(e.target.checked); persist(checks, e.target.checked); }}/> Pas sur place</label>
      </div>

      {notOnSite && (
        <div className="mb-3 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between gap-3">
          <p className="text-xs text-orange-700">Demande au client des photos/vidéos pour répondre à la checklist à distance.</p>
          <button className="btn-secondary text-xs flex-shrink-0" onClick={requestMedia} disabled={requesting}>{requesting ? <Loader2 size={12} className="animate-spin"/> : <Camera size={12}/>} Demander au client</button>
        </div>
      )}

      <div className="space-y-4">
        {tradeKeys.map((trade) => (
          <div key={trade}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{trade.replace(/_/g, ' ')}</p>
            <div className="space-y-1.5">
              {(checklists[trade] || []).map((label, i) => {
                const key = `${trade}__${i}`;
                const item = checks[key] || {};
                return (
                  <div key={key} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{label}</p>
                      {item.status && (
                        <input className="input mt-1 py-1 text-xs" placeholder="Note (mesure, état, problème…)" value={item.note || ''} onChange={(e) => setItem(key, label, { note: e.target.value })}/>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {Object.entries(FIELD_STATUS).map(([k, v]) => (
                        <button key={k} onClick={() => setItem(key, label, { status: item.status === k ? '' : k })} title={v.label}
                          className="w-6 h-6 rounded-full border text-[10px] font-bold flex items-center justify-center transition-colors"
                          style={item.status === k ? { background: v.color, borderColor: v.color, color: '#fff' } : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                          {v.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary w-full mt-4" onClick={runEstimate} disabled={estimating}>
        {estimating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} Estimer le prix global (IA)
      </button>

      {estimate && (
        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-end justify-between gap-3 mb-2">
            <div>
              <p className="text-xs text-gray-400">Prix global estimé</p>
              <p className="text-2xl font-bold text-gray-900">{money(estimate.expected_price)}</p>
              <p className="text-xs text-gray-400">Fourchette {money(estimate.low_price)} – {money(estimate.high_price)} · confiance {estimate.confidence}</p>
            </div>
            <button className="btn-primary text-xs flex-shrink-0" onClick={sendPrice} disabled={sending}>{sending ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>} Envoyer au client</button>
          </div>
          {estimate.breakdown?.length > 0 && (
            <div className="mt-2 space-y-1">
              {estimate.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-xs gap-3"><span className="text-gray-600">{b.poste}</span><span className="text-gray-900 font-medium flex-shrink-0">{money(b.amount)}</span></div>
              ))}
            </div>
          )}
          {estimate.assumptions?.length > 0 && <p className="text-[11px] text-gray-400 mt-2"><strong>Hypothèses :</strong> {estimate.assumptions.join(' · ')}</p>}
          {estimate.missing_info?.length > 0 && <p className="text-[11px] text-orange-500 mt-1"><strong>À préciser :</strong> {estimate.missing_info.join(' · ')}</p>}
          {estimate.notes && <p className="text-[11px] text-gray-500 mt-1">{estimate.notes}</p>}
        </div>
      )}

      {msg && <p className={`text-xs mt-2 ${msg.err ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</p>}
      {project.price_sent_at && !msg && <p className="text-xs text-gray-400 mt-2">Prix envoyé le {new Date(project.price_sent_at).toLocaleDateString('fr-CA')}.</p>}
    </div>
  );
}

function KvTooltipChip({ chip }) {
  const [show, setShow] = useState(false);
  const pos = chip.label.includes('Marge') && chip.value ? parseFloat(chip.value) >= 0 : null;
  return (
    <div className="kv" style={{ background: chip.bg, border: chip.border, position: 'relative', userSelect: 'none' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div className="kv-k">{chip.label}</div>
      <div className="kv-v" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: pos === false ? '#DC2626' : pos === true ? '#16a34a' : undefined }}>
        {chip.dot && <span style={{ width: 9, height: 9, borderRadius: '50%', background: chip.dot, display: 'inline-block', flexShrink: 0 }}/>}
        {chip.value}
        {chip.extra && <span style={{ fontSize: 11, opacity: .7 }}>· {chip.extra}</span>}
      </div>
      {show && chip.tooltip && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 9px)', left: '50%', transform: 'translateX(-50%)', background: '#15171C', color: '#fff', fontSize: 11.5, padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap', zIndex: 500, pointerEvents: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.22)', lineHeight: 1.5 }}>
          {chip.tooltip}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #15171C' }}/>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const t = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [genQr, setGenQr] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [showPhase, setShowPhase] = useState(false);
  const [editPhase, setEditPhase] = useState(null);
  const [tradeRecos, setTradeRecos] = useState(null);
  const [loadingTradeRecos, setLoadingTradeRecos] = useState(false);
  const [autoAddingTrades, setAutoAddingTrades] = useState(false);
  const [tradeCertifs, setTradeCertifs] = useState(() => { try { return JSON.parse(localStorage.getItem(`monflux-trade-certifs-${id}`) || '{}'); } catch { return {}; } });
  const [generatingPhases, setGeneratingPhases] = useState(false);
  const [addingTemplatePhase, setAddingTemplatePhase] = useState(null);
  const [projectInvoices, setProjectInvoices] = useState([]);
  const [projectQuotes, setProjectQuotes] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimer = useRef(null);
  const [quittance, setQuittance] = useState(null);
  const [showQuittanceForm, setShowQuittanceForm] = useState(false);
  const [quittanceForm, setQuittanceForm] = useState({ client_name:'', client_email:'', project_description:'', amount_paid:'', notes:'' });
  const [savingQuittance, setSavingQuittance] = useState(false);
  const [portalCopied, setPortalCopied] = useState(false);
  const [resettingPortal, setResettingPortal] = useState(false);
  const [changeOrdersList, setChangeOrdersList] = useState([]);
  const [showCOForm, setShowCOForm] = useState(false);
  const [coForm, setCoForm] = useState({ title:'', description:'', amount:'', notes:'' });
  const [savingCO, setSavingCO] = useState(false);
  const [copiedCO, setCopiedCO] = useState(null);
  const [portalMessages, setPortalMessages] = useState([]);
  // Batch J — rentabilité, corps de métiers, dépenses, aperçu documents
  const [profit, setProfit] = useState(null);
  const [subs, setSubs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeForm, setTradeForm] = useState({ trade: '', estimated_cost: '', chosen_subcontractor_id: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ type: 'supplier_invoice', description: '', amount: '', expense_date: '' });
  const [laborRate, setLaborRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [tocSections, setTocSections] = useState(() => {
    const validIds = new Set(DETAIL_TOC_SECTIONS.map(s => s.id));
    try {
      const saved = JSON.parse(localStorage.getItem(`monflux-toc-order-${id}`) || 'null');
      if (saved) {
        // Toujours utiliser les labels/icônes du code (pas du localStorage qui peut être périmé)
        const filtered = saved
          .filter(s => validIds.has(s.id))
          .map(s => DETAIL_TOC_SECTIONS.find(d => d.id === s.id) || s);
        const savedIds = new Set(filtered.map(s => s.id));
        const missing = DETAIL_TOC_SECTIONS.filter(s => !savedIds.has(s.id));
        return [...filtered, ...missing];
      }
    } catch {}
    return DETAIL_TOC_SECTIONS;
  });
  const [hiddenSections, setHiddenSections] = useState(() => {
    try { const s = localStorage.getItem(`monflux-toc-hidden-${id}`); if (s) return JSON.parse(s); } catch {}
    return [];
  });
  const [dragSrcIdx, setDragSrcIdx] = useState(null);
  // B4 — Vente
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [quoteBuilderQuote, setQuoteBuilderQuote] = useState(null);
  const [quoteBuilderItems, setQuoteBuilderItems] = useState([]);
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [projectRfqs, setProjectRfqs] = useState([]);
  const [showRfqForm, setShowRfqForm] = useState(false);
  const [rfqForm, setRfqForm] = useState({ title: '', specialty: '', description: '', deadline: '' });
  const [showInviteModal, setShowInviteModal] = useState(null);
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [projectContracts, setProjectContracts] = useState([]);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [contractSendingId, setContractSendingId] = useState(null);
  const [showContractContent, setShowContractContent] = useState(null);
  const quoteTimer = useRef(null);
  // B6 — Chantier
  const [materialOrders, setMaterialOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ supplier: '', order_number: '', description: '', total_amount: '', order_date: '', expected_date: '' });
  // B7 — IA chantier
  const [media, setMedia] = useState([]);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [mediaForm, setMediaForm] = useState({ type: 'photo', url: '', mime_type: '', caption: '', transcript: '' });
  const [analyzingMediaId, setAnalyzingMediaId] = useState(null);
  const [purchasePlan, setPurchasePlan] = useState(null);
  const [groupingPurchases, setGroupingPurchases] = useState(false);
  const [coImpact, setCoImpact] = useState({});   // { [coId]: impactObj }
  const [analyzingCoId, setAnalyzingCoId] = useState(null);
  const [aiNotice, setAiNotice] = useState('');
  const [activeSection, setActiveSection] = useState('s-ai');
  const [statusPopup, setStatusPopup] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [estimTab, setEstimTab] = useState('voieB');
  const [showClientReply, setShowClientReply] = useState(false);
  const [clientReplyText, setClientReplyText] = useState('');
  const [autreTexts, setAutreTexts] = useState({});
  const [estimMsg, setEstimMsg] = useState('');
  const [estimInspoPhotos, setEstimInspoPhotos] = useState([]);
  const [estimInspoInput, setEstimInspoInput] = useState('');
  const [relanceCount, setRelanceCount] = useState(() => { try { return Number(localStorage.getItem(`monflux-relances-count-${id}`) || 2); } catch { return 2; } });
  const [relanceMethods, setRelanceMethods] = useState(() => { try { return JSON.parse(localStorage.getItem(`monflux-relances-methods-${id}`) || '["email"]'); } catch { return ['email']; } });
  const [relanceFrequency, setRelanceFrequency] = useState(() => { try { return Number(localStorage.getItem(`monflux-relances-freq-${id}`) || 7); } catch { return 7; } });
  const [estimMsgCopied, setEstimMsgCopied] = useState(false);
  const estimMsgRef = useRef(null);
  const userEditedEstimMsg = useRef(false);
  const [clientMsgCopied, setClientMsgCopied] = useState(false);
  const [searchingPrices, setSearchingPrices] = useState(false);
  const [aiPriceResult, setAiPriceResult] = useState(null); // { comments, sources: [{label,url}] }
  const [sqUnit, setSqUnit] = useState('sqft');
  const [sqRate, setSqRate] = useState('');
  const [sqArea, setSqArea] = useState('');
  const clientMsgRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: proj }, { data: ts }, { data: invs }, { data: qs }, { data: quits }, { data: cos }, { data: msgs }, { data: prof }, { data: subList }, { data: projQuotes }, { data: rfqList }, { data: contractList }, { data: orderList }, { data: mediaList }] = await Promise.all([
        projectsApi.get(id),
        tsApi.list({ project_id: id }),
        invoicesApi.list({ project_id: id }),
        quotesApi.list(),
        quittancesApi.list({ project_id: id }),
        changeOrdersApi.list({ project_id: id }),
        projectsApi.getPortalMessages(id).catch(() => ({ data: [] })),
        projectsApi.profitability(id).catch(() => ({ data: null })),
        subsApi.list().catch(() => ({ data: [] })),
        quotesApi.byProject(id).catch(() => ({ data: [] })),
        rfqsApi.byProject(id).catch(() => ({ data: [] })),
        contractsApi.list({ project_id: id }).catch(() => ({ data: [] })),
        materialOrdersApi.byProject(id).catch(() => ({ data: [] })),
        siteMediaApi.byProject(id).catch(() => ({ data: [] })),
      ]);
      setProject(proj);
      setTimesheets(ts);
      setProjectInvoices(invs);
      setProjectQuotes(qs.filter(q => q.project_id === id));
      setQuittance(quits?.[0] || null);
      setChangeOrdersList(cos || []);
      setPortalMessages(msgs || []);
      setNotes(proj.notes || '');
      setProfit(prof);
      setSubs(subList || []);
      setLaborRate(prof?.actual?.cost_breakdown?.labor_cost_rate ? String(prof.actual.cost_breakdown.labor_cost_rate) : '');
      // B4 — quote builder, RFQs, contracts
      const firstQuote = projQuotes?.[0] || null;
      setQuoteBuilderQuote(firstQuote);
      setQuoteBuilderItems(firstQuote?.items || []);
      setProjectRfqs(rfqList || []);
      setProjectContracts(contractList || []);
      setMaterialOrders(orderList || []);
      setMedia(mediaList || []);
      // pré-charge les impacts d'avenants déjà calculés
      const impacts = {};
      (cos || []).forEach(co => { if (co.ai_impact) impacts[co.id] = co.ai_impact; });
      setCoImpact(impacts);
      // QR punch — restore from field_assessment (permanent) or generate once
      const fa = proj.field_assessment || {};
      if (fa.qr_image) {
        setQrData({ qr_image: fa.qr_image, url: fa.qr_url });
      } else {
        try {
          const { data: qr } = await punchApi.generate({ project_id: id, label: proj.name });
          setQrData(qr);
          const nextFa = { ...fa, qr_image: qr.qr_image, qr_url: qr.url };
          await projectsApi.update(id, { field_assessment: nextFa });
          setProject(p => ({ ...p, field_assessment: nextFa }));
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  const refreshProfit = async () => {
    try { const { data } = await projectsApi.profitability(id); setProfit(data); } catch {}
  };

  const saveNotes = async (val) => {
    setNotesSaving(true);
    try { await projectsApi.update(id, { notes: val }); }
    catch {} finally { setNotesSaving(false); }
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 1200);
  };

  const saveField = async (field, value) => {
    try {
      const payload = Array.isArray(project[field])
        ? { [field]: String(value).split(',').map(s => s.trim()).filter(Boolean) }
        : { [field]: value || null };
      const { data } = await projectsApi.update(id, payload);
      setProject(p => ({ ...p, ...data }));
      window.dispatchEvent(new CustomEvent('monflux:project-updated', { detail: { id: Number(id), ...payload } }));
    } catch {}
  };

  const saveAssessmentField = async (key, value) => {
    const next = { ...(project.field_assessment || {}), [key]: value };
    try {
      await projectsApi.update(id, { field_assessment: next });
      setProject(p => ({ ...p, field_assessment: next }));
    } catch {}
  };

  const saveClientField = async (field, value) => {
    const map = { name: 'client_name', email: 'client_email', phone: 'client_phone', notes: 'client_notes' };
    const stateKey = map[field] || `client_${field}`;
    setProject(p => ({ ...p, [stateKey]: value }));
    // Toujours sauvegarder sur le projet — garantit la persistance au rechargement
    try {
      const { data } = await projectsApi.update(id, { [stateKey]: value || null });
      setProject(p => ({ ...p, ...data }));
      window.dispatchEvent(new CustomEvent('monflux:project-updated', { detail: { id: Number(id), [stateKey]: value } }));
    } catch {}
    // Si un contact est lié, mettre aussi à jour le contact
    if (project.client_id) {
      try { await contactsApi.update(project.client_id, { [field]: value || null }); } catch {}
    }
  };

  useEffect(() => { load(); }, [id]);

  // Auto-générer le message d'estimation quand le projet ou les résultats IA changent
  const buildEstimMsg = (proj, aiResult) => {
    if (!proj) return '';
    const fa = proj.field_assessment || {};
    const approxLines = fa.approx_lines || [];
    const aiScenarios = aiResult?.scenarios || [];
    const total = approxLines.reduce((s, l) => s + (Number(l.total) || 0), 0);
    const mid = aiScenarios.find(s => (s.label||'').toLowerCase().includes('moyen')) || aiScenarios[1] || aiScenarios[0];
    const estAmount = total > 0 ? money(total) : mid ? `${money(mid.min)} – ${money(mid.max)}` : null;
    const startLabel = fa.start_label || (proj.start_date ? proj.start_date.slice(0,10) : '');
    const endLabel = fa.end_label || (proj.end_date ? proj.end_date.slice(0,10) : '');
    const trades = resolveTradeLabels(fa.selected_trades || []);
    const descContext = proj.description || fa.work_type || '';

    const lines = [];
    const prenom = (proj.client_name || '').split(' ')[0] || 'toi';
    lines.push(`Bonjour ${prenom},`);
    lines.push('');
    if (descContext) {
      lines.push(`J'ai bien regardé ta demande pour ${descContext.toLowerCase().startsWith('réno') || descContext.toLowerCase().startsWith('remo') ? descContext : `les travaux de ${descContext}`}.${proj.address ? ` Je voulais te faire un retour rapide sur le projet à ${proj.address}.` : ''}`);
    } else {
      lines.push(`Je voulais te faire un retour rapide concernant ton projet${proj.address ? ` à ${proj.address}` : ''}.`);
    }
    lines.push('');
    if (estAmount) {
      lines.push(`Selon les informations que j'ai en main, mon estimation approximative se situe autour de **${estAmount}**.`);
    } else {
      lines.push(`Je finalise encore les détails de mon estimation et je reviens vers toi très bientôt avec un montant.`);
    }
    if (trades.length) {
      lines.push(`Ça couvre : ${trades.join(', ')}.`);
    }
    if (startLabel || endLabel) {
      lines.push(`Pour le calendrier, je vise ${startLabel && endLabel ? `une réalisation entre le ${startLabel} et le ${endLabel}` : startLabel ? `un début autour du ${startLabel}` : `une fin autour du ${endLabel}`}.`);
    }
    lines.push('');
    lines.push(`Garde en tête que c'est une estimation approximative — pour un prix ferme, je te prépare une soumission complète après ma visite.`);
    lines.push('');
    lines.push(`N'hésite pas à me contacter si tu as des questions ou si tu veux qu'on planifie une visite.`);
    lines.push('');
    lines.push(`À bientôt,`);
    lines.push(proj.project_manager || '');
    return lines.filter((l, i, arr) => !(l === '' && arr[i-1] === '')).join('\n');
  };

  useEffect(() => {
    if (userEditedEstimMsg.current) return;
    const msg = buildEstimMsg(project, aiPriceResult);
    if (msg) setEstimMsg(msg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, aiPriceResult]);

  useEffect(() => {
    if (loading) return undefined;

    const sections = tocSections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveSection(visible.target.id);
      }
    }, {
      root: null,
      rootMargin: '-18% 0px -62% 0px',
      threshold: [0.15, 0.35, 0.6],
    });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [loading, profit, projectInvoices.length, projectQuotes.length, media.length, materialOrders.length, projectContracts.length, changeOrdersList.length]);

  const generateQR = async () => {
    setGenQr(true);
    try { const {data} = await punchApi.generate({ project_id:id, label:project?.name }); setQrData(data); }
    catch {} finally { setGenQr(false); }
  };

  const handlePhaseSave = (data, isEdit) => {
    setProject(p => ({
      ...p,
      phases: isEdit
        ? p.phases.map(ph => ph.id === data.id ? data : ph)
        : [...(p.phases||[]), data]
    }));
    if (data?.trade_name) {
      void ensureProjectTradesExist([data.trade_name]);
    }
    setShowPhase(false); setEditPhase(null);
  };

  const removePhase = async (phaseId) => {
    try {
      await projectsApi.deletePhase(id, phaseId);
      setProject(p => ({ ...p, phases: (p.phases||[]).filter(ph => ph.id !== phaseId) }));
    } catch (err) { console.error('deletePhase', err); }
  };

  const reorderPhases = (reordered) => {
    setProject(p => ({ ...p, phases: reordered }));
    reordered.forEach((ph, idx) => {
      projectsApi.updatePhase(id, ph.id, { sort_order: idx }).catch(() => {});
    });
  };

  const renamePhase = async (phaseId, newName) => {
    try {
      await projectsApi.updatePhase(id, phaseId, { name: newName });
      setProject(p => ({ ...p, phases: (p.phases||[]).map(ph => ph.id === phaseId ? { ...ph, name: newName } : ph) }));
    } catch (err) { console.error('renamePhase', err); }
  };

  const handleDatesChange = async (phaseId, newStart, newEnd, cascade) => {
    const ph = project.phases?.find(p => p.id === phaseId);
    if (!ph) return;
    const origStartDate = new Date(ph.start_date);
    const newStartDate  = new Date(newStart);
    const deltaDays = Math.round((newStartDate - origStartDate) / 86400000);
    if (deltaDays === 0) return;
    const origEndDate = ph.end_date ? new Date(ph.end_date) : new Date(origStartDate.getTime() + 14*86400000);

    const toUpdate = (project.phases || []).filter(p => {
      if (p.id === phaseId) return true;
      if (!cascade || !p.start_date) return false;
      return new Date(p.start_date) >= origEndDate;
    }).map(p => {
      if (p.id === phaseId) return { id: p.id, start_date: newStart, end_date: newEnd };
      const ps = new Date(p.start_date); ps.setDate(ps.getDate() + deltaDays);
      const pe = p.end_date ? new Date(p.end_date) : null; if (pe) pe.setDate(pe.getDate() + deltaDays);
      return { id: p.id, start_date: ps.toISOString().slice(0,10), end_date: pe ? pe.toISOString().slice(0,10) : null };
    });

    setProject(p => ({ ...p, phases: (p.phases||[]).map(ph => { const u = toUpdate.find(u => u.id === ph.id); return u ? { ...ph, ...u } : ph; }) }));
    await Promise.all(toUpdate.map(u => projectsApi.updatePhase(id, u.id, { start_date: u.start_date, end_date: u.end_date }).catch(()=>{})));
  };

  const handleUpdatePhase = async (phaseId, fields) => {
    setProject(p => ({ ...p, phases: (p.phases||[]).map(ph => ph.id===phaseId ? {...ph,...fields} : ph) }));
    await projectsApi.updatePhase(id, phaseId, fields).catch(err => console.error('updatePhase', err));
  };

  const handleSelfAssign = async (phaseId, userName) => {
    await handleUpdatePhase(phaseId, { assigned_to_name: userName });
  };

  const printQR = () => {
    if (!qrData) return;
    const w = window.open('', '_blank', 'width=420,height=520');
    w.document.write(`<!DOCTYPE html><html><head><title>QR ${project?.name||''}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;}img{width:300px;height:300px;}h1{margin-top:16px;font-size:16px;font-weight:700;color:#111;text-align:center;}p{font-size:12px;color:#888;margin:4px 0 0;}</style></head><body><img src="${qrData.qr_image}" alt="QR"/><h1>${project?.name||'Chantier'}</h1><p>Scannez pour pointer</p></body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  const createQuittance = async (e) => {
    e.preventDefault();
    setSavingQuittance(true);
    try {
      const { data } = await quittancesApi.create({
        project_id: id,
        client_name: quittanceForm.client_name || project.client_name || '',
        client_email: quittanceForm.client_email || '',
        project_description: quittanceForm.project_description || project.name,
        amount_paid: quittanceForm.amount_paid ? Number(quittanceForm.amount_paid) : (project.contract_value || 0),
        notes: quittanceForm.notes || '',
      });
      setQuittance(data);
      setShowQuittanceForm(false);
    } catch {} finally { setSavingQuittance(false); }
  };

  const resetPortalToken = async () => {
    if (!confirm('Générer un nouveau lien ? L\'ancien lien ne fonctionnera plus.')) return;
    setResettingPortal(true);
    try {
      const { data } = await projectsApi.resetPortalToken(id);
      setProject(p => ({ ...p, portal_token: data.portal_token }));
    } catch {} finally { setResettingPortal(false); }
  };

  const copyPortalLink = () => {
    if (!project.portal_token) return;
    navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`);
    setPortalCopied(true); setTimeout(() => setPortalCopied(false), 2000);
  };

  const createChangeOrder = async (e) => {
    e.preventDefault(); setSavingCO(true);
    try {
      const { data } = await changeOrdersApi.create({
        project_id: id, title: coForm.title, description: coForm.description,
        amount: coForm.amount ? Number(coForm.amount) : 0, notes: coForm.notes,
      });
      setChangeOrdersList(l => [data, ...l]);
      setShowCOForm(false); setCoForm({ title:'', description:'', amount:'', notes:'' });
    } catch {} finally { setSavingCO(false); }
  };

  const deleteCO = async (coId) => {
    if (!confirm('Supprimer cette demande de modification ?')) return;
    await changeOrdersApi.delete(coId);
    setChangeOrdersList(l => l.filter(c => c.id !== coId));
  };

  const copyCOLink = (co) => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/modification/${co.public_token}`);
    setCopiedCO(co.id); setTimeout(() => setCopiedCO(null), 2000);
  };

  // ── Corps de métiers ────────────────────────────────────────────────────────
  const addTrade = async (e) => {
    e.preventDefault();
    if (!tradeForm.trade.trim()) return;
    try {
      const { data } = await projectsApi.addTrade(id, {
        trade: tradeForm.trade.trim(),
        estimated_cost: tradeForm.estimated_cost ? Number(tradeForm.estimated_cost) : null,
        chosen_subcontractor_id: tradeForm.chosen_subcontractor_id || null,
      });
      setProject(p => ({ ...p, trades: [...(p.trades || []), data] }));
      setTradeForm({ trade: '', estimated_cost: '', chosen_subcontractor_id: '' });
      setShowTradeForm(false);
      refreshProfit();
    } catch {}
  };

  const patchTrade = async (tradeId, patch) => {
    // Optimistic update so the inline selects feel instant.
    setProject(p => ({ ...p, trades: p.trades.map(t => t.id === tradeId ? { ...t, ...patch } : t) }));
    try {
      const { data } = await projectsApi.updateTrade(id, tradeId, patch);
      setProject(p => ({ ...p, trades: p.trades.map(t => t.id === tradeId ? data : t) }));
      if ('estimated_cost' in patch) refreshProfit();
    } catch {}
  };

  const removeTrade = async (tradeId) => {
    if (!confirm('Retirer ce corps de métier ?')) return;
    await projectsApi.deleteTrade(id, tradeId);
    setProject(p => ({ ...p, trades: p.trades.filter(t => t.id !== tradeId) }));
    refreshProfit();
  };

  const normalizeTradeName = (value) => String(value || '').trim();

  const toTradeLabel = (value) => {
    const normalized = normalizeTradeName(value);
    if (!normalized) return '';
    if (TRADE_KEY_TO_NAME[normalized]) return TRADE_KEY_TO_NAME[normalized];
    const alias = TRADE_NAME_ALIASES[normalized.toLowerCase()];
    return alias || normalized;
  };

  const resolveTradeLabels = (values = []) => {
    const unique = [];
    const seen = new Set();
    for (const value of values) {
      const label = toTradeLabel(value);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(label);
    }
    return unique;
  };

  const getProjectWorkType = () => {
    const fa = project.field_assessment || {};
    return fa.work_type || WORK_TYPE_LABELS[project.type] || '';
  };

  const getProjectTypePlaybook = (workType = getProjectWorkType()) => (
    PROJECT_TYPE_PHASE_LIBRARY[workType] || null
  );

  const normalizePhaseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  };

  const ensureProjectTradesExist = async (tradeNames = []) => {
    const existing = new Set((project.trades || []).map(t => normalizeTradeName(t.trade).toLowerCase()).filter(Boolean));
    const missing = [...new Set(tradeNames.map(normalizeTradeName).filter(Boolean))]
      .filter((trade) => !existing.has(trade.toLowerCase()));
    if (!missing.length) return;

    const added = [];
    for (const trade of missing) {
      try {
        const { data } = await projectsApi.addTrade(id, {
          trade,
          estimated_cost: null,
          chosen_subcontractor_id: null,
        });
        added.push(data);
        existing.add(trade.toLowerCase());
      } catch (err) {
        console.error('ensureProjectTradesExist', err);
      }
    }

    if (added.length) {
      setProject((p) => ({ ...p, trades: [...(p.trades || []), ...added] }));
    }
  };

  const normalizeGeneratedPhases = (phases = []) => (
    (Array.isArray(phases) ? phases : [])
      .map((ph, index) => {
        const name = String(ph?.name || '').trim();
        const tradeName = toTradeLabel(ph?.trade_name || ph?.trade);
        const startDate = normalizePhaseDate(ph?.start_date);
        const endDate = normalizePhaseDate(ph?.end_date);
        return {
          name,
          trade_name: tradeName,
          start_date: startDate,
          end_date: endDate,
          progress_pct: 0,
          status: 'not_started',
          display_order: Number.isFinite(Number(ph?.display_order)) ? Number(ph.display_order) : index,
          color: ph?.color || PHASE_COLORS[index % PHASE_COLORS.length],
        };
      })
      .filter((ph) => ph.name)
      .sort((a, b) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        if (a.start_date && b.start_date) return new Date(a.start_date) - new Date(b.start_date);
        return 0;
      })
  );

  const buildPhaseDates = (existingPhases = [], durationDays = 1) => {
    const datedPhases = existingPhases
      .map((ph) => normalizePhaseDate(ph?.end_date || ph?.start_date))
      .filter(Boolean)
      .map((value) => new Date(value));
    const latestBoundary = datedPhases.length ? new Date(Math.max(...datedPhases)) : null;
    const defaultStart = normalizePhaseDate(project.start_date) || new Date().toISOString().slice(0, 10);
    const startDate = latestBoundary ? new Date(latestBoundary) : new Date(defaultStart);
    if (latestBoundary) startDate.setDate(startDate.getDate() + 1);
    const safeDuration = Math.max(Number(durationDays) || 1, 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + safeDuration - 1);
    return {
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
    };
  };

  const ensureAssessmentTradeKeys = async (tradeKeys = []) => {
    const current = Array.isArray(project.field_assessment?.selected_trades)
      ? project.field_assessment.selected_trades
      : [];
    const merged = [...new Set([...current, ...tradeKeys.map((value) => String(value || '').trim()).filter(Boolean)])];
    if (merged.length === current.length && merged.every((value, index) => value === current[index])) return;
    const nextAssessment = { ...(project.field_assessment || {}), selected_trades: merged };
    try {
      await projectsApi.update(id, { field_assessment: nextAssessment });
      setProject((p) => ({ ...p, field_assessment: nextAssessment }));
    } catch (err) {
      console.error('ensureAssessmentTradeKeys', err);
    }
  };

  const addTemplatePhasesBatch = async (templates = [], options = {}) => {
    const { replaceExisting = false } = options;
    const sourcePhases = replaceExisting ? [] : [...(project.phases || [])];
    const existingNames = new Set(sourcePhases.map((ph) => String(ph?.name || '').trim().toLowerCase()).filter(Boolean));
    const queue = (Array.isArray(templates) ? templates : [])
      .map((tpl) => ({
        ...tpl,
        name: String(tpl?.name || '').trim(),
        trade_name: toTradeLabel(tpl?.trade_name),
        durationDays: Math.max(Number(tpl?.durationDays) || 1, 1),
      }))
      .filter((tpl) => tpl.name)
      .filter((tpl) => replaceExisting || !existingNames.has(tpl.name.toLowerCase()));

    if (!queue.length) return [];

    setAddingTemplatePhase('__batch__');
    try {
      if (replaceExisting) {
        for (const ph of (project.phases || [])) {
          await projectsApi.deletePhase(id, ph.id);
        }
      }

      const createdPhases = [];
      const timeline = [...sourcePhases];
      for (const tpl of queue) {
        const dates = buildPhaseDates(timeline, tpl.durationDays);
        const { data } = await projectsApi.addPhase(id, {
          name: tpl.name,
          trade_name: tpl.trade_name || '',
          progress_pct: 0,
          status: 'not_started',
          ...dates,
        });
        createdPhases.push(data);
        timeline.push(data);
      }

      await ensureProjectTradesExist(createdPhases.map((ph) => ph.trade_name));
      setProject((p) => ({
        ...p,
        phases: replaceExisting ? createdPhases : [...(p.phases || []), ...createdPhases],
      }));
      return createdPhases;
    } catch (err) {
      console.error('addTemplatePhasesBatch', err);
      throw err;
    } finally {
      setAddingTemplatePhase(null);
    }
  };

  const applyProjectTypePlaybook = async (options = {}) => {
    const { replaceExisting = false, source = 'manual' } = options;
    const workType = getProjectWorkType();
    const playbook = getProjectTypePlaybook(workType);
    if (!playbook?.phases?.length) {
      setAiNotice("Choisis d'abord un type de projet pour obtenir des étapes adaptées.");
      return [];
    }

    await ensureAssessmentTradeKeys(playbook.selectedTradeKeys || []);
    await ensureProjectTradesExist(resolveTradeLabels(playbook.selectedTradeKeys || []));
    const created = await addTemplatePhasesBatch(playbook.phases, { replaceExisting });

    if (source === 'fallback' && created.length) {
      setAiNotice(`Florence est indisponible pour l'instant — plan type appliqué pour ${workType}.`);
    } else if (source === 'manual') {
      setAiNotice(created.length
        ? `${created.length} phase(s) recommandée(s) ajoutée(s) pour ${workType}.`
        : `Toutes les étapes recommandées pour ${workType} sont déjà présentes.`);
    } else if (!created.length) {
      setAiNotice(`Toutes les étapes recommandées pour ${workType} sont déjà présentes.`);
    } else {
      setAiNotice('');
    }

    return created;
  };

  // Auto-ajouter les corps de métier depuis fa.selected_trades
  const autoAddTradesFromEstim = async () => {
    const fa = project.field_assessment || {};
    setAutoAddingTrades(true);
    try { await ensureProjectTradesExist(resolveTradeLabels(fa.selected_trades || [])); }
    finally { setAutoAddingTrades(false); }
  };

  useEffect(() => {
    if (!project?.phases?.length) return;
    const phaseTrades = project.phases.map((ph) => ph.trade_name).filter(Boolean);
    if (!phaseTrades.length) return;
    void ensureProjectTradesExist(phaseTrades);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.phases]);

  // Florence recommande des sous-traitants pour les corps non assignés
  const fetchTradeRecos = async () => {
    const missingTrades = (project.trades || []).filter(t => t.status === 'to_find' || !t.chosen_subcontractor_id);
    if (!missingTrades.length) return;
    setLoadingTradeRecos(true);
    const fa = project.field_assessment || {};
    const prompt = `Tu es Florence, assistante IA MONFLUX spécialisée en construction au Québec.
Je cherche des sous-traitants pour ce projet :
- Projet : ${project.description || project.name || ''}
- Adresse : ${project.address || 'Non précisée'}
- Corps de métier requis : ${missingTrades.map(t => t.trade).join(', ')}

Pour chaque corps de métier, suggère 2-3 sous-traitants potentiels au Québec (vraisemblables, pas inventés si incertains — tu peux suggérer des types d'entreprises à chercher). Réponds en JSON UNIQUEMENT dans ce format :
{"trades":{"Électricité":[{"name":"Électro-Pro QC","note":"Spécialiste résidentiel Montréal","phone":"","website":"electricien.ca"}]}}`;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${PROJ_CHAT_BASE}/chat`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ messages:[{role:'user',content:prompt}] }),
      });
      if (!res.ok) { setTradeRecos({}); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l=>l.startsWith('data: '))) {
          try { const evt = JSON.parse(line.slice(6)); if (evt.type==='text') raw += evt.text; } catch {}
        }
      }
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { const parsed = JSON.parse(match[0]); setTradeRecos(parsed.trades || {}); } catch { setTradeRecos({}); }
      } else { setTradeRecos({}); }
    } catch { setTradeRecos({}); } finally { setLoadingTradeRecos(false); }
  };

  const generatePhasesFromAI = async () => {
    setGeneratingPhases(true);
    setAiNotice('');
    const fa = project.field_assessment || {};
    const playbook = getProjectTypePlaybook();
    const tradeList = [
      ...resolveTradeLabels(fa.selected_trades || []),
      ...resolveTradeLabels(playbook?.selectedTradeKeys || []),
      ...(project.trades || []).map(t => t.trade).filter(Boolean),
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    try {
      const { data } = await aiApi.generatePhases({
        description: project.description || project.name || '',
        project_name: project.name || '',
        project_type: fa.work_type || project.type || '',
        start_date: project.start_date || null,
        end_date: project.end_date || null,
        address: project.address || '',
        client_name: project.client_name || '',
        budget: project.budget || project.contract_value || null,
        notes: project.notes || '',
        trades: tradeList,
        visit_answers: fa.visite_answers || {},
        approx_lines: fa.approx_lines || [],
      });
      const nextPhases = normalizeGeneratedPhases(data?.phases || []);
      if (!nextPhases.length) {
        const fallback = await applyProjectTypePlaybook({
          replaceExisting: (project.phases || []).length > 0,
          source: 'fallback',
        });
        if (!fallback.length) {
          alert("Flo n'a pas réussi à générer des phases valides pour ce projet.");
        }
        return;
      }

      for (const ph of (project.phases || [])) {
        await projectsApi.deletePhase(id, ph.id);
      }

      const createdPhases = [];
      for (const ph of nextPhases) {
        const { data: created } = await projectsApi.addPhase(id, ph);
        createdPhases.push(created);
      }

      await ensureAssessmentTradeKeys(playbook?.selectedTradeKeys || []);
      await ensureProjectTradesExist(createdPhases.map((ph) => ph.trade_name));
      setProject((p) => ({ ...p, phases: createdPhases }));
      setAiNotice('');
    } catch (err) {
      console.error('generatePhasesFromAI', err);
      try {
        const fallback = await applyProjectTypePlaybook({
          replaceExisting: (project.phases || []).length > 0,
          source: 'fallback',
        });
        if (!fallback.length) {
          alert("Impossible de générer les phases avec Florence pour l'instant.");
        }
      } catch {
        alert("Impossible de générer les phases avec Florence pour l'instant.");
      }
    } finally { setGeneratingPhases(false); }
  };

  const addTemplatePhase = async (tpl) => {
    setAddingTemplatePhase(tpl.name);
    try {
      const dates = buildPhaseDates(project.phases || [], tpl.durationDays);
      const { data } = await projectsApi.addPhase(id, {
        name: tpl.name,
        trade_name: toTradeLabel(tpl.trade_name) || '',
        progress_pct: 0,
        status: 'not_started',
        ...dates,
      });
      setProject(p => ({ ...p, phases: [...(p.phases||[]), data] }));
      await ensureProjectTradesExist([data.trade_name || toTradeLabel(tpl.trade_name)]);
    } catch {} finally { setAddingTemplatePhase(null); }
  };

  // ── Dépenses ────────────────────────────────────────────────────────────────
  const addExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount) return;
    try {
      const { data } = await projectsApi.addExpense(id, {
        type: expenseForm.type,
        description: expenseForm.description || null,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.expense_date || null,
      });
      setProject(p => ({ ...p, expenses: [data, ...(p.expenses || [])] }));
      setExpenseForm({ type: 'supplier_invoice', description: '', amount: '', expense_date: '' });
      setShowExpenseForm(false);
      refreshProfit();
    } catch {}
  };

  const removeExpense = async (expenseId) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    await projectsApi.deleteExpense(id, expenseId);
    setProject(p => ({ ...p, expenses: p.expenses.filter(x => x.id !== expenseId) }));
    refreshProfit();
  };

  const saveLaborRate = async () => {
    setSavingRate(true);
    try {
      await companiesApi.update({ default_labor_cost_rate: Number(laborRate) || 0 });
      await refreshProfit();
    } catch {} finally { setSavingRate(false); }
  };

  // ── Handlers Vente (B4) ────────────────────────────────────────────────────
  const ensureQuote = async () => {
    if (quoteBuilderQuote) return quoteBuilderQuote;
    setQuoteSaving(true);
    try {
      const { data } = await quotesApi.create({ project_id: id, title: `Soumission — ${project?.name || 'Projet'}` });
      setQuoteBuilderQuote(data);
      setQuoteBuilderItems([]);
      return data;
    } catch { return null; } finally { setQuoteSaving(false); }
  };

  const saveQuoteItems = async (items) => {
    const q = quoteBuilderQuote;
    if (!q) return;
    setQuoteSaving(true);
    try {
      const { data } = await quotesApi.update(q.id, { items });
      setQuoteBuilderQuote(data);
      setQuoteBuilderItems(data.items || items);
    } catch {} finally { setQuoteSaving(false); }
  };

  const scheduleQuoteSave = (items) => {
    clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => saveQuoteItems(items), 900);
  };

  const addQuoteItem = async (type) => {
    const q = await ensureQuote();
    if (!q) return;
    const unitMap = { labor: 'h', material: 'un.', subcontractor: 'forfait', other: 'un.' };
    const next = [...quoteBuilderItems, { type, name: '', qty: 1, unit: unitMap[type] || 'un.', unit_price: 0 }];
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };

  const updateQuoteItem = (i, patch) => {
    const next = quoteBuilderItems.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };

  const removeQuoteItem = (i) => {
    const next = quoteBuilderItems.filter((_, idx) => idx !== i);
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };

  const sendQuoteToClient = async () => {
    if (!quoteBuilderQuote) return;
    setQuoteSending(true);
    try {
      const { data } = await quotesApi.send(quoteBuilderQuote.id);
      setQuoteBuilderQuote(data);
      setProject((p) => ({ ...p, status: 'prix_envoye', price_sent_at: data.updated_at }));
    } catch {} finally { setQuoteSending(false); }
  };

  const createRfq = async (e) => {
    e.preventDefault();
    try {
      const { data } = await rfqsApi.create({ project_id: id, ...rfqForm });
      setProjectRfqs((r) => [data, ...r]);
      setShowRfqForm(false);
      setRfqForm({ title: '', specialty: '', description: '', deadline: '' });
    } catch {}
  };

  const inviteSubsToRfq = async (rfqId) => {
    if (!selectedSubIds.length) return;
    setInviting(true);
    try {
      await rfqsApi.invite(rfqId, selectedSubIds);
      const { data: updated } = await rfqsApi.byProject(id);
      setProjectRfqs(updated || []);
      setShowInviteModal(null);
      setSelectedSubIds([]);
    } catch {} finally { setInviting(false); }
  };

  const generateContract = async () => {
    if (!quoteBuilderQuote) return;
    setGeneratingContract(true);
    try {
      const { data } = await quotesApi.generateContract(quoteBuilderQuote.id);
      setProjectContracts((c) => [data, ...c]);
    } catch {} finally { setGeneratingContract(false); }
  };

  const sendContract = async (contractId) => {
    setContractSendingId(contractId);
    try {
      const { data } = await contractsApi.send(contractId);
      setProjectContracts((cs) => cs.map((c) => c.id === contractId ? data : c));
    } catch {} finally { setContractSendingId(null); }
  };

  const deleteContract = async (contractId) => {
    if (!confirm('Supprimer ce contrat ?')) return;
    await contractsApi.delete(contractId);
    setProjectContracts((cs) => cs.filter((c) => c.id !== contractId));
  };

  /* Constante API pour les appels fetch directs (SSE) */
  const PROJ_CHAT_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';

  const changeProjectStatus = async () => {
    if (!statusPopup) return;
    setChangingStatus(true);
    try {
      const { data } = await projectsApi.update(id, { status: statusPopup.key });
      // Persiste la date du changement de statut dans field_assessment.status_dates
      const prevFa = project.field_assessment || {};
      const prevDates = prevFa.status_dates || {};
      const nextDates = { ...prevDates, [statusPopup.key]: new Date().toISOString() };
      const nextFa = { ...prevFa, status_dates: nextDates };
      await projectsApi.update(id, { field_assessment: nextFa });
      setProject(p => ({ ...p, status: data.status, field_assessment: nextFa }));
      setStatusPopup(null);
    } catch {} finally { setChangingStatus(false); }
  };

  /* Construction d'URL de recherche garantie sans 404 */
  const buildSourceUrl = (fournisseur, mots_cles) => {
    const q = encodeURIComponent(mots_cles + ' prix Québec');
    const siteMap = {
      'Rona':          `https://www.rona.ca/fr/recherche?q=${encodeURIComponent(mots_cles)}`,
      'Canac':         `https://www.canac.ca/catalogsearch/result/?q=${encodeURIComponent(mots_cles)}`,
      'Home Dépôt':    `https://www.homedepot.ca/recherche#${encodeURIComponent(mots_cles)}`,
      'BMR':           `https://www.bmr.qc.ca/recherche?q=${encodeURIComponent(mots_cles)}`,
      'Patrick Morin': `https://www.patrickmorin.com/recherche?q=${encodeURIComponent(mots_cles)}`,
    };
    return siteMap[fournisseur] || `https://www.google.ca/search?q=${q}`;
  };

  const searchMaterialPrices = async () => {
    if (!project) return;
    setSearchingPrices(true);
    setAiPriceResult(null);
    try {
      const fa = project.field_assessment || {};
      const workType = fa.work_type || project.name || 'rénovation générale';

      /* Compiler tout le contexte disponible */
      const ctxParts = [];
      if (project.description) ctxParts.push(`Résumé de la demande : ${project.description}`);
      if (project.client_name)  ctxParts.push(`Client : ${project.client_name}`);
      if (project.address)      ctxParts.push(`Adresse : ${project.address}`);
      const trades = resolveTradeLabels(fa.selected_trades || []);
      if (trades.length) ctxParts.push(`Corps de métier : ${trades.join(', ')}`);
      const va = fa.visite_answers || {};
      if (va.area)   ctxParts.push(`Superficie : ${va.area} ${va.area_unit || 'pi²'}`);
      if (va.notes)  ctxParts.push(`Observations sur place : ${va.notes}`);
      const qaLines = Object.entries(va).filter(([k,v]) => v && !['area','area_unit','notes'].includes(k))
        .map(([k,v]) => `${k}: ${v}`);
      if (qaLines.length) ctxParts.push(`Réponses visite sur place :\n${qaLines.join('\n')}`);
      const clientMsg = clientMsgRef.current?.value;
      if (clientMsg && clientMsg.length > 50) ctxParts.push(`Message envoyé au client :\n${clientMsg.substring(0, 400)}`);
      const contextBlock = ctxParts.length ? `\n\nCONTEXTE DU PROJET :\n${ctxParts.join('\n')}` : '';

      const prompt = `Tu es Florence, assistante IA de MONFLUX. Génère une estimation pour un projet de construction québécois : "${workType}"${project.address ? ` à ${project.address}` : ''}.${contextBlock}

INSTRUCTION STRICTE : Retourne UNIQUEMENT un objet JSON valide. Aucun texte avant ou après. Aucune balise markdown. Structure exacte :
{
  "lignes": [
    {
      "poste": "Nom du poste",
      "source": "Rona",
      "inclus": "Ce qui est inclus",
      "non_inclus": "Ce qui n'est pas inclus",
      "duree": "2 j",
      "cout": 1200,
      "prix_vente": 1560
    }
  ],
  "scenarios": [
    { "nom": "Économique", "description": "Matériaux de base, pose simple", "cout": 8000, "prix_vente": 10400 },
    { "nom": "Standard", "description": "Rapport qualité-prix optimal, finitions soignées", "cout": 15000, "prix_vente": 19500 },
    { "nom": "Haut de gamme", "description": "Matériaux premium, finitions haut de gamme", "cout": 28000, "prix_vente": 36400 }
  ],
  "commentaires": "2-3 phrases sur la fiabilité de l'estimation, variations possibles. Factuel, pas de prochaines étapes.",
  "source_refs": [
    { "label": "Armoires de cuisine", "fournisseur": "Rona", "mots_cles": "armoires cuisine" },
    { "label": "Comptoir quartz", "fournisseur": "Home Dépôt", "mots_cles": "comptoir cuisine quartz" }
  ]
}

Règles :
- 6 à 10 lignes pour ce projet
- "cout" = coût de revient total (matériaux + main-d'œuvre), entier CAD
- "prix_vente" = cout × marge (20–35% selon le corps de métier)
- Prix réalistes marché québécois 2025-2026
- "source" dans chaque ligne : uniquement parmi Rona / Canac / Home Dépôt / BMR / Patrick Morin
- "source_refs" : 3 à 5 références de recherche, mots-clés courts en français`;

      const token = localStorage.getItem('token');
      const res = await fetch(`${PROJ_CHAT_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], context_type: 'estimation', project_id: id }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const reader = res.body.getReader(); const dec = new TextDecoder(); let rawText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const chunk of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const e = JSON.parse(chunk.slice(6)); if (e.type === 'text') rawText += e.text; } catch {}
        }
      }
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        /* Ajouter les lignes dans le tableau */
        const lignes = Array.isArray(parsed.lignes) ? parsed.lignes : [];
        if (lignes.length > 0) {
          const currentFa = project.field_assessment || {};
          const currentLines = currentFa.approx_lines || [];
          const newLines = lignes.map((l, i) => ({
            id: Date.now() + i,
            poste: l.poste || '', source: l.source || '',
            inclus: l.inclus || '', non_inclus: l.non_inclus || '',
            duree: l.duree || '', cout: l.cout || '', prix_vente: l.prix_vente || '',
          }));
          const nextFa = { ...currentFa, approx_lines: [...currentLines, ...newLines] };
          await projectsApi.update(id, { field_assessment: nextFa });
          setProject(p => ({ ...p, field_assessment: nextFa }));
        }
        /* Construire les sources avec URLs garanties */
        const sourceRefs = Array.isArray(parsed.source_refs) ? parsed.source_refs : [];
        const sources = sourceRefs.map(s => ({
          label: s.label,
          fournisseur: s.fournisseur,
          url: buildSourceUrl(s.fournisseur, s.mots_cles),
        }));
        setAiPriceResult({
          comments:  parsed.commentaires || '',
          scenarios: Array.isArray(parsed.scenarios) ? parsed.scenarios : [],
          sources,
        });
      } else {
        setAiPriceResult({ comments: 'Florence n\'a pas pu générer une estimation structurée. Réessaie.', scenarios: [], sources: [] });
      }
    } catch { setAiPriceResult({ comments: 'Impossible de récupérer les prix. Vérifie ta connexion et réessaie.', scenarios: [], sources: [] }); }
    finally { setSearchingPrices(false); }
  };

  // B6 — handlers Chantier
  const approveTs = async (tsId) => {
    try {
      await tsApi.approve(tsId);
      setTimesheets(prev => prev.map(t => t.id === tsId ? { ...t, approved_at: new Date().toISOString() } : t));
    } catch {}
  };

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      const { data } = await materialOrdersApi.create({ ...orderForm, project_id: id });
      setMaterialOrders(prev => [data, ...prev]);
      setOrderForm({ supplier: '', order_number: '', description: '', total_amount: '', order_date: '', expected_date: '' });
      setShowOrderForm(false);
    } catch {}
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await materialOrdersApi.update(orderId, { status });
      setMaterialOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {}
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('Supprimer cette commande ?')) return;
    try {
      await materialOrdersApi.delete(orderId);
      setMaterialOrders(prev => prev.filter(o => o.id !== orderId));
    } catch {}
  };

  // B7 — handlers IA chantier
  const addMedia = async (e) => {
    e.preventDefault();
    try {
      const { data } = await siteMediaApi.create({ ...mediaForm, project_id: id });
      setMedia(prev => [data, ...prev]);
      setMediaForm({ type: 'photo', url: '', mime_type: '', caption: '', transcript: '' });
      setShowMediaForm(false);
    } catch {}
  };

  const deleteMedia = async (mediaId) => {
    if (!confirm('Supprimer ce média ?')) return;
    try {
      await siteMediaApi.delete(mediaId);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch {}
  };

  const analyzeMedia = async (mediaId) => {
    setAnalyzingMediaId(mediaId); setAiNotice('');
    try {
      const { data } = await siteMediaApi.analyze(mediaId);
      setMedia(prev => prev.map(m => m.id === mediaId ? data : m));
    } catch (err) {
      if (err.response?.data?.code === 'ai_not_configured') setAiNotice(err.response.data.hint);
    } finally { setAnalyzingMediaId(null); }
  };

  const groupPurchases = async () => {
    setGroupingPurchases(true); setAiNotice('');
    try {
      const { data } = await aiApi.groupPurchases(id);
      setPurchasePlan(data);
    } catch (err) {
      if (err.response?.data?.code === 'ai_not_configured') setAiNotice(err.response.data.hint);
    } finally { setGroupingPurchases(false); }
  };

  const analyzeChangeOrder = async (coId) => {
    setAnalyzingCoId(coId); setAiNotice('');
    try {
      const { data } = await aiApi.changeOrderImpact(coId);
      setCoImpact(prev => ({ ...prev, [coId]: data }));
    } catch (err) {
      if (err.response?.data?.code === 'ai_not_configured') setAiNotice(err.response.data.hint);
    } finally { setAnalyzingCoId(null); }
  };

  const SEV = { low: { c: 'badge-green', l: 'Faible' }, medium: { c: 'badge-yellow', l: 'Moyen' }, high: { c: 'badge-red', l: 'Élevé' } };

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div></Layout>;
  if (!project) return <Layout><div className="p-8 text-red-500">Projet non trouvé</div></Layout>;

  const pct = project.progress_pct || 0;
  const activeTs = timesheets.filter(t=>!t.clock_out);
  const contractValue = Number(project.contract_value || 0);
  const billedInvoices = projectInvoices.filter((inv) => inv.status !== 'cancelled');
  const totalBilled = billedInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalCollected = billedInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalOutstanding = billedInvoices
    .filter((inv) => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.amount_due ?? inv.total ?? 0), 0);
  const paymentTerms = parsePaymentTerms(project.payment_terms);
  let runningPct = 0;
  const installments = paymentTerms.map((pctValue, index) => {
    const previousPct = runningPct;
    runningPct += pctValue;
    const amount = contractValue ? (contractValue * pctValue) / 100 : 0;
    const paid = contractValue > 0 && totalCollected >= (contractValue * runningPct) / 100 - 1;
    const current = !paid && totalCollected >= (contractValue * previousPct) / 100 - 1;
    return {
      label: paymentStepLabel(index, paymentTerms.length),
      pct: pctValue,
      amount,
      paid,
      current,
    };
  });
  const nextInstallment = installments.find((item) => !item.paid) || null;
  const nextDueInvoice = billedInvoices
    .filter((inv) => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status) && inv.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] || null;
  const heroNextPaymentAmount = nextInstallment?.amount || totalOutstanding || Math.max(contractValue - totalCollected, 0);
  const heroDueDate = nextDueInvoice?.due_date || project.end_date || null;

  const PIPELINE_LABELS = {
    brouillon: 'Brouillon', estimation: 'Estimation terrain', prix_envoye: 'Prix envoyé',
    accepte: 'Accepté', planifie: 'Planifié', en_chantier: 'En chantier',
    a_facturer: 'À facturer', paye: 'Payé', clos: 'Clos',
  };
  const WORK_TYPE_LABELS = {
    kitchen: 'Cuisine', bathroom: 'Salle de bain', basement: 'Sous-sol',
    addition: 'Agrandissement', new_build: 'Construction neuve', roofing: 'Toiture',
    exterior: 'Extérieur', commercial: 'Commercial', interior: 'Intérieur', other: '',
  };

  const WORK_TYPE_OPTIONS = [
    { group: 'Résidentiel — Intérieur', value: 'Cuisine', label: 'Cuisine' },
    { group: 'Résidentiel — Intérieur', value: 'Salle de bain', label: 'Salle de bain' },
    { group: 'Résidentiel — Intérieur', value: 'Sous-sol', label: 'Sous-sol' },
    { group: 'Résidentiel — Intérieur', value: 'Planchers', label: 'Planchers' },
    { group: 'Résidentiel — Intérieur', value: 'Peinture intérieure', label: 'Peinture intérieure' },
    { group: 'Résidentiel — Intérieur', value: 'Rénovation complète', label: 'Rénovation complète' },
    { group: 'Résidentiel — Intérieur', value: 'Fenêtres et portes', label: 'Fenêtres et portes' },
    { group: 'Résidentiel — Intérieur', value: 'Escaliers', label: 'Escaliers' },
    { group: 'Résidentiel — Intérieur', value: 'Armoires / cuisines', label: 'Armoires / cuisines' },
    { group: 'Résidentiel — Extérieur', value: 'Toiture', label: 'Toiture / couverture' },
    { group: 'Résidentiel — Extérieur', value: 'Agrandissement', label: 'Agrandissement' },
    { group: 'Résidentiel — Extérieur', value: 'Terrasse / balcon', label: 'Terrasse / balcon / patio' },
    { group: 'Résidentiel — Extérieur', value: 'Paysagement', label: 'Paysagement / aménagement extérieur' },
    { group: 'Résidentiel — Extérieur', value: 'Fondation', label: 'Fondation / imperméabilisation' },
    { group: 'Résidentiel — Extérieur', value: 'Piscine / spa', label: 'Piscine / spa' },
    { group: 'Résidentiel — Extérieur', value: 'Revêtement extérieur', label: 'Revêtement extérieur' },
    { group: 'Résidentiel — Extérieur', value: 'Clôture', label: 'Clôture / portail' },
    { group: 'Systèmes du bâtiment', value: 'Électricité', label: 'Électricité' },
    { group: 'Systèmes du bâtiment', value: 'Plomberie', label: 'Plomberie' },
    { group: 'Systèmes du bâtiment', value: 'Chauffage / climatisation (CVC)', label: 'Chauffage / Climatisation (CVC / HVAC)' },
    { group: 'Systèmes du bâtiment', value: 'Isolation', label: 'Isolation thermique' },
    { group: 'Systèmes du bâtiment', value: 'Domotique / sécurité', label: 'Domotique / sécurité / caméras' },
    { group: 'Travaux spécialisés', value: 'Démolition', label: 'Démolition' },
    { group: 'Travaux spécialisés', value: 'Excavation', label: 'Excavation / terrassement' },
    { group: 'Travaux spécialisés', value: 'Maçonnerie / béton', label: 'Maçonnerie / béton' },
    { group: 'Travaux spécialisés', value: 'Construction neuve', label: 'Construction neuve' },
    { group: 'Travaux spécialisés', value: 'Ingénierie structurelle', label: 'Ingénierie structurelle' },
    { group: 'Commercial / Institutionnel', value: 'Commercial', label: 'Commercial / bureaux / retail' },
    { group: 'Commercial / Institutionnel', value: 'Industriel', label: 'Industriel / entrepôt' },
    { group: 'Commercial / Institutionnel', value: 'Institutionnel', label: 'Institutionnel (école, clinique)' },
    { group: 'Autre', value: 'Autre', label: 'Autre' },
  ];

  const ALL_TRADES = [
    { key: 'charpenterie', label: 'Charpenterie', emoji: '🪵' },
    { key: 'electricite', label: 'Électricité', emoji: '⚡' },
    { key: 'plomberie', label: 'Plomberie', emoji: '🔧' },
    { key: 'hvac', label: 'Chauffage / CVC', emoji: '🌡️' },
    { key: 'peinture', label: 'Peinture', emoji: '🎨' },
    { key: 'gypse', label: 'Gypse / cloisons', emoji: '📐' },
    { key: 'ceramique', label: 'Céramique', emoji: '🏠' },
    { key: 'plancher', label: 'Planchers', emoji: '🪵' },
    { key: 'couverture', label: 'Couverture / toiture', emoji: '🏚️' },
    { key: 'isolation', label: 'Isolation', emoji: '🧱' },
    { key: 'fenetres', label: 'Fenêtres / portes', emoji: '🪟' },
    { key: 'demolition', label: 'Démolition', emoji: '💥' },
    { key: 'excavation', label: 'Excavation', emoji: '🚜' },
    { key: 'fondation', label: 'Fondation / maçonnerie', emoji: '🏗️' },
    { key: 'paysagement', label: 'Paysagement', emoji: '🌿' },
    { key: 'ebenisterie', label: 'Ébénisterie / armoires', emoji: '🪑' },
    { key: 'escaliers', label: 'Escaliers / rampes', emoji: '🔼' },
    { key: 'securite', label: 'Sécurité / domotique', emoji: '🔒' },
    { key: 'gicleurs', label: 'Gicleurs / incendie', emoji: '🚒' },
    { key: 'impermeabilisation', label: 'Imperméabilisation', emoji: '💧' },
    { key: 'piscine', label: 'Piscine / spa', emoji: '🏊' },
    { key: 'ingenierie', label: 'Ingénierie structurelle', emoji: '📐' },
    { key: 'autre', label: 'Autre spécialité', emoji: '➕' },
  ];
  const TRADE_KEY_TO_NAME = Object.fromEntries(ALL_TRADES.map((trade) => [trade.key, trade.label]));
  const TRADE_NAME_ALIASES = {
    'structure': 'Charpenterie',
    'cvca': 'Chauffage / CVC',
    'cvc': 'Chauffage / CVC',
    'gypse': 'Gypse / cloisons',
    'plancher': 'Planchers',
    'peinture intérieure': 'Peinture',
  };

  /* Questions universelles + banques par type de travaux */
  const VISITE_QUESTIONS_UNIVERSAL = [
    /* ── Contexte général ── */
    { id: 'occupied',  q: 'Le bâtiment est-il occupé pendant les travaux ?', opts: ['Oui — résidents/locataires présents', 'Non — vacant', 'Partiellement occupé'] },
    { id: 'permit',    q: 'Un permis municipal est-il requis ?',             opts: ['Oui — en cours', 'Oui — à demander', 'Non requis', 'À vérifier avec la ville'] },
    { id: 'hazmat',    q: 'Présence suspectée de matériaux dangereux ?',     opts: ['Amiante (bâtiment avant 1980)', 'Peinture au plomb', 'Aucun à ma connaissance', 'Test requis avant démarrage'] },
    { id: 'access',    q: 'Accessibilité du chantier',                       opts: ['Facile — accès direct rue', 'Stationnement limité', 'Accès arrière seulement', 'Contraintes importantes (escaliers, ruelle)'] },
    /* ── Préparation des lieux ── */
    { id: 'prep_protection', q: 'Protection des surfaces à préserver ?',     opts: ['Meubles à protéger sur place', 'Planchers à couvrir', 'Pièces adjacentes à isoler', 'Aucune contrainte'] },
    { id: 'prep_debarras',   q: 'Débarras ou déménagement avant travaux ?',  opts: ['Client s\'en charge', 'À inclure dans la soumission', 'Partiellement — voir observations', 'Non requis'] },
    { id: 'prep_dust',       q: 'Confinement de la poussière requis ?',      opts: ['Oui — zone de travail à fermer', 'Protections légères suffisantes', 'Non requis (extérieur)'] },
    /* ── Actions connexes possibles ── */
    { id: 'connexe_floor',   q: 'Remplacement de plancher à prévoir ?',      opts: ['Oui — zone touchée', 'À évaluer', 'Non'] },
    { id: 'connexe_paint',   q: 'Peinture incluse ou connexe ?',             opts: ['Oui — pièces complètes', 'Retouches seulement', 'Exclu de la soumission'] },
    { id: 'connexe_drywall', q: 'Réparations de gypse nécessaires ?',        opts: ['Oui — trous et joints', 'Remplacement de panneaux', 'Non'] },
    { id: 'connexe_cleanup', q: 'Nettoyage post-travaux ?',                  opts: ['Inclus dans la soumission', 'À la charge du client', 'Non précisé'] },
  ];

  const VISITE_QUESTIONS_BY_TYPE = {
    'Cuisine': [
      { id: 'cabinet_type', q: 'Type d\'armoires souhaitées', opts: ['Stock standard (IKEA, Home Dépot)', 'Semi-custom', 'Sur mesure / ébénisterie', 'À conseiller'] },
      { id: 'island', q: 'Îlot de cuisine ?', opts: ['Oui — nouveau', 'Modifier l\'existant', 'Non'] },
      { id: 'plumbing_relocate', q: 'Déplacement de l\'évier ou drain ?', opts: ['Oui', 'Non', 'À confirmer'] },
      { id: 'ventilation_k', q: 'Hotte raccordée vers l\'extérieur ?', opts: ['Conduit existant à utiliser', 'Nouveau conduit à percer', 'Recirculation (sans conduit)'] },
      { id: 'appliances', q: 'Électroménagers inclus dans la commande ?', opts: ['Fourniture + installation', 'Installation seulement', 'Non inclus'] },
      { id: 'countertop', q: 'Comptoir souhaité', opts: ['Quartz engineered', 'Granit naturel', 'Stratifié / Formica', 'Béton / autre', 'À conseiller'] },
    ],
    'Salle de bain': [
      { id: 'shower_type', q: 'Type de douche', opts: ['Bain-douche standard', 'Douche à l\'italienne (plancher nivelant)', 'Baignoire séparée', 'Les deux (bain + douche séparée)'] },
      { id: 'plumbing_relocate_bath', q: 'Déplacement de plomberie ?', opts: ['Oui — déplacement majeur', 'Légère modification', 'Non — même position'] },
      { id: 'tile_format', q: 'Format de céramique', opts: ['Grand format (60×120 cm+)', 'Standard (30×60 cm)', 'Mosaïque', 'Pierre naturelle'] },
      { id: 'vanity_type', q: 'Type de vanité', opts: ['Au mur (suspendue)', 'Avec pieds', 'Meuble-lavabo standard', 'Double lavabo'] },
      { id: 'ventilation_bath', q: 'Ventilation (VRC / VMC)', opts: ['Existante conforme', 'À remplacer', 'À installer'] },
    ],
    'Sous-sol': [
      { id: 'basement_height', q: 'Hauteur libre actuelle', opts: ['Moins de 7 pi (bas)', '7–7,5 pi (borderline)', '7,5 pi et + (correct)', 'Plus de 8 pi (excellent)'] },
      { id: 'humidity', q: 'Problèmes d\'humidité ou infiltration ?', opts: ['Oui — à corriger avant tout', 'Traces légères', 'Aucun problème apparent'] },
      { id: 'bathroom_basement', q: 'Salle de bain à ajouter ?', opts: ['Oui — complet', 'Oui — demi-bain seulement', 'Non'] },
      { id: 'ceiling_type', q: 'Type de plafond souhaité', opts: ['Gyproc / plafond plein', 'Plafond suspendu (T-bar)', 'Plafond exposé / industriel', 'À conseiller'] },
    ],
    'Toiture': [
      { id: 'roof_slope', q: 'Type de pente', opts: ['Toiture plate (< 2/12)', 'Faible pente (2–4/12)', 'Standard (4–8/12)', 'Abrupte (8/12+)'] },
      { id: 'roof_material', q: 'Matériau souhaité', opts: ['Bardeau d\'asphalte', 'Tôle à la baguette (métal)', 'Tôle plate / standing seam', 'EPDM/TPO (toiture plate)', 'À conseiller'] },
      { id: 'layers', q: 'Nombre de couches existantes', opts: ['1 couche', '2 couches', '3+ couches (dépose totale)', 'Inconnue'] },
      { id: 'insulation_roof', q: 'Isolation à améliorer ?', opts: ['Oui — insuffisante', 'Non — conforme', 'À évaluer'] },
      { id: 'gutters', q: 'Gouttières à inclure', opts: ['Oui — remplacement complet', 'Oui — partiel', 'Non'] },
    ],
    'Électricité': [
      { id: 'panel_amp', q: 'Ampérage du panneau actuel', opts: ['100A (vieux)', '150A', '200A (standard)', '400A (gros bâtiment)', 'Inconnu'] },
      { id: 'panel_replace', q: 'Remplacement du panneau ?', opts: ['Oui', 'Non — ajout de circuits', 'À évaluer'] },
      { id: 'old_wiring', q: 'Type de câblage existant', opts: ['Knob-and-tube (avant 1960)', 'Aluminium (1965–1980)', 'Cuivre conforme', 'Inconnu'] },
      { id: 'ev_charger', q: 'Borne de recharge VE', opts: ['Niveau 2 — 240V résidentiel', 'Niveau 3 — rapide commercial', 'Non requis'] },
      { id: 'smart_home', q: 'Domotique / éclairage intelligent', opts: ['Oui — étendu', 'Partiel (quelques pièces)', 'Non'] },
    ],
    'Plomberie': [
      { id: 'pipe_material', q: 'Matériau des conduites existantes', opts: ['Cuivre (bon état)', 'PEX (moderne)', 'Galvanisé (vieux)', 'Polybutylène / Kitec (urgent!)', 'Inconnu'] },
      { id: 'pipe_scope', q: 'Étendue des travaux', opts: ['Remplacement complet', 'Remplacement partiel', 'Raccordement / ajout seulement'] },
      { id: 'water_heater', q: 'Chauffe-eau', opts: ['À remplacer — réservoir', 'Thermopompe eau chaude', 'Sans réservoir (tankless)', 'À conserver'] },
      { id: 'sewer_issue', q: 'Problème d\'égout ou drain', opts: ['Drain obstrué régulièrement', 'Backwater valve requise', 'Aucun problème connu'] },
    ],
    'Chauffage / climatisation (CVC)': [
      { id: 'current_system', q: 'Système de chauffage actuel', opts: ['Plinthes électriques', 'Fournaise au gaz', 'Fournaise à l\'huile', 'Thermopompe centrale', 'Thermopompe murale (split)', 'Géothermie'] },
      { id: 'desired_system', q: 'Système souhaité', opts: ['Thermopompe centrale', 'Thermopompe murale (mini-split)', 'Fournaise + CA', 'Géothermie', 'Maintenir existant'] },
      { id: 'ductwork', q: 'Conduits existants', opts: ['En bon état — à utiliser', 'À remplacer', 'Aucun conduit (nouveau)'] },
      { id: 'vrc', q: 'VRC / Ventilateur récupérateur de chaleur', opts: ['À installer', 'Existant — OK', 'À remplacer'] },
    ],
    'Démolition': [
      { id: 'demo_scope', q: 'Étendue de la démolition', opts: ['Partielle — intérieure ciblée', 'Complète — vider le bâtiment', 'Démolition totale du bâtiment'] },
      { id: 'hazmat_test', q: 'Test amiante/plomb effectué ?', opts: ['Oui — rapport disponible', 'Non — à faire avant démarrage', 'Bâtiment après 1990 (faible risque)'] },
      { id: 'waste_mgmt', q: 'Gestion des débris', opts: ['Benne sur place à coordonner', 'Service inclus dans le prix', 'Client gère lui-même'] },
    ],
    'Paysagement': [
      { id: 'landscape_area', q: 'Superficie approximative', opts: ['Petit (<100 m²)', 'Moyen (100–300 m²)', 'Grand (300+ m²)', 'À mesurer'] },
      { id: 'lawn_type', q: 'Type de pelouse', opts: ['Gazon naturel ensemencement', 'Gazon en rouleau', 'Gazon artificiel', 'Couvre-sol / prairie', 'Pas de gazon'] },
      { id: 'irrigation_sys', q: 'Système d\'irrigation ?', opts: ['Oui — nouveau', 'Existant à modifier', 'Non requis'] },
      { id: 'hardscape', q: 'Pavage / entrée / patio', opts: ['Béton', 'Pavé uni', 'Asphalte', 'Gravier', 'Non inclus'] },
    ],
    'Fondation': [
      { id: 'foundation_type', q: 'Type de fondation', opts: ['Béton coulé (moderne)', 'Blocs de béton (parpaings)', 'Pierre (vieux bâtiment)', 'Radier / dalle sur sol'] },
      { id: 'crack_severity', q: 'Fissures observées', opts: ['Aucune', 'Fissures fines (cosmétiques)', 'Fissures horizontales (préoccupant)', 'Importantes — ingénieur requis'] },
      { id: 'waterproof_type', q: 'Type d\'imperméabilisation souhaitée', opts: ['Intérieure (drain français)', 'Extérieure (excavation)', 'Les deux', 'À évaluer'] },
    ],
    'Agrandissement': [
      { id: 'addition_type', q: 'Type d\'agrandissement', opts: ['Horizontal — expansion latérale', 'Vertical — ajout d\'étage', 'Surélévation', 'Annexe détachée (garage/suite)'] },
      { id: 'engineer_required', q: 'Ingénieur structurel requis ?', opts: ['Oui — travaux majeurs', 'Probablement', 'Non — agrandissement simple'] },
      { id: 'foundation_addition', q: 'Nouvelle fondation requise ?', opts: ['Oui — sous-sol inclus', 'Oui — dalle seulement', 'Non'] },
    ],
    'Construction neuve': [
      { id: 'build_type', q: 'Type de construction', opts: ['Maison unifamiliale', 'Duplex / triplex', 'Multiplex / condo', 'Commercial / industriel'] },
      { id: 'lot_status', q: 'État du terrain', opts: ['Lot vierge', 'Démolition préalable requise', 'Infrastructure partielle existante'] },
      { id: 'foundation_new', q: 'Type de fondation prévu', opts: ['Sous-sol complet', 'Vide sanitaire', 'Dalle sur sol (radier)', 'Pieux vissés'] },
      { id: 'plans_available', q: 'Plans architecturaux disponibles ?', opts: ['Oui — approuvés par la ville', 'Oui — en cours d\'approbation', 'Non — à préparer', 'Croquis seulement'] },
    ],
    'Commercial': [
      { id: 'commercial_use', q: 'Type d\'usage', opts: ['Bureau / coworking', 'Restaurant / bar', 'Commerce de détail', 'Clinique / médical', 'Entrepôt / industriel léger', 'Hôtel / hébergement'] },
      { id: 'fire_code', q: 'Gicleurs / alarme incendie', opts: ['Conformes', 'À mettre à niveau', 'À installer'] },
      { id: 'accessibility', q: 'Accessibilité PMR (handicapés)', opts: ['Conforme', 'À améliorer', 'Non applicable'] },
    ],
    'Ingénierie structurelle': [
      { id: 'structural_issue', q: 'Nature du problème', opts: ['Mur porteur à modifier', 'Poutre/colonne à remplacer', 'Plancher affaissé', 'Fondation endommagée', 'Évaluation préventive'] },
      { id: 'stamps', q: 'Sceau d\'ingénieur requis par la ville ?', opts: ['Oui — exigé', 'Oui — par prudence', 'Non', 'À confirmer'] },
      { id: 'urgency', q: 'Niveau d\'urgence', opts: ['Urgent — sécurité compromise', 'Modéré — corriger sous peu', 'Planifié — rénovation future'] },
    ],
  };

  /* Banque d'étapes + métiers recommandés par type de projet.
     Même logique que les questions par type dans la soumission approximative. */
  const PROJECT_TYPE_PHASE_LIBRARY = {
    'Cuisine': {
      selectedTradeKeys: ['demolition', 'plomberie', 'electricite', 'gypse', 'ebenisterie', 'plancher', 'peinture'],
      phases: [
        { name: 'Planification cuisine', trade_name: null, durationDays: 2 },
        { name: 'Démolition cuisine', trade_name: 'Démolition', durationDays: 2 },
        { name: 'Plomberie rough-in', trade_name: 'Plomberie', durationDays: 2 },
        { name: 'Électricité rough-in', trade_name: 'Électricité', durationDays: 2 },
        { name: 'Gypse & finition', trade_name: 'Gypse / cloisons', durationDays: 3 },
        { name: 'Pose des armoires', trade_name: 'Ébénisterie / armoires', durationDays: 3 },
        { name: 'Comptoir & dosseret', trade_name: 'Ébénisterie / armoires', durationDays: 2 },
        { name: 'Plancher', trade_name: 'Planchers', durationDays: 2 },
        { name: 'Peinture finale', trade_name: 'Peinture intérieure', durationDays: 2 },
        { name: 'Finition plomberie & électricité', trade_name: 'Plomberie', durationDays: 1 },
        { name: 'Nettoyage final', trade_name: null, durationDays: 1 },
      ],
    },
    'Salle de bain': {
      selectedTradeKeys: ['demolition', 'plomberie', 'electricite', 'gypse', 'ceramique', 'peinture'],
      phases: [
        { name: 'Planification salle de bain', trade_name: null, durationDays: 2 },
        { name: 'Démolition salle de bain', trade_name: 'Démolition', durationDays: 1 },
        { name: 'Plomberie rough-in', trade_name: 'Plomberie', durationDays: 2 },
        { name: 'Électricité rough-in', trade_name: 'Électricité', durationDays: 1 },
        { name: 'Gypse & membrane', trade_name: 'Gypse / cloisons', durationDays: 2 },
        { name: 'Céramique', trade_name: 'Céramique', durationDays: 3 },
        { name: 'Vanité & accessoires', trade_name: 'Plomberie', durationDays: 1 },
        { name: 'Peinture finale', trade_name: 'Peinture intérieure', durationDays: 1 },
        { name: 'Nettoyage final', trade_name: null, durationDays: 1 },
      ],
    },
    'Sous-sol': {
      selectedTradeKeys: ['charpenterie', 'plomberie', 'electricite', 'isolation', 'gypse', 'plancher', 'peinture'],
      phases: [
        { name: 'Planification sous-sol', trade_name: null, durationDays: 2 },
        { name: 'Charpente & divisions', trade_name: 'Charpenterie', durationDays: 4 },
        { name: 'Plomberie rough-in', trade_name: 'Plomberie', durationDays: 2 },
        { name: 'Électricité rough-in', trade_name: 'Électricité', durationDays: 2 },
        { name: 'Isolation', trade_name: 'Isolation', durationDays: 2 },
        { name: 'Gypse & finition', trade_name: 'Gypse / cloisons', durationDays: 4 },
        { name: 'Planchers', trade_name: 'Planchers', durationDays: 2 },
        { name: 'Peinture finale', trade_name: 'Peinture intérieure', durationDays: 2 },
        { name: 'Nettoyage final', trade_name: null, durationDays: 1 },
      ],
    },
    'Planchers': {
      selectedTradeKeys: ['demolition', 'plancher'],
      phases: [
        { name: 'Préparation des surfaces', trade_name: null, durationDays: 1 },
        { name: 'Dépose revêtement existant', trade_name: 'Démolition', durationDays: 1 },
        { name: 'Nivellement / correction', trade_name: 'Planchers', durationDays: 1 },
        { name: 'Pose du plancher', trade_name: 'Planchers', durationDays: 2 },
        { name: 'Plinthes & ajustements', trade_name: 'Planchers', durationDays: 1 },
      ],
    },
    'Peinture intérieure': {
      selectedTradeKeys: ['gypse', 'peinture'],
      phases: [
        { name: 'Préparation & protections', trade_name: null, durationDays: 1 },
        { name: 'Réparations de surfaces', trade_name: 'Gypse / cloisons', durationDays: 1 },
        { name: 'Peinture', trade_name: 'Peinture intérieure', durationDays: 2 },
        { name: 'Retouches & nettoyage', trade_name: 'Peinture intérieure', durationDays: 1 },
      ],
    },
    'Rénovation complète': {
      selectedTradeKeys: ['demolition', 'charpenterie', 'plomberie', 'electricite', 'hvac', 'isolation', 'gypse', 'plancher', 'peinture', 'ebenisterie'],
      phases: [
        { name: 'Planification générale', trade_name: null, durationDays: 3 },
        { name: 'Démolition', trade_name: 'Démolition', durationDays: 3 },
        { name: 'Structure & charpente', trade_name: 'Charpenterie', durationDays: 5 },
        { name: 'Plomberie rough-in', trade_name: 'Plomberie', durationDays: 3 },
        { name: 'Électricité rough-in', trade_name: 'Électricité', durationDays: 3 },
        { name: 'CVC', trade_name: 'Chauffage / CVC', durationDays: 2 },
        { name: 'Isolation', trade_name: 'Isolation', durationDays: 2 },
        { name: 'Gypse & finition', trade_name: 'Gypse / cloisons', durationDays: 5 },
        { name: 'Armoires & menuiserie', trade_name: 'Ébénisterie / armoires', durationDays: 3 },
        { name: 'Planchers', trade_name: 'Planchers', durationDays: 2 },
        { name: 'Peinture finale', trade_name: 'Peinture intérieure', durationDays: 2 },
        { name: 'Nettoyage final', trade_name: null, durationDays: 1 },
      ],
    },
    'Toiture': {
      selectedTradeKeys: ['couverture', 'charpenterie'],
      phases: [
        { name: 'Préparation toiture', trade_name: null, durationDays: 1 },
        { name: 'Dépose couverture', trade_name: 'Couverture / toiture', durationDays: 1 },
        { name: 'Réparations structurelles', trade_name: 'Charpenterie', durationDays: 1 },
        { name: 'Membrane & couverture', trade_name: 'Couverture / toiture', durationDays: 2 },
        { name: 'Solins & finitions', trade_name: 'Couverture / toiture', durationDays: 1 },
      ],
    },
    'Agrandissement': {
      selectedTradeKeys: ['excavation', 'fondation', 'charpenterie', 'electricite', 'plomberie', 'isolation', 'gypse', 'peinture'],
      phases: [
        { name: 'Planification & permis', trade_name: null, durationDays: 4 },
        { name: 'Excavation', trade_name: 'Excavation', durationDays: 2 },
        { name: 'Fondation', trade_name: 'Fondation / maçonnerie', durationDays: 3 },
        { name: 'Structure', trade_name: 'Charpenterie', durationDays: 5 },
        { name: 'Plomberie rough-in', trade_name: 'Plomberie', durationDays: 2 },
        { name: 'Électricité rough-in', trade_name: 'Électricité', durationDays: 2 },
        { name: 'Isolation', trade_name: 'Isolation', durationDays: 2 },
        { name: 'Gypse & finition', trade_name: 'Gypse / cloisons', durationDays: 4 },
        { name: 'Peinture finale', trade_name: 'Peinture intérieure', durationDays: 2 },
      ],
    },
    'Électricité': {
      selectedTradeKeys: ['electricite'],
      phases: [
        { name: 'Diagnostic électrique', trade_name: 'Électricité', durationDays: 1 },
        { name: 'Préparation & sécurisation', trade_name: 'Électricité', durationDays: 1 },
        { name: 'Travaux électriques', trade_name: 'Électricité', durationDays: 2 },
        { name: 'Tests & mise en service', trade_name: 'Électricité', durationDays: 1 },
      ],
    },
    'Plomberie': {
      selectedTradeKeys: ['plomberie'],
      phases: [
        { name: 'Diagnostic plomberie', trade_name: 'Plomberie', durationDays: 1 },
        { name: 'Préparation du chantier', trade_name: 'Plomberie', durationDays: 1 },
        { name: 'Travaux de plomberie', trade_name: 'Plomberie', durationDays: 2 },
        { name: 'Tests & finition', trade_name: 'Plomberie', durationDays: 1 },
      ],
    },
    'Chauffage / climatisation (CVC)': {
      selectedTradeKeys: ['hvac', 'electricite'],
      phases: [
        { name: 'Diagnostic CVC', trade_name: 'Chauffage / CVC', durationDays: 1 },
        { name: 'Préparation & raccordements', trade_name: 'Électricité', durationDays: 1 },
        { name: 'Installation CVC', trade_name: 'Chauffage / CVC', durationDays: 2 },
        { name: 'Mise en service', trade_name: 'Chauffage / CVC', durationDays: 1 },
      ],
    },
  };
  const projectWorkType = getProjectWorkType();
  const projectTypePlaybook = getProjectTypePlaybook(projectWorkType);
  const recommendedPhaseTemplates = projectTypePlaybook?.phases?.length ? projectTypePlaybook.phases : PHASE_TEMPLATES;

  /* Lignes pré-remplies suggérées par type de travaux */
  const SUGGESTED_LINES = {
    'Cuisine': [
      { poste:'Démolition cuisine', inclus:'Armoires, comptoir, revêtement sol', non_inclus:'Désamiantage', duree:'1-2 j', cout:'', prix_vente:'' },
      { poste:'Armoires', inclus:'Fourniture + pose', non_inclus:'Électroménagers', duree:'3-5 j', cout:'', prix_vente:'' },
      { poste:'Comptoir', inclus:'Fourniture + pose + dosseret', non_inclus:'', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Plomberie cuisine', inclus:'Évier, robinetterie, branchements', non_inclus:'Déplacement drain', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Électricité cuisine', inclus:'Circuits sous-comptoir, hotte', non_inclus:'Panneau', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Revêtement de sol', inclus:'Fourniture + pose', non_inclus:'', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Peinture', inclus:'Murs, plafond', non_inclus:'Portes', duree:'1 j', cout:'', prix_vente:'' },
    ],
    'Salle de bain': [
      { poste:'Démolition SDB', inclus:'Céramique, bain, vanité', non_inclus:'Amiante', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Plomberie', inclus:'Tuyauterie, branchements', non_inclus:'Déplacement drain', duree:'2 j', cout:'', prix_vente:'' },
      { poste:'Douche / bain', inclus:'Fourniture + installation', non_inclus:'', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Céramique murs + plancher', inclus:'Fourniture + pose', non_inclus:'Pierre naturelle', duree:'2-3 j', cout:'', prix_vente:'' },
      { poste:'Vanité + miroir', inclus:'Fourniture + installation', non_inclus:'Éclairage encastré', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Électricité SDB', inclus:'Éclairage, ventilateur, prises GFCI', non_inclus:'', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Gypse / plafond', inclus:'Cloisons humides, mastic, peinture', non_inclus:'', duree:'1 j', cout:'', prix_vente:'' },
    ],
    'Sous-sol': [
      { poste:'Ossature / cloisons', inclus:'Montants acier ou bois, seuils', non_inclus:'', duree:'2-3 j', cout:'', prix_vente:'' },
      { poste:'Isolation périmètre', inclus:'Murs extérieurs', non_inclus:'Plancher', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Gypse', inclus:'Pose, mastic, sablage', non_inclus:'Peinture', duree:'3-4 j', cout:'', prix_vente:'' },
      { poste:'Plafond suspendu', inclus:'Grille T-bar + tuiles', non_inclus:'Luminaires encastrés', duree:'1-2 j', cout:'', prix_vente:'' },
      { poste:'Revêtement de sol', inclus:'LVP ou céramique, sous-plancher', non_inclus:'', duree:'1-2 j', cout:'', prix_vente:'' },
      { poste:'Électricité', inclus:'Circuits, sorties, éclairage', non_inclus:'', duree:'1-2 j', cout:'', prix_vente:'' },
      { poste:'Peinture', inclus:'Murs, plafond', non_inclus:'', duree:'1-2 j', cout:'', prix_vente:'' },
    ],
    'Toiture': [
      { poste:'Dépose ancienne couverture', inclus:'Retrait + disposition débris', non_inclus:'Décontamination', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Réparation pontage/OSB', inclus:'Sections endommagées', non_inclus:'', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Membrane sous-toiture', inclus:'Ice & Water, feutre', non_inclus:'', duree:'0.5 j', cout:'', prix_vente:'' },
      { poste:'Couverture', inclus:'Bardeaux ou tôle, pose', non_inclus:'Puits de lumière', duree:'1-2 j', cout:'', prix_vente:'' },
      { poste:'Solins', inclus:'Cheminée, lucarnes — aluminium', non_inclus:'', duree:'0.5 j', cout:'', prix_vente:'' },
      { poste:'Gouttières', inclus:'Fourniture + installation + descentes', non_inclus:'', duree:'0.5 j', cout:'', prix_vente:'' },
    ],
    'Rénovation complète': [
      { poste:'Démolition sélective', inclus:'Finitions, cloisons ciblées', non_inclus:'Décontamination', duree:'2-3 j', cout:'', prix_vente:'' },
      { poste:'Plomberie — rough-in + finition', inclus:'Tuyauterie complète', non_inclus:'Déplacement majeur', duree:'', cout:'', prix_vente:'' },
      { poste:'Électricité — rough-in + finition', inclus:'Circuits + finition', non_inclus:'Panneau principal', duree:'', cout:'', prix_vente:'' },
      { poste:'Gypse / cloisons', inclus:'Pose, mastic, sablage', non_inclus:'', duree:'', cout:'', prix_vente:'' },
      { poste:'Revêtements de sol', inclus:'Toutes pièces — fourniture + pose', non_inclus:'', duree:'', cout:'', prix_vente:'' },
      { poste:'Peinture complète', inclus:'Murs, plafonds, boiseries', non_inclus:'Extérieur', duree:'', cout:'', prix_vente:'' },
      { poste:'Cuisine (armoires + comptoir)', inclus:'Fourniture + pose', non_inclus:'Électroménagers', duree:'', cout:'', prix_vente:'' },
      { poste:'Main-d\'œuvre & coordination', inclus:'Supervision, nettoyage final', non_inclus:'Heures supp.', duree:'', cout:'', prix_vente:'' },
    ],
    'Électricité': [
      { poste:'Remplacement panneau électrique', inclus:'Panneau + fils + branchements', non_inclus:'Entrée Hydro-Québec', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Câblage — nouveaux circuits', inclus:'Romex, conduits, prises, interrupteurs', non_inclus:'', duree:'', cout:'', prix_vente:'' },
      { poste:'Éclairage encastré LED', inclus:'Fourniture + installation', non_inclus:'Luminaires décoratifs', duree:'', cout:'', prix_vente:'' },
      { poste:'Borne VE 240V', inclus:'Circuit dédié + prise NEMA 14-50', non_inclus:'Mise à niveau entrée', duree:'0.5 j', cout:'', prix_vente:'' },
    ],
    'Plomberie': [
      { poste:'Remplacement tuyauterie', inclus:'PEX ou cuivre, eau froide/chaude', non_inclus:'Égout principal', duree:'', cout:'', prix_vente:'' },
      { poste:'Chauffe-eau', inclus:'Fourniture + installation', non_inclus:'', duree:'0.5 j', cout:'', prix_vente:'' },
      { poste:'SDB — rough-in plomberie', inclus:'Rough-in + raccordements', non_inclus:'Accessoires', duree:'1 j', cout:'', prix_vente:'' },
    ],
    'Démolition': [
      { poste:'Démolition intérieure', inclus:'Cloisons, revêtements, plafonds', non_inclus:'Structure portante', duree:'', cout:'', prix_vente:'' },
      { poste:'Disposition des débris (benne)', inclus:'Location benne + transport', non_inclus:'Matériaux dangereux', duree:'', cout:'', prix_vente:'' },
      { poste:'Décontamination amiante/plomb', inclus:'Selon rapport environnemental', non_inclus:'Tests de laboratoire', duree:'', cout:'', prix_vente:'' },
    ],
    'Paysagement': [
      { poste:'Nivellement / terrassement', inclus:'Machinerie légère', non_inclus:'Excavation profonde', duree:'', cout:'', prix_vente:'' },
      { poste:'Gazon en rouleau', inclus:'Pose, terreautage', non_inclus:'Ensemencement', duree:'', cout:'', prix_vente:'' },
      { poste:'Plantation (arbres, arbustes)', inclus:'Fourniture + installation', non_inclus:'Entretien annuel', duree:'', cout:'', prix_vente:'' },
      { poste:'Pavé uni / entrée', inclus:'Fourniture + pose', non_inclus:'Excavation', duree:'', cout:'', prix_vente:'' },
    ],
    'Chauffage / climatisation': [
      { poste:'Thermopompe centrale', inclus:'Fourniture + installation + réfrigérant', non_inclus:'Remplacement conduits', duree:'1-2 j', cout:'', prix_vente:'' },
      { poste:'Thermopompettes (mini-split)', inclus:'Unités intérieures + extérieure', non_inclus:'Raccordement électrique', duree:'1 j', cout:'', prix_vente:'' },
      { poste:'Conduits / grilles', inclus:'Remplacement ou ajout', non_inclus:'', duree:'', cout:'', prix_vente:'' },
    ],
    'Fondation': [
      { poste:'Excavation extérieure', inclus:'Machinerie, terre excavée', non_inclus:'Remblayage', duree:'', cout:'', prix_vente:'' },
      { poste:'Imperméabilisation fondation', inclus:'Membrane + drain agricole', non_inclus:'Injection fissures', duree:'', cout:'', prix_vente:'' },
      { poste:'Coulée béton / réparation', inclus:'Matériaux + main-d\'œuvre', non_inclus:'Ingénierie', duree:'', cout:'', prix_vente:'' },
    ],
    'Agrandissement': [
      { poste:'Fondation agrandissement', inclus:'Excavation + coulée', non_inclus:'Ingénierie structurelle', duree:'', cout:'', prix_vente:'' },
      { poste:'Charpente (ossature bois)', inclus:'Murs, plancher, toit', non_inclus:'Dessins d\'architecte', duree:'', cout:'', prix_vente:'' },
      { poste:'Revêtement extérieur', inclus:'Bardage, fenêtres, porte', non_inclus:'', duree:'', cout:'', prix_vente:'' },
      { poste:'Isolation + gypse intérieur', inclus:'Murs + plafond', non_inclus:'', duree:'', cout:'', prix_vente:'' },
    ],
  };

  const PIPE = [
    { key: 'brouillon', label: 'Brouillon' }, { key: 'estimation', label: 'Estimation' },
    { key: 'prix_envoye', label: 'Prix envoyé' }, { key: 'accepte', label: 'Accepté' },
    { key: 'planifie', label: 'Planifié' }, { key: 'en_chantier', label: 'En chantier' },
    { key: 'a_facturer', label: 'À facturer' }, { key: 'paye', label: 'Payé' },
    { key: 'clos', label: 'Clos' },
  ];
  const pipeActiveIdx = PIPE.findIndex(s => s.key === project.status);

  const toggleSectionVisibility = (sectionId) => {
    setHiddenSections(prev => {
      const next = prev.includes(sectionId) ? prev.filter(x => x !== sectionId) : [...prev, sectionId];
      localStorage.setItem(`monflux-toc-hidden-${id}`, JSON.stringify(next));
      return next;
    });
  };

  const onTocDragStart = (e, idx) => {
    setDragSrcIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
  };

  const onTocDragOver = (e, idx) => {
    e.preventDefault();
    if (dragSrcIdx === null || dragSrcIdx === idx) return;
    const next = [...tocSections];
    const [item] = next.splice(dragSrcIdx, 1);
    next.splice(idx, 0, item);
    setTocSections(next);
    setDragSrcIdx(idx);
  };

  const onTocDrop = (e) => {
    e.preventDefault();
    setDragSrcIdx(null);
    localStorage.setItem(`monflux-toc-order-${id}`, JSON.stringify(tocSections));
  };

  const ProjectTOC = () => (
    <>
      <div className="app-sidebar-section-label">Fiche projet</div>
      <div className="app-sidebar-section-title">{project.name}</div>
      <div className="project-toc-list">
        {tocSections.map((s, idx) => {
          const isHidden = hiddenSections.includes(s.id);
          return (
            <div
              key={s.id}
              draggable
              onDragStart={e => onTocDragStart(e, idx)}
              onDragOver={e => onTocDragOver(e, idx)}
              onDrop={onTocDrop}
              style={{ display: 'flex', alignItems: 'center', gap: 0, opacity: isHidden ? 0.4 : 1 }}
            >
              <span style={{ cursor: 'grab', color: '#4B5563', padding: '6px 4px', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.4 }}
                title="Glisser pour réordonner">
                <GripVertical size={12} />
              </span>
              <button
                type="button"
                className={`project-toc-item ${activeSection === s.id && !isHidden ? 'active' : ''}`}
                style={{ flex: 1, opacity: isHidden ? 0.5 : 1 }}
                onClick={() => !isHidden && scrollToSection(s.id)}
              >
                <span className="project-toc-icon">{s.icon}</span>
                <span className="project-toc-label">{s.label}</span>
                {s.badge && <span className="project-toc-badge">{s.badge}</span>}
              </button>
              <button
                type="button"
                title={isHidden ? 'Afficher la section' : 'Masquer la section'}
                onClick={() => toggleSectionVisibility(s.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', color: isHidden ? '#E8794E' : '#6B7280', flexShrink: 0, opacity: isHidden ? 1 : 0, transition: 'opacity .15s' }}
                className="toc-eye-btn"
              >
                {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          );
        })}
      </div>
      <div className="app-sidebar-bottom pt-3">
        <button
          className="btn-ghost w-full text-xs"
          onClick={() => navigate(`/soumissions?new=1&project_id=${id}&title=${encodeURIComponent(t('change_order')+' — '+project.name)}`)}
        >
          <GitBranch size={12}/> {t('create_change_order')}
        </button>
      </div>
    </>
  );

  return (
    <Layout toc={<ProjectTOC />} noTopbar>
      <style>{
        tocSections.map((s, idx) => `#${s.id}{order:${idx}}`).join('') +
        hiddenSections.map(sid => `#${sid}{display:none!important}`).join('') +
        `.toc-eye-btn{opacity:0!important}.project-toc-list>div:hover .toc-eye-btn{opacity:1!important}`
      }</style>
      {/* ── Project Topbar ── */}
      <div style={{
        position: 'sticky', top: 0, height: 54,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center',
        gap: 10, padding: '0 20px', zIndex: 15,
      }}>
        <button
          onClick={() => navigate('/projets')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#7C8089', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
        >
          Projets
        </button>
        <span style={{ color: '#C8CACD', fontSize: 13, flexShrink: 0 }}>›</span>
        <b style={{ fontSize: 13, color: '#15171C', fontWeight: 700 }}>{project.name}</b>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary text-xs" onClick={() => window.print()} style={{ flexShrink: 0 }}>
          📥 Exporter PDF
        </button>
        <button className="btn-primary text-xs" style={{ flexShrink: 0 }} onClick={() => {
          if (project.portal_token) {
            navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`);
          }
        }}>
          Envoyer →
        </button>
      </div>

      {/* ── Capture IA — bouton d'appel à l'action multimodal (tout en haut) ── */}
      <div className="proj-cta-wrap" style={{ padding: '20px 56px', borderBottom: '1px solid #E8EAED', background: '#fff' }}>
        <button onClick={() => setShowCapture(true)}
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 16, padding: '20px 24px',
            background: `linear-gradient(135deg,#F0A884 0%,${BRAND} 52%,${BRAND_DARK} 100%)`, color: '#fff',
            boxShadow: '0 10px 28px rgba(200,90,43,.26)', display: 'flex', alignItems: 'center', gap: 18,
            transition: 'transform .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 34px rgba(200,90,43,.32)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(200,90,43,.26)'; }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.4)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Sparkles size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Ajoute n'importe quoi au projet</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.92)', lineHeight: 1.5 }}>
              Écris, dicte, parle, prends une photo ou une vidéo, dépose un document — l'IA analyse, classe au bon endroit et propose la suite.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, color: 'rgba(255,255,255,.8)' }}>
            <Mic size={18} /><Camera size={18} /><FileText size={18} /><Pencil size={18} />
          </div>
        </button>
      </div>

      {/* ── Hero ── */}
      {(() => {
        const fa = project.field_assessment || {};
        const startLabel = fa.start_label || (project.start_date ? project.start_date.slice(0,10) : '');
        const endLabel   = fa.end_label   || (project.end_date   ? project.end_date.slice(0,10)   : '');
        const workType   = fa.work_type || WORK_TYPE_LABELS[project.type] || '';
        const addr       = project.address || '';

        const overdue = projectInvoices.some(inv => inv.status === 'overdue');
        const healthStatus = (overdue || ['brouillon','estimation'].includes(project.status)) ? 'red'
          : ['accepte','planifie','en_chantier','paye','clos'].includes(project.status) ? 'green' : 'yellow';
        const HC = { green: { bg:'#DCFCE7', dot:'#16a34a', label:'En bonne santé' }, yellow: { bg:'#FEF9C3', dot:'#CA8A04', label:'Attention requise' }, red: { bg:'#FEE2E2', dot:'#DC2626', label:'Action requise' } };
        const hc = HC[healthStatus];

        const IFS = { fontSize: 13.5, color: '#15171C', fontWeight: 500 };
        const IFD = { fontSize: 13.5, color: '#15171C', fontWeight: 500 };

        return (
          <div id="s-hero" style={{ padding: '36px 56px 32px', background: '#E7EFF4', borderBottom: '1px solid #E8EAED' }}>

            {/* Statut */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', background: BRAND, borderRadius: 999, padding: '4px 14px', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.72)', display: 'inline-block' }} />
              Projet · {PIPELINE_LABELS[project.status] || project.status || 'Brouillon'}
            </div>

            {/* Titre composé — format : Type de travaux | Adresse | Début - Fin */}
            <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.2, color: '#15171C', margin: '0 0 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 4px' }}>
              <InlineField value={workType} onSave={v => saveAssessmentField('work_type', v)} placeholder="Type de travaux"
                style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }}
                displayStyle={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }} />
              {addr && <span style={{ color: '#C8CACD', fontWeight: 300, padding: '0 4px' }}>|</span>}
              <InlineField value={addr} onSave={v => saveField('address', v)} placeholder="Adresse"
                style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }}
                displayStyle={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }} />
              {(startLabel || endLabel) && <span style={{ color: '#C8CACD', fontWeight: 300, padding: '0 4px' }}>|</span>}
              <InlineField value={startLabel} onSave={v => saveAssessmentField('start_label', v)} placeholder="Début"
                style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }}
                displayStyle={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }} />
              {startLabel && endLabel && <span style={{ color: '#C8CACD', fontWeight: 400 }}> -</span>}
              {endLabel && <span> </span>}
              <InlineField value={endLabel} onSave={v => saveAssessmentField('end_label', v)} placeholder="Fin"
                style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }}
                displayStyle={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }} />
            </h1>

            {/* Client — sans fond, mise en valeur typographique */}
            <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: '12px 32px', alignItems: 'flex-start' }}>
              {[
                { label: 'Client', value: project.client_name, field: 'name', save: v => saveClientField('name', v), placeholder: 'Nom du client', w: 160 },
                { label: 'Téléphone', value: project.client_phone, field: 'phone', save: v => saveClientField('phone', v), placeholder: '—', w: 130 },
                { label: 'Courriel', value: project.client_email, field: 'email', save: v => saveClientField('email', v), placeholder: '—', w: 190 },
                { label: 'Remarque contact', value: fa.client_note, field: 'note', save: v => saveAssessmentField('client_note', v), placeholder: 'meilleur moment, mode de contact…', w: 220 },
              ].map(({ label, value, save, placeholder, w }) => (
                <div key={label} style={{ minWidth: w }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', margin: '0 0 3px' }}>{label}</p>
                  <p style={{ fontSize: 15, fontWeight: label === 'Client' ? 700 : 500, color: '#15171C', margin: 0 }}>
                    <InlineField value={value} onSave={save} placeholder={placeholder}
                      style={{ fontSize: 15, fontWeight: label === 'Client' ? 700 : 500, color: '#15171C' }}
                      displayStyle={{ fontSize: 15, fontWeight: label === 'Client' ? 700 : 500, color: '#15171C' }} />
                  </p>
                </div>
              ))}
            </div>

            {/* Métriques non-éditables + rentabilité + QR */}
            {(() => {
              const kvChips = [
                contractValue > 0 && {
                  label: 'Valeur contrat', value: money(contractValue),
                  tooltip: projectContracts.length > 0 ? `${projectContracts.length} contrat${projectContracts.length > 1 ? 's' : ''} signé${projectContracts.length > 1 ? 's' : ''}` : 'Montant total du contrat',
                  bg: '#fff', border: '1px solid rgba(0,0,0,.09)', dot: null,
                },
                heroNextPaymentAmount > 0 && {
                  label: 'Prochain versement', value: money(heroNextPaymentAmount),
                  tooltip: nextInstallment ? `${nextInstallment.label} — ${nextInstallment.pct}% du contrat` : (project.payment_terms ? `Termes : ${project.payment_terms}` : null),
                  bg: '#fff', border: '1px solid rgba(0,0,0,.09)', dot: null,
                },
                {
                  label: 'Santé du chantier', value: hc.label,
                  tooltip: overdue
                    ? `Tu as ${projectInvoices.filter(i => i.status === 'overdue').length} facture${projectInvoices.filter(i => i.status === 'overdue').length > 1 ? 's' : ''} en retard`
                    : ['brouillon','estimation'].includes(project.status)
                      ? `Statut actuel : ${PIPELINE_LABELS[project.status] || project.status}`
                      : null,
                  bg: hc.bg, border: `1px solid ${hc.dot}33`, dot: hc.dot,
                },
                profit && profit.theoretical.margin_pct != null && {
                  label: 'Marge théorique',
                  value: `${profit.theoretical.margin_pct}%`,
                  tooltip: `Revenus ${money(profit.theoretical.revenue)} − Coûts ${money(profit.theoretical.cost)}`,
                  bg: profit.theoretical.margin_pct >= 0 ? '#DCFCE7' : '#FEE2E2',
                  border: `1px solid ${profit.theoretical.margin_pct >= 0 ? '#16a34a33' : '#DC262633'}`,
                  dot: null,
                  extra: profit.theoretical.margin != null ? money(profit.theoretical.margin) : null,
                },
                profit && profit.actual.margin_pct != null && {
                  label: 'Marge réelle',
                  value: `${profit.actual.margin_pct}%`,
                  tooltip: profit.actual.cost_breakdown?.hours_logged > 0
                    ? `${profit.actual.cost_breakdown.hours_logged}h pointées · MO ${money(profit.actual.cost_breakdown.labor_punch)} · dépenses ${money(profit.actual.cost_breakdown.expenses)}`
                    : `Facturé ${money(profit.actual.revenue)} − dépenses ${money(profit.actual.cost)}`,
                  bg: profit.actual.margin_pct >= 0 ? '#DCFCE7' : '#FEE2E2',
                  border: `1px solid ${profit.actual.margin_pct >= 0 ? '#16a34a33' : '#DC262633'}`,
                  dot: null,
                  extra: profit.actual.margin != null ? money(profit.actual.margin) : null,
                },
              ].filter(Boolean);
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignItems: 'center' }}>
                  {kvChips.map((chip, ci) => (
                    <KvTooltipChip key={ci} chip={chip} />
                  ))}
                  {qrData && (
                    <button onClick={() => setShowQrModal(true)} title="QR Punch — cliquer pour agrandir"
                      style={{ marginLeft: 'auto', background: '#fff', border: '1px solid #E8EAED', borderRadius: 10, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.08)', flexShrink: 0 }}>
                      <img src={qrData.qr_image} alt="QR Punch" style={{ width: 44, height: 44, display: 'block', borderRadius: 6 }} />
                    </button>
                  )}
                </div>
              );
            })()}


            {/* Grille éditables — ordre optimisé, responsable permis conditionnel */}
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px 28px' }}>
                {[
                  { label: 'Type de travaux', fn: null, value: workType, isWorkType: true },
                  { label: 'Adresse',               fn: v => saveField('address', v),               value: addr },
                  { label: 'Date début',            fn: v => saveAssessmentField('start_label', v), value: startLabel },
                  { label: 'Date fin',              fn: v => saveAssessmentField('end_label', v),   value: endLabel },
                  { label: 'Termes paiement',       fn: v => saveField('payment_terms', v),         value: project.payment_terms },
                  { label: 'Chargé de projet',      fn: v => saveField('project_manager', v),       value: project.project_manager },
                  { label: 'Acheteur matériaux',    fn: v => saveField('materials_buyer', v),       value: project.materials_buyer },
                  { label: 'Approbateurs',          fn: v => saveField('approvers', v),             value: (project.approvers || []).join(', ') },
                  { label: 'Machines / équipements',fn: v => saveField('machines', v),              value: (project.machines || []).join(', ') },
                ].map(({ label, fn, value, isWorkType }) => (
                  <div key={label}>
                    <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(21,23,28,.42)', margin: 0 }}>{label}</p>
                    {isWorkType ? (
                      <select value={value || ''} onChange={e => saveAssessmentField('work_type', e.target.value)}
                        style={{ fontSize: 13.5, color: value ? '#15171C' : '#B0B3BA', fontWeight: 500, background: 'none', border: 'none', padding: '3px 0', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', width: '100%', marginTop: 3 }}>
                        <option value="">— Choisir —</option>
                        {WORK_TYPE_OPTIONS.reduce((acc, opt) => {
                          const last = acc[acc.length - 1];
                          if (!last || last.group !== opt.group) acc.push({ group: opt.group, items: [opt] });
                          else last.items.push(opt);
                          return acc;
                        }, []).map(g => (
                          <optgroup key={g.group} label={g.group}>
                            {g.items.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </optgroup>
                        ))}
                        <option value="Autre">Autre…</option>
                      </select>
                    ) : (
                      <p style={{ fontSize: 13.5, color: '#15171C', marginTop: 3, fontWeight: 500 }}>
                        <InlineField value={value} onSave={fn} placeholder="—" style={IFS} displayStyle={IFD} />
                      </p>
                    )}
                  </div>
                ))}
                {/* Permis requis — toggle */}
                <div>
                  <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(21,23,28,.42)', margin: 0 }}>Permis requis</p>
                  <p style={{ fontSize: 13.5, color: '#15171C', marginTop: 3, fontWeight: 500 }}>
                    <button onClick={() => saveField('permits_required', !project.permits_required)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, color: '#15171C', fontWeight: 500, padding: 0, borderBottom: '1px dashed transparent', transition: 'border-color .15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'rgba(232,121,78,.5)'}
                      onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
                      {project.permits_required ? 'Oui' : 'Non'}
                    </button>
                  </p>
                </div>
                {/* Responsable permis — visible seulement si permis requis */}
                {project.permits_required && (
                  <div>
                    <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(21,23,28,.42)', margin: 0 }}>Responsable permis</p>
                    <p style={{ fontSize: 13.5, color: '#15171C', marginTop: 3, fontWeight: 500 }}>
                      <InlineField value={project.permits_responsible} onSave={v => saveField('permits_responsible', v)} placeholder="—" style={IFS} displayStyle={IFD} />
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Pipeline — fusionné dans l'entête ── */}
            {(() => {
              const statusDates = (project.field_assessment || {}).status_dates || {};
              const fmtDate = iso => {
                if (!iso) return null;
                const d = new Date(iso);
                return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
              };
              return (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,.08)' }}>
                  <div style={{ position: 'relative', padding: '8px 0 0' }}>
                    <div style={{ position: 'absolute', top: 28, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,.1)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 28, left: 0, height: 3, background: BRAND, zIndex: 1, transition: '.4s', width: pipeActiveIdx >= 0 ? `${(pipeActiveIdx / (PIPE.length - 1)) * 100}%` : '0%' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      {PIPE.map((s, i) => {
                        const isDone = i < pipeActiveIdx;
                        const isActive = i === pipeActiveIdx;
                        const dateStr = fmtDate(statusDates[s.key]);
                        return (
                          <div key={s.key}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, cursor: isActive ? 'default' : 'pointer' }}
                            onClick={() => { if (!isActive) setStatusPopup({ key: s.key, label: s.label }); }}
                            title={isActive ? 'Étape en cours' : `Passer à : ${s.label}`}
                          >
                            <div style={{
                              width: isActive ? 22 : 18, height: isActive ? 22 : 18, borderRadius: '50%',
                              border: `3px solid ${isDone ? '#16a34a' : isActive ? BRAND : 'rgba(0,0,0,.15)'}`,
                              background: isDone ? '#16a34a' : isActive ? BRAND : 'rgba(255,255,255,.7)',
                              display: 'grid', placeItems: 'center', transition: '.2s',
                              boxShadow: isActive ? '0 0 0 4px rgba(232,121,78,.2)' : 'none',
                            }}>
                              {isDone && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
                              {isActive && <span style={{ color: '#fff', fontSize: 8 }}>●</span>}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, color: isDone ? '#16a34a' : isActive ? BRAND_DARK : 'rgba(21,23,28,.55)', textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
                            {dateStr
                              ? <span style={{ fontSize: 9.5, color: isDone ? '#16a34a' : isActive ? BRAND_DARK : 'rgba(21,23,28,.35)', fontWeight: 500, textAlign: 'center', marginTop: -2 }}>{dateStr}</span>
                              : <span style={{ fontSize: 9.5, color: 'transparent', userSelect: 'none' }}>·</span>
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        );
      })()}

      {/* ── Capture multimodale ── */}
      {showCapture && (
        <CaptureModal
          projectId={id}
          projectName={project.name}
          onClose={() => setShowCapture(false)}
          onAdded={(createdMedia, hadDocs) => {
            if (createdMedia.length) setMedia(prev => [...createdMedia, ...prev]);
            if (hadDocs) load();
          }}
        />
      )}

      {/* ── Chat IA du projet ── */}
      {showAIChat && (
        <ProjectAIChat
          projectId={id}
          projectName={project.name}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {/* ── Bouton flottant Chat IA ── */}
      {!showAIChat && (
        <button className="ai-float-btn" onClick={() => setShowAIChat(true)} title="Parler à Florence — assistante IA">
          <Sparkles size={22} />
        </button>
      )}

      {/* ── QR Modal ── */}
      {showQrModal && qrData && (
        <div onClick={() => setShowQrModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', margin: '0 0 8px' }}>QR Punch</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#15171C', margin: '0 0 20px', lineHeight: 1.3 }}>{project.name}</h3>
            <img src={qrData.qr_image} alt="QR Punch" style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid #E8EAED', display: 'block', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 12, color: '#7C8089', margin: '0 0 20px' }}>Affichez ce QR à l'entrée du chantier. Les travailleurs scannent pour pointer entrée/sortie.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowQrModal(false)} style={{ flex: 1, padding: '10px 0', border: '1px solid #E8EAED', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Fermer</button>
              <button onClick={printQR} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, background: BRAND, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>🖨 Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox — media & documents ── */}
      {lightboxItem && (
        <div onClick={() => setLightboxItem(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 9000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <button onClick={() => setLightboxItem(null)}
            style={{ position: 'absolute', top: 20, right: 20, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', zIndex: 1 }}>
            <X size={18} color="#fff"/>
          </button>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', maxWidth: 860, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,.4)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            {/* Preview */}
            <div style={{ background: '#1C1C1E', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, maxHeight: '60vh', overflow: 'hidden' }}>
              {lightboxItem.type === 'photo' && lightboxItem.url
                ? <img src={lightboxItem.url} alt={lightboxItem.caption || ''} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' }}/>
                : lightboxItem.type === 'video' && lightboxItem.url
                  ? <video src={lightboxItem.url} controls style={{ maxWidth: '100%', maxHeight: '60vh' }}/>
                  : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 40 }}>
                      <span style={{ fontSize: 64 }}>{lightboxItem.type === 'voice' ? '🎙' : lightboxItem.type === 'note' ? '📌' : '📄'}</span>
                      {lightboxItem.transcript && <p style={{ fontSize: 14, color: '#fff', textAlign: 'center', maxWidth: 480, margin: 0, lineHeight: 1.6 }}>{lightboxItem.transcript}</p>}
                    </div>}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#15171C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lightboxItem.caption || lightboxItem.name || lightboxItem.filename || lightboxItem.transcript?.slice(0, 60) || '—'}
                </p>
                {lightboxItem.created_at && (
                  <p style={{ fontSize: 11.5, color: '#7C8089', margin: '3px 0 0' }}>
                    {new Date(lightboxItem.created_at).toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              {lightboxItem.url && (
                <>
                  <button onClick={() => {
                    if (navigator.share) { navigator.share({ url: lightboxItem.url, title: lightboxItem.caption || 'Document' }).catch(() => {}); }
                    else { navigator.clipboard.writeText(lightboxItem.url); }
                  }}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #E8EAED', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#3A3D44', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Share2 size={13}/> Partager
                  </button>
                  <a href={lightboxItem.url} download target="_blank" rel="noreferrer"
                    style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: BRAND, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
                    <Download size={13}/> Télécharger
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Doc sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* ── Résumé de la demande + médias client ── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8EAED' }}>
          {/* Zone description */}
          <div style={{ padding: '18px 56px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', margin: 0 }}>Résumé de la demande</p>
              <button
                onClick={() => { setShowClientReply(s => !s); setClientReplyText(''); }}
                style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, color: BRAND, background: 'rgba(232,121,78,.08)', border: `1px solid rgba(232,121,78,.25)`, borderRadius: 20, padding: '3px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                {showClientReply ? <X size={11}/> : <MessageSquare size={11}/>}
                {showClientReply ? 'Annuler' : 'Coller réponse client'}
              </button>
            </div>
            <InlineField
              value={project.description || ''}
              onSave={v => saveField('description', v)}
              placeholder="Décris ici la demande du client, la portée des travaux, les contraintes particulières…"
              multiline
              style={{ fontSize: 14, color: '#3F3F46', fontWeight: 400, lineHeight: 1.65, maxWidth: 720 }}
              displayStyle={{ fontSize: 14, color: project.description ? '#3F3F46' : '#B0B3BA', fontWeight: 400, lineHeight: 1.65, maxWidth: 720 }}
            />

            {/* Zone coller réponse client */}
            {showClientReply && (
              <div style={{ marginTop: 12, padding: 14, background: '#F8FAFB', borderRadius: 10, border: '1px solid #E8EAED' }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: '#4B5563', margin: '0 0 8px' }}>Colle ici la réponse reçue du client — elle remplacera le résumé actuel.</p>
                <textarea
                  value={clientReplyText}
                  onChange={e => setClientReplyText(e.target.value)}
                  placeholder="Copie-colle le courriel ou message du client ici…"
                  style={{ width: '100%', minHeight: 100, padding: '10px 12px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#15171C' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    disabled={!clientReplyText.trim()}
                    onClick={async () => { await saveField('description', clientReplyText.trim()); setShowClientReply(false); setClientReplyText(''); }}
                    className="btn-primary text-xs">
                    Enregistrer comme résumé
                  </button>
                  <button onClick={() => { setShowClientReply(false); setClientReplyText(''); }} className="btn-secondary text-xs">Annuler</button>
                </div>
              </div>
            )}
          </div>

          {/* Galerie horizontale — photos & documents du client */}
          {(media.length > 0 || (project.documents || []).length > 0) && (
            <div style={{ padding: '0 56px 18px' }}>
              <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', margin: '0 0 8px' }}>
                Photos & documents reçus · {media.length + (project.documents || []).length}
              </p>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                {/* Photos / vidéos */}
                {media.map(m => (
                  <div key={m.id} style={{ flexShrink: 0, width: 120, height: 90, borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', background: '#F4F5F6', position: 'relative', cursor: 'pointer' }}
                    onClick={() => setLightboxItem(m)}>
                    {m.type === 'photo' && m.url ? (
                      <img src={m.url} alt={m.caption || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    ) : m.type === 'video' ? (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#1C1C1E', color: '#fff', fontSize: 28 }}>▶</div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 28 }}>📎</div>
                    )}
                    {m.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9.5, padding: '3px 6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.caption}</div>}
                  </div>
                ))}
                {/* Documents */}
                {(project.documents || []).map(d => (
                  <div key={d.id} style={{ flexShrink: 0, width: 120, height: 90, borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', background: '#F8FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', padding: 8, boxSizing: 'border-box' }}
                    onClick={() => setLightboxItem({ ...d, type: 'doc' })}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <span style={{ fontSize: 9.5, color: '#4B5563', textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || d.filename || 'Document'}</span>
                  </div>
                ))}
                {/* Bouton ajouter */}
                <div style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 10, border: `2px dashed rgba(232,121,78,.35)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: BRAND, background: 'rgba(232,121,78,.04)' }}
                  onClick={() => setShowCapture(true)}>
                  <span style={{ fontSize: 22 }}>+</span>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>Ajouter</span>
                </div>
              </div>
            </div>
          )}
          {/* Ajouter le premier média si aucun */}
          {media.length === 0 && (project.documents || []).length === 0 && (
            <div style={{ padding: '0 56px 16px' }}>
              <button onClick={() => setShowCapture(true)}
                style={{ fontSize: 11.5, color: BRAND, fontWeight: 700, background: 'rgba(232,121,78,.06)', border: `1px dashed rgba(232,121,78,.3)`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={13}/> Ajouter photos ou documents du client
              </button>
            </div>
          )}
        </div>

        {/* ── Estimation : 3 façons d'obtenir les infos ── (mint) */}
        {/* ── Estimation approximative ── */}
        {(() => {
          const fa = project.field_assessment || {};
          const visiteAnswers = fa.visite_answers || {};
          const selectedTrades = fa.selected_trades || [];
          const approxLines = fa.approx_lines || [];
          const workTypeVal = fa.work_type || WORK_TYPE_LABELS[project.type] || '';

          const saveVisite = async (patch) => {
            const next = { ...fa, visite_answers: { ...visiteAnswers, ...patch } };
            await projectsApi.update(id, { field_assessment: next });
            setProject(p => ({ ...p, field_assessment: next }));
          };
          const saveTrades = async (trades) => {
            const next = { ...fa, selected_trades: trades };
            await projectsApi.update(id, { field_assessment: next });
            setProject(p => ({ ...p, field_assessment: next }));
          };
          const saveLines = async (lines) => {
            const next = { ...fa, approx_lines: lines };
            await projectsApi.update(id, { field_assessment: next });
            setProject(p => ({ ...p, field_assessment: next }));
          };
          const addLine = () => saveLines([...approxLines, { id: Date.now(), poste: '', source: '', inclus: '', non_inclus: '', duree: '', cout: '', prix_vente: '' }]);
          const addSuggestedLines = () => {
            const tpls = SUGGESTED_LINES[workTypeVal] || [];
            if (!tpls.length) return;
            const newLines = tpls.map((t, i) => ({ ...t, id: Date.now() + i, source: t.source || '' }));
            saveLines([...approxLines, ...newLines]);
          };
          const hasSuggested = !!(SUGGESTED_LINES[workTypeVal] || []).length;
          const updateLine = (lid, field, value) => saveLines(approxLines.map(l => l.id === lid ? { ...l, [field]: value } : l));
          const removeLine = (lid) => saveLines(approxLines.filter(l => l.id !== lid));

          const totalCout = approxLines.reduce((s, l) => s + (Number(l.cout) || 0), 0);
          const totalVente = approxLines.reduce((s, l) => s + (Number(l.prix_vente) || 0), 0);
          const totalMarkup = totalCout > 0 ? Math.round((totalVente - totalCout) / totalCout * 100) : 0;

          /* Questions pertinentes = universelles + celles du type de travaux */
          const typeQs = VISITE_QUESTIONS_BY_TYPE[workTypeVal] || [];
          const allVisiteQs = [...VISITE_QUESTIONS_UNIVERSAL, ...typeQs];

          const visiteAnswered = Object.keys(visiteAnswers).length;

          return (
            <div id="s-estimation" style={{ background: '#E9F3EC', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
              {/* En-tête */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📊</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Estimation approximative</h2>
                  <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4, maxWidth: 560 }}>Qualifiez le projet sans perdre de temps. Envoyez un message au client, visitez sur place ou laissez Florence estimer les coûts — dans l'ordre qui vous convient, aucune étape obligatoire.</div>
                </div>
              </div>

              {/* Bannière profil métier */}
              <div style={{ padding: '10px 16px', background: 'rgba(232,121,78,.08)', border: '1px solid rgba(232,121,78,.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Sparkles size={14} color={BRAND}/>
                <span>Adapté à ton profil :</span>
                <b style={{ color: BRAND }}>Entrepreneur général</b>
              </div>

              {/* Onglets — 2 niveaux */}
              <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Rangée haute : Message client + Visite sur place */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,.7)', borderRadius: 12, padding: 3, gap: 2, border: '1px solid rgba(0,0,0,.06)' }}>
                  {[
                    { k: 'voieB', label: '💬 Message client' },
                    { k: 'voieC', label: '🏗 Visite sur place' },
                  ].map(({ k, label }) => (
                    <button key={k} type="button" onClick={() => setEstimTab(k)}
                      style={{ border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                        background: estimTab === k ? '#fff' : 'transparent',
                        color: estimTab === k ? BRAND_DARK : '#7C8089',
                        boxShadow: estimTab === k ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                      }}>{label}</button>
                  ))}
                </div>
                {/* Rangée basse : Recherche IA Florence */}
                <div style={{ background: 'rgba(255,255,255,.7)', borderRadius: 12, padding: 3, border: '1px solid rgba(0,0,0,.06)' }}>
                  <button type="button" onClick={() => setEstimTab('voieA')}
                    style={{ width: '100%', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      background: estimTab === 'voieA' ? '#fff' : 'transparent',
                      color: estimTab === 'voieA' ? BRAND_DARK : '#7C8089',
                      boxShadow: estimTab === 'voieA' ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                    }}>
                    <Sparkles size={13} color={estimTab === 'voieA' ? BRAND : '#9CA3AF'}/> Estimation approximative
                  </button>
                </div>
              </div>

              {/* ── Voie A — Tableau d'estimation + IA ── */}
              {estimTab === 'voieA' && (
                <div>
                  <div style={{ background: 'rgba(255,255,255,.9)', borderRadius: 12, border: '1px solid #E8EAED', overflow: 'auto' }}>
                    {/* Entêtes tableau */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.3fr 1.3fr 0.7fr 0.75fr 0.85fr 0.55fr 24px', gap: 0, background: '#F8FAFB', borderBottom: '1px solid #E8EAED', padding: '8px 14px', minWidth: 700 }}>
                      {['POSTE','SOURCE','INCLUS','NON INCLUS','DURÉE','COÛT','PRIX VENTE','MARKUP',''].map((h, i) => (
                        <span key={i} style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</span>
                      ))}
                    </div>

                    {approxLines.length === 0 && (
                      <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: 'rgba(248,250,251,.6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#fff', borderRadius: 11, border: `1px solid rgba(232,121,78,.25)`, width: '100%', maxWidth: 520, boxSizing: 'border-box' }}>
                          <Sparkles size={16} color={BRAND}/>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#15171C', margin: 0 }}>Laisser Florence remplir automatiquement</p>
                            <p style={{ fontSize: 11, color: '#7C8089', margin: 0 }}>Florence analyse les projets similaires et les prix Rona, Canac, Home Dépôt, BMR.</p>
                          </div>
                          <button className="btn-primary text-xs" style={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={searchMaterialPrices} disabled={searchingPrices}>
                            {searchingPrices ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            {searchingPrices ? 'Analyse…' : 'Rechercher les prix'}
                          </button>
                        </div>
                        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>— ou —</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={addLine} style={{ background: '#fff', border: '1px solid #E0E4E8', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: BRAND, fontWeight: 700, padding: '7px 14px' }}>+ Ajouter une ligne vide</button>
                          {hasSuggested && (
                            <button onClick={addSuggestedLines} style={{ background: BRAND, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: '#fff', fontWeight: 700, padding: '7px 14px' }}>
                              ✦ Lignes types — {workTypeVal || 'projet'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {approxLines.map(line => {
                      const markup = (Number(line.cout) > 0 && Number(line.prix_vente) > 0)
                        ? Math.round((Number(line.prix_vente) - Number(line.cout)) / Number(line.cout) * 100) : null;
                      return (
                        <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.3fr 1.3fr 0.7fr 0.75fr 0.85fr 0.55fr 24px', gap: 0, borderBottom: '1px solid #F4F5F6', padding: '5px 14px', alignItems: 'center', minWidth: 700 }}>
                          {[
                            { field:'poste', ph:'Démolition…' },
                            { field:'source', ph:'Historique / fournisseur' },
                            { field:'inclus', ph:'Ce qui est inclus' },
                            { field:'non_inclus', ph:'Non inclus' },
                            { field:'duree', ph:'3 j' },
                            { field:'cout', ph:'0', t:'number' },
                            { field:'prix_vente', ph:'0', t:'number' },
                          ].map(({ field, ph, t }) => (
                            <input key={field} type={t||'text'} value={line[field]||''} onChange={e=>updateLine(line.id,field,e.target.value)} placeholder={ph}
                              style={{ border:'none', background:'transparent', fontSize:12.5, color:'#15171C', padding:'3px 4px 3px 0', outline:'none', width:'100%', minWidth:0, fontFamily:'inherit' }}/>
                          ))}
                          <span style={{ fontSize:11.5, fontWeight:700, color: markup > 0 ? '#16a34a' : '#9CA3AF' }}>{markup !== null ? `+${markup}%` : '—'}</span>
                          <button onClick={() => removeLine(line.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'#C8CACD', padding:0, display:'flex', alignItems:'center' }}><X size={13}/></button>
                        </div>
                      );
                    })}

                    {/* Ligne total */}
                    {approxLines.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.3fr 1.3fr 0.7fr 0.75fr 0.85fr 0.55fr 24px', gap: 0, padding: '10px 14px', background: '#F8FAFB', borderTop: '2px solid #E0E4E8', alignItems: 'center', minWidth: 700 }}>
                        <span style={{ fontSize:12, fontWeight:800, color:'#15171C', gridColumn:'1/6' }}>TOTAL · Fourchette : {money(Math.round(totalVente * 0.87))} – {money(Math.round(totalVente * 1.13))}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#15171C' }}>{money(totalCout)}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#15171C' }}>{money(totalVente)}</span>
                        <span style={{ fontSize:12, fontWeight:800, color: totalMarkup > 0 ? '#16a34a' : '#9CA3AF' }}>+{totalMarkup}%</span>
                        <span/>
                      </div>
                    )}

                    {/* Footer tableau */}
                    {approxLines.length > 0 && (
                      <div style={{ padding: '10px 14px', borderTop: '1px solid #F0F2F4', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={addLine} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:BRAND, fontWeight:700, padding:0, display:'flex', alignItems:'center', gap:6 }}>
                          + Ajouter une ligne
                        </button>
                        {hasSuggested && (
                          <button onClick={addSuggestedLines} style={{ background:'none', border:`1px solid rgba(232,121,78,.35)`, borderRadius:7, cursor:'pointer', fontSize:12, color:BRAND, fontWeight:600, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
                            ✦ Lignes types {workTypeVal ? `— ${workTypeVal}` : ''}
                          </button>
                        )}
                        <button onClick={searchMaterialPrices} disabled={searchingPrices} style={{ marginLeft:'auto', background:'none', border:`1px solid rgba(232,121,78,.35)`, borderRadius:7, cursor:'pointer', fontSize:12, color:BRAND, fontWeight:600, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
                          {searchingPrices ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                          {searchingPrices ? 'Florence analyse…' : 'Demander à Florence'}
                        </button>
                      </div>
                    )}
                  </div>

                  {searchingPrices && (
                    <div style={{ marginTop:10, padding:'12px 16px', background:'rgba(232,121,78,.06)', borderRadius:10, border:`1px solid rgba(232,121,78,.2)`, display:'flex', alignItems:'center', gap:10, fontSize:12.5, color:BRAND }}>
                      <Loader2 size={14} className="animate-spin"/>
                      Florence recherche les prix du marché québécois…
                    </div>
                  )}
                  {aiPriceResult && (
                    <div style={{ marginTop:12, background:'#fff', borderRadius:12, border:'1px solid #E8EAED', overflow:'hidden', fontSize:12.5 }}>

                      {/* Note de Florence */}
                      {aiPriceResult.comments && (
                        <div style={{ padding:'12px 18px', color:'#3A3D44', lineHeight:1.65, borderBottom:'1px solid #F0F2F4' }}>
                          <span style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF', display:'block', marginBottom:5 }}>Note de Florence</span>
                          {aiPriceResult.comments}
                        </div>
                      )}

                      {/* Tableau 3 scénarios */}
                      {aiPriceResult.scenarios?.length > 0 && (
                        <div style={{ borderBottom:'1px solid #F0F2F4' }}>
                          <div style={{ padding:'10px 18px 6px', display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF' }}>3 scénarios de prix</span>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                              <tr style={{ background:'#F8FAFB', borderBottom:'1px solid #E8EAED' }}>
                                {['Scénario','Description','Coût de revient','Prix de vente','Marge'].map(h => (
                                  <th key={h} style={{ padding:'7px 14px', fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#9CA3AF', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {aiPriceResult.scenarios.map((s, i) => {
                                const marge = s.cout > 0 ? Math.round((s.prix_vente - s.cout) / s.cout * 100) : 0;
                                const rowBg = i === 1 ? 'rgba(232,121,78,.04)' : '#fff';
                                const nomColor = i === 0 ? '#6B7280' : i === 1 ? BRAND : '#7C3AED';
                                return (
                                  <tr key={s.nom} style={{ background: rowBg, borderBottom:'1px solid #F4F5F6' }}>
                                    <td style={{ padding:'9px 14px', fontWeight:800, color: nomColor, whiteSpace:'nowrap' }}>{s.nom}</td>
                                    <td style={{ padding:'9px 14px', color:'#4B5563', lineHeight:1.4 }}>{s.description}</td>
                                    <td style={{ padding:'9px 14px', fontWeight:700, color:'#15171C', whiteSpace:'nowrap' }}>{money(s.cout)}</td>
                                    <td style={{ padding:'9px 14px', fontWeight:800, color:'#15171C', whiteSpace:'nowrap' }}>{money(s.prix_vente)}</td>
                                    <td style={{ padding:'9px 14px', fontWeight:700, color:'#16a34a', whiteSpace:'nowrap' }}>+{marge}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Sources cliquables (URLs construites côté client) */}
                      {aiPriceResult.sources?.length > 0 && (
                        <div style={{ padding:'10px 18px 12px' }}>
                          <span style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF', display:'block', marginBottom:7 }}>Références de prix</span>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {aiPriceResult.sources.map((s, i) => (
                              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize:11.5, color:BRAND, fontWeight:600, padding:'4px 11px', background:'rgba(232,121,78,.07)', borderRadius:20, textDecoration:'none', border:`1px solid rgba(232,121,78,.22)`, display:'inline-flex', alignItems:'center', gap:5, transition:'background .15s' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(232,121,78,.15)'}
                                onMouseLeave={e => e.currentTarget.style.background='rgba(232,121,78,.07)'}>
                                🔗 {s.label} <span style={{ fontWeight:400, color:'#9CA3AF', fontSize:10.5 }}>· {s.fournisseur}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Étape 1 — Message client + calculateur au pi²/m² ── */}
              {estimTab === 'voieB' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {/* Message prérempli */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', overflow:'hidden' }}>
                    <textarea ref={clientMsgRef}
                      key={project.client_name + '|' + project.portal_token}
                      style={{ width:'100%', minHeight:240, padding:'18px 20px', border:'none', fontSize:14, lineHeight:1.7, resize:'vertical', fontFamily:'inherit', background:'transparent', color:'#15171C', outline:'none', display:'block', boxSizing:'border-box' }}
                      defaultValue={`Bonjour ${project.client_name || '[Nom du client]'},\n\nMerci pour votre demande concernant ${project.description || project.name || 'votre projet'}.\n\nPour préparer une estimation approximative, j'aimerais en savoir un peu plus avant de vous faire parvenir un prix :\n\n1. Pouvez-vous décrire brièvement ce que vous souhaitez faire ?\n2. Avez-vous des photos de l'espace actuel (4 angles de chaque pièce) ?\n3. Quelle est la superficie approximative (pi² ou m²) ?\n4. Avez-vous un budget cible en tête ?\n5. Quel est votre échéancier souhaité ?\n${project.portal_token ? `\nVous pouvez suivre l'avancement de votre projet en temps réel via votre portail client :\n${FRONTEND_URL}/portal/${project.portal_token}\n` : ''}\nUne fois ces informations reçues, je pourrai vous transmettre une estimation approximative sous 24–48 h.\n\nN'hésitez pas à répondre à ce message ou à m'appeler au besoin.\n\nCordialement,\n${project.project_manager || '[Votre nom]'}`}
                    />
                    <div style={{ padding:'10px 16px', borderTop:'1px solid #F0F2F4', display:'flex', gap:8, flexWrap:'wrap', background:'#FAFBFC' }}>
                      <button className="btn-secondary text-xs"
                        onClick={() => { setClientMsgCopied(true); setTimeout(() => setClientMsgCopied(false), 2000); navigator.clipboard.writeText(clientMsgRef.current?.value || ''); }}>
                        {clientMsgCopied ? <CheckCheck size={13}/> : <Copy size={13}/>} {clientMsgCopied ? 'Copié !' : 'Copier le message'}
                      </button>
                      <button className="btn-secondary text-xs"
                        onClick={() => { const body = encodeURIComponent(clientMsgRef.current?.value || ''); window.open(`mailto:${project.client_email || ''}?subject=${encodeURIComponent('Demande d\'informations — ' + project.name)}&body=${body}`,'_blank'); }}
                        disabled={!project.client_email}>
                        ✉️ Envoyer par courriel
                      </button>
                      <button className="btn-secondary text-xs"
                        onClick={() => window.open(`sms:${project.client_phone?.replace(/\D/g,'')}?body=${encodeURIComponent(clientMsgRef.current?.value||'')}`, '_blank')}
                        disabled={!project.client_phone}>
                        📱 Par SMS
                      </button>
                    </div>
                  </div>

                  {/* Checklist photos */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <p style={{ fontSize:12.5, fontWeight:800, color:'#15171C', margin:'0 0 12px', display:'flex', alignItems:'center', gap:8 }}>📷 CHECKLIST PHOTOS DEMANDÉES</p>
                    {['Ensemble de chaque pièce (4 angles)', 'Points d\'eau (évier, douche, WC)', 'Panneau électrique ouvert', 'Sous-sol ou vide sanitaire', 'Toiture / gouttières (de l\'extérieur)'].map((item, i) => (
                      <label key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#3A3D44', marginBottom:8, cursor:'pointer' }}>
                        <input type="checkbox" style={{ accentColor:BRAND, width:15, height:15 }}/> {item}
                      </label>
                    ))}
                  </div>

                  {/* Calculateur au pi²/m² */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'18px 20px' }}>
                    <p style={{ fontSize:13, fontWeight:800, color:'#15171C', margin:'0 0 14px', display:'flex', alignItems:'center', gap:8 }}>
                      📐 Calculateur de prix approximatif
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'flex-end' }}>
                      <div>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 5px' }}>Unité</p>
                        <div style={{ display:'inline-flex', background:'#F4F5F6', borderRadius:8, padding:2, gap:2 }}>
                          {[['sqft','pi²'],['sqm','m²']].map(([u,lbl]) => (
                            <button key={u} onClick={() => setSqUnit(u)}
                              style={{ border:'none', borderRadius:6, padding:'5px 12px', fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .12s',
                                background: sqUnit===u ? '#fff' : 'transparent', color: sqUnit===u ? '#15171C' : '#9CA3AF',
                                boxShadow: sqUnit===u ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{lbl}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 5px' }}>Tarif par {sqUnit==='sqft'?'pi²':'m²'}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:13, color:'#9CA3AF' }}>$</span>
                          <input type="number" min="0" step="0.5" value={sqRate} onChange={e=>setSqRate(e.target.value)} placeholder="Ex. 75"
                            style={{ width:90, padding:'6px 10px', border:'1px solid #E8EAED', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#15171C' }}/>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 5px' }}>Superficie ({sqUnit==='sqft'?'pi²':'m²'})</p>
                        <input type="number" min="0" value={sqArea} onChange={e=>setSqArea(e.target.value)} placeholder={sqUnit==='sqft'?'Ex. 1 200':'Ex. 110'}
                          style={{ width:110, padding:'6px 10px', border:'1px solid #E8EAED', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#15171C' }}/>
                      </div>
                      {sqRate && sqArea && Number(sqRate) > 0 && Number(sqArea) > 0 && (() => {
                        const base = Number(sqRate) * Number(sqArea);
                        return (
                          <div style={{ background:`linear-gradient(135deg,#F0A884,${BRAND})`, borderRadius:10, padding:'10px 16px', color:'#fff', minWidth:200 }}>
                            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'rgba(255,255,255,.8)', margin:'0 0 3px' }}>Estimation approximative</p>
                            <p style={{ fontSize:22, fontWeight:900, margin:0 }}>{money(Math.round(base))}</p>
                            <p style={{ fontSize:11, color:'rgba(255,255,255,.85)', margin:'2px 0 0' }}>Fourchette : {money(Math.round(base*.85))} – {money(Math.round(base*1.15))}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Étape 3 — Visite sur place ── */}
              {estimTab === 'voieC' && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

                  {/* Question 1 — Corps de métier (multi-select) */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ width:24, height:24, borderRadius:8, background:`${BRAND}22`, color:BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>1</span>
                      <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>Quels corps de métier sont impliqués ?</p>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                      {ALL_TRADES.map(t => {
                        const isSelected = selectedTrades.includes(t.key);
                        return (
                          <button key={t.key} type="button"
                            onClick={() => saveTrades(isSelected ? selectedTrades.filter(k=>k!==t.key) : [...selectedTrades, t.key])}
                            style={{ padding:'6px 13px', borderRadius:20, fontSize:12.5, border:'1.5px solid', cursor:'pointer', fontWeight:600, transition:'all .12s',
                              background: isSelected ? BRAND : '#fff',
                              borderColor: isSelected ? BRAND : '#E0E4E8',
                              color: isSelected ? '#fff' : '#3A3D44' }}>
                            {t.emoji} {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions universelles + spécifiques au type de travaux */}
                  {allVisiteQs.map((q, qi) => {
                    const curVal = visiteAnswers[q.id] || null;
                    const isAutre = curVal && !q.opts.includes(curVal);
                    return (
                      <div key={q.id} style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <span style={{ width:24, height:24, borderRadius:8, background: curVal ? '#DCFCE7' : `${BRAND}22`, color: curVal ? '#16a34a' : BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>
                            {curVal ? '✓' : qi + 2}
                          </span>
                          <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>{q.q}</p>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                          {q.opts.map(opt => (
                            <button key={opt} type="button"
                              onClick={() => saveVisite({ [q.id]: curVal === opt ? null : opt })}
                              style={{ padding:'6px 13px', borderRadius:8, fontSize:12.5, border:'1.5px solid', cursor:'pointer', fontWeight:600, transition:'all .12s',
                                background: curVal === opt ? BRAND : '#fff',
                                borderColor: curVal === opt ? BRAND : '#E0E4E8',
                                color: curVal === opt ? '#fff' : '#3A3D44' }}>
                              {opt}
                            </button>
                          ))}
                          {/* Option Autre */}
                          <button type="button"
                            onClick={() => {
                              if (isAutre) { saveVisite({ [q.id]: null }); setAutreTexts(t => ({ ...t, [q.id]: '' })); }
                              else { setAutreTexts(t => ({ ...t, [q.id]: '' })); saveVisite({ [q.id]: 'Autre' }); }
                            }}
                            style={{ padding:'6px 13px', borderRadius:8, fontSize:12.5, border:'1.5px solid', cursor:'pointer', fontWeight:600, transition:'all .12s',
                              background: isAutre ? BRAND : '#fff',
                              borderColor: isAutre ? BRAND : '#E0E4E8',
                              color: isAutre ? '#fff' : '#3A3D44' }}>
                            Autre
                          </button>
                        </div>
                        {/* Texte libre si Autre sélectionné */}
                        {(isAutre || curVal === 'Autre') && (
                          <div style={{ marginTop:8, display:'flex', gap:6 }}>
                            <input
                              autoFocus
                              value={isAutre && curVal !== 'Autre' ? curVal : (autreTexts[q.id] || '')}
                              onChange={e => setAutreTexts(t => ({ ...t, [q.id]: e.target.value }))}
                              onBlur={e => { if (e.target.value.trim()) saveVisite({ [q.id]: e.target.value.trim() }); }}
                              onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { saveVisite({ [q.id]: e.target.value.trim() }); e.target.blur(); } }}
                              placeholder="Précisez…"
                              style={{ flex:1, padding:'6px 10px', border:'1px solid #E0E4E8', borderRadius:8, fontSize:12.5, fontFamily:'inherit', outline:'none' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Superficie + observations */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ width:24, height:24, borderRadius:8, background:`${BRAND}22`, color:BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>{allVisiteQs.length + 2}</span>
                      <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>Superficie totale à rénover</p>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                      <input type="number" placeholder="Ex. 1 200" className="input" style={{ maxWidth:130 }}
                        value={visiteAnswers.area || ''} onChange={e => saveVisite({ area: e.target.value })}/>
                      <div style={{ display:'inline-flex', background:'#F4F5F6', borderRadius:8, padding:2 }}>
                        {[['sqft','pi²'],['sqm','m²']].map(([u,lbl]) => (
                          <button key={u} onClick={() => saveVisite({ area_unit: u })}
                            style={{ border:'none', borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:700, cursor:'pointer',
                              background: (visiteAnswers.area_unit||'sqft')===u ? '#fff' : 'transparent',
                              color: (visiteAnswers.area_unit||'sqft')===u ? '#15171C' : '#9CA3AF',
                              boxShadow: (visiteAnswers.area_unit||'sqft')===u ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#15171C', margin:'0 0 6px' }}>Observations sur place</p>
                    <textarea className="input resize-none" rows={3} placeholder="Décrivez ce que vous observez…"
                      value={visiteAnswers.notes || ''} onChange={e => saveVisite({ notes: e.target.value })}/>
                  </div>

                  {/* Photos & documents sur place — scroll horizontal */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ width:24, height:24, borderRadius:8, background: media.length ? '#DCFCE7' : `${BRAND}22`, color: media.length ? '#16a34a' : BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>
                        {media.length ? '✓' : <Camera size={13}/>}
                      </span>
                      <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>Photos & documents sur place</p>
                      <button onClick={() => setShowCapture(true)}
                        style={{ marginLeft:'auto', fontSize:11.5, fontWeight:700, color:BRAND, background:'rgba(232,121,78,.08)', border:`1px solid rgba(232,121,78,.25)`, borderRadius:20, padding:'3px 11px', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        <Camera size={11}/> Ajouter
                      </button>
                    </div>
                    <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch', scrollbarWidth:'thin' }}>
                      {media.map(m => (
                        <div key={m.id} style={{ flexShrink:0, width:120, height:90, borderRadius:10, border:'1px solid #E8EAED', overflow:'hidden', background:'#F4F5F6', cursor:'pointer', position:'relative' }}
                          onClick={() => setLightboxItem(m)}>
                          {m.type==='photo' && m.url
                            ? <img src={m.url} alt={m.caption||''} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:28 }}>{m.type==='video'?'▶':'📌'}</div>}
                          {m.caption && <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:9.5, padding:'3px 6px', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{m.caption}</div>}
                        </div>
                      ))}
                      {(project.documents || []).map(d => (
                        <div key={d.id} style={{ flexShrink:0, width:120, height:90, borderRadius:10, border:'1px solid #E8EAED', overflow:'hidden', background:'#F8FAFB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', padding:8, boxSizing:'border-box' }}
                          onClick={() => setLightboxItem({ ...d, type:'doc' })}>
                          <span style={{ fontSize:28 }}>📄</span>
                          <span style={{ fontSize:9.5, color:'#4B5563', textAlign:'center', lineHeight:1.3, overflow:'hidden', maxWidth:'100%', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name||d.filename||'Document'}</span>
                        </div>
                      ))}
                      <div style={{ flexShrink:0, width:90, height:90, borderRadius:10, border:`2px dashed rgba(232,121,78,.35)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', color:BRAND, background:'rgba(232,121,78,.04)' }}
                        onClick={() => setShowCapture(true)}>
                        <span style={{ fontSize:22 }}>+</span>
                        <span style={{ fontSize:10, fontWeight:700 }}>Ajouter</span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression + action */}
                  {visiteAnswered > 0 && (
                    <div style={{ padding:'12px 16px', background:'#E9F8EE', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:20 }}>✅</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#15171C', margin:0 }}>{visiteAnswered} élément{visiteAnswered>1?'s':''} renseigné{visiteAnswered>1?'s':''}</p>
                        <p style={{ fontSize:11.5, color:'#7C8089', margin:0 }}>Retournez à l'Étape 2 pour générer l'estimation avec ces données.</p>
                      </div>
                      <button className="btn-primary text-xs" onClick={() => setEstimTab('voieA')}>
                        <Sparkles size={13}/> Générer l'estimation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Envoyer l'estimation au client ── */}
              <div style={{ marginTop: 28, background: 'rgba(255,255,255,.85)', borderRadius: 16, border: '1px solid rgba(0,0,0,.08)', padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${BRAND}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Send size={16} color={BRAND}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: 0 }}>Envoyer l'estimation au client</p>
                    <p style={{ fontSize: 12.5, color: '#7C8089', margin: '2px 0 0' }}>Message personnalisé — se met à jour automatiquement avec les données du projet.</p>
                  </div>
                  <button onClick={() => { userEditedEstimMsg.current = false; setEstimMsg(buildEstimMsg(project, aiPriceResult)); }}
                    style={{ fontSize: 11.5, fontWeight: 700, color: '#7C8089', background: '#F4F5F6', border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', flexShrink: 0 }}>
                    ↺ Regénérer
                  </button>
                </div>

                {/* Zone de message éditable */}
                <textarea ref={estimMsgRef} value={estimMsg}
                  onChange={e => { userEditedEstimMsg.current = true; setEstimMsg(e.target.value); }}
                  placeholder="Le message se génère automatiquement dès que des informations sont disponibles sur le projet…"
                  style={{ width: '100%', minHeight: 200, padding: '14px 16px', border: '1px solid #E0E4E8', borderRadius: 10, fontSize: 13.5, lineHeight: 1.75, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#15171C', background: '#FAFAFA', boxSizing: 'border-box', marginBottom: 14 }}/>

                {/* Photos de projets similaires */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 8px' }}>Photos de projets similaires (optionnel)</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {estimInspoPhotos.map((url, i) => (
                      <div key={i} style={{ position: 'relative', width: 80, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #E8EAED', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => setLightboxItem({ type: 'photo', url, caption: `Photo inspiration ${i+1}` })}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        <button onClick={e => { e.stopPropagation(); setEstimInspoPhotos(p => p.filter((_,j) => j !== i)); }}
                          style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.65)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                          <X size={10} color="#fff"/>
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input value={estimInspoInput} onChange={e => setEstimInspoInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && estimInspoInput.trim()) { setEstimInspoPhotos(p => [...p, estimInspoInput.trim()]); setEstimInspoInput(''); } }}
                        placeholder="URL d'une photo…"
                        style={{ padding: '5px 10px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200 }}/>
                      <button onClick={() => { if (estimInspoInput.trim()) { setEstimInspoPhotos(p => [...p, estimInspoInput.trim()]); setEstimInspoInput(''); } }}
                        style={{ padding: '5px 11px', borderRadius: 8, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        + Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3 boutons d'envoi */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(estimMsg).then(() => { setEstimMsgCopied(true); setTimeout(() => setEstimMsgCopied(false), 2000); });
                  }}
                    style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${estimMsgCopied ? '#16a34a' : '#E0E4E8'}`, background: estimMsgCopied ? '#DCFCE7' : '#fff', fontSize: 12.5, fontWeight: 700, color: estimMsgCopied ? '#16a34a' : '#3A3D44', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {estimMsgCopied ? '✓ Copié !' : '⎘ Copier le message'}
                  </button>
                  <button
                    onClick={() => window.open(`mailto:${project.client_email || ''}?subject=${encodeURIComponent(`Estimation — ${project.name || ''}`)}&body=${encodeURIComponent(estimMsg)}`,'_blank')}
                    disabled={!project.client_email}
                    title={!project.client_email ? 'Ajoute un courriel client pour envoyer' : ''}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E0E4E8', background: '#fff', fontSize: 12.5, fontWeight: 700, color: project.client_email ? '#3A3D44' : '#B0B3BA', cursor: project.client_email ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✉️ Envoyer par courriel
                  </button>
                  <button
                    onClick={() => window.open(`sms:${(project.client_phone||'').replace(/\D/g,'')}?body=${encodeURIComponent(estimMsg)}`,'_blank')}
                    disabled={!project.client_phone}
                    title={!project.client_phone ? 'Ajoute un numéro client pour envoyer' : ''}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E0E4E8', background: '#fff', fontSize: 12.5, fontWeight: 700, color: project.client_phone ? '#3A3D44' : '#B0B3BA', cursor: project.client_phone ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📱 Par SMS
                  </button>
                </div>

                {/* Relances automatiques */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: 0 }}>Relances automatiques</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 12, color: '#3A3D44', fontWeight: 600, margin: '0 0 7px' }}>Nombre de relances</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {[0,1,2,3,4,5,6,7].map(n => (
                          <button key={n} onClick={() => { setRelanceCount(n); localStorage.setItem(`monflux-relances-count-${id}`, n); }}
                            style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${relanceCount === n ? BRAND : '#E0E4E8'}`, background: relanceCount === n ? `${BRAND}12` : '#fff', fontSize: 13, fontWeight: 700, color: relanceCount === n ? BRAND : '#7C8089', cursor: 'pointer' }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {relanceCount > 0 && (
                      <div>
                        <p style={{ fontSize: 12, color: '#3A3D44', fontWeight: 600, margin: '0 0 7px' }}>Fréquence</p>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {[[2,'2 j'],[3,'3 j'],[5,'5 j'],[7,'1 sem.'],[14,'2 sem.'],[30,'1 mois']].map(([v,l]) => (
                            <button key={v} onClick={() => { setRelanceFrequency(v); localStorage.setItem(`monflux-relances-freq-${id}`, v); }}
                              style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${relanceFrequency === v ? BRAND : '#E0E4E8'}`, background: relanceFrequency === v ? `${BRAND}12` : '#fff', fontSize: 12.5, fontWeight: 700, color: relanceFrequency === v ? BRAND : '#7C8089', cursor: 'pointer' }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {relanceCount > 0 && (
                      <div>
                        <p style={{ fontSize: 12, color: '#3A3D44', fontWeight: 600, margin: '0 0 7px' }}>Méthode(s)</p>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[['email','✉️ Courriel'],['sms','📱 SMS'],['call','📞 Appel']].map(([k,l]) => (
                            <button key={k} onClick={() => {
                              const next = relanceMethods.includes(k) ? relanceMethods.filter(m => m !== k) : [...relanceMethods, k];
                              setRelanceMethods(next);
                              localStorage.setItem(`monflux-relances-methods-${id}`, JSON.stringify(next));
                            }}
                              style={{ padding: '5px 13px', borderRadius: 8, border: `1.5px solid ${relanceMethods.includes(k) ? BRAND : '#E0E4E8'}`, background: relanceMethods.includes(k) ? `${BRAND}12` : '#fff', fontSize: 12.5, fontWeight: 700, color: relanceMethods.includes(k) ? BRAND : '#7C8089', cursor: 'pointer' }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {relanceCount > 0 && relanceMethods.length > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, background: '#DCFCE7', border: '1px solid #16a34a33' }}>
                      <CheckCircle size={13} color="#16a34a"/>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a' }}>
                        {relanceCount} relance{relanceCount > 1 ? 's' : ''} · toutes les {relanceFrequency <= 6 ? `${relanceFrequency} jours` : relanceFrequency <= 13 ? '1 semaine' : relanceFrequency <= 27 ? '2 semaines' : '1 mois'} · {relanceMethods.map(m => m === 'email' ? 'courriel' : m === 'sms' ? 'SMS' : 'appel').join(' + ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}


        {/* ── Phases du projet ── */}
        <div id="s-pipeline" style={{ background: '#E7EFF4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>🏗️</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Phases du projet</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Calendrier des travaux, corps de métier & sous-traitants</div>
            </div>
          </div>

          {(showPhase || editPhase) && (
            <PhaseModal projectId={id} phase={editPhase} trades={project.trades || []}
              onClose={() => { setShowPhase(false); setEditPhase(null); }} onSave={handlePhaseSave}/>
          )}

          {/* ── Gantt + Florence — même carte blanche ── */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', marginBottom: 16 }}>
            {project.phases?.length > 0 ? (
              <GanttChart
                phases={project.phases}
                projectStart={project.start_date}
                projectEnd={project.end_date}
                trades={project.trades}
                onDeletePhase={removePhase}
                onEditPhase={(ph) => setEditPhase(ph)}
                onReorderPhases={reorderPhases}
                onRenamePhase={renamePhase}
                onDatesChange={handleDatesChange}
                onAddPhase={async (name) => {
                  if (!name) { setShowPhase(true); return; }
                  try {
                    const { data } = await projectsApi.addPhase(id, { name, status:'not_started', display_order:(project.phases?.length||0) });
                    setProject(p => ({ ...p, phases:[...(p.phases||[]), data] }));
                  } catch(err) { console.error('addPhaseInline', err); }
                }}
                onUpdatePhase={handleUpdatePhase}
                currentUserName={currentUser?.name || currentUser?.email || null}
                onSelfAssign={handleSelfAssign}
              />
            ) : (
              <div style={{ padding: '22px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#3A3D44', margin: 0 }}>Aucune phase pour le moment.</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '6px 0 0' }}>Génère les phases avec Flo ou ajoute une phase manuelle pour commencer le planning.</p>
              </div>
            )}

          {/* Florence — même fond blanc, séparateur */}
          <div style={{ borderTop: '1px solid #F4F5F6', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: BRAND, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Sparkles size={13} color="#fff"/>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: '#15171C', margin: 0 }}>
                  {project.phases?.length > 0 ? 'Ajuster les phases avec Florence' : 'Générer les phases avec Florence'}
                </p>
                <p style={{ fontSize: 11, color: '#7C8089', margin: '1px 0 0' }}>
                  Flo analyse le contexte et construit un planning adapté au chantier réel.
                </p>
              </div>
              <button onClick={generatePhasesFromAI} disabled={generatingPhases}
                style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: BRAND, fontSize: 12, fontWeight: 700, color: '#fff', cursor: generatingPhases ? 'wait' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                {generatingPhases ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                {generatingPhases ? 'Génération…' : project.phases?.length > 0 ? 'Régénérer avec Flo' : 'Générer avec Flo'}
              </button>
            </div>
            {aiNotice && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
                <p className="text-xs text-amber-700">{aiNotice}</p>
                <button className="ml-auto text-amber-400 hover:text-amber-600" onClick={() => setAiNotice('')}><X size={13}/></button>
              </div>
            )}
            {(() => {
              const existing = new Set((project.phases || []).map((p) => p.name?.toLowerCase()));
              const available = recommendedPhaseTemplates
                .map((tpl) => ({ ...tpl, trade_name: toTradeLabel(tpl.trade_name) }))
                .filter((tpl) => !existing.has(tpl.name.toLowerCase()));
              const hasPlaybook = Boolean(projectTypePlaybook?.phases?.length);
              const bulkLabel = projectWorkType || 'ce projet';
              if (!available.length && !hasPlaybook) return null;
              return (
                <div style={{ borderTop: '1px solid #F4F5F6', paddingTop: 10, marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', margin: 0 }}>
                      {hasPlaybook ? `Étapes recommandées · ${bulkLabel}` : 'Ajouter une phase type'}
                    </p>
                    {hasPlaybook && (
                      <button
                        onClick={() => applyProjectTypePlaybook({ replaceExisting: false, source: 'manual' })}
                        disabled={addingTemplatePhase === '__batch__'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, border: `1px solid ${BRAND_BORDER}`, background: BRAND_SOFT, color: BRAND_DARK, fontSize: 11.5, fontWeight: 800, cursor: addingTemplatePhase === '__batch__' ? 'wait' : 'pointer' }}
                      >
                        {addingTemplatePhase === '__batch__' ? <Loader2 size={10} className="animate-spin"/> : <Plus size={10}/>}
                        {`Ajouter les étapes de ${bulkLabel}`}
                      </button>
                    )}
                  </div>
                  {available.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {available.map((tpl) => (
                        <button key={tpl.name} onClick={() => addTemplatePhase(tpl)} disabled={addingTemplatePhase === tpl.name || addingTemplatePhase === '__batch__'}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px solid #E0E4E8', background: addingTemplatePhase === tpl.name ? '#F4F5F6' : '#FAFAFA', fontSize: 11.5, fontWeight: 600, color: '#3A3D44', cursor: 'pointer' }}>
                          {addingTemplatePhase === tpl.name ? <Loader2 size={9} className="animate-spin"/> : <Plus size={9} color={BRAND}/>}
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: 0 }}>Toutes les étapes recommandées sont déjà ajoutées.</p>
                  )}
                </div>
              );
            })()}
          </div>
          </div>{/* fin carte blanche Gantt+Florence */}

          {(() => {
            const phases = project.phases || [];
            const phaseTradeNames = [...new Set(phases.map((ph) => ph.trade_name).filter(Boolean))];
            const tradesFromProject = project.trades || [];
            const rowNames = [...new Set([
              ...tradesFromProject.map((trade) => trade.trade).filter(Boolean),
              ...phaseTradeNames,
            ])];

            if (!rowNames.length) return null;

            const statusMeta = {
              to_find: { label: 'A trouver', color: '#9CA3AF', bg: '#F3F4F6' },
              contacted: { label: 'Contacté', color: '#F59E0B', bg: '#FFF7E8' },
              quoted: { label: 'Soumissionné', color: '#3B82F6', bg: '#EFF6FF' },
              confirmed: { label: 'Confirmé', color: '#16A34A', bg: '#ECFDF3' },
              done: { label: 'Terminé', color: '#2563EB', bg: '#EEF2FF' },
            };

            return (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', marginTop: 0 }}>
                <div style={{ padding: '18px 20px 8px', borderBottom: '1px solid #F1F3F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: '#FFF4EC', display: 'grid', placeItems: 'center', fontSize: 18 }}>👷</div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: 0 }}>Corps de métier & sous-traitants</p>
                      <p style={{ fontSize: 11.5, color: '#8B919A', margin: '2px 0 0' }}>Assigne les bons intervenants à chaque métier actif du projet.</p>
                    </div>
                  </div>
                </div>

                <div>
                  {rowNames.map((tradeName, idx) => {
                    const tradeRow = tradesFromProject.find((trade) => trade.trade?.toLowerCase() === tradeName.toLowerCase()) || null;
                    const tradePhases = phases.filter((ph) => ph.trade_name?.toLowerCase() === tradeName.toLowerCase());
                    const assignedSub = tradeRow ? subs.find((sub) => sub.id === tradeRow.chosen_subcontractor_id) : null;
                    const status = statusMeta[tradeRow?.status || 'to_find'] || statusMeta.to_find;
                    const suggestedSubs = subs.filter((sub) => {
                      const haystack = [
                        sub.name,
                        sub.company_name,
                        sub.specialty,
                        ...(sub.trades || []),
                      ].filter(Boolean).join(' ').toLowerCase();
                      const needle = tradeName.toLowerCase();
                      return haystack.includes(needle);
                    });

                    const ensureTradeRow = async () => {
                      if (tradeRow) return tradeRow;
                      const { data } = await projectsApi.addTrade(id, {
                        trade: tradeName,
                        status: 'to_find',
                        chosen_subcontractor_id: null,
                        estimated_cost: null,
                      });
                      setProject((p) => ({ ...p, trades: [...(p.trades || []), data] }));
                      return data;
                    };

                    return (
                      <div key={tradeName} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(220px, 1fr) minmax(180px, .9fr) 140px', gap: 16, alignItems: 'center', padding: '16px 20px', borderTop: idx > 0 ? '1px solid #F4F5F6' : 'none' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tradePhases[0]?.color || BRAND, flexShrink: 0 }}/>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#15171C', margin: 0 }}>{tradeName}</p>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {tradePhases.length ? tradePhases.map((phase) => (
                              <span key={phase.id} onClick={() => setEditPhase(phase)}
                                style={{ fontSize: 10.5, fontWeight: 700, color: phase.color || BRAND, background: `${phase.color || BRAND}18`, borderRadius: 999, padding: '3px 8px', cursor: 'pointer' }}>
                                {phase.name}
                              </span>
                            )) : (
                              <span style={{ fontSize: 11, color: '#B0B4BB' }}>Aucune phase liée</span>
                            )}
                          </div>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          {assignedSub ? (
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: 0 }}>{assignedSub.name}</p>
                              <p style={{ fontSize: 11.5, color: '#8F95A0', margin: '2px 0 0' }}>{assignedSub.company_name || 'Sous-traitant assigné'}</p>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                {assignedSub.phone && <a href={`tel:${assignedSub.phone}`} style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>{assignedSub.phone}</a>}
                                {assignedSub.email && <a href={`mailto:${assignedSub.email}`} style={{ fontSize: 11.5, color: '#2563EB', textDecoration: 'none' }}>{assignedSub.email}</a>}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#15171C', margin: 0 }}>Aucun sous-traitant assigné</p>
                              <p style={{ fontSize: 11.5, color: '#A0A6AF', margin: '2px 0 0' }}>Choisis un contact existant ou laisse Flo te suggérer des pistes.</p>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <select
                            value={tradeRow?.chosen_subcontractor_id || ''}
                            onChange={async (e) => {
                              const row = await ensureTradeRow();
                              await patchTrade(row.id, { chosen_subcontractor_id: e.target.value || null, status: e.target.value ? 'contacted' : row.status });
                            }}
                            style={{ width: '100%', fontSize: 12, border: '1.5px solid #E0E4E8', borderRadius: 8, padding: '7px 10px', background: '#fff', color: '#3A3D44' }}>
                            <option value="">Assigner un sous-traitant</option>
                            {suggestedSubs.map((sub) => (
                              <option key={sub.id} value={sub.id}>{sub.name}{sub.company_name ? ` — ${sub.company_name}` : ''}</option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => scrollToSection('s-media')}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E0E4E8', background: '#fff', fontSize: 11.5, fontWeight: 700, color: '#7C8089', cursor: 'pointer' }}>
                              Médias
                            </button>
                            <button onClick={fetchTradeRecos}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #F3D3C2', background: '#FFF7F3', fontSize: 11.5, fontWeight: 700, color: BRAND, cursor: 'pointer' }}>
                              Suggestions Flo
                            </button>
                          </div>
                        </div>

                        <div style={{ justifySelf: 'end' }}>
                          <select
                            value={tradeRow?.status || 'to_find'}
                            onChange={async (e) => {
                              const row = await ensureTradeRow();
                              await patchTrade(row.id, { status: e.target.value });
                            }}
                            style={{ fontSize: 11.5, fontWeight: 700, padding: '7px 10px', borderRadius: 999, border: `1px solid ${status.color}33`, background: status.bg, color: status.color, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                            {Object.entries(statusMeta).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Florence recommande des sous-traitants ── */}
          {(() => {
            const missing = (project.trades || []).filter(t => !t.chosen_subcontractor_id);
            if (!missing.length && !tradeRecos) return null;
            const dbMatches = missing.map(t => ({
              trade: t,
              matches: subs.filter(s =>
                (s.trades || []).some(st => st.toLowerCase().includes(t.trade.toLowerCase()) || t.trade.toLowerCase().includes(st.toLowerCase())) ||
                (s.name || '').toLowerCase().includes(t.trade.toLowerCase()) ||
                (s.specialty || '').toLowerCase().includes(t.trade.toLowerCase())
              )
            })).filter(x => x.matches.length > 0);

            return (
              <div style={{ marginTop: 14, background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,.07)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Sparkles size={14} color={BRAND}/>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#3A3D44', margin: 0 }}>Flo recommande des sous-traitants</p>
                  <button onClick={fetchTradeRecos} disabled={loadingTradeRecos}
                    style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, border: `1.5px solid ${BRAND}`, background: `${BRAND}10`, fontSize: 11.5, fontWeight: 700, color: BRAND, cursor: loadingTradeRecos ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {loadingTradeRecos ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                    {loadingTradeRecos ? 'Recherche…' : tradeRecos ? 'Rafraîchir' : 'Trouver des sous-traitants'}
                  </button>
                </div>
                {dbMatches.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', margin: '0 0 8px' }}>Dans ta base de données</p>
                    {dbMatches.map(({ trade, matches }) => (
                      <div key={trade.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3A3D44', flexShrink: 0 }}>{trade.trade} :</span>
                        {matches.map(s => (
                          <button key={s.id} onClick={() => patchTrade(trade.id, { chosen_subcontractor_id: s.id, status: 'contacted' })}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 8, background: '#F4F5F6', border: '1.5px solid #E8EAED', fontSize: 12, fontWeight: 600, color: '#3A3D44', cursor: 'pointer' }}>
                            <UserPlus size={10} color={BRAND}/> {s.name}
                            {s.phone && <span style={{ fontSize: 11, color: '#9CA3AF' }}>· {s.phone}</span>}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {tradeRecos && Object.keys(tradeRecos).length > 0 && (
                  <div>
                    <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', margin: '0 0 8px' }}>Suggestions Flo</p>
                    {Object.entries(tradeRecos).map(([tradeName, recos]) => (
                      <div key={tradeName} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#3A3D44', margin: '0 0 5px' }}>{tradeName}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {(recos || []).map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 11px', borderRadius: 8, background: `${BRAND}08`, border: `1px solid ${BRAND}20` }}>
                              <Sparkles size={11} color={BRAND} style={{ flexShrink: 0 }}/>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#15171C', flex: 1 }}>{r.name}</span>
                              {r.note && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{r.note}</span>}
                              {r.phone && <a href={`tel:${r.phone}`} style={{ fontSize: 11.5, color: '#3b82f6', textDecoration: 'none', flexShrink: 0 }}>{r.phone}</a>}
                              {r.website && <a href={r.website.startsWith('http') ? r.website : `https://${r.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: BRAND, textDecoration: 'none', flexShrink: 0 }}>Site →</a>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {tradeRecos && Object.keys(tradeRecos).length === 0 && !loadingTradeRecos && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Flo n'a pas trouvé de suggestions pour les corps de métier actifs.</p>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Médias chantier ── (cream) */}
        {/* ── Fil du chantier ── */}
        <div id="s-feed" style={{ borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📰</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Fil du chantier</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Activités récentes — statuts, heures, médias, alertes</div>
            </div>
          </div>
          {(() => {
            const feedItems = [
              ...(timesheets.slice(0, 5).map(ts => ({
                type: 'heures', icon: '⏱', color: '#E8794E', bg: '#FFF1EB',
                title: `${ts.worker_name || 'Employé'} — ${ts.hours ? `${ts.hours}h punchées` : 'punch'}`,
                sub: ts.note || '',
                date: ts.date || ts.created_at,
              }))),
              ...(media.slice(0, 3).map(m => ({
                type: 'media', icon: m.type === 'photo' ? '📷' : m.type === 'voice' ? '🎙' : '📌', color: '#4f46e5', bg: '#EEF1FD',
                title: `${m.author_name || 'Photo'} — ${m.type === 'photo' ? 'photo ajoutée' : m.type === 'voice' ? 'mémo vocal' : 'note de chantier'}`,
                sub: m.caption || m.transcript || '',
                date: m.created_at,
              }))),
              ...(changeOrdersList.filter(co => co.status === 'pending_approval').map(co => ({
                type: 'alerte', icon: '⚠', color: '#d97706', bg: '#FFFBEB',
                title: `Avenant en attente : ${co.title}`,
                sub: `${co.amount ? money(co.amount) + ' $' : ''}`,
                date: co.created_at,
              }))),
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

            if (!feedItems.length) return (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>
                Aucune activité enregistrée. Les punchs, photos et alertes apparaîtront ici.
              </div>
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {feedItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#FAFAFA', borderRadius: 10, border: '1px solid #F0F2F4' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: item.bg, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: 0 }}>{item.title}</p>
                      {item.sub && <p style={{ fontSize: 12, color: '#7C8089', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</p>}
                    </div>
                    <span style={{ fontSize: 11, color: '#C8CACD', flexShrink: 0, alignSelf: 'center' }}>
                      {item.date ? new Date(item.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div id="s-media" style={{ background: '#F4EFE4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📷</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Photos & Médias</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Photos, notes et mémos — L'IA détecte non-conformités (RBQ) et risques CNESST</div>
            </div>
            <button className="btn-secondary text-xs" onClick={() => setShowMediaForm(v => !v)}><Plus size={13}/> Ajouter</button>
          </div>

          {/* Notes de chantier inline */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <StickyNote size={14} style={{ color: BRAND }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3A3D44' }}>Notes de chantier</span>
              {notesSaving && <span style={{ fontSize: 11, color: '#7C8089', marginLeft: 'auto' }}>Enregistrement…</span>}
            </div>
            <textarea
              className="input resize-none"
              style={{ minHeight: 80 }}
              placeholder="Ajoutez des notes, remarques ou observations…"
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
            />
          </div>

          {showMediaForm && (
            <form onSubmit={addMedia} className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
              <div className="flex gap-2">
                {[
                  { k: 'photo', icon: <Image size={13}/>, l: 'Photo' },
                  { k: 'note',  icon: <StickyNote size={13}/>, l: 'Note' },
                  { k: 'voice', icon: <Mic size={13}/>, l: 'Vocal' },
                ].map(({ k, icon, l }) => (
                  <button key={k} type="button"
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${mediaForm.type === k ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-400'}`}
                    onClick={() => setMediaForm(f => ({ ...f, type: k }))}>{icon} {l}</button>
                ))}
              </div>
              {mediaForm.type === 'photo' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><label className="label">URL de la photo *</label><input className="input" value={mediaForm.url} onChange={e => setMediaForm(f => ({ ...f, url: e.target.value, mime_type: 'image/jpeg' }))} placeholder="https://…" required/></div>
                  <div><label className="label">Légende</label><input className="input" value={mediaForm.caption} onChange={e => setMediaForm(f => ({ ...f, caption: e.target.value }))} placeholder="Ex: Fondation côté nord"/></div>
                </div>
              ) : mediaForm.type === 'voice' ? (
                <div>
                  <label className="label">Transcription du mémo vocal *</label>
                  <textarea className="input" rows={2} value={mediaForm.transcript} onChange={e => setMediaForm(f => ({ ...f, transcript: e.target.value }))} placeholder="Transcrivez ou collez le contenu du mémo… (enregistrement audio à venir)" required/>
                </div>
              ) : (
                <div>
                  <label className="label">Note de chantier *</label>
                  <textarea className="input" rows={2} value={mediaForm.caption} onChange={e => setMediaForm(f => ({ ...f, caption: e.target.value }))} placeholder="Ex: Coffrage mal aligné au coin sud-est…" required/>
                </div>
              )}
              <div className="flex justify-end"><button type="submit" className="btn-primary text-xs px-4">Ajouter</button></div>
            </form>
          )}

          {media.length > 0 ? (
            <>
              {/* Galerie horizontale */}
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 4, scrollbarWidth: 'thin' }}>
                {media.map(m => (
                  <div key={`gal-${m.id}`} style={{ flexShrink: 0, width: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid #E8EAED', background: '#fff', cursor: 'pointer' }}
                    onClick={() => setLightboxItem(m)}>
                    {m.type === 'photo' && m.url
                      ? <img src={m.url} alt={m.caption || ''} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}/>
                      : <div style={{ width: '100%', height: 110, background: '#F4F6F8', display: 'grid', placeItems: 'center', fontSize: 28 }}>{m.type === 'voice' ? '🎙' : '📌'}</div>
                    }
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{ fontSize: 11, color: '#7C8089', margin: 0 }}>{new Date(m.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</p>
                      <p style={{ fontSize: 12, color: '#15171C', margin: '2px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.caption || m.transcript || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Détails / analyse IA */}
              <div className="space-y-2">
              {media.map(m => {
                const a = m.ai_analysis;
                const issues = (a?.non_conformities?.length || 0) + (a?.safety_risks?.length || 0);
                return (
                  <div key={m.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 cursor-pointer" onClick={() => setLightboxItem(m)}>
                        {m.type === 'photo' && m.url
                          ? <img src={m.url} alt={m.caption || ''} className="w-14 h-14 rounded-lg object-cover border border-gray-100"/>
                          : <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center">{m.type === 'voice' ? <Mic size={18} className="text-gray-300"/> : <StickyNote size={18} className="text-gray-300"/>}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-gray text-[10px] capitalize">{m.type}</span>
                          {m.ai_status === 'done' && a?.overall_severity && <span className={`badge ${SEV[a.overall_severity]?.c || 'badge-gray'} text-[10px]`}>{issues > 0 ? `${issues} point(s)` : 'Conforme'}</span>}
                          <span className="text-[11px] text-gray-300 ml-auto">{m.author_name || ''} · {new Date(m.created_at).toLocaleDateString('fr-CA')}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 truncate">{m.caption || m.transcript || '—'}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button className="btn-ghost text-[11px] py-1 px-2 text-brand" onClick={() => analyzeMedia(m.id)} disabled={analyzingMediaId === m.id}>
                          {analyzingMediaId === m.id ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Analyser
                        </button>
                        <button className="btn-ghost p-1 text-gray-300 hover:text-red-500 self-end" onClick={() => deleteMedia(m.id)}><Trash2 size={12}/></button>
                      </div>
                    </div>
                    {/* Résultat analyse IA */}
                    {m.ai_status === 'done' && a && (
                      <div className="mt-2 pt-2 border-t border-gray-50 space-y-2">
                        {a.summary && <p className="text-xs text-gray-500 italic">{a.summary}</p>}
                        {a.non_conformities?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1"><AlertCircle size={11} className="text-orange-400"/> Non-conformités</p>
                            {a.non_conformities.map((nc, i) => (
                              <div key={i} className="flex items-start gap-2 mb-1">
                                <span className={`badge ${SEV[nc.severity]?.c || 'badge-gray'} text-[9px] mt-0.5 flex-shrink-0`}>{SEV[nc.severity]?.l || nc.severity}</span>
                                <p className="text-xs text-gray-600"><span className="font-medium">{nc.issue}</span>{nc.recommendation ? ` — ${nc.recommendation}` : ''}{nc.reference ? ` (${nc.reference})` : ''}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {a.safety_risks?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1"><ShieldAlert size={11} className="text-red-400"/> Sécurité (CNESST)</p>
                            {a.safety_risks.map((sr, i) => (
                              <div key={i} className="flex items-start gap-2 mb-1">
                                <span className={`badge ${SEV[sr.severity]?.c || 'badge-gray'} text-[9px] mt-0.5 flex-shrink-0`}>{SEV[sr.severity]?.l || sr.severity}</span>
                                <p className="text-xs text-gray-600"><span className="font-medium">{sr.risk}</span>{sr.action ? ` — ${sr.action}` : ''}{sr.cnesst_reference ? ` (${sr.cnesst_reference})` : ''}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {m.ai_status === 'error' && <p className="text-[11px] text-red-400 mt-2">Échec de l'analyse. Réessayez.</p>}
                  </div>
                );
              })}
              </div>
            </>
          ) : !showMediaForm && (
            <div className="text-center py-5">
              <Camera size={26} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">Aucun média. Ajoutez photos et notes de chantier pour l'analyse IA.</p>
            </div>
          )}
        </div>


        {/* ── Dépenses ── (violet) */}
        <div id="s-expenses" style={{ background: '#F0EBFD', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>💸</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Dépenses & factures fournisseurs</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Coûts réels du chantier{project.expenses?.length > 0 ? ` · ${project.expenses.length} entrée(s)` : ''}</div>
            </div>
            <button className="btn-secondary text-xs" onClick={() => setShowExpenseForm(v => !v)}><Plus size={13} /> Ajouter</button>
          </div>

          {showExpenseForm && (
            <form onSubmit={addExpense} className="bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
              <div><label className="label">Type</label>
                <select className="input" value={expenseForm.type} onChange={e => setExpenseForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="label">Montant ($) *</label><input className="input" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required /></div>
              <div><label className="label">Date</label><input className="input" type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
              <div className="flex gap-2"><input className="input flex-1" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" /><button type="submit" className="btn-primary text-xs px-3">OK</button></div>
            </form>
          )}

          {project.expenses?.length > 0 ? (
            <div className="space-y-1.5">
              {project.expenses.map(x => (
                <div key={x.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="badge badge-gray text-xs">{EXPENSE_TYPES[x.type] || x.type}</span>
                  <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{x.description || x.subcontractor_name || '—'}</span>
                  {x.expense_date && <span className="text-xs text-gray-400">{new Date(x.expense_date).toLocaleDateString('fr-CA')}</span>}
                  <span className="text-sm font-semibold text-gray-700">{money(x.amount)}</span>
                  <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" onClick={() => removeExpense(x.id)}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          ) : !showExpenseForm && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune dépense. Ajoutez factures fournisseurs et dépenses pour calculer la rentabilité réelle.</p>
          )}
        </div>

        {/* ── Feuilles de temps ── (mint) */}
        <div id="s-punch" style={{ background: '#E9F3EC', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>⏱️</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Punch</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Feuilles de temps{timesheets.length > 0 ? ` · ${timesheets.length} entrée(s) · ${activeTs.length} en cours` : ''}</div>
            </div>
          </div>
          {timesheets.length > 0 ? (
            <>
              {/* Totaux agrégés */}
              {(() => {
                const done = timesheets.filter(t => t.clock_out);
                const byWorker = {};
                let totalH = 0;
                done.forEach(ts => {
                  const h = (new Date(ts.clock_out) - new Date(ts.clock_in)) / 3600000;
                  totalH += h;
                  const key = ts.user_name || ts.sub_name || 'Inconnu';
                  byWorker[key] = (byWorker[key] || 0) + h;
                });
                return (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-6 mb-3 flex-wrap">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{totalH.toFixed(1)}h</p>
                        <p className="text-xs text-gray-400">Total pointé</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-brand">{timesheets.filter(t => !t.approved_at).length}</p>
                        <p className="text-xs text-gray-400">En attente</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{timesheets.filter(t => t.approved_at).length}</p>
                        <p className="text-xs text-gray-400">Approuvé</p>
                      </div>
                    </div>
                    {Object.keys(byWorker).length > 0 && (
                      <div className="space-y-1.5">
                        {Object.entries(byWorker).sort((a, b) => b[1] - a[1]).map(([name, h]) => (
                          <div key={name} className="flex items-center gap-2">
                            <p className="text-xs text-gray-600 w-28 truncate">{name}</p>
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                              <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, (h / (totalH || 1)) * 100)}%` }}/>
                            </div>
                            <p className="text-xs font-semibold text-gray-700 w-10 text-right">{h.toFixed(1)}h</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Lignes détail */}
              <div className="space-y-1">
                {timesheets.map(ts => {
                  const hours = ts.clock_out ? ((new Date(ts.clock_out) - new Date(ts.clock_in)) / 3600000).toFixed(1) : null;
                  return (
                    <div key={ts.id} className={`flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 ${!ts.clock_out ? 'bg-green-50/50 rounded-lg px-2' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800">{ts.user_name || ts.sub_name || 'Travailleur'}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(ts.clock_in).toLocaleDateString('fr-CA')} · {new Date(ts.clock_in).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                          {ts.clock_out && ` → ${new Date(ts.clock_out).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                      {hours
                        ? <span className="text-xs font-semibold text-gray-700 w-12 text-right flex-shrink-0">{hours}h</span>
                        : <span className="badge badge-green text-[10px] flex-shrink-0">En cours</span>}
                      {ts.approved_at
                        ? <CheckCircle size={13} className="text-green-400 flex-shrink-0" title="Approuvé"/>
                        : <button className="text-[10px] text-gray-400 hover:text-brand border border-gray-200 rounded-md px-1.5 py-0.5 flex-shrink-0 transition-colors" onClick={() => approveTs(ts.id)}>Approuver</button>}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucun punch enregistré. Générez un QR ci-dessous pour commencer.</p>
          )}
        </div>

        {/* ── Commandes ── (cream) */}
        <div id="s-orders" style={{ background: '#F4EFE4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📦</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Commandes matériaux</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Approvisionnements et suivi de livraison{materialOrders.length > 0 ? ` · ${materialOrders.length} commande(s)` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {materialOrders.length > 0 && (
                <button className="btn-ghost text-xs text-brand" onClick={groupPurchases} disabled={groupingPurchases}>
                  {groupingPurchases ? <Loader2 size={13} className="animate-spin"/> : <Wand2 size={13}/>} Regrouper (IA)
                </button>
              )}
              <button className="btn-secondary text-xs" onClick={() => setShowOrderForm(v => !v)}><Plus size={13}/> Commande</button>
            </div>
          </div>

          {/* Plan de regroupement IA */}
          {purchasePlan && (
            <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 size={13} className="text-brand"/>
                <p className="text-xs font-semibold text-gray-700">Plan d'achat optimisé</p>
                <button className="ml-auto text-gray-300 hover:text-gray-500" onClick={() => setPurchasePlan(null)}><X size={13}/></button>
              </div>
              {purchasePlan.summary && <p className="text-xs text-gray-600 mb-2">{purchasePlan.summary}</p>}
              {purchasePlan.groups?.length > 0 && (
                <div className="space-y-1 mb-2">
                  {purchasePlan.groups.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Package size={11} className="text-gray-300"/>
                      <span className="font-medium text-gray-700">{g.supplier}</span>
                      <span className="text-gray-400">{g.order_count} cmd{g.total_estimate ? ` · ${money(g.total_estimate)}` : ''}</span>
                      {g.consolidation_note && <span className="text-gray-500 truncate">— {g.consolidation_note}</span>}
                    </div>
                  ))}
                </div>
              )}
              {purchasePlan.opportunities?.length > 0 && (
                <div className="space-y-1">
                  {purchasePlan.opportunities.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Sparkles size={11} className="text-brand mt-0.5 flex-shrink-0"/>
                      <p className="text-gray-600"><span className="font-medium">{o.supplier}</span> — {o.description}{o.potential_saving ? ` (≈ ${o.potential_saving})` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {showOrderForm && (
            <form onSubmit={createOrder} className="bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
              <div><label className="label">Fournisseur *</label><input className="input" value={orderForm.supplier} onChange={e => setOrderForm(f => ({ ...f, supplier: e.target.value }))} required/></div>
              <div><label className="label">N° commande</label><input className="input" value={orderForm.order_number} onChange={e => setOrderForm(f => ({ ...f, order_number: e.target.value }))} placeholder="Ex: PO-2026-001"/></div>
              <div><label className="label">Montant ($)</label><input className="input" type="number" step="0.01" value={orderForm.total_amount} onChange={e => setOrderForm(f => ({ ...f, total_amount: e.target.value }))}/></div>
              <div><label className="label">Date commande</label><input className="input" type="date" value={orderForm.order_date} onChange={e => setOrderForm(f => ({ ...f, order_date: e.target.value }))}/></div>
              <div><label className="label">Livraison prévue</label><input className="input" type="date" value={orderForm.expected_date} onChange={e => setOrderForm(f => ({ ...f, expected_date: e.target.value }))}/></div>
              <div className="flex gap-2">
                <input className="input flex-1" value={orderForm.description} onChange={e => setOrderForm(f => ({ ...f, description: e.target.value }))} placeholder="Description"/>
                <button type="submit" className="btn-primary text-xs px-3">OK</button>
              </div>
            </form>
          )}
          {materialOrders.length > 0 ? (
            <div className="space-y-2">
              {materialOrders.map(o => {
                const statusBadge = { draft: 'badge-gray', ordered: 'badge-blue', partial: 'badge-yellow', received: 'badge-green', cancelled: 'badge-gray' };
                const statusLabel = { draft: 'Brouillon', ordered: 'Commandé', partial: 'Partiel', received: 'Reçu', cancelled: 'Annulé' };
                return (
                  <div key={o.id} className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-[160px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{o.supplier}</p>
                        {o.order_number && <span className="text-xs text-gray-400">#{o.order_number}</span>}
                      </div>
                      {o.description && <p className="text-xs text-gray-400 truncate">{o.description}</p>}
                      {o.expected_date && <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5"><Calendar size={9}/> Livraison {new Date(o.expected_date).toLocaleDateString('fr-CA')}</p>}
                    </div>
                    {o.total_amount && <span className="text-sm font-semibold text-gray-700">{money(o.total_amount)}</span>}
                    <select className="input text-xs py-1 flex-shrink-0" style={{ width: 108 }} value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                      {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn-ghost p-1 text-gray-300 hover:text-red-500 flex-shrink-0" onClick={() => deleteOrder(o.id)}><Trash2 size={13}/></button>
                  </div>
                );
              })}
            </div>
          ) : !showOrderForm && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune commande. Ajoutez des commandes pour suivre vos approvisionnements.</p>
          )}
        </div>

        {/* ── Soumission détaillée ── (white) */}
        <div id="s-soumission" style={{ borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📄</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Devis précis</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Soumission détaillée par poste · génération du contrat</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {quoteBuilderQuote?.status === 'sent' && <span className="badge badge-blue text-xs">Envoyée</span>}
              {quoteBuilderQuote?.status === 'signed' && <span className="badge badge-green text-xs">Signée</span>}
              {quoteSaving && <span style={{ fontSize: 11, color: '#7C8089', display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }}/> Enreg…</span>}
            </div>
          </div>

          {/* Line items by type */}
          {['material', 'labor', 'subcontractor', 'other'].map((type) => {
            const typeLabels = { material: 'Matériaux', labor: "Main d'œuvre", subcontractor: 'Sous-traitants', other: 'Autres' };
            const typeItems = quoteBuilderItems.map((it, i) => ({ ...it, _i: i })).filter(it => it.type === type);
            return (
              <div key={type} className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{typeLabels[type]}</p>
                  <button className="btn-ghost text-xs py-0.5 px-2 text-brand" onClick={() => addQuoteItem(type)}>
                    <Plus size={11}/> Ligne
                  </button>
                </div>
                {typeItems.length === 0 ? (
                  <p className="text-xs text-gray-300 italic py-1">Aucun poste</p>
                ) : (
                  <div className="space-y-1.5">
                    {typeItems.map((it) => (
                      <div key={it._i} className="flex items-center gap-1.5 py-1 border-b border-gray-50 last:border-0">
                        <input
                          className="input py-1 text-xs flex-1 min-w-0"
                          placeholder="Description"
                          value={it.name}
                          onChange={(e) => updateQuoteItem(it._i, { name: e.target.value })}
                        />
                        <input
                          className="input py-1 text-xs w-14 text-right"
                          type="number" min="0" step="0.01"
                          placeholder="Qté"
                          value={it.qty}
                          onChange={(e) => updateQuoteItem(it._i, { qty: Number(e.target.value) })}
                        />
                        <input
                          className="input py-1 text-xs w-14"
                          placeholder="Unité"
                          value={it.unit}
                          onChange={(e) => updateQuoteItem(it._i, { unit: e.target.value })}
                        />
                        <input
                          className="input py-1 text-xs w-20 text-right"
                          type="number" min="0" step="0.01"
                          placeholder="Prix unit."
                          value={it.unit_price}
                          onChange={(e) => updateQuoteItem(it._i, { unit_price: Number(e.target.value) })}
                        />
                        <span className="text-xs text-gray-600 font-medium w-20 text-right flex-shrink-0">
                          {((Number(it.qty)||1)*(Number(it.unit_price)||0)).toLocaleString('fr-CA',{minimumFractionDigits:2})}$
                        </span>
                        <button className="btn-ghost p-1 text-gray-300 hover:text-red-500 flex-shrink-0" onClick={() => removeQuoteItem(it._i)}>
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Totals */}
          {quoteBuilderItems.length > 0 && (() => {
            const subtotal = quoteBuilderItems.reduce((s, it) => s + (Number(it.qty)||1)*(Number(it.unit_price)||0), 0);
            const tps = subtotal * 0.05;
            const tvq = subtotal * 0.09975;
            const total = subtotal + tps + tvq;
            const fmt = (v) => v.toLocaleString('fr-CA', { minimumFractionDigits: 2 }) + ' $';
            return (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-gray-400 text-xs"><span>TPS (5%)</span><span>{fmt(tps)}</span></div>
                <div className="flex justify-between text-gray-400 text-xs"><span>TVQ (9,975%)</span><span>{fmt(tvq)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100"><span>Total</span><span className="text-brand">{fmt(total)}</span></div>
              </div>
            );
          })()}

          {/* Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {quoteBuilderItems.length > 0 && quoteBuilderQuote?.status !== 'sent' && quoteBuilderQuote?.status !== 'signed' && (
              <button
                className="btn-primary text-xs py-2"
                onClick={sendQuoteToClient}
                disabled={quoteSending || !quoteBuilderQuote}
              >
                {quoteSending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                Envoyer au client
              </button>
            )}
            {quoteBuilderQuote && (
              <button className="btn-secondary text-xs py-2" onClick={() => setPreview({ url: pdf.quoteUrl(quoteBuilderQuote.id), title: 'Soumission' })}>
                <Eye size={13}/> Aperçu PDF
              </button>
            )}
            {quoteBuilderQuote?.status === 'sent' && (
              <p className="text-xs text-blue-500 flex items-center gap-1"><CheckCircle size={12}/> Soumission envoyée au client.</p>
            )}
          </div>
        </div>

        {/* ── RFQs / Sous-traitants ── (violet) */}
        <div id="s-rfqs" style={{ background: '#F0EBFD', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>🤝</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Demandes de prix</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>RFQ aux sous-traitants{projectRfqs.length > 0 ? ` · ${projectRfqs.length} demande(s)` : ''}</div>
            </div>
            <button className="btn-secondary text-xs" onClick={() => setShowRfqForm(v => !v)}>
              <Plus size={13}/> {t('create_rfq')}
            </button>
          </div>

          {showRfqForm && (
            <form onSubmit={createRfq} className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Titre *</label><input className="input" value={rfqForm.title} onChange={e => setRfqForm(f => ({...f,title:e.target.value}))} placeholder="Ex: Demande de prix — Électricité" required /></div>
                <div><label className="label">Spécialité</label><input className="input" value={rfqForm.specialty} onChange={e => setRfqForm(f => ({...f,specialty:e.target.value}))} placeholder="Électricité, Plomberie…" /></div>
              </div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={rfqForm.description} onChange={e => setRfqForm(f => ({...f,description:e.target.value}))} placeholder="Portée des travaux…"/></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Date limite</label><input className="input" type="date" value={rfqForm.deadline} onChange={e => setRfqForm(f => ({...f,deadline:e.target.value}))}/></div>
                <div className="flex items-end gap-2">
                  <button type="button" className="btn-secondary flex-1 text-xs" onClick={() => setShowRfqForm(false)}>Annuler</button>
                  <button type="submit" className="btn-primary flex-1 text-xs">Créer</button>
                </div>
              </div>
            </form>
          )}

          {projectRfqs.length === 0 && !showRfqForm ? (
            <div className="text-center py-5">
              <Users size={26} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">Créez des demandes de prix aux sous-traitants directement depuis ce projet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projectRfqs.map(rfq => (
                <div key={rfq.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{rfq.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {rfq.specialty && <span className="badge badge-gray text-xs">{rfq.specialty}</span>}
                      {rfq.deadline && <span className="text-xs text-gray-400">Échéance: {new Date(rfq.deadline).toLocaleDateString('fr-CA')}</span>}
                      <span className="text-xs text-gray-400">{rfq.responses_count || 0} invité(s)</span>
                    </div>
                  </div>
                  <button
                    className="btn-secondary text-xs py-1"
                    onClick={() => { setShowInviteModal(rfq.id); setSelectedSubIds([]); }}
                  >
                    <UserPlus size={12}/> Inviter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Inviter des sous-traitants</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
                {subs.length === 0 && <p className="text-sm text-gray-400">Aucun sous-traitant enregistré. Allez dans Sous-traitants pour en ajouter.</p>}
                {subs.map(s => (
                  <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded-lg px-2">
                    <input
                      type="checkbox"
                      checked={selectedSubIds.includes(s.id)}
                      onChange={() => setSelectedSubIds(ids => ids.includes(s.id) ? ids.filter(x => x !== s.id) : [...ids, s.id])}
                    />
                    <span className="text-sm text-gray-700">{s.name}{s.company_name ? ` — ${s.company_name}` : ''}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-xs" onClick={() => setShowInviteModal(null)}>Annuler</button>
                <button
                  className="btn-primary flex-1 text-xs"
                  onClick={() => inviteSubsToRfq(showInviteModal)}
                  disabled={inviting || !selectedSubIds.length}
                >
                  {inviting ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                  Inviter ({selectedSubIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Contrats ── (white) */}
        <div id="s-contracts" style={{ borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>✍️</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Contrats</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Signature électronique et suivi des contrats signés</div>
            </div>
            {quoteBuilderQuote && projectContracts.length === 0 && (
              <button className="btn-secondary text-xs" onClick={generateContract} disabled={generatingContract}>
                {generatingContract ? <Loader2 size={13} className="animate-spin"/> : <FileSignature size={13}/>}
                Générer
              </button>
            )}
            {projectContracts.length > 0 && <span className="badge badge-green text-xs">{projectContracts.length} contrat(s)</span>}
          </div>

          {projectContracts.length === 0 ? (
            <div className="text-center py-6">
              <FileSignature size={28} className="text-gray-200 mx-auto mb-2"/>
              {quoteBuilderQuote ? (
                <p className="text-sm text-gray-400">Génère un contrat depuis la soumission détaillée.</p>
              ) : (
                <p className="text-sm text-gray-400">Crée d'abord une soumission dans cet onglet pour générer un contrat.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {projectContracts.map(c => {
                const isSending = contractSendingId === c.id;
                const statusColor = { draft: 'badge-gray', sent: 'badge-blue', signed: 'badge-green', cancelled: 'badge-gray' };
                const statusLabel = { draft: 'Brouillon', sent: 'Envoyé', signed: 'Signé', cancelled: 'Annulé' };
                return (
                  <div key={c.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                        <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('fr-CA')}</p>
                      </div>
                      <span className={`badge ${statusColor[c.status] || 'badge-gray'} text-xs`}>{statusLabel[c.status] || c.status}</span>
                    </div>

                    {c.status === 'signed' && (
                      <p className="text-xs text-green-600 mb-2 flex items-center gap-1"><CheckCircle size={11}/> Signé par {c.signer_name} le {new Date(c.signed_at).toLocaleDateString('fr-CA')}</p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <button className="btn-secondary text-xs py-1" onClick={() => setShowContractContent(showContractContent === c.id ? null : c.id)}>
                        <Eye size={11}/> {showContractContent === c.id ? 'Masquer' : 'Voir le contrat'}
                      </button>
                      {c.status === 'draft' && (
                        <button className="btn-primary text-xs py-1" onClick={() => sendContract(c.id)} disabled={isSending}>
                          {isSending ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>} Envoyer (stub)
                        </button>
                      )}
                      <button className="btn-ghost text-xs py-1 text-gray-300 hover:text-red-500" onClick={() => deleteContract(c.id)}>
                        <Trash2 size={11}/>
                      </button>
                    </div>

                    {/* E-sign stub notice */}
                    {c.status === 'draft' && (
                      <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                        <AlertCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                        <p className="text-xs text-amber-700">Signature électronique désactivée — configurez une clé dans Paramètres › Intégrations pour activer DocuSign / Notarize.</p>
                      </div>
                    )}

                    {showContractContent === c.id && (
                      <pre className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 overflow-auto whitespace-pre-wrap font-mono" style={{ maxHeight: 320 }}>
                        {c.content}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Factures ── (mint) */}
        {projectInvoices.length > 0 && (
          <div id="s-invoices" style={{ background: '#E9F3EC', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>🧾</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Factures</h2>
                <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Factures liées à ce projet · {projectInvoices.length} facture(s)</div>
              </div>
              <button className="btn-ghost text-xs" onClick={() => navigate('/factures')}>Voir tout</button>
            </div>
            <div className="space-y-2">
              {projectInvoices.map(inv => {
                const SB = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', partial:'badge-orange', paid:'badge-green', overdue:'badge-red', cancelled:'badge-gray' };
                const SL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée' };
                return (
                  <div key={inv.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <FileText size={13} className="text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{inv.title || `Facture ${inv.number}`}</p>
                    </div>
                    <span className={`badge ${SB[inv.status]||'badge-gray'} text-xs`}>{SL[inv.status]||inv.status}</span>
                    <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{Number(inv.total||0).toLocaleString('fr-CA')}$</p>
                    <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Prévisualiser" onClick={() => setPreview({ url: pdf.invoiceUrl(inv.id), title: inv.title || `Facture ${inv.number}` })}><Eye size={13}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Soumissions liées ── (blue) */}
        {projectQuotes.length > 0 && (
          <div id="s-quotes" style={{ background: '#E7EFF4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📋</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Soumissions & Avenants</h2>
                <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>{projectQuotes.length} soumission(s) liée(s) à ce projet</div>
              </div>
              <button className="btn-secondary text-xs" onClick={() => navigate(`/soumissions?new=1&project_id=${id}&title=${encodeURIComponent(t('change_order')+' — '+project.name)}`)}><Plus size={12}/> {t('add_change_order')}</button>
            </div>
            {(() => {
              const QSB = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', signed:'badge-green', expired:'badge-gray', rejected:'badge-red', converted:'badge-orange' };
              const QSL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', signed:'Signée', expired:'Expirée', rejected:'Refusée', converted:'Convertie' };
              return (
                <div className="space-y-2">
                  {projectQuotes.map(q => (
                    <div key={q.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{q.title || 'Soumission'}</p>
                      </div>
                      <span className={`badge ${QSB[q.status]||'badge-gray'} text-xs`}>{QSL[q.status]||q.status}</span>
                      {q.total > 0 && <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{Number(q.total).toLocaleString('fr-CA')}$</p>}
                      <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Prévisualiser" onClick={() => setPreview({ url: pdf.quoteUrl(q.id), title: q.title || 'Soumission' })}><Eye size={13}/></button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Documents ── (white) */}
        <div id="s-documents" style={{ borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📁</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Documents</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Plans, permis et fichiers du projet{project.documents?.length > 0 ? ` · ${project.documents.length}` : ''}</div>
            </div>
          </div>
          {project.documents?.length > 0 ? (
            <div className="space-y-2">
              {project.documents.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <FileText size={14} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.type}{d.created_at ? ` · ${new Date(d.created_at).toLocaleDateString('fr-CA')}` : ''}</p>
                  </div>
                  <button className="btn-ghost text-xs py-1 px-2" onClick={() => setPreview({ url: d.file_url, mime_type: d.mime_type, title: d.name })}>
                    <Eye size={13} /> Prévisualiser
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucun document téléversé sur ce projet.</p>
          )}
        </div>

        {/* ── Quittance ── (mint) */}
        <div id="s-quittances" style={{ background: '#E9F3EC', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>✅</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Quittances</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Certificat de satisfaction client · clôture du projet (Québec)</div>
            </div>
          </div>

          {!quittance && !showQuittanceForm && (
            <div className="text-center py-6">
              <Shield size={28} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400 mb-4">Envoyez une quittance à votre client pour confirmer la fin des travaux et obtenir sa signature électronique.</p>
              <button
                className="btn-primary text-xs"
                onClick={() => {
                  setQuittanceForm({ client_name: project.client_name||'', client_email: project.client_email||'', project_description: project.name||'', amount_paid: project.contract_value||'', notes: '' });
                  setShowQuittanceForm(true);
                }}
              >
                <Shield size={13}/> Générer une quittance
              </button>
            </div>
          )}

          {showQuittanceForm && (
            <form onSubmit={createQuittance} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom du client *</label><input className="input" value={quittanceForm.client_name} onChange={e=>setQuittanceForm(f=>({...f,client_name:e.target.value}))} required/></div>
                <div><label className="label">Courriel client</label><input className="input" type="email" value={quittanceForm.client_email} onChange={e=>setQuittanceForm(f=>({...f,client_email:e.target.value}))}/></div>
              </div>
              <div><label className="label">Description des travaux</label><textarea className="input resize-none" rows={2} value={quittanceForm.project_description} onChange={e=>setQuittanceForm(f=>({...f,project_description:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Montant payé ($)</label><input className="input" type="number" value={quittanceForm.amount_paid} onChange={e=>setQuittanceForm(f=>({...f,amount_paid:e.target.value}))}/></div>
                <div><label className="label">Note (optionnel)</label><input className="input" value={quittanceForm.notes} onChange={e=>setQuittanceForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={()=>setShowQuittanceForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary flex-1" disabled={savingQuittance}>{savingQuittance&&<Loader2 size={13} className="animate-spin"/>} Créer la quittance</button>
              </div>
            </form>
          )}

          {quittance && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${quittance.status==='signed'?'bg-green-500':quittance.status==='sent'?'bg-blue-400':'bg-gray-300'}`}/>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{quittance.client_name}</p>
                  <p className="text-xs text-gray-400">
                    {quittance.status==='signed'
                      ? `✓ Signée le ${new Date(quittance.signed_at).toLocaleDateString('fr-CA')}`
                      : quittance.status==='sent' ? 'Envoyée — en attente de signature' : 'Brouillon — non envoyée'}
                  </p>
                </div>
                <span className={`badge ${quittance.status==='signed'?'badge-green':quittance.status==='sent'?'badge-blue':'badge-gray'}`}>
                  {quittance.status==='signed'?'Signée':quittance.status==='sent'?'Envoyée':'Brouillon'}
                </span>
              </div>
              {quittance.status !== 'signed' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn-secondary text-xs py-1.5"
                    onClick={() => {
                      const url = `${FRONTEND_URL}/quittance/${quittance.public_token}`;
                      navigator.clipboard.writeText(url);
                      alert('Lien copié!');
                    }}
                  >
                    <Link2 size={12}/> Copier le lien client
                  </button>
                  <a
                    href={`${FRONTEND_URL}/quittance/${quittance.public_token}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-ghost text-xs py-1.5"
                  >
                    <ExternalLink size={12}/> Prévisualiser
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${quittance.client_name}, voici votre quittance de fin de travaux à signer : ${FRONTEND_URL}/quittance/${quittance.public_token}`)}`}
                    target="_blank" rel="noreferrer"
                    className="btn-ghost text-xs py-1.5 text-green-600 hover:text-green-700"
                    title="Envoyer la quittance par WhatsApp"
                  >
                    <MessageCircle size={12}/> WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Portail client ── (violet) */}
        <div id="s-portal" style={{ background: '#F0EBFD', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>🌐</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Portails d'accès</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Liens sécurisés — client et fournisseurs</div>
            </div>
          </div>

          {project.portal_token ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <Globe size={13} className="text-gray-300 flex-shrink-0"/>
                <span className="text-xs text-gray-500 truncate flex-1 font-mono">{FRONTEND_URL}/portal/{project.portal_token}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-primary text-xs py-1.5 flex-1"
                  onClick={copyPortalLink}
                >
                  {portalCopied ? <CheckCircle size={13} className="text-green-300"/> : <Link2 size={13}/>}
                  {portalCopied ? 'Copié !' : 'Copier le lien'}
                </button>
                <a
                  href={`${FRONTEND_URL}/portal/${project.portal_token}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5"
                  title="Aperçu du portail"
                >
                  <ExternalLink size={13}/> Aperçu
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici le lien pour suivre l'avancement de vos travaux en temps réel : ${FRONTEND_URL}/portal/${project.portal_token}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 text-green-600"
                  title="Envoyer par WhatsApp"
                >
                  <MessageCircle size={13}/>
                </a>
                <button
                  className="btn-ghost text-xs py-1.5 text-gray-400"
                  onClick={resetPortalToken}
                  disabled={resettingPortal}
                  title="Générer un nouveau lien (invalide l'ancien)"
                >
                  {resettingPortal ? <Loader2 size={13} className="animate-spin"/> : '↻'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Globe size={28} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400 mb-4">Le lien portail sera disponible au prochain rechargement (migration DB en cours).</p>
            </div>
          )}

          {/* Portail fournisseur */}
          <div style={{ marginTop: 20, padding: 16, background: '#F4F6F8', borderRadius: 12, border: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#E7EFF4', display: 'grid', placeItems: 'center', fontSize: 18 }}>🏢</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: 0 }}>Portail fournisseur</p>
                <p style={{ fontSize: 11.5, color: '#7C8089', margin: 0 }}>Demandes de prix, commandes, documents techniques — bientôt disponible</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: '#E7EFF4', color: '#3A3D44' }}>Bientôt</span>
            </div>
          </div>
        </div>

        {/* ── Plans & rendus ── (stub) */}
        <div id="s-plans" style={{ background: '#F0F2F4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px', opacity: 0.85 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, opacity: 0.55 }}>🏛</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#7C8089', margin: 0 }}>Plans & rendus d'architecte</h2>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>PDF, DWG, extraction IA des surfaces — B8</div>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: '#E7EFF4', color: '#7C8089', whiteSpace: 'nowrap', marginTop: 4 }}>Bientôt · B8</span>
          </div>
          <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #E8EAED', fontSize: 13, color: '#7C8089', lineHeight: 1.6 }}>
            Upload de plans (PDF/DWG), prévisualisation, extraction IA des dimensions et surfaces pour préremplir l'estimation, rendu visuel IA, intégration BIM.
          </div>
        </div>

        {/* ── Courriels & communications ── (stub) */}
        <div id="s-comms" style={{ background: '#F0F2F4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px', opacity: 0.85 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, opacity: 0.55 }}>✉</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#7C8089', margin: 0 }}>Courriels & communications</h2>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Gmail · WhatsApp · SMS liés au projet — B9</div>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: '#E7EFF4', color: '#7C8089', whiteSpace: 'nowrap', marginTop: 4 }}>Bientôt · B9</span>
          </div>
          <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #E8EAED', fontSize: 13, color: '#7C8089', lineHeight: 1.6 }}>
            Synchronisation Gmail et WhatsApp, résumé IA des échanges, actions rapides (répondre, créer avenant) directement depuis la fiche projet.
          </div>
        </div>

        {/* ── Avenants (Change Orders) ── (cream) */}
        <div id="s-co" style={{ background: '#F4EFE4', borderTop: '1px solid #E8EAED', padding: '36px 56px 44px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>📝</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Avenants</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 4 }}>Demandes de modification{changeOrdersList.length > 0 ? ` · ${changeOrdersList.length}` : ''}</div>
            </div>
            <button className="btn-secondary text-xs" onClick={()=>setShowCOForm(v=>!v)}>
              <Plus size={13}/> Nouvelle
            </button>
          </div>
          {showCOForm && (
            <form onSubmit={createChangeOrder} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div><label className="label">Titre *</label><input className="input" value={coForm.title} onChange={e=>setCoForm(f=>({...f,title:e.target.value}))} required placeholder="Ex: Ajout d'une salle de bain"/></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={coForm.description} onChange={e=>setCoForm(f=>({...f,description:e.target.value}))} placeholder="Détails des travaux supplémentaires…"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Montant ($)</label><input className="input" type="number" step="0.01" value={coForm.amount} onChange={e=>setCoForm(f=>({...f,amount:e.target.value}))} placeholder="0"/></div>
                <div><label className="label">Note interne</label><input className="input" value={coForm.notes} onChange={e=>setCoForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1 text-sm" onClick={()=>setShowCOForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={savingCO}>{savingCO&&<Loader2 size={13} className="animate-spin"/>} Créer</button>
              </div>
            </form>
          )}

          {changeOrdersList.length === 0 && !showCOForm ? (
            <div className="text-center py-5">
              <FileEdit size={28} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">Aucune demande de modification. Créez-en une pour tout changement de portée de projet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {changeOrdersList.map(co => {
                const statusColor = co.status==='approved'?'text-green-600':co.status==='rejected'?'text-red-500':co.status==='pending_approval'?'text-blue-500':'text-gray-400';
                const statusLabel = co.status==='approved'?'Approuvée':co.status==='rejected'?'Refusée':co.status==='pending_approval'?'Envoyée':'Brouillon';
                const impact = coImpact[co.id];
                return (
                  <div key={co.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${co.status==='approved'?'bg-green-500':co.status==='rejected'?'bg-red-400':co.status==='sent'?'bg-blue-400':'bg-gray-300'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{co.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                        {co.amount > 0 && <span className="text-xs text-gray-400">+{Number(co.amount).toLocaleString('fr-CA')}$</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-white transition-colors"
                        title="Analyser l'impact (IA)"
                        onClick={() => analyzeChangeOrder(co.id)}
                        disabled={analyzingCoId === co.id}
                      >
                        {analyzingCoId === co.id ? <Loader2 size={13} className="animate-spin"/> : <Wand2 size={13}/>}
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-white transition-colors"
                        title={copiedCO===co.id?'Copié!':'Copier le lien client'}
                        onClick={()=>copyCOLink(co)}
                      >
                        {copiedCO===co.id?<CheckCheck size={13} className="text-green-500"/>:<Copy size={13}/>}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici une demande de modification à approuver : ${FRONTEND_URL}/modification/${co.public_token}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-white transition-colors"
                        title="Envoyer par WhatsApp"
                        onClick={async()=>{ if(co.status==='draft') await changeOrdersApi.update(co.id,{status:'pending_approval'}).then(()=>setChangeOrdersList(l=>l.map(c=>c.id===co.id?{...c,status:'pending_approval'}:c))); }}
                      >
                        <MessageCircle size={13}/>
                      </a>
                      <a
                        href={`${FRONTEND_URL}/modification/${co.public_token}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                        title="Aperçu"
                      >
                        <ExternalLink size={13}/>
                      </a>
                      <button
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-white transition-colors"
                        onClick={()=>deleteCO(co.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                  {/* Impact IA de l'avenant */}
                  {impact && (
                    <div className="mt-2 pt-2 border-t border-gray-200/70 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Wand2 size={11} className="text-brand"/>
                        <p className="text-[11px] font-semibold text-gray-600">Impact estimé</p>
                        {impact.overall_impact && <span className={`badge ${SEV[impact.overall_impact]?.c || 'badge-gray'} text-[9px]`}>{SEV[impact.overall_impact]?.l || impact.overall_impact}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                        {impact.budget_impact && <span><span className="text-gray-400">Budget :</span> {impact.budget_impact.amount != null ? money(impact.budget_impact.amount) : '—'}{impact.budget_impact.percent_of_contract ? ` (${impact.budget_impact.percent_of_contract}%)` : ''}</span>}
                        {impact.schedule_impact && <span><span className="text-gray-400">Échéancier :</span> +{impact.schedule_impact.estimated_days || 0} j</span>}
                        {impact.affected_trades?.length > 0 && <span><span className="text-gray-400">Métiers :</span> {impact.affected_trades.join(', ')}</span>}
                      </div>
                      {impact.recommendation && <p className="text-[11px] text-gray-600 italic">💡 {impact.recommendation}</p>}
                      {impact.risks?.length > 0 && (
                        <ul className="text-[11px] text-gray-500 list-disc list-inside">
                          {impact.risks.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Portal Messages */}
        {portalMessages.length > 0 && (
          <div className="card mt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Messages du portail client</h2>
              <span className="bg-brand/10 text-brand text-xs rounded-full px-1.5 py-0.5">{portalMessages.length}</span>
            </div>
            <div className="space-y-3">
              {portalMessages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-500">{(msg.author_name?.[0] || 'C').toUpperCase()}</span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{msg.author_name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleDateString('fr-CA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      {/* ── Popup changement statut pipeline ── */}
      {statusPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setStatusPopup(null)}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: BRAND_SOFT, display: 'grid', placeItems: 'center', fontSize: 22, marginBottom: 16 }}>🔄</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#15171C', margin: '0 0 8px' }}>Changer le statut ?</h3>
            <p style={{ fontSize: 14, color: '#7C8089', margin: '0 0 20px' }}>
              Passer de <b>{PIPELINE_LABELS[project.status] || project.status}</b> à <b style={{ color: BRAND }}>{statusPopup.label}</b> ?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary flex-1" onClick={() => setStatusPopup(null)}>Annuler</button>
              <button className="btn-primary flex-1" onClick={changeProjectStatus} disabled={changingStatus}>
                {changingStatus ? <Loader2 size={14} className="animate-spin"/> : null} Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <DocPreview doc={preview} onClose={() => setPreview(null)} />
      {showInfo && (
        <InfoModal
          project={project}
          onClose={() => setShowInfo(false)}
          onSave={(data) => { setProject((p) => ({ ...p, ...data })); setShowInfo(false); }}
        />
      )}
    </Layout>
  );
}
