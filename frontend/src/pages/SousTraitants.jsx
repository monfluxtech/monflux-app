import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { subcontractors as subsApi, rfqs as rfqsApi, projects as projectsApi } from '../api';
import { useToast } from '../components/Toast';
import { Plus, Loader2, HardHat, Star, Phone, Mail, Pencil, Trash2, MessageCircle, Send, Link2, DollarSign, CheckCircle, Clock, X } from 'lucide-react';

const PAY_STATUS = {
  pending: 'En attente',
  paid: 'Payé',
  cancelled: 'Annulé',
};
const PAY_BADGE = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  cancelled: 'badge-gray',
};

function PaymentsPanel({ sub, projects, onClose }) {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project_id: '', amount: '', description: '', payment_date: '', payment_method: 'virement', status: 'pending', invoice_ref: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await subsApi.payments(sub.id);
      setPayments(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [sub.id]);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      const { data } = await subsApi.addPayment(sub.id, { ...form, amount: Number(form.amount), project_id: form.project_id || null });
      setPayments(p => [data, ...p]);
      setForm({ project_id: '', amount: '', description: '', payment_date: '', payment_method: 'virement', status: 'pending', invoice_ref: '' });
      setShowForm(false);
      toast('Paiement enregistré', 'success');
    } catch {} finally { setSaving(false); }
  };

  const markPaid = async (p) => {
    try {
      const { data } = await subsApi.updatePayment(sub.id, p.id, { status: 'paid', payment_date: p.payment_date || new Date().toISOString().slice(0,10) });
      setPayments(ps => ps.map(x => x.id === data.id ? data : x));
      toast('Marqué comme payé', 'success');
    } catch {}
  };

  const del = async (pid) => {
    if (!confirm('Supprimer ce paiement ?')) return;
    await subsApi.deletePayment(sub.id, pid);
    setPayments(ps => ps.filter(p => p.id !== pid));
  };

  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Paiements — {sub.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalPending > 0 && <span className="text-orange-500 mr-2">À payer : {totalPending.toLocaleString('fr-CA')}$</span>}
              Payé total : {totalPaid.toLocaleString('fr-CA')}$
            </p>
          </div>
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-gray-600" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
          ) : (
            <>
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900">{Number(p.amount).toLocaleString('fr-CA')}$</p>
                      <span className={`badge ${PAY_BADGE[p.status]}`}>{PAY_STATUS[p.status]}</span>
                    </div>
                    {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {p.project_name && <span>{p.project_name}</span>}
                      {p.payment_date && <span className="ml-auto">{new Date(p.payment_date).toLocaleDateString('fr-CA')}</span>}
                    </div>
                  </div>
                  {p.status === 'pending' && (
                    <button className="btn-ghost p-1 text-gray-400 hover:text-green-600" title="Marquer payé" onClick={() => markPaid(p)}>
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button className="btn-ghost p-1 text-gray-400 hover:text-red-500" onClick={() => del(p.id)}><Trash2 size={13} /></button>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <DollarSign size={28} className="text-gray-200 mx-auto mb-2" />
                  Aucun paiement enregistré
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-4 border-t border-gray-100">
          {showForm ? (
            <form onSubmit={submit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Montant ($) *</label>
                  <input className="input" type="number" step="0.01" min="0.01" value={form.amount} onChange={f('amount')} required autoFocus />
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select className="input" value={form.status} onChange={f('status')}>
                    <option value="pending">En attente</option>
                    <option value="paid">Payé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={f('description')} placeholder="Ex: Électricité phase 1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Projet</label>
                  <select className="input" value={form.project_id} onChange={f('project_id')}>
                    <option value="">— Aucun —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={form.payment_date} onChange={f('payment_date')} />
                </div>
              </div>
              <div>
                <label className="label">Réf. facture</label>
                <input className="input" value={form.invoice_ref} onChange={f('invoice_ref')} placeholder="FAC-001" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving && <Loader2 size={13} className="animate-spin" />} Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <button className="btn-primary w-full" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Nouveau paiement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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

function RFQModal({ sub, projects, onClose }) {
  const [form, setForm] = useState({ project_id:'', title:'', description:'', specialty: Array.isArray(sub.specialties)?sub.specialties[0]||'':sub.specialties||'', deadline:'' });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: rfq } = await rfqsApi.create({ ...form, project_id: form.project_id||null });
      await rfqsApi.invite(rfq.id, [sub.id]);
      setSent(true);
    } catch {} finally { setSaving(false); }
  };

  if (sent) return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Send size={20} className="text-green-600" />
        </div>
        <p className="font-semibold text-gray-900 mb-1">Demande envoyée!</p>
        <p className="text-sm text-gray-400 mb-4">La demande de prix a été créée pour {sub.name}.</p>
        {sub.whatsapp && (
          <a
            href={`https://wa.me/${sub.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Bonjour ${sub.name},\n\nNous aimerions obtenir votre prix pour : ${form.title}.\n\n${form.description}\n\nMerci!`)}`}
            target="_blank" rel="noreferrer"
            className="btn-primary inline-flex items-center gap-2 mb-3"
          >
            <MessageCircle size={14}/> Envoyer sur WhatsApp
          </a>
        )}
        <br/>
        <button className="btn-ghost text-sm mt-2" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-semibold text-gray-900 mb-1">Demande de prix</h2>
        <p className="text-xs text-gray-400 mb-4">Pour : {sub.name}</p>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Titre de la demande *</label><input className="input" value={form.title} onChange={f('title')} required placeholder="Électricité phase 1 — Cuisine…" /></div>
          <div><label className="label">Projet lié</label>
            <select className="input" value={form.project_id} onChange={f('project_id')}>
              <option value="">— Aucun —</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="label">Description / Portée des travaux</label><textarea className="input" rows={3} value={form.description} onChange={f('description')} placeholder="Détails des travaux demandés…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Spécialité</label><input className="input" value={form.specialty} onChange={f('specialty')} /></div>
            <div><label className="label">Date limite</label><input className="input" type="date" value={form.deadline} onChange={f('deadline')} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SousTraitants() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [rfqSub, setRfqSub] = useState(null);
  const [paymentsSub, setPaymentsSub] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: subs }, { data: projs }] = await Promise.all([subsApi.list(), projectsApi.list()]);
      setItems(subs);
      setProjects(projs);
    } catch {} finally { setLoading(false); }
  };

  const copyPortalLink = async (s) => {
    try {
      const { data } = await subsApi.portal(s.id);
      const url = `${window.location.origin}/sous-traitant/${data.portal_token}`;
      await navigator.clipboard.writeText(url);
      toast('Lien portail copié !', 'success');
    } catch {
      toast('Erreur lors de la génération du lien', 'error');
    }
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
        {rfqSub && <RFQModal sub={rfqSub} projects={projects} onClose={()=>setRfqSub(null)} />}
        {paymentsSub && <PaymentsPanel sub={paymentsSub} projects={projects} onClose={()=>setPaymentsSub(null)} />}

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
                <div className="flex gap-2 text-xs text-gray-400 flex-wrap mb-2">
                  {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-green-600"><Phone size={11}/>{s.phone}</a>}
                  {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-brand truncate"><Mail size={11}/>{s.email}</a>}
                  {s.hourly_rate && <span className="ml-auto font-medium text-gray-700">{s.hourly_rate}$/h</span>}
                </div>
                {s.rbq_number && <p className="text-xs text-gray-300 mb-2">RBQ : {s.rbq_number}</p>}
                <div className="flex gap-1.5 pt-1 border-t border-gray-50 flex-wrap">
                  {s.whatsapp && (
                    <a
                      href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`}
                      target="_blank" rel="noreferrer"
                      className="btn-ghost text-xs py-1 px-2 text-green-600 hover:bg-green-50 flex items-center gap-1"
                    >
                      <MessageCircle size={12}/> WhatsApp
                    </a>
                  )}
                  <button
                    className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-gray-500"
                    onClick={() => setPaymentsSub(s)}
                    title="Gérer les paiements"
                  >
                    <DollarSign size={12}/> Paiements
                  </button>
                  <button
                    className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-purple-500 hover:bg-purple-50"
                    onClick={() => copyPortalLink(s)}
                    title="Copier le lien du portail fournisseur"
                  >
                    <Link2 size={12}/> Portail
                  </button>
                  <button
                    className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 ml-auto"
                    onClick={()=>setRfqSub(s)}
                  >
                    <Send size={12}/> Demande de prix
                  </button>
                </div>
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
