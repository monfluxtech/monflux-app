import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { contacts as contactsApi } from '../api';
import {
  Plus, Loader2, User, Phone, Mail, Pencil, Trash2, Search,
  Building2, Star, Clock, MessageCircle, ChevronDown,
  ChevronRight, RefreshCw, CalendarClock, FolderKanban,
} from 'lucide-react';

const TYPE_LABELS = {
  prospect: { label: 'Prospect', color: 'bg-gray-100 text-gray-600' },
  client:   { label: 'Client',   color: 'bg-blue-100 text-blue-700' },
  partner:  { label: 'Partenaire', color: 'bg-purple-100 text-purple-700' },
  other:    { label: 'Autre',    color: 'bg-gray-100 text-gray-500' },
};

const EMPTY = {
  name: '', type: 'prospect', email: '', phone: '', whatsapp: '',
  company_name: '', address: '', city: '',
  notes: '', is_recurring: false, source: '', follow_up_at: '', follow_up_note: '',
};

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact ? {
    name: contact.name || '',
    type: contact.type || 'prospect',
    email: contact.email || '',
    phone: contact.phone || '',
    whatsapp: contact.whatsapp || '',
    company_name: contact.company_name || '',
    address: contact.address || '',
    city: contact.city || '',
    notes: contact.notes || '',
    is_recurring: contact.is_recurring || false,
    source: contact.source || '',
    follow_up_at: contact.follow_up_at ? contact.follow_up_at.slice(0,10) : '',
    follow_up_note: contact.follow_up_note || '',
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const fBool = k => e => setForm(p => ({ ...p, [k]: e.target.checked }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, follow_up_at: form.follow_up_at || null };
      const res = contact
        ? await contactsApi.update(contact.id, payload)
        : await contactsApi.create(payload);
      const saved = res?.data ?? res;
      if (!saved?.id) throw new Error('Réponse invalide');
      onSave(saved, !!contact);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">{contact ? 'Modifier contact' : 'Nouveau contact'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Client, prospect ou partenaire</p>
          </div>
          <button onClick={onClose} className="btn-ghost text-gray-400 text-lg">×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nom *</label>
              <input className="input" value={form.name} onChange={f('name')} required placeholder="Nom complet" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={f('type')}>
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="partner">Partenaire</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="recurring" checked={form.is_recurring} onChange={fBool('is_recurring')} className="accent-brand" />
              <label htmlFor="recurring" className="text-sm text-gray-700 flex items-center gap-1">
                <Star size={12} className="text-amber-400"/> Client récurrent
              </label>
            </div>
          </div>

          <div>
            <label className="label">Compagnie</label>
            <input className="input" value={form.company_name} onChange={f('company_name')} placeholder="Nom de l'entreprise" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.phone} onChange={f('phone')} placeholder="514 555-0000" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="email@exemple.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">WhatsApp</label>
              <input className="input" value={form.whatsapp} onChange={f('whatsapp')} placeholder="514 555-0000" />
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={f('source')}>
                <option value="">—</option>
                <option value="referral">Référence</option>
                <option value="social">Réseaux sociaux</option>
                <option value="web">Site web</option>
                <option value="phone">Appel entrant</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Adresse</label>
              <input className="input" value={form.address} onChange={f('address')} />
            </div>
            <div>
              <label className="label">Ville</label>
              <input className="input" value={form.city} onChange={f('city')} />
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-1"><CalendarClock size={12}/> Relance prévue</label>
            <input className="input" type="date" value={form.follow_up_at} onChange={f('follow_up_at')} />
          </div>
          {form.follow_up_at && (
            <div>
              <label className="label">Note de relance</label>
              <input className="input" value={form.follow_up_note} onChange={f('follow_up_note')} placeholder="Quoi lui dire, contexte…" />
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={f('notes')} placeholder="Infos utiles sur ce contact…" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin"/>}
              {saving ? 'Enregistrement…' : contact ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactCard({ contact, onEdit, onDelete, onTouch }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_LABELS[contact.type] || TYPE_LABELS.other;
  const projectCount = Number(contact.project_count || 0);
  const isOverdue = contact.follow_up_at && new Date(contact.follow_up_at) < new Date();
  const isDueToday = contact.follow_up_at && new Date(contact.follow_up_at).toDateString() === new Date().toDateString();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-CA', { month:'short', day:'numeric' }) : null;
  const formatRelative = (d) => {
    if (!d) return null;
    const days = Math.round((new Date() - new Date(d)) / 86400000);
    if (days === 0) return "aujourd'hui";
    if (days === 1) return "hier";
    if (days < 7) return `il y a ${days}j`;
    if (days < 30) return `il y a ${Math.round(days/7)}sem`;
    return `il y a ${Math.round(days/30)}mois`;
  };

  return (
    <div className={`card mb-3 border ${isOverdue ? 'border-red-200' : isDueToday ? 'border-amber-200' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-brand font-semibold text-sm">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{contact.name}</span>
            {contact.is_recurring && <Star size={12} className="text-amber-400 fill-amber-400" title="Client récurrent"/>}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
            {projectCount > 0 && (
              <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <FolderKanban size={9}/> {projectCount} projet{projectCount>1?'s':''}
              </span>
            )}
          </div>
          {contact.company_name && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 size={10}/>{contact.company_name}</p>}

          {/* Communication links */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} onClick={() => onTouch(contact.id)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-green-600 transition-colors">
                <Phone size={11}/>{contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} onClick={() => onTouch(contact.id)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand transition-colors truncate">
                <Mail size={11}/>{contact.email}
              </a>
            )}
            {contact.whatsapp && (
              <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                onClick={() => onTouch(contact.id)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-green-500 transition-colors">
                <MessageCircle size={11}/>WhatsApp
              </a>
            )}
          </div>

          {/* Follow-up indicator */}
          {contact.follow_up_at && (
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg w-fit
              ${isOverdue ? 'bg-red-50 text-red-600' : isDueToday ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              <CalendarClock size={10}/>
              Relance {isOverdue ? 'en retard' : isDueToday ? "aujourd'hui" : formatDate(contact.follow_up_at)}
              {contact.follow_up_note && <span className="text-gray-400 ml-1">· {contact.follow_up_note}</span>}
            </div>
          )}

          {contact.last_contacted_at && (
            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
              <Clock size={9}/> Dernier contact {formatRelative(contact.last_contacted_at)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(e=>!e)} className="btn-ghost text-gray-400 p-1.5">
            {expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          </button>
          <button onClick={() => onTouch(contact.id)} className="btn-ghost text-gray-400 p-1.5" title="Marquer contacté maintenant">
            <RefreshCw size={13}/>
          </button>
          <button onClick={() => onEdit(contact)} className="btn-ghost text-gray-400 p-1.5"><Pencil size={13}/></button>
          <button onClick={() => onDelete(contact.id)} className="btn-ghost text-red-400 hover:text-red-600 p-1.5"><Trash2 size={13}/></button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {contact.city && <p className="text-xs text-gray-500">{contact.address ? `${contact.address}, ` : ''}{contact.city}</p>}
          {contact.source && <p className="text-xs text-gray-500">Source : <span className="font-medium">{contact.source}</span></p>}
          {contact.notes && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{contact.notes}</p>}
        </div>
      )}
    </div>
  );
}

export default function Contacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [recurringFilter, setRecurringFilter] = useState('');

  useEffect(() => {
    contactsApi.list().then(r => {
      setItems(r?.data ?? r ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i => i.map(c => c.id===data.id ? {...c,...data} : c));
    else setItems(i => [data, ...i]);
    setShowModal(false); setEditItem(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;
    await contactsApi.delete(id);
    setItems(i => i.filter(c => c.id !== id));
  };

  const handleTouch = async (id) => {
    try {
      const res = await contactsApi.touch(id);
      const updated = res?.data ?? res;
      setItems(i => i.map(c => c.id===id ? {...c, last_contacted_at: updated.last_contacted_at} : c));
    } catch {}
  };

  const overdue = items.filter(c => c.follow_up_at && new Date(c.follow_up_at) < new Date());

  const filtered = items.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q);
    const matchType = !typeFilter || c.type === typeFilter;
    const matchRecurring = !recurringFilter || (recurringFilter === 'recurring' ? c.is_recurring : !c.is_recurring);
    return matchSearch && matchType && matchRecurring;
  });

  const recurring = filtered.filter(c => c.is_recurring);
  const nonRecurring = filtered.filter(c => !c.is_recurring);

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
            <p className="text-xs text-gray-400 mt-0.5">{items.length} contact{items.length!==1?'s':''} · {items.filter(c=>c.is_recurring).length} récurrents</p>
          </div>
          <button className="btn-primary text-sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <Plus size={15}/> Nouveau
          </button>
        </div>

        {/* Relances en retard */}
        {overdue.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1"><CalendarClock size={12}/> {overdue.length} relance{overdue.length>1?'s':''} en retard</p>
            <div className="flex flex-wrap gap-2">
              {overdue.map(c => (
                <a key={c.id} href={`tel:${c.phone||''}`}
                   className="text-xs bg-white border border-red-200 text-red-600 rounded-lg px-2 py-1 hover:bg-red-100 transition-colors">
                  {c.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="input pl-8 text-sm" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="input text-sm w-36" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="prospect">Prospects</option>
            <option value="client">Clients</option>
            <option value="partner">Partenaires</option>
          </select>
          <select className="input text-sm w-36" value={recurringFilter} onChange={e=>setRecurringFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="recurring">Récurrents</option>
            <option value="new">Nouveaux</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-10 justify-center"><Loader2 size={16} className="animate-spin"/>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <User size={32} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Aucun contact</p>
            <button className="btn-primary mt-3 text-sm" onClick={() => setShowModal(true)}><Plus size={14}/> Ajouter</button>
          </div>
        ) : (
          <>
            {recurring.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Star size={10} className="text-amber-400 fill-amber-400"/> Clients récurrents ({recurring.length})
                </p>
                {recurring.map(c => (
                  <ContactCard key={c.id} contact={c}
                    onEdit={c => { setEditItem(c); setShowModal(true); }}
                    onDelete={handleDelete} onTouch={handleTouch}/>
                ))}
              </div>
            )}
            {nonRecurring.length > 0 && (
              <div>
                {recurring.length > 0 && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Autres ({nonRecurring.length})</p>}
                {nonRecurring.map(c => (
                  <ContactCard key={c.id} contact={c}
                    onEdit={c => { setEditItem(c); setShowModal(true); }}
                    onDelete={handleDelete} onTouch={handleTouch}/>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ContactModal
          contact={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </Layout>
  );
}
