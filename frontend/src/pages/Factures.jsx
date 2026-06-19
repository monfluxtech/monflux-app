import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { invoices as invoicesApi, projects as projectsApi } from '../api';
import { Plus, Loader2, Receipt, Pencil, Trash2 } from 'lucide-react';

const SL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée' };
const SB = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', partial:'badge-orange', paid:'badge-green', overdue:'badge-red', cancelled:'badge-gray' };
const FILTERS = ['','sent','overdue','paid'];
const FL = { '':'Toutes', sent:'Envoyées', overdue:'En retard', paid:'Payées' };

function CreateModal({ projects, onClose, onSave }) {
  const [form, setForm] = useState({
    project_id:'', client_name:'', client_email:'', due_date:'',
    items:[{ description:'', qty:1, unit_price:'' }], tps_pct:5, tvq_pct:9.975
  });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const addItem = () => setForm(p=>({...p,items:[...p.items,{description:'',qty:1,unit_price:''}]}));
  const removeItem = i => setForm(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));
  const setItem = (i,k,v) => setForm(p=>({...p,items:p.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
  const subtotal = form.items.reduce((s,it)=>s+(Number(it.qty)||1)*(Number(it.unit_price)||0),0);
  const taxes = subtotal*(form.tps_pct/100+form.tvq_pct/100);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await invoicesApi.create({
        ...form,
        project_id: form.project_id||null,
        items: form.items.map(it=>({...it,qty:Number(it.qty)||1,unit_price:Number(it.unit_price)||0})),
        tps_pct: Number(form.tps_pct), tvq_pct: Number(form.tvq_pct),
      });
      onSave(data);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-4">Nouvelle facture</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Client *</label><input className="input" value={form.client_name} onChange={f('client_name')} required /></div>
            <div><label className="label">Courriel client</label><input className="input" type="email" value={form.client_email} onChange={f('client_email')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Projet lié</label>
              <select className="input" value={form.project_id} onChange={f('project_id')}>
                <option value="">— Aucun —</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="label">Date d'échéance</label><input className="input" type="date" value={form.due_date} onChange={f('due_date')} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Lignes</label>
              <button type="button" className="btn-ghost text-xs py-0.5 px-2" onClick={addItem}><Plus size={12}/> Ajouter</button>
            </div>
            <div className="space-y-2">
              {form.items.map((it,i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                  <input className="input col-span-6 text-xs" placeholder="Description" value={it.description} onChange={e=>setItem(i,'description',e.target.value)} />
                  <input className="input col-span-2 text-xs" placeholder="Qté" type="number" value={it.qty} onChange={e=>setItem(i,'qty',e.target.value)} />
                  <input className="input col-span-3 text-xs" placeholder="Prix" type="number" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} />
                  <button type="button" className="col-span-1 text-gray-300 hover:text-red-400" onClick={()=>removeItem(i)}><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          </div>
          {subtotal > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{subtotal.toLocaleString('fr-CA')}$</span></div>
              <div className="flex justify-between text-gray-400"><span>TPS ({form.tps_pct}%)</span><span>{(subtotal*form.tps_pct/100).toFixed(2)}$</span></div>
              <div className="flex justify-between text-gray-400"><span>TVQ ({form.tvq_pct}%)</span><span>{(subtotal*form.tvq_pct/100).toFixed(2)}$</span></div>
              <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1"><span>Total</span><span>{(subtotal+taxes).toFixed(2)}$</span></div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin"/>} Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ inv, onClose, onSave }) {
  const [status, setStatus] = useState(inv.status);
  const [due_date, setDueDate] = useState(inv.due_date ? inv.due_date.slice(0,10) : '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await invoicesApi.update(inv.id, { status, due_date: due_date||null });
      onSave(data);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Modifier la facture</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Statut</label>
            <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
              {Object.entries(SL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className="label">Échéance</label><input className="input" type="date" value={due_date} onChange={e=>setDueDate(e.target.value)} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin"/>} Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Factures() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: invs }, { data: projs }] = await Promise.all([
        invoicesApi.list(filter ? { status: filter } : {}),
        projectsApi.list()
      ]);
      setItems(invs);
      setProjects(projs);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = (data) => { setItems(i=>[data,...i]); setShowCreate(false); };
  const handleEdit = (data) => { setItems(i=>i.map(inv=>inv.id===data.id?{...inv,...data}:inv)); setEditItem(null); };

  const del = async (id) => {
    if (!confirm('Supprimer cette facture ?')) return;
    await invoicesApi.delete(id);
    setItems(i=>i.filter(inv=>inv.id!==id));
  };

  const totalOverdue = items.filter(i=>i.status==='overdue').reduce((s,i)=>s+Number(i.amount_due||0),0);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Factures</h1>
          <button className="btn-primary" onClick={()=>setShowCreate(true)}><Plus size={15}/> Nouvelle facture</button>
        </div>

        {showCreate && <CreateModal projects={projects} onClose={()=>setShowCreate(false)} onSave={handleCreate} />}
        {editItem && <EditModal inv={editItem} onClose={()=>setEditItem(null)} onSave={handleEdit} />}

        {totalOverdue > 0 && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Factures en retard</p>
              <p className="text-xs text-red-500">{Number(totalOverdue).toLocaleString('fr-CA')}$ en attente</p>
            </div>
            <button className="btn-danger text-xs py-1.5" onClick={()=>setFilter('overdue')}>Voir</button>
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(s=>(
            <button key={s} className={`btn ${filter===s?'btn-primary':'btn-secondary'} py-1 px-3 text-xs`} onClick={()=>setFilter(s)}>
              {FL[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={36} className="text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-400 text-sm">Aucune facture trouvée.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(inv => (
              <div key={inv.id} className="card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 text-sm">{inv.number} {inv.client_name && `— ${inv.client_name}`}</p>
                    <span className={`badge ${SB[inv.status]}`}>{SL[inv.status]}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Total : {Number(inv.total).toLocaleString('fr-CA')}$
                    {inv.amount_due > 0 && ` · Dû : ${Number(inv.amount_due).toLocaleString('fr-CA')}$`}
                    {inv.due_date && ` · Échéance : ${new Date(inv.due_date).toLocaleDateString('fr-CA')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <p className="font-bold text-gray-900 text-sm mr-2">{Number(inv.total).toLocaleString('fr-CA')}$</p>
                  <button className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500" onClick={()=>setEditItem(inv)}><Pencil size={14}/></button>
                  <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" onClick={()=>del(inv.id)}><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
