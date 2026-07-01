import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, CheckCircle2, ChevronRight, Clock, FileText, Globe, Loader2, Mail, MapPin, Phone, Send, AlertCircle, Receipt, FolderOpen, ClipboardEdit, ShieldAlert, Camera, Plus, ExternalLink } from 'lucide-react';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api' });

const STATUS_LABEL = {
  active: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
  cancelled: 'Annulé',
  pending: 'À démarrer',
  planning: 'En planification',
};

const STATUS_COLOR = {
  active: '#22c55e',
  completed: '#3b82f6',
  on_hold: '#f59e0b',
  cancelled: '#9ca3af',
  pending: '#a855f7',
  planning: '#F26522',
};

const PHASE_STATUS_LABEL = {
  not_started: 'À venir',
  in_progress: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
};

const PHASE_STATUS_COLOR = {
  not_started: '#d1d5db',
  in_progress: '#F26522',
  completed: '#22c55e',
  on_hold: '#f59e0b',
};

const DEFAULT_VISIBILITY = {
  overview: true,
  phases: true,
  timeline: true,
  messages: true,
  quote_signing: true,
  invoices: true,
  documents: true,
  change_orders: true,
  non_conformities: true,
  media: true,
};

const INVOICE_STATUS_LABEL = {
  sent: 'Envoyée', viewed: 'Vue', partial: 'Partielle', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée',
};

const DOCUMENT_TYPE_LABEL = {
  quote: 'Devis', contract: 'Contrat', invoice: 'Facture', quittance: 'Quittance',
};

