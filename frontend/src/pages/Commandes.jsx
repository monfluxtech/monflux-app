import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SlideOver from '../components/SlideOver';
import { materialOrders as ordersApi, projects as projectsApi } from '../api';
import { useToast } from '../components/Toast';
import {
  Plus, Loader2, ShoppingCart, Check, Package, Clock, Truck, XCircle, Trash2, Pencil,
} from 'lucide-react';

const STATUS = {
  pending:  { label: 'En attente',  badge: 'badge-gray',   icon: <Clock    size={12} /> },
  ordered:  { label: 'Commandé',    badge: 'badge-blue',   icon: <ShoppingCart size={12} /> },
  shipped:  { label: 'En transit',  badge: 'badge-yellow', icon: <Truck    size={12} /> },
  received: { label: 'Reçu',        badge: 'badge-green',  icon: <Check    size={12} /> },
  cancelled:{ label: 'Annulé',      badge: 'badge-red',    icon: <XCircle  size={12} /> },
};

const money = (v) => v ? `${Number(v).toLocaleString('fr-CA', { maximumFractionDigits: 0 })} $` : '—';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
}

function CreateModal({ projects, onClose, onSave }) {
  const [form, setForm] = useState({
    project_id: '', supplier: '', description: '',
    order_number: '', total_amount: '', order_date: '', expected_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await ordersApi.create({
        project_id:     form.project_id || null,
        supplier:       form.supplier,
        description:    form.description || null,
        order_number:   form.order_number || null,
        total_amount:   form.total_amount ? parseFloat(form.total_amount) : null,
        order_date:     form.order_date || null,
        expected_date:  form.expected_date || null,
        notes:          form.notes || null,
      });
      onSave(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      title="Nouvelle commande"
      subtitle="Matériaux, équipements ou location"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" form="create-order-form" className="btn-primary flex-1" disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />} Créer
          </button>
        </div>
      }
    >
      <form id="create-order-form" onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Fournisseur *</label>
          <input className="input" required value={form.supplier} onChange={f('supplier')} placeholder="Rona, Home Depot, Canac…" />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={f('description')} placeholder="2×6 16 pi, clous galvanisés…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">N° commande</label>
            <input className="input" value={form.order_number} onChange={f('order_number')} placeholder="PO-2026-001" />
          </div>
          <div>
            <label className="label">Montant ($)</label>
            <input className="input" type="number" step="0.01" value={form.total_amount} onChange={f('total_amount')} placeholder="1 250,00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date commande</label>
            <input className="input" type="date" value={form.order_date} onChange={f('order_date')} />
          </div>
          <div>
            <label className="label">Livraison prévue</label>
            <input className="input" type="date" value={form.expected_date} onChange={f('expected_date')} />
          </div>
        </div>
        <div>
          <label className="label">Projet lié</label>
          <select className="input" value={form.project_id} onChange={f('project_id')}>
            <option value="">Aucun projet</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={f('notes')} placeholder="Instructions de livraison, contact…" />
        </div>
      </form>
    </SlideOver>
  );
}

export default function Commandes() {
  const [list, setList]         = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();

  useEffect(() => {
    load();
    projectsApi.list().then(r => setProjects(r.data || [])).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await ordersApi.list();
      setList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const { data } = await ordersApi.update(id, { status });
      setList(l => l.map(o => o.id === id ? { ...o, ...data } : o));
      toast.success(`Statut → ${STATUS[status]?.label}`);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette commande ?')) return;
    try {
      await ordersApi.delete(id);
      setList(l => l.filter(o => o.id !== id));
      toast.success('Commande supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  const filtered = statusFilter === 'all'
    ? list
    : list.filter(o => o.status === statusFilter);

  const totalPending = list
    .filter(o => ['pending','ordered','shipped'].includes(o.status))
    .reduce((s, o) => s + (Number(o.total_amount) || 0), 0);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Commandes de matériaux</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {list.length} commande{list.length !== 1 ? 's' : ''} · {money(totalPending)} en attente
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nouvelle commande
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {[['all', 'Toutes', list.length], ...Object.entries(STATUS).map(([k, v]) => [k, v.label, list.filter(o => o.status === k).length])].map(([k, label, count]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={[
                'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                statusFilter === k
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand/50 hover:text-brand',
              ].join(' ')}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Package size={32} className="text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700 mb-1">Aucune commande</p>
            <p className="text-sm text-gray-400 mb-4">Suivez vos commandes de matériaux et leur statut de livraison.</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Créer une commande
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(o => {
              const st = STATUS[o.status] || STATUS.pending;
              const projectName = projects.find(p => p.id === o.project_id)?.name || o.project_name;
              const nextStatuses = {
                pending:  ['ordered', 'cancelled'],
                ordered:  ['shipped', 'received', 'cancelled'],
                shipped:  ['received', 'cancelled'],
                received: [],
                cancelled:[],
              }[o.status] || [];

              return (
                <div key={o.id} className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={18} className="text-brand" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-gray-900">{o.supplier}</span>
                        <span className={`badge ${st.badge} gap-1`}>{st.icon} {st.label}</span>
                        {o.order_number && <span className="text-xs text-gray-400">#{o.order_number}</span>}
                      </div>
                      {o.description && <p className="text-sm text-gray-600 mb-0.5">{o.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        {projectName && <span>📁 {projectName}</span>}
                        {o.order_date && <span>Commandé {fmtDate(o.order_date)}</span>}
                        {o.expected_date && <span>Livraison prévue {fmtDate(o.expected_date)}</span>}
                        {o.received_date && <span>✅ Reçu {fmtDate(o.received_date)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {o.total_amount && (
                        <span className="text-sm font-bold text-gray-900">{money(o.total_amount)}</span>
                      )}

                      {/* Quick status update */}
                      {nextStatuses.length > 0 && (
                        <div className="flex gap-1">
                          {nextStatuses.map(ns => (
                            <button
                              key={ns}
                              onClick={() => updateStatus(o.id, ns)}
                              className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${
                                ns === 'received' ? 'border-green-200 text-green-700 hover:bg-green-50' :
                                ns === 'cancelled' ? 'border-red-200 text-red-600 hover:bg-red-50' :
                                'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {STATUS[ns]?.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleDelete(o.id)}
                        className="btn-ghost py-1.5 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          projects={projects}
          onClose={() => setShowCreate(false)}
          onSave={(o) => {
            setList(l => [o, ...l]);
            setShowCreate(false);
            toast.success('Commande créée !');
          }}
        />
      )}
    </Layout>
  );
}
