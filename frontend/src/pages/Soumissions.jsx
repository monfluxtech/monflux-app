import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SlideOver from '../components/SlideOver';
import { quotes as quotesApi, leads as leadsApi, pdf as pdfApi, ai as aiApi, email as emailApi } from '../api';
import { useToast } from '../components/Toast';
import { Plus, Loader2, FileText, ClipboardList, Pencil, Trash2, FolderKanban, ExternalLink, Download, Sparkles, Mail, Link2, MessageCircle } from 'lucide-react';

const SL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', signed:'Signée', expired:'Expirée', rejected:'Refusée', converted:'Convertie' };
const SB = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', signed:'badge-green', expired:'badge-gray', rejected:'badge-red', converted:'badge-orange' };
const STATUSES = ['draft','sent','viewed','signed','rejected','expired'];

function CreateModal({ leads, onClose, onSave, initialTitle = '', initialLeadId = '' }) {
  const [form, setForm] = useState({ lead_id: initialLeadId, title: initialTitle, format:'pdf', items:[{name:'',qty:1,unit:'un.',unit_price:''}] });
  const [saving, setSaving] = useState(false);
  const [aiDesc, setAiDesc] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const isField = form.format === 'field_estimate';
  const f = k => e => setForm(p => ({...p,[k]:e.target.value}));

  const addItem = () => setForm(p=>({...p,items:[...p.items,{name:'',qty:1,unit:'un.',unit_price:''}]}));
  const removeItem = i => setForm(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));
  const setItem = (i,k,v) => setForm(p=>({...p,items:p.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));

  const runAI = async () => {
    if (!aiDesc.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await aiApi.estimate({ description: aiDesc, project_type: 'residential' });
      if (data.items?.length) {
        const mapped = data.items.map(it => ({
          name: it.name,
          qty: it.qty || 1,
          unit: it.unit || 'un.',
          unit_price: it.unit_price_estimate || 0,
        }));
        setForm(p => ({ ...p, items: mapped }));
        if (!form.title) setForm(p => ({ ...p, title: aiDesc.slice(0, 60) }));
      }
    } catch { alert('Erreur estimation IA. Vérifiez que ANTHROPIC_API_KEY est configuré.'); }
    finally { setAiLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = isField ? [] : form.items.map(it=>({...it,qty:Number(it.qty)||1,unit_price:Number(it.unit_price)||0}));
      const { data } = await quotesApi.create({ ...form, lead_id: form.lead_id||null, items });
      onSave(data);
    } catch {} finally { setSaving(false); }
  };

  const subtotal = form.items.reduce((s,it)=>s+(Number(it.qty)||1)*(Number(it.unit_price)||0),0);

  return (
    <SlideOver
      title="Nouvelle soumission"
      subtitle="Devis détaillé ou formulaire terrain"
      width="max-w-lg"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" form="create-quote-form" className="btn-primary flex-1" disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin"/>} Créer
          </button>
        </div>
      }
    >
      <form id="create-quote-form" onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre *</label><input className="input" value={form.title} onChange={f('title')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.format} onChange={f('format')}>
                <option value="field_estimate">Formulaire terrain</option>
                <option value="pdf">Devis détaillé</option>
              </select>
            </div>
            <div><label className="label">Lead lié</label>
              <select className="input" value={form.lead_id} onChange={f('lead_id')}>
                <option value="">— Aucun —</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          </div>

          {/* AI Estimation */}
          {!isField && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={13} className="text-brand" />
                <span className="text-xs font-semibold text-brand">Estimation IA — auto-remplir les lignes</span>
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="Ex: Rénovation cuisine 200 pi², armoires, comptoir, plomberie…"
                  value={aiDesc}
                  onChange={e => setAiDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), runAI())}
                />
                <button
                  type="button"
                  className="btn-primary flex-shrink-0 text-xs"
                  onClick={runAI}
                  disabled={aiLoading || !aiDesc.trim()}
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Générer
                </button>
              </div>
            </div>
          )}

          {isField ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Budget min ($)</label><input className="input" type="number" value={form.budget_min||''} onChange={f('budget_min')} /></div>
              <div><label className="label">Budget max ($)</label><input className="input" type="number" value={form.budget_max||''} onChange={f('budget_max')} /></div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Lignes</label>
                <button type="button" className="btn-ghost text-xs py-0.5 px-2" onClick={addItem}><Plus size={12}/> Ajouter</button>
              </div>
              <div className="space-y-2">
                {form.items.map((it,i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                    <input className="input col-span-5 text-xs" placeholder="Description" value={it.name} onChange={e=>setItem(i,'name',e.target.value)} />
                    <input className="input col-span-2 text-xs" placeholder="Qté" type="number" value={it.qty} onChange={e=>setItem(i,'qty',e.target.value)} />
                    <input className="input col-span-3 text-xs" placeholder="Prix" type="number" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} />
                    <button type="button" className="col-span-1 text-gray-300 hover:text-red-400" onClick={()=>removeItem(i)}><Trash2 size={13}/></button>
                    <span className="col-span-1 text-xs text-right text-gray-400">{((it.qty||1)*(it.unit_price||0)).toFixed(0)}$</span>
                  </div>
                ))}
              </div>
              {subtotal > 0 && (
                <p className="text-right text-xs font-semibold text-gray-700 mt-2">
                  Sous-total : {subtotal.toLocaleString('fr-CA')}$ + taxes
                </p>
              )}
            </div>
          )}
      </form>
    </SlideOver>
  );
}

