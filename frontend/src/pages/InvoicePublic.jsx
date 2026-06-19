import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Receipt, Building2, Phone, Mail, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../api';

const SL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée' };
const SB = { draft:'#9ca3af', sent:'#3b82f6', viewed:'#f59e0b', partial:'#F26522', paid:'#22c55e', overdue:'#ef4444', cancelled:'#9ca3af' };

export default function InvoicePublic() {
  const { token } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/public/invoice/${token}`)
      .then(({ data }) => setInvoice(data))
      .catch(e => setError(e.response?.data?.error || 'Facture introuvable'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        Chargement de votre facture…
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertTriangle size={40} className="text-orange-400 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Facture introuvable</h1>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  const isOverdue = invoice.status === 'overdue' || (invoice.due_date && new Date(invoice.due_date) < new Date() && !['paid','cancelled'].includes(invoice.status));
  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F26522' }}>
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">MONFLUX</span>
          </div>
          {invoice.company_name && <p className="text-xs text-gray-500">{invoice.company_name}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Status banners */}
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Facture payée</p>
              {invoice.paid_at && <p className="text-sm text-green-700">Reçu le {new Date(invoice.paid_at).toLocaleDateString('fr-CA', {day:'numeric',month:'long',year:'numeric'})}</p>}
            </div>
          </div>
        )}
        {isOverdue && !isPaid && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-sm text-red-700 font-medium">
              Cette facture est en retard — échéance {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-CA') : 'dépassée'}.
            </p>
          </div>
        )}

        {/* Invoice header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={16} className="text-orange-500" />
                <h1 className="text-lg font-bold text-gray-900">Facture {invoice.number}</h1>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: SB[invoice.status]+'22', color: SB[invoice.status] }}>
                  {SL[invoice.status] || invoice.status}
                </span>
                {invoice.due_date && <span className="text-xs text-gray-400">Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-CA')}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{Number(invoice.total).toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</p>
              {invoice.amount_due > 0 && !isPaid && (
                <p className="text-xs text-orange-600 font-medium">Solde dû : {Number(invoice.amount_due).toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</p>
              )}
            </div>
          </div>

          {/* Client info */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Facturé à</p>
              <p className="font-medium text-gray-800">{invoice.client_name}</p>
              {invoice.client_address && <p className="text-xs text-gray-500">{invoice.client_address}</p>}
            </div>
            {invoice.company_name && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">De</p>
                <p className="font-medium text-gray-800">{invoice.company_name}</p>
                {(invoice.company_phone || invoice.company_email) && (
                  <div className="flex gap-3 mt-0.5">
                    {invoice.company_phone && <a href={`tel:${invoice.company_phone}`} className="text-xs text-gray-500 flex items-center gap-1 hover:text-brand"><Phone size={10}/>{invoice.company_phone}</a>}
                    {invoice.company_email && <a href={`mailto:${invoice.company_email}`} className="text-xs text-gray-500 flex items-center gap-1 hover:text-brand"><Mail size={10}/>{invoice.company_email}</a>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        {invoice.items?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">Détail</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {invoice.items.map((item, i) => (
                <div key={item.id || i} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.description || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{Number(item.qty)||1} × {Number(item.unit_price||0).toLocaleString('fr-CA')}$</p>
                    <p className="text-sm font-semibold text-gray-800">{((Number(item.qty)||1)*(Number(item.unit_price)||0)).toLocaleString('fr-CA')}$</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <span>{Number(invoice.subtotal||0).toLocaleString('fr-CA', {minimumFractionDigits:2})}$</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>TPS ({invoice.tps_pct||5}%)</span>
                <span>{Number(invoice.tps_amount||0).toLocaleString('fr-CA', {minimumFractionDigits:2})}$</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>TVQ ({invoice.tvq_pct||9.975}%)</span>
                <span>{Number(invoice.tvq_amount||0).toLocaleString('fr-CA', {minimumFractionDigits:2})}$</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span style={{color:'#F26522'}}>{Number(invoice.total||0).toLocaleString('fr-CA', {minimumFractionDigits:2})}$</span>
              </div>
              {invoice.amount_due > 0 && !isPaid && (
                <div className="flex justify-between text-sm font-semibold text-orange-600 pt-1">
                  <span>Solde dû</span>
                  <span>{Number(invoice.amount_due).toLocaleString('fr-CA', {minimumFractionDigits:2})}$</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment info */}
        {!isPaid && invoice.amount_due > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-brand" />
              <h2 className="text-sm font-semibold text-gray-800">Informations de paiement</h2>
            </div>
            <p className="text-sm text-gray-600">
              Pour effectuer votre paiement ou pour toute question concernant cette facture,
              veuillez contacter votre entrepreneur directement.
            </p>
            {invoice.company_phone && (
              <a href={`tel:${invoice.company_phone}`} className="mt-3 inline-flex items-center gap-2 btn-primary text-sm">
                <Phone size={14} /> Appeler {invoice.company_name || "l'entrepreneur"}
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Notes</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Propulsé par MONFLUX — logiciel de gestion pour entrepreneurs en construction
        </p>
      </div>
    </div>
  );
}
