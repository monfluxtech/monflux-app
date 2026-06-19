import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { subcontractors as subsApi } from '../api';
import { Plus, Loader2, HardHat, Star, Phone, Mail, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { name:'', company_name:'', email:'', phone:'', whatsapp:'', specialties:'', hourly_rate:'', rbq_number:'' };

function SubModal({ sub, onClose, onSave }) {
  const [form, setForm] = useState(sub ? {
    name: sub.name||'', company_name: sub.company_name||'', email: sub.email||'',
    phone: sub.phone||'', whatsapp: sub.whatsapp||'',
    specialties: Array.isArray(sub.specialties) ? sub.specialties.join(', ') : (sub.specialties||''),
    hourly_rate: sub.hourly_rate||'', rbq_number: sub.rbq_number||''
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, specialties: form.specialties ? form.specialties.split(',').map(s=>s.trim()).filter(Boolean) : [], hourly_rate: form.hourly_rate||null };
      const { data } = sub ? await subsApi.update(sub.id, payload) : await subsApi.create(payload);
      onSave(data, !!sub);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-4">{sub ? 'Modifier' : 'Nouveau sous-traitant'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Nom *</label><input className="input" value={form.name} onChange={f('name')} required /></div>
          <div><label className="label">Compagnie</label><input className="input" value={form.company_name} onChange={f('company_name')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Téléphone</label><input className="input" type="tel" value={form.phone} onChange={f('phone')} /></div>
            <div><label className="label">WhatsApp</label><input className="input" type="tel" value={form.whatsapp} onChange={f('whatsapp')} /></div>
          </div>
          <div><label className="label">Courriel</label><input className="input" type="email" value={form.email} onChange={f('email')} /></div>
          <div><label className="label">Spécialités (séparées par virgules)</label><input className="input" placeholder="Électricité, Plomberie" value={form.specialties} onChange={f('specialties')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Taux horaire ($)</label><input className="input" type="number" value={form.hourly_rate} onChange={f('hourly_rate')} /></div>
            <div><label className="label">Numéro RBQ</label><input className="input" value={form.rbq_number} onChange={f('rbq_number')} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin"/>} {sub ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SousTraitants() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await subsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i => i.map(s => s.id === data.id ? data : s));
    else setItems(i => [...i, data]);
    setShowNew(false);
    setEditItem(null);
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce sous-traitant ?')) return;
    await subsApi.delete(id);
    setItems(i => i.filter(s => s.id !== id));
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Sous-traitants</h1>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15}/> Ajouter</button>
        </div>

        {showNew && <SubModal onClose={()=>setShowNew(false)} onSave={handleSave} />}
        {editItem && <SubModal sub={editItem} onClose={()=>setEditItem(null)} onSave={handleSave} />}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(s => (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    {s.company_name && <p className="text-xs text-gray-400">{s.company_name}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5 mr-1">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={11} className={n<=(s.rating||0)?'text-yellow-400 fill-yellow-400':'text-gray-200'} />
                      ))}
                    </div>
                    <button className="btn-ghost p-1 text-gray-400 hover:text-blue-500" onClick={()=>setEditItem(s)}><Pencil size={13}/></button>
                    <button className="btn-ghost p-1 text-gray-400 hover:text-red-500" onClick={()=>del(s.id)}><Trash2 size={13}/></button>
                  </div>
                </div>
                {s.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {s.specialties.map(sp => <span key={sp} className="badge badge-orange">{sp}</span>)}
                  </div>
                )}
                <div className="flex gap-3 text-xs text-gray-400">
                  {s.phone && <span className="flex items-center gap-1"><Phone size={11}/>{s.phone}</span>}
                  {s.email && <span className="flex items-center gap-1 truncate"><Mail size={11}/>{s.email}</span>}
                  {s.hourly_rate && <span className="ml-auto font-medium text-gray-700">{s.hourly_rate}$/h</span>}
                </div>
                {s.rbq_number && <p className="text-xs text-gray-300 mt-1">RBQ : {s.rbq_number}</p>}
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
                <HardHat size={32} className="text-gray-200 mx-auto mb-3"/>
                Aucun sous-traitant ajouté
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