function EditModal({ quote, onClose, onSave }) {
  const [status, setStatus] = useState(quote.status);
  const [title, setTitle] = useState(quote.title||'');
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the full quote (with line items) so details can be edited.
  useEffect(() => {
    quotesApi.get(quote.id)
      .then(({ data }) => setItems((data.items||[]).map(it => ({
        name: it.name||'', qty: it.qty||1, unit: it.unit||'un.', unit_price: Number(it.unit_price)||0,
        supplier: it.supplier||'', supplier_url: it.supplier_url||'',
      }))))
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  }, [quote.id]);

  const addItem = () => setItems(p => [...p, { name:'', qty:1, unit:'un.', unit_price:0 }]);
  const removeItem = i => setItems(p => p.filter((_,idx) => idx !== i));
  const setItem = (i,k,v) => setItems(p => p.map((it,idx) => idx===i ? { ...it, [k]:v } : it));
  const subtotal = items.reduce((s,it)=>s+(Number(it.qty)||1)*(Number(it.unit_price)||0),0);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { status, title };
      // Only send items if this quote actually has detailed lines
      if (items.length > 0) payload.items = items.map(it => ({ ...it, qty:Number(it.qty)||1, unit_price:Number(it.unit_price)||0 }));
      const { data } = await quotesApi.update(quote.id, payload);
      onSave(data);
    } catch {} finally { setSaving(false); }
  };

  return (
    <SlideOver
      title="Modifier la soumission"
      subtitle={title || undefined}
      width="max-w-lg"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" form="edit-quote-form" className="btn-primary flex-1" disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin"/>} Enregistrer
          </button>
        </div>
      }
    >
      <form id="edit-quote-form" onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div><label className="label">Statut</label>
            <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{SL[s]}</option>)}
            </select>
          </div>

          {/* Line items */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Lignes de la soumission</label>
              <button type="button" className="btn-ghost text-xs py-0.5 px-2" onClick={addItem}><Plus size={12}/> Ajouter</button>
            </div>
            {loadingItems ? (
              <div className="text-xs text-gray-400 flex items-center gap-1.5 py-2"><Loader2 size={12} className="animate-spin"/> Chargement des lignes…</div>
            ) : items.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Aucune ligne détaillée (soumission terrain). Cliquez « Ajouter » pour en créer.</p>
            ) : (
              <div className="space-y-2">
                {items.map((it,i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                    <input className="input col-span-5 text-sm py-1.5" placeholder="Description" value={it.name} onChange={e=>setItem(i,'name',e.target.value)} />
                    <input className="input col-span-2 text-sm py-1.5" type="number" placeholder="Qté" value={it.qty} onChange={e=>setItem(i,'qty',e.target.value)} />
                    <input className="input col-span-2 text-sm py-1.5" placeholder="Unité" value={it.unit} onChange={e=>setItem(i,'unit',e.target.value)} />
                    <input className="input col-span-2 text-sm py-1.5" type="number" step="0.01" placeholder="Prix" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} />
                    <button type="button" className="col-span-1 text-gray-300 hover:text-red-400" onClick={()=>removeItem(i)}><Trash2 size={13}/></button>
                  </div>
                ))}
                <div className="flex justify-end pt-1 text-sm font-semibold text-gray-700">
                  Sous-total : {subtotal.toLocaleString('fr-CA',{minimumFractionDigits:2})} $
                </div>
              </div>
            )}
          </div>

      </form>
    </SlideOver>
  );
}

