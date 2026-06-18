import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi } from '../api';
import { ArrowLeft, QrCode, Plus, Loader2, Users, MapPin, Calendar, DollarSign, CheckCircle } from 'lucide-react';

const PHASE_STATUS_BADGE = { not_started:'badge-gray', in_progress:'badge-orange', delayed:'badge-red', completed:'badge-green', cancelled:'badge-gray' };
const PHASE_STATUS_LABEL = { not_started:'Non démarré', in_progress:'En cours', delayed:'En retard', completed:'Terminé', cancelled:'Annulé' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [genQr, setGenQr] = useState(false);
  const [timesheets, setTimesheets] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: proj }, { data: ts }] = await Promise.all([
        projectsApi.get(id),
        tsApi.list({ project_id: id }),
      ]);
      setProject(proj);
      setTimesheets(ts);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const generateQR = async () => {
    setGenQr(true);
    try {
      const { data } = await punchApi.generate({ project_id: id, label: project?.name });
      setQrData(data);
    } catch {} finally { setGenQr(false); }
  };

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div></Layout>;
  if (!project) return <Layout><div className="p-8 text-red-500">Projet non trouvé</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back */}
        <button className="btn-ghost mb-4 text-sm" onClick={() => navigate('/projets')}>
          <ArrowLeft size={14} /> Retour aux projets
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex gap-4 text-sm text-gray-400 mt-1">
              {project.address && <span className="flex items-center gap-1"><MapPin size={13}/>{project.address}</span>}
              {project.start_date && <span className="flex items-center gap-1"><Calendar size={13}/>{new Date(project.start_date).toLocaleDateString('fr-CA')}</span>}
              {project.contract_value && <span className="flex items-center gap-1"><DollarSign size={13}/>{Number(project.contract_value).toLocaleString('fr-CA')}$</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-brand">{project.progress_pct || 0}%</div>
            <div className="text-xs text-gray-400">Avancement</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-xl font-bold text-gray-900">{project.phases?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-1">Phases</div>
          </div>
          <div className="card text-center">
            <div className="text-xl font-bold text-gray-900">{project.members?.length || 0}</div>
            <div className="text-xs text-gray-400 mt-1">Membres</div>
          </div>
          <div className="card text-center">
            <div className="text-xl font-bold text-gray-900">{timesheets.length}</div>
            <div className="text-xs text-gray-400 mt-1">Pointages</div>
          </div>
        </div>

        {/* Phases */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Phases du projet</h2>
          </div>
          {project.phases?.length ? (
            <div className="space-y-2">
              {project.phases.map(ph => (
                <div key={ph.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: ph.color || '#F26522'}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ph.name}</p>
                    <p className="text-xs text-gray-400">
                      {ph.start_date && new Date(ph.start_date).toLocaleDateString('fr-CA')}
                      {ph.end_date && ` → ${new Date(ph.end_date).toLocaleDateString('fr-CA')}`}
                    </p>
                  </div>
                  <span className={`badge ${PHASE_STATUS_BADGE[ph.status]}`}>{PHASE_STATUS_LABEL[ph.status]}</span>
                  <span className="text-sm font-semibold text-brand">{ph.progress_pct || 0}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune phase définie</p>
          )}
        </div>

        {/* QR Punch */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-brand" />
              <h2 className="font-semibold text-gray-900 text-sm">Code QR de pointage</h2>
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={generateQR} disabled={genQr}>
              {genQr ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Générer QR
            </button>
          </div>

          {qrData ? (
            <div className="flex items-start gap-5">
              <img src={qrData.qr_image} alt="QR Code" className="w-32 h-32 border border-gray-200 rounded-lg" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">QR Code généré</p>
                <p className="text-xs text-gray-500 mb-3">Imprimez et affichez ce QR à l'entrée du chantier. Les travailleurs scannent pour pointer.</p>
                <p className="text-xs text-gray-400 font-mono break-all">{qrData.url}</p>
                <button
                  className="btn-primary mt-3 text-xs py-1.5"
                  onClick={() => window.print()}
                >
                  Imprimer le QR
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Cliquez sur "Générer QR" pour créer un code de pointage pour ce chantier.</p>
          )}

          {/* Recent timesheets */}
          {timesheets.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Pointages récents</p>
              <div className="space-y-1.5">
                {timesheets.slice(0, 5).map(ts => (
                  <div key={ts.id} className="flex items-center gap-3 text-xs text-gray-600">
                    <CheckCircle size={12} className={ts.clock_out ? 'text-green-500' : 'text-brand'} />
                    <span className="font-medium">{ts.user_name || ts.sub_name || ts.worker_name || 'Inconnu'}</span>
                    <span className="text-gray-400">{ts.clock_in && new Date(ts.clock_in).toLocaleString('fr-CA', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    {ts.hours_total && <span className="ml-auto font-medium text-gray-700">{ts.hours_total}h</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
