import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ai, projects } from '../api';
import { useAuthStore } from '../store';
import Layout from '../components/Layout';
import {
  Sparkles, AlertTriangle, Clock, TrendingUp, ChevronRight,
  Calendar, DollarSign, Loader2, RefreshCw
} from 'lucide-react';

// ── Gantt bar colors by status ────────────────────
const STATUS_COLOR = {
  active:    '#F26522',
  lead:      '#94a3b8',
  quote:     '#f59e0b',
  on_hold:   '#6366f1',
  completed: '#22c55e',
  cancelled: '#ef4444',
};
const STATUS_LABEL = {
  active:'Actif', lead:'Lead', quote:'Soumission',
  on_hold:'En attente', completed:'Terminé', cancelled:'Annulé',
};

function GanttRow({ project, minDate, totalDays, onClick }) {
  const [hover, setHover] = useState(false);

  const start = project.start_date ? new Date(project.start_date) : new Date();
  const end   = project.end_date   ? new Date(project.end_date)   : new Date(start.getTime() + 30*86400000);
  const ref   = new Date(minDate);

  const leftPct  = Math.max(0, (start - ref) / (totalDays * 86400000)) * 100;
  const widthPct = Math.max(1, (end - start) / (totalDays * 86400000)) * 100;

  return (
    <div className="relative flex items-center gap-3 py-2 group cursor-pointer" onClick={() => onClick(project.id)}>
      {/* Name column */}
      <div className="w-40 flex-shrink-0 text-xs font-medium text-gray-700 truncate">{project.name}</div>

      {/* Bar area */}
      <div className="flex-1 relative h-6">
        <div
          className="gantt-bar absolute h-full rounded-full"
          style={{
            left: `${leftPct}%`,
            width: `${Math.min(widthPct, 100 - leftPct)}%`,
            background: STATUS_COLOR[project.status] || '#94a3b8',
            minWidth: 24,
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        />

        {/* Hover popup */}
        {hover && (
          <div className="absolute z-20 bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg"
               style={{ left: `${Math.min(leftPct + 2, 60)}%`, top: '-56px', minWidth: 200 }}>
            <p className="font-semibold mb-1">{project.name}</p>
            <p className="text-gray-300">{STATUS_LABEL[project.status]} · {project.progress_pct || 0}% complété</p>
            {project.contract_value && (
              <p className="text-gray-300">{Number(project.contract_value).toLocaleString('fr-CA', {style:'currency',currency:'CAD'})}</p>
            )}
            {project.client_name && <p className="text-gray-400">{project.client_name}</p>}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="w-10 text-xs text-gray-400 text-right flex-shrink-0">{project.progress_pct || 0}%</div>
    </div>
  );
}

function HealthPanel({ summary, loading, onRefresh }) {
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand" />
          <span className="font-semibold text-gray-900 text-sm">Résumé IA — aujourd'hui</span>
        </div>
        <button onClick={onRefresh} className="btn-ghost py-1 px-2 text-xs" disabled={loading}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={14} className="animate-spin" /> Analyse en cours…
        </div>
      ) : summary ? (
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</div>
      ) : (
        <p className="text-sm text-gray-400">Aucune donnée disponible pour l'analyse.</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { company, plan } = useAuthStore();
  const navigate = useNavigate();

  const [projectList, setProjectList] = useState([]);
  const [health, setHealth]     = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [projLoading, setProjLoading]     = useState(true);

  // Gantt date range
  const today = new Date();
  const minDate = new Date(today.getTime() - 14*86400000);
  const maxDate = new Date(today.getTime() + 90*86400000);
  const totalDays = Math.ceil((maxDate - minDate) / 86400000);

  const loadProjects = async () => {
    setProjLoading(true);
    try {
      const { data } = await projects.list();
      setProjectList(data.filter(p => p.status !== 'cancelled'));
    } catch {}
    finally { setProjLoading(false); }
  };

  const loadHealth = async () => {
    if (!plan?.features?.ai_health_check) return;
    setHealthLoading(true);
    try {
      const { data } = await ai.healthCheck();
      setHealth(data.summary);
    } catch {}
    finally { setHealthLoading(false); }
  };

  useEffect(() => { loadProjects(); loadHealth(); }, []);

  // KPI cards
  const activeProjects  = projectList.filter(p => p.status === 'active').length;
  const totalValue      = projectList.reduce((s, p) => s + (Number(p.contract_value) || 0), 0);
  const avgProgress     = projectList.length
    ? Math.round(projectList.reduce((s, p) => s + (p.progress_pct || 0), 0) / projectList.length)
    : 0;

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('fr-CA', {weekday:'long', day:'numeric', month:'long'})}</p>
        </div>

        {/* DEV badge */}
        {plan?.is_dev_override && (
          <div className="mb-4 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2 text-xs text-purple-700">
            <span className="font-bold">⚡ DEV MODE</span>
            <span>Forfait {plan.slug} simulé {plan.dev_note ? `— ${plan.dev_note}` : ''}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-brand">{activeProjects}</p>
            <p className="text-xs text-gray-500 mt-1">Chantiers actifs</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">
              {totalValue > 0 ? (totalValue/1000).toFixed(0) + 'k$' : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Valeur totale</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{avgProgress}%</p>
            <p className="text-xs text-gray-500 mt-1">Avancement moyen</p>
          </div>
        </div>

        {/* Health check AI */}
        {plan?.features?.ai_health_check !== false && (
          <HealthPanel summary={health} loading={healthLoading} onRefresh={loadHealth} />
        )}

        {/* Gantt multi-projets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Chronologie des projets</h2>
            <button
              className="btn-primary py-1.5 px-3 text-xs"
              onClick={() => navigate('/projets')}
            >
              Voir tous
            </button>
          </div>

          {projLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <Loader2 size={14} className="animate-spin" /> Chargement…
            </div>
          ) : projectList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 mb-3">Aucun projet actif</p>
              <button className="btn-primary" onClick={() => navigate('/projets')}>
                Créer un projet
              </button>
            </div>
          ) : (
            <>
              {/* Timeline header */}
              <div className="flex items-center gap-3 mb-1 pb-2 border-b border-gray-100">
                <div className="w-40 flex-shrink-0" />
                <div className="flex-1 flex justify-between text-xs text-gray-400">
                  <span>{minDate.toLocaleDateString('fr-CA',{month:'short',day:'numeric'})}</span>
                  <span>Aujourd'hui</span>
                  <span>{maxDate.toLocaleDateString('fr-CA',{month:'short',day:'numeric'})}</span>
                </div>
                <div className="w-10" />
              </div>

              {/* Rows */}
              {projectList.slice(0, 10).map((p) => (
                <GanttRow
                  key={p.id}
                  project={p}
                  minDate={minDate}
                  totalDays={totalDays}
                  onClick={(id) => navigate(`/projets/${id}`)}
                />
              ))}

              {/* Legend */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                {Object.entries(STATUS_COLOR).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:c}} />
                    <span className="text-xs text-gray-400">{STATUS_LABEL[s]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
