import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { leads as leadsApi, quotes as quotesApi } from '../api';
import { Plus, Loader2, Phone, Mail, Pencil, Trash2, FileText, ClipboardList, FolderKanban, Bell, BellOff } from 'lucide-react';

const COLS = [
  { key:'new',         label:'Nouveau',           color:'#3b82f6' },
  { key:'contacted',   label:'Contacté',           color:'#f59e0b' },
  { key:'quote_sent',  label:'Soumission envoyée', color:'#F26522' },
  { key:'won',         label:'Gagné',              color:'#22c55e' },
  { key:'lost',        label:'Perdu',              color:'#9ca3af' },
];
const WL = { residential:'Résidentiel', commercial:'Commercial', industrial:'Industriel', renovation:'Rénovation', roofing:'Toiture', concrete:'Béton', other:'Autre' };
const EMPTY_FORM = { title:'', contact_name:'', contact_phone:'', contact_email:'', contact_address:'', source:'manual', type_of_work:'other', budget_min:'', budget_max:'', description:'' };

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead ? {
    title:lead.title||'', contact_name:lead.contact_name||'', contact_phone:lead.contact_phone||'',
    contact_email:lead.contact_email||'', contact_address:lead.city||'', source:lead.source||'manual',
    type_of_work:lead.type_of_work||'other', budget_min:lead.budget_min||'', budget_max:lead.budget_max||'', description:lead.description||''
  } : {...EMPTY_FORM});
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {...form, budget_min:form.budget_min||null, budget_max:form.budget_max||null};
      const {data} = lead ? await leadsApi.update(lead.id, payload) : await leadsApi.create(payload);
      onSave(data, !!lead);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-4">{lead ? 'Modifier' : 'Nouveau lead'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre du projet *</label><input className="input" value={form.title} onChange={f('title')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nom du client</label><input className="input" value={form.contact_name} onChange={f('contact_name')} /></div>
            <div><label className="label">Téléphone</label><input className="input" type="tel" value={form.contact_phone} onChange={f('contact_phone')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Courriel</label><input className="input" type="email" value={form.contact_email} onChange={f('contact_email')} /></div>
            <div><label className="label">Ville</label><input className="input" value={form.contact_address} onChange={f('contact_address')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Budget min ($)</label><input className="input" type="number" value={form.budget_min} onChange={f('budget_min')} /></div>
            <div><label className="label">Budget max ($)</label><input className="input" type="number" value={form.budget_max} onChange={f('budget_max')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type de travail</label>
              <select className="input" value={form.type_of_work} onChange={f('type_of_work')}>
                {Object.entries(WL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label">Source</label>
              <select className="input" value={form.source} onChange={f('source')}>
                <option value="manual">Manuel</option><option value="referral">Référence</option>
                <option value="facebook_ads">Facebook Ads</option><option value="google_lsa">Google LSA</option>
                <option value="soumissions_reno">SoumissionsRéno</option><option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.description} onChange={f('description')}/></div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving&&<Loader2 size={14} className="animate-spin"/>} {lead?'Enregistrer':'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuoteModal({ lead, format, onClose, onDone }) {
  const [form, setForm] = useState({ title: lead?.title||'', budget_min:'', budget_max:'', items:[{name:'',qty:1,unit_price:''}] });
  const [saving, setSaving] = useState(false);
  const isField = format === 'field_estimate';

  const setItem = (i,k,v) => setForm(p=>({...p,items:p.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
  const addItem = () => setForm(p=>({...p,items:[...p.items,{name:'',qty:1,unit_price:''}]}));
  const removeItem = i => setForm(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await quotesApi.create({ lead_id:lead.id, title:form.title, format,
        budget_min:form.budget_min||null, budget_max:form.budget_max||null,
        items: isField ? [] : form.items.map(it=>({...it,qty:Number(it.qty)||1,unit_price:Number(it.unit_price)||0}))
      });
      await leadsApi.update(lead.id, { status:'quote_sent' });
      onDone();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-gray-900 mb-1">{isField?'Formulaire terrain':'Devis détaillé'}</h2>
        <p className="text-xs text-gray-400 mb-4">{lead.title}</p>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre</label><input className="input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} required/></div>
          {isField ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Budget min ($)</label><input className="input" type="number" value={form.budget_min} onChange={e=>setForm(p=>({...p,budget_min:e.target.value}))}/></div>
              <div><label className="label">Budget max ($)</label><input className="input" type="number" value={form.budget_max} onChange={e=>setForm(p=>({...p,budget_max:e.target.value}))}/></div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-2"><label className="label mb-0">Lignes</label><button type="button" className="btn-ghost text-xs py-0.5 px-2" onClick={addItem}><Plus size={12}/></button></div>
              {form.items.map((it,i)=>(
                <div key={i} className="grid grid-cols-12 gap-1.5 mb-1.5 items-center">
                  <input className="input col-span-5 text-xs" placeholder="Description" value={it.name} onChange={e=>setItem(i,'name',e.target.value)}/>
                  <input className="input col-span-2 text-xs" placeholder="Qté" type="number" value={it.qty} onChange={e=>setItem(i,'qty',e.target.value)}/>
                  <input className="input col-span-3 text-xs" placeholder="Prix" type="number" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)}/>
                  <button type="button" className="col-span-1 text-gray-300 hover:text-red-400" onClick={()=>removeItem(i)}><Trash2 size={13}/></button>
                  <span className="col-span-1 text-xs text-right text-gray-400">{((it.qty||1)*(it.unit_price||0)).toFixed(0)}$</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving&&<Loader2 size={14} className="animate-spin"/>} Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadCard({ lead, onEdit, onDelete, onQuote, onTerrain, onConvert, onFollowup, dragStart }) {
  const [converting, setConverting] = useState(false);

  const doConvert = async () => {
    setConverting(true);
    try { await onConvert(lead); } finally { setConverting(false); }
  };

  const followUpDate = lead.follow_up_at ? new Date(lead.follow_up_at) : null;
  const followUpOverdue = followUpDate && followUpDate < new Date();
  const followUpToday = followUpDate && followUpDate.toDateString() === new Date().toDateString();

  return (
    <div
      className={`card p-3 cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow ${followUpOverdue ? 'ring-2 ring-orange-300' : ''}`}
      draggable
      onDragStart={e => dragStart(e, lead.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{lead.title}</p>
        <div className="flex gap-0.5 flex-shrink-0">
          <button className="p-1 text-gray-300 hover:text-orange-500 rounded" title="Rappel" onClick={e=>{e.stopPropagation();onFollowup(lead);}}>
            <Bell size={11} className={followUpDate ? 'text-orange-400' : ''}/>
          </button>
          <button className="p-1 text-gray-300 hover:text-blue-500 rounded" onClick={e=>{e.stopPropagation();onEdit(lead)}}><Pencil size={11}/></button>
          <button className="p-1 text-gray-300 hover:text-red-500 rounded" onClick={e=>{e.stopPropagation();onDelete(lead.id)}}><Trash2 size={11}/></button>
        </div>
      </div>
      {lead.contact_name && <p className="text-xs text-gray-500 mb-1">{lead.contact_name}</p>}
      {lead.contact_phone && (
        <a href={`tel:${lead.contact_phone}`} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mb-1.5" onClick={e=>e.stopPropagation()}>
          <Phone size={11}/>{lead.contact_phone}
        </a>
      )}
      {(lead.budget_min||lead.budget_max) && (
        <p className="text-xs text-gray-400 mb-1.5">
          {lead.budget_min?`${Number(lead.budget_min).toLocaleString('fr-CA')}$`:''}
          {lead.budget_max?` – ${Number(lead.budget_max).toLocaleString('fr-CA')}$`:''}
        </p>
      )}
      {followUpDate && (
        <p className={`text-xs flex items-center gap-1 mb-1.5 font-medium ${followUpOverdue?'text-red-500':followUpToday?'text-orange-500':'text-gray-400'}`}>
          <Bell size={10}/>
          {followUpOverdue?'Rappel en retard':'Rappel'} : {followUpDate.toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}
        </p>
      )}
      <div className="flex gap-1 mt-2 flex-wrap">
        <button className="btn-ghost text-xs py-0.5 px-1.5 gap-1" onClick={e=>{e.stopPropagation();onTerrain(lead)}}><ClipboardList size={11}/>Terrain</button>
        <button className="btn-ghost text-xs py-0.5 px-1.5 gap-1" onClick={e=>{e.stopPropagation();onQuote(lead)}}><FileText size={11}/>Devis</button>
        {lead.status === 'won' && (
          <button className="btn-ghost text-xs py-0.5 px-1.5 gap-1 text-green-600" onClick={e=>{e.stopPropagation();doConvert();}} disabled={converting}>
            {converting?<Loader2 size={11} className="animate-spin"/>:<FolderKanban size={11}/>}Convertir
          </button>
        )}
      </div>
    </div>
  );
}

export default function Leads() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [editLead, setEditLead] = useState(null);
  const [quoteModal, setQuoteModal] = useState(null);
  const [followupLead, setFollowupLead] = useState(null);
  const [followupDate, setFollowupDate] = useState('');
  const [dragOver, setDragOver] = useState(null);
  const dragId = useRef(null);

  const load = async () => {
    setLoading(true);
    try { const {data} = await leadsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i=>i.map(l=>l.id===data.id?{...l,...data}:l));
    else setItems(i=>[data,...i]);
    setShowNew(false); setEditLead(null);
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce lead ?')) return;
    await leadsApi.delete(id);
    setItems(i=>i.filter(l=>l.id!==id));
  };

  const changeStatus = async (id, status) => {
    await leadsApi.update(id, {status});
    setItems(i=>i.map(l=>l.id===id?{...l,status}:l));
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const id = dragId.current;
    if (id) changeStatus(id, status);
    setDragOver(null); dragId.current = null;
  };

  const convertToProject = async (lead) => {
    const {data:qs} = await quotesApi.list();
    const signed = qs.find(q=>q.lead_id===lead.id && q.status==='signed');
    if (!signed) { alert('Aucune soumission signée pour ce lead. Marquez une soumission comme signée d\'abord.'); return; }
    await quotesApi.convert(signed.id);
    setItems(i=>i.map(l=>l.id===lead.id?{...l,status:'won'}:l));
    navigate('/projets');
  };

  const saveFollowup = async () => {
    if (!followupLead) return;
    const val = followupDate ? new Date(followupDate).toISOString() : null;
    await leadsApi.update(followupLead.id, { follow_up_at: val });
    setItems(i => i.map(l => l.id === followupLead.id ? { ...l, follow_up_at: val } : l));
    setFollowupLead(null);
  };

  const byStatus = (status) => items.filter(l=>l.status===status);

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div></Layout>;

  return (
    <Layout>
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={14}/> Nouveau lead</button>
        </div>

        {/* Follow-up alerts */}
        {(() => {
          const due = items.filter(l => l.follow_up_at && new Date(l.follow_up_at) <= new Date() && !['won','lost'].includes(l.status));
          if (!due.length) return null;
          return (
            <div className="mb-3 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
              <Bell size={14} className="text-orange-500 flex-shrink-0"/>
              <p className="text-xs font-medium text-orange-700 flex-1">
                {due.length} rappel{due.length>1?'s':''} en attente : {due.slice(0,2).map(l=>l.title).join(', ')}{due.length>2?'…':''}
              </p>
            </div>
          );
        })()}

        {showNew && <LeadModal onClose={()=>setShowNew(false)} onSave={handleSave}/>}
        {editLead && <LeadModal lead={editLead} onClose={()=>setEditLead(null)} onSave={handleSave}/>}
        {followupLead && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-xs">
              <h2 className="font-semibold text-gray-900 mb-1 text-sm">Rappel pour</h2>
              <p className="text-xs text-gray-400 mb-3 truncate">{followupLead.title}</p>
              <input className="input mb-3" type="date" value={followupDate} onChange={e=>setFollowupDate(e.target.value)}/>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm" onClick={()=>setFollowupLead(null)}>Annuler</button>
                {followupLead.follow_up_at && <button className="btn-ghost flex-1 text-sm text-red-500" onClick={async()=>{await leadsApi.update(followupLead.id,{follow_up_at:null});setItems(i=>i.map(l=>l.id===followupLead.id?{...l,follow_up_at:null}:l));setFollowupLead(null);}}>Supprimer</button>}
                <button className="btn-primary flex-1 text-sm" onClick={saveFollowup}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
        {quoteModal && (
          <QuoteModal
            lead={quoteModal.lead} format={quoteModal.format}
            onClose={()=>setQuoteModal(null)}
            onDone={()=>{setQuoteModal(null);load();}}
          />
        )}

        {/* Kanban */}
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {COLS.map(col => {
            const colLeads = byStatus(col.key);
            const isOver = dragOver === col.key;
            return (
              <div
                key={col.key}
                className="flex-shrink-0 w-64 flex flex-col"
                onDragOver={e=>{e.preventDefault();setDragOver(col.key);}}
                onDragLeave={()=>setDragOver(null)}
                onDrop={e=>handleDrop(e,col.key)}
              >
                {/* Column header */}
                <div
                  className="flex items-center gap-2 mb-2 px-1"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:col.color}}/>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{col.label}</span>
                  <span className="text-xs text-gray-400 ml-auto bg-gray-100 rounded-full px-1.5 py-0.5">{colLeads.length}</span>
                </div>

                {/* Drop zone */}
                <div
                  className={`flex-1 rounded-xl min-h-32 transition-colors p-1 space-y-2 ${isOver ? 'bg-orange-50 ring-2 ring-brand ring-dashed' : 'bg-gray-50'}`}
                >
                  {/* Quick-add in "Nouveau" column */}
                  {col.key === 'new' && (
                    <button
                      className="w-full border-2 border-dashed border-gray-200 hover:border-brand rounded-lg py-2 text-xs text-gray-400 hover:text-brand transition-colors flex items-center justify-center gap-1"
                      onClick={()=>setShowNew(true)}
                    >
                      <Plus size={12}/> Ajouter
                    </button>
                  )}
                  {colLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onEdit={setEditLead}
                      onDelete={del}
                      onQuote={l=>setQuoteModal({lead:l,format:'pdf'})}
                      onTerrain={l=>setQuoteModal({lead:l,format:'field_estimate'})}
                      onConvert={convertToProject}
                      onFollowup={l=>{setFollowupLead(l);setFollowupDate(l.follow_up_at?l.follow_up_at.slice(0,10):'');}}
                      dragStart={(e,id)=>{dragId.current=id; e.dataTransfer.effectAllowed='move';}}
                    />
                  ))}
                  {colLeads.length === 0 && col.key !== 'new' && (
                    <p className="text-xs text-gray-300 text-center py-4">Glissez ici</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
