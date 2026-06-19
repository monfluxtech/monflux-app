import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, AlertCircle, PenLine, MapPin, Phone, Mail, Globe, DollarSign, FileEdit } from 'lucide-react';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api' });

export default function ChangeOrderPublic() {
  const { token } = useParams();
  const [co, setCo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // 'approved' | 'rejected'

  useEffect(() => {
    api.get(`/public/change-order/${token}`)
      .then(r => { setCo(r.data); setSignerName(r.data.signer_name || ''); })
      .catch(() => setError('Demande introuvable ou lien invalide.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await api.post(`/public/change-order/${token}/approve`, { signer_name: signerName });
      setResult('approved');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'approbation.');
    } finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande de modification?')) return;
    setProcessing(true);
    try {
      await api.post(`/public/change-order/${token}/reject`);
      setResult('rejected');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur.');
    } finally { setProcessing(false); }
  };

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
      </div>
    </div>
  );

  const isApproved = result === 'approved' || co?.status === 'approved' || !!co?.approved_at;
  const isRejected = result === 'rejected' || co?.status === 'rejected';
  const isFinal = isApproved || isRejected;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F26522' }}>
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">MONFLUX</span>
        </div>
        <span className="text-xs text-gray-400">Demande de modification</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Result states */}
        {isApproved && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Demande approuvée</h2>
            <p className="text-gray-500 text-sm">
              {(co?.approved_at || co?.signed_at)
                ? `Approuvée le ${new Date(co.approved_at || co.signed_at).toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`
                : 'Votre approbation a été enregistrée.'}
            </p>
            <p className="text-xs text-gray-400 mt-3">L'entrepreneur a été informé. Merci!</p>
          </div>
        )}

        {isRejected && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Demande refusée</h2>
            <p className="text-gray-500 text-sm">Vous avez refusé cette demande de modification.</p>
            <p className="text-xs text-gray-400 mt-3">L'entrepreneur sera contacté pour en discuter.</p>
          </div>
        )}

        {/* Document */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #F26522, #ff8c42)' }} />
          <div className="p-6">
            {/* Company */}
            <div className="pb-4 border-b border-gray-100 mb-5">
              <p className="font-bold text-gray-900 text-lg">{co?.company_name}</p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                {co?.company_address && <span className="flex items-center gap-1"><MapPin size={11}/>{co.company_address}</span>}
                {co?.company_phone   && <a href={`tel:${co.company_phone}`} className="flex items-center gap-1 hover:text-brand"><Phone size={11}/>{co.company_phone}</a>}
                {co?.company_email   && <a href={`mailto:${co.company_email}`} className="flex items-center gap-1 hover:text-brand"><Mail size={11}/>{co.company_email}</a>}
                {co?.company_website && <a href={co.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand"><Globe size={11}/>{co.company_website}</a>}
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
                <FileEdit size={14} /> DEMANDE DE MODIFICATION
              </div>
              <p className="text-xs text-gray-400">
                {new Date(co?.created_at || Date.now()).toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              </p>
            </div>

            {/* Project */}
            {(co?.project_name || co?.project_address) && (
              <div className="bg-gray-50 rounded-xl p-3.5 mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Projet concerné</p>
                {co.project_name && <p className="text-sm font-semibold text-gray-900">{co.project_name}</p>}
                {co.project_address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11}/>{co.project_address}</p>}
              </div>
            )}

            {/* Change details */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{co?.title}</h2>
              {co?.description && (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{co.description}</p>
              )}
            </div>

            {/* Amount */}
            {co?.amount > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-brand" />
                    <span className="text-sm font-semibold text-gray-700">Montant supplémentaire</span>
                  </div>
                  <span className="text-xl font-bold text-brand">
                    {Number(co.amount).toLocaleString('fr-CA')} $
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Ce montant s'ajoute au contrat d'origine si vous approuvez.</p>
              </div>
            )}

            {co?.notes && (
              <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs text-gray-500">
                <strong>Note :</strong> {co.notes}
              </div>
            )}

            {/* Legal text */}
            <div className="text-sm text-gray-600 leading-relaxed space-y-2 mb-5 border-t border-gray-100 pt-5">
              <p>
                En approuvant cette demande de modification, je <strong>{signerName || '_______________'}</strong>,
                autorise <strong>{co?.company_name}</strong> à réaliser les travaux supplémentaires décrits ci-dessus,
                {co?.amount > 0 && ` pour un montant additionnel de ${Number(co.amount).toLocaleString('fr-CA')} $,`} et
                accepte d'en régler le montant selon les termes du contrat en vigueur.
              </p>
            </div>

            {/* Action section */}
            {!isFinal && (
              <div className="border-t border-gray-100 pt-5">
                {!confirming ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Votre nom complet</p>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-3"
                      placeholder="Prénom Nom"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors"
                        onClick={handleReject}
                        disabled={processing}
                      >
                        <XCircle size={14} className="inline mr-1.5" />
                        Refuser
                      </button>
                      <button
                        className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={{ background: '#F26522' }}
                        onClick={() => setConfirming(true)}
                        disabled={!signerName.trim()}
                      >
                        <PenLine size={14} />
                        Approuver
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-orange-800 mb-1">Confirmer l'approbation</p>
                    <p className="text-xs text-orange-700 mb-4">
                      Vous allez approuver en tant que <strong>{signerName}</strong>.
                      {co?.amount > 0 && ` Cela engage ${Number(co.amount).toLocaleString('fr-CA')} $ supplémentaires.`}
                      {' '}Cette action est définitive.
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl border border-orange-200 text-sm text-orange-700 hover:bg-orange-100" onClick={() => setConfirming(false)}>Annuler</button>
                      <button
                        className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={{ background: '#F26522' }}
                        onClick={handleApprove}
                        disabled={processing}
                      >
                        {processing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isApproved && (co?.approved_by || co?.signer_name) && (
              <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Approuvée par <strong>{co.approved_by || co.signer_name}</strong></p>
                  {(co.approved_at || co.signed_at) && (
                    <p className="text-xs text-gray-400">
                      {new Date(co.approved_at || co.signed_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          Document généré par MONFLUX · Gestion de construction au Québec
        </p>
      </div>
    </div>
  );
}
