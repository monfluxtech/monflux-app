import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useT } from '../hooks/useT';
import { useUiPrefs } from '../hooks/useUiPrefs';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useConfigStore } from '../store';
import Layout from '../components/Layout';
import ProjectSection from '../components/project/ProjectSection';
import { isSectionAvailable, unavailableReason } from '../config/projectSections';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi, invoices as invoicesApi, quotes as quotesApi, quittances as quittancesApi, changeOrders as changeOrdersApi, subcontractors as subsApi, companies as companiesApi, rfqs as rfqsApi, contracts as contractsApi, materialOrders as materialOrdersApi, siteMedia as siteMediaApi, ai as aiApi, pdf, email as emailApi, contacts as contactsApi, documents as documentsApi, activityLog as activityLogApi } from '../api';
import { ArrowLeft, QrCode, Plus, Loader2, MapPin, Calendar, DollarSign, CheckCircle, Pencil, StickyNote, Receipt, FileText, GitBranch, Shield, Link2, ExternalLink, MessageCircle, MessageSquare, Globe, FileEdit, Trash2, Copy, CheckCheck, TrendingUp, HardHat, FolderOpen, Eye, EyeOff, X, ClipboardCheck, Send, Camera, Sparkles, CreditCard, FileSignature, Briefcase, Users, UserPlus, LayoutDashboard, Wrench, FolderClosed, AlertCircle, Clock, Package, Image, ShieldAlert, Wand2, AlertTriangle, Mic, GripVertical, Video, Square, Paperclip, Upload, Share2, Download, Repeat, Pin, Save } from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const money = (v) => (Number(v) || 0).toLocaleString('fr-CA', { maximumFractionDigits: 0 }) + '$';
const BRAND = '#E8794E';
const BRAND_DARK = '#C85A2B';
const BRAND_SOFT = '#FFF1EB';
const BRAND_BORDER = '#F9D5C0';

const STICKY_COLORS = [
  { key: 'yellow', bg: '#FEF9C3', border: '#EAB308', text: '#713F12' },
  { key: 'pink',   bg: '#FCE7F3', border: '#EC4899', text: '#831843' },
  { key: 'blue',   bg: '#DBEAFE', border: '#3B82F6', text: '#1E3A5F' },
  { key: 'green',  bg: '#DCFCE7', border: '#22c55e', text: '#14532D' },
  { key: 'purple', bg: '#EDE9FE', border: '#8B5CF6', text: '#4C1D95' },
  { key: 'orange', bg: '#FFEDD5', border: '#F97316', text: '#7C2D12' },
];

const DETAIL_TOC_SECTIONS = [
  { id: 's-estimation', icon: '📊', label: 'Estimation approximative' },
  { id: 's-pipeline', icon: '🏗️', label: 'Phases du projet' },
  { id: 's-equipe', icon: '🤝', label: 'Équipe et conformité' },
  { id: 's-materiaux', icon: '🔍', label: 'Recherche de matériaux' },
  { id: 's-soumission', icon: '📄', label: 'Devis & contrat' },
  { id: 's-punch', icon: '⏱️', label: 'Punch et dépenses' },
  { id: 's-expenses', icon: '🧾', label: 'Factures fournisseurs' },
  { id: 's-invoices', icon: '🧾', label: 'Factures client' },
  { id: 's-extras', icon: '⚡', label: 'Demandes de modification' },
  { id: 's-quittances', icon: '✅', label: 'Quittances', badge: 'QC' },
  { id: 's-denonciations', icon: '⚖️', label: 'Dénonciations', badge: 'QC' },
  { id: 's-media', icon: '📷', label: 'Notes et photos' },
];

const DEFAULT_CONTRACT_TEMPLATE_CONFIG = {
  default_key: 'general',
  templates: [
    { key: 'general', label: 'Contrat général', project_types: ['default', 'general', 'renovation'] },
    { key: 'interior', label: 'Contrat intérieur', project_types: ['cuisine', 'salle_de_bain', 'interior'] },
    { key: 'exterior', label: 'Contrat extérieur', project_types: ['toiture', 'revetement', 'terrasse', 'exterieur'] },
    { key: 'service', label: 'Entente de service', project_types: ['service', 'entretien', 'maintenance'] },
  ],
};

const getContractTemplateConfig = (value) => {
  const incoming = value && Array.isArray(value.templates) ? value : DEFAULT_CONTRACT_TEMPLATE_CONFIG;
  const known = new Map(DEFAULT_CONTRACT_TEMPLATE_CONFIG.templates.map((template) => [template.key, template]));
  incoming.templates.forEach((template) => {
    if (!template?.key) return;
    known.set(template.key, { ...known.get(template.key), ...template });
  });
  return {
    default_key: known.has(incoming.default_key) ? incoming.default_key : DEFAULT_CONTRACT_TEMPLATE_CONFIG.default_key,
    templates: [...known.values()],
  };
};

const normalizeContractKey = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const guessProjectContractTemplateKey = (project, config) => {
  const templateConfig = getContractTemplateConfig(config);
  const haystack = [
    project?.field_assessment?.work_type,
    project?.type,
    project?.name,
    project?.description,
  ].map(normalizeContractKey).filter(Boolean).join(' ');
  const match = templateConfig.templates.find((template) => (
    (template.project_types || []).some((type) => haystack.includes(normalizeContractKey(type)))
  ));
  return match?.key || templateConfig.default_key;
};

const normalizeContractHtml = (content) => {
  const raw = String(content || '').trim();
  if (!raw) return '<p></p>';
  if (raw.includes('<')) return raw;
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('');
};

const PROJECT_SECTION_DEFAULTS = {
  's-description': true,
  's-estimation': true,
  's-pipeline': true,
  's-equipe': false,
  's-materiaux': false,
  's-soumission': true,
  's-media': false,
  's-expenses': false,
  's-punch': false,
  's-invoices': false,
  's-extras': false,
  's-quittances': false,
  's-denonciations': false,
};

const formatCompactDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
};

const formatSectionMoney = (value) => `${(Number(value) || 0).toLocaleString('fr-CA', { maximumFractionDigits: 0 })}$`;

// Stub affiché dans le corps quand une section est désactivée (par état ou par module).
// SectionStub kept for DOM presence (section is hidden via CSS, not removed)
function SectionStub() { return null; }

// Parse flexible date input → ISO YYYY-MM-DD or null
function parseFlexDate(v) {
  if (!v) return null;
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const mDMY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mDMY) return `${mDMY[3]}-${mDMY[2].padStart(2,'0')}-${mDMY[1].padStart(2,'0')}`;
  const MONTHS = { jan:1, fév:2, 'fev':2, mar:3, avr:4, mai:5, juin:6, juil:7, 'aou':8, 'aoû':8, sep:9, oct:10, nov:11, déc:12, 'dec':12 };
  const mFR = s.match(/^(\d{1,2})\s+([a-zéûô]+)\.?\s+(\d{4})$/i);
  if (mFR) {
    const mKey = mFR[2].toLowerCase().slice(0,3).replace('é','e').replace('û','u').replace('ô','o');
    const month = MONTHS[mFR[2].toLowerCase().slice(0,4)] || MONTHS[mKey];
    if (month) return `${mFR[3]}-${String(month).padStart(2,'0')}-${mFR[1].padStart(2,'0')}`;
  }
  return null;
}

// Address autocomplete using Nominatim (free, no API key)
function AddressAutocomplete({ value, onSave, onCity, onPostal, placeholder = 'Adresse', style = {}, displayStyle = {} }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const skipBlur = useRef(false);

  useEffect(() => { if (!editing) setVal(value || ''); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };

  const search = (q) => {
    clearTimeout(timerRef.current);
    if (q.length < 4) { setSuggestions([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=ca&q=${encodeURIComponent(q)}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'MONFLUX/2.0 (monflux.tech)' } });
        const data = await resp.json();
        setSuggestions(data || []);
      } catch { setSuggestions([]); } finally { setSearching(false); }
    }, 420);
  };

  const selectSuggestion = (s) => {
    skipBlur.current = true;
    const a = s.address || {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const formatted = street || s.display_name.split(',')[0].trim();
    const city = a.city || a.town || a.village || a.municipality || '';
    const postal = a.postcode || '';
    setVal(formatted);
    onSave(formatted);
    if (onCity && city) onCity(city);
    if (onPostal && postal) onPostal(postal);
    setSuggestions([]);
    setEditing(false);
    setTimeout(() => { skipBlur.current = false; }, 200);
  };

  const commit = () => {
    setSuggestions([]);
    setEditing(false);
    if (val.trim() !== (value || '').trim()) onSave(val.trim());
  };

  const base = { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', padding: 0, ...style };

  if (editing) return (
    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      <input
        ref={inputRef}
        value={val}
        onChange={e => { setVal(e.target.value); search(e.target.value); }}
        onBlur={() => { if (!skipBlur.current) commit(); }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setSuggestions([]); setEditing(false); setVal(value || ''); } }}
        style={{ ...base, minWidth: 160 }}
        autoComplete="off"
      />
      {(suggestions.length > 0 || searching) && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,.16)', zIndex: 200, minWidth: 320, maxWidth: 480, overflow: 'hidden', border: '1px solid #E8EAED' }}>
          {searching && <div style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid #E8794E', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }}/>Recherche…</div>}
          {suggestions.map((s, i) => {
            const a = s.address || {};
            const street = [a.house_number, a.road].filter(Boolean).join(' ');
            const city = a.city || a.town || a.village || a.municipality || '';
            const postal = a.postcode || '';
            const line1 = street || s.display_name.split(',')[0].trim();
            const line2 = [city, postal].filter(Boolean).join(', ');
            return (
              <div key={i} onMouseDown={() => selectSuggestion(s)}
                style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #F5F7F9' : 'none', display: 'flex', flexDirection: 'column', gap: 2, background: '#fff', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF4EE'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#15171C' }}>{line1}</span>
                {line2 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{line2}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <span
      tabIndex={0} onClick={start} onFocus={start}
      title="Cliquer pour modifier l'adresse"
      style={{ cursor: 'text', borderBottom: '1px dashed transparent', transition: 'border-color .15s', outline: 'none', ...displayStyle }}
      onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'rgba(232,121,78,.5)'}
      onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
    >
      {val || <span style={{ color: '#B0B3BA', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
}

function InlineField({ value, onSave, placeholder = '—', multiline = false, style = {}, displayStyle = {} }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [committed, setCommitted] = useState(value || '');
  const inputRef = useRef(null);
  const spanRef = useRef(null);
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
    ? <textarea ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Escape') cancel(); }} style={{ ...base, width: '100%', minHeight: 48, resize: 'vertical' }} />
    : <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') cancel(); }} style={{ ...base, width: '100%' }} />;
  const display = committed;
  return (
    <span
      ref={spanRef}
      tabIndex={0}
      onClick={start}
      onFocus={start}
      title="Cliquer pour modifier"
      style={{ cursor: 'text', borderBottom: '1px dashed transparent', transition: 'border-color .15s', outline: 'none', ...displayStyle }}
      onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'rgba(232,121,78,.5)'}
      onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
    >
      {display || <span style={{ color: '#B0B3BA', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
}

// ── Capture multimodale : texte, dictée vocale (Web Speech API), photo, vidéo, document ──
function CaptureModal({ projectId, projectName, onClose, onAdded, initialText = '' }) {
  const BRAND = '#E8794E', BRAND_DARK = '#C85A2B';
  const MAX_BYTES = 45 * 1024 * 1024; // ~45 Mo (limite body 50 Mo côté serveur)
  const [text, setText] = useState(initialText);
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
        body: JSON.stringify({
          messages: next, context_type: 'project', project_id: projectId,
          ...(projectContext?.activeSection && { active_section: projectContext.activeSection }),
          ...(projectContext && { project_context: projectContext }),
        }),
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
                maxWidth: '88%', padding: m.role === 'user' ? '10px 14px' : '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? BRAND : '#fff',
                border: m.role === 'user' ? 'none' : '1px solid #ECEEF0',
                boxShadow: m.role === 'assistant' ? '0 1px 6px rgba(0,0,0,.06)' : 'none',
                color: m.role === 'user' ? '#fff' : '#15171C', fontSize: 13, lineHeight: 1.65,
              }}>
                {m.role === 'assistant' ? (
                  loading && i === messages.length - 1 && !m.content
                    ? <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></span>
                    : <FloMessage content={m.content || '…'} />
                ) : (m.content || '…')}
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

// Renders Flo's markdown-ish responses with colors, bold highlights, and clickable URLs
function FloMessage({ content }) {
  const lines = content.split('\n');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:4 }}/>;
        // H2 ## → section header with color strip
        if (line.startsWith('## ')) return (
          <div key={i} style={{ fontSize:12, fontWeight:800, color:'#E8794E', textTransform:'uppercase', letterSpacing:'.06em', marginTop:6, marginBottom:2, borderLeft:'3px solid #E8794E', paddingLeft:8 }}>
            {line.slice(3)}
          </div>
        );
        // H3 ### → smaller header
        if (line.startsWith('### ')) return (
          <div key={i} style={{ fontSize:12, fontWeight:700, color:'#3B82F6', marginTop:4, marginBottom:1 }}>{line.slice(4)}</div>
        );
        // Bullet list items
        if (line.match(/^[\-\*] /)) {
          const text = line.slice(2);
          return <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start', paddingLeft:4 }}>
            <span style={{ color:'#E8794E', fontWeight:900, flexShrink:0, marginTop:2 }}>•</span>
            <span>{renderInline(text)}</span>
          </div>;
        }
        // Numbered list
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\. /)[1];
          const text = line.replace(/^\d+\. /, '');
          return <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start', paddingLeft:4 }}>
            <span style={{ color:'#E8794E', fontWeight:800, flexShrink:0, minWidth:16, marginTop:2 }}>{num}.</span>
            <span>{renderInline(text)}</span>
          </div>;
        }
        // Source / URL line
        if (line.match(/https?:\/\//)) return (
          <div key={i} style={{ fontSize:11, color:'#6B7280', paddingLeft:4 }}>{renderInline(line)}</div>
        );
        // Normal paragraph
        return <div key={i} style={{ paddingLeft:4 }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text) {
  // Split on **bold**, *italic*, `code`, and URLs
  const parts = text.split(/(https?:\/\/[^\s)]+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={j} style={{ color:'#15171C', fontWeight:700 }}>{part.slice(2,-2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={j} style={{ color:'#374151' }}>{part.slice(1,-1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={j} style={{ background:'#F3F4F6', borderRadius:4, padding:'1px 5px', fontSize:11.5, fontFamily:'monospace', color:'#E8794E' }}>{part.slice(1,-1)}</code>;
    if (part.match(/^https?:\/\//))
      return <a key={j} href={part} target="_blank" rel="noreferrer" style={{ color:'#3B82F6', textDecoration:'underline', fontSize:11.5, wordBreak:'break-all' }}>{part}</a>;
    return part;
  });
}

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

const STATUS_BORDER  = { not_started:'#E5E7EB', in_progress:BRAND, done:'#22C55E', delayed:'#EF4444', on_hold:'#FCD34D', waiting_supplier:'#A78BFA' };
const STATUS_FILL    = { not_started:'#D1D5DB', in_progress:BRAND, done:'#22C55E', delayed:'#EF4444', on_hold:'#F59E0B', waiting_supplier:'#8B5CF6' };
const PUNCH_COLOR    = '#60A5FA'; // bleu — distingue le réel (punch) du prévu (statut)
const STATUS_LABELS  = { not_started:'Non démarré', in_progress:'En cours', done:'Terminé', delayed:'En retard', on_hold:'En attente client', waiting_supplier:'En attente fournisseur' };
const SCALE_COL_W    = { month:120, week:72, day:36, halfday:56, hour:32 };

function GanttChart({ phases, projectStart, projectEnd, trades, onDeletePhase, onEditPhase, onReorderPhases, onRenamePhase, onDatesChange, onAddPhase, onUpdatePhase, currentUserName, onSelfAssign }) {
  const [scale, setScale]         = useState('day');
  const [editCell, setEditCell]   = useState(null); // { id, field: 'datetime'|'duration' }
  const [cascade, setCascade]     = useState(true);
  const [showDates, setShowDates]     = useState(false);
  const [showArrows, setShowArrows]   = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [filterPunch, setFilterPunch] = useState(false);
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
  const [pinnedCols, setPinnedCols]         = useState(() => { try { const s=localStorage.getItem('mf_gantt_pinned'); return s ? new Set(JSON.parse(s)) : new Set(['phase','start','dur_prev','assigned']); } catch { return new Set(['phase','start','dur_prev','assigned']); } });
  const [hiddenCols, setHiddenCols]         = useState(() => { try { const s=localStorage.getItem('mf_gantt_hidden'); return s ? new Set(JSON.parse(s)) : new Set(['dur_real','dep_pred','dep_succ']); } catch { return new Set(['dur_real','dep_pred','dep_succ']); } });
  const [recurrenceEdit, setRecurrenceEdit] = useState(null); // { id, rect }
  const [recurrenceForm, setRecurrenceForm] = useState({ type:'weekly', count:2 });
  const [filters, setFilters]               = useState({ name:'', start_date:'', assigned:'', phaseStatus: new Set(), assigneeStatus: new Set() });
  const [filterDurMin, setFilterDurMin]     = useState('');
  const [filterDurMax, setFilterDurMax]     = useState('');
  const [filterHasDep, setFilterHasDep]     = useState(false);
  const [filterDepPred, setFilterDepPred]   = useState(''); // phase ID: show phases that depend ON this
  const [filterDepSucc, setFilterDepSucc]   = useState(''); // phase ID: show phases that are predecessors OF this
  const [filterRecurrence, setFilterRecurrence] = useState(false);
  const [colWidths, setColWidths]           = useState({}); // per-key width overrides
  const [activeFilter, setActiveFilter]     = useState(null);
  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [bulkPanel, setBulkPanel]           = useState(null); // null | 'status' | 'start' | 'duration' | 'assign' | 'dep'
  const [bulkForm, setBulkForm]             = useState({});
  const [statusPicker, setStatusPicker]     = useState(null); // { phId, x, y }
  const [deps, setDeps]                     = useState({}); // { succPhId: { pred, type, fromPt, toPt } }
  const [depFirst, setDepFirst]             = useState(null);
  const [depConnectMode, setDepConnectMode] = useState(false);
  const [depDrag, setDepDrag]               = useState(null); // { fromPhId, fromIdx, fromPt, curX, curY, startX, startY }
  const [hoveredDepKey, setHoveredDepKey]   = useState(null); // 'predId-succId'
  const [longPressDepKey, setLongPressDepKey] = useState(null); // key showing delete UI
  const longPressDepTimer                   = useRef(null);
  const [ptTooltip, setPtTooltip]           = useState(null); // { pt, x, y }
  const depDragRef                          = useRef(null);
  const depHoverRef                         = useRef(null); // { phId, pt } — dot under cursor during drag
  const dateDragRef = useRef(null);
  const scrollRef   = useRef(null);
  const ganttElRef  = useRef(null);
  const todayPxRef  = useRef(0);
  const longPressRef = useRef(null);
  const contentRef  = useRef(null);  // minWidth/relative container — anchor for dep-arrow SVG
  const firstGanttCellRef = useRef(null);
  const [arrowBox, setArrowBox] = useState({ left: 0, top: 0 }); // measured gantt-area offset within contentRef
  const [predEditId, setPredEditId] = useState(null); // phase id whose predecessor cell is being edited inline
  const [succEditId, setSuccEditId] = useState(null); // phase id whose successor cell is adding a link inline

  // Persist pin/hide column state
  useEffect(() => { try { localStorage.setItem('mf_gantt_pinned', JSON.stringify([...pinnedCols])); } catch {} }, [pinnedCols]);
  useEffect(() => { try { localStorage.setItem('mf_gantt_hidden', JSON.stringify([...hiddenCols])); } catch {} }, [hiddenCols]);

  // Sync deps from phases (DB → local state on each phases reload)
  useEffect(() => {
    const loaded = {};
    for (const ph of phases) {
      if (ph.depends_on_phase_id) {
        loaded[String(ph.id)] = {
          pred: String(ph.depends_on_phase_id),
          type: ph.dep_type || 'FS',
          fromPt: ph.dep_from_pt || 'right',
          toPt: ph.dep_to_pt || 'left',
        };
      }
    }
    setDeps(loaded);
  }, [phases]); // eslint-disable-line react-hooks/exhaustive-deps

  // Centrer sur aujourd'hui au chargement et à chaque changement de vue
  // (fixedColW hardcodé car LABEL_W/DATE_W etc. sont définis après le return null)
  useEffect(() => {
    if (!scrollRef.current || todayPxRef.current <= 0) return;
    const FIXED = 24 + 155 + 20 + 102 + 55 + 140; // CHECK_W+LABEL_W+20+DATE_W+DUR_W+ASSIGN_W (approx — dur_real/dep hidden by default)
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

  const CHECK_W    = 24;  // checkbox column
  const LABEL_W    = 155;
  const DATE_W     = 102;
  const DUR_W      = 55;
  const REAL_DUR_W = 62;
  const ASSIGN_W   = 140;
  const DEP_W      = 110;
  const ganttW     = Math.max(columns.length * colW, 400);

  // Colonnes optionnelles (ordre gauche→droite) — cachables via hiddenCols
  const OPTIONAL_COLS = [
    { key: 'start',    w: colWidths.start    ?? DATE_W,     label: 'Début prévu' },
    { key: 'dur_prev', w: colWidths.dur_prev ?? DUR_W,      label: 'Durée prévue' },
    { key: 'dur_real', w: colWidths.dur_real ?? REAL_DUR_W, label: 'Durée réelle' },
    { key: 'assigned', w: colWidths.assigned ?? ASSIGN_W,   label: 'Assigné' },
    { key: 'dep_pred', w: colWidths.dep_pred ?? DEP_W,      label: 'Prédécesseur' },
    { key: 'dep_succ', w: colWidths.dep_succ ?? DEP_W,      label: 'Successeur' },
  ];

  // Drag-resize a column — call from onMouseDown on the separator handle
  const startColResize = (key, initW, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const onMove = (mv) => {
      const delta = mv.clientX - startX;
      setColWidths(prev => ({ ...prev, [key]: Math.max(40, initW + delta) }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const visibleOptCols = OPTIONAL_COLS.filter(c => !hiddenCols.has(c.key));
  const rightOptCols   = OPTIONAL_COLS.filter(c =>  hiddenCols.has(c.key));
  const toggleColPin = (key) => setHiddenCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  // Offsets sticky dynamiques (Phase toujours en premier)
  let _cumLeft = CHECK_W + LABEL_W + 20;
  const colLeftMap = {};
  for (const cd of visibleOptCols) { colLeftMap[cd.key] = _cumLeft; _cumLeft += cd.w; }
  const fixedColsW = _cumLeft;
  const rightColsW = rightOptCols.reduce((s, c) => s + c.w, 0);

  const totalMinW = fixedColsW + ganttW + rightColsW;
  const hasSel = selectedIds.size > 0;

  // Sticky helpers — conditioned on stickyAll toggle (z-index high enough to cover Gantt overlays)
  // Pin = sticky. colKey defaults to 'phase' so checkbox/phase rows follow the phase pin.
  const togglePin  = (key) => setPinnedCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const pinned     = (key) => pinnedCols.has(key);
  // background is set here so sticky cells are always opaque (no content bleeds through on horizontal scroll)
  const stickyH    = (left, colKey = 'phase', extra = {}) => pinned(colKey) ? { position:'sticky', left, zIndex:20, backgroundColor:'#fff', ...extra } : extra;
  const stickyC    = (left, colKey = 'phase', extra = {}) => pinned(colKey) ? { position:'sticky', left, zIndex:15, backgroundColor:'#fff', ...extra } : extra;

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
    if (showArrows) return; // dep mode: ignore bar drag
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

  // ── Dep drag-to-connect ──
  const getDepType = (fromPt, toPt) => {
    if (!fromPt || !toPt) return 'FS';
    if (fromPt === 'right' && toPt === 'left')  return 'FS';
    if (fromPt === 'right' && toPt === 'right') return 'FF';
    if (fromPt === 'left'  && toPt === 'left')  return 'SS';
    if (fromPt === 'left'  && toPt === 'right') return 'SF';
    if (fromPt.startsWith('mid') || toPt.startsWith('mid')) return 'PAR';
    return 'FS';
  };

  const saveDep = (toId, depVal) => {
    setDeps(d => ({ ...d, [toId]: depVal }));
    onUpdatePhase?.(toId, {
      depends_on_phase_id: depVal.pred || null,
      dep_type: depVal.type || 'FS',
      dep_from_pt: depVal.fromPt || 'right',
      dep_to_pt: depVal.toPt || 'left',
    });
    // Cascade FS: move succ start to pred end if succ starts before pred ends
    if ((depVal.type === 'FS' || !depVal.type) && cascade) {
      const pred = phases.find(p => String(p.id) === String(depVal.pred));
      const succ = phases.find(p => String(p.id) === String(toId));
      if (pred?.start_date && pred.duration_hours && succ) {
        const predEndMs = new Date(pred.start_date.slice(0,10)+'T'+(pred.start_time||'08:00')).getTime() + pred.duration_hours * 3600000;
        const succStartMs = succ.start_date ? new Date(succ.start_date.slice(0,10)+'T'+(succ.start_time||'08:00')).getTime() : 0;
        if (succStartMs < predEndMs) {
          const newDate = new Date(predEndMs).toISOString().slice(0,10);
          onUpdatePhase?.(toId, { start_date: newDate });
        }
      }
    }
  };

  const deleteDep = (toId) => {
    setDeps(d => { const n = {...d}; delete n[toId]; return n; });
    onUpdatePhase?.(toId, { depends_on_phase_id: null, dep_type: null, dep_from_pt: null, dep_to_pt: null });
  };

  // Map a dependency type to its anchor points (used when editing deps from the table)
  const DEP_TYPES = ['FS','SS','FF','SF','PAR'];
  const DEP_TYPE_LABEL = { FS:'Fin → Début', SS:'Début → Début', FF:'Fin → Fin', SF:'Début → Fin', PAR:'Parallèle' };
  const DEP_TYPE_COLOR = { FS:'#E8794E', SS:'#10B981', FF:'#F59E0B', SF:'#8B5CF6', PAR:'#6366F1' };
  const ptsForType = (type) => ({
    FS: { fromPt:'right', toPt:'left' },
    SS: { fromPt:'left',  toPt:'left' },
    FF: { fromPt:'right', toPt:'right' },
    SF: { fromPt:'left',  toPt:'right' },
    PAR:{ fromPt:'mid-top', toPt:'mid-bottom' },
  }[type] || { fromPt:'right', toPt:'left' });

  // Inline predecessor editor — used in the dep_pred table column (add / change / remove from table)
  const renderPredCell = (ph, wrapStyle) => {
    const myDep   = deps[String(ph.id)];
    const predId  = myDep ? String(myDep.pred) : '';
    const predPh  = predId ? phases.find(p => String(p.id) === predId) : null;
    const t       = myDep?.type || 'FS';
    const others  = phases.filter(p => String(p.id) !== String(ph.id));
    const selStyle = { fontSize:10.5, border:`1.5px solid ${BRAND}`, borderRadius:5, padding:'2px 3px', outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' };

    if (predEditId === ph.id) {
      return (
        <div style={{ ...wrapStyle, gap:3, padding:'0 4px' }} onClick={e => e.stopPropagation()}>
          <select autoFocus value={predId}
            onChange={e => {
              const v = e.target.value;
              if (!v) { deleteDep(String(ph.id)); setPredEditId(null); }
              else    { saveDep(String(ph.id), { pred:v, type:t, ...ptsForType(t) }); }
            }}
            style={{ ...selStyle, flex:1, minWidth:0 }}>
            <option value="">— Aucun —</option>
            {others.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
          {predId && (
            <select value={t}
              onChange={e => saveDep(String(ph.id), { pred:predId, type:e.target.value, ...ptsForType(e.target.value) })}
              title="Type de dépendance"
              style={{ ...selStyle, width:48, flexShrink:0, color: DEP_TYPE_COLOR[t], fontWeight:800 }}>
              {DEP_TYPES.map(tt => <option key={tt} value={tt}>{tt}</option>)}
            </select>
          )}
          <button onClick={() => setPredEditId(null)} title="Terminer"
            style={{ flexShrink:0, background:'transparent', border:'none', cursor:'pointer', color:'#6B7280', fontSize:13, lineHeight:1, padding:'0 2px' }}>✓</button>
        </div>
      );
    }
    return (
      <div style={wrapStyle}>
        {predPh ? (
          <button onClick={() => setPredEditId(ph.id)} title="Modifier le prédécesseur"
            style={{ display:'flex', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer', padding:0, maxWidth:'100%', overflow:'hidden' }}>
            <span style={{ fontSize:9, fontWeight:800, padding:'2px 4px', borderRadius:4, background: DEP_TYPE_COLOR[t]+'22', color: DEP_TYPE_COLOR[t], flexShrink:0 }}>{t}</span>
            <span style={{ fontSize:10.5, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{predPh.name}</span>
          </button>
        ) : (
          <button onClick={() => setPredEditId(ph.id)} title="Ajouter un prédécesseur"
            style={{ display:'flex', alignItems:'center', gap:3, background:'transparent', border:'none', cursor:'pointer', padding:0, color:'#C9CDD3', fontSize:10.5, fontWeight:600 }}>
            <span style={{ fontSize:13, lineHeight:1, color:BRAND, opacity:.5 }}>+</span> Ajouter
          </button>
        )}
      </div>
    );
  };

  // Inline successor editor — successors are phases whose predecessor IS ph.
  // Editing a successor = setting/clearing deps[successorId].pred.
  const renderSuccCell = (ph, wrapStyle) => {
    const succEntries = Object.entries(deps).filter(([sid, dv]) => String(typeof dv==='object'?dv.pred:dv) === String(ph.id));
    const succIds = succEntries.map(([sid]) => sid);
    // candidates = phases that are not ph, not already a successor, and won't create a self-loop
    const candidates = phases.filter(p => String(p.id)!==String(ph.id) && !succIds.includes(String(p.id)));
    const selStyle = { fontSize:10.5, border:`1.5px solid ${BRAND}`, borderRadius:5, padding:'2px 3px', outline:'none', background:'#fff', fontFamily:'inherit', cursor:'pointer' };

    return (
      <div style={{ ...wrapStyle, gap:4, flexWrap:'wrap' }} onClick={e => e.stopPropagation()}>
        {succEntries.map(([sid, dv]) => {
          const sph = phases.find(p => String(p.id) === sid); if (!sph) return null;
          const t = typeof dv==='object' ? (dv.type||'FS') : 'FS';
          return (
            <span key={sid} style={{ display:'inline-flex', alignItems:'center', gap:3, background:'#F8F9FA', borderRadius:4, padding:'1px 2px 1px 4px', maxWidth:'100%', overflow:'hidden' }}>
              <span style={{ fontSize:9, fontWeight:800, padding:'1px 4px', borderRadius:4, background: DEP_TYPE_COLOR[t]+'22', color: DEP_TYPE_COLOR[t], flexShrink:0 }}>{t}</span>
              <span style={{ fontSize:10.5, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sph.name}</span>
              <button onClick={() => deleteDep(sid)} title="Retirer ce lien"
                style={{ flexShrink:0, background:'transparent', border:'none', cursor:'pointer', color:'#C0563D', fontSize:11, lineHeight:1, padding:'0 1px' }}>✕</button>
            </span>
          );
        })}
        {succEditId === ph.id ? (
          <select autoFocus value=""
            onChange={e => { const v=e.target.value; if (v) saveDep(v, { pred:String(ph.id), type:'FS', ...ptsForType('FS') }); setSuccEditId(null); }}
            onBlur={() => setTimeout(()=>setSuccEditId(null), 150)}
            style={{ ...selStyle, maxWidth:'100%' }}>
            <option value="">— Choisir —</option>
            {candidates.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
        ) : (
          <button onClick={() => setSuccEditId(ph.id)} title="Ajouter un successeur"
            style={{ display:'inline-flex', alignItems:'center', gap:2, background:'transparent', border:'none', cursor:'pointer', padding:0, color:'#C9CDD3', fontSize:10.5, fontWeight:600 }}>
            <span style={{ fontSize:13, lineHeight:1, color:BRAND, opacity:.5 }}>+</span>{succEntries.length===0 && ' Ajouter'}
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!depDrag) return;
    const move = (e) => {
      depDragRef.current = depDragRef.current
        ? { ...depDragRef.current, curX: e.clientX, curY: e.clientY }
        : null;
      setDepDrag(d => d ? { ...d, curX: e.clientX, curY: e.clientY } : null);
      // elementFromPoint is unaffected by pointer capture — reliably finds the dot under cursor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const dotEl = el?.closest('[data-dep-pt]') || (el?.dataset?.depPt ? el : null);
      if (dotEl) {
        const phId = dotEl.getAttribute('data-phase-id');
        const pt   = dotEl.getAttribute('data-dep-pt');
        if (phId && pt) { depHoverRef.current = { phId, pt }; return; }
      }
      depHoverRef.current = null;
    };
    const up = () => {
      if (depDragRef.current) {
        const fromId = String(depDragRef.current.fromPhId);
        const fromPt = depDragRef.current.fromPt || 'right';
        // depHoverRef is set by onPointerEnter on dots — more reliable than elementFromPoint
        const hover = depHoverRef.current;
        if (hover && String(hover.phId) !== fromId) {
          const toPt = hover.pt;
          const type = getDepType(fromPt, toPt);
          saveDep(String(hover.phId), { pred: fromId, type, fromPt, toPt });
        }
        depHoverRef.current = null;
      }
      setDepDrag(null);
      depDragRef.current = null;
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
  }, [depDrag !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Measure the gantt-area offset (left+top) within the content container so the dep-arrow
  // SVG aligns exactly with the bars, regardless of column widths, pins, or header height.
  useLayoutEffect(() => {
    if (!showArrows) return;
    const measure = () => {
      const cell = firstGanttCellRef.current;
      const cont = contentRef.current;
      if (!cell || !cont) return;
      const cr = cont.getBoundingClientRect();
      const gr = cell.getBoundingClientRect();
      // rects are viewport coords; both scroll together so the difference is the true offset
      setArrowBox({ left: gr.left - cr.left, top: gr.top - cr.top });
    };
    measure();
    // re-measure on next frame (after layout settles) and on resize
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, [showArrows, scale, pinnedCols, hiddenCols, colWidths, phases.length, deps]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const FIXED = pinnedCols.size > 0 ? fixedColsW : 0;
    // centre today within the visible Gantt area (after sticky columns)
    scrollRef.current.scrollLeft = Math.max(0, todayPx - (viewW - FIXED) * 0.4);
  };

  // Filter helpers
  const setFilter = (field, val) => setFilters(f => ({ ...f, [field]: val }));
  const clearFilter = (field) => setFilters(f => ({ ...f, [field]: field==='phaseStatus'||field==='assigneeStatus' ? new Set() : '' }));
  const hasFilter = (field) => {
    const v = filters[field];
    return v instanceof Set ? v.size > 0 : !!v;
  };
  // Basculer un chip dans un filtre de type Set (phaseStatus / assigneeStatus)
  const toggleChipFilter = (field, key) => setFilters(f => {
    const next = new Set(f[field]);
    next.has(key) ? next.delete(key) : next.add(key);
    return { ...f, [field]: next };
  });

  const filteredPhases = phases.filter(ph => {
    if (filters.name && !(ph.name||'').toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.start_date && !(ph.start_date||'').includes(filters.start_date)) return false;
    if (filters.assigned && !(ph.assigned_to_name||'').toLowerCase().includes(filters.assigned.toLowerCase())) return false;
    if (filters.phaseStatus?.size > 0 && !filters.phaseStatus.has(ph.status || 'not_started')) return false;
    if (filterPunch && !(ph.progress_pct > 0)) return false;
    if (filterDurMin !== '' && (ph.duration_hours || 0) < parseFloat(filterDurMin)) return false;
    if (filterDurMax !== '' && (ph.duration_hours || 0) > parseFloat(filterDurMax)) return false;
    if (filterHasDep) {
      if (!filterDepPred && !filterDepSucc) {
        // Show phases with ANY dependency (as dependent or as predecessor)
        const linked = !!deps[ph.id] || Object.values(deps).includes(String(ph.id));
        if (!linked) return false;
      } else {
        let matches = false;
        // filterDepPred selected: show phases that depend ON filterDepPred (filterDepPred is their predecessor)
        if (filterDepPred && String(deps[ph.id]) === filterDepPred) matches = true;
        // filterDepSucc selected: show phases that ARE predecessors of filterDepSucc
        if (filterDepSucc && String(deps[filterDepSucc]) === String(ph.id)) matches = true;
        if (!matches) return false;
      }
    }
    if (filterRecurrence && !ph.recurrence_type) return false;
    if (filters.assigneeStatus?.size > 0) {
      const trade = ph.trade_name ? tradesByName[ph.trade_name.toLowerCase()] : null;
      const effectiveStatus = ph.assigned_to_name ? 'confirmed' : (trade?.status || 'to_find');
      if (!filters.assigneeStatus.has(effectiveStatus)) return false;
    }
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

  const exportPdf = () => {
    const ganttEl = document.querySelector('[data-gantt-print]');
    if (!ganttEl) { window.print(); return; }

    // A4 paysage imprimable à 96 dpi : 297×210mm − 8mm marges ≈ 1058×748px
    const printW = 1058;
    const printH = 748;

    // Remettre scroll à 0 pour que les barres Gantt soient visibles dans le clone
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;

    setTimeout(() => {
      const ganttEl2 = document.querySelector('[data-gantt-print]');

      // Cloner l'arbre DOM complet
      const clone = ganttEl2.cloneNode(true);

      // Supprimer toolbar / filtres / bannière
      clone.querySelectorAll('[data-gantt-no-print]').forEach(n => n.remove());

      // Supprimer TOUTES les colonnes optionnelles (gauche ET droite) — garder seulement Phase + Gantt
      clone.querySelectorAll('[data-opt-col]').forEach(n => n.remove());
      clone.querySelectorAll('[data-right-col]').forEach(n => n.remove());

      // Corriger le conteneur scroll : supprimer overflow pour que les barres soient visibles
      const scrollEl = clone.querySelector('[data-gantt-scroll]');
      if (scrollEl) {
        scrollEl.style.overflow = 'visible';
        scrollEl.style.width = 'auto';
        scrollEl.style.maxWidth = 'none';
        // Fixer les position:sticky des colonnes (elles ne fonctionnent pas hors scroll)
        scrollEl.querySelectorAll('[style*="sticky"]').forEach(el => {
          el.style.position = 'relative';
        });
      }

      // Mesurer le contenu du clone pour calculer l'échelle
      const tmpWrap = document.createElement('div');
      Object.assign(tmpWrap.style, { position:'fixed', top:'-9999px', left:'-9999px', visibility:'hidden', width:'auto' });
      tmpWrap.appendChild(clone);
      document.body.appendChild(tmpWrap);
      const naturalW = clone.scrollWidth || clone.offsetWidth || printW;
      const naturalH = Math.max(clone.scrollHeight, clone.offsetHeight, printH * 0.6);
      document.body.removeChild(tmpWrap);

      const scale = Math.min(printW / naturalW, printH / naturalH, 1).toFixed(4);

      Object.assign(clone.style, {
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        width: `${naturalW}px`,
        position: 'absolute', top: '0', left: '0',
      });

      // Wrapper d'impression avec dimensions A4 fixes (= 1 seule page)
      const wrapper = document.createElement('div');
      wrapper.id = '__gantt_print_wrapper';
      Object.assign(wrapper.style, {
        position: 'fixed', top: '0', left: '0', zIndex: '99999',
        width: `${printW}px`, height: `${printH}px`,
        overflow: 'hidden', background: '#fff',
      });
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const printStyle = document.createElement('style');
      printStyle.id = '__gantt_print_css';
      printStyle.textContent = `
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > *:not(#__gantt_print_wrapper) { display: none !important; }
          #__gantt_print_wrapper { display: block !important; }
        }
      `;
      document.head.appendChild(printStyle);

      window.print();

      setTimeout(() => {
        document.getElementById('__gantt_print_css')?.remove();
        document.getElementById('__gantt_print_wrapper')?.remove();
      }, 1200);
    }, 80);
  };

  // Chemin critique (CPM simplifié) — calculé à chaque render quand activé
  const computeCriticalPath = () => {
    if (!phases.length) return new Set();
    const phById = Object.fromEntries(phases.map(ph => [String(ph.id), ph]));
    const getDur = (ph) => (ph.duration_hours || 8) / 8;
    const order = [...phases].sort((a,b) => (a.display_order||0)-(b.display_order||0));
    // Forward pass
    const ef = {};
    for (const ph of order) {
      const predId = deps[ph.id];
      const es = predId && ef[predId] != null ? ef[predId] : 0;
      ef[ph.id] = es + getDur(ph);
    }
    const projectEnd = Math.max(...Object.values(ef));
    // Backward pass
    const ls = {};
    for (const ph of [...order].reverse()) {
      const successors = order.filter(s => String(deps[s.id]) === String(ph.id));
      ls[ph.id] = !successors.length
        ? projectEnd - getDur(ph)
        : Math.min(...successors.map(s => ls[s.id])) - getDur(ph);
    }
    // Float ≈ 0 → critique
    const critical = new Set();
    for (const ph of order) {
      const predId = deps[ph.id];
      const es = predId && ef[predId] != null ? ef[predId] - getDur(phById[predId]) : 0;
      if (Math.abs(Math.round((ls[ph.id] - es) * 100) / 100) < 0.01) critical.add(ph.id);
    }
    return critical;
  };
  const criticalIds = showCritical ? computeCriticalPath() : new Set();

  return (
    <div data-gantt-print style={{ background:'#fff' }}
      onClick={showArrows && !depDrag ? (e) => {
        // Exit dep mode if clicking anywhere that's not a connection point or the dep SVG
        if (!e.target.closest('[data-dep-pt]') && !e.target.closest('[data-gantt-no-print]')) {
          setShowArrows(false); setPtTooltip(null);
        }
      } : undefined}>
      {/* ── Toolbar — 2 rangées fixes ── */}
      <div data-gantt-no-print style={{ borderBottom:'1px solid #F4F5F6' }}>
        {/* Rangée 1 : vues temporelles (Mois / Sem. / Jour / AM-PM / Heure) + PDF — alignée à droite */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'8px 16px 0 16px', gap:5 }}>
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
        {/* Rangée 2 : Dates / Dépend. / Cascade / Critique / Aujourd'hui */}
        <div style={{ display:'flex', alignItems:'center', padding:'6px 16px 8px 16px', gap:5 }}>
          <span style={{ flex:1 }}/>
          {[
            [showDates,    ()=>setShowDates(v=>!v),    <Calendar size={10}/>,  'Dates'],
            [showArrows,   ()=>{ const next=!showArrows; setShowArrows(next); if(!next){setDepConnectMode(false);setDepFirst(null);setDepDrag(null);} }, <GitBranch size={10}/>, 'Dépendance'],
            [cascade,      ()=>setCascade(v=>!v),      <GitBranch size={10}/>, 'Cascade'],
            [showCritical, ()=>setShowCritical(v=>!v), null,                   'Critique'],
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
        </div>
      </div>

      {/* ── Bannière mode liaison de dépendances ── */}
      {showArrows && (
        <div data-gantt-no-print style={{ background:'#EFF6FF', borderBottom:'1px solid #BFDBFE', padding:'7px 16px', display:'flex', alignItems:'center', gap:10, fontSize:11, color:'#1D4ED8' }}>
          <span style={{ fontSize:14 }}>🔗</span>
          <span style={{ fontWeight:700 }}>
            {depDrag
              ? `Relâcher sur un point de connexion de la phase cible`
              : <span style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  Cliquer-glisser un point coloré sur une barre :
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><span style={{ width:9,height:9,borderRadius:'50%',background:'#3B82F6',display:'inline-block',flexShrink:0 }}/> Début</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><span style={{ width:9,height:9,borderRadius:'50%',background:'#E8794E',display:'inline-block',flexShrink:0 }}/> Fin</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><span style={{ width:9,height:9,borderRadius:'50%',background:'#10B981',display:'inline-block',flexShrink:0 }}/> Parallèle</span>
                </span>}
          </span>
          <button onClick={() => { setShowArrows(false); setDepDrag(null); depDragRef.current = null; }}
            style={{ marginLeft:'auto', background:'#fff', border:'1px solid #CBD5E1', borderRadius:5, padding:'3px 10px', color:'#374151', fontSize:10.5, fontWeight:600, cursor:'pointer' }}>
            ✕ Fermer
          </button>
        </div>
      )}
      {/* ── Filtres / Légende ── 2 lignes: recherche texte (gauche) | statuts (droite) */}
      <div style={{ background:'#FAFBFC', borderBottom:'1px solid #F0F1F2' }}>
        {/* Ligne 1 — FILTRES | Phase | Début | Assigné | sep | Durée prév | Avec dep | Récurrent */}
        <div data-gantt-no-print style={{ padding:'5px 12px', display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', borderBottom:'1px solid #F4F5F6' }}>
          <span style={{ fontSize:8.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#C0C4CC', flexShrink:0 }}>Filtres</span>
          {/* Phase name */}
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', flexShrink:0 }}>Phase</span>
            <input value={filters.name||''} onChange={ev=>setFilter('name',ev.target.value)} placeholder="Chercher…"
              style={{ width:78, fontSize:10, border:`1px solid ${hasFilter('name') ? BRAND : '#E5E7EB'}`, borderRadius:4, padding:'2px 5px', outline:'none' }}/>
            {hasFilter('name') && <button onClick={()=>clearFilter('name')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:10, padding:0 }}>✕</button>}
          </div>
          {/* Début */}
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', flexShrink:0 }}>Début</span>
            <input value={filters.start_date||''} onChange={ev=>setFilter('start_date',ev.target.value)} placeholder="juil 2026…"
              style={{ width:70, fontSize:10, border:`1px solid ${hasFilter('start_date') ? BRAND : '#E5E7EB'}`, borderRadius:4, padding:'2px 5px', outline:'none' }}/>
            {hasFilter('start_date') && <button onClick={()=>clearFilter('start_date')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:10, padding:0 }}>✕</button>}
          </div>
          {/* Assigné nom */}
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', flexShrink:0 }}>Assigné</span>
            <input value={filters.assigned||''} onChange={ev=>setFilter('assigned',ev.target.value)} placeholder="Nom…"
              style={{ width:60, fontSize:10, border:`1px solid ${hasFilter('assigned') ? BRAND : '#E5E7EB'}`, borderRadius:4, padding:'2px 5px', outline:'none' }}/>
            {hasFilter('assigned') && <button onClick={()=>clearFilter('assigned')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:10, padding:0 }}>✕</button>}
          </div>
          <div style={{ width:1, height:12, background:'#E5E7EB', flexShrink:0 }}/>
          {/* Durée prévue */}
          <span style={{ fontSize:8.5, fontWeight:700, color:'#C0C4CC', flexShrink:0 }}>Durée prévu</span>
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <input value={filterDurMin} onChange={ev=>setFilterDurMin(ev.target.value)} placeholder="min"
              style={{ width:36, fontSize:10, border:`1px solid ${filterDurMin ? BRAND : '#E5E7EB'}`, borderRadius:4, padding:'2px 4px', outline:'none' }}/>
            <span style={{ fontSize:9, color:'#C0C4CC' }}>—</span>
            <input value={filterDurMax} onChange={ev=>setFilterDurMax(ev.target.value)} placeholder="max"
              style={{ width:36, fontSize:10, border:`1px solid ${filterDurMax ? BRAND : '#E5E7EB'}`, borderRadius:4, padding:'2px 4px', outline:'none' }}/>
            {(filterDurMin||filterDurMax) && <button onClick={()=>{setFilterDurMin('');setFilterDurMax('');}} style={{ border:'none',background:'transparent',cursor:'pointer',color:'#9CA3AF',fontSize:10,padding:0 }}>✕</button>}
          </div>
          <div style={{ width:1, height:12, background:'#E5E7EB', flexShrink:0 }}/>
          {/* Avec dépendance chip */}
          <button onClick={() => { setFilterHasDep(v=>!v); if (filterHasDep) { setFilterDepPred(''); setFilterDepSucc(''); } }}
            style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4,
              background: filterHasDep ? BRAND_SOFT : '#F3F4F6', border:`1.5px solid ${filterHasDep ? BRAND_BORDER : '#E5E7EB'}`,
              fontSize:10, fontWeight:600, color: filterHasDep ? BRAND_DARK : '#6B7280', cursor:'pointer',
              boxShadow: filterHasDep ? `0 0 0 1.5px ${BRAND_BORDER}88` : 'none', transition:'all .1s' }}>
            <GitBranch size={8}/>Avec dép.
          </button>
          {filterHasDep && <>
            <select value={filterDepPred} onChange={e=>setFilterDepPred(e.target.value)}
              style={{ fontSize:10, border:`1px solid ${filterDepPred?BRAND:'#E5E7EB'}`, borderRadius:4, padding:'2px 4px', color:filterDepPred?BRAND_DARK:'#9CA3AF', background:'#fff', cursor:'pointer', maxWidth:120 }}>
              <option value="">Suivi de…</option>
              {(phases||[]).map(ph=><option key={ph.id} value={String(ph.id)}>{ph.name}</option>)}
            </select>
            <select value={filterDepSucc} onChange={e=>setFilterDepSucc(e.target.value)}
              style={{ fontSize:10, border:`1px solid ${filterDepSucc?BRAND:'#E5E7EB'}`, borderRadius:4, padding:'2px 4px', color:filterDepSucc?BRAND_DARK:'#9CA3AF', background:'#fff', cursor:'pointer', maxWidth:120 }}>
              <option value="">Précède…</option>
              {(phases||[]).map(ph=><option key={ph.id} value={String(ph.id)}>{ph.name}</option>)}
            </select>
            {(filterDepPred||filterDepSucc) && <button onClick={()=>{setFilterDepPred('');setFilterDepSucc('');}} style={{ border:'none',background:'transparent',cursor:'pointer',color:'#9CA3AF',fontSize:10,padding:0 }}>✕</button>}
          </>}
          {/* Récurrent */}
          <button onClick={()=>setFilterRecurrence(v=>!v)}
            style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4,
              background:filterRecurrence?BRAND_SOFT:'#F3F4F6', border:`1.5px solid ${filterRecurrence?BRAND_BORDER:'#E5E7EB'}`,
              fontSize:10, fontWeight:600, color:filterRecurrence?BRAND_DARK:'#6B7280', cursor:'pointer',
              boxShadow:filterRecurrence?`0 0 0 1.5px ${BRAND_BORDER}88`:'none', transition:'all .1s' }}>
            Récurrent
          </button>
        </div>
        {/* Ligne 2 — ASSIGNATION chips */}
        <div data-gantt-no-print style={{ padding:'4px 12px', display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', borderBottom:'1px solid #F4F5F6' }}>
          <span style={{ fontSize:8.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#C0C4CC', flexShrink:0 }}>Assignation</span>
          {Object.entries(ASSIGNEE_STATUS).map(([key, st]) => {
            const active = filters.assigneeStatus.has(key);
            return (
              <button key={key} onClick={()=>toggleChipFilter('assigneeStatus', key)}
                style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4,
                  background:active?st.dot+'22':st.bg, border:`1.5px solid ${active?st.dot:st.border}`,
                  fontSize:10, fontWeight:600, color:active?st.dot:st.text, cursor:'pointer',
                  boxShadow:active?`0 0 0 1.5px ${st.dot}44`:'none', transition:'all .1s' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:st.dot, flexShrink:0 }}/>
                {st.label}
              </button>
            );
          })}
          {filters.assigneeStatus.size>0 && <button onClick={()=>clearFilter('assigneeStatus')} style={{ border:'none',background:'transparent',cursor:'pointer',color:'#9CA3AF',fontSize:11,padding:'0 2px' }}>✕</button>}
        </div>
        {/* Ligne 3 — Statuts Phase + Réel Punch */}
        <div data-gantt-no-print style={{ padding:'4px 12px', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:8.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#C0C4CC', flexShrink:0 }}>Phase</span>
          <span style={{ fontSize:8.5, fontWeight:700, color:'#C0C4CC', fontStyle:'italic', flexShrink:0 }}>Prévu&nbsp;→</span>
          {Object.entries(STATUS_LABELS).map(([status, label]) => {
            const active = filters.phaseStatus.has(status);
            const fill = STATUS_FILL[status];
            return (
              <button key={status} onClick={() => toggleChipFilter('phaseStatus', status)}
                style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4,
                  background: active ? fill+'22' : '#F3F4F6', border:`1.5px solid ${active ? fill : '#E5E7EB'}`,
                  fontSize:10, fontWeight:600, color: active ? fill : '#6B7280', cursor:'pointer',
                  boxShadow: active ? `0 0 0 1.5px ${fill}55` : 'none', transition:'all .1s' }}>
                <span style={{ width:8, height:8, borderRadius:2, background:fill, display:'inline-block', flexShrink:0 }}/>
                {label}
              </button>
            );
          })}
          {filters.phaseStatus.size > 0 && <button onClick={() => clearFilter('phaseStatus')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9CA3AF', fontSize:11, padding:'0 2px' }}>✕</button>}
          <div style={{ width:1, height:12, background:'#E5E7EB', flexShrink:0 }}/>
          {/* Punch — cliquable */}
          <span style={{ fontSize:8.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#C0C4CC', flexShrink:0 }}>Réel&nbsp;→</span>
          <button onClick={() => setFilterPunch(v => !v)}
            style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:4,
              background: filterPunch ? '#DBEAFE' : '#EFF6FF', border:`1.5px solid ${filterPunch ? '#60A5FA' : '#BFDBFE'}`,
              fontSize:10, fontWeight:600, color: filterPunch ? '#1D4ED8' : '#3B82F6', cursor:'pointer',
              boxShadow: filterPunch ? '0 0 0 1.5px #60A5FA44' : 'none', transition:'all .1s' }}>
            <span style={{ width:8, height:8, borderRadius:2, background:'#60A5FA', display:'inline-block', flexShrink:0 }}/>
            Punch (temps réel)
          </button>
          {/* Chemin critique info */}
          {showCritical && criticalIds.size > 0 && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#EF4444', fontWeight:700 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#EF4444', display:'inline-block' }}/>
              {criticalIds.size} phase{criticalIds.size>1?'s':''} critique{criticalIds.size>1?'s':''}
            </div>
          )}
        </div>
      </div>

      {/* ── Gantt scrollable ── */}
      <div ref={scrollRef} data-gantt-scroll style={{ overflowX:'auto', width:'100%', maxWidth:'100%' }}>
        <div ref={contentRef} style={{ minWidth: totalMinW, position:'relative' }}>

          {/* Header */}
          <div style={{ display:'flex', borderBottom:'2px solid #EEF0F2', background:'#fff', position:'sticky', top:0, zIndex:5 }}>
            {/* Checkbox select-all */}
            <div style={{ width:CHECK_W, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', ...stickyH(0) }}>
              <input type="checkbox" checked={filteredPhases.length>0 && filteredPhases.every(p=>selectedIds.has(p.id))}
                onChange={ev => ev.target.checked ? selectAll() : clearSelection()}
                style={{ width:13, height:13, cursor:'pointer', accentColor:BRAND }}/>
            </div>
            {/* Phase — pin individuel (sticky/non-sticky) */}
            <div style={{ width:LABEL_W+20, flexShrink:0, background:'#fff', padding:'5px 6px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:2, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: hasFilter('name') ? BRAND : '#9CA3AF', ...stickyH(CHECK_W, 'phase') }}>
              <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>Phase {hasFilter('name') && <span style={{ fontSize:8, color:BRAND }}>●</span>}</span>
              <button onClick={() => togglePin('phase')} title={pinned('phase') ? 'Désépingler Phase' : 'Épingler Phase'}
                style={{ flexShrink:0, background:'transparent', border:'none', cursor:'pointer', color: pinned('phase') ? BRAND : '#D1D5DB', padding:'1px', borderRadius:3, display:'flex', alignItems:'center', lineHeight:1 }}>
                <Pin size={8}/>
              </button>
            </div>
            {/* Colonnes optionnelles — pin=sticky, ×=masquer, poignée resize */}
            {visibleOptCols.map(cd => {
              const isLast = cd === visibleOptCols[visibleOptCols.length - 1];
              const hasF = cd.key === 'start' ? hasFilter('start_date') : cd.key === 'assigned' ? (hasFilter('assigned')||filters.assigneeStatus.size>0) : false;
              return (
                <div key={cd.key} data-opt-col={cd.key} style={{ width:cd.w, flexShrink:0, borderLeft:'1px solid #F0F1F3', background:'#fff', padding:'5px 6px', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color: hasF ? BRAND : '#9CA3AF', display:'flex', alignItems:'center', justifyContent:'space-between', gap:2, boxShadow: isLast ? '3px 0 6px rgba(0,0,0,.06)' : 'none', position:'relative', ...stickyH(colLeftMap[cd.key], cd.key) }}>
                  <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                    {cd.label}
                    {hasF && <span style={{ fontSize:8, color:BRAND, marginLeft:2 }}>●</span>}
                  </span>
                  <button onClick={() => toggleColPin(cd.key)} title={`Masquer ${cd.label}`}
                    style={{ background:'transparent', border:'none', cursor:'pointer', color: BRAND, padding:'1px', borderRadius:3, display:'flex', alignItems:'center', lineHeight:1, flexShrink:0 }}>
                    <Pin size={8}/>
                  </button>
                  {/* Poignée de redimensionnement */}
                  <div onMouseDown={e => startColResize(cd.key, cd.w, e)}
                    style={{ position:'absolute', right:0, top:0, bottom:0, width:5, cursor:'col-resize', background:'transparent', zIndex:10 }}/>
                </div>
              );
            })}
            {/* ── Colonnes dépinées — GAUCHE du Gantt (non-sticky, scroll gauche pour voir) ── */}
            {rightOptCols.map(cd => (
              <div key={`rh-${cd.key}`} data-right-col={cd.key} style={{ width:cd.w, flexShrink:0, borderLeft:'1px solid #E9EAEC', background:'#F5F6F7', padding:'5px 6px', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#BBBFC8', display:'flex', alignItems:'center', justifyContent:'space-between', gap:2, position:'relative' }}>
                <span style={{ overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{cd.label}</span>
                <button onClick={() => toggleColPin(cd.key)} title={`Ramener ${cd.label} à gauche`}
                  style={{ background:'transparent', border:'none', cursor:'pointer', color:'#D1D5DB', padding:'1px', borderRadius:3, display:'flex', alignItems:'center', lineHeight:1, flexShrink:0 }}>
                  <Pin size={8}/>
                </button>
              </div>
            ))}
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
          {/* Dependency arrows SVG — positioned at start of timeline, coords relative to timeline */}
          {showArrows && Object.keys(deps).length > 0 && (() => {
            const rowH = 44;
            const barCY = 19;  // matches dot barMidY (left/right dots vertical center)
            const barTY = 2;   // matches mid-top green dot center
            const barBY = 36;  // matches mid-bottom green dot center

            // coords are relative to the timeline start (NOT the full content div)
            // dot radius and offsets match the actual connection point positions
            // Anchor on the actual bar EDGES (not dot centers) so arrows touch the bar cleanly
            const getAnchor = (bar, pt, idx) => {
              const mx = bar.left + bar.width / 2;
              switch(pt) {
                case 'left':       return { x: bar.left,             y: idx * rowH + barCY };
                case 'right':      return { x: bar.left + bar.width, y: idx * rowH + barCY };
                case 'mid-top':    return { x: mx, y: idx * rowH + barTY };
                case 'mid-bottom': return { x: mx, y: idx * rowH + barBY };
                default:           return { x: bar.left + bar.width, y: idx * rowH + barCY };
              }
            };

            const makeArrow = (x, y, toPt) => {
              const sz = 6;
              if (toPt === 'mid-top')    return `${x},${y} ${x-sz/2},${y-sz} ${x+sz/2},${y-sz}`;
              if (toPt === 'mid-bottom') return `${x},${y} ${x-sz/2},${y+sz} ${x+sz/2},${y+sz}`;
              if (toPt === 'left')       return `${x},${y} ${x+sz},${y-sz/2} ${x+sz},${y+sz/2}`;
              return                            `${x},${y} ${x-sz},${y-sz/2} ${x-sz},${y+sz/2}`;
            };

            const TYPE_COLOR = { FS: BRAND, SS: '#10B981', FF: '#F59E0B', SF: '#8B5CF6', PAR: '#6366F1' };
            const TYPE_DASH  = { FS: '4 3', SS: '3 3', FF: '6 2 2 2', SF: '2 4', PAR: '1 0' };

            return (
              // SVG position is MEASURED (arrowBox) from the real gantt cell — robust to columns/pins/scroll/header
              <svg style={{ position:'absolute', top: arrowBox.top, left: arrowBox.left, width: ganttW, height:filteredPhases.length * rowH, pointerEvents:'none', zIndex:4, overflow:'visible' }}>
                {Object.entries(deps).map(([succId, depVal]) => {
                  const predId  = typeof depVal === 'object' ? depVal.pred : String(depVal);
                  const depType = typeof depVal === 'object' ? (depVal.type || 'FS') : 'FS';
                  const fromPt = typeof depVal === 'object' && depVal.fromPt ? depVal.fromPt :
                                 (depType === 'SS' ? 'left' : 'right');
                  const toPt   = typeof depVal === 'object' && depVal.toPt   ? depVal.toPt   :
                                 (depType === 'FF' ? 'right' : depType === 'SS' ? 'left' : 'left');

                  const predIdx = filteredPhases.findIndex(p => String(p.id) === String(predId));
                  const succIdx = filteredPhases.findIndex(p => String(p.id) === String(succId));
                  if (predIdx < 0 || succIdx < 0) return null;
                  const pb = getBarBounds(filteredPhases[predIdx]);
                  const sb = getBarBounds(filteredPhases[succIdx]);

                  const a1 = getAnchor(pb, fromPt, predIdx);
                  const a2 = getAnchor(sb, toPt,   succIdx);

                  let pathD;
                  if (fromPt.startsWith('mid') || toPt.startsWith('mid')) {
                    const midX = (a1.x + a2.x) / 2;
                    pathD = `M${a1.x},${a1.y} C${fromPt.startsWith('mid')?a1.x:midX},${a1.y} ${toPt.startsWith('mid')?a2.x:midX},${a2.y} ${a2.x},${a2.y}`;
                  } else {
                    const cx = Math.max(a1.x + 20, Math.min(a2.x - 20, (a1.x + a2.x) / 2));
                    pathD = `M${a1.x},${a1.y} C${cx},${a1.y} ${cx},${a2.y} ${a2.x},${a2.y}`;
                  }

                  const col   = TYPE_COLOR[depType] || BRAND;
                  const dash  = TYPE_DASH[depType]  || '4 3';
                  const midX  = (a1.x + a2.x) / 2;
                  const midY  = (a1.y + a2.y) / 2;

                  const depKey = `${predId}-${succId}`;
                  const isHov = hoveredDepKey === depKey;
                  const isLongPressed = longPressDepKey === depKey;

                  const startLongPress = () => {
                    longPressDepTimer.current = setTimeout(() => setLongPressDepKey(depKey), 500);
                  };
                  const cancelLongPressDep = () => {
                    clearTimeout(longPressDepTimer.current);
                    longPressDepTimer.current = null;
                  };

                  return (
                    <g key={`dep-${depKey}`}
                      onMouseEnter={() => setHoveredDepKey(depKey)}
                      onMouseLeave={() => { setHoveredDepKey(null); cancelLongPressDep(); }}
                      onMouseDown={startLongPress}
                      onMouseUp={cancelLongPressDep}
                      style={{ cursor: isLongPressed ? 'pointer' : 'default', pointerEvents:'visiblePainted' }}>
                      {/* Invisible fat hit area */}
                      <path d={pathD} fill="none" stroke="transparent" strokeWidth={14}/>
                      <path d={pathD} fill="none" stroke={col} strokeWidth={isHov ? 2.5 : 1.5} strokeDasharray={dash} opacity={isHov ? 1 : 0.7}/>
                      <polygon points={makeArrow(a2.x, a2.y, toPt)} fill={col} opacity={isHov ? 1 : 0.8}/>
                      <text x={midX} y={midY-4} textAnchor="middle" fill={col} fontSize={8} fontWeight={800} opacity={0.85}>{depType}</text>
                      {/* Scissors — appear after long press (hold ~0.5s) */}
                      {isLongPressed && (
                        <g onClick={() => { deleteDep(succId); setLongPressDepKey(null); }} style={{ cursor:'pointer' }}
                          transform={`translate(${midX - 14}, ${midY - 13})`}>
                          <rect x={0} y={0} width={28} height={18} rx={5} fill={col} opacity={0.97}/>
                          <text x={14} y={13} textAnchor="middle" fontSize={13} fill="#fff">✂</text>
                        </g>
                      )}
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
            const isCritical = criticalIds.has(ph.id);
            const isDepTarget = depDrag && depDrag.fromPhId !== ph.id;
            const rowBg = isSelected ? '#FFF8F5' : isDragOver ? '#FFF3EE' : isEven ? '#FBFCFD' : '#fff';

            return (
              <div key={ph.id} data-phase-id={ph.id}
                draggable={!hasSel && !showArrows}
                onDragStart={ev => { if (!barDrag && !resize && !hasSel) onRowDragStart(ev, i); }}
                onDragOver={ev => onRowDragOver(ev, i)} onDrop={ev => onRowDrop(ev, i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                style={{
                  display:'flex', alignItems:'center', minHeight:42,
                  background: rowBg,
                  borderTop: isDragOver ? `2px solid ${BRAND}` : isSelected ? `2px solid ${BRAND_BORDER}` : '2px solid transparent',
                  marginBottom:2, opacity: dragIdx===i ? 0.35 : 1, transition:'opacity .15s',
                  cursor: 'default',
                }}>
                {/* Checkbox column */}
                <div style={{ width:CHECK_W, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:rowBg, alignSelf:'stretch', ...stickyC(0) }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(ph.id)}
                    style={{ width:13, height:13, cursor:'pointer', accentColor:BRAND }}/>
                </div>
                {/* Phase section — conditionally sticky (drag handle + name) */}
                <div style={{ width:LABEL_W+20, flexShrink:0, display:'flex', alignItems:'center', background:rowBg, borderLeft:`3px solid ${borderColor}`, alignSelf:'stretch', ...stickyC(CHECK_W) }}>
                  {/* Drag handle — réordonnement uniquement (en mode Dépendance, les points sur les barres sont utilisés) */}
                  <div
                    style={{ width:16, flexShrink:0, display:'flex', flexDirection:'column', gap:2.5, alignItems:'center',
                      cursor: hasSel || showArrows ? 'default' : 'grab',
                      opacity: hasSel || showArrows ? 0.05 : .2,
                      padding:'0 2px',
                    }}>
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
                          style={{fontSize:12,fontWeight:700,color:'#15171C',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',cursor:'text',padding:'1px 2px',borderRadius:3, display:'flex', alignItems:'center', gap:4}}>
                          {ph.name}
                          {isCritical && <span title="Chemin critique" style={{flexShrink:0,width:5,height:5,borderRadius:'50%',background:'#EF4444',display:'inline-block'}}/>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Colonnes optionnelles — rendues dynamiquement selon visibleOptCols */}
                {visibleOptCols.map(cd => {
                  const isLastOptCol = cd === visibleOptCols[visibleOptCols.length - 1];
                  const cellBase = { width:cd.w, flexShrink:0, padding:'0 2px', borderLeft:'1px solid #F0F1F3', alignSelf:'stretch', display:'flex', alignItems:'center', background:rowBg, boxShadow: isLastOptCol && pinned(cd.key) ? '3px 0 6px rgba(0,0,0,.04)' : 'none' };
                  if (cd.key === 'start') return (
                    <div key="start" data-opt-col="start" style={{ ...cellBase, position:'relative', ...stickyC(colLeftMap['start'], 'start') }}>
                      {editCell?.id===ph.id && editCell?.field==='datetime' ? (
                        <input type="datetime-local" autoFocus
                          defaultValue={ph.start_date ? `${ph.start_date.slice(0,10)}T${ph.start_time||'08:00'}` : ''}
                          onBlur={ev => { if (ev.target.value) { const [d,t]=ev.target.value.split('T'); onUpdatePhase?.(ph.id,{start_date:d,start_time:t||'08:00'}); } setEditCell(null); }}
                          onKeyDown={ev => ev.key==='Escape' && setEditCell(null)}
                          style={{ width:'100%', fontSize:11, border:`1.5px solid ${BRAND}`, borderRadius:6, padding:'3px 5px', outline:'none', background:'#FFF8F5' }}/>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                          <button onClick={() => setEditCell({id:ph.id,field:'datetime'})}
                            style={{ flex:1, textAlign:'left', fontSize:11, color:ph.start_date?'#374151':'#C1C6CE', background:'transparent', border:'none', cursor:'pointer', padding:'3px 4px 3px 6px', borderRadius:5, fontFamily:'inherit', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {ph.start_date ? `${new Date(ph.start_date.slice(0,10)+'T00:00').toLocaleDateString('fr-CA',{day:'numeric',month:'short'})} ${ph.start_time||'08:00'}` : '— date'}
                          </button>
                          <button onClick={ev => { ev.stopPropagation(); const rect=ev.currentTarget.getBoundingClientRect(); setRecurrenceEdit(recurrenceEdit?.id===ph.id?null:{id:ph.id,rect}); setRecurrenceForm({type:ph.recurrence_type||'weekly',count:ph.recurrence_count||2}); }}
                            title="Récurrence" style={{ flexShrink:0, padding:'3px', border:'none', background:'transparent', cursor:'pointer', borderRadius:3, display:'flex', alignItems:'center', opacity:ph.recurrence_type?1:0.35 }}>
                            <Repeat size={9} color={ph.recurrence_type?BRAND:'#9CA3AF'}/>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  if (cd.key === 'dur_prev') return (
                    <div key="dur_prev" data-opt-col="dur_prev" style={{ ...cellBase, ...stickyC(colLeftMap['dur_prev'], 'dur_prev') }}>
                      {editCell?.id===ph.id && editCell?.field==='duration' ? (
                        <input type="number" autoFocus min="0" step="0.5" defaultValue={ph.duration_hours??''}
                          onBlur={ev => { const val=ev.target.value===''?null:parseFloat(ev.target.value); onUpdatePhase?.(ph.id,{duration_hours:val}); setEditCell(null); }}
                          onKeyDown={ev => ev.key==='Escape' && setEditCell(null)}
                          style={{ width:'100%', fontSize:11, border:`1.5px solid ${BRAND}`, borderRadius:6, padding:'3px 5px', outline:'none', background:'#FFF8F5', textAlign:'right' }}/>
                      ) : (
                        <button onClick={() => setEditCell({id:ph.id,field:'duration'})}
                          style={{ width:'100%', textAlign:'right', fontSize:11, color:ph.duration_hours?'#374151':'#C1C6CE', background:'transparent', border:'none', cursor:'pointer', padding:'3px 6px', borderRadius:5, fontFamily:'inherit' }}>
                          {fmtDur(ph.duration_hours)}
                        </button>
                      )}
                    </div>
                  );
                  if (cd.key === 'dur_real') return (
                    <div key="dur_real" data-opt-col="dur_real" style={{ ...cellBase, ...stickyC(colLeftMap['dur_real'], 'dur_real'), justifyContent:'flex-end' }}>
                      <span style={{ fontSize:11, color: ph.logged_hours > 0 ? PUNCH_COLOR : '#D1D5DB', fontWeight:700, padding:'3px 6px', fontVariantNumeric:'tabular-nums' }}>
                        {ph.logged_hours > 0 ? fmtDur(Number(ph.logged_hours)) : '—'}
                      </span>
                    </div>
                  );
                  if (cd.key === 'assigned') return (
                    <div key="assigned" data-opt-col="assigned" style={{ ...cellBase, padding:'0 10px', ...stickyC(colLeftMap['assigned'], 'assigned') }}>
                      <AssigneeChip trade={matchedTrade}
                        assignedToName={ph.assigned_to_name||null}
                        onSelfAssign={currentUserName?()=>onSelfAssign?.(ph.id,currentUserName):undefined}
                        onUnassign={ph.assigned_to_name?()=>onSelfAssign?.(ph.id,null):undefined}/>
                    </div>
                  );
                  if (cd.key === 'dep_pred') {
                    return (
                      <div key="dep_pred" data-opt-col="dep_pred" style={{ ...cellBase, padding:'0 6px', ...stickyC(colLeftMap['dep_pred'],'dep_pred') }}>
                        {renderPredCell(ph, { display:'flex', alignItems:'center', width:'100%', overflow:'hidden' })}
                      </div>
                    );
                  }
                  if (cd.key === 'dep_succ') {
                    return (
                      <div key="dep_succ" data-opt-col="dep_succ" style={{ ...cellBase, padding:'0 6px', ...stickyC(colLeftMap['dep_succ'],'dep_succ') }}>
                        {renderSuccCell(ph, { display:'flex', alignItems:'center', width:'100%', overflow:'hidden' })}
                      </div>
                    );
                  }
                  return null;
                })}
                {/* ── Colonnes dépinées — GAUCHE du Gantt (grisées, non-sticky) ── */}
                {rightOptCols.map(cd => {
                  const rcBg = '#F5F6F7';
                  const rcBase = { width:cd.w, flexShrink:0, padding:'0 2px', borderLeft:'1px solid #E9EAEC', alignSelf:'stretch', display:'flex', alignItems:'center', background:rcBg };
                  if (cd.key === 'start') return (
                    <div key={`rc-start-${ph.id}`} data-opt-col="start" style={{ ...rcBase, position:'relative' }}>
                      {editCell?.id===ph.id && editCell?.field==='datetime' ? (
                        <input type="datetime-local" autoFocus
                          defaultValue={ph.start_date ? `${ph.start_date.slice(0,10)}T${ph.start_time||'08:00'}` : ''}
                          onBlur={ev => { if (ev.target.value) { const [d,t]=ev.target.value.split('T'); onUpdatePhase?.(ph.id,{start_date:d,start_time:t||'08:00'}); } setEditCell(null); }}
                          onKeyDown={ev => ev.key==='Escape' && setEditCell(null)}
                          style={{ width:'100%', fontSize:11, border:`1.5px solid ${BRAND}`, borderRadius:6, padding:'3px 5px', outline:'none', background:'#FFF8F5' }}/>
                      ) : (
                        <button onClick={() => setEditCell({id:ph.id,field:'datetime'})}
                          style={{ flex:1, textAlign:'left', fontSize:11, color:ph.start_date?'#374151':'#C1C6CE', background:'transparent', border:'none', cursor:'pointer', padding:'3px 4px 3px 6px', borderRadius:5, fontFamily:'inherit', minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {ph.start_date ? `${new Date(ph.start_date.slice(0,10)+'T00:00').toLocaleDateString('fr-CA',{day:'numeric',month:'short'})} ${ph.start_time||'08:00'}` : '— date'}
                        </button>
                      )}
                    </div>
                  );
                  if (cd.key === 'dur_prev') return (
                    <div key={`rc-dur_prev-${ph.id}`} style={rcBase}>
                      {editCell?.id===ph.id && editCell?.field==='duration' ? (
                        <input type="number" autoFocus min="0" step="0.5" defaultValue={ph.duration_hours??''}
                          onBlur={ev => { const val=ev.target.value===''?null:parseFloat(ev.target.value); onUpdatePhase?.(ph.id,{duration_hours:val}); setEditCell(null); }}
                          onKeyDown={ev => ev.key==='Escape' && setEditCell(null)}
                          style={{ width:'100%', fontSize:11, border:`1.5px solid ${BRAND}`, borderRadius:6, padding:'3px 5px', outline:'none', background:'#FFF8F5', textAlign:'right' }}/>
                      ) : (
                        <button onClick={() => setEditCell({id:ph.id,field:'duration'})}
                          style={{ width:'100%', textAlign:'right', fontSize:11, color:ph.duration_hours?'#374151':'#C1C6CE', background:'transparent', border:'none', cursor:'pointer', padding:'3px 6px', borderRadius:5, fontFamily:'inherit' }}>
                          {fmtDur(ph.duration_hours)}
                        </button>
                      )}
                    </div>
                  );
                  if (cd.key === 'dur_real') return (
                    <div key={`rc-dur_real-${ph.id}`} style={{ ...rcBase, justifyContent:'flex-end' }}>
                      <span style={{ fontSize:11, color: ph.logged_hours > 0 ? PUNCH_COLOR : '#D1D5DB', fontWeight:700, padding:'3px 6px', fontVariantNumeric:'tabular-nums' }}>
                        {ph.logged_hours > 0 ? fmtDur(Number(ph.logged_hours)) : '—'}
                      </span>
                    </div>
                  );
                  if (cd.key === 'assigned') return (
                    <div key={`rc-assigned-${ph.id}`} style={{ ...rcBase, padding:'0 10px' }}>
                      <AssigneeChip trade={matchedTrade}
                        assignedToName={ph.assigned_to_name||null}
                        onSelfAssign={currentUserName?()=>onSelfAssign?.(ph.id,currentUserName):undefined}
                        onUnassign={ph.assigned_to_name?()=>onSelfAssign?.(ph.id,null):undefined}/>
                    </div>
                  );
                  // Colonne Prédécesseur — phase dont cette phase dépend
                  if (cd.key === 'dep_pred') {
                    return (
                      <div key={`rc-dep_pred-${ph.id}`} style={{ ...rcBase, padding:'0 6px', gap:4 }}>
                        {renderPredCell(ph, { display:'flex', alignItems:'center', width:'100%', overflow:'hidden' })}
                      </div>
                    );
                  }
                  // Colonne Successeur — phases qui dépendent de cette phase
                  if (cd.key === 'dep_succ') {
                    return (
                      <div key={`rc-dep_succ-${ph.id}`} style={{ ...rcBase, padding:'0 6px', gap:3 }}>
                        {renderSuccCell(ph, { display:'flex', alignItems:'center', width:'100%', overflow:'hidden' })}
                      </div>
                    );
                  }
                  return null;
                })}
                {/* Gantt bar area — fixed pixel width, matches header */}
                <div ref={i === 0 ? firstGanttCellRef : null} style={{width:ganttW,flexShrink:0,position:'relative',height:38,background:'#F8F9FA',borderLeft:'1px solid #ECEEF0'}}>
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
                    onMouseEnter={ev => { if (!barDrag && !resize && !showArrows) setTooltip({ ph, trade: matchedTrade, x: ev.clientX, y: ev.clientY }); }}
                    onMouseMove={ev => { if (tooltip && !barDrag && !resize && !showArrows) setTooltip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : null); }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      position:'absolute', top:5, bottom:5,
                      left: left, width: width, minWidth:8,
                      borderRadius:99, background:barColor, color:'#fff',
                      display:'flex', alignItems:'center', padding:'0 12px 0 10px',
                      cursor: isBarDrag_ ? 'grabbing' : 'grab',
                      whiteSpace:'nowrap', overflow:'hidden', zIndex:3, userSelect:'none',
                      boxShadow: isBarDrag_ ? '0 4px 16px rgba(0,0,0,.28)' : '0 1px 3px rgba(0,0,0,.12)',
                      outline: isCritical ? '1.5px solid #EF4444' : 'none',
                      outlineOffset: 1,
                      transition: (isBarDrag_||isResize_) ? 'none' : 'box-shadow .15s',
                    }}>
                    {/* Punch / réel overlay — couleur distincte du prévu */}
                    {progress>0&&<div style={{position:'absolute',top:0,bottom:0,left:0,width:`${progress}%`,borderRadius:99,background:PUNCH_COLOR,opacity:.72,zIndex:0,pointerEvents:'none'}}/>}
                    <span style={{fontSize:10.5,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',position:'relative',zIndex:1,flexShrink:1,minWidth:0,
                      color: (ph.status==='not_started') ? '#374151' : '#fff'}}>
                      {ph.trade_name||ph.name}
                    </span>
                    {/* Badge récurrence 1/N */}
                    {ph.recurrence_type && (ph.recurrence_count||1) > 1 && (
                      <span style={{fontSize:8.5,fontWeight:900,marginLeft:4,opacity:.95,position:'relative',zIndex:1,flexShrink:0,
                        background:'rgba(0,0,0,.2)',borderRadius:3,padding:'1px 3px',
                        color: (ph.status==='not_started') ? '#374151' : '#fff'}}>
                        1/{ph.recurrence_count}
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
                  {/* ── Points de connexion dépendance (mode Dépendance uniquement) ── */}
                  {showArrows && (() => {
                    const DOT = 14;
                    const R = DOT / 2;
                    // Bar center Y within the 38px container (bar is top:5 bottom:5 → center at 19)
                    const barMidY = 19;
                    // Place left/right dots clearly OUTSIDE bar pill, centered on bar vertical midpoint
                    // Ensure they don't overlap: if bar too narrow, keep at least 4px gap
                    const lx = left - R - 2;          // left dot: fully outside left edge
                    const rx = left + Math.max(width, DOT + 8) + 2; // right dot: fully outside right edge
                    const mx = left + width / 2;       // mid top/bottom: horizontally centered

                    const ptBase = (bg, l, t) => ({
                      position:'absolute', width:DOT, height:DOT, borderRadius:'50%',
                      border:'2.5px solid #fff', cursor:'crosshair', zIndex:12,
                      boxShadow:'0 2px 8px rgba(0,0,0,.4)', pointerEvents:'all',
                      background: bg, left: l - R, top: t - R,
                    });
                    const startDrag = (e, pt) => {
                      e.stopPropagation(); e.preventDefault();
                      // Release implicit pointer capture so pointerEnter fires on destination dots
                      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                      const state = { fromPhId: ph.id, fromIdx: i, fromPt: pt, curX: e.clientX, curY: e.clientY, startX: e.clientX, startY: e.clientY };
                      depDragRef.current = state; setDepDrag(state);
                    };
                    const PT_LABELS = {
                      left:       'DÉBUT de « '+(ph.trade_name||ph.name)+' »\n\nGlissez vers une autre barre :\n→ son DÉBUT = elles démarrent ensemble (SS)\n→ sa FIN = elle finit quand celle-ci démarre (SF)',
                      right:      'FIN de « '+(ph.trade_name||ph.name)+' »\n\nGlissez vers une autre barre :\n→ son DÉBUT = l\'autre démarre à cette fin (FS)\n→ sa FIN = elles finissent ensemble (FF)',
                      'mid-top':  'PARALLÈLE — « '+(ph.trade_name||ph.name)+' »\n\nGlissez vers une autre barre pour\nles exécuter en même temps',
                      'mid-bottom':'PARALLÈLE — « '+(ph.trade_name||ph.name)+' »\n\nGlissez vers une autre barre pour\nles exécuter en même temps',
                    };
                    return (
                      <>
                        {/* Début — gauche (bleu) — toujours à gauche du pill */}
                        <div data-dep-pt="left" data-phase-id={ph.id}
                          onPointerDown={e => startDrag(e, 'left')}
                          onPointerEnter={() => { if (depDragRef.current) depHoverRef.current = { phId: ph.id, pt: 'left' }; }}
                          onPointerLeave={() => { if (depHoverRef.current?.phId === ph.id && depHoverRef.current?.pt === 'left') depHoverRef.current = null; }}
                          onMouseEnter={ev => { if (!depDrag) setPtTooltip({ pt: PT_LABELS.left, x: ev.clientX, y: ev.clientY }); }}
                          onMouseLeave={() => setPtTooltip(null)}
                          style={ptBase('#3B82F6', lx, barMidY)}/>
                        {/* Fin — droite (orange) — toujours à droite du pill */}
                        <div data-dep-pt="right" data-phase-id={ph.id}
                          onPointerDown={e => startDrag(e, 'right')}
                          onPointerEnter={() => { if (depDragRef.current) depHoverRef.current = { phId: ph.id, pt: 'right' }; }}
                          onPointerLeave={() => { if (depHoverRef.current?.phId === ph.id && depHoverRef.current?.pt === 'right') depHoverRef.current = null; }}
                          onMouseEnter={ev => { if (!depDrag) setPtTooltip({ pt: PT_LABELS.right, x: ev.clientX, y: ev.clientY }); }}
                          onMouseLeave={() => setPtTooltip(null)}
                          style={ptBase('#E8794E', rx, barMidY)}/>
                        {/* Parallèle haut (vert) */}
                        <div data-dep-pt="mid-top" data-phase-id={ph.id}
                          onPointerDown={e => startDrag(e, 'mid-top')}
                          onPointerEnter={() => { if (depDragRef.current) depHoverRef.current = { phId: ph.id, pt: 'mid-top' }; }}
                          onPointerLeave={() => { if (depHoverRef.current?.phId === ph.id && depHoverRef.current?.pt === 'mid-top') depHoverRef.current = null; }}
                          onMouseEnter={ev => { if (!depDrag) setPtTooltip({ pt: PT_LABELS['mid-top'], x: ev.clientX, y: ev.clientY }); }}
                          onMouseLeave={() => setPtTooltip(null)}
                          style={ptBase('#10B981', mx, 2)}/>
                        {/* Parallèle bas (vert) */}
                        <div data-dep-pt="mid-bottom" data-phase-id={ph.id}
                          onPointerDown={e => startDrag(e, 'mid-bottom')}
                          onPointerEnter={() => { if (depDragRef.current) depHoverRef.current = { phId: ph.id, pt: 'mid-bottom' }; }}
                          onPointerLeave={() => { if (depHoverRef.current?.phId === ph.id && depHoverRef.current?.pt === 'mid-bottom') depHoverRef.current = null; }}
                          onMouseEnter={ev => { if (!depDrag) setPtTooltip({ pt: PT_LABELS['mid-bottom'], x: ev.clientX, y: ev.clientY }); }}
                          onMouseLeave={() => setPtTooltip(null)}
                          style={ptBase('#10B981', mx, 36)}/>
                      </>
                    );
                  })()}
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
        </div>
      </div>

      {/* ── + Ajouter une phase (sticky bas) ── */}
      <div style={{ position:'sticky', bottom:0, zIndex:12, background:'#fff', borderTop:'1px solid #F0F2F4', padding:'7px 16px', boxShadow:'0 -2px 8px rgba(0,0,0,.06)' }}>
        <button onClick={() => setAddingPhase(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:5, border:`1.5px dashed ${BRAND_BORDER}`, background:'transparent', color:BRAND_DARK, fontSize:12, fontWeight:700, cursor:'pointer' }}>
          <Plus size={12}/> Ajouter une phase
        </button>
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
                  <Repeat size={10} style={{display:'inline',verticalAlign:'middle',marginRight:4}}/>{REC_LBL[tph.recurrence_type]||tph.recurrence_type} — {tph._recLabel ? '' : '1/'}{tph.recurrence_count||1} occurrence{(tph.recurrence_count||1)>1?'s':''}
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
              {(() => {
                const tTrade = tooltip.trade;
                const tName = tph.assigned_to_name || tTrade?.subcontractor_name || tTrade?.chosen_subcontractor_name || null;
                const tSt = tph.assigned_to_name ? ASSIGNEE_STATUS.confirmed : (ASSIGNEE_STATUS[tTrade?.status] || ASSIGNEE_STATUS.to_find);
                return (
                  <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      background: tSt.bg, border:`1.5px solid ${tSt.dot}`,
                      borderRadius:99, padding:'2px 7px 2px 5px', flexShrink:0,
                    }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:tSt.dot, flexShrink:0 }}/>
                      <span style={{ fontSize:11, fontWeight:700, color: tName ? '#374151' : tSt.text }}>
                        {tName || tSt.label}
                      </span>
                    </span>
                  </div>
                );
              })()}
              {/* Info chemin critique */}
              {criticalIds.has(tph.id) && !tph._recLabel && (() => {
                const durDays = Math.ceil((tph.duration_hours || 8) / 8);
                const directSucc = phases.filter(p => {
                  const pred = typeof deps[p.id] === 'object' ? deps[p.id]?.pred : deps[p.id];
                  return String(pred) === String(tph.id) && criticalIds.has(p.id);
                });
                return (
                  <div style={{ marginTop:6, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'6px 8px' }}>
                    <div style={{ fontSize:10, color:'#EF4444', fontWeight:800, display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#EF4444', flexShrink:0 }}/>
                      Chemin critique
                    </div>
                    <div style={{ fontSize:10, color:'#991B1B', lineHeight:1.5 }}>
                      <div>⏱ Durée : <strong>{durDays} jour{durDays>1?'s':''}</strong></div>
                      <div style={{ marginTop:2, color:'#DC2626' }}>
                        ⬆️ Repousser d'1 jour → <strong>+1 jour</strong> sur la livraison finale
                      </div>
                      <div style={{ marginTop:2, color:'#16A34A' }}>
                        ⬇️ Devancer → gain seulement si les phases précédentes le permettent
                      </div>
                      {directSucc.length > 0 && (
                        <div style={{ marginTop:2, color:'#7F1D1D' }}>
                          🔗 Bloque : {directSucc.map(p=>p.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>);
          })()}
        </div>
      )}

      {/* ── Preview SVG ligne dep pendant drag ── */}
      {depDrag && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none' }}>
          <svg width="100%" height="100%">
            <defs>
              <marker id="dep-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#3B82F6"/>
              </marker>
            </defs>
            <line x1={depDrag.startX} y1={depDrag.startY} x2={depDrag.curX} y2={depDrag.curY}
              stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round"
              markerEnd="url(#dep-arrow)"/>
            <circle cx={depDrag.startX} cy={depDrag.startY} r={5} fill="#3B82F6" opacity={0.8}/>
          </svg>
        </div>
      )}

      {/* ── Tooltip point de connexion ── */}
      {ptTooltip && (
        <div style={{ position:'fixed', zIndex:10000, pointerEvents:'none',
          left: ptTooltip.x + 12, top: ptTooltip.y - 10,
          background:'#15171C', color:'#fff', borderRadius:8, padding:'8px 10px',
          fontSize:11, fontWeight:600, lineHeight:1.6, maxWidth:220,
          boxShadow:'0 4px 16px rgba(0,0,0,.3)', whiteSpace:'pre-line' }}>
          {ptTooltip.pt}
        </div>
      )}
    </div>
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
  const { pipeline: configPipeline, modules: configModules } = useConfigStore();
  const { prefs: uiPrefs, setPref: setUiPref } = useUiPrefs();
  const sectionPrefKey = `monflux-project-sections-${id}`;
  const [sectionExpanded, setSectionExpanded] = useState(() => {
    try {
      const raw = localStorage.getItem(sectionPrefKey);
      return raw ? { ...PROJECT_SECTION_DEFAULTS, ...JSON.parse(raw) } : PROJECT_SECTION_DEFAULTS;
    } catch {
      return PROJECT_SECTION_DEFAULTS;
    }
  });
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
  const [showFloPanel, setShowFloPanel] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(sectionPrefKey);
      setSectionExpanded(raw ? { ...PROJECT_SECTION_DEFAULTS, ...JSON.parse(raw) } : PROJECT_SECTION_DEFAULTS);
    } catch {
      setSectionExpanded(PROJECT_SECTION_DEFAULTS);
    }
  }, [sectionPrefKey]);
  const [floMergePending, setFloMergePending] = useState(null); // recos en attente de choix merge/reset
  const [autoAddingTrades, setAutoAddingTrades] = useState(false);
  const [tradeCertifs, setTradeCertifs] = useState(() => { try { return JSON.parse(localStorage.getItem(`monflux-trade-certifs-${id}`) || '{}'); } catch { return {}; } });
  const [tradeResourcesMap, setTradeResourcesMap] = useState(() => { try { return JSON.parse(localStorage.getItem(`monflux-trade-resources-${id}`) || '{}'); } catch { return {}; } });
  const [tradeConformite, setTradeConformite] = useState(() => { try { return JSON.parse(localStorage.getItem(`monflux-trade-conformite-${id}`) || '{}'); } catch { return {}; } });
  const [tradeResInput, setTradeResInput] = useState({});
  const [loadingFloPersonCheck, setLoadingFloPersonCheck] = useState({});
  const [tradePersonPanels, setTradePersonPanels] = useState({});
  const [tradePersonMsgs, setTradePersonMsgs] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(`monflux-trade-msgs-${id}`) || '{}');
      return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, { ...v, loading: false, poLoading: false }]));
    } catch { return {}; }
  });
  const [tradeStatusFilter, setTradeStatusFilter] = useState(null);
  const [openConformiteBadge, setOpenConformiteBadge] = useState(null);
  const [tradeTypeFilter, setTradeTypeFilter] = useState(null); // null | 'internal' | 'external'
  const [tradeDateFilter, setTradeDateFilter] = useState(''); // ISO date string — deadline <= date
  const [stickyNotes, setStickyNotes] = useState([]);
  const [stickyDraft, setStickyDraft] = useState(null); // { top, left, color, text } when creating
  const [stickyDragging, setStickyDragging] = useState(null); // { id, offsetX, offsetY }
  const stickyContainerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressPosRef = useRef(null);
  const stickyLoadedRef = useRef(false);
  const [tradePersonExpanded, setTradePersonExpanded] = useState({});
  const [tradePersonSelected, setTradePersonSelected] = useState(new Set());
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
  const [dbActivityLog, setDbActivityLog] = useState([]);
  // Batch J — rentabilité, corps de métiers, dépenses, aperçu documents
  const [profit, setProfit] = useState(null);
  const [subs, setSubs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeForm, setTradeForm] = useState({ trade: '', estimated_cost: '', chosen_subcontractor_id: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ type: 'supplier_invoice', description: '', amount: '', expense_date: '', po_number: '', supplier_invoice_number: '' });
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
  // Sections marquées "indisponibles" que l'utilisateur a forcé à afficher
  const [overriddenSections, setOverriddenSections] = useState(() => {
    try { const s = localStorage.getItem(`monflux-toc-override-${id}`); if (s) return JSON.parse(s); } catch {}
    return [];
  });
  const toggleSectionOverride = (sectionId) => {
    setOverriddenSections(prev => {
      const next = prev.includes(sectionId) ? prev.filter(x => x !== sectionId) : [...prev, sectionId];
      localStorage.setItem(`monflux-toc-override-${id}`, JSON.stringify(next));
      return next;
    });
  };
  const [dragSrcIdx, setDragSrcIdx] = useState(null);
  // B4 — Vente
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [quoteBuilderQuote, setQuoteBuilderQuote] = useState(null);
  const [quoteBuilderItems, setQuoteBuilderItems] = useState([]);
  const [quoteSaving, setQuoteSaving] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSelected, setQuoteSelected] = useState(new Set());
  const [quoteMarkup, setQuoteMarkup] = useState(() => Number(localStorage.getItem('monflux-quote-markup') || 0)); // synced to uiPrefs below
  const [showFloQuotePanel, setShowFloQuotePanel] = useState(false);
  const [floQuoteLoading, setFloQuoteLoading] = useState(false);
  const [floInspirationInput, setFloInspirationInput] = useState('');
  const [quoteNewRow, setQuoteNewRow] = useState({ material: {}, labor: {}, subcontractor: {}, other: {} });
  const [quoteCollapsed, setQuoteCollapsed] = useState({ material: false, labor: false, subcontractor: false, other: false });
  const [quoteMassMarkup, setQuoteMassMarkup] = useState('');
  const [quotePdfCols, setQuotePdfCols] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-quote-pdf-cols') || '{}'); } catch { return {}; }
  });
  const togglePdfCol = (col) => {
    setQuotePdfCols(prev => {
      const next = { ...prev, [col]: prev[col] === false ? true : false };
      localStorage.setItem('monflux-quote-pdf-cols', JSON.stringify(next));
      setUiPref('quote_pdf_cols', next);
      return next;
    });
  };
  const isPdfColOn = (col) => quotePdfCols[col] !== false;
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
  const [companyConfig, setCompanyConfig] = useState({});
  const [contractDrafts, setContractDrafts] = useState({});
  const [contractSavingId, setContractSavingId] = useState(null);
  const [contractEnrichingId, setContractEnrichingId] = useState(null);
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
  const [floContext, setFloContext] = useState('');
  // Facture inline
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ title: '', client_name: '', client_email: '', due_date: '' });
  const [newInvoiceItems, setNewInvoiceItems] = useState([{ description: '', qty: 1, unit_price: '' }]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  // Extra inline (demande de modification)
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraForm, setExtraForm] = useState({ title: '', description: '', amount: '', notes: '' });
  const [savingExtra, setSavingExtra] = useState(false);
  // Envoi facture courriel
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);
  const [invoiceSentId, setInvoiceSentId] = useState(null);
  // Statut facture
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [mediaForm, setMediaForm] = useState({ type: 'note', caption: '', photos: [], transcript: '' });
  const [analyzingMediaId, setAnalyzingMediaId] = useState(null);
  const [purchasePlan, setPurchasePlan] = useState(null);
  const [groupingPurchases, setGroupingPurchases] = useState(false);
  const [coImpact, setCoImpact] = useState({});   // { [coId]: impactObj }
  const [analyzingCoId, setAnalyzingCoId] = useState(null);
  const [aiNotice, setAiNotice] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [dismissedFloHeroAlerts, setDismissedFloHeroAlerts] = useState(new Set());
  const [floEmailModal, setFloEmailModal] = useState(null); // { subject, body } | null
  const [floEmailLoading, setFloEmailLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('s-ai');
  const [activeTab, setActiveTab] = useState('detail'); // 'detail' | 'memoire' | 'communication'
  const [proactiveTip, setProactiveTip] = useState(null);
  const [proactiveDismissedSections, setProactiveDismissedSections] = useState(new Set());
  const [allOperationalAlerts, setAllOperationalAlerts] = useState([]); // toutes les alertes calculées
  const [showManualPunch, setShowManualPunch] = useState(false);
  const [manualPunchForm, setManualPunchForm] = useState({ worker_name: '', work_date: new Date().toISOString().slice(0,10), hours: '', notes: '', trade: '' });
  const [ganttSnapshots, setGanttSnapshots] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`mf-gantt-snaps-${id}`) || '[]'); } catch { return []; }
  });
  const [showTopMenu, setShowTopMenu] = useState(false);
  const topMenuRef = useRef(null);
  const [portalCopyTarget, setPortalCopyTarget] = useState(null); // null | 'client' | 'supplier'
  const [statusPopup, setStatusPopup] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showPipelineEditor, setShowPipelineEditor] = useState(false);
  const [editPipeline, setEditPipeline] = useState(null); // copie locale pendant l'édition
  const [pipeEditDragSrc, setPipeEditDragSrc] = useState(null);
  const [estimTab, setEstimTab] = useState('voieB');
  const [showClientReply, setShowClientReply] = useState(false);
  const [clientReplyText, setClientReplyText] = useState('');
  // Descriptif de la demande — Vision
  const [visionInspirationInput, setVisionInspirationInput] = useState('');
  const [planAnalysis, setPlanAnalysis] = useState(null);
  const [planAnalysisLoading, setPlanAnalysisLoading] = useState(false);
  const [floGenPrompt, setFloGenPrompt] = useState('');
  const [floGenLoading, setFloGenLoading] = useState(false);
  const [generatedPreviews, setGeneratedPreviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`monflux-gen-previews-${id}`) || '[]'); } catch { return []; }
  });
  const planUploadRef = React.useRef(null);
  // Recherche de matériaux
  const [matSearchResults, setMatSearchResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`monflux-mat-results-${id}`) || '[]'); } catch { return []; }
  });
  const [matWishlist, setMatWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`monflux-mat-wishlist-${id}`) || '[]'); } catch { return []; }
  });
  const [matSearchLoading, setMatSearchLoading] = useState(false);
  const [matSearchQuery, setMatSearchQuery] = useState('');
  const [matFilter, setMatFilter] = useState('all'); // 'all' | 'wishlist'
  const [matSelected, setMatSelected] = useState(new Set());
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

  // Sync per-project prefs from field_assessment (DB) when project loads, falling back to localStorage
  useEffect(() => {
    if (!project || typeof project === 'string') return;
    const fa = project.field_assessment || {};
    if (fa.trade_certifs !== undefined)   setTradeCertifs(fa.trade_certifs);
    if (fa.trade_resources !== undefined) setTradeResourcesMap(fa.trade_resources);
    if (fa.trade_conformite !== undefined) setTradeConformite(fa.trade_conformite);
    if (fa.mat_wishlist !== undefined)    setMatWishlist(fa.mat_wishlist);
    if (fa.relances_count !== undefined)  setRelanceCount(Number(fa.relances_count));
    if (fa.relances_methods !== undefined) setRelanceMethods(fa.relances_methods);
    if (fa.relances_freq !== undefined)   setRelanceFrequency(Number(fa.relances_freq));
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync global prefs from DB when uiPrefs loads
  useEffect(() => {
    if (uiPrefs.quote_markup !== undefined) setQuoteMarkup(Number(uiPrefs.quote_markup));
    if (uiPrefs.quote_pdf_cols !== undefined) setQuotePdfCols(uiPrefs.quote_pdf_cols);
  }, [uiPrefs.quote_markup, uiPrefs.quote_pdf_cols]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: proj }, { data: ts }, { data: invs }, { data: qs }, { data: quits }, { data: cos }, { data: msgs }, { data: prof }, { data: subList }, { data: projQuotes }, { data: rfqList }, { data: contractList }, { data: orderList }, { data: mediaList }, { data: companyData }] = await Promise.all([
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
        companiesApi.get().catch(() => ({ data: { config: {} } })),
      ]);
      setProject(proj);
      setTimesheets(ts);
      setProjectInvoices(invs);
      setProjectQuotes(qs.filter(q => q.project_id === id));
      setQuittance(quits?.[0] || null);
      setChangeOrdersList(cos || []);
      setPortalMessages(msgs || []);
      activityLogApi.list(id).then(r => setDbActivityLog(r.data || [])).catch(() => {});
      setNotes(proj.notes || '');
      setProfit(prof);
      setSubs(subList || []);
      setLaborRate(prof?.actual?.cost_breakdown?.labor_cost_rate ? String(prof.actual.cost_breakdown.labor_cost_rate) : '');
      // B4 — quote builder, RFQs, contracts
      const firstQuote = projQuotes?.[0] || null;
      setQuoteBuilderQuote(firstQuote);
      setQuoteBuilderItems(normalizeQuoteItems(firstQuote?.items));
      setProjectRfqs(rfqList || []);
      setProjectContracts(contractList || []);
      setCompanyConfig(companyData?.config || {});
      setMaterialOrders(orderList || []);
      setMedia(mediaList || []);
      if (proj.flo_recommendations?.length) setAiRecommendations(proj.flo_recommendations);
      // pré-charge les impacts de demandes de modification déjà calculés
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
    } catch (err) {
      console.error('load project error:', err);
      setProject('error:' + (err?.response?.data?.error || err?.message || 'Erreur réseau'));
    } finally { setLoading(false); }
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
      window.dispatchEvent(new CustomEvent('monflux:project-updated', { detail: { id, ...payload } }));
    } catch {}
  };

  const saveAssessmentField = async (key, value) => {
    const next = { ...(project.field_assessment || {}), [key]: value };
    // Mirror date labels to actual date columns so calendar & Gantt pick them up
    const extra = {};
    if (key === 'start_label') { const d = parseFlexDate(value); if (d) extra.start_date = d; }
    if (key === 'end_label')   { const d = parseFlexDate(value); if (d) extra.end_date   = d; }
    try {
      await projectsApi.update(id, { field_assessment: next, ...extra });
      setProject(p => ({ ...p, field_assessment: next, ...extra }));
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
      window.dispatchEvent(new CustomEvent('monflux:project-updated', { detail: { id, [stateKey]: value } }));
    } catch {}
    // Si un contact est lié, mettre aussi à jour le contact
    if (project.client_id) {
      try { await contactsApi.update(project.client_id, { [field]: value || null }); } catch {}
    }
  };

  const salesLocked = quoteBuilderQuote?.status === 'signed' || (projectContracts || []).some((contract) => contract.status === 'signed');
  const toggleProjectSection = useCallback((sectionId) => {
    setSectionExpanded((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      try { localStorage.setItem(sectionPrefKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [sectionPrefKey]);
  const resolvedContractTemplateKey = guessProjectContractTemplateKey(project, companyConfig?.contract_templates);

  useEffect(() => {
    setContractDrafts((current) => {
      const next = { ...current };
      (projectContracts || []).forEach((contract) => {
        if (!next[contract.id]) {
          next[contract.id] = {
            title: contract.title || '',
            content: normalizeContractHtml(contract.content),
          };
        }
      });
      return next;
    });
  }, [projectContracts]);

  useEffect(() => {
    if (!quoteBuilderQuote?.id) return;
    if ((projectContracts || []).some((contract) => contract.quote_id === quoteBuilderQuote.id)) return;
    void generateContract();
  }, [quoteBuilderQuote?.id, projectContracts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [id]);

  // Reload when Flo modifies the project via tool use (update_project_field, add_sticky_note)
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('monflux:data-changed', handler);
    return () => window.removeEventListener('monflux:data-changed', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Alertes opérationnelles Flo ──────────────────────────────────────────
  // Alertes dynamiques basées sur les données réelles du projet (retard, équipe, matériaux, tickets)
  useEffect(() => {
    if (showAIChat || !project || typeof project === 'string') return;

    const todayMs = Date.now();
    const alerts = [];
    const phases = project.phases || [];

    // 1. Retard calendrier : Gantt dépasse date annoncée
    const phaseEndMs = phases.map(ph => ph.end_date ? new Date(ph.end_date.slice(0,10)+'T00:00').getTime() : null).filter(Boolean);
    const ganttEndMs = phaseEndMs.length > 0 ? Math.max(...phaseEndMs) : null;
    const announcedEndMs = project.end_date ? new Date(project.end_date.slice(0,10)+'T00:00').getTime() : null;
    if (ganttEndMs && announcedEndMs && ganttEndMs > announcedEndMs) {
      const slip = Math.round((ganttEndMs - announcedEndMs) / 86400000);
      alerts.push({
        id: 'delay',
        type: 'delay',
        priority: 1,
        title: `Retard de ${slip} jour${slip > 1 ? 's' : ''}`,
        text: `La fin réelle dans le Gantt (${new Date(ganttEndMs).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}) dépasse la date annoncée au client (${new Date(announcedEndMs).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}). Flo peut envoyer un courriel.`,
        sections: ['s-hero', 's-phases'],
      });
    }

    // 2. Ressources manquantes dans les 30 prochains jours
    const phasesNoResource = phases.filter(ph => {
      if (!ph.start_date) return false;
      const startMs = new Date(ph.start_date.slice(0,10)+'T00:00').getTime();
      if (startMs < todayMs || startMs > todayMs + 30 * 86400000) return false;
      const trade = ph.trade_name ? (project.trades||[]).find(t => t.trade?.toLowerCase() === ph.trade_name?.toLowerCase()) : null;
      return !ph.assigned_to_name && !trade?.chosen_subcontractor_id;
    });
    if (phasesNoResource.length > 0) {
      const names = phasesNoResource.slice(0,2).map(ph => `"${ph.name}"`).join(', ');
      alerts.push({
        id: 'team_gap',
        type: 'team',
        priority: 1,
        title: `${phasesNoResource.length} étape${phasesNoResource.length>1?'s':''} sans ressource`,
        text: `${names}${phasesNoResource.length > 2 ? ` +${phasesNoResource.length-2}` : ''} — aucun sous-traitant ni employé assigné dans les 30 prochains jours.`,
        sections: ['s-equipe', 's-phases'],
      });
    }

    // 3. Commandes de matériel en retard (date de livraison dépassée)
    const lateMat = materialOrders.filter(o => {
      if (!o.expected_date || ['received','cancelled'].includes(o.status)) return false;
      return new Date(o.expected_date.slice(0,10)+'T00:00').getTime() < todayMs;
    });
    if (lateMat.length > 0) {
      const suppliers = lateMat.slice(0,2).map(o => o.supplier).join(', ');
      alerts.push({
        id: 'material_late',
        type: 'material',
        priority: 1,
        title: `${lateMat.length} commande${lateMat.length>1?'s':''} en retard`,
        text: `${suppliers}${lateMat.length>2?` +${lateMat.length-2} autre${lateMat.length-2>1?'s':''}`:''} — la date de livraison prévue est dépassée.`,
        sections: ['s-materiaux'],
      });
    }

    // 4. Tickets de chantier — non-conformités détectées (IA ou mots-clés, 7 derniers jours)
    const recentMedia = media.filter(m => (todayMs - new Date(m.created_at).getTime()) < 7 * 86400000);
    const ncTickets = recentMedia.filter(m => {
      const hasAiNc = (m.ai_analysis?.non_conformities?.length || 0) > 0;
      const text = (m.caption || m.transcript || '').toLowerCase();
      return hasAiNc || /(non[- ]conforme|défaut|défectueux|manufacturier|mauvaise qualité|erreur de livraison|produit non)/.test(text);
    });
    if (ncTickets.length > 0) {
      alerts.push({
        id: 'nc_ticket',
        type: 'nonconform',
        priority: 2,
        title: `${ncTickets.length} ticket${ncTickets.length>1?'s':''} non-conformité`,
        text: `Un travailleur a signalé une non-conformité sur le chantier (produit, livraison ou exécution). Vérifie les notes et photos.`,
        sections: ['s-media'],
      });
    }

    // 5. Tickets de chantier — demandes de matériel dans les notes (7 derniers jours)
    const ncIds = new Set(ncTickets.map(m => m.id));
    const matRequestTickets = recentMedia.filter(m => {
      if (ncIds.has(m.id)) return false;
      const text = (m.caption || m.transcript || '').toLowerCase();
      return /(manque|commande|commander|besoin de matér|matériaux|livraison manquante|pas reçu)/.test(text);
    });
    if (matRequestTickets.length > 0) {
      alerts.push({
        id: 'mat_request',
        type: 'material_request',
        priority: 2,
        title: `${matRequestTickets.length} demande${matRequestTickets.length>1?'s':''} de matériel`,
        text: `Un travailleur a signalé un besoin de matériel dans les notes de chantier. Passe une commande avant le prochain blocage.`,
        sections: ['s-media', 's-materiaux'],
      });
    }

    // Trier par priorité, exposer toutes les alertes + choisir la plus urgente non-ignorée
    alerts.sort((a, b) => a.priority - b.priority);
    setAllOperationalAlerts(alerts);
    const pick = alerts.find(a => !proactiveDismissedSections.has(a.id));
    if (!pick) { setProactiveTip(null); return; }
    setProactiveTip({ ...pick, section: pick.id });
    const timer = setTimeout(() => setProactiveTip(null), 15000);
    return () => clearTimeout(timer);
  }, [project, materialOrders, media, showAIChat, proactiveDismissedSections]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers DB-sync pour données per-projet ──────────────────────────────
  // Chaque helper écrit en localStorage (réactivité immédiate) ET en field_assessment (DB).
  const saveTradeCertifs = useCallback((val) => {
    setTradeCertifs(val);
    localStorage.setItem(`monflux-trade-certifs-${id}`, JSON.stringify(val));
    saveAssessmentField('trade_certifs', val);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveTradeResources = useCallback((val) => {
    const previous = tradeResourcesMap || {};
    setTradeResourcesMap(val);
    localStorage.setItem(`monflux-trade-resources-${id}`, JSON.stringify(val));
    saveAssessmentField('trade_resources', val);
    const phases = project?.phases || [];
    if (!phases.length) return;
    const removedPhaseIds = [];
    const tradeNames = new Set([...Object.keys(previous), ...Object.keys(val || {})]);
    tradeNames.forEach((tradeName) => {
      const prevNames = new Set([
        ...parseTradePersons(previous?.[tradeName]?.internal).map((person) => normalizePersonName(person.name)),
        ...parseTradePersons(previous?.[tradeName]?.external).map((person) => normalizePersonName(person.name)),
      ].filter(Boolean));
      const nextNames = new Set([
        ...parseTradePersons(val?.[tradeName]?.internal).map((person) => normalizePersonName(person.name)),
        ...parseTradePersons(val?.[tradeName]?.external).map((person) => normalizePersonName(person.name)),
      ].filter(Boolean));
      const removedNames = [...prevNames].filter((name) => !nextNames.has(name));
      if (!removedNames.length) return;
      phases.forEach((phase) => {
        if (toTradeLabel(phase.trade_name).toLowerCase() !== String(tradeName || '').toLowerCase()) return;
        if (!removedNames.includes(normalizePersonName(phase.assigned_to_name))) return;
        removedPhaseIds.push(phase.id);
      });
    });
    if (removedPhaseIds.length) {
      setProject((current) => ({
        ...current,
        phases: (current.phases || []).map((phase) => (
          removedPhaseIds.includes(phase.id)
            ? { ...phase, assigned_to_name: null }
            : phase
        )),
      }));
      removedPhaseIds.forEach((phaseId) => {
        projectsApi.updatePhase(id, phaseId, { assigned_to_name: null }).catch((err) => console.error('sync remove assigned_to_name', err));
      });
    }
  }, [id, project?.phases, saveAssessmentField, tradeResourcesMap]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveTradeConformite = useCallback((val) => {
    setTradeConformite(val);
    localStorage.setItem(`monflux-trade-conformite-${id}`, JSON.stringify(val));
    saveAssessmentField('trade_conformite', val);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveMatWishlist = useCallback((val) => {
    setMatWishlist(val);
    localStorage.setItem(`monflux-mat-wishlist-${id}`, JSON.stringify(val));
    saveAssessmentField('mat_wishlist', val);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Descriptif : analyse plan d'architecte avec Flo ──
  const analyzePlan = async (file) => {
    setPlanAnalysisLoading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const token = localStorage.getItem('token');
      // Upload du fichier
      const fd = new FormData(); fd.append('file', file); fd.append('project_id', id); fd.append('type', 'plan');
      const upRes = await fetch(`${API_BASE}/media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!upRes.ok) throw new Error('Upload failed');
      const { url: planUrl } = await upRes.json();
      // Analyse via Flo
      const fa = project.field_assessment || {};
      const tradesCtx = (project.phases || []).map(p => p.trade_name || p.name).filter(Boolean).join(', ');
      const prompt = `Tu es Florence, IA MONFLUX experte en lecture de plans de construction au Québec.
Projet : ${project.description || project.name}
Adresse : ${project.address || 'N/A'}
Corps de métier impliqués : ${tradesCtx || 'à identifier depuis le plan'}

Analyse ce plan d'architecte et extrais TOUTES les informations utiles pour chaque spécialisation. Retourne un JSON STRICT :
{"general":{"superficie_totale":"","nb_pieces":"","style":"","contraintes_particulieres":""},"specialisations":[{"metier":"Charpenterie / Structure","items":[{"element":"","detail":"","quantite":"","notes_chantier":""}]},{"metier":"Plomberie","items":[...]},{"metier":"Électricité","items":[...]},{"metier":"HVAC","items":[...]},{"metier":"Finition","items":[...]},{"metier":"Autres","items":[...]}]}
Pour chaque item : element = nom de l'élément, detail = description précise, quantite = mesures si visible, notes_chantier = ce que le travailleur doit savoir.`;
      const chatRes = await fetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: planUrl } }, { type: 'text', text: prompt }] }] }),
      });
      if (!chatRes.ok) throw new Error('Chat failed');
      const reader = chatRes.body.getReader(); const dec = new TextDecoder(); let txt = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const ln of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const ev = JSON.parse(ln.slice(6)); if (ev.type === 'text') txt += ev.text; } catch {}
        }
      }
      const m = txt.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON');
      const analysis = JSON.parse(m[0]);
      setPlanAnalysis(analysis);
      // Sauvegarder dans field_assessment
      const nextFa = { ...fa, plan_analysis: analysis, plan_url: planUrl };
      await projectsApi.update(id, { field_assessment: nextFa });
      setProject(p => ({ ...p, field_assessment: nextFa }));
    } catch (e) { console.error('analyzePlan', e); } finally { setPlanAnalysisLoading(false); }
  };

  // ── Descriptif : générer prévisualisation IA via Pollinations ──
  const generatePreview = async (textOverride) => {
    const visionText = (textOverride || floGenPrompt || (project.field_assessment?.vision?.text) || '').trim();
    if (!visionText) return;
    setFloGenLoading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const token = localStorage.getItem('token');
      const fa = project.field_assessment || {};
      const visionCtx = [
        project.description && `Projet: ${project.description}`,
        fa.work_type && `Type: ${fa.work_type}`,
        fa.vision?.text && `Vision du client: ${fa.vision.text}`,
        (fa.vision?.inspirations || []).length && `Inspirations: ${fa.vision.inspirations.join(', ')}`,
      ].filter(Boolean).join('\n');
      // Flo génère un prompt d'image optimisé
      const promptRes = await fetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Tu es Florence, IA MONFLUX. Génère un prompt d'image en anglais (max 200 mots) pour prévisualiser le résultat final de ces travaux de rénovation. Le prompt doit décrire la pièce/espace rénovée de façon réaliste et photogénique (style photo de magazine immobilier).
Contexte:\n${visionCtx}\nDemande de l'utilisateur: ${visionText}\nRéponds UNIQUEMENT avec le prompt en anglais, rien d'autre.` }] }),
      });
      const reader = promptRes.body.getReader(); const dec2 = new TextDecoder(); let imgPrompt = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const ln of dec2.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const ev = JSON.parse(ln.slice(6)); if (ev.type === 'text') imgPrompt += ev.text; } catch {}
        }
      }
      imgPrompt = imgPrompt.trim();
      // Génération image via Pollinations.ai
      const seed = Math.floor(Date.now() / 1000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt + ', interior design, architectural rendering, photorealistic, 8k')}?width=1024&height=768&seed=${seed}&nologo=true`;
      const newPrev = { id: Date.now(), prompt: visionText, img_prompt: imgPrompt, url: imageUrl };
      const nextPreviews = [newPrev, ...generatedPreviews];
      setGeneratedPreviews(nextPreviews);
      localStorage.setItem(`monflux-gen-previews-${id}`, JSON.stringify(nextPreviews));
      setFloGenPrompt('');
    } catch (e) { console.error('generatePreview', e); } finally { setFloGenLoading(false); }
  };

  // ── Descriptif : inspiration vision ──
  const saveVisionField = async (patch) => {
    const fa = project.field_assessment || {};
    const nextVision = { ...(fa.vision || {}), ...patch };
    const nextFa = { ...fa, vision: nextVision };
    try {
      await projectsApi.update(id, { field_assessment: nextFa });
      setProject(p => ({ ...p, field_assessment: nextFa }));
    } catch {}
  };

  // ── Recherche de matériaux ──
  const fetchMaterialSearch = async (query) => {
    setMatSearchLoading(true);
    try {
      const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const token = localStorage.getItem('token');
      const fa = project.field_assessment || {};

      // Fournisseurs actifs depuis les settings
      const savedSuppliers = JSON.parse(localStorage.getItem('monflux-suppliers') || '[]');
      const supplierKeys = savedSuppliers.filter(s => s.active).map(s => {
        // Utilise scraperKey si présent (nouveau format), sinon détection par nom
        if (s.scraperKey) return s.scraperKey;
        const n = s.name.toLowerCase();
        if (n.includes('home depot')) return 'homedepot';
        if (n.includes('canadian tire')) return 'canadiantire';
        if (n.includes('rona')) return 'rona';
        if (n.includes('amazon')) return 'amazon';
        if (n.includes('aliexpress')) return 'aliexpress';
        if (n.includes('kijiji')) return 'kijiji';
        if (n.includes('facebook')) return 'facebook';
        return null;
      }).filter(Boolean);
      // Par défaut : Home Depot + Rona
      const suppliers = supplierKeys.length ? supplierKeys : ['homedepot', 'rona'];

      const res = await fetch(`${BASE}/scrape/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: query || `matériaux ${fa.work_type || 'rénovation'}`,
          suppliers,
          project_context: {
            description: project.description || project.name,
            field_assessment: fa,
            phases: project.phases || [],
          },
          max_per_supplier: 8,
        }),
      });

      if (!res.ok) throw new Error(`Scraper ${res.status}`);
      const result = await res.json();

      // result.items est déjà aplati avec { categorie, source_verified, source_type, ... }
      const items = result.items || [];
      setMatSearchResults(items);
      localStorage.setItem(`monflux-mat-results-${id}`, JSON.stringify(items));
      localStorage.setItem(`monflux-mat-warnings-${id}`, JSON.stringify(result.warnings || []));

      // Log les erreurs de scraping en console (pas bloquant)
      if (result.errors?.length) {
        console.warn('[Scraper] Erreurs partielles:', result.errors);
      }
    } catch (e) { console.error('fetchMaterialSearch', e); } finally { setMatSearchLoading(false); }
  };

  const toggleMatWishlist = (itemId) => {
    const next = matWishlist.includes(itemId)
      ? matWishlist.filter(x => x !== itemId)
      : [...matWishlist, itemId];
    saveMatWishlist(next);
  };

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
    if (data?.id && data?.assigned_to_name && data?.trade_name) {
      void syncAssignedPhaseWithTeam(data.id, data.assigned_to_name, data.trade_name);
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
    if (fields?.assigned_to_name) {
      const tradeName = fields.trade_name || project?.phases?.find((phase) => phase.id === phaseId)?.trade_name;
      await syncAssignedPhaseWithTeam(phaseId, fields.assigned_to_name, tradeName);
    } else if (fields?.trade_name) {
      const existingAssigned = project?.phases?.find((phase) => phase.id === phaseId)?.assigned_to_name;
      if (existingAssigned) {
        await syncAssignedPhaseWithTeam(phaseId, existingAssigned, fields.trade_name);
      }
    }
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

  // ── Sticky notes — chargement initial
  useEffect(() => {
    if (project?.id && !stickyLoadedRef.current) {
      stickyLoadedRef.current = true;
      setStickyNotes(project.field_assessment?.sticky_notes || []);
    }
  }, [project?.id]);

  const saveStickyNotes = async (notes) => {
    setStickyNotes(notes);
    const nextFa = { ...(project.field_assessment || {}), sticky_notes: notes };
    await projectsApi.update(id, { field_assessment: nextFa });
    setProject(p => ({ ...p, field_assessment: nextFa }));
  };

  const handleDetailMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, textarea, select, a, label, [role="button"], [contenteditable]')) return;
    const container = stickyContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    longPressPosRef.current = { top: e.clientY - rect.top, left: e.clientX - rect.left };
    longPressTimerRef.current = setTimeout(() => {
      setStickyDraft({ ...longPressPosRef.current, color: 'yellow', text: '' });
    }, 650);
  };

  const handleDetailMouseUp = () => clearTimeout(longPressTimerRef.current);

  const handleDetailMouseMove = (e) => {
    if (longPressTimerRef.current && longPressPosRef.current) {
      const dx = e.clientX - (longPressPosRef.current.left + (stickyContainerRef.current?.getBoundingClientRect().left || 0));
      const dy = e.clientY - (longPressPosRef.current.top + (stickyContainerRef.current?.getBoundingClientRect().top || 0) - window.scrollY);
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) clearTimeout(longPressTimerRef.current);
    }
    if (stickyDragging) {
      const container = stickyContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newTop = e.clientY - rect.top - stickyDragging.offsetY;
      const newLeft = e.clientX - rect.left - stickyDragging.offsetX;
      setStickyNotes(prev => prev.map(n =>
        n.id === stickyDragging.id ? { ...n, top: Math.max(0, newTop), left: Math.max(0, newLeft) } : n
      ));
    }
  };

  const handleDetailMouseUpGlobal = (e) => {
    clearTimeout(longPressTimerRef.current);
    if (stickyDragging) {
      setStickyNotes(prev => {
        saveStickyNotes(prev);
        return prev;
      });
      setStickyDragging(null);
    }
  };

  const addStickyNote = (draft) => {
    const { user } = useAuthStore.getState();
    const note = {
      id: Date.now(),
      text: draft.text.trim(),
      color: draft.color,
      top: draft.top,
      left: draft.left,
      archived: false,
      created_at: new Date().toISOString(),
      author_name: user?.name || user?.email?.split('@')[0] || 'Équipe',
    };
    const next = [...stickyNotes, note];
    saveStickyNotes(next);
    setStickyDraft(null);
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
  const normalizePersonName = (value) => String(value || '').trim().toLowerCase();
  const parseTradePersons = (arr = []) => (
    (arr || []).map((person) =>
      typeof person === 'string'
        ? { name: person, status: 'a_contacter', phone: '', email: '', location: '', notes: '' }
        : { phone: '', email: '', location: '', notes: '', ...person }
    )
  );

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

  const syncAssignedPhaseWithTeam = useCallback(async (phaseId, assignedName, tradeNameOverride = null) => {
    const normalizedAssigned = String(assignedName || '').trim();
    if (!normalizedAssigned) return;

    const currentPhase = (project?.phases || []).find((phase) => phase.id === phaseId);
    const tradeName = toTradeLabel(tradeNameOverride || currentPhase?.trade_name || currentPhase?.trade);
    if (!tradeName) return;

    await ensureProjectTradesExist([tradeName]);

    const rawTradeResources = tradeResourcesMap?.[tradeName] || { internal: [], external: [] };
    const internalPeople = parseTradePersons(rawTradeResources.internal);
    const externalPeople = parseTradePersons(rawTradeResources.external);
    const normalizedTarget = normalizePersonName(normalizedAssigned);

    const internalIndex = internalPeople.findIndex((person) => normalizePersonName(person.name) === normalizedTarget);
    const externalIndex = externalPeople.findIndex((person) => normalizePersonName(person.name) === normalizedTarget);

    let personType = internalIndex >= 0 ? 'internal' : externalIndex >= 0 ? 'external' : null;

    if (!personType) {
      const tradeRow = (project?.trades || []).find((trade) => (
        toTradeLabel(trade?.trade).toLowerCase() === tradeName.toLowerCase()
      ));
      const subcontractorCandidates = [
        tradeRow?.subcontractor_name,
        tradeRow?.chosen_subcontractor_name,
        tradeRow?.company_name,
        tradeRow?.contact_name,
      ]
        .map((value) => normalizePersonName(value))
        .filter(Boolean);
      personType = subcontractorCandidates.includes(normalizedTarget) ? 'external' : 'internal';
    }

    let personIndex = personType === 'internal' ? internalIndex : externalIndex;

    if (personIndex < 0) {
      const nextList = [
        ...(personType === 'internal' ? internalPeople : externalPeople),
        {
          name: normalizedAssigned,
          status: personType === 'internal' ? 'confirme' : 'accepte',
          phone: '',
          email: '',
          location: '',
          notes: '',
        },
      ];
      personIndex = nextList.length - 1;
      const nextResources = {
        ...tradeResourcesMap,
        [tradeName]: {
          internal: personType === 'internal' ? nextList : internalPeople,
          external: personType === 'external' ? nextList : externalPeople,
        },
      };
      saveTradeResources(nextResources);
    }

    const personKey = `${tradeName}||${personType}||${personIndex}`;
    if (!tradeConformite?.[personKey]) {
      saveTradeConformite({
        ...tradeConformite,
        [personKey]: {
          rbq: { ok: undefined },
          ccq: { ok: undefined },
          insurance: { ok: undefined },
        },
      });
    }
  }, [ensureProjectTradesExist, project?.phases, project?.trades, saveTradeConformite, saveTradeResources, toTradeLabel, tradeConformite, tradeResourcesMap]);

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

  useEffect(() => {
    try {
      const toSave = Object.fromEntries(
        Object.entries(tradePersonMsgs).map(([k, v]) => [k, { msg: v.msg, disponible: v.disponible, prix: v.prix, depenses: v.depenses, po: v.po }])
      );
      localStorage.setItem(`monflux-trade-msgs-${id}`, JSON.stringify(toSave));
    } catch {}
  }, [tradePersonMsgs, id]);

  // Florence recommande des sous-traitants et les ajoute directement dans le tableau
  const applyFloRecos = (recosMap, mergeMode) => {
    const pParse = (arr) => (arr||[]).map(p => typeof p === 'string' ? {name:p,status:'a_contacter',phone:'',email:'',location:'',notes:''} : {phone:'',email:'',location:'',notes:'',...p});
    let updatedMap = mergeMode === 'reset' ? {} : { ...tradeResourcesMap };
    let updatedConf = { ...tradeConformite };
    Object.entries(recosMap).forEach(([tradeName, recos]) => {
      const raw = updatedMap[tradeName] || { internal: [], external: [] };
      const existing = { internal: pParse(raw.internal), external: pParse(raw.external) };
      (recos || []).forEach(r => {
        const pType = r.type === 'internal' ? 'internal' : 'external';
        if (existing[pType].some(p => p.name === r.name)) return; // déjà présent
        const newPerson = { name: r.name, status: 'prequalifie_flo', phone: r.phone||'', email: r.email||'', location:'', notes: r.note||'' };
        existing[pType].push(newPerson);
        const newPKey = `${tradeName}||${pType}||${existing[pType].length - 1}`;
        if (r.conformite) {
          updatedConf[newPKey] = {
            rbq: { ok: undefined }, ccq: { ok: undefined }, insurance: { ok: undefined },
            floNotes: r.conformite.summary || '',
            floDate: new Date().toLocaleString('fr-CA', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }),
          };
        }
      });
      updatedMap[tradeName] = { internal: existing.internal, external: existing.external };
    });
    saveTradeResources(updatedMap);
    saveTradeConformite(updatedConf);
    setFloMergePending(null);
  };

  const fetchTradeRecos = async (mergeMode) => {
    const pParsePers = (arr) => (arr || []).map(p => typeof p === 'string' ? { name: p } : p);
    // Corps de métier explicites (trade_name) + fallback sur noms de phases + entrées manuelles
    const explicitTrades = [...new Set([
      ...(project.phases || []).map(p => p.trade_name).filter(Boolean),
      ...(project.trades || []).map(t => t.trade).filter(Boolean),
      ...Object.keys(tradeResourcesMap),
    ])].filter(Boolean);
    const phaseNames = (project.phases || []).map(p => p.name).filter(Boolean);
    // Si aucun trade_name mais des phases existent → Flo inférera les corps de métier
    if (!explicitTrades.length && !phaseNames.length) {
      setTradeRecos({});
      setLoadingTradeRecos(false);
      return;
    }
    setLoadingTradeRecos(true);
    // Utiliser les trades explicites ou, à défaut, laisser Flo inférer depuis les noms de phases
    const allTrades = explicitTrades.length ? explicitTrades : [];

    // Contexte : ressources internes par corps de métier
    const internalLines = allTrades.map(trade => {
      const res = tradeResourcesMap[trade] || {};
      const names = pParsePers(res.internal).map(p => p.name).filter(Boolean);
      return names.length ? `  ${trade} → interne: ${names.join(', ')}` : null;
    }).filter(Boolean).join('\n');

    // Contexte : sous-traitants connus dans la base
    const knownLines = allTrades.map(trade => {
      const matched = subs.filter(s =>
        (s.trades||[]).some(st => st.toLowerCase().includes(trade.toLowerCase()) || trade.toLowerCase().includes(st.toLowerCase())) ||
        (s.specialty||'').toLowerCase().includes(trade.toLowerCase())
      );
      return matched.length ? `  ${trade} → connus: ${matched.map(s => `${s.name}${s.phone ? ` (${s.phone})` : ''}`).join(', ')}` : null;
    }).filter(Boolean).join('\n');

    const prompt = `Tu es Florence, assistante IA MONFLUX spécialisée en construction au Québec.
Projet : ${project.description || project.name || ''}
Adresse : ${project.address || 'Non précisée'}
${allTrades.length
  ? `Corps de métier requis : ${allTrades.join(', ')}`
  : `Phases du chantier (identifie les corps de métier nécessaires depuis ces noms) :\n${phaseNames.map(n => `  - ${n}`).join('\n')}`
}
${phaseNames.length ? `\nPhases Gantt : ${phaseNames.join(' / ')}` : ''}

CONTEXTE — ressources déjà disponibles :
${internalLines || '  (aucune ressource interne renseignée)'}
${knownLines || '  (aucun sous-traitant connu en base)'}

RÈGLES IMPORTANTES :
1. Pour CHAQUE corps de métier, retourne TOUJOURS au moins 2-3 fiches même si le contexte est vide — utilise des exemples vraisemblables ou des types d'entreprises à chercher.
2. Distingue EXACTEMENT ces 3 types :
   - "internal" : ressource interne listée ci-dessus pouvant couvrir ce métier
   - "known" : sous-traitant connu ci-dessus (reprends ses vraies infos)
   - "new" : nouvelles entreprises vraisemblables au Québec avec source vérifiable (rbq.gouv.qc.ca, CCQ, APCHQ, CMEQ, CMMTQ, etc.)
3. Pour CHAQUE fiche, évalue la conformité réglementaire Québec ET inclus un champ "conformite" avec :
   - "rbq" : "obligatoire" | "non applicable" | "vérifier"
   - "ccq" : "obligatoire" | "non applicable" | "vérifier"
   - "insurance" : "obligatoire" | "non applicable" | "vérifier"
   - "summary" : 1 phrase d'avis de conformité

Réponds en JSON UNIQUEMENT, format strict :
{"trades":{"Électricité":[
  {"name":"Jean Tremblay","type":"internal","note":"Électricien dans l'équipe interne","source":"Équipe MONFLUX","phone":"","email":"",
   "conformite":{"rbq":"non applicable","ccq":"vérifier","insurance":"obligatoire","summary":"Employé interne — vérifier assurance responsabilité de l'entreprise."}},
  {"name":"Volt Express Inc.","type":"known","note":"Partenaire habituel","phone":"514-555-0101","source":"Base MONFLUX",
   "conformite":{"rbq":"obligatoire","ccq":"vérifier","insurance":"obligatoire","summary":"Vérifier licence RBQ active et CCQ avant signature."}},
  {"name":"CMEQ — Répertoire électriciens","type":"new","note":"Chercher un maître-électricien certifié CMEQ","website":"cmeq.com","source":"CMEQ Québec","source_url":"https://www.cmeq.com/trouver-un-entrepreneur",
   "conformite":{"rbq":"obligatoire","ccq":"obligatoire","insurance":"obligatoire","summary":"Exiger licence RBQ + certification CCQ + preuve assurance 2M$ min."}}
]}}`;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${PROJ_CHAT_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) { setTradeRecos({}); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const evt = JSON.parse(line.slice(6)); if (evt.type === 'text') raw += evt.text; } catch {}
        }
      }
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          const recos = parsed.trades || {};
          setTradeRecos(recos);
          // Auto-peupler le tableau — demander confirmation si données existantes et pas de choix déjà fait
          const hasExisting = Object.keys(recos).some(t => {
            const res = tradeResourcesMap[t];
            return res && ((res.internal||[]).length > 0 || (res.external||[]).length > 0);
          });
          if (hasExisting && mergeMode == null) {
            setFloMergePending(recos); // attendre le choix
          } else {
            applyFloRecos(recos, mergeMode || 'merge');
          }
        } catch { setTradeRecos({}); }
      } else { setTradeRecos({}); }
    } catch { setTradeRecos({}); } finally { setLoadingTradeRecos(false); }
  };

  const floCheckPersonConformite = async (tradeName, person, type, pi) => {
    const pKey = `${tradeName}||${type}||${pi}`;
    setLoadingFloPersonCheck(m => ({ ...m, [pKey]: true }));
    const prompt = `Tu es Florence, assistante IA MONFLUX spécialisée en conformité construction au Québec.
Évalue la conformité réglementaire de cette personne/entreprise pour un chantier de construction au Québec :
- Nom : ${person.name}
- Corps de métier : ${tradeName}
- Type : ${type === 'internal' ? 'Ressource interne (employé)' : 'Sous-traitant / entreprise externe'}
- Projet : ${project.description || project.name || ''}

Évalue les 3 certifications requises au Québec :
1. RBQ — Licence de la Régie du bâtiment du Québec (obligatoire pour entreprise)
2. CCQ — Conformité aux conventions collectives de la construction (si assujetti)
3. Assurance responsabilité civile (obligatoire, min. 2M$ généralement)

Pour chaque certification, dis si elle est probablement requise pour ce corps de métier et ce profil, et si oui quelle action recommander.
Réponds en JSON UNIQUEMENT dans ce format :
{"rbq":{"requis":true,"ok":null,"notes":"Vérifier licence RBQ active sur rbq.gouv.qc.ca"},"ccq":{"requis":true,"ok":null,"notes":"..."},"insurance":{"requis":true,"ok":null,"notes":"..."},"summary":"Résumé global en 1 phrase"}`;
    try {
      const token = localStorage.getItem('token');
      const PROJ_CHAT_BASE_LOCAL = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const res = await fetch(`${PROJ_CHAT_BASE_LOCAL}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return;
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let raw = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const evt = JSON.parse(line.slice(6)); if (evt.type === 'text') raw += evt.text; } catch {}
        }
      }
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          setTradeConformite(prev => {
            const updated = {
              ...prev,
              [pKey]: {
                ...prev[pKey],
                floNotes: parsed.summary || '',
                floDate: new Date().toLocaleString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                floResult: parsed,
              }
            };
            saveAssessmentField('trade_conformite', updated);
            localStorage.setItem(`monflux-trade-conformite-${id}`, JSON.stringify(updated));
            return updated;
          });
        } catch {}
      }
    } catch {} finally {
      setLoadingFloPersonCheck(m => ({ ...m, [pKey]: false }));
    }
  };

  const generateContactMessage = async (tradeName, person, type, pKey) => {
    setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], loading: true } }));
    const isExt = type === 'external';
    // Phases liées à ce corps de métier
    const trKw = tradeName.toLowerCase().split(/[\s,\/&+]+/).filter(w => w.length >= 4);
    const relPhases = (project.phases || []).filter(ph =>
      ph.trade_name?.toLowerCase() === tradeName.toLowerCase() ||
      (trKw.length && trKw.some(kw => (ph.name||'').toLowerCase().includes(kw)))
    );
    const phaseLines = relPhases.map(ph => {
      const s = ph.start_date || '';
      const e = ph.end_date || '';
      const h = ph.duration_hours ? `${ph.duration_hours} h` : '';
      return `  - ${ph.name}${s ? ` : ${s}${e && e !== s ? ` → ${e}` : ''}` : ''}${h ? ` (${h})` : ''}`;
    }).join('\n');
    const totalH = relPhases.reduce((acc, ph) => acc + (Number(ph.duration_hours) || 0), 0);
    const deadline = (tradeResourcesMap[tradeName]?.[type]?.[parseInt(pKey.split('||')[2])]?.responseDeadline) || '';
    const prompt = `Génère un message de contact direct et factuel en français québécois.

Destinataire : ${person.name}
Corps de métier : ${tradeName}
Projet : ${project.name || project.description || 'Projet'}
Adresse du chantier : ${project.address || 'À préciser'}
Travaux concernés :
${phaseLines || `  - ${tradeName}`}
Total : ${totalH ? `${totalH} h` : 'à estimer'}
${deadline ? `Date limite pour confirmer / soumissionner : ${deadline}` : ''}

Instructions :
- Message court (4-6 phrases max), 0 fluff, 0 formule de politesse excessive
- Commence directement par "Bonjour [prénom],"
- Inclure : l'adresse exacte, les ouvrages prévus, les dates et heures totales
- ${isExt ? 'Demander disponibilité ET prix ferme avant la date limite' : 'Confirmer disponibilité avant la date limite'}
- Terminer par une seule phrase de clôture directe
- Réponds avec le message seul`;
    try {
      const token = localStorage.getItem('token');
      const CHAT_BASE2 = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const res = await fetch(`${CHAT_BASE2}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return;
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let txt = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const evt = JSON.parse(line.slice(6)); if (evt.type === 'text') txt += evt.text; } catch {}
        }
      }
      setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], msg: txt.trim(), loading: false } }));
    } catch {
      setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], loading: false } }));
    }
  };

  const generatePO = async (tradeName, person, type, pKey, prix, minDate, maxDate) => {
    setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], poLoading: true } }));
    const isExt    = type === 'external';
    const poNum    = `PO-${Date.now().toString().slice(-6)}`;
    const dateRange = [minDate, maxDate].filter(Boolean).join(minDate !== maxDate ? ' au ' : '');
    const prompt = `Tu es Florence, assistante IA MONFLUX. Génère un bon de commande (PO) formel et concis en français québécois.
Numéro PO : ${poNum}
Projet : ${project.name || project.description || 'Projet en cours'}
Adresse : ${project.address || 'À confirmer'}
Dates : ${dateRange || 'À confirmer'}
Corps de métier : ${tradeName}
${isExt ? `Fournisseur : ${person.name}${person.email ? ` — ${person.email}` : ''}` : `Ressource interne : ${person.name}`}
${isExt && prix ? `Montant convenu : ${prix}` : ''}
Génère un bon de commande formel (150 mots max) incluant : les parties, description des travaux, dates, ${isExt ? 'montant convenu, conditions de paiement 30 jours net' : 'modalités de disponibilité confirmées'}. Réponds avec le texte du PO seulement.`;
    try {
      const token = localStorage.getItem('token');
      const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const res = await fetch(`${BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }) });
      if (!res.ok) return;
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let txt = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const evt = JSON.parse(line.slice(6)); if (evt.type === 'text') txt += evt.text; } catch {}
        }
      }
      const trimmed = txt.trim();
      setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], po: trimmed, poNum, poLoading: false } }));
      openPOWindow(trimmed, person.name, poNum);
    } catch {
      setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], poLoading: false } }));
    }
  };

  const openPOWindow = (poText, personName, poNum) => {
    const projName = project.name || project.description || 'Projet';
    const address  = project.address || '';
    const today    = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const bodyHtml = (poText || '')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>BON DE COMMANDE ${poNum}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#15171C;background:#fff;padding:44px 60px;max-width:880px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E8794E;padding-bottom:20px;margin-bottom:28px}
.brand{font-size:24px;font-weight:900;color:#E8794E;letter-spacing:-.03em}
.brand-sub{font-size:11px;color:#9CA3AF;margin-top:3px}
.po-num{font-size:22px;font-weight:900;color:#15171C;text-align:right}
.po-lbl{font-size:9px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;text-align:right}
.po-date{font-size:12px;color:#6B7280;margin-top:4px;text-align:right}
h1{font-size:30px;font-weight:900;letter-spacing:-.02em;margin-bottom:24px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#F9FAFB;border:1px solid #E8EAED;border-radius:10px;padding:16px;margin-bottom:24px}
.mi label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;display:block;margin-bottom:4px}
.mi p{font-size:13px;font-weight:600;color:#15171C}
.mi.full{grid-column:span 2}
.body{background:#FAFAFA;border:1px solid #E8EAED;border-radius:10px;padding:20px;font-size:13px;line-height:1.8;margin-bottom:32px}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:44px;border-top:1px solid #E8EAED;padding-top:24px;margin-top:24px}
.sig label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9CA3AF;display:block;margin-bottom:36px}
.sig-line{border-top:1px solid #D1D5DB;padding-top:5px;font-size:11px;color:#C4C8CE}
.foot{margin-top:20px;text-align:center;font-size:10px;color:#C4C8CE;border-top:1px solid #F1F3F5;padding-top:14px}
@media print{body{padding:20px 30px}button{display:none}@page{margin:18mm}}
</style></head>
<body>
<div class="hdr">
  <div><div class="brand">MONFLUX</div><div class="brand-sub">Gestion de projet construction · Québec</div></div>
  <div><div class="po-lbl">Bon de commande</div><div class="po-num">${poNum}</div><div class="po-date">${today}</div></div>
</div>
<h1>Bon de commande</h1>
<div class="meta">
  <div class="mi"><label>Projet</label><p>${projName}</p></div>
  <div class="mi"><label>Fournisseur / Prestataire</label><p>${personName}</p></div>
  <div class="mi"><label>Donneur d'ordre</label><p>MONFLUX</p></div>
  <div class="mi"><label>Conditions de paiement</label><p>Net 30 jours après facture conforme</p></div>
  ${address ? `<div class="mi full"><label>Adresse des travaux</label><p>${address}</p></div>` : ''}
</div>
<div class="body">${bodyHtml}</div>
<div class="sigs">
  <div class="sig"><label>Signature — Donneur d'ordre</label><div class="sig-line">Nom, titre et date</div></div>
  <div class="sig"><label>Signature — Fournisseur</label><div class="sig-line">Nom, titre et date</div></div>
</div>
<div class="foot">Document généré par Florence — MONFLUX · ${today}</div>
<script>setTimeout(function(){window.print();},500);<\/script>
</body></html>`;
    const w = window.open('', '_blank', 'width=960,height=720');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const addFloRecoToTeam = (tradeName, reco) => {
    const pType = reco.type === 'internal' ? 'internal' : 'external';
    const rawRes  = tradeResourcesMap[tradeName] || { internal: [], external: [] };
    const pParse  = (arr) => (arr||[]).map(p => typeof p === 'string' ? {name:p,status:'a_contacter',phone:'',email:'',location:''} : {phone:'',email:'',location:'',...p});
    const existing = pParse(rawRes[pType]);
    if (existing.some(p => p.name === reco.name)) return;
    const newPerson = { name: reco.name, status: 'a_contacter', phone: reco.phone || '', email: reco.email || '', location: '' };
    const newList   = [...existing, newPerson];
    const updated   = { ...tradeResourcesMap, [tradeName]: { ...rawRes, [pType]: newList } };
    saveTradeResources(updated);
    const newPKey = `${tradeName}||${pType}||${existing.length}`;
    // Pré-remplir conformité si Flo l'a analysée
    if (reco.conformite) {
      const confStatus = (v) => v === 'obligatoire' ? undefined : v === 'non applicable' ? false : undefined;
      const confUpdated = {
        ...tradeConformite,
        [newPKey]: {
          rbq:      { ok: confStatus(reco.conformite.rbq) },
          ccq:      { ok: confStatus(reco.conformite.ccq) },
          insurance:{ ok: confStatus(reco.conformite.insurance) },
          floNotes: reco.conformite.summary || '',
          floDate:  new Date().toLocaleString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }
      };
      saveTradeConformite(confUpdated);
    }
    // Auto-générer le message de contact
    generateContactMessage(tradeName, newPerson, pType, newPKey);
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

  // Sauvegarder un snapshot Gantt (avant toute modification IA)
  const saveGanttSnapshot = (phases) => {
    const snapKey = `mf-gantt-snaps-${id}`;
    const existing = JSON.parse(localStorage.getItem(snapKey) || '[]');
    const snap = { ts: new Date().toISOString(), phases: phases.map(ph => ({ ...ph })) };
    const next = [snap, ...existing].slice(0, 5);
    localStorage.setItem(snapKey, JSON.stringify(next));
    setGanttSnapshots(next);
  };

  const restoreGanttSnapshot = async (snap) => {
    if (!confirm(`Restaurer le Gantt du ${new Date(snap.ts).toLocaleString('fr-CA')} ?`)) return;
    for (const ph of snap.phases) {
      await projectsApi.updatePhase(id, ph.id, {
        start_date: ph.start_date, end_date: ph.end_date,
        start_time: ph.start_time, duration_hours: ph.duration_hours, display_order: ph.display_order,
      }).catch(() => {});
    }
    const { data: updated } = await projectsApi.get(id);
    setProject(updated);
    setAiNotice('Gantt restauré à la version précédente.');
  };

  // "Ajuster avec Flo" — réorganise les phases existantes sans les supprimer
  const adjustPhasesWithAI = async () => {
    const currentPhases = project.phases || [];
    if (!currentPhases.length) { generatePhasesFromAI(); return; }
    saveGanttSnapshot(currentPhases); // snapshot avant modification
    setGeneratingPhases(true);
    setAiNotice('');
    setAiRecommendations([]);
    try {
      const { data } = await aiApi.adjustPhases({
        phases: currentPhases.map(ph => ({ id: ph.id, name: ph.name, trade_name: ph.trade_name, duration_hours: ph.duration_hours, start_date: ph.start_date })),
        project_name: project.name || '',
        project_type: project.field_assessment?.work_type || project.type || '',
        start_date: project.start_date || null,
        notes: project.notes || '',
      });
      const adj = data?.adjustments || [];
      const recs = data?.recommendations || [];
      if (recs.length) {
        setAiRecommendations(recs);
        projectsApi.update(id, { flo_recommendations: recs }).catch(() => {});
      }
      if (!adj.length) { setAiNotice('Flo n\'a pas pu ajuster les phases — réessaie.'); return; }
      // Appliquer en respectant le better_order si fourni
      const orderedPhases = [...currentPhases].sort((a,b) => (a.display_order||0)-(b.display_order||0));
      const newDeps = {};
      const updates_batch = [];
      for (const a of adj) {
        const ph = orderedPhases[a.id_original - 1];
        if (!ph) continue;
        const updates = {};
        if (a.start_date) updates.start_date = a.start_date;
        if (a.duration_hours) updates.duration_hours = Number(a.duration_hours);
        if (a.better_order != null) updates.display_order = Number(a.better_order);
        if (Object.keys(updates).length) updates_batch.push({ id: ph.id, updates });
        if (a.depends_on_index != null) {
          const pred = orderedPhases[a.depends_on_index - 1];
          if (pred) newDeps[ph.id] = pred.id;
        }
      }
      for (const { id: phId, updates } of updates_batch) {
        await projectsApi.updatePhase(id, phId, updates);
      }
      if (Object.keys(newDeps).length) setProject(p => ({ ...p, _flooDeps: newDeps })); // hint for GanttChart
      // Recharger les phases
      const { data: updatedProject } = await projectsApi.get(id);
      setProject(updatedProject);
      setAiNotice('Florence a ajusté le planning selon les journées ouvrables.');
    } catch (err) {
      console.error('adjustPhasesWithAI', err);
      const code   = err.response?.data?.code;
      const status = err.response?.status;
      if (code === 'ai_not_configured') {
        setAiNotice(err.response.data.hint || 'IA non configurée — configure une clé API Anthropic.');
      } else if (code === 'ai_quota_exceeded' || status === 429) {
        setAiNotice('Limite IA atteinte pour ce mois. Ajoute des crédits ou réessaie le mois prochain.');
      } else if (status === 400) {
        setAiNotice(err.response?.data?.error || 'Données de phases invalides.');
      } else if (status === 503) {
        setAiNotice('IA non configurée sur le serveur — vérifie la clé ANTHROPIC_API_KEY.');
      } else {
        const msg = err.response?.data?.error || err.message || 'erreur inconnue';
        setAiNotice(`Erreur ${status || 'réseau'} : ${msg}`);
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
        po_number: expenseForm.po_number || null,
        supplier_invoice_number: expenseForm.supplier_invoice_number || null,
      });
      setProject(p => ({ ...p, expenses: [data, ...(p.expenses || [])] }));
      setExpenseForm({ type: 'supplier_invoice', description: '', amount: '', expense_date: '', po_number: '', supplier_invoice_number: '' });
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

  const createInvoiceInline = async (e) => {
    e.preventDefault();
    const items = newInvoiceItems.filter(it => it.description && it.unit_price);
    if (!items.length) return;
    setSavingInvoice(true);
    try {
      const { data } = await invoicesApi.create({
        project_id: id,
        title: newInvoice.title || undefined,
        client_name: newInvoice.client_name || project.client_name || '',
        client_email: newInvoice.client_email || project.client_email || '',
        due_date: newInvoice.due_date || undefined,
        items: items.map((it, idx) => ({ description: it.description, qty: Number(it.qty) || 1, unit_price: Number(it.unit_price) || 0, total: (Number(it.qty)||1) * (Number(it.unit_price)||0), order_idx: idx })),
      });
      setProjectInvoices(prev => [data, ...prev]);
      setShowNewInvoice(false);
      setNewInvoice({ title: '', client_name: '', client_email: '', due_date: '' });
      setNewInvoiceItems([{ description: '', qty: 1, unit_price: '' }]);
    } catch (err) { console.error(err); }
    finally { setSavingInvoice(false); }
  };

  const sendInvoiceEmail = async (inv) => {
    const to = inv.client_email || project.client_email;
    if (!to) { alert('Aucun courriel client enregistré pour cette facture.'); return; }
    setSendingInvoiceId(inv.id);
    try {
      await emailApi.sendInvoice(inv.id, { to });
      setProjectInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: i.status === 'draft' ? 'sent' : i.status } : i));
      setInvoiceSentId(inv.id);
      setTimeout(() => setInvoiceSentId(null), 3000);
    } catch (err) { alert(err?.response?.data?.error || 'Erreur envoi courriel'); }
    finally { setSendingInvoiceId(null); }
  };

  const updateInvoiceStatus = async (inv, newStatus) => {
    setUpdatingInvoiceId(inv.id);
    try {
      const { data } = await invoicesApi.update(inv.id, { status: newStatus });
      setProjectInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: data.status || newStatus } : i));
    } catch (err) { console.error(err); }
    finally { setUpdatingInvoiceId(null); }
  };

  const createExtraInline = async (e) => {
    e.preventDefault();
    if (!extraForm.title) return;
    setSavingExtra(true);
    try {
      await changeOrdersApi.create({ project_id: id, title: extraForm.title, description: extraForm.description || undefined, amount: Number(extraForm.amount) || 0, notes: extraForm.notes || undefined });
      setShowExtraForm(false);
      setExtraForm({ title: '', description: '', amount: '', notes: '' });
    } catch (err) { console.error(err); }
    finally { setSavingExtra(false); }
  };

  const createChangeRequestFromMaterials = async (items = [], label = 'matériaux') => {
    if (!items.length) return;
    try {
      const amount = items.reduce((sum, item) => sum + (Number(item.prix_unitaire || item.unit_price || 0) * Number(item.qty || 1 || 1)), 0);
      const description = items.map((item) => {
        const qty = Number(item.qty || 1) || 1;
        const unit = item.unite || item.unit || 'un.';
        const price = Number(item.prix_unitaire || item.unit_price || 0) || 0;
        return `- ${item.nom || item.name} · ${qty} ${unit} · ${price.toLocaleString('fr-CA')} $`;
      }).join('\n');
      const { data } = await changeOrdersApi.create({
        project_id: id,
        title: `Demande de changement — ${label}`,
        description,
        amount,
        notes: 'Créée depuis la recherche de matériaux après verrouillage du devis/contrat.',
      });
      setChangeOrdersList((list) => [data, ...list]);
      setShowExtraForm(false);
      return data;
    } catch (err) {
      console.error('createChangeRequestFromMaterials', err);
      alert(err?.response?.data?.error || 'Erreur lors de la création de la demande de changement.');
      return null;
    }
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
      setTimeout(() => { void syncDraftContractForQuote(data, { replaceIfDraftExists: false }); }, 0);
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
      setQuoteBuilderItems(normalizeQuoteItems(data.items || items));
      await syncDraftContractForQuote(data);
    } catch {} finally { setQuoteSaving(false); }
  };

  const scheduleQuoteSave = (items) => {
    clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => saveQuoteItems(items), 900);
  };

  const syncDraftContractForQuote = async (quote, options = {}) => {
    if (!quote?.id) return null;
    const { replaceIfDraftExists = true } = options;
    const draftContract = (projectContracts || []).find((contract) => contract.quote_id === quote.id && contract.status === 'draft');
    if (draftContract && !replaceIfDraftExists) return draftContract;
    try {
      const payload = { template_key: resolvedContractTemplateKey };
      if (replaceIfDraftExists && draftContract?.id) payload.replace_contract_id = draftContract.id;
      const { data } = await quotesApi.generateContract(quote.id, payload);
      const normalized = { ...data, content: normalizeContractHtml(data.content) };
      setProjectContracts((contracts) => {
        const exists = contracts.some((contract) => contract.id === normalized.id);
        if (exists) return contracts.map((contract) => contract.id === normalized.id ? normalized : contract);
        return [normalized, ...contracts];
      });
      setContractDrafts((drafts) => ({
        ...drafts,
        [normalized.id]: { title: normalized.title || '', content: normalized.content || '<p></p>' },
      }));
      return normalized;
    } catch (err) {
      console.error('syncDraftContractForQuote', err);
      return null;
    }
  };

  const addQuoteItem = async (type) => {
    if (salesLocked) return;
    const q = await ensureQuote();
    if (!q) return;
    const unitMap = { labor: 'h', material: 'un.', subcontractor: 'forfait', other: 'un.' };
    const next = [...quoteBuilderItems, { type, name: '', qty: 1, unit: unitMap[type] || 'un.', unit_price: 0 }];
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };

  const updateQuoteItem = (i, patch) => {
    if (salesLocked) return;
    const next = quoteBuilderItems.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };

  const removeQuoteItem = (i) => {
    if (salesLocked) return;
    const next = quoteBuilderItems.filter((_, idx) => idx !== i);
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };

  const normalizeQuoteItems = (items) => (items || []).map(it => ({ ...it, markup: Number(it.markup) || 0, show_on_quote: it.show_on_quote !== false }));

  const commitNewRow = async (type, draft) => {
    if (salesLocked) return;
    if (!(draft.name || '').trim()) return;
    const q = await ensureQuote();
    if (!q) return;
    const unitMap = { labor: 'h', material: 'un.', subcontractor: 'forfait', other: 'un.' };
    const next = [...quoteBuilderItems, {
      type, name: draft.name || '', qty: Number(draft.qty) || 1,
      unit: draft.unit || unitMap[type] || 'un.',
      unit_price: Number(draft.unit_price) || 0, url: draft.url || '', markup: 0,
    }];
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
    setQuoteNewRow(m => ({ ...m, [type]: {} }));
  };

  const fetchQuoteRecos = async () => {
    setFloQuoteLoading(true);
    try {
      const subLines = [];
      Object.entries(tradeResourcesMap).forEach(([tradeName, res]) => {
        (res.external || []).forEach((p, pi) => {
          const pKey = `${tradeName}||external||${pi}`;
          const msgD = tradePersonMsgs[pKey] || {};
          if (['accepte','en_negociation','soumis'].includes(p.status) && msgD.prix) {
            subLines.push(`${tradeName} — ${p.name}: ${msgD.prix} $`);
          }
        });
      });
      const laborLines = (project.phases || [])
        .filter(ph => ph.duration_hours > 0)
        .map(ph => `${ph.name}: ${ph.duration_hours}h${ph.trade_name ? ` (${ph.trade_name})` : ''}`);
      const prompt = `Tu es Florence, assistante IA MONFLUX. Génère un devis de construction réaliste pour le marché québécois.

PROJET: ${project.name || project.description || 'Projet de construction'}
ADRESSE: ${project.address || 'À préciser'}
${floInspirationInput ? `\nIMAGES / INSPIRATIONS:\n${floInspirationInput}` : ''}
${subLines.length ? `\nSOUS-TRAITANTS CONFIRMÉS:\n${subLines.join('\n')}` : ''}
${laborLines.length ? `\nPHASES / MAIN D'ŒUVRE:\n${laborLines.join('\n')}` : ''}

Génère un devis JSON réaliste avec:
- materials: matériaux (nom, qté, unité, prix unitaire marché QC, URL fournisseur réel si connu)
- labor: main d'œuvre interne (basé phases ci-dessus, taux ~65$/h QC)
- subcontractors: sous-traitants (prix ci-dessus si dispo, sinon estimation)
- other: frais divers (permis, transport, location équip.)

Format JSON strict:
{"materials":[{"name":"","qty":1,"unit":"","unit_price":0,"url":""}],"labor":[{"name":"","qty":1,"unit":"h","unit_price":65}],"subcontractors":[{"name":"","qty":1,"unit":"forfait","unit_price":0,"url":""}],"other":[{"name":"","qty":1,"unit":"","unit_price":0}]}

JSON seulement, pas de texte autour.`;
      const token = localStorage.getItem('token');
      const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const res = await fetch(`${BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) return;
      const reader = res.body.getReader(); const dec = new TextDecoder(); let txt = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const evt = JSON.parse(line.slice(6)); if (evt.type === 'text') txt += evt.text; } catch {}
        }
      }
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;
      const recos = JSON.parse(jsonMatch[0]);
      const unitMap = { labor: 'h', material: 'un.', subcontractor: 'forfait', other: 'un.' };
      const q = await ensureQuote(); if (!q) return;
      const typeMap = { materials: 'material', labor: 'labor', subcontractors: 'subcontractor', other: 'other' };
      const newItems = [...quoteBuilderItems];
      Object.entries(typeMap).forEach(([sec, type]) => {
        (recos[sec] || []).forEach(it => {
          newItems.push({ type, name: it.name || '', qty: Number(it.qty) || 1, unit: it.unit || unitMap[type], unit_price: Number(it.unit_price) || 0, url: it.url || '', markup: 0, source: 'flo' });
        });
      });
      setQuoteBuilderItems(newItems);
      scheduleQuoteSave(newItems);
      setShowFloQuotePanel(false);
    } catch (e) { console.error(e); } finally { setFloQuoteLoading(false); }
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
      const synced = await syncDraftContractForQuote(quoteBuilderQuote);
      if (synced?.id) setShowContractContent(synced.id);
    } catch (err) {
      console.error('generateContract', err);
      alert(err.response?.data?.error || 'Erreur lors de la génération du contrat.');
    } finally { setGeneratingContract(false); }
  };

  const updateContractDraft = (contractId, patch) => {
    setContractDrafts((drafts) => ({
      ...drafts,
      [contractId]: {
        ...(drafts[contractId] || { title: '', content: '<p></p>' }),
        ...patch,
      },
    }));
  };

  const saveContractDraft = async (contractId) => {
    const draft = contractDrafts[contractId];
    if (!draft) return;
    setContractSavingId(contractId);
    try {
      const { data } = await contractsApi.update(contractId, {
        title: draft.title,
        content: draft.content,
      });
      setProjectContracts((contracts) => contracts.map((contract) => (
        contract.id === contractId
          ? { ...contract, ...data, content: normalizeContractHtml(data.content) }
          : contract
      )));
    } catch (err) {
      console.error('saveContractDraft', err);
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde du contrat.');
    } finally {
      setContractSavingId(null);
    }
  };

  const enrichContractWithFlo = async (contractId) => {
    setContractEnrichingId(contractId);
    try {
      const { data } = await contractsApi.enrich(contractId, {
        goal: `Adapter ce contrat au contexte du projet ${project?.name || ''} et préciser les clauses utiles pour ${project?.field_assessment?.work_type || project?.type || 'ce type de travaux'}.`,
      });
      const normalized = { ...data, content: normalizeContractHtml(data.content) };
      setProjectContracts((contracts) => contracts.map((contract) => contract.id === contractId ? normalized : contract));
      setContractDrafts((drafts) => ({
        ...drafts,
        [contractId]: { title: normalized.title || '', content: normalized.content || '<p></p>' },
      }));
      setShowContractContent(contractId);
    } catch (err) {
      console.error('enrichContractWithFlo', err);
      alert(err.response?.data?.error || 'Erreur lors de l’enrichissement avec Flo.');
    } finally {
      setContractEnrichingId(null);
    }
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

  // Entrée manuelle de temps (stockée dans field_assessment pour ne pas nécessiter de route supplémentaire)
  const addManualPunch = async (e) => {
    e.preventDefault();
    const entry = { ...manualPunchForm, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    const fa = project.field_assessment || {};
    const existing = fa.manual_timesheets || [];
    const next = [entry, ...existing];
    await projectsApi.update(id, { field_assessment: { ...fa, manual_timesheets: next } });
    setProject(p => ({ ...p, field_assessment: { ...(p.field_assessment || {}), manual_timesheets: next } }));
    setManualPunchForm({ worker_name: '', work_date: new Date().toISOString().slice(0,10), hours: '', notes: '', trade: '' });
    setShowManualPunch(false);
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

  // Flo — prépare un courriel de retard à envoyer au client
  const prepareDelayEmail = async ({ slipDays, announcedEnd, ganttEnd }) => {
    setFloEmailLoading(true);
    const clientName = project.client_name || 'le client';
    const companyName = project.company_name || 'notre équipe';
    const announcedStr = announcedEnd ? new Date(announcedEnd).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const ganttStr = ganttEnd ? new Date(ganttEnd).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const projectName = project.work_type_label || project.name || 'votre projet';
    try {
      const token = localStorage.getItem('token');
      const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api';
      const prompt = `Rédige un courriel professionnel en français québécois pour informer le client "${clientName}" d'un retard de ${slipDays} jour${slipDays>1?'s':''} sur son projet "${projectName}".
La date de fin initialement prévue était le ${announcedStr}, mais le calendrier des travaux montre maintenant une fin estimée au ${ganttStr}.
Sois transparent, rassurant et propose de planifier un appel ou une rencontre pour en discuter.
Retourne uniquement l'objet du courriel (1 ligne, commençant par "Objet:") puis le corps du message, sans autre commentaire.`;
      const res = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) throw new Error();
      const reader = res.body.getReader(); const dec = new TextDecoder(); let txt = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const ln of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try { const ev = JSON.parse(ln.slice(6)); if (ev.type === 'text') txt += ev.text; } catch {}
        }
      }
      const lines = txt.trim().split('\n');
      const subjectLine = lines.find(l => l.toLowerCase().startsWith('objet:'));
      const subject = subjectLine ? subjectLine.replace(/^objet\s*:\s*/i, '').trim() : `Mise à jour — ${projectName}`;
      const body = lines.filter(l => !l.toLowerCase().startsWith('objet:')).join('\n').trim();
      setFloEmailModal({ subject, body });
    } catch {
      setFloEmailModal({
        subject: `Mise à jour de calendrier — ${projectName}`,
        body: `Bonjour ${clientName},\n\nJe vous contacte pour vous informer d'un ajustement dans le calendrier de votre projet. La date de fin initialement prévue au ${announcedStr} devra être décalée au ${ganttStr}, soit un retard de ${slipDays} jour${slipDays>1?'s':''}.\n\nNous faisons tout notre possible pour minimiser cet impact. N'hésitez pas à nous contacter pour en discuter.\n\nCordialement,\n${companyName}`,
      });
    } finally { setFloEmailLoading(false); }
  };

  // B7 — handlers IA chantier
  const addMedia = async (e) => {
    e.preventDefault();
    try {
      const payload = { project_id: id, type: mediaForm.type };
      if (mediaForm.type === 'voice') {
        payload.transcript = mediaForm.transcript;
      } else {
        payload.caption = mediaForm.caption;
        const validPhotos = (mediaForm.photos || []).filter(p => p.url.trim());
        if (validPhotos.length === 1) {
          payload.url = validPhotos[0].url;
          payload.mime_type = 'image/jpeg';
        } else if (validPhotos.length > 1) {
          payload.photos = validPhotos;
        }
      }
      const { data } = await siteMediaApi.create(payload);
      setMedia(prev => [data, ...prev]);
      setMediaForm({ type: 'note', caption: '', photos: [], transcript: '' });
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
  const contractTemplateConfig = getContractTemplateConfig(companyConfig?.contract_templates);
  const selectedContractTemplate = contractTemplateConfig.templates.find((template) => template.key === resolvedContractTemplateKey)
    || contractTemplateConfig.templates.find((template) => template.key === contractTemplateConfig.default_key)
    || contractTemplateConfig.templates[0];

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div></Layout>;
  if (!project) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Loader2 size={24} className="animate-spin text-gray-300"/>
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    </Layout>
  );
  if (typeof project === 'string' && project.startsWith('error:')) {
    const msg = project.slice(6);
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <p className="text-sm font-semibold text-red-500">{msg === 'Projet non trouvé' ? 'Projet introuvable' : 'Erreur de chargement'}</p>
          <p className="text-xs text-gray-400">{msg}</p>
          <button className="btn-primary text-xs mt-2" onClick={() => { setProject(null); load(); }}>Réessayer</button>
          <button className="btn-ghost text-xs" onClick={() => navigate('/projets')}>← Retour aux projets</button>
        </div>
      </Layout>
    );
  }

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
  const phaseCount = project.phases?.length || 0;
  const plannedHours = (project.phases || []).reduce((sum, phase) => sum + (Number(phase.duration_hours) || 0), 0);
  const loggedHours = timesheets.reduce((sum, entry) => sum + (Number(entry.hours_total || entry.hours) || 0), 0);
  const overdueInvoices = projectInvoices.filter((inv) => inv.status === 'overdue').length;
  const draftContracts = projectContracts.filter((contract) => contract.status === 'draft').length;
  const signedContracts = projectContracts.filter((contract) => contract.status === 'signed').length;
  const mediaPhotos = media.filter((item) => item.type === 'photo').length;
  const mediaNotes = media.filter((item) => item.type !== 'photo').length;
  const supplierExpenseTotal = (profit?.actual?.cost_breakdown?.expenses || 0);
  const quittanceCount = quittance ? 1 : 0;
  const denunciationCount = (project.field_assessment?.denonciations || []).length;
  const sectionSummaries = {
    's-estimation': {
      summary: `${project.type || project.field_assessment?.work_type || 'Projet'} · ${project.address || 'Adresse à confirmer'}${project.start_date || project.end_date ? ` · ${[formatCompactDate(project.start_date), formatCompactDate(project.end_date)].filter(Boolean).join(' → ')}` : ''}`,
      stats: [
        project.estimated_price ? `Estimé ${formatSectionMoney(project.estimated_price)}` : 'Estimation à compléter',
        project.status ? `Statut ${project.status.replace(/_/g, ' ')}` : null,
      ],
    },
    's-description': {
      summary: project.description
        ? project.description.slice(0, 160) + (project.description.length > 160 ? '…' : '')
        : `Décrire la portée des travaux, les contraintes et les besoins du client`,
      stats: [
        (project.field_assessment?.vision?.inspirations || []).length ? `${project.field_assessment.vision.inspirations.length} inspiration(s)` : null,
        project.field_assessment?.plan_url ? 'Plan joint' : null,
      ],
    },
    's-pipeline': {
      summary: `${phaseCount} phase(s) planifiée(s) · prévision et réel comparés dans le même écran`,
      stats: [
        phaseCount ? `${phaseCount} phase(s)` : 'Aucune phase',
        plannedHours ? `${plannedHours}h prévues` : null,
        loggedHours ? `${loggedHours}h punchées` : null,
      ],
    },
    's-equipe': {
      summary: `Affectations, responsables et conformité par corps de métier`,
      stats: [
        (project.trades || []).length ? `${project.trades.length} métier(s)` : null,
        (project.phases || []).filter((phase) => phase.assigned_to_name).length ? `${(project.phases || []).filter((phase) => phase.assigned_to_name).length} assignation(s)` : null,
      ],
    },
    's-materiaux': {
      summary: `Recherche, présélection et commandes liées au projet`,
      stats: [
        matSearchResults.length ? `${matSearchResults.length} résultat(s)` : 'Aucune recherche',
        matWishlist.length ? `${matWishlist.length} favori(s)` : null,
        materialOrders.length ? `${materialOrders.length} commande(s)` : null,
      ],
    },
    's-soumission': {
      summary: `${project.type || project.field_assessment?.work_type || 'Projet'} · ${project.address || 'Adresse à confirmer'}${project.start_date || project.end_date ? ` · ${[formatCompactDate(project.start_date), formatCompactDate(project.end_date)].filter(Boolean).join(' → ')}` : ''}`,
      stats: [
        quoteBuilderItems.length ? `${quoteBuilderItems.length} ligne(s)` : 'Aucun poste',
        quoteBuilderQuote?.total ? `Devis ${formatSectionMoney(quoteBuilderQuote.total)}` : null,
        signedContracts ? `${signedContracts} contrat signé` : (draftContracts ? `${draftContracts} brouillon contrat` : null),
      ],
    },
    's-media': {
      summary: `Journal terrain, visuels et mémos d’exécution`,
      stats: [
        media.length ? `${media.length} élément(s)` : 'Aucun média',
        mediaPhotos ? `${mediaPhotos} photo(s)` : null,
        mediaNotes ? `${mediaNotes} note(s)` : null,
      ],
    },
    's-expenses': {
      summary: `Factures fournisseurs et dépenses réelles du chantier`,
      stats: [
        profit?.actual?.supplier_invoices_count ? `${profit.actual.supplier_invoices_count} facture(s)` : null,
        supplierExpenseTotal ? `${formatSectionMoney(supplierExpenseTotal)} dépensés` : null,
      ],
    },
    's-punch': {
      summary: `Temps réel et dépenses terrain pour comparer le prévu au réalisé`,
      stats: [
        timesheets.length ? `${timesheets.length} entrée(s)` : 'Aucun punch',
        loggedHours ? `${loggedHours}h` : null,
        activeTs.length ? `${activeTs.length} en cours` : null,
      ],
    },
    's-invoices': {
      summary: `Facturation client, encaissé et soldes à suivre`,
      stats: [
        projectInvoices.length ? `${projectInvoices.length} facture(s)` : 'Aucune facture',
        totalCollected ? `${formatSectionMoney(totalCollected)} encaissés` : null,
        overdueInvoices ? `${overdueInvoices} en retard` : null,
      ],
    },
    's-extras': {
      summary: `Travaux hors contrat et ajustements demandés par le client`,
      stats: [
        changeOrdersList.length ? `${changeOrdersList.length} demande(s)` : 'Aucune demande',
        changeOrdersList.reduce((sum, co) => sum + Number(co.amount || 0), 0) ? `${formatSectionMoney(changeOrdersList.reduce((sum, co) => sum + Number(co.amount || 0), 0))}` : null,
      ],
    },
    's-quittances': {
      summary: `Suivi des quittances et confirmations de paiement`,
      stats: [
        quittanceCount ? `${quittanceCount} quittance` : 'Aucune quittance',
      ],
    },
    's-denonciations': {
      summary: `Documents légaux QC liés aux avis et dénonciations`,
      stats: [
        denunciationCount ? `${denunciationCount} entrée(s)` : 'Aucune dénonciation',
      ],
    },
  };

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
  const pipeActiveIdx = (configPipeline || PIPE).findIndex(s => s.key === project.status);

  const toggleSectionVisibility = (sectionId) => {
    setHiddenSections(prev => {
      const next = prev.includes(sectionId) ? prev.filter(x => x !== sectionId) : [...prev, sectionId];
      localStorage.setItem(`monflux-toc-hidden-${id}`, JSON.stringify(next));
      return next;
    });
  };

  const activePipeline = configPipeline || PIPE;

  // Retourne le composant SectionStub si la section est désactivée, sinon null.
  const sectionGuard = (sectionId) => {
    if (!project) return null;
    const reason = unavailableReason(sectionId, project.status, activePipeline, configModules);
    if (!reason) return null;
    return <SectionStub key={`stub-${sectionId}`} sectionId={sectionId} reason={reason} onActivate={() => navigate('/parametres?tab=flow')} />;
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

  const ProjectTOC = () => {
    // Split active vs inactive sections (overridden = forced visible)
    const availableSections  = tocSections.filter(s => !unavailableReason(s.id, project.status, activePipeline, configModules) || overriddenSections.includes(s.id));
    const unavailableSections = tocSections.filter(s => !!unavailableReason(s.id, project.status, activePipeline, configModules) && !overriddenSections.includes(s.id));

    const renderRow = (s, idx, isUnavailable) => {
      const isHidden = hiddenSections.includes(s.id);
      const isOverridden = overriddenSections.includes(s.id);
      return (
        <div
          key={s.id}
          draggable={!isUnavailable}
          onDragStart={e => !isUnavailable && onTocDragStart(e, idx)}
          onDragOver={e => !isUnavailable && onTocDragOver(e, idx)}
          onDrop={onTocDrop}
          style={{ display: 'flex', alignItems: 'center', gap: 0, opacity: isUnavailable ? 0.45 : 1 }}
          title={isUnavailable ? unavailableReason(s.id, project.status, activePipeline, configModules) : undefined}
        >
          <span style={{ cursor: isUnavailable ? 'pointer' : 'grab', color: '#4B5563', padding: '6px 4px', display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.4 }}
            onClick={isUnavailable ? () => toggleSectionOverride(s.id) : undefined}
            title={isUnavailable ? 'Cliquer pour afficher la section' : undefined}
          >
            {isUnavailable ? <EyeOff size={11} style={{ color: '#9CA3AF' }} /> : <GripVertical size={12} />}
          </span>
          <button
            type="button"
            className={`project-toc-item ${activeSection === s.id && !isHidden && !isUnavailable ? 'active' : ''}`}
            style={{ flex: 1, textDecoration: 'none', color: isUnavailable ? '#9CA3AF' : undefined }}
            onClick={() => {
              if (isUnavailable) toggleSectionOverride(s.id);
              else if (!isHidden) scrollToSection(s.id);
            }}
          >
            <span className="project-toc-icon" style={{ opacity: isUnavailable ? 0.5 : 1 }}>{s.icon}</span>
            <span className="project-toc-label" style={{ color: isUnavailable ? '#9CA3AF' : undefined }}>{s.label}</span>
            {s.badge && !isUnavailable && <span className="project-toc-badge">{s.badge}</span>}
          </button>
          {/* Eye toggle : visible sections can be hidden ; overridden sections can be re-hidden */}
          {(!isUnavailable || isOverridden) && (
            <button
              type="button"
              title={isHidden || isOverridden ? 'Afficher la section' : 'Masquer la section'}
              onClick={() => isOverridden ? toggleSectionOverride(s.id) : toggleSectionVisibility(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', color: (isHidden || isOverridden) ? '#E8794E' : '#6B7280', flexShrink: 0, opacity: (isHidden || isOverridden) ? 1 : 0, transition: 'opacity .15s' }}
              className="toc-eye-btn"
            >
              {(isHidden || isOverridden) ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
        </div>
      );
    };

    return (
      <>
        <div className="app-sidebar-section-label">Fiche projet</div>
        <div className="app-sidebar-section-title">{project.name}</div>
        <div className="project-toc-list">
          {availableSections.map((s, idx) => renderRow(s, idx, false))}
          {unavailableSections.length > 0 && (
            <>
              <div style={{ height: 1, background: '#F0F2F4', margin: '6px 8px' }} />
              {unavailableSections.map((s, idx) => renderRow(s, idx, true))}
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <Layout toc={<ProjectTOC />} noTopbar>
      <style>{
        tocSections.map((s, idx) => `#${s.id}{order:${idx}}`).join('') +
        hiddenSections.map(sid => `#${sid}{display:none!important}`).join('') +
        (project ? tocSections.filter(s => !!unavailableReason(s.id, project.status, activePipeline, configModules) && !overriddenSections.includes(s.id)).map(s => `#${s.id}{display:none!important}`).join('') : '') +
        `.toc-eye-btn{opacity:0!important}.project-toc-list>div:hover .toc-eye-btn{opacity:1!important}` +
        `@keyframes slideUpFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`
      }</style>
      {/* ── Project Topbar — 2 lignes ── */}
      <div className="print-hide" style={{
        position: 'sticky', top: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8EAED', zIndex: 15,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Ligne 1 : breadcrumb + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 20px 0', minHeight: 32 }}>
          <button
            onClick={() => navigate('/projets')}
            style={{ fontSize: 11.5, color: '#7C8089', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0, padding: 0 }}
          >
            Projets
          </button>
          <span style={{ color: '#C8CACD', fontSize: 12, flexShrink: 0 }}>›</span>
          <span style={{ fontSize: 11.5, color: '#15171C', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
            {project.field_assessment?.work_type || WORK_TYPE_LABELS[project.type] || project.name}
            {project.address ? ` · ${project.address}` : ''}
          </span>
          {/* Fermer popover portail au clic à l'extérieur */}
          {portalCopyTarget && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setPortalCopyTarget(null)} />
          )}
          {/* ── Menu "..." ── */}
          <div ref={topMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
            {showTopMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowTopMenu(false)} />}
            <button
              onClick={() => setShowTopMenu(s => !s)}
              style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #E8EAED', background: showTopMenu ? '#F4F5F6' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#3A3D44', fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}
              title="Plus d'options"
            >
              ···
            </button>
            {showTopMenu && (
              <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', borderRadius: 12, border: '1px solid #E8EAED', boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 50, minWidth: 200, padding: '6px 0', overflow: 'hidden' }}>
                <button
                  onClick={() => { setShowTopMenu(false); window.print(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#15171C', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 15 }}>📥</span> Exporter PDF
                </button>
                <button
                  onClick={() => { setShowTopMenu(false); if (project.portal_token) navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#15171C', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 15 }}>🔗</span> Copier lien portail client
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Ligne 2 : onglets */}
        <div style={{ display: 'flex', gap: 2, padding: '0 20px' }}>
          {[
            { key: 'detail', label: 'Fiche projet' },
            { key: 'memoire', label: 'Mémoire' },
            { key: 'communication', label: 'Communications' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              fontSize: 12.5, fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? BRAND : '#7C8089',
              background: 'transparent',
              border: 'none', padding: '6px 12px', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? `2px solid ${BRAND}` : '2px solid transparent',
              transition: 'all .15s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zone sticky notes — couvre hero + toutes sections ── */}
      <div
        ref={stickyContainerRef}
        style={{ position: 'relative' }}
        onMouseDown={handleDetailMouseDown}
        onMouseUp={handleDetailMouseUpGlobal}
        onMouseLeave={handleDetailMouseUp}
        onMouseMove={handleDetailMouseMove}
      >

      {/* ── Capture IA — bouton d'appel à l'action multimodal (tout en haut) ── */}
      <div className="proj-cta-wrap" style={{ padding: '20px 56px', borderBottom: '1px solid #E8EAED', background: '#fff', display: activeTab === 'detail' ? undefined : 'none' }}>
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

        // ── Calendrier réel depuis le Gantt ──
        const allPhases = project.phases || [];
        const phaseStartDates = allPhases.map(ph => ph.start_date ? new Date(ph.start_date.slice(0,10)+'T00:00') : null).filter(Boolean);
        const phaseEndDates = allPhases.map(ph => ph.end_date ? new Date(ph.end_date.slice(0,10)+'T00:00') : null).filter(Boolean);
        const ganttStart = phaseStartDates.length > 0 ? new Date(Math.min(...phaseStartDates.map(d => d.getTime()))) : null;
        const ganttEnd = phaseEndDates.length > 0 ? new Date(Math.max(...phaseEndDates.map(d => d.getTime()))) : null;
        const announcedEndDate = project.end_date ? new Date(project.end_date.slice(0,10)+'T00:00') : null;
        const announcedStartDate = project.start_date ? new Date(project.start_date.slice(0,10)+'T00:00') : null;
        const slipDays = (ganttEnd && announcedEndDate) ? Math.round((ganttEnd.getTime() - announcedEndDate.getTime()) / 86400000) : 0;
        const fmtD = d => d ? d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '—';

        // ── Alertes Flo héro ──
        const today = new Date(); today.setHours(0,0,0,0);
        const in14days = new Date(today.getTime() + 14 * 86400000);
        const upcomingInternalPhases = allPhases.filter(ph => {
          if (!ph.start_date) return false;
          const d = new Date(ph.start_date.slice(0,10)+'T00:00');
          if (d < today || d > in14days) return false;
          // "interne" = pas de sous-traitant assigné ET pas de corps de métier externe évident
          const tradeForPhase = ph.trade_name ? (project.trades || []).find(t => t.trade?.toLowerCase() === ph.trade_name?.toLowerCase()) : null;
          return !tradeForPhase?.chosen_subcontractor_id;
        });
        const hasOrderedMaterial = materialOrders.some(o => ['ordered', 'partial', 'received'].includes(o.status));
        const floHeroAlerts = [
          slipDays > 0 && !dismissedFloHeroAlerts.has('date_slip') && {
            id: 'date_slip',
            icon: '📅',
            msg: `Le Gantt se termine le ${fmtD(ganttEnd)}, soit ${slipDays} jour${slipDays>1?'s':''} après la date annoncée (${fmtD(announcedEndDate)}). Flo peut envoyer un courriel au client.`,
            cta: floEmailLoading ? 'Rédaction…' : 'Préparer un courriel',
            ctaDisabled: floEmailLoading,
            ctaAction: () => prepareDelayEmail({ slipDays, announcedEnd: announcedEndDate, ganttEnd }),
          },
          upcomingInternalPhases.length > 0 && !hasOrderedMaterial && !dismissedFloHeroAlerts.has('material_gap') && {
            id: 'material_gap',
            icon: '📦',
            msg: `Aucune commande de matériel passée avant "${upcomingInternalPhases[0].name}" (${fmtD(new Date(upcomingInternalPhases[0].start_date.slice(0,10)+'T00:00'))}). Pense à commander avant le début.`,
            cta: 'Aller aux commandes',
            ctaAction: () => { setActiveSection('s-materials'); document.getElementById('s-materials')?.scrollIntoView({ behavior: 'smooth' }); },
          },
        ].filter(Boolean);

        return (
          <div id="s-hero" style={{ padding: '36px 56px 32px', background: '#E7EFF4', borderBottom: '1px solid #E8EAED', display: activeTab !== 'detail' ? 'none' : undefined }}>

            {/* Statut */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', background: BRAND, borderRadius: 999, padding: '4px 14px', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.72)', display: 'inline-block' }} />
              Projet · {PIPELINE_LABELS[project.status] || project.status || 'Brouillon'}
            </div>

            {/* ── Alertes Flo ── */}
            {floHeroAlerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFF8F0', border: '1.5px solid #F5C08A', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12.5, color: '#7C4700' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E8794E', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>F</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600 }}>{alert.msg}</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={alert.ctaAction} disabled={alert.ctaDisabled}
                      style={{ fontSize: 11, fontWeight: 700, background: '#E8794E', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', opacity: alert.ctaDisabled ? .6 : 1 }}>
                      {alert.icon} {alert.cta}
                    </button>
                    <button type="button" onClick={() => setDismissedFloHeroAlerts(s => new Set([...s, alert.id]))}
                      style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 4px' }}>
                      Ignorer
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Titre composé — format : Type de travaux | Adresse | Début - Fin (annoncé) */}
            <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', lineHeight: 1.2, color: '#15171C', margin: '0 0 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0 4px' }}>
              <InlineField value={workType} onSave={v => saveAssessmentField('work_type', v)} placeholder="Type de travaux"
                style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }}
                displayStyle={{ fontSize: 42, fontWeight: 900, letterSpacing: '-.03em', color: '#15171C' }} />
              {addr && <span style={{ color: '#C8CACD', fontWeight: 300, padding: '0 4px' }}>|</span>}
              <AddressAutocomplete value={addr}
                onSave={v => saveField('address', v)}
                onCity={city => saveField('city', city)}
                placeholder="Adresse"
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
                { label: 'Budget initial', value: fa.budget_initial ? money(fa.budget_initial) : '', field: 'budget_initial', save: v => saveAssessmentField('budget_initial', parseFloat(v.replace(/[^0-9.]/g, '')) || null), placeholder: '—', w: 130 },
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

            {/* ── Comparaison dates annoncées vs Gantt ── */}
            {(announcedStartDate || announcedEndDate || ganttStart || ganttEnd) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                {/* Dates annoncées */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E8EAED', borderRadius: 9, padding: '5px 12px', fontSize: 12 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF' }}>Annoncé client</span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>
                    {startLabel || fmtD(announcedStartDate)} → {endLabel || fmtD(announcedEndDate)}
                  </span>
                </div>
                {/* Flèche séparateur */}
                {(ganttStart || ganttEnd) && allPhases.length > 0 && (
                  <>
                    <span style={{ color: '#C8CACD', fontSize: 13 }}>vs</span>
                    {/* Dates Gantt */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: slipDays > 0 ? '#FFF8F0' : '#F0F9FF', border: `1px solid ${slipDays > 0 ? '#F5C08A' : '#BAE6FD'}`, borderRadius: 9, padding: '5px 12px', fontSize: 12 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: slipDays > 0 ? '#B45309' : '#0369A1' }}>Gantt réel</span>
                      <span style={{ color: slipDays > 0 ? '#92400E' : '#0C4A6E', fontWeight: 600 }}>
                        {fmtD(ganttStart)} → {fmtD(ganttEnd)}
                      </span>
                      {slipDays > 0 && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', fontWeight: 700, borderRadius: 5, padding: '1px 6px' }}>+{slipDays}j</span>}
                      {slipDays < 0 && <span style={{ fontSize: 10, background: '#DCFCE7', color: '#166534', fontWeight: 700, borderRadius: 5, padding: '1px 6px' }}>{slipDays}j</span>}
                    </div>
                  </>
                )}
              </div>
            )}

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

                  {/* ── Chips de risque Flo (délai / monétaire / réputation) ── */}
                  {allOperationalAlerts.length > 0 && (() => {
                    const RISK_MAP = {
                      delay:            { label: 'Retard calendrier', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', icon: '⏰' },
                      team:             { label: 'Ressource manquante', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', icon: '👷' },
                      material:         { label: 'Risque monétaire', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '📦' },
                      nonconform:       { label: 'Risque réputation', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '⚠️' },
                      material_request: { label: 'Commande manquante', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: '🛒' },
                    };
                    // Déduplique par impact (on n'affiche qu'un chip par type)
                    const seen = new Set();
                    return allOperationalAlerts.filter(a => { if (seen.has(a.type)) return false; seen.add(a.type); return true; }).map(a => {
                      const r = RISK_MAP[a.type] || { label: a.title, color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: '🔔' };
                      return (
                        <div key={a.id} title={a.text} style={{ display: 'flex', alignItems: 'center', gap: 5, background: r.bg, border: `1px solid ${r.border}`, borderRadius: 9, padding: '5px 11px', fontSize: 11.5, fontWeight: 700, color: r.color, cursor: 'default', flexShrink: 0 }}>
                          <span>{r.icon}</span>
                          <span>{r.label}</span>
                        </div>
                      );
                    });
                  })()}

                  {/* Colonne droite : QR + portails */}
                  {(qrData || project.portal_token) && (
                    <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      {qrData && (
                        <button onClick={() => setShowQrModal(true)} title="QR Punch — cliquer pour agrandir"
                          style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 10, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
                          <img src={qrData.qr_image} alt="QR Punch" style={{ width: 44, height: 44, display: 'block', borderRadius: 6 }} />
                        </button>
                      )}
                      {project.portal_token && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {/* Portail client */}
                          <div style={{ position: 'relative' }}>
                            <button title="Portail client" onClick={() => setPortalCopyTarget(portalCopyTarget === 'client' ? null : 'client')}
                              style={{ width: 32, height: 32, borderRadius: 8, background: '#F0EBFD', border: '1px solid #DDD6FE', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 15 }}>🌐</button>
                            {portalCopyTarget === 'client' && (
                              <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 60 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Portail client</p>
                                <p style={{ fontSize: 10.5, color: '#6B7280', margin: '0 0 10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{FRONTEND_URL}/portal/{project.portal_token}</p>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => { navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`); setPortalCopyTarget(null); }}
                                    style={{ flex: 1, fontSize: 11.5, fontWeight: 600, background: BRAND, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 0', cursor: 'pointer' }}>
                                    Copier le lien
                                  </button>
                                  <a href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ! Voici votre lien pour suivre l'avancement de vos travaux en temps réel :\n${FRONTEND_URL}/portal/${project.portal_token}`)}`}
                                    target="_blank" rel="noopener noreferrer" onClick={() => setPortalCopyTarget(null)}
                                    style={{ width: 30, height: 30, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 15, textDecoration: 'none' }} title="WhatsApp">💬</a>
                                  <a href={`${FRONTEND_URL}/portal/${project.portal_token}`} target="_blank" rel="noopener noreferrer" onClick={() => setPortalCopyTarget(null)}
                                    style={{ width: 30, height: 30, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 13, textDecoration: 'none' }} title="Aperçu">↗</a>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Portail fournisseur */}
                          <div style={{ position: 'relative' }}>
                            <button title="Portail fournisseur" onClick={() => setPortalCopyTarget(portalCopyTarget === 'supplier' ? null : 'supplier')}
                              style={{ width: 32, height: 32, borderRadius: 8, background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 15 }}>🏢</button>
                            {portalCopyTarget === 'supplier' && (
                              <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 60 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Portail fournisseur</p>
                                {project.supplier_portal_token ? (
                                  <>
                                    <p style={{ fontSize: 10.5, color: '#6B7280', margin: '0 0 10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{FRONTEND_URL}/supplier-portal/{project.supplier_portal_token}</p>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button onClick={() => { navigator.clipboard.writeText(`${FRONTEND_URL}/supplier-portal/${project.supplier_portal_token}`); setPortalCopyTarget(null); }}
                                        style={{ flex: 1, fontSize: 11, fontWeight: 700, background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 0', cursor: 'pointer' }}>
                                        Copier le lien
                                      </button>
                                      <a href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici votre lien pour suivre l'avancement du projet :\n${FRONTEND_URL}/supplier-portal/${project.supplier_portal_token}`)}`}
                                        target="_blank" rel="noopener noreferrer" onClick={() => setPortalCopyTarget(null)}
                                        style={{ width: 32, display: 'grid', placeItems: 'center', background: '#22c55e', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 14 }} title="Envoyer par WhatsApp">💬</a>
                                      <a href={`${FRONTEND_URL}/supplier-portal/${project.supplier_portal_token}`} target="_blank" rel="noopener noreferrer" onClick={() => setPortalCopyTarget(null)}
                                        style={{ width: 32, display: 'grid', placeItems: 'center', background: '#F3F4F6', color: '#374151', borderRadius: 7, textDecoration: 'none', fontSize: 14, border: '1px solid #E5E7EB' }} title="Aperçu">↗</a>
                                    </div>
                                    <button onClick={async () => { const d = await import('../api.js'); const r = await d.projects.resetSupplierPortalToken(project.id); setProject(p => ({ ...p, supplier_portal_token: r.data.supplier_portal_token })); }}
                                      style={{ marginTop: 8, fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                                      🔄 Générer un nouveau lien
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={async () => { const d = await import('../api.js'); const r = await d.projects.resetSupplierPortalToken(project.id); setProject(p => ({ ...p, supplier_portal_token: r.data.supplier_portal_token })); }}
                                    style={{ width: '100%', fontSize: 11, fontWeight: 700, background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 0', cursor: 'pointer', marginTop: 4 }}>
                                    Activer le portail fournisseur
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}


            {/* Grille éditables — ordre optimisé, responsable permis conditionnel */}
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px 28px' }}>
                {[
                  { label: 'Type de travaux', fn: null, value: workType, isWorkType: true },
                  { label: 'Adresse',               fn: v => saveField('address', v),               value: addr, isAddress: true },
                  { label: 'Date début',            fn: v => saveAssessmentField('start_label', v), value: startLabel },
                  { label: 'Date fin',              fn: v => saveAssessmentField('end_label', v),   value: endLabel },
                  { label: 'Termes paiement',       fn: v => saveField('payment_terms', v),         value: project.payment_terms },
                  { label: 'Chargé de projet',      fn: v => saveField('project_manager', v),       value: project.project_manager },
                  { label: 'Acheteur matériaux',    fn: v => saveField('materials_buyer', v),       value: project.materials_buyer },
                  { label: 'Approbateurs',          fn: v => saveField('approvers', v),             value: (project.approvers || []).join(', ') },
                  { label: 'Machines / équipements',fn: v => saveField('machines', v),              value: (project.machines || []).join(', ') },
                ].map(({ label, fn, value, isWorkType, isAddress }) => (
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
                    ) : isAddress ? (
                      <p style={{ fontSize: 13.5, color: '#15171C', marginTop: 3, fontWeight: 500 }}>
                        <AddressAutocomplete value={value} onSave={fn} onCity={city => saveField('city', city)} placeholder="—" style={IFS} displayStyle={IFD} />
                      </p>
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
                    <div style={{ position: 'absolute', top: 28, left: 0, height: 3, background: BRAND, zIndex: 1, transition: '.4s', width: pipeActiveIdx >= 0 ? `${(pipeActiveIdx / (activePipeline.length - 1)) * 100}%` : '0%' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      {activePipeline.map((s, i) => {
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
                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setEditPipeline(activePipeline.map(s => ({ ...s }))); setShowPipelineEditor(true); }}
                      style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Modifier le pipeline
                    </button>
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
          initialText={floContext}
          onClose={() => { setShowCapture(false); setFloContext(''); }}
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
          projectContext={{
            activeSection: activeSection,
            name: project.name,
            status: project.status,
            phases: project.phases,
            recommendations: project.flo_recommendations,
            estimated_value: project.contract_value || project.budget,
            type_of_work: project.type_of_work,
          }}
          onClose={() => setShowAIChat(false)}
        />
      )}

      {/* ── Bulle opérationnelle Flo ── */}
      {!showAIChat && proactiveTip && (() => {
        const ALERT_STYLES = {
          delay:           { border: '#FCA5A5', dot: '#DC2626', bg: '#FFF5F5', label: 'Retard calendrier' },
          team:            { border: '#FED7AA', dot: '#EA580C', bg: '#FFF7ED', label: 'Équipe incomplète' },
          material:        { border: '#FDE68A', dot: '#D97706', bg: '#FFFBEB', label: 'Commande en retard' },
          nonconform:      { border: '#FCA5A5', dot: '#DC2626', bg: '#FFF5F5', label: 'Non-conformité' },
          material_request:{ border: '#BAE6FD', dot: '#0284C7', bg: '#F0F9FF', label: 'Demande de matériel' },
        };
        const st = ALERT_STYLES[proactiveTip.type] || { border: '#E8EAED', dot: BRAND, bg: '#fff', label: 'Info Flo' };
        return (
          <div style={{
            position: 'fixed', bottom: 90, right: 20, zIndex: 60,
            width: 300, background: st.bg,
            border: `1.5px solid ${st.border}`,
            borderRadius: 16, padding: '14px 14px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,.14)',
            animation: 'slideUpFade .3s ease',
          }}>
            <button onClick={() => {
              setProactiveDismissedSections(s => new Set([...s, proactiveTip.section]));
              setProactiveTip(null);
            }} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#C4C8CE', padding: 2 }}>
              <X size={13}/>
            </button>
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E8794E', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>F</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: st.dot, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.08em' }}>{st.label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#15171C', margin: '0 0 4px' }}>{proactiveTip.title}</p>
                <p style={{ fontSize: 11.5, color: '#374151', margin: '0 0 10px', lineHeight: 1.5 }}>{proactiveTip.text}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setShowAIChat(true); setProactiveTip(null); }}
                    style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: '#E8794E', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                    Parler à Flo →
                  </button>
                  <button onClick={() => {
                    setProactiveDismissedSections(s => new Set([...s, proactiveTip.section]));
                    setProactiveTip(null);
                  }} style={{ fontSize: 10.5, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 4px' }}>
                    Ignorer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Bouton flottant Chat IA ── */}
      {!showAIChat && (
        <button className="ai-float-btn" onClick={() => setShowAIChat(true)} title="Parler à Florence — assistante IA">
          <Sparkles size={22} />
          {proactiveTip && (
            <span style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: proactiveTip.type === 'delay' || proactiveTip.type === 'nonconform' ? '#DC2626' : '#EA580C', border: '2px solid #fff' }}/>
          )}
        </button>
      )}

      {/* ── Modal : Créer une demande de modification ── */}
      {showExtraForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'grid', placeItems: 'center', fontSize: 18 }}>⚡</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#15171C' }}>Demande de modification</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Extra ou travail hors contrat original</p>
                </div>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowExtraForm(false)}><X size={18}/></button>
            </div>
            <form onSubmit={createExtraInline} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label className="label">Titre *</label><input className="input" value={extraForm.title} onChange={e => setExtraForm(f => ({...f, title: e.target.value}))} placeholder="Ex : Ajout d'une fenêtre patio" required /></div>
                <div><label className="label">Description</label><textarea className="input" rows={3} style={{ resize: 'vertical' }} value={extraForm.description} onChange={e => setExtraForm(f => ({...f, description: e.target.value}))} placeholder="Détails des travaux supplémentaires..." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="label">Montant estimé ($)</label><input className="input" type="number" min="0" step="0.01" value={extraForm.amount} onChange={e => setExtraForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" /></div>
                  <div><label className="label">Notes internes</label><input className="input" value={extraForm.notes} onChange={e => setExtraForm(f => ({...f, notes: e.target.value}))} placeholder="Notes équipe" /></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowExtraForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary text-xs" disabled={savingExtra || !extraForm.title}>
                  {savingExtra ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>} Créer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
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

      {/* ── Modal courriel Flo — retard ou commande ── */}
      {floEmailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setFloEmailModal(null); }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#E8794E', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800 }}>F</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#15171C' }}>Courriel préparé par Flo</p>
                <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Relis, modifie si besoin, puis copie ou envoie.</p>
              </div>
              <button onClick={() => setFloEmailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}><X size={16}/></button>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Objet</label>
              <input className="input" value={floEmailModal.subject}
                onChange={e => setFloEmailModal(m => ({ ...m, subject: e.target.value }))}
                style={{ fontSize: 13, fontWeight: 600 }}/>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Corps du message</label>
              <textarea className="input resize-none" rows={10} value={floEmailModal.body}
                onChange={e => setFloEmailModal(m => ({ ...m, body: e.target.value }))}
                style={{ fontSize: 13, lineHeight: 1.65 }}/>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { navigator.clipboard.writeText(`Objet : ${floEmailModal.subject}\n\n${floEmailModal.body}`); }}
                style={{ fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Copy size={12}/> Copier
              </button>
              {project.client_email && (
                <a href={`mailto:${project.client_email}?subject=${encodeURIComponent(floEmailModal.subject)}&body=${encodeURIComponent(floEmailModal.body)}`}
                  style={{ fontSize: 12, fontWeight: 700, background: '#E8794E', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                  <Send size={12}/> Ouvrir dans le client courriel
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Doc sections (detail tab only) ── */}
      <div style={{ display: activeTab === 'detail' ? 'flex' : 'none', flexDirection: 'column' }}>

        {/* ── Descriptif de la demande ── */}
        {(() => {
          const fa = project.field_assessment || {};
          const vision = fa.vision || {};
          const inspirations = vision.inspirations || [];
          const storedAnalysis = fa.plan_analysis || planAnalysis;
          const planUrl = fa.plan_url;

          const SubLabel = ({ children }) => (
            <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', margin: 0 }}>{children}</p>
          );

          const addInspiration = async (url) => {
            if (!url.trim()) return;
            const next = [...inspirations, url.trim()];
            setVisionInspirationInput('');
            await saveVisionField({ inspirations: next });
          };

          const removeInspiration = async (idx) => {
            const next = inspirations.filter((_, i) => i !== idx);
            await saveVisionField({ inspirations: next });
          };

          return (
            <ProjectSection
              sectionId="s-description"
              icon="📝"
              title="Descriptif de la demande"
              summary={sectionSummaries['s-description']?.summary}
              stats={sectionSummaries['s-description']?.stats}
              expanded={!!sectionExpanded['s-description']}
              onToggle={() => toggleProjectSection('s-description')}
              background="#fff"
              borderTop="1px solid #E8EAED"
            >

              {/* ─── 1. Description des besoins ─── */}
              <div style={{ padding: '22px 56px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <SubLabel>Descriptif de la demande</SubLabel>
                </div>
                <InlineField
                  value={project.description || ''}
                  onSave={v => saveField('description', v)}
                  placeholder="Décris ici la demande du client, la portée des travaux, les contraintes particulières…"
                  multiline
                  style={{ fontSize: 14, color: '#3F3F46', fontWeight: 400, lineHeight: 1.65, maxWidth: 760 }}
                  displayStyle={{ fontSize: 14, color: project.description ? '#3F3F46' : '#B0B3BA', fontWeight: 400, lineHeight: 1.65, maxWidth: 760 }}
                />
                {showClientReply && (
                  <div style={{ marginTop: 12, padding: 14, background: '#F8FAFB', borderRadius: 10, border: '1px solid #E8EAED' }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: '#4B5563', margin: '0 0 8px' }}>Colle ici la réponse reçue du client — elle remplacera le descriptif actuel.</p>
                    <textarea value={clientReplyText} onChange={e => setClientReplyText(e.target.value)}
                      placeholder="Copie-colle le courriel ou message du client ici…"
                      style={{ width: '100%', minHeight: 100, padding: '10px 12px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#15171C' }}/>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button disabled={!clientReplyText.trim()}
                        onClick={async () => { await saveField('description', clientReplyText.trim()); setShowClientReply(false); setClientReplyText(''); }}
                        className="btn-primary text-xs">Enregistrer comme descriptif</button>
                      <button onClick={() => { setShowClientReply(false); setClientReplyText(''); }} className="btn-secondary text-xs">Annuler</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── 2. Photos et documents pré-chantier ─── */}
              <div style={{ padding: '0 56px 22px', borderTop: '1px solid #F4F5F6' }}
                onDragOver={e => { e.preventDefault(); setPhotoDragOver(true); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPhotoDragOver(false); }}
                onDrop={async e => {
                  e.preventDefault(); setPhotoDragOver(false);
                  const droppedFiles = Array.from(e.dataTransfer.files);
                  if (!droppedFiles.length) return;
                  const token = localStorage.getItem('token');
                  for (const file of droppedFiles) {
                    const fd = new FormData();
                    fd.append('file', file); fd.append('project_id', id);
                    fd.append('type', file.type.startsWith('image/') ? 'photo' : file.type.startsWith('video/') ? 'video' : 'document');
                    fd.append('caption', file.name);
                    try {
                      const res = await fetch(`${PROJ_API_BASE}/media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                      if (res.ok) { const data = await res.json(); setMedia(prev => [data, ...prev]); }
                    } catch {}
                  }
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 10px' }}>
                  <SubLabel>Photos et documents pré-chantier</SubLabel>
                  {(media.length > 0 || (project.documents || []).length > 0) && (
                    <span style={{ fontSize: 10, color: '#C4C8CE' }}>{media.length + (project.documents || []).length} fichier{media.length + (project.documents || []).length !== 1 ? 's' : ''}</span>
                  )}
                  {photoDragOver && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: BRAND, fontWeight: 700, background: `${BRAND}12`, border: `1.5px dashed ${BRAND}`, borderRadius: 7, padding: '3px 10px' }}>
                      Déposer ici
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', alignItems: 'flex-start' }}>
                  {media.map(m => (
                    <div key={m.id} style={{ flexShrink: 0, width: 120, height: 90, borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', background: '#F4F5F6', position: 'relative', cursor: 'pointer' }}
                      onClick={() => setLightboxItem(m)}>
                      {m.type === 'photo' && m.url
                        ? <img src={m.url} alt={m.caption || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        : m.type === 'video'
                          ? <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#1C1C1E', color: '#fff', fontSize: 28 }}>▶</div>
                          : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 28 }}>📎</div>}
                      {m.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9.5, padding: '3px 6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.caption}</div>}
                    </div>
                  ))}
                  {(project.documents || []).map(d => (
                    <div key={d.id} style={{ flexShrink: 0, width: 120, height: 90, borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', background: '#F8FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', padding: 8, boxSizing: 'border-box' }}
                      onClick={() => setLightboxItem({ ...d, type: 'doc' })}>
                      <span style={{ fontSize: 26 }}>📄</span>
                      <span style={{ fontSize: 9.5, color: '#4B5563', textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || d.filename || 'Document'}</span>
                    </div>
                  ))}
                  {/* Tuile + toujours présente à la fin */}
                  <button onClick={() => setShowCapture(true)}
                    style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 10, border: '1.5px dashed #D1D5DB', background: photoDragOver ? `${BRAND}08` : '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#9CA3AF', transition: 'all .15s', padding: 0 }}>
                    <Plus size={20} strokeWidth={1.5}/>
                    <span style={{ fontSize: 9.5 }}>Ajouter</span>
                  </button>
                </div>
                {(media.length === 0 && (project.documents || []).length === 0) && !photoDragOver && (
                  <p style={{ fontSize: 11.5, color: '#B0B3BA', margin: '2px 0 0', fontStyle: 'italic' }}>Glisse des fichiers ici ou clique sur + pour ajouter des photos et documents.</p>
                )}
              </div>

              {/* ─── 3. Vision + Prévisualisation IA ─── */}
              <div style={{ padding: '0 56px 26px', borderTop: '1px solid #F4F5F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 12px' }}>
                  <SubLabel>Vision</SubLabel>
                </div>

                {/* Plans d'architecte et Images d'inspiration — AVANT la textarea */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 8px' }}>Plans d'architecte et Images d'inspiration</p>
                  <input ref={planUploadRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) analyzePlan(f); e.target.value = ''; }}/>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', alignItems: 'flex-start' }}>
                    {planUrl && (
                      <div style={{ flexShrink: 0, width: 110, height: 82, borderRadius: 9, border: `1.5px solid ${BRAND}40`, background: `${BRAND}06`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', position: 'relative' }}
                        onClick={() => window.open(planUrl, '_blank')}>
                        <span style={{ fontSize: 26 }}>📐</span>
                        <span style={{ fontSize: 9.5, color: BRAND, fontWeight: 600 }}>Voir plan ↗</span>
                        {planAnalysisLoading && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9 }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: BRAND }}/>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tuile + pour uploader un plan */}
                    <button onClick={() => planUploadRef.current?.click()}
                      style={{ flexShrink: 0, width: 90, height: 82, borderRadius: 9, border: '1.5px dashed #D1D5DB', background: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                      <Plus size={18} strokeWidth={1.5}/>
                      <span style={{ fontSize: 9.5 }}>{planUrl ? 'Remplacer' : 'Plan'}</span>
                    </button>
                  </div>
                </div>

                {/* Zone texte vision + bouton génération côte à côte */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <textarea
                    value={vision.text || ''}
                    onChange={e => {
                      const v = e.target.value;
                      setProject(p => ({ ...p, field_assessment: { ...(p.field_assessment || {}), vision: { ...(p.field_assessment?.vision || {}), text: v } } }));
                    }}
                    onBlur={e => saveVisionField({ text: e.target.value })}
                    rows={4}
                    placeholder="Décris la vision du projet, le style souhaité, les matériaux envisagés… Colle des liens Pinterest, Houzz, Instagram ou toute référence."
                    style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #E0E4E8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: '#15171C', lineHeight: 1.65 }}
                  />
                  <button onClick={() => generatePreview(vision.text)}
                    disabled={floGenLoading || !(vision.text || '').trim()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '12px 14px', borderRadius: 10, border: 'none', background: BRAND, color: '#fff', fontSize: 11, fontWeight: 700, cursor: floGenLoading || !(vision.text || '').trim() ? 'default' : 'pointer', opacity: !(vision.text || '').trim() ? 0.4 : 1, flexShrink: 0, minWidth: 80, alignSelf: 'stretch' }}>
                    {floGenLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={15}/>}
                    <span style={{ lineHeight: 1.3, textAlign: 'center' }}>{floGenLoading ? 'Génération…' : 'Générer\nprévisualisation'}</span>
                  </button>
                </div>

                {/* Tableau analyse du plan */}
                {storedAnalysis && (
                  <div style={{ marginTop: 4 }}>
                    {storedAnalysis.general && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                        {[['Superficie', storedAnalysis.general.superficie_totale], ['Pièces', storedAnalysis.general.nb_pieces], ['Style', storedAnalysis.general.style], ['Contraintes', storedAnalysis.general.contraintes_particulieres]].filter(([, v]) => v).map(([label, val]) => (
                          <div key={label} style={{ background: '#F8F9FA', borderRadius: 8, padding: '5px 12px', border: '1px solid #E8EAED' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }}>{label}</span>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(storedAnalysis.specialisations || []).filter(s => s.items?.length > 0).map(spec => (
                      <div key={spec.metier} style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 10.5, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: BRAND }}/>
                          {spec.metier}
                        </p>
                        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E8EAED' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                            <thead>
                              <tr style={{ background: '#F8F9FA' }}>
                                {['Élément', 'Détail', 'Quantité / mesure', 'Notes chantier'].map(h => (
                                  <th key={h} style={{ padding: '6px 10px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E8EAED' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {spec.items.map((it, i) => (
                                <tr key={i} style={{ borderBottom: i < spec.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                  <td style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{it.element}</td>
                                  <td style={{ padding: '6px 10px', fontSize: 12, color: '#374151' }}>{it.detail}</td>
                                  <td style={{ padding: '6px 10px', fontSize: 11.5, color: '#6B7280', whiteSpace: 'nowrap' }}>{it.quantite || '—'}</td>
                                  <td style={{ padding: '6px 10px', fontSize: 11, color: '#9CA3AF' }}>{it.notes_chantier || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rendus générés */}
                {generatedPreviews.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 10px' }}>Prévisualisations générées</p>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                      {generatedPreviews.map(prev => (
                        <div key={prev.id} style={{ flexShrink: 0, width: 240, borderRadius: 12, overflow: 'hidden', border: '1px solid #E8EAED', background: '#F8F9FA' }}>
                          <img src={prev.url} alt={prev.prompt} loading="lazy"
                            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; }}/>
                          <div style={{ padding: '8px 10px 9px' }}>
                            <p style={{ fontSize: 10.5, color: '#6B7280', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prev.prompt}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                              <a href={prev.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: BRAND, fontWeight: 700, textDecoration: 'none' }}>Voir grand ↗</a>
                              <button onClick={() => { const next = generatedPreviews.filter(p => p.id !== prev.id); setGeneratedPreviews(next); localStorage.setItem(`monflux-gen-previews-${id}`, JSON.stringify(next)); }}
                                style={{ fontSize: 10, color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>Supprimer</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {generatedPreviews.length === 0 && !floGenLoading && (vision.text || '').trim() && (
                  <p style={{ fontSize: 11.5, color: '#C4C8CE', fontStyle: 'italic', marginTop: 6 }}>Clique "Générer prévisualisation" pour voir un rendu photoréaliste du résultat final.</p>
                )}
              </div>

            </ProjectSection>
          );
        })()}

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
            <ProjectSection
              sectionId="s-estimation"
              icon="📊"
              title="Estimation approximative"
              summary={sectionSummaries['s-estimation']?.summary}
              stats={sectionSummaries['s-estimation']?.stats}
              expanded={!!sectionExpanded['s-estimation']}
              onToggle={() => toggleProjectSection('s-estimation')}
              background="#E9F3EC"
              bodyStyle={{ opacity: salesLocked ? 0.7 : 1, pointerEvents: salesLocked ? 'none' : 'auto' }}
            >
              {sectionGuard('s-estimation')}

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
                          <button key={n} onClick={() => { setRelanceCount(n); saveAssessmentField('relances_count', n); localStorage.setItem(`monflux-relances-count-${id}`, n); }}
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
                            <button key={v} onClick={() => { setRelanceFrequency(v); saveAssessmentField('relances_freq', v); localStorage.setItem(`monflux-relances-freq-${id}`, v); }}
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
                              saveAssessmentField('relances_methods', next);
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
            </ProjectSection>
          );
        })()}


        {/* ── Phases du projet ── */}
        <ProjectSection
          sectionId="s-pipeline"
          icon="🏗️"
          title="Phases du projet"
          summary={sectionSummaries['s-pipeline']?.summary}
          stats={sectionSummaries['s-pipeline']?.stats}
          expanded={!!sectionExpanded['s-pipeline']}
          onToggle={() => toggleProjectSection('s-pipeline')}
          background="#E7EFF4"
        >

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
            ) : (() => {
              const existing = new Set((project.phases || []).map(p => p.name?.toLowerCase()));
              const available = recommendedPhaseTemplates.map(tpl => ({ ...tpl, trade_name: toTradeLabel(tpl.trade_name) })).filter(tpl => !existing.has(tpl.name.toLowerCase()));
              const hasPlaybook = Boolean(projectTypePlaybook?.phases?.length);
              const bulkLabel = projectWorkType || 'ce projet';
              return (
                <div style={{ padding:'28px 24px', textAlign:'center' }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:BRAND_SOFT, display:'grid', placeItems:'center', margin:'0 auto 12px' }}>
                    <Sparkles size={18} color={BRAND}/>
                  </div>
                  <p style={{ fontSize:14, fontWeight:800, color:'#15171C', margin:'0 0 4px' }}>Aucune phase pour le moment</p>
                  <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 18px' }}>Génère un planning complet avec Flo ou ajoute les étapes recommandées.</p>
                  <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                    <button onClick={adjustPhasesWithAI} disabled={generatingPhases}
                      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, border:'none', background:BRAND, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {generatingPhases ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                      {generatingPhases ? 'Génération…' : 'Générer avec Flo'}
                    </button>
                    {hasPlaybook && (
                      <button onClick={() => applyProjectTypePlaybook({ replaceExisting: false, source: 'manual' })} disabled={addingTemplatePhase === '__batch__'}
                        style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, border:`1.5px solid ${BRAND_BORDER}`, background:BRAND_SOFT, color:BRAND_DARK, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        {addingTemplatePhase === '__batch__' ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>}
                        {`Ajouter les étapes de ${bulkLabel}`}
                      </button>
                    )}
                  </div>
                  {available.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' }}>
                      {available.slice(0, 8).map(tpl => (
                        <button key={tpl.name} onClick={() => addTemplatePhase(tpl)} disabled={addingTemplatePhase === tpl.name}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #E0E4E8', background:'#FAFAFA', fontSize:11, fontWeight:600, color:'#3A3D44', cursor:'pointer' }}>
                          <Plus size={9}/>{tpl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          {/* ── Section "Étapes recommandées" — sous le Gantt, seulement si des phases existent déjà ── */}
          {(() => {
            if (!project.phases?.length) return null; // L'état vide les montre déjà
            const existing = new Set((project.phases || []).map(p => p.name?.toLowerCase()));
            const available = recommendedPhaseTemplates.map(tpl => ({ ...tpl, trade_name: toTradeLabel(tpl.trade_name) })).filter(tpl => !existing.has(tpl.name.toLowerCase()));
            const hasPlaybook = Boolean(projectTypePlaybook?.phases?.length);
            const bulkLabel = projectWorkType || 'ce projet';
            if (!available.length) return null; // Tout est déjà ajouté
            return (
              <div style={{ borderTop:'1px solid #F4F5F6', padding:'10px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF' }}>
                    {hasPlaybook ? `Étapes recommandées · ${bulkLabel}` : 'Phases suggérées'}
                  </span>
                  {hasPlaybook && (
                    <button onClick={() => applyProjectTypePlaybook({ replaceExisting: false, source: 'manual' })} disabled={addingTemplatePhase === '__batch__'}
                      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:7, border:`1px solid ${BRAND_BORDER}`, background:BRAND_SOFT, color:BRAND_DARK, fontSize:11, fontWeight:700, cursor:'pointer', marginLeft:'auto' }}>
                      {addingTemplatePhase === '__batch__' ? <Loader2 size={9} className="animate-spin"/> : <Plus size={9}/>}
                      {`Ajouter toutes les étapes de ${bulkLabel}`}
                    </button>
                  )}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {available.map(tpl => (
                    <button key={tpl.name} onClick={() => addTemplatePhase(tpl)} disabled={addingTemplatePhase === tpl.name || addingTemplatePhase === '__batch__'}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #E0E4E8', background: addingTemplatePhase === tpl.name ? '#F4F5F6' : '#FAFAFA', fontSize:11, fontWeight:600, color:'#3A3D44', cursor:'pointer' }}>
                      {addingTemplatePhase === tpl.name ? <Loader2 size={9} className="animate-spin"/> : <Plus size={9} color={BRAND}/>}
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Florence — Ajuster avec Flo + conseils ── */}
          <div style={{ borderTop: '1px solid #F4F5F6', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: BRAND, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Sparkles size={13} color="#fff"/>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12.5, fontWeight: 800, color: '#15171C', margin: 0 }}>
                  {project.phases?.length > 0 ? 'Ajuster le planning avec Flo' : 'Générer les phases avec Flo'}
                </p>
                <p style={{ fontSize: 11, color: '#7C8089', margin: '1px 0 0' }}>
                  {project.phases?.length > 0 ? 'Flo recalcule les dates, l\'ordre logique et les durées ouvrables, en tenant compte des jours fériés du Québec.' : 'Flo analyse le contexte et construit un planning adapté au chantier réel.'}
                </p>
              </div>
              <button onClick={adjustPhasesWithAI} disabled={generatingPhases}
                style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: BRAND, fontSize: 12, fontWeight: 700, color: '#fff', cursor: generatingPhases ? 'wait' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                {generatingPhases ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                {generatingPhases ? 'Ajustement…' : project.phases?.length > 0 ? 'Ajuster avec Flo' : 'Générer avec Flo'}
              </button>
            </div>
            {aiNotice && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
                <p className="text-xs text-amber-700">{aiNotice}</p>
                <button className="ml-auto text-amber-400 hover:text-amber-600" onClick={() => setAiNotice('')}><X size={13}/></button>
              </div>
            )}
            {aiRecommendations.length > 0 && (
              <div style={{ marginTop:12, borderTop:'1px solid #F4F5F6', paddingTop:10 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 8px', display:'flex', alignItems:'center', gap:5 }}>
                  <Sparkles size={10}/> Conseils de Flo
                </p>
                <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:5 }}>
                  {aiRecommendations.map((rec, i) => (
                    <li key={i} style={{ display:'flex', gap:6, fontSize:11.5, color:'#3A3D44', lineHeight:1.4 }}>
                      <span style={{ color:BRAND, flexShrink:0, fontWeight:800 }}>›</span>
                      {rec}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setAiRecommendations([])} style={{ marginTop:6, fontSize:10, color:'#C0C4CC', background:'transparent', border:'none', cursor:'pointer', padding:0 }}>
                  Masquer les conseils
                </button>
              </div>
            )}
          </div>
          </div>{/* fin carte blanche Gantt+Florence */}

        </ProjectSection>{/* fin s-pipeline */}

        {/* ── Équipe & conformité ── */}
        <ProjectSection
          sectionId="s-equipe"
          icon="🤝"
          title="Équipe et conformité"
          summary={sectionSummaries['s-equipe']?.summary}
          stats={sectionSummaries['s-equipe']?.stats}
          expanded={!!sectionExpanded['s-equipe']}
          onToggle={() => toggleProjectSection('s-equipe')}
          background="#F5F0FF"
        >

          {/* Bannière confirmation merge/reset */}
          {floMergePending && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:11, background:'#FFFBEB', border:'1.5px solid #FDE68A', marginBottom:16 }}>
              <Sparkles size={14} color="#D97706"/>
              <p style={{ fontSize:12, fontWeight:700, color:'#92400E', margin:0, flex:1 }}>Des données existent déjà dans le tableau. Que faire ?</p>
              <button onClick={() => applyFloRecos(floMergePending, 'merge')}
                style={{ padding:'5px 13px', borderRadius:7, border:'1.5px solid #D97706', background:'#fff', color:'#D97706', fontSize:11, fontWeight:800, cursor:'pointer' }}>
                ✓ Ajouter aux existants
              </button>
              <button onClick={() => applyFloRecos(floMergePending, 'reset')}
                style={{ padding:'5px 13px', borderRadius:7, border:'none', background:'#D97706', color:'#fff', fontSize:11, fontWeight:800, cursor:'pointer' }}>
                🔄 Repartir de zéro
              </button>
            </div>
          )}

          {/* Panneau résultats Flo */}
          {showFloPanel && (() => {
            const typeConf = {
              internal: { label:'Employé interne',    color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', icon:'🏠' },
              known:    { label:'Sous-traitant connu',color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', icon:'⭐' },
              new:      { label:'Nouveau',            color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE', icon:'🔍' },
            };
            const hasRecos = tradeRecos && Object.keys(tradeRecos).length > 0;
            return (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E0D5FF', padding:'16px 20px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: hasRecos ? 14 : 4 }}>
                  <Sparkles size={13} color={BRAND}/>
                  <p style={{ fontSize:12, fontWeight:700, color:'#3A3D44', margin:0, flex:1 }}>Recommandations Flo — ajoutées automatiquement au tableau</p>
                  <button onClick={() => fetchTradeRecos(null)} disabled={loadingTradeRecos}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:8, border:`1.5px solid ${BRAND}`, background:`${BRAND}10`, fontSize:10.5, fontWeight:700, color:BRAND, cursor:'pointer' }}>
                    {loadingTradeRecos ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                    {loadingTradeRecos ? 'Analyse…' : '↺ Rafraîchir'}
                  </button>
                </div>
                {loadingTradeRecos && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', color:'#9CA3AF' }}>
                    <Loader2 size={13} className="animate-spin"/> <span style={{ fontSize:12 }}>Flo analyse les corps de métier…</span>
                  </div>
                )}
                {!loadingTradeRecos && !hasRecos && tradeRecos && (
                  <p style={{ fontSize:11.5, color:'#9CA3AF', fontStyle:'italic', margin:0 }}>Aucune correspondance — ajoute des phases dans le Gantt pour que Flo sache quels corps de métier sont requis.</p>
                )}
                {hasRecos && Object.entries(tradeRecos).map(([tradeName, recos]) => (
                  <div key={tradeName} style={{ marginBottom:12 }}>
                    <p style={{ fontSize:10, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 6px' }}>{tradeName}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {(recos||[]).map((r, i) => {
                        const tc = typeConf[r.type] || typeConf.new;
                        const siteHref = r.source_url || (r.website ? (r.website.startsWith('http') ? r.website : `https://${r.website}`) : null);
                        const alreadyAdded = (tradeResourcesMap[tradeName]?.internal||[]).concat(tradeResourcesMap[tradeName]?.external||[]).some(p => (typeof p === 'string' ? p : p.name) === r.name);
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:tc.bg, border:`1px solid ${tc.border}` }}>
                            <span style={{ fontSize:13, flexShrink:0 }}>{tc.icon}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:'#15171C' }}>{r.name}</span>
                              {r.note && <span style={{ fontSize:10.5, color:'#6B7280', marginLeft:6 }}>{r.note}</span>}
                            </div>
                            {r.phone && <a href={`tel:${r.phone}`} style={{ fontSize:10, color:'#2563EB', fontWeight:700, textDecoration:'none', background:'#EFF6FF', borderRadius:5, padding:'2px 7px', flexShrink:0 }}>📞</a>}
                            {r.email && <a href={`mailto:${r.email}`} style={{ fontSize:10, color:'#2563EB', fontWeight:700, textDecoration:'none', background:'#EFF6FF', borderRadius:5, padding:'2px 7px', flexShrink:0 }}>✉</a>}
                            {siteHref && <a href={siteHref} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:tc.color, fontWeight:700, textDecoration:'none', background:'#fff', border:`1px solid ${tc.border}`, borderRadius:5, padding:'2px 7px', flexShrink:0 }}>↗</a>}
                            {alreadyAdded
                              ? <span style={{ fontSize:10, color:'#16A34A', fontWeight:700, padding:'2px 7px', flexShrink:0 }}>✓ Ajouté</span>
                              : <button onClick={() => addFloRecoToTeam(tradeName, r)} style={{ fontSize:10, fontWeight:800, color:'#fff', background:tc.color, border:'none', borderRadius:5, padding:'2px 8px', cursor:'pointer', flexShrink:0 }}>+</button>
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {(() => {
            const phases = project.phases || [];
            const phaseTradeNames = [...new Set(phases.map((ph) => ph.trade_name).filter(Boolean))];
            const tradesFromProject = project.trades || [];
            const rowNames = [...new Set([
              ...tradesFromProject.map((trade) => trade.trade).filter(Boolean),
              ...phaseTradeNames,
            ])];

            if (!rowNames.length) return null;

            // Statuts séparés : interne vs externe
            const internalStatuses = [
              { key: 'prequalifie_flo', label: '⭐ Pré-qualifié Flo', color: '#7C3AED', bg: '#F5F3FF' },
              { key: 'a_contacter',     label: 'À contacter',         color: '#E8794E', bg: '#FFF1EB' },
              { key: 'contacte',        label: 'Contacté',            color: '#F59E0B', bg: '#FFF7E8' },
              { key: 'disponible',      label: 'Disponible',          color: '#3B82F6', bg: '#EFF6FF' },
              { key: 'en_negociation',  label: 'En négociation',      color: '#D97706', bg: '#FFFBEB' },
              { key: 'confirme',        label: 'Confirmé',            color: '#16A34A', bg: '#ECFDF3' },
              { key: 'refuse',          label: 'Refusé',              color: '#DC2626', bg: '#FFF5F5' },
              { key: 'termine',         label: 'Terminé',             color: '#6B7280', bg: '#F9FAFB' },
            ];
            const externalStatuses = [
              { key: 'prequalifie_flo', label: '⭐ Pré-qualifié Flo', color: '#7C3AED', bg: '#F5F3FF' },
              { key: 'a_contacter',     label: 'À contacter',         color: '#E8794E', bg: '#FFF1EB' },
              { key: 'contacte',        label: 'Contacté',            color: '#F59E0B', bg: '#FFF7E8' },
              { key: 'soumis',          label: 'Soumission reçue',    color: '#3B82F6', bg: '#EFF6FF' },
              { key: 'en_negociation',  label: 'En négociation',      color: '#D97706', bg: '#FFFBEB' },
              { key: 'accepte',         label: 'Accepté',             color: '#16A34A', bg: '#ECFDF3' },
              { key: 'refuse',          label: 'Refusé',              color: '#DC2626', bg: '#FFF5F5' },
              { key: 'termine',         label: 'Terminé',             color: '#6B7280', bg: '#F9FAFB' },
            ];
            // Légende unique (union) pour le filtre
            const allStatuses = [...new Map([...internalStatuses, ...externalStatuses].map(s => [s.key, s])).values()];

            const parsePersons = (arr) => (arr || []).map(p =>
              typeof p === 'string'
                ? { name: p, status: 'a_contacter', phone: '', email: '', location: '' }
                : { phone: '', email: '', location: '', ...p }
            );

            const isDateExpired = (d) => d && new Date(d) < new Date();
            // Only fail if explicitly unchecked OR if a date was entered and is expired
            const isCertFail = (c) => {
              if (!c || (c.ok === undefined && !c.validite && !c.lastCheck)) return false;
              if (c.ok === false) return true;
              if (c.ok === true && c.validite && isDateExpired(c.validite)) return true;
              return false;
            };
            const isPersonNonConforme = (cert, personStatus) => {
              if (personStatus === 'a_contacter') return false;
              return isCertFail(cert?.rbq) || isCertFail(cert?.ccq) || isCertFail(cert?.insurance);
            };
            const personKey = (tn, type, pi) => `${tn}||${type}||${pi}`;

            const hS = { fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#A8AEB6' };

            // Badge conformité dépliable — vert/ambre/rouge — remplace les 3 checkboxes séparées
            const renderConformiteBadge = (cert, openKey, setOpenKey, type, pi) => {
              const certs = [
                { key: 'rbq',       label: 'RBQ',       color: '#7C3AED' },
                { key: 'ccq',       label: 'CCQ',       color: '#2563EB' },
                { key: 'insurance', label: 'Assurance', color: '#059669' },
              ];
              const isOpen = openKey === `${type}||${pi}`;

              // Compute overall status
              const statuses = certs.map(({ key }) => {
                const c = cert[key] || {};
                if (isCertFail(c)) return 'red';
                if (c.ok === true && !isDateExpired(c.validite)) return 'green';
                return 'amber';
              });
              const overall = statuses.some(s => s === 'red') ? 'red'
                : statuses.every(s => s === 'green') ? 'green'
                : 'amber';
              const badgeColor = overall === 'green' ? '#16A34A' : overall === 'red' ? '#DC2626' : '#D97706';
              const badgeBg    = overall === 'green' ? '#F0FDF4' : overall === 'red' ? '#FFF5F5' : '#FFFBEB';
              const badgeLabel = overall === 'green' ? '✓ Conforme' : overall === 'red' ? '✗ Non conforme' : '⚠ À vérifier';
              const nOk = statuses.filter(s => s === 'green').length;

              return (
                <div>
                  {/* Pill badge — click to toggle */}
                  <button
                    onClick={() => setOpenKey(isOpen ? null : `${type}||${pi}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, border: `1.5px solid ${badgeColor}40`, background: badgeBg, color: badgeColor, fontSize: 9.5, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {badgeLabel}
                    <span style={{ fontSize: 8.5, opacity: 0.7 }}>{nOk}/3</span>
                    <span style={{ fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Expanded detail rows */}
                  {isOpen && (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {certs.map(({ key, label, color }) => {
                        const c = cert[key] || {};
                        const expired = c.ok === true && isDateExpired(c.validite);
                        const fail = isCertFail(c);
                        const sc = c.ok && !expired ? color : fail ? '#DC2626' : '#C4C8CE';
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: '#FAFAFA', borderRadius: 7, border: `1px solid ${sc}20` }}>
                            <input type="checkbox" checked={!!c.ok} onChange={e => updateCert(type, pi, key, 'ok', e.target.checked)}
                              style={{ accentColor: sc, width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }}/>
                            <span style={{ fontSize: 10, fontWeight: 700, color: sc, width: 52, flexShrink: 0 }}>{label}</span>
                            {expired && <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', background: '#DC2626', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>EXP</span>}
                            <input type="date" value={c.validite || ''} onChange={e => updateCert(type, pi, key, 'validite', e.target.value)}
                              title="Expiration" style={{ fontSize: 9, border: `1px solid ${expired ? '#DC2626' : '#E8EAED'}`, borderRadius: 5, padding: '2px 4px', color: expired ? '#DC2626' : '#6B7280', background: expired ? '#FFF5F5' : '#fff', flex: 1 }}/>
                            <input type="date" value={c.lastCheck || ''} onChange={e => updateCert(type, pi, key, 'lastCheck', e.target.value)}
                              title="Dernière vérif." style={{ fontSize: 9, border: '1px solid #E8EAED', borderRadius: 5, padding: '2px 4px', color: '#6B7280', background: '#fff', flex: 1 }}/>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            };

            const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : null;
            // Grid partagé (en-têtes + lignes détail)
            const COLS = '215px 2fr 145px 1.4fr 1.4fr';

            return (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', marginTop: 0 }}>
                <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #F1F3F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: '#FFF4EC', display: 'grid', placeItems: 'center', fontSize: 18 }}>👷</div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: 0 }}>Corps de métier & équipe</p>
                      <p style={{ fontSize: 11.5, color: '#8B919A', margin: '2px 0 0' }}>Ressources internes et externes par métier, avec suivi de conformité (RBQ / CCQ / Assurance).</p>
                    </div>
                  </div>
                  {/* ── Filtres ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Ligne 1 : statut + À trouver */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 4, width: 50, flexShrink: 0 }}>Statut</span>
                      <button onClick={() => setTradeStatusFilter(null)}
                        style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${!tradeStatusFilter ? '#15171C' : '#E0E4E8'}`, background: !tradeStatusFilter ? '#15171C' : '#fff', color: !tradeStatusFilter ? '#fff' : '#9CA3AF', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                        Tous
                      </button>
                      <button onClick={() => setTradeStatusFilter(tradeStatusFilter === 'a_trouver' ? null : 'a_trouver')}
                        style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${tradeStatusFilter === 'a_trouver' ? '#DC2626' : '#FCA5A5'}`, background: tradeStatusFilter === 'a_trouver' ? '#FFF5F5' : '#fff', color: tradeStatusFilter === 'a_trouver' ? '#DC2626' : '#FCA5A5', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                        🔍 À trouver
                      </button>
                      {allStatuses.map(s => (
                        <button key={s.key} onClick={() => setTradeStatusFilter(tradeStatusFilter === s.key ? null : s.key)}
                          style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${tradeStatusFilter === s.key ? s.color : s.color + '50'}`, background: tradeStatusFilter === s.key ? s.bg : '#fff', color: tradeStatusFilter === s.key ? s.color : s.color + 'CC', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Ligne 2 : type d'employé (toggle) + date deadline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Type d'employé */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em', width: 50, flexShrink: 0 }}>Type</span>
                        {[
                          { key: null,       label: 'Tous',           icon: '👥' },
                          { key: 'internal', label: 'Employé',        icon: '👤', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                          { key: 'external', label: 'Sous-traitant',  icon: '🏗️', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
                        ].map(opt => {
                          const isActive = tradeTypeFilter === opt.key;
                          return (
                            <button key={String(opt.key)} onClick={() => setTradeTypeFilter(opt.key)}
                              style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${isActive ? (opt.border || '#15171C') : '#E0E4E8'}`, background: isActive ? (opt.bg || '#15171C') : '#fff', color: isActive ? (opt.color || '#fff') : '#9CA3AF', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{opt.icon}</span> {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Séparateur */}
                      <div style={{ width: 1, height: 18, background: '#E8EAED', flexShrink: 0 }}/>

                      {/* Filtre calendrier — deadline avant */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0 }}>Deadline ≤</span>
                        <input type="date" value={tradeDateFilter} onChange={e => setTradeDateFilter(e.target.value)}
                          style={{ fontSize: 11, border: '1.5px solid #E0E4E8', borderRadius: 8, padding: '3px 8px', color: tradeDateFilter ? '#15171C' : '#9CA3AF', background: tradeDateFilter ? '#FFFBEB' : '#fff', cursor: 'pointer', outline: 'none' }}/>
                        {tradeDateFilter && (
                          <button onClick={() => setTradeDateFilter('')}
                            style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>✕</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Barre mass-actions ── */}
                  {tradePersonSelected.size > 0 && (() => {
                    const selArr = [...tradePersonSelected];
                    const massUpdateStatus = (newStatus) => {
                      const updatedMap = { ...tradeResourcesMap };
                      selArr.forEach(pk => {
                        const [tn, tp, piStr] = pk.split('||');
                        const pi2 = parseInt(piStr);
                        if (!updatedMap[tn]) return;
                        const arr = [...(updatedMap[tn][tp] || [])];
                        if (arr[pi2]) arr[pi2] = { ...arr[pi2], status: newStatus };
                        updatedMap[tn] = { ...updatedMap[tn], [tp]: arr };
                      });
                      saveTradeResources(updatedMap);
                      setTradePersonSelected(new Set());
                    };
                    const massDelete = () => {
                      const updatedMap = { ...tradeResourcesMap };
                      const grouped = {};
                      selArr.forEach(pk => {
                        const [tn, tp, piStr] = pk.split('||');
                        if (!grouped[tn]) grouped[tn] = {};
                        if (!grouped[tn][tp]) grouped[tn][tp] = new Set();
                        grouped[tn][tp].add(parseInt(piStr));
                      });
                      Object.entries(grouped).forEach(([tn, types]) => {
                        Object.entries(types).forEach(([tp, indices]) => {
                          updatedMap[tn] = { ...updatedMap[tn], [tp]: (updatedMap[tn]?.[tp] || []).filter((_, i) => !indices.has(i)) };
                        });
                      });
                      saveTradeResources(updatedMap);
                      setTradePersonSelected(new Set());
                    };
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: '#F5F3FF', borderTop: '1px solid #DDD6FE', borderBottom: '1px solid #DDD6FE', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: BRAND }}>
                          {tradePersonSelected.size} sélectionné(s)
                        </span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>— Changer statut :</span>
                        {allStatuses.map(s => (
                          <button key={s.key} onClick={() => massUpdateStatus(s.key)}
                            style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 999, border: `1px solid ${s.color}55`, background: s.bg, color: s.color, fontWeight: 700, cursor: 'pointer' }}>
                            {s.label}
                          </button>
                        ))}
                        <button onClick={massDelete}
                          style={{ marginLeft: 'auto', fontSize: 10.5, padding: '3px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>
                          Supprimer
                        </button>
                        <button onClick={() => setTradePersonSelected(new Set())}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 7, border: '1px solid #E0E4E8', background: '#fff', color: '#8B919A', cursor: 'pointer' }}>
                          ✕ Désélectionner
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: 1160 }}>

                    {/* ── En-têtes ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: COLS, borderBottom: '2px solid #E8EAED', background: '#FAFAFA' }}>
                      <div style={{ padding: '7px 12px 7px 20px', borderRight: '1px solid #EAECEF' }}><span style={hS}>Personne & contact</span></div>
                      <div style={{ padding: '7px 12px', borderRight: '1px solid #EAECEF' }}><span style={hS}>💬 Message</span></div>
                      <div style={{ padding: '7px 12px', borderRight: '1px solid #EAECEF' }}><span style={hS}>✅ Réponse</span></div>
                      <div style={{ padding: '7px 12px', borderRight: '1px solid #EAECEF' }}><span style={hS}>🔒 Conformité</span></div>
                      <div style={{ padding: '7px 12px' }}><span style={hS}>📄 Bon de commande</span></div>
                    </div>

                    {/* ── Lignes par corps de métier ── */}
                    {rowNames.filter(tradeName => {
                      if (tradeStatusFilter !== 'a_trouver') return true;
                      const rawR = tradeResourcesMap[tradeName] || {};
                      const intCount = (rawR.internal || []).length;
                      const extCount = (rawR.external || []).length;
                      return intCount + extCount === 0;
                    }).map((tradeName, idx) => {
                      // Phase liée si trade_name exact OU si le nom de la phase mentionne ce corps de métier
                      const tradeKeywords = tradeName.toLowerCase().split(/[\s,\/&+]+/).filter(w => w.length >= 4);
                      const tradePhases = phases.filter(ph => {
                        if (ph.trade_name?.toLowerCase() === tradeName.toLowerCase()) return true;
                        const pn = (ph.name || '').toLowerCase();
                        return tradeKeywords.length > 0 && tradeKeywords.some(kw => pn.includes(kw));
                      });
                      const tradeHours  = tradePhases.reduce((sum, ph) => sum + (Number(ph.duration_hours) || 0), 0);
                      const sortedPh    = [...tradePhases].filter(ph => ph.start_date).sort((a, b) => a.start_date.localeCompare(b.start_date));
                      const minDate     = sortedPh[0]?.start_date;
                      const maxDate     = sortedPh[sortedPh.length - 1]?.end_date || sortedPh[sortedPh.length - 1]?.start_date;
                      const rawRes      = tradeResourcesMap[tradeName] || { internal: [], external: [] };
                      const resources   = { internal: parsePersons(rawRes.internal), external: parsePersons(rawRes.external) };

                      const updateResources = (type, newList) => {
                        const updated = { ...tradeResourcesMap, [tradeName]: { ...rawRes, [type]: newList } };
                        saveTradeResources(updated);
                      };

                      const updatePersonField = (type, pi, field, value) => {
                        updateResources(type, resources[type].map((p, i) => i === pi ? { ...p, [field]: value } : p));
                      };

                      const cycleStatus = (type, pi) => {
                        const statusList = type === 'internal' ? internalStatuses : externalStatuses;
                        const list = resources[type];
                        const cur  = statusList.findIndex(s => s.key === (list[pi]?.status || 'a_contacter'));
                        const next = statusList[(cur + 1) % statusList.length];
                        updateResources(type, list.map((p, i) => i === pi ? { ...p, status: next.key } : p));
                      };

                      const updateCert = (type, pi, certKey, field, val) => {
                        const key = personKey(tradeName, type, pi);
                        const cur = tradeConformite[key] || { rbq: {}, ccq: {}, insurance: {} };
                        const updated = { ...tradeConformite, [key]: { ...cur, [certKey]: { ...cur[certKey], [field]: val } } };
                        saveTradeConformite(updated);
                      };

                      const renderPersonSection = (type) => {
                        // Masquer toute la section si le filtre type ne correspond pas
                        if (tradeTypeFilter && tradeTypeFilter !== type) return null;

                        const list        = resources[type];
                        const statusList  = type === 'internal' ? internalStatuses : externalStatuses;
                        const typeColor   = type === 'internal' ? '#7C3AED' : '#2563EB';
                        const typeIcon    = type === 'internal' ? '👤' : '🏗️';
                        const typeLabel   = type === 'internal' ? 'Employé' : 'Sous-traitant';
                        const inputKey    = `${tradeName}_add_${type}`;
                        const confirmedKey = type === 'internal' ? 'confirme' : 'accepte';

                        let visibleList = (tradeStatusFilter && tradeStatusFilter !== 'a_trouver')
                          ? list.filter(p => (p.status || 'a_contacter') === tradeStatusFilter)
                          : list;
                        // Filtre date : ne garder que les personnes avec deadline <= date sélectionnée
                        if (tradeDateFilter) {
                          visibleList = visibleList.filter(p => p.responseDeadline && p.responseDeadline <= tradeDateFilter);
                        }

                        return (
                          <div>
                            {/* Plus de sous-header INTERNE/EXTERNE — le type est indiqué en badge inline sur chaque ligne */}
                            {visibleList.map((person) => {
                              const pi           = list.indexOf(person);
                              const pKey         = personKey(tradeName, type, pi);
                              const cert         = tradeConformite[pKey] || { rbq: {}, ccq: {}, insurance: {} };
                              const pStatus      = person.status || 'a_contacter';
                              const isAC         = pStatus === 'a_contacter';
                              const isConfirmed  = pStatus === confirmedKey;
                              const nonConf      = isPersonNonConforme(cert, pStatus);
                              const pStat        = statusList.find(s => s.key === pStatus) || statusList[0];
                              const msgData      = tradePersonMsgs[pKey] || {};
                              const isLoadingMsg = !!msgData.loading;
                              const isLoadingFlo = !!loadingFloPersonCheck[pKey];
                              const isLoadingPO  = !!msgData.poLoading;
                              const isExpanded   = !!tradePersonExpanded[pKey];

                              const infoInput = (field, placeholder, icon) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 10, color: '#C4C8CE', flexShrink: 0 }}>{icon}</span>
                                  <input value={person[field] || ''} onChange={e => updatePersonField(type, pi, field, e.target.value)}
                                    placeholder={placeholder}
                                    style={{ fontSize: 11, border: 'none', outline: 'none', background: 'transparent', color: '#5A5E6A', width: '100%', padding: 0 }}/>
                                </div>
                              );

                              const certOk = cert.rbq?.ok && cert.ccq?.ok && cert.insurance?.ok;
                              const isSel = tradePersonSelected.has(pKey);
                              const toggleSel = (e) => {
                                e.stopPropagation();
                                setTradePersonSelected(prev => {
                                  const next = new Set(prev);
                                  next.has(pKey) ? next.delete(pKey) : next.add(pKey);
                                  return next;
                                });
                              };

                              return (
                                <div key={pi}>
                                  {/* ── Ligne compacte : checkbox + nom + deadline + pipeline ── */}
                                  <div style={{ borderTop: '1px solid #F4F5F6', background: isSel ? '#F5F3FF' : nonConf ? '#FFF5F5' : 'transparent' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 8px' }}>
                                      {/* Checkbox */}
                                      <input type="checkbox" checked={isSel} onChange={toggleSel} onClick={e => e.stopPropagation()}
                                        style={{ width: 13, height: 13, accentColor: BRAND, flexShrink: 0, cursor: 'pointer' }}/>
                                      {/* Caret */}
                                      <span style={{ fontSize: 8, color: '#C4C8CE', flexShrink: 0, width: 8, cursor: 'pointer' }}
                                        onClick={() => setTradePersonExpanded(m => ({ ...m, [pKey]: !m[pKey] }))}>
                                        {isExpanded ? '▼' : '▶'}
                                      </span>
                                      {/* Nom cliquable */}
                                      <span style={{ fontSize: 12, fontWeight: 700, color: nonConf ? '#DC2626' : '#15171C', minWidth: 55, maxWidth: 115, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' }}
                                        onClick={() => setTradePersonExpanded(m => ({ ...m, [pKey]: !m[pKey] }))}>
                                        {person.name}
                                      </span>
                                      {/* Badge Employé / Sous-traitant */}
                                      <span style={{ fontSize: 8.5, fontWeight: 700, color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}30`, borderRadius: 5, padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        {typeLabel}
                                      </span>
                                      {nonConf && <span style={{ fontSize: 8, fontWeight: 800, color: '#DC2626', flexShrink: 0 }}>⚠</span>}
                                      {/* Deadline */}
                                      {person.responseDeadline && (
                                        <span style={{ fontSize: 9, color: '#F59E0B', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                          📅 {person.responseDeadline}
                                        </span>
                                      )}
                                      {/* Pipeline stepper — s'étire */}
                                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0, overflow: 'auto', scrollbarWidth: 'none' }}>
                                        {statusList.map((s, si) => {
                                          const curIdx = statusList.findIndex(x => x.key === pStatus);
                                          const isPast = si < curIdx;
                                          const isCur  = s.key === pStatus;
                                          return (
                                            <React.Fragment key={s.key}>
                                              {si > 0 && <div style={{ flex: '0 0 6px', height: 1, background: isPast ? '#D1D5DB' : '#EAECEF' }}/>}
                                              <button onClick={e => { e.stopPropagation(); updateResources(type, resources[type].map((p2, i2) => i2 === pi ? { ...p2, status: s.key } : p2)); }}
                                                style={{ fontSize: 9, fontWeight: isCur ? 800 : 500, padding: '1px 6px', borderRadius: 999, border: `1px solid ${isCur ? s.color : isPast ? s.color + '44' : '#EAECEF'}`, background: isCur ? s.bg : 'transparent', color: isCur ? s.color : isPast ? s.color + 'AA' : '#C4C8CE', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {isPast ? '✓ ' : ''}{s.label}
                                              </button>
                                            </React.Fragment>
                                          );
                                        })}
                                      </div>
                                      {/* Badges compact */}
                                      {msgData.disponible && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: msgData.disponible === 'oui' ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                                          {msgData.disponible === 'oui' ? '✓' : '✗'}
                                        </span>
                                      )}
                                      {pStatus !== 'a_contacter' && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: nonConf ? '#DC2626' : certOk ? '#16A34A' : '#C4C8CE', flexShrink: 0 }} title="Conformité">
                                          {nonConf ? '⚠' : certOk ? '✓C' : '—C'}
                                        </span>
                                      )}
                                      {msgData.po && <span style={{ fontSize: 9, color: '#16A34A', flexShrink: 0 }} title="Bon de commande">📄</span>}
                                      <button onClick={e => { e.stopPropagation(); updateResources(type, resources[type].filter((_, i) => i !== pi)); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 14, lineHeight: 1, padding: '0 1px', flexShrink: 0 }}>×</button>
                                    </div>
                                  </div>

                                  {/* ── Détail éditable (accordéon) ── */}
                                  {isExpanded && (
                                    <div style={{ display: 'grid', gridTemplateColumns: COLS, background: '#FAFAFA', borderTop: '1px solid #F1F3F5', borderBottom: '1px solid #EAECEF' }}>

                                      {/* Col 1 : Personne */}
                                      <div style={{ padding: '10px 12px 10px 16px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: nonConf ? '#DC2626' : '#15171C', margin: 0 }}>{person.name}</p>
                                        {infoInput('phone',    'Téléphone',   '📞')}
                                        {infoInput('email',    'Courriel',    '✉')}
                                        {infoInput('location', 'Localisation','📍')}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <span style={{ fontSize: 11 }}>📅</span>
                                          <input type="date"
                                            value={person.responseDeadline || ''}
                                            onChange={e => updateResources(type, resources[type].map((p2, i2) => i2 === pi ? { ...p2, responseDeadline: e.target.value } : p2))}
                                            title="Date limite de réponse"
                                            style={{ fontSize: 10.5, border: 'none', outline: 'none', background: 'transparent', color: person.responseDeadline ? '#F59E0B' : '#C4C8CE', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}/>
                                        </div>
                                        {nonConf && <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626' }}>⚠ NON CONFORME</span>}
                                      </div>

                                      {/* Col 2 : Message */}
                                      <div style={{ padding: '10px 12px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
                                        <button onClick={() => generateContactMessage(tradeName, person, type, pKey)} disabled={isLoadingMsg}
                                          style={{ position: 'absolute', top: 8, right: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: `1px solid ${BRAND}30`, background: isLoadingMsg ? '#F9F9F9' : `${BRAND}08`, color: BRAND, fontSize: 9.5, fontWeight: 700, cursor: isLoadingMsg ? 'wait' : 'pointer', zIndex: 1 }}>
                                          {isLoadingMsg ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                                          {isLoadingMsg ? 'Génère…' : '🔄 Régénérer'}
                                        </button>
                                        <textarea
                                          value={msgData.msg || ''}
                                          onChange={e => setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], msg: e.target.value } }))}
                                          rows={4}
                                          placeholder="Le message est généré automatiquement à l'ajout…"
                                          style={{ width: '100%', fontSize: 11.5, lineHeight: 1.6, color: '#3A3D44', border: '1px solid #EAECEF', borderRadius: 8, padding: '7px 9px', paddingTop: 30, resize: 'vertical', fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                          {msgData.msg && (
                                            <button onClick={() => navigator.clipboard?.writeText(msgData.msg)}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: '1.5px solid #E0E4E8', background: '#fff', fontSize: 10, fontWeight: 700, color: '#5A5E6A', cursor: 'pointer' }}>
                                              📋 Copier
                                            </button>
                                          )}
                                          {person.email && msgData.msg && (
                                            <a href={`mailto:${person.email}?subject=${encodeURIComponent(`Projet ${project.name || ''}`)}&body=${encodeURIComponent(msgData.msg)}`}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: '1.5px solid #2563EB33', background: '#EFF6FF', fontSize: 10, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                                              ✉ Envoyer
                                            </a>
                                          )}
                                        </div>
                                      </div>

                                      {/* Col 3 : Réponse */}
                                      <div style={{ padding: '10px 12px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        {[
                                          { label: type === 'internal' ? 'Disponible ✓' : 'Intéressé ✓', val: 'oui', color: '#16A34A', bg: '#ECFDF3' },
                                          { label: type === 'internal' ? 'Indisponible ✗' : 'Pas intéressé ✗', val: 'non', color: '#DC2626', bg: '#FFF5F5' },
                                        ].map(opt => (
                                          <button key={opt.val}
                                            onClick={() => setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], disponible: opt.val } }))}
                                            style={{ width: '100%', padding: '4px 6px', borderRadius: 7, border: `1.5px solid ${msgData.disponible === opt.val ? opt.color : '#E0E4E8'}`, background: msgData.disponible === opt.val ? opt.bg : '#fff', fontSize: 10, fontWeight: 700, color: msgData.disponible === opt.val ? opt.color : '#9CA3AF', cursor: 'pointer', textAlign: 'center' }}>
                                            {opt.label}
                                          </button>
                                        ))}
                                        {type === 'external' && (
                                          <div style={{ marginTop: 2 }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em' }}>Prix soumis</span>
                                            <input value={msgData.prix || ''} onChange={e => setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], prix: e.target.value } }))}
                                              placeholder="ex. 4 500 $"
                                              style={{ width: '100%', marginTop: 3, fontSize: 11, border: '1.5px solid #E0E4E8', borderRadius: 7, padding: '4px 7px', outline: 'none', color: '#3A3D44', boxSizing: 'border-box' }}/>
                                            {msgData.prix && msgData.disponible === 'oui' && (
                                              <button onClick={() => cycleStatus(type, pi)}
                                                style={{ width: '100%', marginTop: 5, padding: '4px 7px', borderRadius: 7, border: 'none', background: '#16A34A', color: '#fff', fontSize: 9.5, fontWeight: 800, cursor: 'pointer' }}>
                                                ✓ Accepter → {externalStatuses.find(s => s.key === 'accepte')?.label}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Col 4 : Conformité */}
                                      <div style={{ padding: '10px 12px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {isAC ? (
                                          <span style={{ fontSize: 10, color: '#D4D6DA', fontStyle: 'italic' }}>Après contact</span>
                                        ) : (
                                          <>
                                            {renderConformiteBadge(cert, openConformiteBadge, setOpenConformiteBadge, type, pi)}
                                            <button onClick={() => floCheckPersonConformite(tradeName, person, type, pi)} disabled={isLoadingFlo}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: `1.5px solid ${BRAND}30`, background: isLoadingFlo ? '#F9F9F9' : `${BRAND}08`, color: BRAND, fontSize: 9, fontWeight: 700, cursor: isLoadingFlo ? 'wait' : 'pointer' }}>
                                              {isLoadingFlo ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                                              {isLoadingFlo ? 'Vérif…' : 'Flo — Vérifier'}
                                            </button>
                                            {cert.floNotes && (
                                              <p style={{ fontSize: 9, color: '#6B7280', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>
                                                {cert.floNotes}
                                                {cert.floDate && <span style={{ display: 'block', fontSize: 8.5, color: '#B0B4BB', marginTop: 2 }}>{cert.floDate}</span>}
                                              </p>
                                            )}
                                          </>
                                        )}
                                      </div>

                                      {/* Col 5 : Bon de commande */}
                                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {isConfirmed ? (
                                          msgData.po ? (
                                            <>
                                              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 9, padding: '9px 11px' }}>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 3 }}>📄 BON DE COMMANDE</span>
                                                <p style={{ fontSize: 10.5, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                                                  {msgData.poNum && <span style={{ fontWeight: 700, color: '#15171C' }}>{msgData.poNum} · </span>}
                                                  {msgData.po.slice(0, 70).replace(/\*\*/g, '')}…
                                                </p>
                                              </div>
                                              <button onClick={() => openPOWindow(msgData.po, person.name, msgData.poNum || `PO-000000`)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, border: 'none', background: '#15171C', color: '#fff', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                                                📄 Ouvrir / Imprimer PDF
                                              </button>
                                              <div style={{ display: 'flex', gap: 4 }}>
                                                {person.email && (
                                                  <a href={`mailto:${person.email}?subject=${encodeURIComponent(`Bon de commande ${msgData.poNum || ''} — ${project.name || 'Projet'}`)}&body=${encodeURIComponent(msgData.po)}`}
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, border: '1.5px solid #2563EB33', background: '#EFF6FF', fontSize: 10, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                                                    ✉ Envoyer
                                                  </a>
                                                )}
                                                <button onClick={() => generatePO(tradeName, person, type, pKey, msgData.prix, minDate, maxDate)} disabled={isLoadingPO}
                                                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 7, border: `1px solid ${BRAND}30`, background: `${BRAND}08`, fontSize: 10, fontWeight: 700, color: BRAND, cursor: isLoadingPO ? 'wait' : 'pointer' }}>
                                                  {isLoadingPO ? <Loader2 size={9} className="animate-spin"/> : '🔄'} Régén.
                                                </button>
                                              </div>
                                            </>
                                          ) : (
                                            <button onClick={() => generatePO(tradeName, person, type, pKey, msgData.prix, minDate, maxDate)} disabled={isLoadingPO}
                                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', borderRadius: 9, border: 'none', background: isLoadingPO ? '#F0F0F0' : '#16A34A', color: '#fff', fontSize: 10.5, fontWeight: 700, cursor: isLoadingPO ? 'wait' : 'pointer', width: '100%' }}>
                                              {isLoadingPO ? <Loader2 size={10} className="animate-spin"/> : '📄'}
                                              {isLoadingPO ? 'Génération…' : 'Générer bon de commande'}
                                            </button>
                                          )
                                        ) : (
                                          <span style={{ fontSize: 10, color: '#D4D6DA', fontStyle: 'italic' }}>
                                            Disponible quand {type === 'internal' ? 'confirmé' : 'accepté'}
                                          </span>
                                        )}
                                      </div>

                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Ajout personne */}
                            {!tradeStatusFilter && (
                              <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px 7px 16px', borderTop: list.length ? '1px solid #F4F5F6' : 'none' }}>
                                <span style={{ fontSize: 9, color: '#C4C8CE', fontWeight: 700, textTransform: 'uppercase', width: 50, flexShrink: 0 }}>{typeIcon}</span>
                                <input
                                  value={tradeResInput[inputKey] || ''}
                                  onChange={e => setTradeResInput(m => ({ ...m, [inputKey]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && (tradeResInput[inputKey] || '').trim()) {
                                      e.preventDefault();
                                      const newPerson = { name: tradeResInput[inputKey].trim(), status: 'a_contacter', phone: '', email: '', location: '' };
                                      const newList = [...resources[type], newPerson];
                                      updateResources(type, newList);
                                      const newPKey = personKey(tradeName, type, newList.length - 1);
                                      // Ouvrir la ligne + auto-générer message
                                      setTradePersonExpanded(m => ({ ...m, [newPKey]: true }));
                                      setTradeResInput(m => ({ ...m, [inputKey]: '' }));
                                      generateContactMessage(tradeName, newPerson, type, newPKey);
                                    }
                                  }}
                                  placeholder={`+ Ajouter ${type === 'internal' ? 'un employé' : 'un sous-traitant'} — Entrée pour confirmer`}
                                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 11.5, color: typeColor, background: 'transparent', padding: 0, fontWeight: 600 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div key={tradeName} style={{ borderTop: idx > 0 ? '2px solid #EAECEF' : 'none' }}>
                          {/* Barre header du corps de métier */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 16px', background: '#FAFAFA', borderBottom: '1px solid #F1F3F5', flexWrap: 'wrap' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tradePhases[0]?.color || BRAND, flexShrink: 0 }}/>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#15171C', margin: 0 }}>{tradeName}</p>
                            {tradeHours > 0 && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: BRAND, background: `${BRAND}12`, borderRadius: 999, padding: '1px 7px' }}>
                                {tradeHours % 1 === 0 ? tradeHours : tradeHours.toFixed(1)} h
                              </span>
                            )}
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginLeft: 2 }}>
                              {tradePhases.map(phase => {
                                const phStart = phase.start_date ? fmtDate(phase.start_date) : null;
                                const phEnd   = phase.end_date   ? fmtDate(phase.end_date)   : null;
                                const phH     = phase.duration_hours ? `${Number(phase.duration_hours) % 1 === 0 ? Number(phase.duration_hours) : Number(phase.duration_hours).toFixed(1)} h` : null;
                                const dateStr = phStart
                                  ? ` (${phStart}${phEnd && phEnd !== phStart ? ` → ${phEnd}` : ''}${phH ? ` · ${phH}` : ''})`
                                  : phH ? ` (${phH})` : '';
                                return (
                                  <span key={phase.id} onClick={() => setEditPhase(phase)}
                                    style={{ fontSize: 10, fontWeight: 700, color: phase.color || BRAND, background: `${phase.color || BRAND}18`, borderRadius: 999, padding: '2px 8px', cursor: 'pointer' }}>
                                    {phase.name}{dateStr}
                                  </span>
                                );
                              })}
                              {!tradePhases.length && <span style={{ fontSize: 10, color: '#B0B4BB' }}>Aucune phase liée</span>}
                            </div>
                          </div>

                          {renderPersonSection('internal')}
                          {renderPersonSection('external')}
                        </div>
                      );
                    })}

                  </div>{/* fin minWidth */}
                </div>{/* fin overflow-x */}
              </div>
            );
          })()}



        </ProjectSection>{/* fin s-equipe */}

        {/* ── Recherche de matériaux ── */}
        <ProjectSection
          sectionId="s-materiaux"
          icon="🔍"
          title="Recherche de matériaux"
          summary={sectionSummaries['s-materiaux']?.summary}
          stats={sectionSummaries['s-materiaux']?.stats}
          expanded={!!sectionExpanded['s-materiaux']}
          onToggle={() => toggleProjectSection('s-materiaux')}
          background="#F0F5FF"
        >
          {sectionGuard('s-materiaux')}
          {(() => {
            const warnings = (() => { try { return JSON.parse(localStorage.getItem(`monflux-mat-warnings-${id}`) || '[]'); } catch { return []; } })();
            const displayed = matFilter === 'wishlist' ? matSearchResults.filter(it => matWishlist.includes(it.id)) : matSearchResults;
            const byCategory = {};
            displayed.forEach(it => { if (!byCategory[it.categorie]) byCategory[it.categorie] = []; byCategory[it.categorie].push(it); });
            return (
              <>
                {/* Barre de recherche */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                  <input value={matSearchQuery} onChange={e => setMatSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') fetchMaterialSearch(matSearchQuery); }}
                    placeholder='ex: "plancher de bois", "robinetterie matte noire"… ou laisse vide pour une proposition complète'
                    style={{ flex: 1, minWidth: 260, padding: '9px 14px', border: '1px solid #E0E4E8', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#15171C' }}/>
                  <button onClick={() => fetchMaterialSearch(matSearchQuery)} disabled={matSearchLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, cursor: matSearchLoading ? 'wait' : 'pointer', flexShrink: 0 }}>
                    {matSearchLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={14}/>}
                    {matSearchLoading ? 'Recherche…' : 'Rechercher avec Flo'}
                  </button>
                  {matSearchResults.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3, alignSelf: 'center' }}>
                      {[['all', 'Tout'], ['wishlist', `⭐ Wishlist${matWishlist.length > 0 ? ` (${matWishlist.length})` : ''}`]].map(([val, label]) => (
                        <button key={val} onClick={() => setMatFilter(val)}
                          style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: matFilter === val ? '#fff' : 'transparent', color: matFilter === val ? '#111827' : '#9CA3AF', boxShadow: matFilter === val ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warnings Flo */}
                {warnings.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    {warnings.map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#FFFBEB', borderRadius: 9, border: '1px solid #FCD34D', marginBottom: 8 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                        <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>{w.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Résultats */}
                {matSearchLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', padding: '48px 0', color: '#9CA3AF' }}>
                    <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: BRAND }}/>
                    <p style={{ fontSize: 13, margin: 0 }}>Flo recherche les meilleures options chez tes fournisseurs…</p>
                  </div>
                ) : Object.keys(byCategory).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {Object.entries(byCategory).map(([cat, items]) => (
                      <div key={cat}>
                        <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6B7280', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, display: 'inline-block' }}/>
                          {cat} · {items.length} option{items.length !== 1 ? 's' : ''}
                        </p>
                        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E8EAED' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                            <thead>
                              <tr style={{ background: '#F8F9FA' }}>
                                {['☑', '', 'Produit', 'Fournisseur', 'Prix unit.', 'Unité', 'Note Flo', 'Lien', 'Wishlist', ''].map((h, hi) => (
                                  <th key={hi} style={{ padding: '8px 10px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textAlign: (hi === 4 || hi === 8) ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E8EAED', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it, i) => {
                                const inWishlist = matWishlist.includes(it.id);
                                const isSel = matSelected.has(it.id);
                                return (
                                  <tr key={it.id || i} style={{ borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none', background: isSel ? '#F0FFF4' : inWishlist ? '#FFFDF5' : 'transparent' }}>
                                    <td style={{ padding: '7px 10px', width: 34 }}>
                                      <input type="checkbox" checked={isSel}
                                        onChange={() => setMatSelected(prev => { const n = new Set(prev); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n; })}
                                        style={{ accentColor: BRAND, cursor: 'pointer', width: 15, height: 15 }}/>
                                    </td>
                                    <td style={{ padding: '7px 8px', width: 52 }}>
                                      {it.url_image ? (
                                        <img src={it.url_image} alt={it.nom}
                                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid #E8EAED' }}
                                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'grid'; }}/>
                                      ) : null}
                                      <div style={{ width: 44, height: 44, borderRadius: 7, background: '#F3F4F6', display: it.url_image ? 'none' : 'grid', placeItems: 'center', fontSize: 20 }}>🪵</div>
                                    </td>
                                    <td style={{ padding: '7px 10px', fontSize: 13, fontWeight: 600, color: '#111827', maxWidth: 200 }}>{it.nom}</td>
                                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <span style={{ display: 'inline-block', background: '#F3F4F6', borderRadius: 5, padding: '2px 9px', fontSize: 11, fontWeight: 600, color: '#374151' }}>{it.fournisseur}</span>
                                        {it.source_verified === false ? (
                                          <span style={{ fontSize: 9.5, color: '#D97706', fontWeight: 600 }}>⚠ Estimation Flo</span>
                                        ) : it.source_type === 'apify' || it.source_type === 'api' ? (
                                          <span style={{ fontSize: 9.5, color: '#16A34A', fontWeight: 600 }}>✓ Prix réel</span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td style={{ padding: '7px 10px', fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {it.prix_unitaire ? `${Number(it.prix_unitaire).toFixed(2)} $` : '—'}
                                    </td>
                                    <td style={{ padding: '7px 10px', fontSize: 11.5, color: '#9CA3AF' }}>{it.unite || '—'}</td>
                                    <td style={{ padding: '7px 10px', fontSize: 11.5, color: '#6B7280', maxWidth: 200 }}>
                                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.note_flo || it.note || '—'}</span>
                                    </td>
                                    <td style={{ padding: '7px 10px' }}>
                                      {it.url_source ? (
                                        <a href={it.url_source} target="_blank" rel="noreferrer"
                                          style={{ fontSize: 11.5, color: BRAND, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Voir ↗</a>
                                      ) : '—'}
                                    </td>
                                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                      <button onClick={() => toggleMatWishlist(it.id)}
                                        style={{ background: inWishlist ? '#FEF3C7' : '#F3F4F6', border: inWishlist ? '1.5px solid #FCD34D' : '1.5px solid #E5E7EB', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontSize: 14, color: inWishlist ? '#D97706' : '#9CA3AF', fontWeight: 700, transition: 'all .15s' }}>
                                        {inWishlist ? '⭐' : '☆'}
                                      </button>
                                    </td>
                                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                                      <button onClick={() => setMatSearchResults(prev => prev.filter(r => r.id !== it.id))}
                                        title="Supprimer ce résultat"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#D1D5DB', lineHeight: 1, padding: '2px 4px' }}>×</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    {/* Barre sélection → devis */}
                    {matSelected.size > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F0FFF4', borderRadius: 10, border: '1px solid #86EFAC', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>{matSelected.size} article{matSelected.size !== 1 ? 's' : ''} sélectionné{matSelected.size !== 1 ? 's' : ''}</span>
                        <button onClick={async () => {
                          const selItems = matSearchResults.filter(it => matSelected.has(it.id));
                          if (salesLocked) {
                            const created = await createChangeRequestFromMaterials(selItems, 'matériaux sélectionnés');
                            if (created) setMatSelected(new Set());
                            return;
                          }
                          const q = await ensureQuote(); if (!q) return;
                          const newItems = [...quoteBuilderItems, ...selItems.map(it => ({
                            type: 'material', name: it.nom, qty: 1, unit: it.unite || 'un.',
                            unit_price: Number(it.prix_unitaire) || 0, url: it.url_source || '', markup: 0, source: 'flo', show_on_quote: true,
                          }))];
                          setQuoteBuilderItems(newItems); scheduleQuoteSave(newItems);
                          setMatSelected(new Set());
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          → {salesLocked ? 'Ajouter à une demande de changement' : 'Ajouter au devis détaillé'}
                        </button>
                        <button onClick={() => setMatSelected(new Set())}
                          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid #86EFAC', background: 'transparent', color: '#16A34A', cursor: 'pointer' }}>
                          Désélectionner
                        </button>
                      </div>
                    )}
                    {/* Import wishlist dans devis */}
                    {matWishlist.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #DDD6FE', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: BRAND, fontWeight: 700 }}>{matWishlist.length} article{matWishlist.length !== 1 ? 's' : ''} dans la wishlist</span>
                        <button onClick={async () => {
                          const wishItems = matSearchResults.filter(it => matWishlist.includes(it.id));
                          if (salesLocked) {
                            await createChangeRequestFromMaterials(wishItems, 'wishlist matériaux');
                            return;
                          }
                          const q = await ensureQuote(); if (!q) return;
                          const newItems = [...quoteBuilderItems, ...wishItems.map(it => ({
                            type: 'material', name: it.nom, qty: 1, unit: it.unite || 'un.',
                            unit_price: Number(it.prix_unitaire) || 0, url: it.url_source || '', markup: 0, source: 'flo', show_on_quote: true,
                          }))];
                          setQuoteBuilderItems(newItems); scheduleQuoteSave(newItems);
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          → {salesLocked ? 'Créer une demande de changement' : 'Importer wishlist dans le devis'}
                        </button>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                          {salesLocked ? 'Le devis est verrouillé : les matériaux partent maintenant en demande de changement.' : 'Ajoutés dans la section Matériaux du devis détaillé.'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '52px 0', color: '#9CA3AF' }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>Aucun résultat pour l'instant</p>
                    <p style={{ fontSize: 12.5, margin: '0 auto', maxWidth: 420, color: '#9CA3AF', lineHeight: 1.6 }}>
                      Écris ce que tu cherches ou laisse vide — Flo analyse le projet et propose tout ce qui est nécessaire, en tenant compte des éléments conservés et des contraintes.
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </ProjectSection>

        {/* ── Devis détaillé ── */}
        <ProjectSection
          sectionId="s-soumission"
          icon="📄"
          title="Devis & contrat"
          summary={sectionSummaries['s-soumission']?.summary}
          stats={sectionSummaries['s-soumission']?.stats}
          expanded={!!sectionExpanded['s-soumission']}
          onToggle={() => toggleProjectSection('s-soumission')}
          background="#fff"
          borderTop="2px solid #E8EAED"
        >
          {salesLocked && (
            <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12.5, fontWeight: 600 }}>
              Le devis, le contrat et l’estimation approximative sont maintenant verrouillés, car le client a signé/accepté.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 20 }}>
              {/* Markup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F9FAFB', borderRadius: 8, padding: '5px 11px', border: '1px solid #E8EAED' }}>
                <span style={{ fontSize: 11, color: '#8B919A' }}>Markup</span>
                <input type="number" min="0" max="300" step="1" value={quoteMarkup}
                  disabled={salesLocked}
                  onChange={e => { const v = Number(e.target.value); setQuoteMarkup(v); localStorage.setItem('monflux-quote-markup', v); setUiPref('quote_markup', v); }}
                  style={{ width: 42, fontSize: 13, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', color: '#15171C', fontFamily: 'inherit' }}/>
                <span style={{ fontSize: 11, color: '#8B919A' }}>%</span>
              </div>
              {/* Flo button */}
              <button disabled={salesLocked} onClick={() => setShowFloQuotePanel(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: `1.5px solid ${BRAND}`, background: showFloQuotePanel ? `${BRAND}15` : '#fff', color: BRAND, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Sparkles size={12}/>{floQuoteLoading ? 'Analyse…' : 'Flo complète le devis'}
              </button>
              {quoteBuilderQuote?.status === 'sent' && <span className="badge badge-blue text-xs">Envoyée</span>}
              {quoteBuilderQuote?.status === 'signed' && <span className="badge badge-green text-xs">Signée</span>}
              {quoteSaving && <span style={{ fontSize: 11, color: '#9CA3AF' }}>Enreg…</span>}
          </div>

          {/* Panneau Flo */}
          {showFloQuotePanel && (
            <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={13} style={{ color: BRAND }}/><span style={{ fontSize: 13, fontWeight: 700, color: BRAND }}>Flo complète le devis</span>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px', lineHeight: 1.5 }}>
                Collez des URLs d'images d'inspiration (Pinterest, Houzz…) ou décrivez le style. Flo identifie les matériaux, propose des produits disponibles au Québec avec prix et sources, importe les prix convenus avec les sous-traitants de la section Équipe, et ajoute la main d'œuvre basée sur les phases.
              </p>
              <textarea value={floInspirationInput} onChange={e => setFloInspirationInput(e.target.value)}
                placeholder={"https://pinterest.com/pin/…\nhttps://houzz.com/…\nOu décrivez : planchers de bois naturel, comptoirs de quartz blanc, robinetterie matte noire…"}
                rows={3}
                style={{ width: '100%', fontSize: 12, border: '1px solid #DDD6FE', borderRadius: 8, padding: '8px 10px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#15171C', boxSizing: 'border-box' }}/>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <button onClick={fetchQuoteRecos} disabled={floQuoteLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: floQuoteLoading ? 'wait' : 'pointer' }}>
                  {floQuoteLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={12}/>}
                  {floQuoteLoading ? 'Analyse en cours…' : 'Analyser et compléter le devis'}
                </button>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Les postes existants sont conservés — Flo ajoute uniquement les nouvelles lignes.</span>
              </div>
            </div>
          )}

          {/* Barre multi-select + mass-markup */}
          {quoteSelected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{quoteSelected.size} ligne(s)</span>
              {/* Mass markup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EDE9FE', borderRadius: 7, padding: '3px 10px' }}>
                <span style={{ fontSize: 11, color: BRAND }}>Markup</span>
                <input type="number" min="0" max="300" step="1" value={quoteMassMarkup}
                  disabled={salesLocked}
                  onChange={e => setQuoteMassMarkup(e.target.value)}
                  placeholder="0"
                  style={{ width: 38, fontSize: 12, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', color: '#15171C', fontFamily: 'inherit' }}/>
                <span style={{ fontSize: 11, color: BRAND }}>%</span>
                <button onClick={() => {
                  if (quoteMassMarkup === '') return;
                  const v = Number(quoteMassMarkup);
                  const next = quoteBuilderItems.map((it, i) => quoteSelected.has(i) ? { ...it, markup: v } : it);
                  setQuoteBuilderItems(next); scheduleQuoteSave(next); setQuoteMassMarkup('');
                }}
                  disabled={salesLocked}
                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: 'none', background: BRAND, color: '#fff', fontWeight: 700, cursor: salesLocked ? 'not-allowed' : 'pointer', marginLeft: 4, opacity: salesLocked ? 0.5 : 1 }}>
                  Appliquer
                </button>
              </div>
              <button onClick={() => { [...quoteSelected].sort((a, b) => b - a).forEach(i => removeQuoteItem(i)); setQuoteSelected(new Set()); }}
                disabled={salesLocked}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#DC2626', fontWeight: 700, cursor: salesLocked ? 'not-allowed' : 'pointer', opacity: salesLocked ? 0.5 : 1 }}>
                Supprimer
              </button>
              <button onClick={() => setQuoteSelected(new Set())}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 7, border: '1px solid #E0E4E8', background: '#fff', color: '#8B919A', cursor: 'pointer', marginLeft: 'auto' }}>
                ✕
              </button>
            </div>
          )}

          {/* Tableau devis unifié — style Excel avec groupes repliables */}
          {(() => {
            const typeLabels = { material: 'Matériaux', labor: "Main d'œuvre", subcontractor: 'Sous-traitants', other: 'Autres' };
            const typeIcons  = { material: '🪵', labor: '🔨', subcontractor: '🏗️', other: '📦' };
            const typeUnits  = { labor: 'h', material: 'un.', subcontractor: 'forfait', other: 'un.' };
            const iS = { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%', padding: '3px 2px' };
            const TH = { padding: '5px 6px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB', whiteSpace: 'nowrap' };
            const allItems = quoteBuilderItems.map((it, i) => ({ ...it, _i: i }));
            return (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                    <colgroup>
                      <col style={{ width: 28 }}/>{/* checkbox */}
                      <col style={{ minWidth: 180 }}/>{/* description */}
                      <col style={{ width: 60 }}/>{/* qty */}
                      <col style={{ width: 54 }}/>{/* unit */}
                      <col style={{ width: 90 }}/>{/* prix unit */}
                      <col style={{ width: 72 }}/>{/* markup */}
                      <col style={{ width: 100 }}/>{/* total */}
                      <col style={{ width: 84 }}/>{/* source */}
                      <col style={{ width: 24 }}/>{/* delete */}
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ ...TH, textAlign: 'center' }}>
                          <input type="checkbox"
                            disabled={salesLocked}
                            checked={allItems.length > 0 && allItems.every(it => quoteSelected.has(it._i))}
                            onChange={e => setQuoteSelected(() => {
                              const n = new Set();
                              if (e.target.checked) allItems.forEach(it => n.add(it._i));
                              return n;
                            })}
                            style={{ accentColor: BRAND, cursor: salesLocked ? 'not-allowed' : 'pointer' }}/>
                        </th>
                        <th style={{ ...TH, textAlign: 'left' }}>Description</th>
                        {/* Colonnes PDF — œil cliquable pour inclure/exclure du PDF client */}
                        <th style={{ ...TH, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} title="Afficher Qté sur le PDF" onClick={() => togglePdfCol('qty')}>
                          <span style={{ opacity: isPdfColOn('qty') ? 1 : 0.35 }}>Qté {isPdfColOn('qty') ? '👁' : '🙈'}</span>
                        </th>
                        <th style={{ ...TH, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} title="Afficher Unité sur le PDF" onClick={() => togglePdfCol('unit')}>
                          <span style={{ opacity: isPdfColOn('unit') ? 1 : 0.35 }}>Unité {isPdfColOn('unit') ? '👁' : '🙈'}</span>
                        </th>
                        <th style={{ ...TH, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} title="Afficher Prix unit. sur le PDF" onClick={() => togglePdfCol('unit_price')}>
                          <span style={{ opacity: isPdfColOn('unit_price') ? 1 : 0.35 }}>Prix unit. {isPdfColOn('unit_price') ? '👁' : '🙈'}</span>
                        </th>
                        <th style={{ ...TH, textAlign: 'right', color: BRAND }}>Markup%</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Total</th>
                        <th style={{ ...TH, textAlign: 'left' }}>Source</th>
                        <th style={{ ...TH }}/>
                      </tr>
                    </thead>
                    <tbody>
                      {['material', 'labor', 'subcontractor', 'other'].map(type => {
                        const typeItems = allItems.filter(it => it.type === type);
                        const nd = quoteNewRow[type] || {};
                        const isCollapsed = quoteCollapsed[type];
                        const sectionTotal = typeItems.reduce((s, it) => {
                          const base = (Number(it.qty) || 1) * (Number(it.unit_price) || 0);
                          return s + base * (1 + (Number(it.markup) || 0) / 100);
                        }, 0);
                        return (
                          <React.Fragment key={type}>
                            {/* Ligne-groupe repliable */}
                            <tr onClick={() => setQuoteCollapsed(m => ({ ...m, [type]: !m[type] }))}
                              style={{ background: '#F3F4F6', cursor: 'pointer', userSelect: 'none' }}>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <span style={{ fontSize: 8, color: '#9CA3AF', display: 'inline-block', transition: 'transform .15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                              </td>
                              <td colSpan={7} style={{ padding: '6px 6px' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '.07em', marginRight: 8 }}>
                                  {typeIcons[type]} {typeLabels[type]}
                                </span>
                                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{typeItems.length} poste{typeItems.length !== 1 ? 's' : ''}</span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                                {sectionTotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $
                              </td>
                              <td/>
                            </tr>

                            {/* Lignes d'articles */}
                            {!isCollapsed && typeItems.map(it => {
                              const isSel = quoteSelected.has(it._i);
                              const mu = Number(it.markup) || 0;
                              const lineTotal = (Number(it.qty) || 1) * (Number(it.unit_price) || 0) * (1 + mu / 100);
                              return (
                                <tr key={it._i} style={{ background: isSel ? '#F5F3FF' : it.source === 'flo' ? '#F7FFF3' : 'white', borderBottom: '1px solid #F3F4F6' }}>
                                  <td style={{ padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    <input type="checkbox" checked={isSel}
                                      disabled={salesLocked}
                                      onChange={() => setQuoteSelected(prev => { const n = new Set(prev); n.has(it._i) ? n.delete(it._i) : n.add(it._i); return n; })}
                                      style={{ accentColor: BRAND, cursor: salesLocked ? 'not-allowed' : 'pointer' }}/>
                                  </td>
                                  <td style={{ padding: '1px 6px', verticalAlign: 'middle' }}>
                                    <input value={it.name} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { name: e.target.value })}
                                      placeholder="Description"
                                      style={{ ...iS, fontSize: 12, color: '#111827', fontWeight: it.name ? 500 : 400 }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <input type="number" value={it.qty || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { qty: Number(e.target.value) })}
                                      style={{ ...iS, fontSize: 11, color: '#374151', textAlign: 'right' }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <input value={it.unit || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { unit: e.target.value })}
                                      placeholder={typeUnits[type]}
                                      style={{ ...iS, fontSize: 11, color: '#6B7280' }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <input type="number" value={it.unit_price || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { unit_price: Number(e.target.value) })}
                                      placeholder="0"
                                      style={{ ...iS, fontSize: 11, color: '#374151', textAlign: 'right' }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                      <input type="number" value={it.markup || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { markup: Number(e.target.value) })}
                                        placeholder="0"
                                        style={{ ...iS, fontSize: 11, color: BRAND, textAlign: 'right', width: 36, fontWeight: 600 }}/>
                                      <span style={{ fontSize: 10, color: BRAND, flexShrink: 0 }}>%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '2px 8px', verticalAlign: 'middle', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                                    {lineTotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $
                                    {it.source === 'flo' && <span style={{ fontSize: 8, color: '#16A34A', marginLeft: 3 }}>✦</span>}
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    {it.url ? (
                                      <a href={it.url} target="_blank" rel="noreferrer"
                                        style={{ fontSize: 10, color: BRAND, textDecoration: 'none', whiteSpace: 'nowrap' }}>🔗 Source</a>
                                    ) : (
                                      <input value={it.url || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { url: e.target.value })}
                                        placeholder="URL"
                                        style={{ ...iS, fontSize: 10, color: '#9CA3AF' }}/>
                                    )}
                                  </td>
                                  <td style={{ padding: '1px 2px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    <button onClick={() => removeQuoteItem(it._i)} disabled={salesLocked}
                                      style={{ background: 'none', border: 'none', cursor: salesLocked ? 'not-allowed' : 'pointer', color: '#D1D5DB', fontSize: 14, lineHeight: 1, padding: '0 3px', opacity: salesLocked ? 0.5 : 1 }}>×</button>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Ligne d'ajout rapide */}
                            {!isCollapsed && (
                              <tr style={{ background: '#FAFAFA', borderBottom: '2px solid #E5E7EB' }}>
                                <td/>
                                <td style={{ padding: '4px 6px' }}>
                                  <input value={nd.name || ''} placeholder={`+ Ajouter ${typeLabels[type].toLowerCase()}…`}
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], name: e.target.value } }))}
                                    onKeyDown={e => { if (!salesLocked && e.key === 'Enter') commitNewRow(type, nd); }}
                                    onBlur={() => { if (!salesLocked) commitNewRow(type, nd); }}
                                    style={{ ...iS, fontSize: 12, color: '#9CA3AF' }}/>
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <input type="number" value={nd.qty || ''} placeholder="1"
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], qty: e.target.value } }))}
                                    style={{ ...iS, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}/>
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <input value={nd.unit || ''} placeholder={typeUnits[type]}
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], unit: e.target.value } }))}
                                    style={{ ...iS, fontSize: 11, color: '#9CA3AF' }}/>
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <input type="number" value={nd.unit_price || ''} placeholder="0"
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], unit_price: e.target.value } }))}
                                    style={{ ...iS, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}/>
                                </td>
                                <td/><td/><td style={{ padding: '4px 4px' }}>
                                  <input value={nd.url || ''} placeholder="URL"
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], url: e.target.value } }))}
                                    style={{ ...iS, fontSize: 10, color: '#9CA3AF' }}/>
                                </td>
                                <td/>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Totaux */}
          {quoteBuilderItems.length > 0 && (() => {
            const costRaw   = quoteBuilderItems.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
            const costTotal = quoteBuilderItems.reduce((s, it) => {
              const base = (Number(it.qty) || 1) * (Number(it.unit_price) || 0);
              return s + base * (1 + (Number(it.markup) || 0) / 100);
            }, 0);
            const globalMarkupAmt = costTotal * (quoteMarkup / 100);
            const subtotal  = costTotal + globalMarkupAmt;
            const tps  = subtotal * 0.05;
            const tvq  = subtotal * 0.09975;
            const total = subtotal + tps + tvq;
            const fmt = v => v.toLocaleString('fr-CA', { minimumFractionDigits: 2 }) + ' $';
            const hasPerLineMarkup = quoteBuilderItems.some(it => Number(it.markup) > 0);
            return (
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '2px solid #E8EAED', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 340 }}>
                  {hasPerLineMarkup && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, color: '#6B7280' }}>
                      <span>Coût brut</span><span>{fmt(costRaw)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: '#374151' }}>
                    <span>Coût total{hasPerLineMarkup ? ' (avec markups lignes)' : ''}</span><span>{fmt(costTotal)}</span>
                  </div>
                  {/* Global markup */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderTop: '1px dashed #E8EAED', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>Markup global</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: `${BRAND}10`, borderRadius: 6, padding: '2px 8px' }}>
                      <input type="number" min="0" max="300" step="1" value={quoteMarkup}
                        disabled={salesLocked}
                        onChange={e => { const v = Number(e.target.value); setQuoteMarkup(v); localStorage.setItem('monflux-quote-markup', v); setUiPref('quote_markup', v); }}
                        style={{ width: 40, fontSize: 12, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', color: BRAND, fontFamily: 'inherit' }}/>
                      <span style={{ fontSize: 11, color: BRAND }}>%</span>
                    </div>
                    {globalMarkupAmt > 0 && <span style={{ fontSize: 12, color: BRAND, fontWeight: 600 }}>+ {fmt(globalMarkupAmt)}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 3px', fontSize: 13, fontWeight: 700, color: '#111827', borderTop: '1px solid #E8EAED', marginTop: 2 }}>
                    <span>Sous-total</span><span>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11, color: '#6B7280' }}>
                    <span>TPS (5%)</span><span>{fmt(tps)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11, color: '#6B7280' }}>
                    <span>TVQ (9,975%)</span><span>{fmt(tvq)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 3px', fontSize: 17, fontWeight: 900, color: '#111827', borderTop: '2px solid #E8EAED', marginTop: 6 }}>
                    <span>Total</span><span style={{ color: BRAND }}>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Actions devis */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quoteBuilderItems.length > 0 && quoteBuilderQuote?.status !== 'sent' && quoteBuilderQuote?.status !== 'signed' && (
              <button className="btn-primary text-xs py-2" onClick={sendQuoteToClient} disabled={quoteSending || !quoteBuilderQuote}>
                {quoteSending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>} Envoyer au client
              </button>
            )}
            {quoteBuilderQuote && (
              <button className="btn-secondary text-xs py-2" onClick={() => {
                const cols = ['qty','unit','unit_price'].filter(c => isPdfColOn(c)).join(',');
                const url = pdf.quoteUrl(quoteBuilderQuote.id) + (cols ? `&cols=${cols}` : '&cols=qty,unit,unit_price');
                setPreview({ url, title: 'Soumission' });
              }}>
                <Eye size={13}/> Aperçu PDF
              </button>
            )}
            {quoteBuilderQuote?.status === 'sent' && (
              <p className="text-xs text-blue-500 flex items-center gap-1"><CheckCircle size={12}/> Soumission envoyée au client.</p>
            )}
          </div>

          {/* ── Contrat — inline sous le devis ── */}
          <div id="s-contracts" style={{ marginTop: 48, paddingTop: 36, borderTop: '2px dashed #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>✍️</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#15171C', margin: 0, letterSpacing: '-.01em' }}>Contrat</h3>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Document éditable lié automatiquement au type de projet et synchronisé avec le devis</p>
              </div>
              {projectContracts.length > 0 && <span className="badge badge-green text-xs">{projectContracts.length} contrat(s)</span>}
            </div>

            {projectContracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', background: '#FAFAFA', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
                <FileSignature size={24} style={{ margin: '0 auto 8px', color: '#D1D5DB' }}/>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px', fontWeight: 600 }}>
                  {quoteBuilderQuote ? 'Préparation du contrat…' : 'Le contrat sera créé avec le devis'}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  {quoteBuilderQuote ? `Modèle détecté automatiquement : ${selectedContractTemplate?.label || 'Contrat lié au projet'}.` : 'Le contrat apparaîtra automatiquement dès que le devis existe.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projectContracts.map(c => {
                  const isSending = contractSendingId === c.id;
                  const isOpen = showContractContent === c.id;
                  const isSaving = contractSavingId === c.id;
                  const isEnriching = contractEnrichingId === c.id;
                  const draft = contractDrafts[c.id] || { title: c.title || '', content: normalizeContractHtml(c.content) };
                  const statusColor = { draft: '#6B7280', sent: '#2563EB', signed: '#16A34A', cancelled: '#9CA3AF' };
                  const statusLabel = { draft: 'Brouillon', sent: 'Envoyé', signed: 'Signé ✓', cancelled: 'Annulé' };
                  return (
                    <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                      {/* En-tête contrat */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FAFAFA', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{c.title}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                            {new Date(c.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            {c.meta?.template_label ? ` · ${c.meta.template_label}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[c.status] || '#6B7280', background: `${statusColor[c.status]}15`, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          {statusLabel[c.status] || c.status}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary text-xs py-1" onClick={() => setShowContractContent(isOpen ? null : c.id)}>
                            <Eye size={11}/> {isOpen ? 'Masquer' : 'Ouvrir'}
                          </button>
                          {c.status === 'draft' && (
                            <button className="btn-secondary text-xs py-1" onClick={() => enrichContractWithFlo(c.id)} disabled={isEnriching}>
                              {isEnriching ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>} Flo
                            </button>
                          )}
                          {c.status === 'draft' && (
                            <button className="btn-primary text-xs py-1" onClick={() => sendContract(c.id)} disabled={isSending}>
                              {isSending ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>} Envoyer
                            </button>
                          )}
                          <button className="btn-ghost text-xs py-1 text-gray-300 hover:text-red-500" onClick={() => deleteContract(c.id)}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </div>
                      {c.status === 'signed' && (
                        <div style={{ padding: '8px 16px', background: '#F0FFF4', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
                          <p style={{ fontSize: 11, color: '#16A34A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={11}/> Signé par {c.signer_name} le {new Date(c.signed_at).toLocaleDateString('fr-CA')}
                          </p>
                        </div>
                      )}
                      {/* Contenu du contrat — affiché inline */}
                      {isOpen && (
                        <div style={{ padding: '20px 24px', background: '#FCFCFD' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                            <input
                              className="input"
                              value={draft.title}
                              onChange={(e) => updateContractDraft(c.id, { title: e.target.value })}
                              placeholder="Titre du contrat"
                              style={{ flex: 1, fontWeight: 700 }}
                            />
                            {c.status === 'draft' && (
                              <button className="btn-primary text-xs" onClick={() => saveContractDraft(c.id)} disabled={isSaving}>
                                {isSaving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12} />} Enregistrer
                              </button>
                            )}
                          </div>
                          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px 34px', boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
                            <div
                              contentEditable={c.status === 'draft'}
                              suppressContentEditableWarning
                              onInput={(e) => updateContractDraft(c.id, { content: e.currentTarget.innerHTML })}
                              dangerouslySetInnerHTML={{ __html: draft.content }}
                              style={{
                                minHeight: 320,
                                outline: 'none',
                                fontSize: 13,
                                color: '#374151',
                                lineHeight: 1.8,
                                fontFamily: "'Georgia', serif",
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {c.status === 'draft' && (
                        <div style={{ padding: '10px 16px', background: '#FFFBEB', borderTop: '1px solid #FEF3C7', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <AlertCircle size={12} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }}/>
                          <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                            Brouillon modifiable en mode document. Flo peut enrichir le contexte avant l’envoi au client.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ProjectSection>

        {/* s-feed et s-comms sont maintenant dans leurs propres onglets */}

        <ProjectSection
          sectionId="s-media"
          icon="📷"
          title="Notes et photos"
          summary={sectionSummaries['s-media']?.summary}
          stats={sectionSummaries['s-media']?.stats}
          expanded={!!sectionExpanded['s-media']}
          onToggle={() => toggleProjectSection('s-media')}
          background="#F4EFE4"
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
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
              {/* Type: Note ou Mémo vocal */}
              <div className="flex gap-2">
                {[
                  { k: 'note',  icon: <StickyNote size={13}/>, l: 'Note' },
                  { k: 'voice', icon: <Mic size={13}/>, l: 'Mémo vocal' },
                ].map(({ k, icon, l }) => (
                  <button key={k} type="button"
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${mediaForm.type === k ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-400'}`}
                    onClick={() => setMediaForm(f => ({ ...f, type: k }))}>{icon} {l}</button>
                ))}
              </div>

              {mediaForm.type === 'voice' ? (
                <div>
                  <label className="label">Transcription du mémo vocal *</label>
                  <textarea className="input" rows={2} value={mediaForm.transcript} onChange={e => setMediaForm(f => ({ ...f, transcript: e.target.value }))} placeholder="Transcrivez ou collez le contenu du mémo… (enregistrement audio à venir)" required/>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">Observation ou note *</label>
                    <textarea className="input" rows={2} value={mediaForm.caption} onChange={e => setMediaForm(f => ({ ...f, caption: e.target.value }))} placeholder="Ex: Coffrage mal aligné au coin sud-est…"/>
                  </div>
                  {/* Photos associées */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label" style={{ margin: 0 }}>Photos (optionnel)</label>
                      <button type="button" className="flex items-center gap-1 text-xs text-brand font-semibold"
                        onClick={() => setMediaForm(f => ({ ...f, photos: [...f.photos, { url: '' }] }))}>
                        <Plus size={11}/> Ajouter une photo
                      </button>
                    </div>
                    {mediaForm.photos.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <input className="input flex-1" value={p.url} onChange={e => setMediaForm(f => {
                          const photos = [...f.photos]; photos[i] = { ...photos[i], url: e.target.value }; return { ...f, photos };
                        })} placeholder="URL de la photo…"/>
                        {p.url && <img src={p.url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #E8EAED', flexShrink: 0 }} onError={ev => { ev.target.style.display = 'none'; }}/>}
                        <button type="button" className="text-gray-300 hover:text-red-400"
                          onClick={() => setMediaForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}>
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-xs px-4"
                  disabled={mediaForm.type === 'voice' ? !mediaForm.transcript.trim() : (!mediaForm.caption.trim() && !mediaForm.photos.some(p => p.url.trim()))}>
                  Ajouter
                </button>
              </div>
            </form>
          )}

          {media.length > 0 ? (
            <>
              {/* Galerie horizontale — photos de toutes les entrées */}
              {media.some(m => m.url || (m.photos && m.photos.length > 0)) && (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 4, scrollbarWidth: 'thin' }}>
                  {media.flatMap(m => {
                    const photoList = m.photos && m.photos.length > 0
                      ? m.photos.map((p, i) => ({ _key: `${m.id}-${i}`, url: p.url, caption: m.caption, created_at: m.created_at, _entry: m }))
                      : m.url ? [{ _key: m.id, url: m.url, caption: m.caption, created_at: m.created_at, _entry: m }]
                      : [];
                    return photoList;
                  }).map(item => (
                    <div key={`gal-${item._key}`} style={{ flexShrink: 0, width: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid #E8EAED', background: '#fff', cursor: 'pointer' }}
                      onClick={() => setLightboxItem(item._entry)}>
                      <img src={item.url} alt={item.caption || ''} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                        onError={ev => { ev.target.parentElement.querySelector('.gal-fallback').style.display = 'grid'; ev.target.style.display = 'none'; }}/>
                      <div className="gal-fallback" style={{ width: '100%', height: 110, background: '#F4F6F8', display: 'none', placeItems: 'center', fontSize: 28 }}>📷</div>
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{ fontSize: 11, color: '#7C8089', margin: 0 }}>{new Date(item.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</p>
                        <p style={{ fontSize: 12, color: '#15171C', margin: '2px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.caption || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Détails / analyse IA */}
              <div className="space-y-2">
              {media.map(m => {
                const a = m.ai_analysis;
                const issues = (a?.non_conformities?.length || 0) + (a?.safety_risks?.length || 0);
                return (
                  <div key={m.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail(s) */}
                      <div className="flex-shrink-0 cursor-pointer" onClick={() => setLightboxItem(m)}>
                        {m.photos && m.photos.length > 0 ? (
                          <div style={{ display: 'flex', gap: 3 }}>
                            {m.photos.slice(0, 3).map((p, i) => (
                              <img key={i} src={p.url} alt="" style={{ width: m.photos.length === 1 ? 56 : 36, height: m.photos.length === 1 ? 56 : 36, objectFit: 'cover', borderRadius: 8, border: '1px solid #E8EAED' }}/>
                            ))}
                            {m.photos.length > 3 && <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F4F6F8', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#7C8089', border: '1px solid #E8EAED' }}>+{m.photos.length - 3}</div>}
                          </div>
                        ) : m.url ? (
                          <img src={m.url} alt={m.caption || ''} className="w-14 h-14 rounded-lg object-cover border border-gray-100"/>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center">{m.type === 'voice' ? <Mic size={18} className="text-gray-300"/> : <StickyNote size={18} className="text-gray-300"/>}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-gray text-[10px]">{m.type === 'voice' ? 'vocal' : m.photos?.length > 0 ? `note · ${m.photos.length} photo${m.photos.length > 1 ? 's' : ''}` : m.url ? 'note · photo' : 'note'}</span>
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
        </ProjectSection>


        {/* ── Dépenses ── (violet) */}
        <ProjectSection
          sectionId="s-expenses"
          icon="💸"
          title="Factures fournisseurs"
          summary={sectionSummaries['s-expenses']?.summary}
          stats={sectionSummaries['s-expenses']?.stats}
          expanded={!!sectionExpanded['s-expenses']}
          onToggle={() => toggleProjectSection('s-expenses')}
          background="#F0EBFD"
        >
          {sectionGuard('s-expenses')}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button className="btn-secondary text-xs" onClick={() => setShowExpenseForm(v => !v)}><Plus size={13} /> Ajouter</button>
          </div>

          {showExpenseForm && (
            <form onSubmit={addExpense} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label className="label">Type</label>
                  <select className="input" value={expenseForm.type} onChange={e => setExpenseForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="label">Montant ($) *</label><input className="input" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required /></div>
                <div><label className="label">Date</label><input className="input" type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
                <div><label className="label">Description</label><input className="input" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Fournisseur / détail" /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
                <div><label className="label">N° bon de commande</label><input className="input" value={expenseForm.po_number} onChange={e => setExpenseForm(f => ({ ...f, po_number: e.target.value }))} placeholder="BC-001" /></div>
                <div><label className="label">N° facture fournisseur</label><input className="input" value={expenseForm.supplier_invoice_number} onChange={e => setExpenseForm(f => ({ ...f, supplier_invoice_number: e.target.value }))} placeholder="INV-2026-001" /></div>
                <div className="flex gap-2 items-end">
                  <button type="button" className="btn-secondary text-xs flex-1" onClick={() => setShowExpenseForm(false)}>Annuler</button>
                  <button type="submit" className="btn-primary text-xs flex-1">Enregistrer</button>
                </div>
              </div>
            </form>
          )}

          {project.expenses?.length > 0 ? (
            <div className="space-y-1.5">
              {project.expenses.map(x => {
                const noPO = x.type === 'supplier_invoice' && !x.po_number;
                return (
                  <div key={x.id} className="flex items-center gap-3 py-2 border-b border-purple-50 last:border-0">
                    {noPO && (
                      <span title="Aucun bon de commande associé" style={{ color: '#f59e0b', flexShrink: 0 }}><AlertTriangle size={13}/></span>
                    )}
                    <span className="badge badge-gray text-xs">{EXPENSE_TYPES[x.type] || x.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{x.description || x.subcontractor_name || '—'}</p>
                      <div className="flex gap-3 mt-0.5">
                        {x.supplier_invoice_number && <span className="text-xs text-gray-400">Facture : {x.supplier_invoice_number}</span>}
                        {x.po_number ? <span className="text-xs text-purple-600 font-medium">BC : {x.po_number}</span>
                          : x.type === 'supplier_invoice' && <span className="text-xs text-amber-500">Sans bon de commande</span>}
                      </div>
                    </div>
                    {x.expense_date && <span className="text-xs text-gray-400">{new Date(x.expense_date).toLocaleDateString('fr-CA')}</span>}
                    <span className="text-sm font-semibold text-gray-700">{money(x.amount)}</span>
                    <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" onClick={() => removeExpense(x.id)}><Trash2 size={13} /></button>
                  </div>
                );
              })}
              <div className="flex justify-end pt-2 border-t border-purple-50">
                <p className="text-sm font-bold text-gray-800">Total : {money(project.expenses.reduce((s, x) => s + Number(x.amount || 0), 0))}</p>
              </div>
            </div>
          ) : !showExpenseForm && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune facture fournisseur. Ajoutez-en pour calculer la rentabilité réelle.</p>
          )}
        </ProjectSection>

        {/* ── Feuilles de temps ── (mint) */}
        <ProjectSection
          sectionId="s-punch"
          icon="⏱️"
          title="Punch et dépenses"
          summary={sectionSummaries['s-punch']?.summary}
          stats={sectionSummaries['s-punch']?.stats}
          expanded={!!sectionExpanded['s-punch']}
          onToggle={() => toggleProjectSection('s-punch')}
          background="#E9F3EC"
        >
          {sectionGuard('s-punch')}
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

          {/* ── Dépenses de chantier (dans Punch et dépenses) ── */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1.5px solid #D1FAE5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>💸</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: 0 }}>Dépenses</p>
                <p style={{ fontSize: 11.5, color: '#7C8089', margin: 0 }}>Matériaux, frais divers, dépenses directes{project.expenses?.length > 0 ? ` · ${project.expenses.length} entrée(s)` : ''}</p>
              </div>
              <button className="btn-secondary text-xs" onClick={() => setShowExpenseForm(v => !v)}><Plus size={13} /> Ajouter</button>
            </div>

            {showExpenseForm && (
              <form onSubmit={addExpense} className="bg-white rounded-xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end border border-green-100">
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
                  <div key={x.id} className="flex items-center gap-3 py-1.5 border-b border-green-50 last:border-0">
                    <span className="badge badge-gray text-xs">{EXPENSE_TYPES[x.type] || x.type}</span>
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{x.description || x.subcontractor_name || '—'}</span>
                    {x.expense_date && <span className="text-xs text-gray-400">{new Date(x.expense_date).toLocaleDateString('fr-CA')}</span>}
                    <span className="text-sm font-semibold text-gray-700">{money(x.amount)}</span>
                    <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" onClick={() => removeExpense(x.id)}><Trash2 size={13} /></button>
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t border-green-100">
                  <p className="text-sm font-bold text-gray-800">Total : {money(project.expenses.reduce((s, x) => s + Number(x.amount || 0), 0))}</p>
                </div>
              </div>
            ) : !showExpenseForm && (
              <p className="text-sm text-gray-400 text-center py-3">Aucune dépense enregistrée pour ce projet.</p>
            )}
          </div>
        </ProjectSection>

        {/* ── Soumission détaillée ── (white) */}
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

        {/* ── Factures client ── (mint) */}
        <ProjectSection
          sectionId="s-invoices"
          icon="🧾"
          title="Factures client"
          summary={sectionSummaries['s-invoices']?.summary}
          stats={sectionSummaries['s-invoices']?.stats}
          expanded={!!sectionExpanded['s-invoices']}
          onToggle={() => toggleProjectSection('s-invoices')}
          background="#E9F3EC"
        >
          {sectionGuard('s-invoices')}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button className="btn-primary text-xs" onClick={() => setShowNewInvoice(v => !v)}>
              <Plus size={13}/> Nouvelle facture
            </button>
          </div>

          {/* ── Formulaire nouvelle facture ── */}
          {showNewInvoice && (
            <form onSubmit={createInvoiceInline} style={{ background: '#fff', borderRadius: 16, border: '1px solid #D1FAE5', padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#15171C' }}>Nouvelle facture</h3>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowNewInvoice(false)}><X size={16}/></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 16 }}>
                <div><label className="label">Titre (optionnel)</label><input className="input" value={newInvoice.title} onChange={e => setNewInvoice(f => ({...f, title: e.target.value}))} placeholder="Ex : Acompte 50%" /></div>
                <div><label className="label">Date d'échéance</label><input className="input" type="date" value={newInvoice.due_date} onChange={e => setNewInvoice(f => ({...f, due_date: e.target.value}))} /></div>
                <div><label className="label">Nom client</label><input className="input" value={newInvoice.client_name} onChange={e => setNewInvoice(f => ({...f, client_name: e.target.value}))} placeholder={project.client_name || 'Client'} /></div>
                <div><label className="label">Courriel client</label><input className="input" type="email" value={newInvoice.client_email} onChange={e => setNewInvoice(f => ({...f, client_email: e.target.value}))} placeholder={project.client_email || ''} /></div>
              </div>

              {/* Lignes de la facture */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 32px', gap: 6, marginBottom: 6 }}>
                  <span className="label" style={{ margin: 0 }}>Description</span>
                  <span className="label" style={{ margin: 0 }}>Qté</span>
                  <span className="label" style={{ margin: 0 }}>Prix unitaire</span>
                  <span/>
                </div>
                {newInvoiceItems.map((it, i) => {
                  const lineTotal = (Number(it.qty)||0) * (Number(it.unit_price)||0);
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                      <input className="input" value={it.description} onChange={e => setNewInvoiceItems(items => items.map((x,j) => j===i ? {...x, description: e.target.value} : x))} placeholder="Travaux, matériaux..." required />
                      <input className="input" type="number" min="0" step="1" value={it.qty} onChange={e => setNewInvoiceItems(items => items.map((x,j) => j===i ? {...x, qty: e.target.value} : x))} />
                      <input className="input" type="number" min="0" step="0.01" value={it.unit_price} onChange={e => setNewInvoiceItems(items => items.map((x,j) => j===i ? {...x, unit_price: e.target.value} : x))} placeholder="0.00" required />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {lineTotal > 0 && <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap' }}>{money(lineTotal)}</span>}
                        {newInvoiceItems.length > 1 && <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }} onClick={() => setNewInvoiceItems(items => items.filter((_,j) => j !== i))}><X size={12}/></button>}
                      </div>
                    </div>
                  );
                })}
                <button type="button" className="btn-ghost text-xs mt-1" onClick={() => setNewInvoiceItems(items => [...items, { description: '', qty: 1, unit_price: '' }])}>
                  <Plus size={12}/> Ajouter une ligne
                </button>
              </div>

              {/* Totaux */}
              {(() => {
                const sub = newInvoiceItems.reduce((acc, it) => acc + (Number(it.qty)||0)*(Number(it.unit_price)||0), 0);
                const tps = sub * 0.05; const tvq = sub * 0.09975;
                return sub > 0 ? (
                  <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Sous-total</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#15171C' }}>{money(sub)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>TPS (5%)</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{money(tps)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>TVQ (9,975%)</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{money(tvq)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 24, borderTop: '1px solid #D1FAE5', paddingTop: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#15171C' }}>Total</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: BRAND }}>{money(sub + tps + tvq)}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowNewInvoice(false)}>Annuler</button>
                <button type="submit" className="btn-primary text-xs" disabled={savingInvoice}>
                  {savingInvoice ? <Loader2 size={13} className="animate-spin"/> : <FileText size={13}/>} Créer la facture
                </button>
              </div>
            </form>
          )}

          {/* ── Tableau des factures ── */}
          {projectInvoices.length > 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D1FAE5', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F0FDF4' }}>
                    {['N°', 'Titre', 'Client', 'Échéance', 'Total', 'Statut', 'Actions'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #D1FAE5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectInvoices.map(inv => {
                    const SB = { draft:'#9CA3AF', sent:'#3B82F6', viewed:'#F59E0B', partial:'#F97316', paid:'#22C55E', overdue:'#EF4444', cancelled:'#9CA3AF' };
                    const SL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée' };
                    const overdue = inv.status === 'overdue' || (inv.due_date && new Date(inv.due_date) < new Date() && !['paid','cancelled'].includes(inv.status));
                    const isSending = sendingInvoiceId === inv.id;
                    const justSent = invoiceSentId === inv.id;
                    const isUpdating = updatingInvoiceId === inv.id;
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #F0FDF4' }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>#{inv.number}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#15171C', maxWidth: 180 }}>
                          <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.title || `Facture ${inv.number}`}</p>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{inv.client_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 700 : 400 }}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-CA') : '—'}
                          {overdue && <span style={{ marginLeft: 4 }}>⚠️</span>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#15171C' }}>{money(inv.total || 0)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            value={inv.status || 'draft'}
                            disabled={isUpdating}
                            onChange={e => updateInvoiceStatus(inv, e.target.value)}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, border: `1px solid ${(SB[inv.status]||'#9CA3AF')}60`, background: (SB[inv.status]||'#9CA3AF') + '15', color: SB[inv.status]||'#9CA3AF', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                          >
                            {Object.entries(SL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {justSent ? (
                              <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={12}/> Envoyée</span>
                            ) : (
                              <button className="btn-ghost p-1" title={`Envoyer à ${inv.client_email || project.client_email || 'client'}`} onClick={() => sendInvoiceEmail(inv)} disabled={isSending} style={{ color: '#3B82F6' }}>
                                {isSending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                              </button>
                            )}
                            <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Prévisualiser" onClick={() => setPreview({ url: pdf.invoiceUrl(inv.id), title: inv.title || `Facture ${inv.number}` })}><Eye size={13}/></button>
                            <a href={pdf.invoiceUrl(inv.id)} download={`facture-${inv.number || inv.id}.pdf`} className="btn-ghost p-1 text-gray-300 hover:text-brand" title="PDF" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Download size={13}/></a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '10px 14px', background: '#F9FFF9', display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Total facturé</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#15171C' }}>{money(projectInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0))}</span>
              </div>
            </div>
          ) : !showNewInvoice && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <FileText size={32} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>Aucune facture pour ce projet.</p>
              <button className="btn-primary text-xs" onClick={() => setShowNewInvoice(true)}><Plus size={13}/> Créer la première facture</button>
            </div>
          )}

        </ProjectSection>

        {/* ── Demandes de modification ── */}
        <ProjectSection
          sectionId="s-extras"
          icon="⚡"
          title="Demandes de modification"
          summary={sectionSummaries['s-extras']?.summary}
          stats={sectionSummaries['s-extras']?.stats}
          expanded={!!sectionExpanded['s-extras']}
          onToggle={() => toggleProjectSection('s-extras')}
          background="#FFF7ED"
          borderTop="1px solid #FED7AA"
        >
          {sectionGuard('s-extras')}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button className="btn-primary text-xs" style={{ background: '#F97316', border: 'none' }} onClick={() => setShowExtraForm(true)}>
              <Plus size={13}/> Nouvelle demande
            </button>
          </div>

          {changeOrdersList.length > 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #FED7AA', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FFF7ED' }}>
                    {['N°', 'Titre', 'Montant', 'Statut', 'Date'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #FED7AA' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {changeOrdersList.map(co => {
                    const CS = { draft:'#9CA3AF', pending_approval:'#F59E0B', approved:'#22C55E', rejected:'#EF4444', completed:'#3B82F6' };
                    const CL = { draft:'Brouillon', pending_approval:'En attente', approved:'Approuvé', rejected:'Refusé', completed:'Complété' };
                    return (
                      <tr key={co.id} style={{ borderBottom: '1px solid #FFF7ED' }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>#{co.number || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15171C' }}>{co.title}</p>
                          {co.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{co.description}</p>}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: co.amount > 0 ? '#15171C' : '#9CA3AF' }}>
                          {co.amount > 0 ? money(co.amount) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: (CS[co.status]||'#9CA3AF') + '20', color: CS[co.status]||'#9CA3AF', border: `1px solid ${(CS[co.status]||'#9CA3AF')}40` }}>
                            {CL[co.status] || co.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF' }}>
                          {co.created_at ? new Date(co.created_at).toLocaleDateString('fr-CA') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {changeOrdersList.some(co => co.amount > 0) && (
                <div style={{ padding: '10px 14px', background: '#FFFBF5', display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
                  <span style={{ fontSize: 12, color: '#92400E' }}>Total extras</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#F97316' }}>{money(changeOrdersList.reduce((s, co) => s + Number(co.amount || 0), 0))}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <GitBranch size={28} style={{ color: '#FED7AA', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14 }}>Aucune demande de modification pour ce projet.</p>
              <button className="btn-primary text-xs" style={{ background: '#F97316', border: 'none' }} onClick={() => setShowExtraForm(true)}><Plus size={13}/> Créer la première demande</button>
            </div>
          )}

        </ProjectSection>

        {/* ── Quittance ── (mint) */}
        <ProjectSection
          sectionId="s-quittances"
          icon="✅"
          title="Quittances"
          summary={sectionSummaries['s-quittances']?.summary}
          stats={sectionSummaries['s-quittances']?.stats}
          expanded={!!sectionExpanded['s-quittances']}
          onToggle={() => toggleProjectSection('s-quittances')}
          background="#E9F3EC"
        >

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
                    href={pdf.quittanceUrl(quittance.id)}
                    download={`quittance-${quittance.id.slice(0,8)}.pdf`}
                    className="btn-ghost text-xs py-1.5"
                    title="Télécharger PDF"
                  >
                    <Download size={12}/> PDF
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
        </ProjectSection>

        {/* ── Section Dénonciations (hypothèques légales QC) ── */}
        {(() => {
          const fa = project.field_assessment || {};
          const denList = fa.denonciations || [];

          const saveDen = async (next) => {
            const nextFa = { ...fa, denonciations: next };
            await projectsApi.update(id, { field_assessment: nextFa });
            setProject(p => ({ ...p, field_assessment: nextFa }));
          };

          const addDen = () => saveDen([...denList, {
            id: Date.now(),
            type: 'Hypothèque légale',
            beneficiaire: '',
            montant: '',
            date_envoi: '',
            date_limite: '',
            statut: 'à_envoyer',
            notes: '',
          }]);

          const updateDen = (idx, patch) => {
            const next = denList.map((d, i) => i === idx ? { ...d, ...patch } : d);
            saveDen(next);
          };

          const removeDen = (idx) => saveDen(denList.filter((_, i) => i !== idx));

          const DEN_STATUTS = [
            { key: 'à_envoyer',  label: 'À envoyer',  color: '#D97706', bg: '#FFFBEB' },
            { key: 'envoyée',    label: 'Envoyée',     color: '#2563EB', bg: '#EFF6FF' },
            { key: 'acceptée',   label: 'Acceptée',    color: '#16a34a', bg: '#F0FDF4' },
            { key: 'contestée',  label: 'Contestée',   color: '#DC2626', bg: '#FEF2F2' },
            { key: 'radiée',     label: 'Radiée',      color: '#6B7280', bg: '#F3F4F6' },
          ];

          return (
            <ProjectSection
              sectionId="s-denonciations"
              icon="⚖️"
              title="Dénonciations"
              summary={sectionSummaries['s-denonciations']?.summary}
              stats={sectionSummaries['s-denonciations']?.stats}
              expanded={!!sectionExpanded['s-denonciations']}
              onToggle={() => toggleProjectSection('s-denonciations')}
            >
              {sectionGuard('s-denonciations')}

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                  <b>Rappel :</b> Au Québec, un sous-traitant ou fournisseur peut inscrire une hypothèque légale de la construction dans les <b>30 jours</b> suivant la fin des travaux (art. 2726–2728 C.c.Q.). La dénonciation préalable au propriétaire est requise pour les parties sans contrat direct avec lui.
                </p>
              </div>

              {denList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {denList.map((den, idx) => {
                    const statut = DEN_STATUTS.find(s => s.key === den.statut) || DEN_STATUTS[0];
                    const isLate = den.date_limite && new Date(den.date_limite) < new Date() && den.statut !== 'radiée';
                    return (
                      <div key={den.id || idx} style={{ background: '#FAFAFA', border: `1px solid ${isLate ? '#FECACA' : '#E8EAED'}`, borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          {/* Type */}
                          <div style={{ minWidth: 170 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Type</p>
                            <select value={den.type} onChange={e => updateDen(idx, { type: e.target.value })}
                              style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%' }}>
                              <option>Hypothèque légale</option>
                              <option>Avis de dénonciation</option>
                              <option>Mise en demeure</option>
                              <option>Autre</option>
                            </select>
                          </div>
                          {/* Bénéficiaire */}
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Bénéficiaire</p>
                            <input value={den.beneficiaire} onChange={e => updateDen(idx, { beneficiaire: e.target.value })}
                              placeholder="Sous-traitant ou fournisseur…"
                              style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%', boxSizing: 'border-box' }}/>
                          </div>
                          {/* Montant */}
                          <div style={{ width: 110 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Montant ($)</p>
                            <input type="number" value={den.montant} onChange={e => updateDen(idx, { montant: e.target.value })}
                              placeholder="0.00"
                              style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%', boxSizing: 'border-box' }}/>
                          </div>
                          {/* Date envoi */}
                          <div style={{ width: 128 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Date d'envoi</p>
                            <input type="date" value={den.date_envoi} onChange={e => updateDen(idx, { date_envoi: e.target.value })}
                              style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%', boxSizing: 'border-box' }}/>
                          </div>
                          {/* Date limite */}
                          <div style={{ width: 128 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: isLate ? '#DC2626' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>
                              {isLate ? '⚠ Échéance dépassée' : 'Date limite (30j)'}
                            </p>
                            <input type="date" value={den.date_limite} onChange={e => updateDen(idx, { date_limite: e.target.value })}
                              style={{ fontSize: 12, border: `1px solid ${isLate ? '#FECACA' : '#E0E4E8'}`, borderRadius: 7, padding: '5px 8px', background: isLate ? '#FEF2F2' : '#fff', color: isLate ? '#DC2626' : '#15171C', fontWeight: isLate ? 700 : 400, width: '100%', boxSizing: 'border-box' }}/>
                          </div>
                          {/* Statut */}
                          <div style={{ width: 118 }}>
                            <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Statut</p>
                            <select value={den.statut} onChange={e => updateDen(idx, { statut: e.target.value })}
                              style={{ fontSize: 11.5, border: `1.5px solid ${statut.color}60`, borderRadius: 7, padding: '5px 8px', background: statut.bg, color: statut.color, fontWeight: 700, width: '100%' }}>
                              {DEN_STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </div>
                          {/* Supprimer */}
                          <button onClick={() => removeDen(idx)}
                            style={{ width: 30, height: 30, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 16, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            ×
                          </button>
                        </div>
                        <input value={den.notes} onChange={e => updateDen(idx, { notes: e.target.value })}
                          placeholder="Notes — notaire, numéro de dossier, références…"
                          style={{ marginTop: 10, fontSize: 11.5, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 10px', background: '#fff', color: '#374151', width: '100%', boxSizing: 'border-box' }}/>
                      </div>
                    );
                  })}
                </div>
              )}

              {denList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 0 20px', color: '#C4C8CE' }}>
                  <span style={{ fontSize: 34 }}>⚖️</span>
                  <p style={{ fontSize: 13, marginTop: 8, marginBottom: 2 }}>Aucune dénonciation pour ce projet.</p>
                  <p style={{ fontSize: 11.5 }}>Ajoutez un avis d'hypothèque légale ou de dénonciation à suivre.</p>
                </div>
              )}

              <button onClick={addDen}
                style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 20px', borderRadius: 10, border: '1.5px dashed #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Ajouter une dénonciation
              </button>
            </ProjectSection>
          );
        })()}

        {/* s-comms est maintenant dans son propre onglet */}

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

      {/* ════════════ VUE : MÉMOIRE ════════════ */}
      {activeTab === 'memoire' && (
        <div className="pd-tab-content" style={{ padding: '32px 48px 60px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#FFF1EB', border: '1px solid #FDDCCA', display: 'grid', placeItems: 'center', fontSize: 24 }}>🧠</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#15171C', margin: 0, letterSpacing: '-.02em' }}>Mémoire du projet</h1>
              <p style={{ fontSize: 13, color: '#7C8089', margin: 0 }}>Insights Flo · Fil du chantier · Documents & liens</p>
            </div>
          </div>

          {/* ── Stat cards ── */}
          {(() => {
            const totalHours = timesheets.reduce((s, ts) => s + (Number(ts.hours_total || ts.hours) || 0), 0);
            const pendingCOs = changeOrdersList.filter(co => co.status === 'pending_approval').length;
            const stats = [
              { icon: '⏱', label: 'Heures punchées', value: totalHours > 0 ? `${totalHours}h` : '—', color: BRAND, bg: '#FFF1EB' },
              { icon: '📷', label: 'Médias chantier', value: media.length || '—', color: '#4f46e5', bg: '#EEF1FD' },
              { icon: '📝', label: 'Demandes modif.', value: changeOrdersList.length || '—', color: '#2563EB', bg: '#EFF6FF' },
              { icon: '⚠️', label: 'En attente', value: pendingCOs || '—', color: pendingCOs ? '#D97706' : '#9CA3AF', bg: pendingCOs ? '#FFFBEB' : '#F9FAFB' },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0' }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Insights & Mémoire de Flo ── */}
          <div style={{ background: `${BRAND}06`, border: `1px solid ${BRAND}25`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={17} style={{ color: BRAND }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: BRAND }}>Insights & mémoire de Flo</span>
              {aiRecommendations.length > 0 && (
                <button onClick={() => setAiRecommendations([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#C0C4CC' }}>Effacer</button>
              )}
            </div>
            {aiRecommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiRecommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 14px', background: '#fff', borderRadius: 10, border: '1px solid #F0F2F4', alignItems: 'flex-start' }}>
                    <Sparkles size={13} style={{ color: BRAND, flexShrink: 0, marginTop: 3 }} />
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6, flex: 1 }}>{rec}</p>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginTop: 1 }}>
                      {/* Garder → convertit en post-it */}
                      <button onClick={() => {
                        const note = { id: `flo-${Date.now()}-${i}`, text: rec, author_name: 'Flo ✦', color: 'yellow', created_at: new Date().toISOString(), archived: false, source: 'flo' };
                        const next = [...stickyNotes, note];
                        saveStickyNotes(next);
                        const nextRecs = aiRecommendations.filter((_, j) => j !== i);
                        setAiRecommendations(nextRecs);
                        projectsApi.update(id, { flo_recommendations: nextRecs }).catch(() => {});
                      }} style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        📌 Garder
                      </button>
                      {/* Écarter → retire de flo_recommendations */}
                      <button onClick={() => {
                        const nextRecs = aiRecommendations.filter((_, j) => j !== i);
                        setAiRecommendations(nextRecs);
                        projectsApi.update(id, { flo_recommendations: nextRecs }).catch(() => {});
                      }} style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#C4C8CE' }}>
                <p style={{ fontSize: 13 }}>Aucun insight pour l'instant. Discute avec Flo sur la fiche projet — ses notes apparaissent ici.</p>
              </div>
            )}
          </div>

          {/* ── Notes de chantier ── */}
          <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <StickyNote size={15} style={{ color: BRAND }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#15171C' }}>Notes de chantier</span>
              {notesSaving && <span style={{ fontSize: 11, color: '#7C8089', marginLeft: 'auto' }}>Enregistrement…</span>}
            </div>
            <textarea className="input resize-none" style={{ minHeight: 90, width: '100%' }}
              placeholder="Ajoutez des notes, remarques ou observations…"
              value={notes} onChange={e => handleNotesChange(e.target.value)} />
          </div>

          {/* ── Fil d'activité chronologique ── */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#15171C', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND, display: 'inline-block' }} />
              Fil du chantier
            </h2>
            {(() => {
              const feedItems = [
                ...(timesheets.map(ts => ({
                  type: 'heures', icon: '⏱', color: '#E8794E', bg: '#FFF1EB',
                  title: `${ts.worker_name || 'Employé'} — ${ts.hours ? `${ts.hours}h punchées` : 'punch'}`,
                  sub: ts.note || '',
                  date: ts.date || ts.created_at,
                }))),
                ...(media.map(m => ({
                  type: 'media', icon: m.type === 'photo' ? '📷' : m.type === 'voice' ? '🎙' : '📌', color: '#4f46e5', bg: '#EEF1FD',
                  title: `${m.author_name || (m.type === 'photo' ? 'Photo' : m.type === 'voice' ? 'Mémo vocal' : 'Note')} — ${m.type === 'photo' ? 'photo ajoutée' : m.type === 'voice' ? 'mémo vocal' : 'note de chantier'}`,
                  sub: m.caption || m.transcript || m.ai_summary || '',
                  date: m.created_at,
                  aiTag: m.ai_flag,
                }))),
                ...(changeOrdersList.filter(co => co.status !== 'draft').map(co => ({
                  type: 'demande_modification', icon: '📝', color: '#2563EB', bg: '#EFF6FF',
                  title: `Avenant : ${co.title}`,
                  sub: co.amount ? `+${Number(co.amount).toLocaleString('fr-CA')} $` : '',
                  date: co.created_at,
                }))),
                ...(changeOrdersList.filter(co => co.status === 'pending_approval').map(co => ({
                  type: 'alerte', icon: '⚠️', color: '#D97706', bg: '#FFFBEB',
                  title: `⚠️ Avenant en attente d'approbation : ${co.title}`,
                  sub: co.amount ? `${Number(co.amount).toLocaleString('fr-CA')} $` : '',
                  date: co.created_at,
                }))),
                ...(portalMessages.map(msg => ({
                  type: 'portail', icon: '🌐', color: '#7C3AED', bg: '#F5F3FF',
                  title: `Message portail — ${msg.author_name || 'Client'}`,
                  sub: msg.content,
                  date: msg.created_at,
                }))),
                ...(dbActivityLog.map(entry => ({
                  type: 'log', icon: entry.actor_type === 'flo' ? '✦' : '👤', color: '#059669', bg: '#ECFDF5',
                  title: entry.action === 'project_status_changed'
                    ? `Statut → ${entry.payload?.new_status || ''}`
                    : entry.action === 'invoice_created'
                    ? `Facture créée${entry.payload?.number ? ` #${entry.payload.number}` : ''}`
                    : entry.action === 'project_created'
                    ? 'Projet créé'
                    : entry.action,
                  sub: entry.user_name ? `par ${entry.user_name}` : (entry.actor_type === 'flo' ? 'par Flo' : ''),
                  date: entry.created_at,
                }))),
              ].sort((a, b) => new Date(b.date) - new Date(a.date));

              if (!feedItems.length) return (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                  <span style={{ fontSize: 32 }}>📭</span>
                  <p style={{ fontSize: 14, marginTop: 12 }}>Aucune activité enregistrée pour ce projet.</p>
                  <p style={{ fontSize: 12 }}>Les punchs, photos, notes et demandes de modification apparaîtront ici.</p>
                </div>
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {feedItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 15px', background: '#FAFAFA', borderRadius: 11, border: '1px solid #F0F2F4', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F5F7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FAFAFA'}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: item.bg, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: 0 }}>{item.title}</p>
                        {item.sub && <p style={{ fontSize: 12, color: '#7C8089', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{item.sub}</p>}
                        {item.aiTag && <span style={{ fontSize: 10, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>⚠ {item.aiTag}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: '#C8CACD', flexShrink: 0, alignSelf: 'center', whiteSpace: 'nowrap' }}>
                        {item.date ? new Date(item.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── Documents & Liens rapides ── (agrège les URLs saisies dans le projet, pas les portails) */}
          {(() => {
            const urlRegex = /https?:\/\/[^\s,;"'<>]+/g;
            const allLinks = [];
            const addLinks = (src, label, url) => { if (url && typeof url === 'string') { const m = url.match(urlRegex); if (m) m.forEach(u => allLinks.push({ label, url: u })); } };

            // Champs URL directs
            addLinks(null, 'Lien projet', project.url);
            addLinks(null, 'Lien client', project.client_website);
            // Matériaux
            (matSearchResults || []).forEach(m => { if (m.product_url) allLinks.push({ label: m.name || 'Matériau', url: m.product_url }); });
            // Commandes
            (materialOrders || []).forEach(o => { if (o.supplier_url) allLinks.push({ label: `Commande — ${o.supplier || 'fournisseur'}`, url: o.supplier_url }); });
            // Notes (extraction URLs du texte libre)
            if (notes) { const m = notes.match(urlRegex); if (m) m.forEach(u => allLinks.push({ label: 'Lien (note)', url: u })); }

            return (
              <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5', display: 'inline-block' }} />
                  Documents & liens du projet
                </h2>
                {allLinks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allLinks.map((l, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', background: '#F9FAFB', borderRadius: 9, border: '1px solid #E5E7EB' }}>
                        <Link2 size={13} style={{ color: '#4f46e5', flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', margin: 0 }}>{l.label}</p>
                          <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#4f46e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>{l.url}</a>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(l.url)} style={{ fontSize: 10, fontWeight: 700, color: '#4f46e5', background: '#EEF1FD', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>Copier</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#C4C8CE', textAlign: 'center', padding: '20px 0', margin: 0 }}>Aucun lien URL saisi dans ce projet pour l'instant.</p>
                )}
                {media.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#7C8089', margin: '0 0 8px' }}>Notes et photos ({media.length})</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                      {media.slice(0, 8).map(m => (
                        <div key={m.id} style={{ borderRadius: 9, border: '1px solid #E5E7EB', overflow: 'hidden', background: '#FAFAFA' }}>
                          {m.file_url ? (
                            <img src={m.file_url} alt={m.caption || 'Media'} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ height: 80, display: 'grid', placeItems: 'center', fontSize: 24 }}>{m.type === 'voice' ? '🎙' : '📌'}</div>
                          )}
                          <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, padding: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.author_name || m.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Post-its du projet ── */}
          {stickyNotes.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📌</span>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#15171C', margin: 0 }}>Post-its</h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: '#FFF1EB', color: '#E8794E', border: '1px solid #FDDCCA' }}>
                  {stickyNotes.filter(n => !n.archived).length} actifs
                </span>
                {stickyNotes.some(n => n.archived) && (
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>
                    · {stickyNotes.filter(n => n.archived).length} archivé{stickyNotes.filter(n => n.archived).length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
                {[...stickyNotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(note => {
                  const col = note.archived ? null : (STICKY_COLORS.find(c => c.key === note.color) || STICKY_COLORS[0]);
                  return (
                    <div
                      key={note.id}
                      style={{
                        background: note.archived ? '#F9FAFB' : col.bg,
                        border: `1.5px solid ${note.archived ? '#E5E7EB' : col.border}`,
                        borderRadius: 12,
                        padding: '12px 14px',
                        opacity: note.archived ? 0.62 : 1,
                        filter: note.archived ? 'grayscale(1)' : 'none',
                        transition: 'opacity .2s, filter .2s',
                      }}
                    >
                      {/* Auteur + date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 7 }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: note.archived ? '#9CA3AF' : col.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{note.author_name}</p>
                        {note.archived && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: '#E5E7EB', color: '#6B7280', padding: '1px 6px', borderRadius: 99, flexShrink: 0 }}>Archivé</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12.5, color: note.archived ? '#6B7280' : col.text, lineHeight: 1.55, margin: '0 0 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {note.text || <em style={{ opacity: 0.4 }}>Note vide</em>}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 9.5, color: note.archived ? '#9CA3AF' : col.text, opacity: 0.55, margin: 0 }}>
                          {new Date(note.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(note.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {note.archived ? (
                          <button
                            onClick={() => saveStickyNotes(stickyNotes.map(n => n.id === note.id ? { ...n, archived: false } : n))}
                            style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', cursor: 'pointer' }}
                          >Restaurer</button>
                        ) : (
                          <button
                            onClick={() => saveStickyNotes(stickyNotes.filter(n => n.id !== note.id))}
                            style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                          >Supprimer</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ════════════ VUE : COMMUNICATIONS ════════════ */}
      {activeTab === 'communication' && (
        <div className="pd-tab-content" style={{ padding: '32px 48px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'grid', placeItems: 'center', fontSize: 24 }}>💬</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#15171C', margin: 0, letterSpacing: '-.02em' }}>Communications</h1>
              <p style={{ fontSize: 13, color: '#7C8089', margin: 0 }}>Client d'un côté · Fournisseurs & équipe de l'autre</p>
            </div>
          </div>

          {/* ── Grille 2 colonnes ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* ── Colonne gauche : Client ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#15171C', margin: 0 }}>Client</h2>
                {project.client_name && <span style={{ fontSize: 12, color: '#7C8089' }}>— {project.client_name}</span>}
              </div>

              {/* Actions rapides client */}
              <div style={{ background: '#F5F3FF', borderRadius: 14, border: '1px solid #DDD6FE', padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Actions rapides</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {project.client_phone && (
                    <a href={`https://wa.me/${project.client_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#22c55e', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                      💬 WhatsApp
                    </a>
                  )}
                  {project.client_email && (
                    <a href={`mailto:${project.client_email}?subject=Projet ${encodeURIComponent(project.name || '')}`}
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#4f46e5', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                      ✉️ Courriel
                    </a>
                  )}
                  {project.portal_token && (
                    <button onClick={() => navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`)}
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#7C3AED', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      🔗 Copier lien portail
                    </button>
                  )}
                  {!project.client_phone && !project.client_email && !project.portal_token && (
                    <p style={{ fontSize: 12, color: '#C4C8CE', margin: 0 }}>Aucune coordonnée enregistrée</p>
                  )}
                </div>
              </div>

              {/* Messages portail client */}
              <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: 16, maxHeight: 480, overflowY: 'auto' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7C8089', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Messages portail ({portalMessages.length})
                </p>
                {portalMessages.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {portalMessages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EDE9FE', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>{(msg.author_name?.[0] || 'C').toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '8px 12px', border: '1px solid #F0F2F4' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{msg.author_name || 'Client'}</span>
                            <span style={{ fontSize: 10, color: '#C4C8CE' }}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '28px 0', color: '#C4C8CE' }}>
                    <span style={{ fontSize: 28 }}>📭</span>
                    <p style={{ fontSize: 12, marginTop: 8 }}>Aucun message du client pour l'instant.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Colonne droite : Fournisseurs & Équipe ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0EA5E9', display: 'inline-block' }} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#15171C', margin: 0 }}>Fournisseurs & Équipe</h2>
              </div>

              {/* Actions rapides fournisseurs */}
              <div style={{ background: '#F0F9FF', borderRadius: 14, border: '1px solid #BAE6FD', padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Portail fournisseur</p>
                {project.supplier_portal_token ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigator.clipboard.writeText(`${FRONTEND_URL}/supplier-portal/${project.supplier_portal_token}`)}
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#0EA5E9', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      🔗 Copier lien portail
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Voici le lien du portail fournisseur : ${FRONTEND_URL}/supplier-portal/${project.supplier_portal_token}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, background: '#22c55e', color: '#fff', textDecoration: 'none' }}>
                      💬 WA
                    </a>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#7CB9D4', margin: 0 }}>Activez le portail fournisseur via l'icône 🏢 en haut de la page.</p>
                )}
              </div>

              {/* Liste fournisseurs depuis tradeResourcesMap */}
              <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: 16, maxHeight: 520, overflowY: 'auto' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#7C8089', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Sous-traitants assignés</p>
                {(() => {
                  const externalPeople = Object.entries(tradeResourcesMap || {}).flatMap(([tradeName, res]) =>
                    (res.external || []).map(p => ({ ...p, tradeName }))
                  );
                  if (!externalPeople.length) return (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#C4C8CE' }}>
                      <span style={{ fontSize: 28 }}>🏗️</span>
                      <p style={{ fontSize: 12, marginTop: 8 }}>Aucun sous-traitant assigné pour l'instant.</p>
                    </div>
                  );
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {externalPeople.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F0F2F4' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E0F2FE', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13 }}>🏗️</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#15171C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{p.tradeName}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                            {p.phone && (
                              <a href={`https://wa.me/${p.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                                style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', background: '#DCFCE7', borderRadius: 7, textDecoration: 'none', fontSize: 13 }} title="WhatsApp">💬</a>
                            )}
                            {p.email && (
                              <a href={`mailto:${p.email}?subject=Projet ${encodeURIComponent(project.name || '')}`}
                                style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', background: '#EEF1FD', borderRadius: 7, textDecoration: 'none', fontSize: 13 }} title="Courriel">✉️</a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Éditeur pipeline (niveau compagnie) ── */}
      {showPipelineEditor && editPipeline && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowPipelineEditor(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.18)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: BRAND_SOFT, display: 'grid', placeItems: 'center', fontSize: 18 }}>🏗️</div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#15171C', margin: 0 }}>Modifier le pipeline</h3>
                <p style={{ fontSize: 12, color: '#E8794E', margin: 0, fontWeight: 600 }}>⚠️ S'applique à tous tes projets</p>
              </div>
              <button type="button" onClick={() => setShowPipelineEditor(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18}/></button>
            </div>

            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Glisse pour réordonner. Clique sur un label pour renommer.</p>

            {/* Presets rapides */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 7 }}>Modèles prédéfinis</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Entrepreneur GC', stages: [
                    { key: 'brouillon', label: 'Brouillon', color: '#94a3b8' },
                    { key: 'estimation', label: 'Estimation terrain', color: '#a855f7' },
                    { key: 'prix_envoye', label: 'Prix envoyé', color: '#f59e0b' },
                    { key: 'accepte', label: 'Accepté', color: '#3b82f6' },
                    { key: 'planifie', label: 'Planifié', color: '#6366f1' },
                    { key: 'en_chantier', label: 'En chantier', color: '#22c55e' },
                    { key: 'a_facturer', label: 'À facturer', color: '#eab308' },
                    { key: 'paye', label: 'Payé', color: '#10b981' },
                    { key: 'clos', label: 'Clos', color: '#64748b', terminal: true },
                  ]},
                  { label: 'Proprio / Particulier', stages: [
                    { key: 'brouillon', label: 'Brouillon', color: '#94a3b8' },
                    { key: 'planification', label: 'Planification', color: '#a855f7' },
                    { key: 'soumissions', label: 'En soumission', color: '#f59e0b' },
                    { key: 'planifie', label: 'Planifié', color: '#6366f1' },
                    { key: 'en_chantier', label: 'En chantier', color: '#22c55e' },
                    { key: 'inspection', label: 'Inspection finale', color: '#eab308' },
                    { key: 'termine', label: 'Terminé', color: '#10b981' },
                    { key: 'clos', label: 'Clos', color: '#64748b', terminal: true },
                  ]},
                  { label: 'Sous-traitant', stages: [
                    { key: 'brouillon', label: 'Brouillon', color: '#94a3b8' },
                    { key: 'prix_envoye', label: 'Soumission envoyée', color: '#f59e0b' },
                    { key: 'accepte', label: 'Contrat signé', color: '#3b82f6' },
                    { key: 'planifie', label: 'Planifié', color: '#6366f1' },
                    { key: 'en_chantier', label: 'En chantier', color: '#22c55e' },
                    { key: 'a_facturer', label: 'À facturer', color: '#eab308' },
                    { key: 'paye', label: 'Payé', color: '#10b981' },
                    { key: 'clos', label: 'Clos', color: '#64748b', terminal: true },
                  ]},
                  { label: 'Promoteur immo', stages: [
                    { key: 'brouillon', label: 'Brouillon', color: '#94a3b8' },
                    { key: 'analyse', label: 'Analyse & faisabilité', color: '#a855f7' },
                    { key: 'financement', label: 'Financement', color: '#f59e0b' },
                    { key: 'permis', label: 'Permis & appro.', color: '#3b82f6' },
                    { key: 'en_chantier', label: 'En construction', color: '#22c55e' },
                    { key: 'ventes', label: 'Ventes / livraisons', color: '#eab308' },
                    { key: 'clos', label: 'Clos', color: '#64748b', terminal: true },
                  ]},
                ].map(preset => (
                  <button key={preset.label} type="button"
                    onClick={() => setEditPipeline(preset.stages)}
                    style={{ fontSize: 11, fontWeight: 700, background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 7, padding: '5px 11px', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#E8794E'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editPipeline.map((stage, idx) => (
                <div key={stage.key}
                  draggable
                  onDragStart={() => setPipeEditDragSrc(idx)}
                  onDragOver={e => {
                    e.preventDefault();
                    if (pipeEditDragSrc === null || pipeEditDragSrc === idx) return;
                    const next = [...editPipeline];
                    const [item] = next.splice(pipeEditDragSrc, 1);
                    next.splice(idx, 0, item);
                    setEditPipeline(next);
                    setPipeEditDragSrc(idx);
                  }}
                  onDrop={() => setPipeEditDragSrc(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', borderRadius: 10, padding: '8px 12px', border: '1px solid #E5E7EB' }}
                >
                  <GripVertical size={14} style={{ color: '#9CA3AF', cursor: 'grab', flexShrink: 0 }}/>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: stage.color || '#94a3b8', flexShrink: 0, border: '2px solid rgba(0,0,0,.1)' }}/>
                  <input
                    value={stage.label}
                    onChange={e => {
                      const next = editPipeline.map((s, i) => i === idx ? { ...s, label: e.target.value } : s);
                      setEditPipeline(next);
                    }}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#1F2937', outline: 'none' }}
                  />
                  {editPipeline.length > 2 && !stage.terminal && (
                    <button type="button" onClick={() => setEditPipeline(editPipeline.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px 4px' }}>
                      <X size={13}/>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button"
              onClick={() => setEditPipeline([...editPipeline.slice(0, -1), { key: `custom_${Date.now()}`, label: 'Nouvelle étape', color: '#94a3b8' }, editPipeline[editPipeline.length - 1]])}
              style={{ marginTop: 10, fontSize: 12, color: BRAND, background: 'none', border: `1px dashed ${BRAND_BORDER}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', width: '100%' }}
            >
              <Plus size={12} style={{ verticalAlign: 'middle' }}/> Ajouter une étape
            </button>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowPipelineEditor(false)}>Annuler</button>
              <button type="button" className="btn-primary flex-1" onClick={async () => {
                const { setPipeline } = useConfigStore.getState();
                await setPipeline(editPipeline);
                setShowPipelineEditor(false);
              }}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

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

        {/* ══ POST-ITS FLOTTANTS — couvrent tout (hero + sections) ══ */}
        {stickyNotes.filter(n => !n.archived).map(note => {
          const col = STICKY_COLORS.find(c => c.key === note.color) || STICKY_COLORS[0];
          return (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                top: note.top || 120,
                left: Math.min(note.left || 40, (stickyContainerRef.current?.offsetWidth || 900) - 224),
                width: 212,
                background: col.bg,
                borderRadius: 2,
                padding: '30px 13px 12px',
                boxShadow: '2px 4px 14px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.08)',
                zIndex: 30,
                userSelect: 'none',
                overflow: 'hidden',
              }}
              onMouseDown={e => {
                if (e.target.closest('button, textarea')) return;
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setStickyDragging({ id: note.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
              }}
            >
              {/* Bande adhésive (haut) */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: col.border + '55', cursor: 'grab' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 8px 0', height: '100%' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: col.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, opacity: 0.75 }}>
                    {note.author_name}
                  </p>
                  <p style={{ fontSize: 8.5, color: col.text, opacity: 0.5, margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(note.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} {new Date(note.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => saveStickyNotes(stickyNotes.map(n => n.id === note.id ? { ...n, archived: true } : n))}
                    style={{ width: 16, height: 16, borderRadius: 3, background: 'transparent', border: 'none', color: col.text, opacity: 0.55, fontSize: 14, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, flexShrink: 0, marginLeft: 5 }}
                    title="Archiver"
                  >×</button>
                </div>
              </div>
              {/* Texte */}
              <textarea
                value={note.text}
                placeholder="Votre note…"
                onChange={e => setStickyNotes(prev => prev.map(n => n.id === note.id ? { ...n, text: e.target.value } : n))}
                onBlur={() => saveStickyNotes(stickyNotes)}
                onMouseDown={e => e.stopPropagation()}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: col.text, lineHeight: 1.55, resize: 'none', fontFamily: 'inherit', minHeight: 72, cursor: 'text', padding: 0, boxSizing: 'border-box' }}
              />
              {/* Cercles couleurs */}
              <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                {STICKY_COLORS.map(c => (
                  <button
                    key={c.key}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => saveStickyNotes(stickyNotes.map(n => n.id === note.id ? { ...n, color: c.key } : n))}
                    style={{ width: 12, height: 12, borderRadius: '50%', background: c.bg, border: `2.5px solid ${c.key === note.color ? c.border : c.border + '50'}`, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    title={c.key}
                  />
                ))}
              </div>
              {/* Coin plié bas-droite */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 18px 18px', borderColor: `transparent transparent rgba(0,0,0,.13) transparent` }} />
            </div>
          );
        })}

        {/* ── Draft post-it ── */}
        {stickyDraft && (() => {
          const dCol = STICKY_COLORS.find(c => c.key === stickyDraft.color) || STICKY_COLORS[0];
          return (
            <div
              style={{
                position: 'absolute',
                top: stickyDraft.top,
                left: Math.min(stickyDraft.left, (stickyContainerRef.current?.offsetWidth || 900) - 244),
                width: 232,
                background: dCol.bg,
                borderRadius: 2,
                padding: '10px 13px 13px',
                boxShadow: '3px 5px 22px rgba(0,0,0,.22)',
                zIndex: 50,
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              <p style={{ fontSize: 10, fontWeight: 800, color: dCol.text, margin: '0 0 8px', opacity: 0.65 }}>Nouveau post-it</p>
              <textarea
                autoFocus
                value={stickyDraft.text}
                onChange={e => setStickyDraft(d => ({ ...d, text: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addStickyNote(stickyDraft); if (e.key === 'Escape') setStickyDraft(null); }}
                placeholder="Tapez votre note… (⌘↵)"
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: dCol.text, lineHeight: 1.55, resize: 'none', fontFamily: 'inherit', minHeight: 70, padding: 0, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 6, margin: '9px 0 10px' }}>
                {STICKY_COLORS.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setStickyDraft(d => ({ ...d, color: c.key }))}
                    style={{ width: 15, height: 15, borderRadius: '50%', background: c.bg, border: `2.5px solid ${c.key === stickyDraft.color ? c.border : c.border + '45'}`, cursor: 'pointer', padding: 0 }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button
                  onClick={() => addStickyNote(stickyDraft)}
                  style={{ flex: 1, fontSize: 11.5, fontWeight: 700, padding: '6px 0', borderRadius: 4, border: 'none', background: dCol.border, color: '#fff', cursor: 'pointer' }}
                >Épingler</button>
                <button
                  onClick={() => setStickyDraft(null)}
                  style={{ fontSize: 11.5, fontWeight: 600, padding: '6px 12px', borderRadius: 4, border: `1px solid ${dCol.border}60`, background: 'transparent', color: dCol.text, cursor: 'pointer', opacity: 0.7 }}
                >Annuler</button>
              </div>
            </div>
          );
        })()}


      </div>{/* fin zone sticky notes */}

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