export default function Soumissions() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [leadList, setLeadList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === '1');
  const initialTitle = searchParams.get('title') ? decodeURIComponent(searchParams.get('title')) : '';
  const initialLeadId = searchParams.get('lead_id') || '';
  const [editItem, setEditItem] = useState(null);
  const [converting, setConverting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: qs }, { data: ls }] = await Promise.all([quotesApi.list(), leadsApi.list()]);
      setItems(qs);
      setLeadList(ls);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = (data) => { setItems(i => [data, ...i]); setShowCreate(false); };
  const handleEdit = (data) => { setItems(i => i.map(q => q.id === data.id ? { ...q, ...data } : q)); setEditItem(null); };

  const del = async (id) => {
    if (!confirm('Supprimer cette soumission ?')) return;
    await quotesApi.delete(id);
    setItems(i => i.filter(q => q.id !== id));
  };

  const convert = async (quote) => {
    setConverting(quote.id);
    try {
      const { data } = await quotesApi.convert(quote.id);
      setItems(i => i.map(q => q.id === quote.id ? { ...q, status: 'converted' } : q));
      navigate('/projets');
    } catch { toast('Erreur lors de la conversion', 'error'); } finally { setConverting(null); }
  };

  const getLeadName = (lead_id) => leadList.find(l => l.id === lead_id)?.title || '';

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Soumissions</h1>
          <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15}/> Nouvelle soumission</button>
        </div>

        {showCreate && <CreateModal leads={leadList} onClose={()=>setShowCreate(false)} onSave={handleCreate} initialTitle={initialTitle} initialLeadId={initialLeadId} />}
        {editItem && <EditModal quote={editItem} onClose={()=>setEditItem(null)} onSave={handleEdit} />}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={36} className="text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-400 text-sm">Aucune soumission. Créez-en une ou passez par un lead.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(q => {
              const isField = q.format === 'field_estimate';
              const leadName = getLeadName(q.lead_id);
              return (
                <div key={q.id} className="card flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isField ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    {isField ? <ClipboardList size={14} className="text-orange-500"/> : <FileText size={14} className="text-blue-500"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-900 text-sm truncate">{q.title || 'Soumission'}</p>
                      <span className={`badge ${SB[q.status]}`}>{SL[q.status]}</span>
                      <span className="badge badge-gray text-xs">{isField ? 'Terrain' : 'Devis'}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {leadName && <span className="mr-2">Lead : {leadName}</span>}
                      {q.total > 0 && `${Number(q.total).toLocaleString('fr-CA')}$`}
                      {q.sent_at && ` · Envoyée le ${new Date(q.sent_at).toLocaleDateString('fr-CA')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {q.interactive_token && (
                      <>
                        <button
                          className="btn-ghost p-1.5 text-gray-400 hover:text-purple-500"
                          title="Copier le lien client"
                          onClick={() => {
                            const url = `${window.location.origin}/soumission/${q.interactive_token}`;
                            navigator.clipboard.writeText(url).then(() => toast('Lien copié !', 'success'));
                          }}
                        >
                          <Link2 size={13}/>
                        </button>
                        <a
                          className="btn-ghost p-1.5 text-gray-400 hover:text-green-600"
                          title="Envoyer par WhatsApp"
                          href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici votre soumission "${q.title||''}". Vous pouvez la consulter et l'accepter ici : ${window.location.origin}/soumission/${q.interactive_token}`)}`}
                          target="_blank" rel="noreferrer"
                        >
                          <MessageCircle size={13}/>
                        </a>
                      </>
                    )}
                    <button
                      className="btn-ghost p-1.5 text-gray-400 hover:text-brand"
                      title="Télécharger PDF"
                      onClick={() => { const tok = localStorage.getItem('token'); const url = pdfApi.quoteUrl(q.id); fetch(url,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.blob()).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`soumission-${q.id.slice(0,8)}.pdf`;a.click();}); }}
                    >
                      <Download size={13}/>
                    </button>
                    <button
                      className="btn-ghost p-1.5 text-gray-400 hover:text-green-600"
                      title="Envoyer par courriel"
                      onClick={() => { const to = prompt('Adresse courriel du client :'); if(to) emailApi.sendQuote(q.id,{to}).then(()=>toast(`Soumission envoyée à ${to}`, 'success')).catch(e=>toast(e.response?.data?.detail||'Erreur envoi — SMTP non configuré', 'error')); }}
                    >
                      <Mail size={13}/>
                    </button>
                    {q.status === 'signed' && (
                      <button
                        className="btn-primary text-xs py-1 px-2 gap-1"
                        onClick={() => convert(q)}
                        disabled={converting === q.id}
                        title="Créer le projet + acompte"
                      >
                        {converting === q.id ? <Loader2 size={12} className="animate-spin"/> : <FolderKanban size={12}/>}
                        Convertir
                      </button>
                    )}
                    {q.interactive_token && (
                      <a href={`/soumission/${q.interactive_token}`} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 text-gray-400">
                        <ExternalLink size={13}/>
                      </a>
                    )}
                    <button className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500" onClick={()=>setEditItem(q)}><Pencil size={14}/></button>
                    <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" onClick={()=>del(q.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
