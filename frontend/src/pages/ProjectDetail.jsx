import { useEffect, useState, useRef } from 'react';
import { useT } from '../hooks/useT';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi, invoices as invoicesApi, quotes as quotesApi, quittances as quittancesApi, changeOrders as changeOrdersApi, subcontractors as subsApi, companies as companiesApi, rfqs as rfqsApi, contracts as contractsApi, materialOrders as materialOrdersApi, siteMedia as siteMediaApi, ai as aiApi, pdf } from '../api';
import { ArrowLeft, QrCode, Plus, Loader2, MapPin, Calendar, DollarSign, CheckCircle, Pencil, StickyNote, Receipt, FileText, GitBranch, Shield, Link2, ExternalLink, MessageCircle, Globe, FileEdit, Trash2, Copy, CheckCheck, TrendingUp, HardHat, FolderOpen, Eye, X, ClipboardCheck, Send, Camera, Sparkles, CreditCard, FileSignature, Briefcase, Users, UserPlus, LayoutDashboard, Wrench, FolderClosed, AlertCircle, Clock, Package, Image, ShieldAlert, Wand2, AlertTriangle, Mic } from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const money = (v) => (Number(v) || 0).toLocaleString('fr-CA', { maximumFractionDigits: 0 }) + '$';

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
const PHASE_COLORS = ['#F26522','#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#14b8a6','#ec4899'];

