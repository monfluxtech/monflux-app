import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { HardHat, Phone, Mail, MapPin, Calendar, CheckCircle2, Clock, Loader2, AlertCircle, DollarSign, Briefcase, ChevronRight } from 'lucide-react';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api',
});

const TRADE_STATUS = {
  to_find: { label: 'À confirmer', color: '#94a3b8' },
  contacted: { label: 'Contacté', color: '#f59e0b' },
  quoted: { label: 'Prix reçu', color: '#6366f1' },
  confirmed: { label: 'Confirmé', color: '#3b82f6' },
  done: { label: 'Terminé', color: '#22c55e' },
};

const PAY_STATUS = {
  pending: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  paid: { label: 'Payé', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'Annulé', color: '#9ca3af', bg: '#f3f4f6' },
};

const PROJECT_STATUS_LABEL = {
  brouillon: 'Brouillon', estimation: 'Estimation', prix_envoye: 'Prix envoyé',
  accepte: 'Accepté', planifie: 'Planifié', en_chantier: 'En chantier',
  a_facturer: 'À facturer', paye: 'Payé', clos: 'Clos',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('fr-CA', { minimumFractionDigits: 2 }) + ' $';
}

export default function SubcontractorPortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/public/sub-portal/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError('Portail introuvable ou lien invalide.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">{error}</p>
        <p className="text-xs text-gray-400 mt-2">Demandez le lien à votre entrepreneur.</p>
      </div>
    </div>
  );

  const { sub, trades, payments } = data;
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F26522' }}>
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">MONFLUX</p>
              <p className="text-[10px] text-gray-400">Portail fournisseur</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
            <HardHat size={12} />
            Sous-traitant
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Identity card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-2" style={{ background: 'linear-gradient(90deg, #F26522, #ff8c42)' }} />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <HardHat size={22} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{sub.name}</h1>
                {sub.company_name && <p className="text-sm text-gray-400">{sub.company_name}</p>}
                {sub.rbq_number && <p className="text-xs text-gray-300 mt-0.5">RBQ : {sub.rbq_number}</p>}
              </div>
            </div>
            {sub.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sub.specialties.map(sp => (
                  <span key={sp} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                    {sp}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment summary */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">À recevoir</p>
              <p className="text-xl font-bold text-orange-500">{fmtMoney(totalPending)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Reçu (total)</p>
              <p className="text-xl font-bold text-green-600">{fmtMoney(totalPaid)}</p>
            </div>
          </div>
        )}

        {/* Assigned trades / projects */}
        {trades.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase size={14} className="text-orange-400" />
              Travaux assignés ({trades.length})
            </h2>
            <div className="space-y-3">
              {trades.map((t, i) => {
                const ts = TRADE_STATUS[t.status] || TRADE_STATUS.to_find;
                const pst = PROJECT_STATUS_LABEL[t.project_status] || t.project_status;
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{t.trade}</p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                        style={{ background: `${ts.color}18`, color: ts.color }}
                      >
                        {ts.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-1">{t.project_name}</p>
                    {(t.project_address || t.project_city) && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                        <MapPin size={10} className="flex-shrink-0" />
                        {[t.project_address, t.project_city].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      {t.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          {fmt(t.start_date)} {t.end_date && `→ ${fmt(t.end_date)}`}
                        </div>
                      )}
                      {t.estimated_cost && (
                        <span className="ml-auto font-semibold text-gray-600">
                          {fmtMoney(t.estimated_cost)}
                        </span>
                      )}
                    </div>
                    {t.notes && <p className="text-xs text-gray-400 mt-1.5 italic">{t.notes}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trades.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <Briefcase size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun travail assigné pour le moment.</p>
          </div>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign size={14} className="text-green-500" />
              Historique des paiements
            </h2>
            <div className="space-y-2">
              {payments.map((p, i) => {
                const ps = PAY_STATUS[p.status] || PAY_STATUS.pending;
                return (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: ps.bg }}
                    >
                      <CheckCircle2 size={14} style={{ color: ps.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-gray-900">{fmtMoney(p.amount)}</p>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2"
                          style={{ background: ps.bg, color: ps.color }}
                        >
                          {ps.label}
                        </span>
                      </div>
                      {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {p.project_name && <span>{p.project_name}</span>}
                        {p.payment_date && (
                          <span className="flex items-center gap-1 ml-auto">
                            <Clock size={9} />
                            {fmt(p.payment_date)}
                          </span>
                        )}
                      </div>
                      {p.invoice_ref && <p className="text-xs text-gray-300 mt-0.5">Réf: {p.invoice_ref}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contractor contact */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Votre entrepreneur</p>
          <p className="text-base font-bold text-gray-900 mb-2">{sub.contractor_name}</p>
          <div className="space-y-2">
            {sub.contractor_phone && (
              <a href={`tel:${sub.contractor_phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-orange-500">
                <Phone size={14} className="text-gray-300 flex-shrink-0" />
                {sub.contractor_phone}
              </a>
            )}
            {sub.contractor_email && (
              <a href={`mailto:${sub.contractor_email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-orange-500">
                <Mail size={14} className="text-gray-300 flex-shrink-0" />
                {sub.contractor_email}
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          Portail fournisseur propulsé par MONFLUX · Gestion de construction au Québec
        </p>
      </div>
    </div>
  );
}
