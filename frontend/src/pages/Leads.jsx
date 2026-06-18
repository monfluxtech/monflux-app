import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { leads as leadsApi, contacts as contactsApi } from '../api';
import { Plus, Loader2, ChevronRight, User, Calendar } from 'lucide-react';

const STATUSES = ['new','contacted','quote_sent','won','lost'];
const STATUS_LABEL = { new:'Nouveau', contacted:'Contacté', quote_sent:'Soumission envoyée', won:'Gagné', lost:'Perdu' };
const STATUS_BADGE = { new:'badge-blue', contacted:'badge-yellow', quote_sent:'badge-orange', won:'badge-green', lost:'badge-gray' };

export default function Leads() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title:'', source:'manual', type_of_work:'other', budget_min:'', budget_max:'', priority:'normal' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await leadsApi.list(filter ? { status: filter } : {}); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await leadsApi.create({ ...form, budget_min: form.budget_min||null, budget_max: form.budget_max||null });
      setItems(i => [data, ...i]);
      setShowNew(false);
      setForm({ title:'', source:'manual', type_of_work:'other', budget_min:'', budget_max:'', priority:'normal' });
    } catch {} finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    await leadsApi.update(id, { status });
    setItems(i => i.map(l => l.id === id ? { ...l, status } : l));
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15}/> Nouveau lead</button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className={`btn ${!filter ? 'btn-primary' : 'btn-secondary'} py-1 px-3 text-xs`} onClick={() => setFilter('')}>Tous</button>
          {STATUSES.map(s => (
            <button key={s} className={`btn ${filter===s ? 'btn-primary' : 'btn-secondary'} py-1 px-3 text-xs`} onClick={() => setFilter(s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* New lead modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md">
              <h2 className="font-semibold text-gray-900 mb-4">Nouveau lead</h2>
              <form onSubmit={create} className="space-y-3">
                <div><label className="label">Titre du projet</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Budget min ($)</label><input className="input" type="number" value={form.budget_min} onChange={e=>setForm(f=>({...f,budget_min:e.target.value}))} /></div>
                  <div><label className="label">Budget max ($)</label><input className="input" type="number" value={form.budget_max} onChange={e=>setForm(f=>({...f,budget_max:e.target.value}))} /></div>
                </div>
                <div><label className="label">Source</label>
                  <select className="input" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
                    <option value="manual">Manuel</option>
                    <option value="email">Courriel</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook_ads">Facebook Ads</option>
                    <option value="google_lsa">Google LSA</option>
                    <option value="soumissions_reno">SoumissionsRenovations</option>
                    <option value="referral">Référence</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setShowNew(false)}>Annuler</button>
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null} Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun lead trouvé</div>
        ) : (
          <div className="space-y-2">
            {items.map(l => (
              <div key={l.id} className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{l.title || '(Sans titre)'}</p>
                    <span className={`badge ${STATUS_BADGE[l.status]}`}>{STATUS_LABEL[l.status]}</span>
                    {l.ai_score && <span className="badge badge-orange">Score IA: {l.ai_score}</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    {l.contact_name && <span className="flex items-center gap-1"><User size={11}/>{l.contact_name}</span>}
                    {(l.budget_min || l.budget_max) && (
                      <span>{l.budget_min ? `${Number(l.budget_min).toLocaleString('fr-CA')}$` : ''}{l.budget_max ? ` – ${Number(l.budget_max).toLocaleString('fr-CA')}$` : ''}</span>
                    )}
                    <span className="capitalize">{l.source?.replace('_',' ')}</span>
                  </div>
                </div>
                <select
                  className="input w-36 text-xs py-1"
                  value={l.status}
                  onClick={e => e.stopPropagation()}
                  onChange={e => changeStatus(l.id, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
