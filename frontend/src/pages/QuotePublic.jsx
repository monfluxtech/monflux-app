import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, FileText, Building2, Phone, Mail, AlertTriangle, PenLine, Type, ShieldCheck } from 'lucide-react';
import api from '../api';

const STATUS_LABELS = {
  draft: 'Brouillon', sent: 'Envoyée', viewed: 'Vue',
  signed: 'Signée', expired: 'Expirée', rejected: 'Refusée', converted: 'Convertie',
};

function SignatureCanvas({ onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const hasDrawnRef = useRef(false);

  const pointFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(e);
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const point = pointFromEvent(e);
    ctx.strokeStyle = '#15171C';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    hasDrawnRef.current = true;
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(hasDrawnRef.current ? canvasRef.current.toDataURL('image/png') : null);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={560}
        height={160}
        style={{ width: '100%', height: 160, background: '#fff', border: '1.5px dashed #D1D5DB', borderRadius: 12, touchAction: 'none', cursor: 'crosshair', display: 'block' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <button type="button" onClick={clear} className="text-xs text-gray-400 hover:text-gray-600 mt-2">
        Effacer et recommencer
      </button>
    </div>
  );
}

export default function QuotePublic() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [done, setDone] = useState(null); // 'signed' | 'declined'
  const [confirm, setConfirm] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [sigMethod, setSigMethod] = useState('typed'); // 'typed' | 'drawn'
  const [drawnSignature, setDrawnSignature] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/public/quote/${token}`);
        setQuote(data);
        setSignerName(data.signer_name || data.client_name || '');
      } catch (e) {
        setError(e.response?.data?.error || 'Soumission introuvable');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSign = async () => {
    const signature_data = sigMethod === 'drawn' ? drawnSignature : signerName.trim();
    if (!signerName.trim() || !signature_data || !consentChecked) return;
    setSigning(true);
    try {
      const { data } = await api.post(`/public/quote/${token}/sign`, {
        signer_name: signerName.trim(),
        signature_type: sigMethod,
        signature_data,
        consent: true,
      });
      setDone('signed');
      setQuote((q) => ({ ...q, status: 'signed', signed_at: data.signed_at, signer_name: data.signer_name }));
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
  const canConfirmSign = signerName.trim() && (sigMethod === 'drawn' ? !!drawnSignature : true) && consentChecked;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F26522' }}>
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">MONFLUX</span>
          </div>
          <span className="text-xs text-gray-400">Soumission électronique</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {(done === 'signed' || quote.status === 'signed') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Soumission signée</h2>
            <p className="text-sm text-gray-500">
              {quote.signer_name ? `Signée par ${quote.signer_name}` : 'Signature enregistrée'}
              {quote.signed_at && ` le ${new Date(quote.signed_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
        )}
        {done === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700">Soumission refusée. Merci de nous avoir contactés.</p>
          </div>
        )}
        {isExpired && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <p className="text-sm text-orange-700">Cette soumission a expiré le {new Date(quote.valid_until).toLocaleDateString('fr-CA')}.</p>
          </div>
        )}

        {/* ── Document — soumission formatée, style document officiel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8" style={{ fontFamily: "'Georgia', serif" }}>
          <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-gray-100 flex-wrap" style={{ fontFamily: 'inherit' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={17} className="text-orange-500" />
                <h1 className="text-xl font-bold text-gray-900">{quote.title || 'Soumission'}</h1>
              </div>
              <p className="text-xs text-gray-400">
                Statut : {STATUS_LABELS[quote.status] || quote.status}
                {quote.valid_until && !isExpired && ` · Valide jusqu'au ${new Date(quote.valid_until).toLocaleDateString('fr-CA')}`}
              </p>
            </div>
            {(quote.company_name || quote.company_phone || quote.company_email) && (
              <div className="text-right text-xs text-gray-500 leading-relaxed">
                {quote.company_name && <p className="font-semibold text-gray-700 flex items-center justify-end gap-1.5"><Building2 size={12} className="text-gray-400" /> {quote.company_name}</p>}
                {quote.company_phone && <a href={`tel:${quote.company_phone}`} className="flex items-center justify-end gap-1.5 hover:text-brand"><Phone size={11} className="text-gray-400" /> {quote.company_phone}</a>}
                {quote.company_email && <a href={`mailto:${quote.company_email}`} className="flex items-center justify-end gap-1.5 hover:text-brand"><Mail size={11} className="text-gray-400" /> {quote.company_email}</a>}
              </div>
            )}
          </div>

          {quote.items?.length > 0 && (
            <table className="w-full text-sm mb-2" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th className="text-left py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">Description</th>
                  <th className="text-right py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">Qté</th>
                  <th className="text-right py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">Prix unit.</th>
                  <th className="text-right py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, i) => (
                  <tr key={item.id || i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td className="py-2.5 text-gray-800">
                      {item.name || '—'}
                      {item.description && <span className="block text-xs text-gray-400 font-sans">{item.description}</span>}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">{Number(item.qty) || 1}</td>
                    <td className="py-2.5 text-right text-gray-600">{Number(item.unit_price || 0).toLocaleString('fr-CA')}$</td>
                    <td className="py-2.5 text-right font-semibold text-gray-800">{((Number(item.qty) || 1) * (Number(item.unit_price) || 0)).toLocaleString('fr-CA')}$</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-end">
            <div className="w-full sm:w-64 text-sm space-y-1 pt-2">
              <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{subtotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span></div>
              <div className="flex justify-between text-xs text-gray-400"><span>TPS ({quote.tps_pct || 5}%)</span><span>{tps.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span></div>
              <div className="flex justify-between text-xs text-gray-400"><span>TVQ ({quote.tvq_pct || 9.975}%)</span><span>{tvq.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span></div>
              <div className="flex justify-between font-bold text-gray-900 pt-2" style={{ borderTop: '2px solid #E5E7EB' }}>
                <span>Total</span><span className="text-brand">{total.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</span>
              </div>
            </div>
          </div>

          {quote.description && (
            <div className="mt-6 pt-5 text-sm text-gray-600 whitespace-pre-wrap" style={{ borderTop: '1px solid #F3F4F6' }}>
              {quote.description}
            </div>
          )}
        </div>

        {/* ── Réponse / signature ── */}
        {canSign && !confirm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Votre réponse</h2>
            <p className="text-xs text-gray-400 mb-4">En signant, vous confirmez avoir lu et compris les travaux décrits ci-dessus.</p>

            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nom complet</label>
            <input
              className="input mb-4"
              placeholder="Prénom Nom"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSigMethod('typed')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors"
                style={sigMethod === 'typed' ? { background: '#FFF4EE', borderColor: '#F26522', color: '#F26522' } : { background: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                <Type size={13} /> Taper mon nom
              </button>
              <button
                type="button"
                onClick={() => setSigMethod('drawn')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors"
                style={sigMethod === 'drawn' ? { background: '#FFF4EE', borderColor: '#F26522', color: '#F26522' } : { background: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                <PenLine size={13} /> Signer à la main
              </button>
            </div>

            {sigMethod === 'typed' ? (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4 text-center">
                <p style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: 30, color: '#15171C', minHeight: 40 }}>
                  {signerName.trim() || '—'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Aperçu de votre signature tapée</p>
              </div>
            ) : (
              <div className="mb-4">
                <SignatureCanvas onChange={setDrawnSignature} />
              </div>
            )}

            <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5"
                style={{ accentColor: '#F26522' }}
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Je confirme avoir lu ce document et je consens à le signer électroniquement. Cette signature sera horodatée
                et associée à mon adresse IP et à mon navigateur à des fins de preuve.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: '#F26522' }}
                onClick={() => setConfirm(true)}
                disabled={!canConfirmSign}
              >
                <CheckCircle size={16} /> Signer la soumission
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

        {canSign && confirm && (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <h2 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-2"><ShieldCheck size={15} /> Confirmer la signature</h2>
            <p className="text-xs text-green-700 mb-4">
              Vous allez signer en tant que <strong>{signerName.trim()}</strong> pour un montant de{' '}
              <strong>{total.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}$</strong>. Cette action est horodatée et non modifiable.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm"
                style={{ background: '#22c55e' }}
                onClick={handleSign}
                disabled={signing}
              >
                {signing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirmer la signature
              </button>
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-white"
                onClick={() => setConfirm(false)}
                disabled={signing}
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
