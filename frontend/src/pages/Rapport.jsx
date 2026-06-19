import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { projects as projectsApi, invoices as invoicesApi, leads as leadsApi, quotes as quotesApi, timesheets as tsApi } from '../api';
import { BarChart3, TrendingUp, Clock, DollarSign, Users, Loader2, Download } from 'lucide-react';

function StatCard({ label, value, sub, color = '#F26522' }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Rapport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, i, l, q, ts] = await Promise.all([
        projectsApi.list(),
        invoicesApi.list(),
        leadsApi.list(),
        quotesApi.list(),
        tsApi.list({}),
      ]);
      setData({ projects: p.data, invoices: i.data, leads: l.data, quotes: q.data, timesheets: ts.data });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Métrique', 'Valeur'],
      ['Projets actifs', data.projects.filter(p=>p.status==='active').length],
      ['Total projets', data.projects.length],
      ['Revenus facturés', data.invoices.filter(i=>i.status!=='cancelled').reduce((s,i)=>s+Number(i.total||0),0).toFixed(2)],
      ['Revenus encaissés', data.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.total||0),0).toFixed(2)],
      ['À encaisser', data.invoices.filter(i=>['sent','viewed','partial','overdue'].includes(i.status)).reduce((s,i)=>s+Number(i.amount_due||0),0).toFixed(2)],
      ['Leads total', data.leads.length],
      ['Leads gagnés', data.leads.filter(l=>l.status==='won').length],
      ['Pipeline soumissions', data.quotes.filter(q=>['draft','sent','viewed','signed'].includes(q.status)).reduce((s,q)=>s+Number(q.total||0),0).toFixed(2)],
      ['Total heures pointées', data.timesheets.reduce((s,t)=>s+Number(t.hours_total||0),0).toFixed(1)],
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'}));
    a.download = `rapport-monflux-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div></Layout>;
  if (!data) return null;

  const activeProjects = data.projects.filter(p=>p.status==='active');
  const totalRevenue = data.invoices.filter(i=>i.status!=='cancelled').reduce((s,i)=>s+Number(i.total||0),0);
  const collected = data.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.total||0),0);
  const outstanding = data.invoices.filter(i=>['sent','viewed','partial','overdue'].includes(i.status)).reduce((s,i)=>s+Number(i.amount_due||0),0);
  const overdue = data.invoices.filter(i=>i.status==='overdue');
  const pipeline = data.quotes.filter(q=>['draft','sent','viewed','signed'].includes(q.status)).reduce((s,q)=>s+Number(q.total||0),0);
  const wonLeads = data.leads.filter(l=>l.status==='won');
  const totalLeads = data.leads.length;
  const convRate = totalLeads > 0 ? Math.round(wonLeads.length / totalLeads * 100) : 0;
  const totalHours = data.timesheets.reduce((s,t)=>s+Number(t.hours_total||0),0);

  // Monthly invoice data (last 6 months)
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return { label: d.toLocaleDateString('fr-CA',{month:'short'}), year: d.getFullYear(), month: d.getMonth() };
  });
  const monthlyRevenue = months.map(m => ({
    label: m.label,
    revenue: data.invoices
      .filter(inv => { const d = new Date(inv.created_at); return d.getFullYear()===m.year && d.getMonth()===m.month; })
      .reduce((s,i)=>s+Number(i.total||0),0),
  }));
  const maxRev = Math.max(...monthlyRevenue.map(m=>m.revenue), 1);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} /> Rapport & Indicateurs
          </h1>
          <button className="btn-secondary" onClick={exportCSV}><Download size={14}/> Exporter CSV</button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Revenus facturés" value={`${Math.round(totalRevenue/1000)}k$`} sub="total" color="#F26522"/>
          <StatCard label="Encaissé" value={`${Math.round(collected/1000)}k$`} sub={`${Math.round(totalRevenue>0?collected/totalRevenue*100:0)}% du facturé`} color="#22c55e"/>
          <StatCard label="À encaisser" value={`${Math.round(outstanding/1000)}k$`} sub={overdue.length>0?`${overdue.length} en retard`:'à jour'} color={overdue.length>0?'#ef4444':'#6b7280'}/>
          <StatCard label="Pipeline" value={`${Math.round(pipeline/1000)}k$`} sub="soumissions actives" color="#6366f1"/>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Projets actifs" value={activeProjects.length} sub={`/ ${data.projects.length} total`} color="#22c55e"/>
          <StatCard label="Taux conversion" value={`${convRate}%`} sub={`${wonLeads.length}/${totalLeads} leads`} color="#F26522"/>
          <StatCard label="Heures pointées" value={`${totalHours.toFixed(0)}h`} sub={`${data.timesheets.length} entrées`} color="#3b82f6"/>
          <StatCard label="Leads actifs" value={data.leads.filter(l=>['new','contacted'].includes(l.status)).length} sub="nouveaux / contactés" color="#f59e0b"/>
        </div>

        {/* Revenue chart + Lead funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-brand"/> Facturation — 6 derniers mois
            </h2>
            <div className="flex items-end gap-2 h-28 mb-1">
              {monthlyRevenue.map((m, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1 group">
                  <div
                    className="w-full rounded-t-md transition-all relative"
                    style={{
                      height: `${Math.round(m.revenue / maxRev * 100)}%`,
                      minHeight: m.revenue > 0 ? 4 : 0,
                      background: i === 5 ? '#F26522' : '#F26522',
                      opacity: 0.4 + i * 0.12,
                    }}
                    title={`${m.label}: ${m.revenue.toLocaleString('fr-CA')}$`}
                  />
                  <p className="text-xs text-gray-400">{m.label}</p>
                  <p className="text-xs font-semibold text-gray-600 h-4">
                    {m.revenue > 0 ? `${Math.round(m.revenue/1000)}k` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Lead funnel */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <Users size={14} className="text-brand"/> Entonnoir des leads
            </h2>
            {(() => {
              const stages = [
                { key: 'all',       label: 'Leads total',        count: data.leads.length,                                               color: '#6b7280' },
                { key: 'contacted', label: 'Contactés',           count: data.leads.filter(l=>['contacted','quote_sent','won'].includes(l.status)).length, color: '#F26522' },
                { key: 'quoted',    label: 'Soumission envoyée',  count: data.leads.filter(l=>['quote_sent','won'].includes(l.status)).length, color: '#6366f1' },
                { key: 'won',       label: 'Gagnés',              count: wonLeads.length,                                                color: '#22c55e' },
              ];
              const max = stages[0].count || 1;
              return (
                <div className="space-y-2">
                  {stages.map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">{s.label}</span>
                        <span className="text-xs font-bold" style={{ color: s.color }}>{s.count}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round(s.count / max * 100)}%`, background: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                    Taux de conversion global : <strong style={{color:'#22c55e'}}>{convRate}%</strong>
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Overdue invoices */}
        {overdue.length > 0 && (
          <div className="card mb-6 border-red-100">
            <h2 className="font-semibold text-red-600 text-sm mb-3 flex items-center gap-2">
              <DollarSign size={14}/> Factures en retard ({overdue.length})
            </h2>
            <div className="space-y-2">
              {overdue.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{inv.title || `Facture ${inv.number}`}</p>
                    {inv.client_name && <p className="text-xs text-gray-400">{inv.client_name}</p>}
                  </div>
                  <p className="text-sm font-bold text-red-500">{Number(inv.amount_due||0).toLocaleString('fr-CA')}$</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top projects by value */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Users size={14} className="text-brand"/> Projets par valeur
          </h2>
          <div className="space-y-2">
            {data.projects
              .filter(p => p.contract_value > 0)
              .sort((a,b) => Number(b.contract_value) - Number(a.contract_value))
              .slice(0,8)
              .map(p => {
                const SL = { active:'badge-green', lead:'badge-gray', quote:'badge-yellow', on_hold:'badge-blue', completed:'badge-gray', cancelled:'badge-red' };
                const SN = { active:'Actif', lead:'Lead', quote:'Soumission', on_hold:'En pause', completed:'Terminé', cancelled:'Annulé' };
                const maxVal = data.projects.reduce((s,p)=>Math.max(s,Number(p.contract_value||0)),0) || 1;
                const pct = Math.round(Number(p.contract_value)/maxVal*100);
                return (
                  <div key={p.id} className="py-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-800 flex-1 truncate">{p.name}</p>
                      <span className={`badge ${SL[p.status]||'badge-gray'} text-xs`}>{SN[p.status]||p.status}</span>
                      <p className="text-sm font-bold text-gray-700 flex-shrink-0">{Number(p.contract_value).toLocaleString('fr-CA')}$</p>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full bg-brand" style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            {data.projects.filter(p=>p.contract_value>0).length === 0 && (
              <p className="text-sm text-gray-400">Aucun projet avec valeur de contrat définie.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
