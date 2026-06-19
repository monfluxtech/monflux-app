import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ai, dashboard as dashApi, projects as projectsApi, leads as leadsApi } from '../api';
import { useAuthStore } from '../store';
import Layout from '../components/Layout';
import {
  Users, FolderKanban, Receipt, FileText, Phone, Plus, ChevronRight,
  Loader2, Sparkles, RefreshCw, QrCode, Activity, TrendingUp, AlertCircle,
  HardHat, Calendar,
} from 'lucide-react';

const TYPE_ICON = {
  lead:    { label: 'Lead',       color: '#3b82f6' },
  quote:   { label: 'Soumission', color: '#F26522' },
  invoice: { label: 'Facture',    color: '#22c55e' },
  project: { label: 'Projet',     color: '#6366f1' },
  punch:   { label: 'Punch',      color: '#f59e0b' },
};

const STATUS_FR = {
  new:'Nouveau', contacted:'Contacté', quote_sent:'Soumission envoyée', won:'Gagné', lost:'Perdu',
  draft:'Brouillon', sent:'Envoyée', viewed:'Vue', signed:'Signée', expired:'Expirée',
  rejected:'Refusée', converted:'Convertie', paid:'Payée', overdue:'En retard', partial:'Partielle',
  active:'Actif', completed:'Terminé', on_hold:'En pause', cancelled:'Annulé',
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.round(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.round(diff/3600)} h`;
  if (diff < 604800) return `il y a ${Math.round(diff/86400)} j`;
  return new Date(ts).toLocaleDateString('fr-CA', { day:'numeric', month:'short' });
}

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    if (!target || isNaN(target)) { setVal(target || 0); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return val;
}

function KPI({ icon: Icon, label, value, color, sub, onClick, raw }) {
  const numeric = typeof raw === 'number' ? raw : null;
  const animated = useCountUp(numeric);
  const display = numeric !== null
    ? (value.includes('k$') ? `${Math.round(animated / 1000)}k$` : String(animated))
    : value;

  return (
    <div
      className={`card flex items-center gap-3 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight tabular-nums">{display}</p>
        {sub && <p className="text-xs text-red-500 font-medium">{sub}</p>}
      </div>
      {onClick && <ChevronRight size={14} className="text-gray-300 flex-shrink-0"/>}
    </div>
  );
}

