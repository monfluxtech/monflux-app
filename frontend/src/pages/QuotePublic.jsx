import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, FileText, Building2, Phone, Mail, AlertTriangle } from 'lucide-react';
import api from '../api';

const STATUS_LABELS = {
  draft: 'Brouillon', sent: 'Envoyée', viewed: 'Vue',
  signed: 'Signée', expired: 'Expirée', rejected: 'Refusée', converted: 'Convertie',
};

export default function QuotePublic() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [done, setDone] = useState(null); // 'signed' | 'declined'
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/public/quote/${token}`);
        setQuote(data);
      } catch (e) {
        setError(e.response?.data?.error || 'Soumission introuvable');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSign = async () => {
    setSigning(true);
    try {
      await api.post(`/public/quote/${token}/sign`);
      setDone('signed');
      setQuote(q => ({ ...q, status: 'signed', signed_at: new Date().toISOString() }));
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
      setConfirm(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await api.post(`/public/quote/${token}/decline`);
      setDone('declined');
      setQuote(q => ({ ...q, status: 'rejected' }));
    } catch (e) {
      alert(e.response?.data?.error || 'Erreur');
    } finally {
      setDeclining(false);
    }
  };

  const subtotal = quote?.items?.reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.unit_price) || 0), 0) || 0;
  const tps = subtotal * ((Number(quote?.tps_pct) || 5) / 100);
  const tvq = subtotal * ((Number(quote?.tvq_pct) || 9.975) / 100);
  const total = quote?.total ? Number(quote.total) : subtotal + tps + tvq;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        Chargement de votre soumission…
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertTriangle size={40} className="text-orange-400 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Soumission introuvable</h1>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const canSign = ['draft', 'sent', 'viewed'].includes(quote.status) && !isExpired && !done;

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
          {quote.company_name && (
            <p className="text-xs text-gray-500">{quote.company_name}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Status banner */}
        {done === 'signed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Soumission acceptée !</p>
              <p className="text-sm text-green-700">Votre entrepreneur vous contactera sous peu.</p>
            </div>
          </div>
        )}
        {done === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700">Soumission refusée. Merci de nous avoir contactés.</p>
          </div>
        )}
        {quote.status === 'signed' && !done && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            <p className="text-sm text-green-700 font-medium">
              Soumission signée le {new Date(quote.signed_at).toLocaleDateString('fr-CA', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
        )}
        {isExpired && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <p className="text-sm text-orange-700">Cette soumission a expiré le {new Date(quote.valid_until).toLocaleDateString('fr-CA')}.</p>
          </div>
        )}

        {/* Quote header card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-orange-500" />
                <h1 className="text-lg font-bold text-gray-900">{quote.title || 'Soumission'}</h1>
              </div>
              <p className="text-xs text-gray-400">
                Statut : {STATUS_LABELS[quote.status] || quote.status}
                {quote.valid_until && !isExpired && ` · Valide jusqu'au ${new Date(quote.valid_until).toLocaleDateString('fr-CA')}`}
              </p>
            </div>
          </div>

          {/* Company info */}
          {(quote.company_name || quote.company_phone || quote.company_email) && (
            <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap gap-3 text-xs text-gray-600">
              {quote.company_name && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={12} className="text-gray-400" /> {quote.company_name}
                </span>
              )}
              {quote.company_phone && (
                <a href={`tel:${quote.company_phone}`} className="flex items-center gap-1.5 hover:text-brand">
                  <Phone size={12} className="text-gray-400" /> {quote.company_phone}
                </a>
              )}
              {quote.company_email && (
                <a href={`mailto:${quote.company_email}`} className="flex items-center gap-1.5 hover:text-brand">
                  <Mail size={12} className="text-gray-400" /> {quote.company_email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Line items */}
        {quote.items?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Détail des travaux</h2>
              <span className="text-xs text-gray-400">({quote.items.length} poste{quote.items.length > 1 ? 's' : ''})</span>
            </div>
            <div className="divide-y divide-gray-50">
              {quote.items.map((item, i) => (
                <div key={item.id || i} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name || '—'}</p>
                    {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-600">
                      {Number(item.qty) || 1} × {Number(item.unit_price || 0).toLocaleString('fr-CA')}$
                    </p>
                    <p className="text-xs font-semibold text-gray-800">
                      {((Number(item.qty) || 1) * (Number(item.unit_price) || 0)).toLocaleString('fr-CA')}$
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>TPS ({quote.tps_pct || 5}%)</span>
                <span>{tps.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>TVQ ({quote.tvq_pct || 9.975}%)</span>
                <span>{tvq.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span className="text-brand">{total.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Notes</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.description}</p>
          </div>
        )}

        {/* CTA */}
        {canSign && !confirm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Votre réponse</h2>
            <p className="text-xs text-gray-400 mb-4">En acceptant, vous confirmez avoir lu et compris les travaux décrits ci-dessus.</p>
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: '#F26522' }}
                onClick={() => setConfirm(true)}
              >
                <CheckCircle size={16} /> Accepter la soumission
              </button>
              <button
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                onClick={handleDecline}
                disabled={declining}
              >
                {declining ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Refuser
              </button>
            </div>
          </div>
        )}

        {/* Confirmation step */}
        {canSign && confirm && (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <h2 className="text-sm font-semibold text-green-800 mb-1">Confirmer l'acceptation</h2>
            <p className="text-xs text-green-700 mb-4">
              En cliquant sur « Confirmer », vous acceptez cette soumission de{' '}
              <strong>{total.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</strong>.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm"
                style={{ background: '#22c55e' }}
                onClick={handleSign}
                disabled={signing}
              >
                {signing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirmer l'acceptation
              </button>
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-white"
                onClick={() => setConfirm(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Propulsé par MONFLUX — logiciel de gestion pour entrepreneurs en construction
        </p>
      </div>
    </div>
  );
}
