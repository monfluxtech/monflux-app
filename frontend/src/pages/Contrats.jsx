import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SlideOver from '../components/SlideOver';
import { contracts as contractsApi, projects as projectsApi } from '../api';
import { useToast } from '../components/Toast';
import {
  Plus, Loader2, FileSignature, Send, Trash2, ExternalLink, Check,
  Clock, XCircle, FileEdit, Link2,
} from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

const STATUS = {
  draft:     { label: 'Brouillon', badge: 'badge-gray' },
  sent:      { label: 'Envoyé',    badge: 'badge-blue' },
  signed:    { label: 'Signé',     badge: 'badge-green' },
  cancelled: { label: 'Annulé',    badge: 'badge-red' },
};

const STATUS_ICON = {
  draft:     <FileEdit size={14} />,
  sent:      <Clock    size={14} />,
  signed:    <Check    size={14} />,
  cancelled: <XCircle  size={14} />,
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function CreateModal({ projects, onClose, onSave }) {
  const [form, setForm] = useState({ title: 'Contrat de services', project_id: '', content: '' });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await contractsApi.create({
        title: form.title,
        project_id: form.project_id || null,
        content: form.content || null,
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
      title="Nouveau contrat"
      subtitle="Créez un contrat lié à un projet et partagez le lien de signature"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" form="create-contract-form" className="btn-primary flex-1" disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />} Créer
          </button>
        </div>
      }
    >
      <form id="create-contract-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Titre du contrat *</label>
          <input className="input" value={form.title} onChange={f('title')} required placeholder="Contrat de services — Duplex Laurier" />
        </div>
        <div>
          <label className="label">Projet lié</label>
          <select className="input" value={form.project_id} onChange={f('project_id')}>
            <option value="">Aucun projet</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Contenu (optionnel)</label>
          <textarea
            className="input"
            rows={6}
            value={form.content}
            onChange={f('content')}
            placeholder="Les travaux comprennent... Paiement en 3 versements... Les matériaux..."
          />
          <p className="text-xs text-gray-400 mt-1">L'éditeur de contrat enrichi (clauses IA, variables automatiques) arrive au Batch 5.</p>
        </div>
      </form>
    </SlideOver>
  );
}

export default function Contrats() {
  const [list, setList]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sending, setSending] = useState(null);
  const [copied, setCopied]   = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    load();
    projectsApi.list().then(r => setProjects(r.data || [])).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await contractsApi.list();
      setList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(id) {
    setSending(id);
    try {
      await contractsApi.send(id);
      setList(l => l.map(c => c.id === id ? { ...c, status: 'sent' } : c));
      toast.success('Contrat marqué comme envoyé (email réel → Batch 9)');
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce contrat ?')) return;
    try {
      await contractsApi.delete(id);
      setList(l => l.filter(c => c.id !== id));
      toast.success('Contrat supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  function copyLink(token) {
    const url = `${FRONTEND_URL}/contrat/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const counts = Object.keys(STATUS).reduce((acc, k) => {
    acc[k] = list.filter(c => c.status === k).length;
    return acc;
  }, {});

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contrats</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {list.length} contrat{list.length !== 1 ? 's' : ''} ·{' '}
              {counts.signed} signé{counts.signed !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nouveau contrat
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} className="card py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge ${v.badge}`}>{STATUS_ICON[k]}</span>
                <span className="text-xs text-gray-400">{v.label}</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{counts[k] || 0}</div>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-brand" />
          </div>
        ) : list.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <FileSignature size={32} className="text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700 mb-1">Aucun contrat</p>
            <p className="text-sm text-gray-400 mb-4">Crée ton premier contrat et envoie le lien de signature à ton client.</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Créer un contrat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map(c => {
              const st = STATUS[c.status] || STATUS.draft;
              const projectName = projects.find(p => p.id === c.project_id)?.name;
              return (
                <div
                  key={c.id}
                  className="card hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <FileSignature size={18} className="text-brand" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 truncate">{c.title}</span>
                        <span className={`badge ${st.badge} gap-1`}>
                          {STATUS_ICON[c.status]} {st.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                        {projectName && <span>📁 {projectName}</span>}
                        <span>Créé {fmtDate(c.created_at)}</span>
                        {c.signed_at && <span>✍️ Signé le {fmtDate(c.signed_at)} par {c.signer_name || '—'}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Copy link */}
                      <button
                        onClick={() => copyLink(c.public_token)}
                        className="btn-ghost py-1.5 px-2 text-xs"
                        title="Copier le lien de signature"
                      >
                        {copied === c.public_token ? <Check size={14} className="text-green-600" /> : <Link2 size={14} />}
                      </button>

                      {/* Open public link */}
                      <a
                        href={`${FRONTEND_URL}/contrat/${c.public_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost py-1.5 px-2"
                        title="Voir le contrat"
                      >
                        <ExternalLink size={14} />
                      </a>

                      {/* Send */}
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSend(c.id)}
                          disabled={sending === c.id}
                          className="btn-primary py-1.5 text-xs"
                          title="Marquer comme envoyé"
                        >
                          {sending === c.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Send size={14} />}
                          Envoyer
                        </button>
                      )}

                      {/* Delete */}
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="btn-ghost py-1.5 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note */}
        <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-700">
          <strong>Batch 5 →</strong> Éditeur de contrat riche (clauses IA, variables automatiques, templates RBQ), envoi par email/WhatsApp, e-signature légale.
        </div>
      </div>

      {showCreate && (
        <CreateModal
          projects={projects}
          onClose={() => setShowCreate(false)}
          onSave={(c) => {
            setList(l => [c, ...l]);
            setShowCreate(false);
            toast.success('Contrat créé !');
          }}
        />
      )}
    </Layout>
  );
}