function LivePresence({ workers }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!workers?.length) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [workers]);

  if (!workers?.length) return null;

  const elapsed = (clockIn) => {
    const diff = (now - new Date(clockIn).getTime()) / 1000 / 60;
    if (diff < 60) return `${Math.round(diff)}min`;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <h2 className="text-sm font-semibold text-gray-700">
          Sur le chantier en ce moment
        </h2>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          {workers.length} actif{workers.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {workers.map(w => (
          <div key={w.id} className="flex items-center gap-2.5 bg-white border border-green-100 shadow-sm rounded-xl px-3 py-2 hover:border-green-300 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: `hsl(${(w.name.charCodeAt(0) * 37) % 360},60%,50%)` }}
            >
              {(w.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{w.name}</p>
              <p className="text-xs text-gray-400 leading-tight">
                {w.project_name || 'Chantier'} · <span className="text-green-600 font-medium">{elapsed(w.clock_in)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_COLOR = { active:'#22c55e', on_hold:'#f59e0b', completed:'#6b7280', cancelled:'#ef4444', lead:'#3b82f6', quote:'#6366f1' };
const STATUS_LABEL = { active:'Actif', on_hold:'En pause', completed:'Terminé', cancelled:'Annulé', lead:'Lead', quote:'Soumission' };

function ProjectTimeline({ projects, onNavigate }) {
  const [hoveredId, setHoveredId] = useState(null);
  const dated = projects.filter(p => p.start_date && p.end_date);
  if (dated.length === 0) return null;

  const today = new Date();
  const starts = dated.map(p => new Date(p.start_date));
  const ends = dated.map(p => new Date(p.end_date));
  const minDate = new Date(Math.min(...starts));
  const maxDate = new Date(Math.max(...ends, today));
  const range = maxDate - minDate || 1;
  const toPct = d => Math.max(0, Math.min(100, ((new Date(d) - minDate) / range) * 100));
  const todayPct = toPct(today);

  const labels = [];
  const cursor = new Date(minDate);
  cursor.setDate(1);
  while (cursor <= maxDate) {
    labels.push({ label: cursor.toLocaleDateString('fr-CA', { month: 'short' }), pct: toPct(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="card mb-4">
      <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
        <Calendar size={14} className="text-indigo-500" /> Calendrier des chantiers
        <span className="text-xs text-gray-300 font-normal ml-1">— cliquer pour ouvrir</span>
      </h2>
      <div className="relative select-none">
        {/* Month ticks */}
        <div className="relative h-5 mb-1 border-b border-gray-100">
          {labels.map((m, i) => (
            <span key={i} className="absolute text-xs text-gray-300 -translate-x-1/2" style={{ left: `${m.pct}%` }}>
              {m.label}
            </span>
          ))}
        </div>

        {/* Project bars */}
        <div className="space-y-1.5 pt-1">
          {dated.map(p => {
            const left = toPct(p.start_date);
            const width = toPct(p.end_date) - left;
            const isLate = p.status === 'active' && new Date(p.end_date) < today;
            const pct = p.progress_pct || 0;
            const isHovered = hoveredId === p.id;
            const tipLeft = left + width / 2;
            const anchorLeft = tipLeft > 65 ? 'right-0' : tipLeft < 35 ? 'left-0' : 'left-1/2 -translate-x-1/2';

            return (
              <div
                key={p.id}
                className="relative h-8"
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Row background */}
                <div className="absolute inset-0 bg-gray-50 rounded-lg" />

                {/* Bar */}
                <div
                  className={`absolute h-full rounded-lg transition-all duration-150 cursor-pointer flex items-center px-2 text-xs text-white font-medium overflow-hidden
                    ${isLate ? 'bg-red-400 hover:bg-red-500' : 'bg-brand hover:brightness-110'}
                    ${isHovered ? 'shadow-md ring-2 ring-white z-10' : ''}`}
                  style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                  onClick={() => onNavigate(p.id)}
                >
                  {/* Progress fill */}
                  {pct > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-white/25 rounded-lg pointer-events-none"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  {width > 8 && <span className="relative truncate">{p.name}</span>}
                </div>

                {/* Project label (outside bar when bar is too narrow) */}
                {width <= 8 && (
                  <span
                    className="absolute text-xs text-gray-500 truncate"
                    style={{ left: `${Math.min(left + Math.max(width, 2) + 0.5, 95)}%`, top: '50%', transform: 'translateY(-50%)', maxWidth: 100 }}
                  >
                    {p.name}
                  </span>
                )}

                {/* Hover tooltip */}
                {isHovered && (
                  <div
                    className={`absolute bottom-full mb-2 z-50 pointer-events-none ${anchorLeft}`}
                    style={{ left: tipLeft > 65 ? 'auto' : tipLeft < 35 ? 'auto' : `${tipLeft}%` }}
                  >
                    <div className="bg-gray-900 text-white rounded-xl shadow-xl p-3 w-52 text-xs">
                      <p className="font-semibold text-sm mb-1 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[p.status] || '#6b7280' }}/>
                        <span style={{ color: STATUS_COLOR[p.status] || '#9ca3af' }}>{STATUS_LABEL[p.status] || p.status}</span>
                        {isLate && <span className="text-red-400 font-medium ml-auto">En retard</span>}
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-white/20 rounded-full mb-2">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-gray-400 mb-1.5">
                        <span>Avancement</span>
                        <span className="text-white font-semibold">{pct}%</span>
                      </div>
                      {p.contract_value > 0 && (
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span>Contrat</span>
                          <span className="text-white">{Number(p.contract_value).toLocaleString('fr-CA')}$</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400 border-t border-white/10 pt-1.5 mt-0.5">
                        <span>Fin prévue</span>
                        <span className={isLate ? 'text-red-400' : 'text-white'}>
                          {new Date(p.end_date).toLocaleDateString('fr-CA', { day:'numeric', month:'short' })}
                        </span>
                      </div>
                      <div className="text-center mt-2 text-gray-500 text-xs">Cliquer pour ouvrir →</div>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Today line */}
        {todayPct >= 0 && todayPct <= 100 && (
          <div className="absolute top-0 bottom-0 w-px bg-brand/60 pointer-events-none z-20" style={{ left: `${todayPct}%` }}>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand" />
            <div className="absolute top-2 left-1 text-xs text-brand/70 whitespace-nowrap font-medium">auj.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeProjs, setActiveProjs] = useState([]);
  const [hotLeads, setHotLeads] = useState([]);
  const [presence, setPresence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [hl, setHL] = useState(false);
  const [askInput, setAskInput] = useState('');

  const askAI = (q) => {
    const question = (q || askInput).trim();
    if (!question) { navigate('/chat'); return; }
    navigate(`/chat?q=${encodeURIComponent(question)}`);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sum, act, projs, leads, pres] = await Promise.all([
        dashApi.summary(),
        dashApi.activity(),
        projectsApi.list(),
        leadsApi.list(),
        dashApi.presence().catch(() => ({ data: [] })),
      ]);
      setSummary(sum.data);
      setActivity(act.data);
      setActiveProjs(projs.data.filter(p => p.status === 'active').slice(0, 6));
      setHotLeads(leads.data.filter(l => ['new','contacted'].includes(l.status)).slice(0, 5));
      setPresence(pres.data || []);
    } catch {} finally { setLoading(false); }
  };

  const loadHealth = async () => {
    setHL(true);
    try { const { data } = await ai.healthCheck(); setHealth(data.summary); }
    catch {} finally { setHL(false); }
  };

  useEffect(() => {
    load().then(() => loadHealth());
    // Refresh presence every 90s
    const t = setInterval(() => dashApi.presence().catch(() => ({ data: [] })).then(r => setPresence(r.data || [])), 90000);
    return () => clearInterval(t);
  }, []);

  const name = user?.name?.split(' ')[0] || '';
  const h = new Date().getHours();
  const greet = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {greet}{name ? `, ${name}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {new Date().toLocaleDateString('fr-CA', { weekday:'long', day:'numeric', month:'long' })}
          </p>
        </div>

        {/* AI ask-bar — central control: ask the assistant anything, or use a suggestion */}
        <div className="mb-5 rounded-2xl p-4 sm:p-5" style={{ background:'linear-gradient(135deg, #fff7ed 0%, #ffffff 55%)', border:'1px solid #fde6d3' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#F26522' }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">Assistant IA MONFLUX</p>
              <p className="text-xs text-gray-500 leading-tight truncate">
                {summary
                  ? `${summary.active_projects ?? 0} chantier(s) actif(s) · ${summary.new_leads ?? 0} lead(s) à suivre · ${summary.outstanding > 0 ? `${Math.round(summary.outstanding/1000)}k$ à encaisser` : 'rien à encaisser'}${summary.overdue_count > 0 ? ` · ${summary.overdue_count} en retard` : ''}`
                  : 'Posez une question ou demandez une action en langage naturel.'}
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2 mb-3">
            <input
              className="input flex-1 bg-white"
              placeholder="Demandez à l'IA : « Résume mes chantiers » ou « Crée un lead… »"
              value={askInput}
              onChange={e => setAskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAI()}
            />
            <button className="btn-primary px-4 flex-shrink-0" onClick={() => askAI()}>
              <Sparkles size={14}/> Demander
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2">
            {[
              'Résume mes chantiers actifs',
              'Quelles factures sont en retard ?',
              'Montre mes leads à rappeler',
              'Génère une estimation de rénovation cuisine',
            ].map((s) => (
              <button
                key={s}
                onClick={() => askAI(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-brand hover:text-brand transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : (
          <>
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

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <KPI
                icon={Users} label="Leads à suivre"
                value={String(summary?.new_leads ?? 0)} raw={summary?.new_leads ?? 0}
                color="#F26522" onClick={() => navigate('/leads')}
              />
              <KPI
                icon={FolderKanban} label="Chantiers actifs"
                value={String(summary?.active_projects ?? 0)} raw={summary?.active_projects ?? 0}
                color="#22c55e" onClick={() => navigate('/projets')}
              />
              <KPI
                icon={Receipt} label="À encaisser"
                value={summary?.outstanding > 0 ? `${Math.round(summary.outstanding/1000)}k$` : '0$'}
                raw={summary?.outstanding ?? 0}
                color={summary?.overdue_count > 0 ? '#ef4444' : '#6b7280'}
                sub={summary?.overdue_count > 0 ? `${summary.overdue_count} en retard` : undefined}
                onClick={() => navigate('/factures')}
              />
              <KPI
                icon={TrendingUp} label="Pipeline"
                value={summary?.pipeline_value > 0 ? `${Math.round(summary.pipeline_value/1000)}k$` : '0$'}
                raw={summary?.pipeline_value ?? 0}
                color="#6366f1" onClick={() => navigate('/soumissions')}
              />
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <button className="btn-primary" onClick={() => navigate('/leads?new=1')}>
                <Plus size={14}/> Nouveau lead
              </button>
              <button className="btn-secondary" onClick={() => navigate('/soumissions?new=1')}>
                <FileText size={14}/> Nouvelle soumission
              </button>
              <button className="btn-secondary" onClick={() => navigate('/projets?new=1')}>
                <FolderKanban size={14}/> Nouveau projet
              </button>
              <button className="btn-secondary" onClick={() => navigate('/punch')}>
                <QrCode size={14}/> Pointer
              </button>
            </div>

            {/* Live presence */}
            <LivePresence workers={presence} />

            {/* Project timeline */}
            <ProjectTimeline projects={activeProjs} onNavigate={(id) => navigate(`/projets/${id}`)} />

            {/* 3-col grid */}
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
                    <div
                      key={p.id}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/30 -mx-5 px-5 rounded"
                      onClick={() => navigate(`/projets/${p.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          {late && <span className="badge badge-red text-xs">Retard</span>}
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }}/>
                        </div>
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
                        <a href={`tel:${l.contact_phone}`} className="btn-ghost p-1.5 text-green-500" title="Appeler">
                          <Phone size={13}/>
                        </a>
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
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand"/>
                  <span className="font-semibold text-gray-900 text-sm">Résumé IA</span>
                  <span className="text-xs text-gray-300">· Vous pouvez aussi créer des leads en écrivant à l'assistant ↘</span>
                </div>
                <button className="btn-ghost p-1.5" onClick={loadHealth} disabled={hl} title="Actualiser">
                  {hl ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
                </button>
              </div>
              {hl
                ? <p className="text-sm text-gray-400">Analyse en cours…</p>
                : health
                  ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{health}</p>
                  : <p className="text-sm text-gray-400">Cliquez sur actualiser pour un résumé IA de votre journée.</p>
              }
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
