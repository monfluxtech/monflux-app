import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ai, projects as projectsApi, leads as leadsApi, invoices as invoicesApi, quotes as quotesApi } from '../api';
import { useAuthStore } from '../store';
import Layout from '../components/Layout';
import { Users, FolderKanban, Receipt, FileText, Phone, Plus, ChevronRight, Loader2, Sparkles, RefreshCw, QrCode } from 'lucide-react';

function KPI({ icon: Icon, label, value, color, onClick }) {
  return (
    <div className={`card flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      </div>
      {onClick && <ChevronRight size={14} className="text-gray-300 flex-shrink-0"/>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [d, setD] = useState({ projects:[], leads:[], invoices:[], quotes:[] });
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [hl, setHL] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, l, i, q] = await Promise.all([projectsApi.list(), leadsApi.list(), invoicesApi.list(), quotesApi.list()]);
      setD({ projects: p.data, leads: l.data, invoices: i.data, quotes: q.data });
    } catch {} finally { setLoading(false); }
  };

  const loadHealth = async () => {
    setHL(true);
    try { const { data } = await ai.healthCheck(); setHealth(data.summary); }
    catch {} finally { setHL(false); }
  };

  useEffect(() => { load(); }, []);

  const hotLeads    = d.leads.filter(l => ['new','contacted'].includes(l.status));
  const activeProjs = d.projects.filter(p => p.status === 'active');
  const unpaid      = d.invoices.filter(i => ['sent','viewed','partial','overdue'].includes(i.status)).reduce((s,i)=>s+Number(i.amount_due||0),0);
  const pipeline    = d.quotes.filter(q => ['draft','sent','viewed','signed'].includes(q.status)).reduce((s,q)=>s+Number(q.total||0),0);

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
              <KPI icon={Users}        label="Leads à suivre"       value={hotLeads.length}    color="#F26522" onClick={() => navigate('/leads')} />
              <KPI icon={FolderKanban} label="Chantiers actifs"     value={activeProjs.length} color="#22c55e" onClick={() => navigate('/projets')} />
              <KPI icon={Receipt}      label="À encaisser"          value={unpaid > 0 ? `${Math.round(unpaid/1000)}k$` : '0$'} color="#ef4444" onClick={() => navigate('/factures')} />
              <KPI icon={FileText}     label="Pipeline soumissions" value={pipeline > 0 ? `${Math.round(pipeline/1000)}k$` : '0$'} color="#6366f1" onClick={() => navigate('/soumissions')} />
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <button className="btn-primary" onClick={() => navigate('/leads?new=1')}><Plus size={14}/> Nouveau lead</button>
              <button className="btn-secondary" onClick={() => navigate('/soumissions?new=1')}><FileText size={14}/> Nouvelle soumission</button>
              <button className="btn-secondary" onClick={() => navigate('/projets?new=1')}><FolderKanban size={14}/> Nouveau projet</button>
              <button className="btn-secondary" onClick={() => navigate('/punch')}><QrCode size={14}/> Pointer</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Active projects */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm">Chantiers actifs</h2>
                  <button className="btn-ghost text-xs py-0.5 px-2" onClick={() => navigate('/projets')}>Voir tout</button>
                </div>
                {activeProjs.length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-sm text-gray-400 mb-2">Aucun chantier actif</p>
                    <button className="btn-primary text-xs" onClick={() => navigate('/projets')}>Créer un projet</button>
                  </div>
                ) : activeProjs.slice(0,5).map(p => {
                  const pct = p.progress_pct || 0;
                  const end = p.end_date ? new Date(p.end_date) : null;
                  const late = end && end < new Date() && p.status==='active';
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/30 -mx-5 px-5 rounded" onClick={() => navigate(`/projets/${p.id}`)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          {late && <span className="badge badge-red text-xs">Retard</span>}
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full bg-brand transition-all" style={{width:`${pct}%`}}/></div>
                      </div>
                      <span className="text-sm font-bold text-brand flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Hot leads */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm">Leads à rappeler</h2>
                  <button className="btn-ghost text-xs py-0.5 px-2" onClick={() => navigate('/leads')}>Voir tout</button>
                </div>
                {hotLeads.length === 0 ? (
                  <div className="py-5 text-center">
                    <p className="text-sm text-gray-400 mb-2">Aucun lead en attente</p>
                    <button className="btn-primary text-xs" onClick={() => navigate('/leads')}>Ajouter un lead</button>
                  </div>
                ) : hotLeads.slice(0,5).map(l => (
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
            </div>

            {/* AI summary */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Sparkles size={14} className="text-brand"/><span className="font-semibold text-gray-900 text-sm">Résumé IA</span></div>
                <button className="btn-ghost p-1.5" onClick={loadHealth} disabled={hl}>{hl ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}</button>
              </div>
              {hl ? <p className="text-sm text-gray-400">Analyse…</p>
                  : health ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{health}</p>
                  : <p className="text-sm text-gray-400">Cliquez sur actualiser pour un résumé IA de votre journée.</p>}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
