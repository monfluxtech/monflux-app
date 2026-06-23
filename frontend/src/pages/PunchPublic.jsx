import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { punch as punchApi } from '../api';
import { Clock, CheckCircle, Loader2, MapPin } from 'lucide-react';

export default function PunchPublic() {
  const { token } = useParams();
  const [site, setSite]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [tsId, setTsId]   = useState(localStorage.getItem(`punch_ts_${token}`) || null);
  const [action, setAction] = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState('');
  const [phaseName, setPhaseName] = useState('');
  const [remainingHours, setRemainingHours] = useState('');

  useEffect(() => {
    punchApi.getSite(token)
      .then(({ data }) => setSite(data))
      .catch(() => setError('QR Code invalide ou expiré'))
      .finally(() => setLoading(false));
  }, [token]);

  const clockIn = async () => {
    if (!name.trim()) return setError('Entrez votre nom');
    setAction(true);
    try {
      const { data } = await punchApi.clockIn({ token, worker_name: name, worker_phone: phone });
      localStorage.setItem(`punch_ts_${token}`, data.timesheet_id);
      setTsId(data.timesheet_id);
      setDone('in');
    } catch (e) { setError(e.response?.data?.error || 'Erreur'); }
    finally { setAction(false); }
  };

  const clockOut = async () => {
    setAction(true);
    try {
      await punchApi.clockOut({
        timesheet_id: tsId,
        phase_name: phaseName || null,
        remaining_hours_estimate: remainingHours ? parseFloat(remainingHours) : null,
      });
      localStorage.removeItem(`punch_ts_${token}`);
      setTsId(null);
      setDone('out');
    } catch (e) { setError(e.response?.data?.error || 'Erreur'); }
    finally { setAction(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-brand" />
    </div>
  );

  if (error && !site) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-4xl">❌</div>
      <p className="font-semibold text-gray-900">Code invalide</p>
      <p className="text-sm text-gray-400">{error}</p>
    </div>
  );

  const phases = site?.phases || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'#F26522'}}>
            <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-gray-900">MONFLUX · Punch</span>
        </div>

        {/* Site info */}
        <div className="card mb-5 text-center">
          <Clock size={28} className="text-brand mx-auto mb-2" />
          <h1 className="font-bold text-gray-900 text-lg">{site?.project_name}</h1>
          {site?.project_address && (
            <p className="text-sm text-gray-400 flex items-center justify-center gap-1 mt-1">
              <MapPin size={13}/>{site.project_address}
            </p>
          )}
        </div>

        {done === 'in' && (
          <div className="card text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Arrivée enregistrée !</p>
            <p className="text-sm text-gray-400 mt-1">Bonne journée de travail, {name}.</p>
            <p className="text-xs text-gray-300 mt-3">Scannez à nouveau en fin de journée pour pointer votre départ.</p>
          </div>
        )}

        {done === 'out' && (
          <div className="card text-center">
            <CheckCircle size={40} className="text-brand mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Départ enregistré !</p>
            <p className="text-sm text-gray-400 mt-1">Bonne fin de journée !</p>
            {phaseName && (
              <p className="text-xs text-gray-400 mt-2">Phase : <strong>{phaseName}</strong></p>
            )}
            {remainingHours && (
              <p className="text-xs text-gray-400">Temps restant estimé : <strong>{remainingHours}h</strong></p>
            )}
          </div>
        )}

        {!done && tsId && (
          <div className="card space-y-4">
            <p className="text-sm text-gray-600">Fin de journée — complétez avant de pointer votre départ.</p>

            <div>
              <label className="label">Sur quelle phase avez-vous travaillé ?</label>
              {phases.length > 0 ? (
                <select className="input" value={phaseName} onChange={e => setPhaseName(e.target.value)}>
                  <option value="">— Sélectionner une phase —</option>
                  {phases.map(ph => (
                    <option key={ph.id} value={ph.name}>{ph.name}{ph.trade_name ? ` · ${ph.trade_name}` : ''}</option>
                  ))}
                </select>
              ) : (
                <input className="input" placeholder="Ex: Plomberie rough-in" value={phaseName} onChange={e => setPhaseName(e.target.value)} />
              )}
            </div>

            <div>
              <label className="label">Durée restante estimée (heures)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.5"
                placeholder="Ex: 4"
                value={remainingHours}
                onChange={e => setRemainingHours(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Combien d'heures reste-t-il pour terminer cette phase ?</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <button className="btn-primary w-full justify-center" onClick={clockOut} disabled={action}>
              {action ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
              Enregistrer mon départ
            </button>
          </div>
        )}

        {!done && !tsId && (
          <div className="card space-y-3">
            <p className="text-sm text-gray-600">Entrez vos informations pour pointer votre arrivée.</p>
            <div>
              <label className="label">Votre nom *</label>
              <input className="input" placeholder="Jean Tremblay" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input className="input" type="tel" placeholder="514-555-0000" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button className="btn-primary w-full justify-center" onClick={clockIn} disabled={action}>
              {action ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
              Pointer mon arrivée
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
