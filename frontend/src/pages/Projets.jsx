import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { projects as projectsApi } from '../api';
import { Plus, Loader2, MapPin, Calendar, DollarSign, Pencil, Trash2, ChevronRight } from 'lucide-react';

const SB = { active:'badge-green', lead:'badge-gray', quote:'badge-yellow', on_hold:'badge-blue', completed:'badge-gray', cancelled:'badge-red' };
const SL = { active:'Actif', lead:'Lead', quote:'Soumission', on_hold:'En pause', completed:'Terminé', cancelled:'Annulé' };
const SC = { active:'#22c55e', lead:'#94a3b8', quote:'#f59e0b', on_hold:'#6366f1', completed:'#22c55e', cancelled:'#ef4444' };
const EMPTY = { name:'', address:'', start_date:'', end_date:'', contract_value:'' };

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project ? {
    name:project.name||'', address:project.address||'',
    start_date:project.start_date?project.start_date.slice(0,10):'',
    end_date:project.end_date?project.end_date.slice(0,10):'',
    contract_value:project.contract_value||''
  } : {...EMPTY});
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { name:form.name, address:form.address, start_date:form.start_date||null, end_date:form.end_date||null, contract_value:form.contract_value||null };
      const {data} = project ? await projectsApi.update(project.id, payload) : await projectsApi.create(payload);
      onSave(data, !!project);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-semibold text-gray-900 mb-4">{project?'Modifier le projet':'Nouveau projet'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Nom du projet *</label><input className="input" value={form.name} onChange={f('name')} required/></div>
          <div><label className="label">Adresse du chantier</label><input className="input" placeholder="123 rue Principale, Montréal" value={form.address} onChange={f('address')}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Début</label><input className="input" type="date" value={form.start_date} onChange={f('start_date')}/></div>
            <div><label className="label">Fin prévue</label><input className="input" type="date" value={form.end_date} onChange={f('end_date')}/></div>
          </div>
          <div><label className="label">Valeur du contrat ($)</label><input className="input" type="number" value={form.contract_value} onChange={f('contract_value')}/></div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving&&<Loader2 size={14} className="animate-spin"/>} {project?'Enregistrer':'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projets() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [editItem, setEditItem] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const {data} = await projectsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i=>i.map(p=>p.id===data.id?{...p,...data}:p));
    else { setItems(i=>[data,...i]); navigate(`/projets/${data.id}`); }
    setShowNew(false); setEditItem(null);
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce projet ?')) return;
    await projectsApi.delete(id);
    setItems(i=>i.filter(p=>p.id!==id));
  };

  const active = items.filter(p=>p.status==='active');
  const others = items.filter(p=>p.status!=='active');

  const ProjectCard = ({ p }) => {
    const pct = p.progress_pct || 0;
    const color = SC[p.status] || '#94a3b8';
    return (
      <div className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={()=>navigate(`/projets/${p.id}`)}>
        <div className="w-2 h-10 rounded-full flex-shrink-0" style={{background:color}}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
            <span className={`badge ${SB[p.status]}`}>{SL[p.status]}</span>
          </div>
          <div className="flex gap-3 text-xs text-gray-400 flex-wrap mb-1.5">
            {p.address && <span className="flex items-center gap-1"><MapPin size={11}/>{p.address}</span>}
            {p.start_date && <span className="flex items-center gap-1"><Calendar size={11}/>{new Date(p.start_date).toLocaleDateString('fr-CA')}</span>}
            {p.contract_value && <span className="flex items-center gap-1"><DollarSign size={11}/>{Number(p.contract_value).toLocaleString('fr-CA')}$</span>}
          </div>
          {p.status === 'active' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full" style={{width:`${pct}%`,background:color}}/></div>
              <span className="text-xs font-medium" style={{color}}>{pct}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e=>e.stopPropagation()}>
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500" onClick={()=>setEditItem(p)}><Pencil size={13}/></button>
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" onClick={()=>del(p.id)}><Trash2 size={13}/></button>
          <ChevronRight size={14} className="text-gray-300 ml-1"/>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Projets</h1>
          <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={15}/> Nouveau projet</button>
        </div>

        {showNew && <ProjectModal onClose={()=>setShowNew(false)} onSave={handleSave}/>}
        {editItem && <ProjectModal project={editItem} onClose={()=>setEditItem(null)} onSave={handleSave}/>}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun projet. Créez-en un!</div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">En cours ({active.length})</p>
                <div className="grid gap-3">{active.map(p=><ProjectCard key={p.id} p={p}/>)}</div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Autres ({others.length})</p>
                <div className="grid gap-3">{others.map(p=><ProjectCard key={p.id} p={p}/>)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
