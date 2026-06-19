import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Loader2, AlertCircle, Shield, MapPin, Phone, Mail, Globe, PenLine } from 'lucide-react';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api' });

export default function QuittancePublic() {
  const { token } = useParams();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    api.get(`/public/quittance/${token}`)
      .then(r => { setQ(r.data); setSignerName(r.data.client_name || ''); })
      .catch(() => setError('Quittance introuvable ou lien invalide.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    setSigning(true);
    try {
      await api.post(`/public/quittance/${token}/sign`, { signer_name: signerName });
      setSigned(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la signature.');
    } finally { setSigning(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card max-w-md w-full text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-700">{error}</p>
      </div>
    </div>
  );

  const isSigned = signed || q?.status === 'signed';

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
        <span className="text-xs text-gray-400">Document officiel</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success state */}
        {isSigned && (
          <div className="card text-center py-10 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Quittance signée</h2>
            <p className="text-gray-500 text-sm">
              {q?.signed_at
                ? `Signée le ${new Date(q.signed_at).toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`
                : 'Votre signature a été enregistrée avec succès.'
              }
            </p>
            <p className="text-xs text-gray-400 mt-3">Merci pour votre confiance — et bonne continuation!</p>
          </div>
        )}

        {/* Quittance document */}
        <div className="card mb-6">
          {/* Company header */}
          <div className="pb-4 border-b border-gray-100 mb-6">
            <h1 className="text-xl font-bold text-gray-900">{q?.company_name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
              {q?.company_address && <span className="flex items-center gap-1"><MapPin size={11}/>{q.company_address}</span>}
              {q?.company_phone   && <span className="flex items-center gap-1"><Phone size={11}/>{q.company_phone}</span>}
              {q?.company_email   && <span className="flex items-center gap-1"><Mail size={11}/>{q.company_email}</span>}
              {q?.company_website && <span className="flex items-center gap-1"><Globe size={11}/>{q.company_website}</span>}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
              <Shield size={14} /> QUITTANCE FINALE
            </div>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('fr-CA', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>

          {/* Project info */}
          {(q?.project_name || q?.project_address) && (
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Projet concerné</p>
              {q?.project_name    && <p className="text-sm font-semibold text-gray-900">{q.project_name}</p>}
              {q?.project_address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={11}/>{q.project_address}</p>}
            </div>
          )}

          {/* Legal text */}
          <div className="prose prose-sm text-gray-700 text-sm leading-relaxed space-y-3 mb-5">
            <p>
              Je soussigné(e), <strong>{q?.client_name || '_______________'}</strong>, certifie avoir reçu et accepté les travaux réalisés par <strong>{q?.company_name}</strong> à ma pleine et entière satisfaction.
            </p>
            {q?.project_description && (
              <p>
                <em>Description des travaux :</em> {q.project_description}
              </p>
            )}
            {q?.amount_paid > 0 && (
              <p>
                Je confirme avoir versé la somme totale de <strong>{Number(q.amount_paid).toLocaleString('fr-CA')} $</strong> en règlement complet de ces travaux.
              </p>
            )}
            <p>
              Par la présente, je déclare que tous les travaux ont été réalisés conformément au contrat, sans malfaçon apparente, et que je n'ai aucune réclamation à formuler à ce jour.
            </p>
            <p>
              J'autorise également <strong>{q?.company_name}</strong> à mentionner ce projet dans son portfolio de réalisations, sauf avis contraire explicite.
            </p>
            {q?.notes && (
              <p className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-700">
                <strong>Note :</strong> {q.notes}
              </p>
            )}
          </div>

          {/* Signature section */}
          {!isSigned ? (
            <div className="border-t border-gray-100 pt-5">
              {!confirming ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Votre nom complet</p>
                  <input
                    className="input mb-3"
                    placeholder="Prénom Nom"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mb-4">
                    En signant, vous confirmez avoir lu et accepté le contenu de cette quittance.
                  </p>
                  <button
                    className="btn-primary w-full py-3 text-sm"
                    onClick={() => setConfirming(true)}
                    disabled={!signerName.trim()}
                  >
                    <PenLine size={14}/> Signer cette quittance
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-2">Confirmer la signature</p>
                  <p className="text-xs text-orange-700 mb-4">
                    Vous allez signer en tant que <strong>{signerName}</strong>. Cette action est définitive et sera horodatée.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-secondary flex-1" onClick={() => setConfirming(false)}>Annuler</button>
                    <button className="btn-primary flex-1 py-2" onClick={handleSign} disabled={signing}>
                      {signing ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>}
                      Confirmer la signature
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">Signé par <strong>{q?.client_name}</strong></p>
                {q?.signed_at && (
                  <p className="text-xs text-gray-400">
                    {new Date(q.signed_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300">
          Document généré par MONFLUX · Gestion de construction au Québec
        </p>
      </div>
    </div>
  );
}