function ProgressCircle({ pct, size = 100, stroke = 8, color = '#F26522' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function TimelineBar({ start, end }) {
  const now = Date.now();
  const s = start ? new Date(start).getTime() : null;
  const e = end ? new Date(end).getTime() : null;
  if (!s || !e) return null;

  const total = e - s;
  const elapsed = Math.max(0, Math.min(total, now - s));
  const pct = Math.round((elapsed / total) * 100);
  const isLate = now > e;
  const fmt = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>{fmt(start)}</span>
        <span className={isLate ? 'text-red-500 font-medium' : 'text-gray-400'}>{fmt(end)}</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${isLate ? 'bg-red-400' : 'bg-brand'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-600" style={{ left: `${Math.min(pct, 99)}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Début</span>
        {isLate ? <span className="text-red-400 font-medium">Dépassement prévu</span> : <span>{pct}% du temps écoulé</span>}
        <span>Fin prévue</span>
      </div>
    </div>
  );
}

export default function ProjectPortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [showChangeOrderForm, setShowChangeOrderForm] = useState(false);
  const [changeOrderForm, setChangeOrderForm] = useState({ title: '', description: '' });
  const [sendingChangeOrder, setSendingChangeOrder] = useState(false);
  const [changeOrderSent, setChangeOrderSent] = useState(false);

  const [showNcForm, setShowNcForm] = useState(false);
  const [ncForm, setNcForm] = useState({ titre: '', description: '' });
  const [sendingNc, setSendingNc] = useState(false);
  const [ncSent, setNcSent] = useState(false);

  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaForm, setMediaForm] = useState({ caption: '', url: '', author_name: '' });
  const [sendingMedia, setSendingMedia] = useState(false);
  const [mediaSent, setMediaSent] = useState(false);

  useEffect(() => {
    api.get(`/public/portal/${token}`)
      .then((r) => setData(r.data))
      .catch(() => setError('Portail introuvable ou lien invalide.'))
      .finally(() => setLoading(false));
    api.get(`/public/portal/${token}/invoices`).then((r) => setInvoices(r.data)).catch(() => {});
    api.get(`/public/portal/${token}/documents`).then((r) => setDocuments(r.data)).catch(() => {});
  }, [token]);

  const visibility = useMemo(
    () => ({ ...DEFAULT_VISIBILITY, ...((data?.portal_visibility?.client) || {}) }),
    [data?.portal_visibility],
  );

  const submitChangeOrder = async () => {
    if (!changeOrderForm.title.trim()) return;
    setSendingChangeOrder(true);
    try {
      await api.post(`/public/portal/${token}/change-orders`, changeOrderForm);
      setChangeOrderSent(true);
      setShowChangeOrderForm(false);
      setChangeOrderForm({ title: '', description: '' });
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de l’envoi.');
    } finally {
      setSendingChangeOrder(false);
    }
  };

  const submitNonConformity = async () => {
    if (!ncForm.titre.trim()) return;
    setSendingNc(true);
    try {
      await api.post(`/public/portal/${token}/non-conformites`, ncForm);
      setNcSent(true);
      setShowNcForm(false);
      setNcForm({ titre: '', description: '' });
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de l’envoi.');
    } finally {
      setSendingNc(false);
    }
  };

  const submitMedia = async () => {
    if (!mediaForm.caption.trim() && !mediaForm.url.trim()) return;
    setSendingMedia(true);
    try {
      await api.post(`/public/portal/${token}/media`, mediaForm);
      setMediaSent(true);
      setShowMediaForm(false);
      setMediaForm({ caption: '', url: '', author_name: mediaForm.author_name });
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de l’envoi.');
    } finally {
      setSendingMedia(false);
    }
  };

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    setSendingFeedback(true);
    try {
      await api.post(`/public/portal/${token}/feedback`, { message: feedback, author_name: authorName });
      setFeedbackSent(true);
      setFeedback('');
      setShowFeedbackForm(false);
    } catch {
      alert('Erreur lors de l’envoi.');
    } finally {
      setSendingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Demandez le lien à votre entrepreneur.</p>
        </div>
      </div>
    );
  }

  const progress = data.progress_pct || 0;
  const statusColor = STATUS_COLOR[data.status] || '#9ca3af';
  const statusLabel = STATUS_LABEL[data.status] || data.status;
  const completedPhases = data.phases?.filter((phase) => phase.status === 'completed').length || 0;
  const totalPhases = data.phases?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F26522' }}>
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">MONFLUX</p>
              <p className="text-[10px] text-gray-400">Suivi de chantier</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${statusColor}18`, color: statusColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {visibility.overview && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="h-2" style={{ background: 'linear-gradient(90deg, #F26522, #ff8c42)' }} />
            <div className="p-5">
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1">{data.name}</h1>
              {data.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{data.description}</p>}
              {(data.address || data.city) && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
                  <MapPin size={13} className="flex-shrink-0" />
                  {[data.address, data.city].filter(Boolean).join(', ')}
                </div>
              )}

              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <ProgressCircle pct={progress} size={88} stroke={8} color={statusColor} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{progress}%</span>
                    <span className="text-[10px] text-gray-400 leading-none">complété</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {visibility.timeline && (data.start_date || data.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={13} className="text-gray-300 flex-shrink-0" />
                      <span>
                        {data.start_date ? new Date(data.start_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}
                        {data.end_date && ` → ${new Date(data.end_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </span>
                    </div>
                  )}
                  {visibility.phases && totalPhases > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" />
                      <span>{completedPhases} / {totalPhases} phase{totalPhases > 1 ? 's' : ''} terminée{completedPhases > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {visibility.timeline && data.end_date && data.status !== 'completed' && (() => {
                    const daysLeft = Math.ceil((new Date(data.end_date) - Date.now()) / 86400000);
                    return (
                      <div className={`flex items-center gap-2 text-sm font-medium ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-500'}`}>
                        <Clock size={13} className="flex-shrink-0" />
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}j de retard` : daysLeft === 0 ? 'Fin prévue aujourd’hui' : `${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {visibility.timeline && <TimelineBar start={data.start_date} end={data.end_date} />}
            </div>
          </div>
        )}

        {visibility.quote_signing && data.quote_url && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand flex items-center justify-center flex-shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide font-semibold text-gray-400 mb-1">Devis</p>
                <p className="text-sm font-semibold text-gray-800">{data.quote_title || 'Devis interactif'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.quote_signed_at ? 'Le devis est déjà signé.' : 'Vous pouvez consulter et signer votre devis en ligne.'}
                </p>
              </div>
            </div>
            <a
              href={data.quote_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: '#F26522', textDecoration: 'none' }}
            >
              <FileText size={15} />
              {data.quote_signed_at ? 'Ouvrir le devis signé' : 'Voir et signer le devis'}
            </a>
          </div>
        )}

        {visibility.phases && data.phases?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Étapes du chantier</h2>
            <div className="space-y-3">
              {data.phases.map((phase, index) => {
                const pct = phase.progress_pct || 0;
                const phaseColor = PHASE_STATUS_COLOR[phase.status] || '#d1d5db';
                const isCompleted = phase.status === 'completed';
                return (
                  <div key={`${phase.name}-${index}`} className={`flex items-center gap-3 ${isCompleted ? 'opacity-70' : ''}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: `${phaseColor}20`, color: phaseColor }}>
                      {isCompleted ? <CheckCircle2 size={14} /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{phase.name}</p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: phaseColor }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${phaseColor}18`, color: phaseColor }}>
                      {PHASE_STATUS_LABEL[phase.status] || phase.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visibility.messages && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            {(data.messages || []).length > 0 && (
              <div className="mb-4 space-y-2">
                {(data.messages || []).map((message, index) => (
                  <div key={`${message.created_at}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-gray-600">{message.author_name || 'Portail client'}</p>
                      <p className="text-[11px] text-gray-400">{message.created_at ? new Date(message.created_at).toLocaleDateString('fr-CA') : ''}</p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            )}

            {feedbackSent ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">Votre message a été transmis à l’entrepreneur.</p>
              </div>
            ) : showFeedbackForm ? (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Envoyer un message</h2>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-2"
                  placeholder="Votre nom"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none mb-3"
                  rows={3}
                  placeholder="Votre message à l’entrepreneur..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50" onClick={() => setShowFeedbackForm(false)}>Annuler</button>
                  <button
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: '#F26522' }}
                    onClick={sendFeedback}
                    disabled={sendingFeedback || !feedback.trim()}
                  >
                    {sendingFeedback ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Envoyer
                  </button>
                </div>
              </div>
            ) : (
              <button className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowFeedbackForm(true)}>
                <span>Envoyer un message à l’entrepreneur</span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            )}
          </div>
        )}

        {/* ── Factures ── */}
        {visibility.invoices && invoices.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Vos factures</h2>
            </div>
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <a
                  key={invoice.public_token}
                  href={`/facture/${invoice.public_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Facture #{invoice.number}</p>
                    <p className="text-xs text-gray-400">
                      {invoice.due_date ? `Échéance ${new Date(invoice.due_date).toLocaleDateString('fr-CA')}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{Number(invoice.total || 0).toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</p>
                    <span className="text-[10px] font-semibold text-gray-500">{INVOICE_STATUS_LABEL[invoice.status] || invoice.status}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        {visibility.documents && documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Documents</h2>
            </div>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <a
                  key={`${doc.type}-${index}`}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.label}</p>
                    <p className="text-xs text-gray-400">{DOCUMENT_TYPE_LABEL[doc.type] || doc.type}</p>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Demandes de modification ── */}
        {visibility.change_orders && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardEdit size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Demande de modification</h2>
            </div>
            {changeOrderSent ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">Votre demande a été transmise à l’entrepreneur.</p>
              </div>
            ) : showChangeOrderForm ? (
              <div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-2"
                  placeholder="Titre de la modification demandée"
                  value={changeOrderForm.title}
                  onChange={(e) => setChangeOrderForm((f) => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none mb-3"
                  rows={3}
                  placeholder="Décrivez le changement souhaité…"
                  value={changeOrderForm.description}
                  onChange={(e) => setChangeOrderForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50" onClick={() => setShowChangeOrderForm(false)}>Annuler</button>
                  <button
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: '#F26522' }}
                    onClick={submitChangeOrder}
                    disabled={sendingChangeOrder || !changeOrderForm.title.trim()}
                  >
                    {sendingChangeOrder ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Envoyer la demande
                  </button>
                </div>
              </div>
            ) : (
              <button className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowChangeOrderForm(true)}>
                <span>Demander une modification au projet</span>
                <Plus size={15} className="text-gray-300" />
              </button>
            )}
          </div>
        )}

        {/* ── Non-conformités ── */}
        {visibility.non_conformities && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Signaler une non-conformité</h2>
            </div>
            {ncSent ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">Votre signalement a été transmis à l’entrepreneur.</p>
              </div>
            ) : showNcForm ? (
              <div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-2"
                  placeholder="Ex : Finition autour de l'évier à reprendre"
                  value={ncForm.titre}
                  onChange={(e) => setNcForm((f) => ({ ...f, titre: e.target.value }))}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none mb-3"
                  rows={3}
                  placeholder="Détails additionnels (optionnel)…"
                  value={ncForm.description}
                  onChange={(e) => setNcForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50" onClick={() => setShowNcForm(false)}>Annuler</button>
                  <button
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: '#F26522' }}
                    onClick={submitNonConformity}
                    disabled={sendingNc || !ncForm.titre.trim()}
                  >
                    {sendingNc ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Envoyer le signalement
                  </button>
                </div>
              </div>
            ) : (
              <button className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowNcForm(true)}>
                <span>Signaler un problème sur le chantier</span>
                <Plus size={15} className="text-gray-300" />
              </button>
            )}
          </div>
        )}

        {/* ── Notes et photos ── */}
        {visibility.media && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Notes et photos</h2>
            </div>
            {mediaSent ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">Ajouté — visible par l’entrepreneur.</p>
              </div>
            ) : showMediaForm ? (
              <div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-2"
                  placeholder="Votre nom (optionnel)"
                  value={mediaForm.author_name}
                  onChange={(e) => setMediaForm((f) => ({ ...f, author_name: e.target.value }))}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none mb-2"
                  rows={3}
                  placeholder="Votre note ou observation…"
                  value={mediaForm.caption}
                  onChange={(e) => setMediaForm((f) => ({ ...f, caption: e.target.value }))}
                />
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-3"
                  placeholder="Lien d'une photo ou vidéo (optionnel)"
                  value={mediaForm.url}
                  onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50" onClick={() => setShowMediaForm(false)}>Annuler</button>
                  <button
                    className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: '#F26522' }}
                    onClick={submitMedia}
                    disabled={sendingMedia || (!mediaForm.caption.trim() && !mediaForm.url.trim())}
                  >
                    {sendingMedia ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Ajouter
                  </button>
                </div>
              </div>
            ) : (
              <button className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setShowMediaForm(true)}>
                <span>Ajouter une note, photo ou vidéo</span>
                <Plus size={15} className="text-gray-300" />
              </button>
            )}
          </div>
        )}

        {visibility.overview && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Votre entrepreneur</p>
            <p className="text-base font-bold text-gray-900 mb-2">{data.company_name}</p>
            <div className="space-y-2">
              {data.company_phone && (
                <a href={`tel:${data.company_phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand">
                  <Phone size={14} className="text-gray-300 flex-shrink-0" />
                  {data.company_phone}
                </a>
              )}
              {data.company_email && (
                <a href={`mailto:${data.company_email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand">
                  <Mail size={14} className="text-gray-300 flex-shrink-0" />
                  {data.company_email}
                </a>
              )}
              {data.company_website && (
                <a href={data.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand">
                  <Globe size={14} className="text-gray-300 flex-shrink-0" />
                  {data.company_website}
                </a>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Suivi de chantier propulsé par MONFLUX · Gestion de construction au Québec</p>
      </div>
    </div>
  );
}
