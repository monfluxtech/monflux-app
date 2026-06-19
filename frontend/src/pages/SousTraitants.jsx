import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { subcontractors as subsApi } from '../api';
import { Plus, Loader2, HardHat, Star, Phone, Mail } from 'lucide-react';

export default function SousTraitants() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name:'', company_name:'', email:'', phone:'', whatsapp:'', specialties:'', hourly_rate:'', rbq_number:'' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await subsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await subsApi.create({
        ...form,
        specialties: form.specialties ? form.specialties.split(',').map(s=>s.trim()) : [],
        hourly_rate: form.hourly_rate || null,
      });
      setItems(i => [...i, data]);
      setShowNew(false);
      setForm({ name:'', company_name:'', email:'', phone:'', whatsapp:'', specialties:'', hourly_rate:'', rbq_number:'' });
    } catch {} finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Sous-traitants</h1>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15}/> Ajouter</button>
        </div>

        {showNew && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="font-semibold text-gray-900 mb-4">Nouveau sous-traitant</h2>
              <form onSubmit={create} className="space-y-3">
                <div><label className="label">Nom *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required /></div>
                <div><label className="label">Compagnie</label><input className="input" value={form.company_name} onChange={e=>setForm(f=>({...f,company_name:e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Téléphone</label><input className="input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
                  <div><label className="label">WhatsApp</label><input className="input" type="tel" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} /></div>
                </div>
                <div><label className="label">Courriel</label><input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
                <div><label className="label">Spécialités (séparées par virgules)</label><input className="input" placeholder="Électricité, Plomberie" value={form.specialties} onChange={e=>setForm(f=>({...f,specialties:e.target.value}))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Taux horaire ($)</label><input className="input" type="number" value={form.hourly_rate} onChange={e=>setForm(f=>({...f,hourly_rate:e.target.value}))} /></div>
                  <div><label className="label">Numéro RBQ</label><input className="input" value={form.rbq_number} onChange={e=>setForm(f=>({...f,rbq_number:e.target.value}))} /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setShowNew(false)}>Annuler</button>
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving && <Loader2 size={14} className="animate-spin" />} Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(s => (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    {s.company_name && <p className="text-xs text-gray-400">{s.company_name}</p>}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={12} className={n <= (s.rating||0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                {s.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {s.specialties.map(sp => <span key={sp} className="badge badge-orange">{sp}</span>)}
                  </div>
                )}
                <div className="flex gap-3 text-xs text-gray-400">
                  {s.phone && <span className="flex items-center gap-1"><Phone size={11}/>{s.phone}</span>}
                  {s.email && <span className="flex items-center gap-1"><Mail size={11}/>{s.email}</span>}
                  {s.hourly_rate && <span className="ml-auto font-medium text-gray-700">{s.hourly_rate}$/h</span>}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-400 text-sm">Aucun sous-traitant ajouté</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
