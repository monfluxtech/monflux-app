import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ai, dashboard as dashApi, projects as projectsApi, leads as leadsApi } from '../api';
import { useAuthStore } from '../store';
import Layout from '../components/Layout';
import {
  Users, FolderKanban, Receipt, FileText, Phone, Plus, ChevronRight,
  Loader2, Sparkles, RefreshCw, QrCode, Clock, Activity,
  TrendingUp, AlertCircle,
} from 'lucide-react';

const TYPE_ICON = {
  lead:    { label: 'Lead',       color: '#3b82f6' },
  quote:   { label: 'Soumission', color: '#F26522' },
  invoice: { label: 'Facture',    color: '#22c55e' },
  project: { label: 'Projet',     color: '#6366f1' },
  punch:   { label: 'Pointage',   color: '#f59e0b' },
};

const STATUS_FR = {
  new:'Nouveau', contacted:'Contacté', quote_sent:'Soumission envoyée', won:'Gagné', lost:'Perdu',
  draft:'Brouillon', sent:'Envoyée', viewed:'Vue', signed:'Signée', expired:'Expirée',
  rejected:'Refusée', converted:'Convertie', paid:'Payée', overdue:'En retard', partial:'Partielle',
  active:'Actif', completed:'Terminé', on_hold:'En pause', cancelled:'Annulé',
};

