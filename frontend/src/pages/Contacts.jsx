import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { contacts as contactsApi } from '../api';
import { Plus, Loader2, User, Phone, Mail, Pencil, Trash2, Search, Building2 } from 'lucide-react';

const EMPTY = { name: '', email: '', phone: '', company: '', notes: '' };

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact ? {
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    notes: contact.notes || '',
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = contact
        ? await contactsApi.update(contact.id, form)
        : await contactsApi.create(form);
      onSave(data, !!contact);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-semibold text-gray-900 mb-4">{contact ? 'Modifier le contact' : 'Nouveau contact'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Nom *</label><input className="input" value={form.name} onChange={f('name')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Courriel</label><input className="input" type="email" value={form.email} onChange={f('email')} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={f('phone')} /></div>
          </div>
          <div><label className="label">Entreprise</label><input className="input" value={form.company} onChange={f('company')} /></div>
          <div><label className="label">Notes</label><textarea className="input min-h-[64px] resize-none" value={form.notes} onChange={f('notes')} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {contact ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await contactsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i => i.map(c => c.id === data.id ? { ...c, ...data } : c));
    else setItems(i => [data, ...i]);
    setShowNew(false); setEditItem(null);
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;
    await contactsApi.delete(id);
    setItems(i => i.filter(c => c.id !== id));
  };

  const filtered = items.filter(c =>
    !q || [c.name, c.email, c.phone, c.company].some(v => v?.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15} /> Nouveau contact</button>
        </div>

        {showNew && <ContactModal onClose={() => setShowNew(false)} onSave={handleSave} />}
        {editItem && <ContactModal contact={editItem} onClose={() => setEditItem(null)} onSave={handleSave} />}

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8"
            placeholder="Rechercher par nom, courriel, téléphone…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <User size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{q ? 'Aucun résultat.' : 'Aucun contact. Créez-en un!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => (
              <div key={c.id} className="card flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm" style={{ background: '#F26522' }}>
                    {(c.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                    {c.company && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <Building2 size={10} />{c.company}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button className="btn-ghost p-1 text-gray-300 hover:text-blue-500" onClick={() => setEditItem(c)}><Pencil size={12} /></button>
                    <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" onClick={() => del(c.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pl-13">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-600">
                      <Phone size={11} className="text-gray-400" />{c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand truncate">
                      <Mail size={11} className="text-gray-400" />{c.email}
                    </a>
                  )}
                  {c.notes && <p className="text-xs text-gray-400 italic truncate">{c.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
