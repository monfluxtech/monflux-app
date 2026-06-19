import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi } from '../api';
import { QrCode, Plus, Clock, Loader2, Calendar, CheckCircle } from 'lucide-react';

export default function Punch() {
  const [projectList, setProjectList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [qrData, setQrData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [tsLoading, setTsLoading] = useState(true);

  useEffect(() => {
    projectsApi.list().then(({ data }) => setProjectList(data.filter(p => p.status === 'active'))).catch(() => {});
    tsApi.list({}).then(({ data }) => setTimesheets(data)).catch(() => {}).finally(() => setTsLoading(false));
  }, []);

  const generate = async () => {
    if (!selectedProject) return;
    const proj = projectList.find(p => p.id === selectedProject);
    setGenerating(true);
    try {
      const { data } = await punchApi.generate({ project_id: selectedProject, label: proj?.name });
      setQrData(data);
    } catch {} finally { setGenerating(false); }
  };

  const totalHoursToday = timesheets
    .filter(t => t.clock_in && new Date(t.clock_in).toDateString() === new Date().toDateString())
    .reduce((s, t) => s + Number(t.hours_total || 0), 0);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Pointage QR</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand">{timesheets.filter(t => !t.clock_out).length}</p>
            <p className="text-xs text-gray-400 mt-1">Pointés en ce moment</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{totalHoursToday.toFixed(1)}h</p>
            <p className="text-xs text-gray-400 mt-1">Heures aujourd'hui</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{timesheets.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total entrées</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Generate QR */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <QrCode size={16} className="text-brand" /> Générer un QR de chantier
            </h2>
            <div className="space-y-3">
              <select className="input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                <option value="">Choisir un projet…</option>
                {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn-primary w-full justify-center" onClick={generate} disabled={!selectedProject || generating}>
                {generating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Générer le QR
              </button>
            </div>

            {qrData && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <img src={qrData.qr_image} alt="QR" className="w-40 h-40 mx-auto border border-gray-200 rounded-xl mb-3" />
                <p className="text-xs text-gray-500 mb-2">Imprimez et affichez à l'entrée du chantier</p>
                <button className="btn-secondary text-xs w-full justify-center" onClick={() => {
                  const w = window.open('', '_blank', 'width=420,height=520');
                  w.document.write(`<!DOCTYPE html><html><head><title>QR Chantier</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;}img{width:300px;height:300px;}p{margin-top:16px;font-size:15px;color:#333;font-weight:600;}</style></head><body><img src="${qrData.qr_image}" alt="QR"/><p>${qrData.label||'Chantier'}</p></body></html>`);
                  w.document.close(); w.focus(); w.print();
                }}>
                  🖨️ Imprimer le QR
                </button>
                <p className="text-xs text-gray-300 font-mono mt-2 break-all">{qrData.url}</p>
              </div>
            )}
          </div>

          {/* Active right now */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Clock size={16} className="text-green-500" /> Présents maintenant
            </h2>
            {timesheets.filter(t => !t.clock_out).length === 0 ? (
              <p className="text-sm text-gray-400">Personne de pointé en ce moment.</p>
            ) : (
              <div className="space-y-2">
                {timesheets.filter(t => !t.clock_out).map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {t.user_name || t.sub_name || t.worker_name}
                      </p>
                      <p className="text-xs text-gray-400">{t.project_name}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {t.clock_in && new Date(t.clock_in).toLocaleTimeString('fr-CA', {hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timesheet list */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Journal de pointage</h2>
          {tsLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
          ) : (
            <div className="space-y-1.5">
              {timesheets.slice(0, 20).map(t => (
                <div key={t.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0 text-sm">
                  <CheckCircle size={14} className={t.clock_out ? 'text-gray-300' : 'text-green-500'} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800">{t.user_name || t.sub_name || t.worker_name}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-gray-500 text-xs">{t.project_name}</span>
                  </div>
                  <div className="text-xs text-gray-400 text-right flex-shrink-0">
                    <span>{t.clock_in && new Date(t.clock_in).toLocaleDateString('fr-CA',{month:'short',day:'numeric'})}</span>
                    {t.hours_total && <span className="ml-2 font-medium text-gray-700">{t.hours_total}h</span>}
                  </div>
                </div>
              ))}
              {timesheets.length === 0 && <p className="text-sm text-gray-400">Aucun pointage enregistré.</p>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