function KPI({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <div className={`card flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      {onClick && <ChevronRight size={14} className="text-gray-300 flex-shrink-0"/>}
    </div>
  );
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.round(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.round(diff/3600)} h`;
  if (diff < 604800) return `il y a ${Math.round(diff/86400)} j`;
  return new Date(ts).toLocaleDateString('fr-CA', { day:'numeric', month:'short' });
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeProjs, setActiveProjs] = useState([]);
  const [hotLeads, setHotLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [hl, setHL] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sum, act, projs, leads] = await Promise.all([
        dashApi.summary(),
        dashApi.activity(),
        projectsApi.list(),
        leadsApi.list(),
      ]);
      setSummary(sum.data);
      setActivity(act.data);
      setActiveProjs(projs.data.filter(p => p.status === 'active').slice(0, 5));
      setHotLeads(leads.data.filter(l => ['new','contacted'].includes(l.status)).slice(0, 5));
    } catch {} finally { setLoading(false); }
  };

  const loadHealth = async () => {
    setHL(true);
    try { const { data } = await ai.healthCheck(); setHealth(data.summary); }
    catch {} finally { setHL(false); }
  };

  useEffect(() => { load().then(() => loadHealth()); }, []);

  const name = user?.name?.split(' ')[0] || '';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">{greet}{name ? `, ${name}` : ''} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {new Date().toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'})}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <KPI
                icon={Users} label="Leads à suivre"
                value={summary?.new_leads ?? hotLeads.length} color="#F26522"
                onClick={() => navigate('/leads')}
              />
              <KPI
                icon={FolderKanban} label="Chantiers actifs"
                value={summary?.active_projects ?? activeProjs.length} color="#22c55e"
                onClick={() => navigate('/projets')}
              />
              <KPI
                icon={Receipt} label="À encaisser"
                value={summary?.outstanding > 0 ? `${Math.round(summary.outstanding/1000)}k$` : '0$'}
                color={summary?.overdue_count > 0 ? '#ef4444' : '#6b7280'}
                sub={summary?.overdue_count > 0 ? `${summary.overdue_count} en retard` : undefined}
                onClick={() => navigate('/factures')}
              />
              <KPI
                icon={TrendingUp} label="Pipeline"
                value={summary?.pipeline_value > 0 ? `${Math.round(summary.pipeline_value/1000)}k$` : '0$'}
                color="#6366f1" onClick={() => navigate('/soumissions')}
              />
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <button className="btn-primary" onClick={() => navigate('/leads?new=1')}><Plus size={14}/> Nouveau lead</button>
              <button className="btn-secondary" onClick={() => navigate('/soumissions?new=1')}><FileText size={14}/> Nouvelle soumission</button>
              <button className="btn-secondary" onClick={() => navigate('/projets?new=1')}><FolderKanban size={14}/> Nouveau projet</button>
              <button className="btn-secondary" onClick={() => navigate('/punch')}><QrCode size={14}/> Pointer</button>
            </div>

            {/* Overdue alert */}
            {summary?.overdue_count > 0 && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">
                    {summary.overdue_count} facture{summary.overdue_count > 1 ? 's' : ''} en retard
                  </p>
                  <p className="text-xs text-red-500">Action requise pour maintenir votre flux de trésorerie</p>
                </div>
                <button className="btn-danger text-xs py-1.5 px-3" onClick={() => navigate('/factures')}>Voir</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Active projects */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <FolderKanban size={14} className="text-brand"/> Chantiers actifs
                  </h2>
                  <button className="btn-ghost text-xs py-0.5 px-2" onClick={() => navigate('/projets')}>Voir tout</button>
                </div>
                {activeProjs.length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-sm text-gray-400 mb-2">Aucun chantier actif</p>
                    <button className="btn-primary text-xs" onClick={() => navigate('/projets')}>Créer un projet</button>
                  </div>
                ) : activeProjs.map(p => {
                  const pct = p.progress_pct || 0;
                  const end = p.end_date ? new Date(p.end_date) : null;
                  const late = end && end < new Date() && p.status === 'active';
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/30 -mx-5 px-5 rounded" onClick={() => navigate(`/projets/${p.id}`)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          {late && <span className="badge badge-red text-xs">Retard</span>}
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full bg-brand" style={{width:`${pct}%`}}/></div>
                      </div>
                      <span className="text-sm font-bold text-brand flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Hot leads */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                    <Phone size={14} className="text-green-500"/> Leads à rappeler
                  </h2>
                  <button className="btn-ghost text-xs py-0.5 px-2" onClick={() => navigate('/leads')}>Voir tout</button>
                </div>
                {hotLeads.length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-sm text-gray-400 mb-2">Aucun lead en attente</p>
                    <button className="btn-primary text-xs" onClick={() => navigate('/leads?new=1')}>Ajouter un lead</button>
                  </div>
                ) : hotLeads.map(l => (
                  <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                      {l.contact_name && <p className="text-xs text-gray-400">{l.contact_name}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {l.contact_phone && (
                        <a href={`tel:${l.contact_phone}`} className="btn-ghost p-1.5 text-green-500" title="Appeler"><Phone size={13}/></a>
                      )}
                      <button className="btn-secondary text-xs py-1 px-2" onClick={() => navigate('/leads')}>Ouvrir</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity feed */}
              <div className="card">
                <div className="flex items-center gap-1.5 mb-3">
                  <Activity size={14} className="text-purple-500"/>
                  <h2 className="font-semibold text-gray-900 text-sm">Activité récente</h2>
                </div>
                {activity.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Aucune activité récente.</p>
                ) : (
                  <div className="space-y-0">
                    {activity.slice(0, 8).map((ev, i) => {
                      const meta = TYPE_ICON[ev.type] || { label: ev.type, color: '#9ca3af' };
                      const status = STATUS_FR[ev.status] || ev.status;
                      return (
                        <div key={i} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: meta.color }}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 truncate leading-snug">
                              <span className="font-medium" style={{ color: meta.color }}>{meta.label}</span>
                              {' '}<span className="text-gray-600">{ev.label || '—'}</span>
                            </p>
                            <p className="text-xs text-gray-400">{status} · {timeAgo(ev.ts)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* AI summary */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Sparkles size={14} className="text-brand"/><span className="font-semibold text-gray-900 text-sm">Résumé IA</span></div>
                <button className="btn-ghost p-1.5" onClick={loadHealth} disabled={hl} title="Actualiser">
                  {hl ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
                </button>
              </div>
              {hl ? <p className="text-sm text-gray-400">Analyse en cours…</p>
                  : health ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{health}</p>
                  : <p className="text-sm text-gray-400">Cliquez sur actualiser pour un résumé IA de votre journée.</p>}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
