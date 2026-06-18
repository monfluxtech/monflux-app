import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projects as projectsApi } from '../api';
import { Plus, Loader2, MapPin, Calendar, DollarSign } from 'lucide-react';

const STATUS_BADGE = { active:'badge-green', lead:'badge-gray', quote:'badge-yellow', on_hold:'badge-blue', completed:'badge-gray', cancelled:'badge-red' };
const STATUS_LABEL = { active:'Actif', lead:'Lead', quote:'Soumission', on_hold:'En pause', completed:'Terminé', cancelled:'Annulé' };

export default function Projets() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm]     = useState({ name:'', type:'other', address:'', start_date:'', end_date:'', contract_value:'' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const { data } = await projectsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await projectsApi.create({ ...form, contract_value: form.contract_value || null });
      setItems(i => [data, ...i]);
      setShowNew(false);
      navigate(`/projets/${data.id}`);
    } catch {} finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Projets</h1>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15}/> Nouveau projet</button>
        </div>

        {showNew && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md">
              <h2 className="font-semibold text-gray-900 mb-4">Nouveau projet</h2>
              <form onSubmit={create} className="space-y-3">
                <div><label className="label">Nom du projet</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
                <div><label className="label">Adresse du chantier</label><input className="input" placeholder="123 rue Principale, Montréal" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Début</label><input className="input" type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></div>
                  <div><label className="label">Fin prévue</label><input className="input" type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></div>
                </div>
                <div><label className="label">Valeur du contrat ($)</label><input className="input" type="number" value={form.contract_value} onChange={e=>setForm(f=>({...f,contract_value:e.target.value}))} /></div>
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

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <div className="grid gap-3">
            {items.map(p => (
              <div key={p.id} className="card flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/projets/${p.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    {p.address && <span className="flex items-center gap-1"><MapPin size={11}/>{p.address}</span>}
                    {p.start_date && <span className="flex items-center gap-1"><Calendar size={11}/>{new Date(p.start_date).toLocaleDateString('fr-CA')}</span>}
                    {p.contract_value && <span className="flex items-center gap-1"><DollarSign size={11}/>{Number(p.contract_value).toLocaleString('fr-CA')}$</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-brand">{p.progress_pct || 0}%</div>
                  <div className="text-xs text-gray-400">Avancement</div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">Aucun projet. Créez-en un!</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