function GanttChart({ phases, projectStart, projectEnd }) {
  if (!phases || phases.length === 0) return null;

  const refStart = projectStart ? new Date(projectStart) : new Date();
  const refEnd   = projectEnd   ? new Date(projectEnd)   : new Date(refStart.getTime() + 90*86400000);
  const totalMs  = refEnd - refStart || 1;

  const months = [];
  const cur = new Date(refStart.getFullYear(), refStart.getMonth(), 1);
  while (cur <= refEnd) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  const pct = (d) => Math.max(0, Math.min(100, (new Date(d) - refStart) / totalMs * 100));
  const width = (s, e) => Math.max(1, pct(e) - pct(s));

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 480 }}>
        {/* Month headers */}
        <div className="flex mb-1 ml-36">
          {months.map((m, i) => {
            const left = pct(m);
            const nextM = new Date(m.getFullYear(), m.getMonth()+1, 1);
            const w = Math.min(pct(nextM), 100) - left;
            return (
              <div key={i} className="text-xs text-gray-400 border-l border-gray-100 pl-1" style={{ width:`${Math.max(w,0)}%`, minWidth: 30 }}>
                {m.toLocaleDateString('fr-CA',{month:'short'})}
              </div>
            );
          })}
        </div>
        {/* Today line */}
        <div className="relative ml-36">
          <div className="absolute top-0 bottom-0 w-px bg-brand z-10" style={{ left:`${pct(new Date())}%` }}/>
          {phases.map((ph, i) => {
            const s = ph.start_date ? new Date(ph.start_date) : refStart;
            const e = ph.end_date   ? new Date(ph.end_date)   : new Date(s.getTime()+14*86400000);
            const color = ph.color || PHASE_COLORS[i % PHASE_COLORS.length];
            const pct_left  = pct(s);
            const pct_width = width(s, e);
            return (
              <div key={ph.id} className="flex items-center mb-2 gap-2 -ml-36">
                <div className="w-36 text-xs font-medium text-gray-700 truncate pr-2 text-right flex-shrink-0">{ph.name}</div>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute h-full rounded-full flex items-center px-2 overflow-hidden"
                    style={{ left:`${pct_left}%`, width:`${pct_width}%`, minWidth:4, background:color+'33', border:`1.5px solid ${color}` }}
                  >
                    <div className="h-full rounded-full absolute left-0 top-0" style={{ width:`${ph.progress_pct||0}%`, background:color+'66' }}/>
                    {pct_width > 8 && <span className="relative text-xs font-medium z-10 truncate" style={{color}}>{ph.progress_pct||0}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseModal({ projectId, phase, onClose, onSave }) {
  const [form, setForm] = useState(phase ? {
    name:phase.name||'', start_date:phase.start_date?phase.start_date.slice(0,10):'',
    end_date:phase.end_date?phase.end_date.slice(0,10):'', progress_pct:phase.progress_pct||0,
    status:phase.status||'not_started'
  } : { name:'', start_date:'', end_date:'', progress_pct:0, status:'not_started' });
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

export default function ProjectDetail() {
  const t = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [genQr, setGenQr] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [showPhase, setShowPhase] = useState(false);
  const [editPhase, setEditPhase] = useState(null);
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
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaForm, setMediaForm] = useState({ type: 'photo', url: '', mime_type: '', caption: '', transcript: '' });
  const [analyzingMediaId, setAnalyzingMediaId] = useState(null);
  const [purchasePlan, setPurchasePlan] = useState(null);
  const [groupingPurchases, setGroupingPurchases] = useState(false);
  const [coImpact, setCoImpact] = useState({});   // { [coId]: impactObj }
  const [analyzingCoId, setAnalyzingCoId] = useState(null);
  const [aiNotice, setAiNotice] = useState('');

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

  useEffect(() => { load(); }, [id]);

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
    setShowPhase(false); setEditPhase(null);
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

  // ── TOC sections list ──
  const TOC_SECTIONS = [
    { id: 's-ai',         icon: '📡', label: 'Capture IA' },
    { id: 's-pipeline',   icon: '🔄', label: 'Pipeline' },
    { id: 's-infos',      icon: 'ℹ️',  label: 'Infos projet' },
    { id: 's-estimation', icon: '📊', label: 'Estimation terrain' },
    { id: 's-phases',     icon: '📅', label: 'Phases & Gantt' },
    { id: 's-profit',     icon: '💰', label: 'Rentabilité' },
    { id: 's-media',      icon: '📷', label: 'Photos & médias' },
    { id: 's-trades',     icon: '🏗️', label: 'Corps de métier' },
    { id: 's-punch',      icon: '⏱️', label: 'Punch' },
    { id: 's-soumission', icon: '📄', label: 'Devis précis' },
    { id: 's-invoices',   icon: '🧾', label: 'Factures' },
    { id: 's-contracts',  icon: '✍️', label: 'Contrats' },
    { id: 's-portal',     icon: '🌐', label: 'Portail client' },
    { id: 's-co',         icon: '📝', label: 'Avenants' },
    { id: 's-orders',     icon: '📦', label: 'Commandes' },
    { id: 's-quittances', icon: '✅', label: 'Quittances' },
  ];

  const PIPELINE_LABELS = {
    brouillon: 'Brouillon', estimation: 'Estimation terrain', prix_envoye: 'Prix envoyé',
    accepte: 'Accepté', planifie: 'Planifié', en_chantier: 'En chantier',
    a_facturer: 'À facturer', paye: 'Payé', clos: 'Clos',
  };

  const ProjectTOC = () => (
    <>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #E8EAED' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#7C8089', marginBottom: 5 }}>Fiche projet</div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#15171C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {TOC_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 8px', borderRadius: 9, border: 'none', background: 'none',
              cursor: 'pointer', textAlign: 'left', transition: '.12s',
              fontSize: 12.5, fontWeight: 500, color: '#3A3D44',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F6'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{s.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
          </button>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #E8EAED', padding: '10px 12px' }}>
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
      {/* ── Project Topbar ── */}
      <div style={{
        position: 'sticky', top: 0, height: 54,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center',
        gap: 10, padding: '0 36px', zIndex: 15,
      }}>
        <button
          onClick={() => navigate('/projets')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#7C8089', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Projets
        </button>
        <span style={{ color: '#C8CACD', fontSize: 13 }}>›</span>
        <b style={{ fontSize: 13, color: '#15171C', fontWeight: 700 }}>{project.name}</b>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary text-xs" onClick={() => window.print()}>
          📥 Exporter PDF
        </button>
        <button className="btn-primary text-xs" onClick={() => {
          if (project.portal_token) {
            navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`);
          }
        }}>
          Envoyer au client →
        </button>
      </div>

      {/* ── Hero ── */}
      <div id="s-hero" style={{ padding: '48px 56px 36px', background: '#E7EFF4', borderBottom: '1px solid #E8EAED' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#D8480F' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F26522', display: 'inline-block' }} />
            Projet · {PIPELINE_LABELS[project.status] || project.status || 'Brouillon'}
          </div>
          <button className="btn-secondary text-xs" onClick={() => setShowInfo(true)}>
            ✏️ Éditer les infos
          </button>
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-.04em', lineHeight: 1.02, color: '#15171C', margin: 0 }}>
          {project.name}
        </h1>
        {(project.address || project.client_name) && (
          <p style={{ margin: '12px 0 0', fontSize: 15, color: '#3A3D44', lineHeight: 1.55, maxWidth: '70ch' }}>
            {[project.client_name && `Client : ${project.client_name}`, project.address].filter(Boolean).join(' · ')}
          </p>
        )}
        {/* KV chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {project.contract_value && (
            <div className="kv">
              <div className="kv-k">Valeur contrat</div>
              <div className="kv-v">{money(project.contract_value)}</div>
            </div>
          )}
          {project.payment_terms && (
            <div className="kv">
              <div className="kv-k">Termes paiement</div>
              <div className="kv-v" style={{ fontSize: 15 }}>{project.payment_terms}</div>
            </div>
          )}
          {project.start_date && (
            <div className="kv">
              <div className="kv-k">Début → Fin</div>
              <div className="kv-v" style={{ fontSize: 14 }}>
                {new Date(project.start_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                {project.end_date && ` → ${new Date(project.end_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>
          )}
          {project.project_manager && (
            <div className="kv">
              <div className="kv-k">Chargé de projet</div>
              <div className="kv-v" style={{ fontSize: 14 }}>{project.project_manager}</div>
            </div>
          )}
          <div className="kv">
            <div className="kv-k">Avancement</div>
            <div className="kv-v" style={{ color: '#F26522' }}>{pct}%</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 4, background: '#D1D9E0', borderRadius: 99, overflow: 'hidden', maxWidth: 400 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#F26522', borderRadius: 99, transition: '.4s' }} />
        </div>
      </div>

      {/* ── Doc sections ── */}
      <div style={{ padding: '0 56px 64px' }}>

        {/* Infos projet */}
        <div id="s-infos" style={{ paddingTop: 40, paddingBottom: 32, borderBottom: '1px solid #E8EAED', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '1px solid #E8EAED', display: 'grid', placeItems: 'center', fontSize: 22, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>ℹ️</div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>Infos du projet</h2>
              <div style={{ fontSize: 13, color: '#7C8089', marginTop: 3 }}>Responsabilités, permis, équipements</div>
            </div>
            <button className="btn-secondary text-xs ml-auto" onClick={() => setShowInfo(true)}><Pencil size={12}/> Modifier</button>
          </div>
          {project.payment_terms && (
            <div style={{ background: '#FFF3EC', border: '1px solid #FBE0CD', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <CreditCard size={16} style={{ color: '#F26522', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#7C8089' }}>Termes de paiement</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#15171C', marginTop: 2 }}>{project.payment_terms}</p>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 24px' }}>
            {[
              ['Chargé de projet', project.project_manager],
              ['Acheteur matériaux', project.materials_buyer],
              ['Approbateurs', (project.approvers || []).join(', ')],
              ['Responsable permis', project.permits_responsible],
              ['Permis requis', project.permits_required ? 'Oui' : 'Non'],
              ['Machines', (project.machines || []).join(', ')],
            ].map(([label, value]) => value ? (
              <div key={label}>
                <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#7C8089' }}>{label}</p>
                <p style={{ fontSize: 13.5, color: '#15171C', marginTop: 3 }}>{value}</p>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Estimation terrain */}
        <div id="s-estimation">
        <FieldEstimation project={project} onUpdated={load} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-gray-900">{project.phases?.length || 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Phases</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-green-500">{activeTs.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pointés maintenant</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-gray-900">{timesheets.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total punchs</p>
          </div>
        </div>

        {/* Rentabilité */}
        {profit && (
          <div id="s-profit" className="card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-brand" />
              <h2 className="font-semibold text-gray-900 text-sm">Rentabilité</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Théorique', d: profit.theoretical, sub: 'Commande − coûts estimés (budgets + métiers)' },
                { label: 'Réelle', d: profit.actual, sub: 'Factures émises − punch & dépenses' },
              ].map(({ label, d, sub }) => {
                const pos = (d.margin || 0) >= 0;
                return (
                  <div key={label} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500">Marge {label.toLowerCase()}</p>
                      {d.margin_pct != null && <span className={`badge ${pos ? 'badge-green' : 'badge-red'}`}>{d.margin_pct}%</span>}
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${pos ? 'text-green-600' : 'text-red-500'}`}>{money(d.margin)}</p>
                    <p className="text-xs text-gray-400 mb-2">{sub}</p>
                    <div className="pt-2 border-t border-gray-50 space-y-0.5 text-xs text-gray-500">
                      <div className="flex justify-between"><span>Revenus</span><span className="font-medium text-gray-700">{money(d.revenue)}</span></div>
                      <div className="flex justify-between"><span>Coûts</span><span className="font-medium text-gray-700">{money(d.cost)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Taux de coût main d'œuvre interne (punch)&nbsp;:</span>
              <div className="flex items-center gap-1">
                <input
                  className="input py-1 text-xs" style={{ width: 80 }} type="number" min="0" step="0.5"
                  value={laborRate} onChange={e => setLaborRate(e.target.value)} placeholder="0"
                />
                <span className="text-xs text-gray-400">$/h</span>
                <button className="btn-secondary text-xs py-1 px-2" onClick={saveLaborRate} disabled={savingRate}>
                  {savingRate ? <Loader2 size={12} className="animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
              <span className="text-[11px] text-gray-400">{profit.actual.cost_breakdown.hours_logged || 0}h pointées · main d'œuvre {money(profit.actual.cost_breakdown.labor_punch)} · dépenses {money(profit.actual.cost_breakdown.expenses)}</span>
            </div>
          </div>
        )}

        {/* Gantt */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Phases</h2>
            <button className="btn-secondary text-xs py-1.5" onClick={()=>setShowPhase(true)}>
              <Plus size={13}/> Ajouter une phase
            </button>
          </div>

          {(showPhase || editPhase) && (
            <PhaseModal
              projectId={id}
              phase={editPhase}
              onClose={()=>{setShowPhase(false);setEditPhase(null);}}
              onSave={handlePhaseSave}
            />
          )}

          {project.phases?.length > 0 ? (
            <>
              <GanttChart phases={project.phases} projectStart={project.start_date} projectEnd={project.end_date}/>
              <div className="mt-4 space-y-2">
                {project.phases.map((ph, i) => (
                  <div key={ph.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: ph.color || PHASE_COLORS[i % PHASE_COLORS.length]}}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{ph.name}</p>
                        <span className={`badge ${PS_BADGE[ph.status]}`}>{PS_LABEL[ph.status]}</span>
                      </div>
                      {ph.start_date && (
                        <p className="text-xs text-gray-400">
                          {new Date(ph.start_date).toLocaleDateString('fr-CA')}
                          {ph.end_date && ` → ${new Date(ph.end_date).toLocaleDateString('fr-CA')}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full flex-shrink-0">
                        <div className="h-full rounded-full bg-brand" style={{width:`${ph.progress_pct||0}%`}}/>
                      </div>
                      <span className="text-sm font-bold text-brand w-8 text-right">{ph.progress_pct||0}%</span>
                      <button className="btn-ghost p-1 text-gray-300 hover:text-blue-500" onClick={()=>setEditPhase(ph)}><Pencil size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 mb-3">Aucune phase définie. Ajoutez des phases pour activer le Gantt.</p>
              <button className="btn-primary text-xs" onClick={()=>setShowPhase(true)}><Plus size={13}/> Ajouter une phase</button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={15} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Notes de chantier</h2>
            {notesSaving && <span className="text-xs text-gray-400 ml-auto">Enregistrement…</span>}
          </div>
          <textarea
            className="input resize-none"
            style={{ minHeight: 96 }}
            placeholder="Ajoutez des notes, remarques ou observations sur ce projet…"
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
          />
        </div>

        {aiNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
            <p className="text-xs text-amber-700">{aiNotice}</p>
            <button className="ml-auto text-amber-400 hover:text-amber-600" onClick={() => setAiNotice('')}><X size={13}/></button>
          </div>
        )}

        {/* ── Médias chantier (IA) ──────────────────────────────────────────── */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Médias chantier</h2>
              {media.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{media.length}</span>}
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={() => setShowMediaForm(v => !v)}><Plus size={13}/> Ajouter</button>
          </div>
          <p className="text-xs text-gray-400 mb-3">Photos, notes et mémos vocaux. L'IA détecte les non-conformités (RBQ) et risques de sécurité (CNESST).</p>

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
            <div className="space-y-2">
              {media.map(m => {
                const a = m.ai_analysis;
                const issues = (a?.non_conformities?.length || 0) + (a?.safety_risks?.length || 0);
                return (
                  <div key={m.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      {m.type === 'photo' && m.url
                        ? <img src={m.url} alt={m.caption || ''} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100"/>
                        : <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{m.type === 'voice' ? <Mic size={18} className="text-gray-300"/> : <StickyNote size={18} className="text-gray-300"/>}</div>}
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
          ) : !showMediaForm && (
            <div className="text-center py-5">
              <Camera size={26} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">Aucun média. Ajoutez photos et notes de chantier pour l'analyse IA.</p>
            </div>
          )}
        </div>

        {/* Corps de métiers */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardHat size={15} className="text-brand" />
              <h2 className="font-semibold text-gray-900 text-sm">Corps de métiers</h2>
              {project.trades?.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{project.trades.length}</span>}
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={() => setShowTradeForm(v => !v)}><Plus size={13} /> Ajouter</button>
          </div>

          {showTradeForm && (
            <form onSubmit={addTrade} className="bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div className="sm:col-span-1"><label className="label">Métier *</label><input className="input" value={tradeForm.trade} onChange={e => setTradeForm(f => ({ ...f, trade: e.target.value }))} placeholder="Ex: Électricité" required /></div>
              <div><label className="label">Coût estimé ($)</label><input className="input" type="number" step="0.01" value={tradeForm.estimated_cost} onChange={e => setTradeForm(f => ({ ...f, estimated_cost: e.target.value }))} placeholder="0" /></div>
              <div className="flex gap-2">
                <select className="input flex-1" value={tradeForm.chosen_subcontractor_id} onChange={e => setTradeForm(f => ({ ...f, chosen_subcontractor_id: e.target.value }))}>
                  <option value="">Sous-traitant…</option>
                  {subs.map(s => <option key={s.id} value={s.id}>{s.name}{s.company_name ? ` (${s.company_name})` : ''}</option>)}
                </select>
                <button type="submit" className="btn-primary text-xs px-3">OK</button>
              </div>
            </form>
          )}

          {project.trades?.length > 0 ? (
            <div className="space-y-2">
              {project.trades.map(t => (
                <div key={t.id} className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-800 flex-1 min-w-[120px]">{t.trade}</span>
                  <select
                    className="input py-1 text-xs" style={{ width: 130 }}
                    value={t.status} onChange={e => patchTrade(t.id, { status: e.target.value })}
                  >
                    {Object.entries(TRADE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select
                    className="input py-1 text-xs" style={{ width: 170 }}
                    value={t.chosen_subcontractor_id || ''} onChange={e => patchTrade(t.id, { chosen_subcontractor_id: e.target.value || null })}
                  >
                    <option value="">— Sous-traitant choisi —</option>
                    {subs.map(s => <option key={s.id} value={s.id}>{s.name}{s.company_name ? ` (${s.company_name})` : ''}</option>)}
                  </select>
                  <span className="text-xs text-gray-500 w-20 text-right">{t.estimated_cost != null ? money(t.estimated_cost) : '—'}</span>
                  <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" onClick={() => removeTrade(t.id)}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          ) : !showTradeForm && (
            <div className="text-center py-5">
              <HardHat size={26} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Déclarez les corps de métiers requis et assignez le sous-traitant choisi pour chacun.</p>
            </div>
          )}
        </div>

        {/* Dépenses réelles */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={15} className="text-brand" />
              <h2 className="font-semibold text-gray-900 text-sm">Dépenses & factures fournisseurs</h2>
              {project.expenses?.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{project.expenses.length}</span>}
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={() => setShowExpenseForm(v => !v)}><Plus size={13} /> Ajouter</button>
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

        {/* ── Feuilles de temps ─────────────────────────────────────────────── */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-brand"/>
            <h2 className="font-semibold text-gray-900 text-sm">Feuilles de temps</h2>
            {timesheets.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{timesheets.length}</span>}
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

        {/* ── Commandes matériaux ───────────────────────────────────────────── */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Commandes matériaux</h2>
              {materialOrders.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{materialOrders.length}</span>}
            </div>
            <div className="flex gap-2">
              {materialOrders.length > 0 && (
                <button className="btn-ghost text-xs py-1.5 text-brand" onClick={groupPurchases} disabled={groupingPurchases}>
                  {groupingPurchases ? <Loader2 size={13} className="animate-spin"/> : <Wand2 size={13}/>} Regrouper (IA)
                </button>
              )}
              <button className="btn-secondary text-xs py-1.5" onClick={() => setShowOrderForm(v => !v)}><Plus size={13}/> Commande</button>
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

        {/* ── QR Punch ─────────────────────────────────────────────────────── */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><QrCode size={15} className="text-brand"/><h2 className="font-semibold text-gray-900 text-sm">Punch QR</h2></div>
            <button className="btn-secondary text-xs py-1.5" onClick={generateQR} disabled={genQr}>
              {genQr ? <Loader2 size={13} className="animate-spin"/> : <QrCode size={13}/>} Générer QR
            </button>
          </div>
          {qrData ? (
            <div className="flex items-start gap-4">
              <img src={qrData.qr_image} alt="QR" className="w-28 h-28 border border-gray-200 rounded-xl flex-shrink-0"/>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Affichez ce QR à l'entrée du chantier</p>
                <p className="text-xs text-gray-400 mb-2">Les travailleurs scannent avec leur téléphone pour pointer entrée/sortie.</p>
                <button className="btn-primary text-xs py-1.5" onClick={printQR}><QrCode size={13}/> Imprimer le QR</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Générez un QR unique pour que les travailleurs puissent pointer sur ce chantier.</p>
          )}
        </div>

        {/* Quote Builder */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Soumission détaillée</h2>
              {quoteBuilderQuote?.status === 'sent' && <span className="badge badge-blue text-xs">Envoyée</span>}
              {quoteBuilderQuote?.status === 'signed' && <span className="badge badge-green text-xs">Signée</span>}
            </div>
            {quoteSaving && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={11} className="animate-spin"/> Enreg…</span>}
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

        {/* RFQs — demandes de prix aux sous-traitants */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">{t('rfqs')} ({t('subcontractors').toLowerCase()})</h2>
              {projectRfqs.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{projectRfqs.length}</span>}
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={() => setShowRfqForm(v => !v)}>
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

        {/* Contrats */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileSignature size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Contrat</h2>
              {projectContracts.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{projectContracts.length}</span>}
            </div>
            {quoteBuilderQuote && projectContracts.length === 0 && (
              <button className="btn-secondary text-xs py-1.5" onClick={generateContract} disabled={generatingContract}>
                {generatingContract ? <Loader2 size={13} className="animate-spin"/> : <FileSignature size={13}/>}
                Générer depuis la soumission
              </button>
            )}
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

        {/* Factures liées */}
        {projectInvoices.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-brand" />
                <h2 className="font-semibold text-gray-900 text-sm">Factures ({projectInvoices.length})</h2>
              </div>
              <button className="btn-ghost text-xs py-1 px-2" onClick={() => navigate('/factures')}>Voir tout</button>
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

        {/* Soumissions liées */}
        {projectQuotes.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-brand" />
                <h2 className="font-semibold text-gray-900 text-sm">{t('quotes')} & {t('change_orders')} ({projectQuotes.length})</h2>
              </div>
              <button className="btn-secondary text-xs py-1 px-2" onClick={() => navigate(`/soumissions?new=1&project_id=${id}&title=${encodeURIComponent(t('change_order')+' — '+project.name)}`)}><Plus size={12}/> {t('add_change_order')}</button>
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

        {/* Documents */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={15} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Documents</h2>
            {project.documents?.length > 0 && <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{project.documents.length}</span>}
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

        {/* Quittance */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Quittance finale</h2>
              <span className="text-xs text-gray-400">— Certificat de satisfaction client (Québec)</span>
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

        {/* Client Portal */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={15} className="text-brand"/>
            <h2 className="font-semibold text-gray-900 text-sm">Portail client</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Partagez ce lien avec votre client pour qu'il suive l'avancement du chantier en temps réel.</p>

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
        </div>

        {/* Change Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileEdit size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Demandes de modification</h2>
              {changeOrdersList.length > 0 && (
                <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{changeOrdersList.length}</span>
              )}
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={()=>setShowCOForm(v=>!v)}>
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

        {/* QR Punch */}
        <div id="s-punch" className="card mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><QrCode size={15} className="text-brand"/><h2 className="font-semibold text-gray-900 text-sm">Punch</h2></div>
            {!qrData && (
              <button className="btn-secondary text-xs py-1.5" onClick={generateQR} disabled={genQr}>
                {genQr?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>} Générer QR
              </button>
            )}
          </div>

          {qrData ? (
            <div className="flex items-start gap-4">
              <img src={qrData.qr_image} alt="QR" className="w-28 h-28 border border-gray-200 rounded-xl flex-shrink-0"/>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Affichez ce QR à l'entrée du chantier</p>
                <p className="text-xs text-gray-400 mb-3">Les travailleurs scannent pour pointer entrée et sortie.</p>
                <button className="btn-primary text-xs py-1.5" onClick={printQR}><QrCode size={13}/> Imprimer le QR</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Générez un QR unique pour que les travailleurs puissent pointer sur ce chantier.</p>
          )}

          {timesheets.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Punchs récents</p>
              <div className="space-y-1.5">
                {timesheets.slice(0,5).map(ts=>(
                  <div key={ts.id} className="flex items-center gap-3 text-xs text-gray-600">
                    <CheckCircle size={12} className={ts.clock_out?'text-gray-300':'text-green-500'}/>
                    <span className="font-medium">{ts.user_name||ts.sub_name||ts.worker_name||'Inconnu'}</span>
                    <span className="text-gray-400">{ts.clock_in&&new Date(ts.clock_in).toLocaleString('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    {ts.hours_total&&<span className="ml-auto font-medium text-gray-700">{ts.hours_total}h</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
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
