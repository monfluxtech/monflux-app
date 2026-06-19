import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { leads as leadsApi, quotes as quotesApi } from '../api';
import { Plus, Loader2, User, Phone, Mail, MapPin, Pencil, Trash2, FileText, ClipboardList, ChevronDown, ChevronUp, FolderKanban } from 'lucide-react';

const STATUSES = ['new','contacted','quote_sent','won','lost'];
const SL = { new:'Nouveau', contacted:'Contacté', quote_sent:'Soumission envoyée', won:'Gagné', lost:'Perdu' };
const SB = { new:'badge-blue', contacted:'badge-yellow', quote_sent:'badge-orange', won:'badge-green', lost:'badge-gray' };
const WORK_TYPES = ['residential','commercial','industrial','renovation','roofing','concrete','other'];
const WL = { residential:'Résidentiel', commercial:'Commercial', industrial:'Industriel', renovation:'Rénovation', roofing:'Toiture', concrete:'Béton', other:'Autre' };

const EMPTY_FORM = { title:'', contact_name:'', contact_phone:'', contact_email:'', contact_address:'', source:'manual', type_of_work:'other', budget_min:'', budget_max:'', priority:'normal', description:'' };

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead ? {
    title: lead.title||'', contact_name: lead.contact_name||'', contact_phone: lead.contact_phone||'',
    contact_email: lead.contact_email||'', contact_address: lead.city||'',
    source: lead.source||'manual', type_of_work: lead.type_of_work||'other',
    budget_min: lead.budget_min||'', budget_max: lead.budget_max||'',
    priority: lead.priority||'normal', description: lead.description||''
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, budget_min: form.budget_min||null, budget_max: form.budget_max||null };
      const { data } = lead ? await leadsApi.update(lead.id, payload) : await leadsApi.create(payload);
      onSave(data, !!lead);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-4">{lead ? 'Modifier le lead' : 'Nouveau lead'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre du projet *</label><input className="input" value={form.title} onChange={f('title')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nom du client</label><input className="input" value={form.contact_name} onChange={f('contact_name')} /></div>
            <div><label className="label">Téléphone</label><input className="input" type="tel" value={form.contact_phone} onChange={f('contact_phone')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Courriel</label><input className="input" type="email" value={form.contact_email} onChange={f('contact_email')} /></div>
            <div><label className="label">Ville / Adresse</label><input className="input" value={form.contact_address} onChange={f('contact_address')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Budget min ($)</label><input className="input" type="number" value={form.budget_min} onChange={f('budget_min')} /></div>
            <div><label className="label">Budget max ($)</label><input className="input" type="number" value={form.budget_max} onChange={f('budget_max')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type de travail</label>
              <select className="input" value={form.type_of_work} onChange={f('type_of_work')}>
                {WORK_TYPES.map(t => <option key={t} value={t}>{WL[t]}</option>)}
              </select>
            </div>
            <div><label className="label">Source</label>
              <select className="input" value={form.source} onChange={f('source')}>
                <option value="manual">Manuel</option>
                <option value="referral">Référence</option>
                <option value="facebook_ads">Facebook Ads</option>
                <option value="google_lsa">Google LSA</option>
                <option value="soumissions_reno">SoumissionsRéno</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Courriel</option>
              </select>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.description} onChange={f('description')} /></div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} {lead ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuoteModal({ lead, format, onClose, onSave }) {
  const [form, setForm] = useState({ title: lead?.title || '', items: [{ name:'', qty:1, unit:'un.', unit_price:'' }] });
  const [saving, setSaving] = useState(false);
  const isField = format === 'field_estimate';

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name:'', qty:1, unit:'un.', unit_price:'' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx !== i) }));
  const setItem = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((it,idx) => idx===i ? {...it,[k]:v} : it) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = isField ? [] : form.items.map(it => ({ ...it, qty: Number(it.qty)||1, unit_price: Number(it.unit_price)||0 }));
      const payload = { lead_id: lead.id, title: form.title, format, items };
      if (!isField) {
        payload.budget_min = form.budget_min || null;
        payload.budget_max = form.budget_max || null;
      }
      const { data } = await quotesApi.create(payload);
      onSave(data);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-1">{isField ? 'Formulaire de terrain' : 'Devis détaillé'}</h2>
        <p className="text-xs text-gray-400 mb-4">Lead : {lead?.title}</p>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required /></div>
          {isField ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Budget min ($)</label><input className="input" type="number" value={form.budget_min||''} onChange={e=>setForm(f=>({...f,budget_min:e.target.value}))} /></div>
              <div><label className="label">Budget max ($)</label><input className="input" type="number" value={form.budget_max||''} onChange={e=>setForm(f=>({...f,budget_max:e.target.value}))} /></div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Lignes de devis</label>
                <button type="button" className="btn-ghost text-xs py-0.5 px-2" onClick={addItem}><Plus size={12}/> Ajouter</button>
              </div>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                    <input className="input col-span-5 text-xs" placeholder="Description" value={it.name} onChange={e=>setItem(i,'name',e.target.value)} />
                    <input className="input col-span-2 text-xs" placeholder="Qté" type="number" value={it.qty} onChange={e=>setItem(i,'qty',e.target.value)} />
                    <input className="input col-span-3 text-xs" placeholder="Prix unit." type="number" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} />
                    <button type="button" className="col-span-1 text-gray-300 hover:text-red-400" onClick={()=>removeItem(i)}><Trash2 size={13}/></button>
                    <span className="col-span-1 text-xs text-gray-400 text-right">{((it.qty||1)*(it.unit_price||0)).toFixed(0)}$</span>
                  </div>
                ))}
              </div>
              <p className="text-right text-xs font-semibold text-gray-700 mt-2">
                Sous-total : {form.items.reduce((s,it)=>s+(Number(it.qty)||1)*(Number(it.unit_price)||0),0).toLocaleString('fr-CA')}$
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [quoteModal, setQuoteModal] = useState(null); // { lead, format }
  const [converting, setConverting] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await leadsApi.list(filter ? { status: filter } : {}); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i => i.map(l => l.id === data.id ? { ...l, ...data } : l));
    else setItems(i => [data, ...i]);
    setEditLead(null);
    setShowNew(false);
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce lead ?')) return;
    await leadsApi.delete(id);
    setItems(i => i.filter(l => l.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const changeStatus = async (id, status) => {
    const { data } = await leadsApi.update(id, { status });
    setItems(i => i.map(l => l.id === id ? { ...l, ...data } : l));
  };

  const convertToProject = async (lead) => {
    // Find quotes for this lead
    const { data: qs } = await quotesApi.list();
    const signed = qs.find(q => q.lead_id === lead.id && q.status === 'signed');
    if (!signed) {
      alert('Aucune soumission signée pour ce lead. Créez un devis et marquez-le comme signé d\'abord.');
      return;
    }
    setConverting(lead.id);
    try {
      const { data } = await quotesApi.convert(signed.id);
      setItems(i => i.map(l => l.id === lead.id ? { ...l, status: 'won' } : l));
      navigate(`/projets`);
    } catch { alert('Erreur lors de la conversion'); } finally { setConverting(null); }
  };

  const handleQuoteSaved = () => {
    setQuoteModal(null);
    changeStatus(quoteModal.lead.id, 'quote_sent');
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={15}/> Nouveau lead</button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button className={`btn ${!filter?'btn-primary':'btn-secondary'} py-1 px-3 text-xs`} onClick={()=>setFilter('')}>Tous</button>
          {STATUSES.map(s => (
            <button key={s} className={`btn ${filter===s?'btn-primary':'btn-secondary'} py-1 px-3 text-xs`} onClick={()=>setFilter(s)}>{SL[s]}</button>
          ))}
        </div>

        {showNew && <LeadModal onClose={()=>setShowNew(false)} onSave={handleSave} />}
        {editLead && <LeadModal lead={editLead} onClose={()=>setEditLead(null)} onSave={handleSave} />}
        {quoteModal && <QuoteModal lead={quoteModal.lead} format={quoteModal.format} onClose={()=>setQuoteModal(null)} onSave={handleQuoteSaved} />}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun lead trouvé</div>
        ) : (
          <div className="space-y-2">
            {items.map(l => (
              <div key={l.id} className="card overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 text-sm truncate">{l.title || '(Sans titre)'}</p>
                      <span className={`badge ${SB[l.status]}`}>{SL[l.status]}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                      {l.contact_name && <span className="flex items-center gap-1"><User size={11}/>{l.contact_name}</span>}
                      {l.contact_phone && <span className="flex items-center gap-1"><Phone size={11}/>{l.contact_phone}</span>}
                      {(l.budget_min||l.budget_max) && (
                        <span>{l.budget_min?`${Number(l.budget_min).toLocaleString('fr-CA')}$`:''}{l.budget_max?` – ${Number(l.budget_max).toLocaleString('fr-CA')}$`:''}</span>
                      )}
                      {l.type_of_work && l.type_of_work !== 'other' && <span className="capitalize">{WL[l.type_of_work]||l.type_of_work}</span>}
                    </div>
                  </div>
                  {expanded === l.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0"/>}
                </div>

                {/* Expanded panel */}
                {expanded === l.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {/* Contact info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                      {l.contact_name && <span className="flex items-center gap-1.5"><User size={12} className="text-gray-400"/>{l.contact_name}</span>}
                      {l.contact_phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/>{l.contact_phone}</span>}
                      {l.contact_email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/>{l.contact_email}</span>}
                      {l.city && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/>{l.city}</span>}
                    </div>
                    {l.description && <p className="text-xs text-gray-500 mb-4 italic">"{l.description}"</p>}

                    {/* Status changer */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-400">Statut :</span>
                      <select className="input w-44 text-xs py-1" value={l.status} onChange={e=>changeStatus(l.id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{SL[s]}</option>)}
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary text-xs py-1.5 gap-1.5"
                        onClick={() => setQuoteModal({ lead: l, format: 'field_estimate' })}
                      >
                        <ClipboardList size={13}/> Formulaire terrain
                      </button>
                      <button
                        className="btn-secondary text-xs py-1.5 gap-1.5"
                        onClick={() => setQuoteModal({ lead: l, format: 'pdf' })}
                      >
                        <FileText size={13}/> Devis détaillé
                      </button>
                      {(l.status === 'won' || l.status === 'quote_sent') && (
                        <button
                          className="btn-primary text-xs py-1.5 gap-1.5"
                          onClick={() => convertToProject(l)}
                          disabled={converting === l.id}
                        >
                          {converting === l.id ? <Loader2 size={13} className="animate-spin"/> : <FolderKanban size={13}/>}
                          Convertir en projet
                        </button>
                      )}
                      <div className="ml-auto flex gap-1.5">
                        <button className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500" onClick={()=>setEditLead(l)}><Pencil size={14}/></button>
                        <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" onClick={()=>del(l.id)}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
