import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, FileSignature, Loader2, PenLine } from 'lucide-react';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api' });

export default function ContractPublic() {
  const { token } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    api.get(`/contracts/public/${token}`)
      .then(({ data }) => {
        setContract(data);
        setSignerName(data.signer_name || data.client_name || '');
      })
      .catch(() => setError('Contrat introuvable ou lien invalide.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    setSigning(true);
    try {
      const { data } = await api.post(`/contracts/public/${token}/sign`, { signer_name: signerName });
      setContract(data);
      setConfirming(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la signature.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  const isSigned = contract?.status === 'signed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F26522' }}>
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">MONFLUX</span>
        </div>
        <span className="text-xs text-gray-400">Contrat électronique</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {isSigned && (
          <div className="card text-center py-8 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contrat signé</h2>
            <p className="text-sm text-gray-500">
              {contract?.signed_at
                ? `Signé le ${new Date(contract.signed_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'Votre signature a été enregistrée.'}
            </p>
          </div>
        )}

        <div className="card mb-6">
          <div className="pb-4 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <FileSignature size={18} className="text-brand" />
              <h1 className="text-xl font-bold text-gray-900">{contract?.title || 'Contrat'}</h1>
            </div>
            <p className="text-xs text-gray-400">
              {contract?.company_name || 'MONFLUX'}
              {contract?.project_name ? ` · ${contract.project_name}` : ''}
            </p>
          </div>

          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: contract?.content || '<p>Aucun contenu.</p>' }}
          />

          {!isSigned && (
            <div className="border-t border-gray-100 pt-5 mt-6">
              {!confirming ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Votre nom complet</p>
                  <input
                    className="input mb-3"
                    placeholder="Prénom Nom"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mb-4">
                    En signant, vous confirmez avoir lu et accepté le contenu de ce contrat.
                  </p>
                  <button className="btn-primary w-full py-3 text-sm" onClick={() => setConfirming(true)} disabled={!signerName.trim()}>
                    <PenLine size={14} /> Signer ce contrat
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-2">Confirmer la signature</p>
                  <p className="text-xs text-orange-700 mb-4">
                    Vous allez signer en tant que <strong>{signerName}</strong>. Cette action sera horodatée.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn-secondary flex-1" onClick={() => setConfirming(false)}>Annuler</button>
                    <button className="btn-primary flex-1 py-2" onClick={handleSign} disabled={signing}>
                      {signing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Confirmer la signature
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
