import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth as authApi, companies, members as membersApi } from '../api';
import { useAuthStore, useDevStore, useConfigStore } from '../store';
import { SECONDARY_MODULES } from '../config/modules';
import { Settings, User, Zap, ToggleLeft, ToggleRight, Loader2, Check, Save, Building2, Users, UserPlus, Trash2, Shield, Sparkles, Lock, Layers, Bot } from 'lucide-react';

const LEAD_SOURCES = [
  { key: 'soumissions_reno', label: 'SoumissionsRenovations.ca', desc: 'Scraping des leads publics sur le site (nécessite accord avec le site)' },
  { key: 'facebook_ads',     label: 'Facebook Lead Ads',          desc: 'Leads depuis vos campagnes Meta (compte Business connecté requis)' },
  { key: 'google_lsa',       label: 'Google Local Services Ads',  desc: 'Leads depuis Google LSA (compte connecté requis)' },
  { key: 'kijiji',           label: 'Kijiji',                     desc: 'Recherche de leads sur Kijiji (région et mots-clés configurés)' },
];

const FREQ_OPTIONS = [6, 12, 24, 48, 72];

function ProfileTab() {
  const { user, company, plan, token, setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', language: user?.language || 'fr' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.update(form);
      setAuth({ token, user: { ...user, ...data }, company, plan });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-lg">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: '#F26522' }}>
          {(form.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{form.name || user?.email}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nom complet</label>
          <input className="input" value={form.name} onChange={f('name')} placeholder="Jean Tremblay" />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={form.phone} onChange={f('phone')} placeholder="514-555-1234" />
        </div>
        <div>
          <label className="label">Langue</label>
          <select className="input" value={form.language} onChange={f('language')}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Adresse courriel</label>
        <input className="input bg-gray-50" value={user?.email || ''} disabled />
        <p className="text-xs text-gray-400 mt-1">L'adresse courriel ne peut pas être modifiée.</p>
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? 'Enregistré!' : 'Enregistrer'}
      </button>
    </form>
  );
}

function LeadSourcesTab() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    companies.get().then(({ data }) => setConfig(data.config)).catch(() => {});
  }, []);

  const toggleSource = async (key, enabled) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await companies.updateLeadSource(key, { enabled });
      setConfig(c => ({
        ...c,
        lead_sources: { ...c.lead_sources, [key]: { ...(c.lead_sources?.[key] || {}), enabled } },
      }));
    } catch {} finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const setFrequency = async (key, frequency_hours) => {
    await companies.updateLeadSource(key, { frequency_hours: Number(frequency_hours) });
    setConfig(c => ({
      ...c,
      lead_sources: { ...c.lead_sources, [key]: { ...(c.lead_sources?.[key] || {}), frequency_hours: Number(frequency_hours) } },
    }));
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Activez les sources que vous souhaitez. MONFLUX scrape ou intègre ces sources à la fréquence choisie.</p>
      <div className="space-y-4">
        {LEAD_SOURCES.map(({ key, label, desc }) => {
          const src = config?.lead_sources?.[key] || {};
          const isOn = !!src.enabled;
          return (
            <div key={key} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                {isOn && key !== 'facebook_ads' && key !== 'google_lsa' && (
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-xs text-gray-500">Fréquence :</label>
                    <select
                      className="input py-0.5 text-xs w-32"
                      value={src.frequency_hours || 24}
                      onChange={e => setFrequency(key, e.target.value)}
                    >
                      {FREQ_OPTIONS.map(h => <option key={h} value={h}>Toutes les {h}h</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button onClick={() => toggleSource(key, !isOn)} disabled={saving[key]} className="flex-shrink-0 mt-0.5">
                {saving[key]
                  ? <Loader2 size={22} className="animate-spin text-gray-300" />
                  : isOn
                    ? <ToggleRight size={28} className="text-brand" />
                    : <ToggleLeft size={28} className="text-gray-300" />
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompanyTab() {
  const { company: storeCompany, token, user, plan, setAuth } = useAuthStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    companies.get().then(({ data }) => setForm({
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      postal_code: data.postal_code || '',
      rbq_number: data.rbq_number || '',
      neq_number: data.neq_number || '',
      tps_number: data.tps_number || '',
      tvq_number: data.tvq_number || '',
      website: data.website || '',
      facebook: data.social_links?.facebook || '',
      instagram: data.social_links?.instagram || '',
      linkedin: data.social_links?.linkedin || '',
    })).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { facebook, instagram, linkedin, ...rest } = form;
      const payload = { ...rest, social_links: { facebook, instagram, linkedin } };
      await companies.update(payload);
      setAuth({ token, user, company: { ...storeCompany, ...rest }, plan });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  if (!form) return <div className="flex items-center gap-2 text-gray-400"><Loader2 size={14} className="animate-spin"/> Chargement…</div>;

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div><label className="label">Nom de l'entreprise *</label><input className="input" value={form.name} onChange={f('name')} required placeholder="Constructions Tremblay inc."/></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={f('phone')} placeholder="514-555-1234"/></div>
        <div><label className="label">Courriel entreprise</label><input className="input" type="email" value={form.email} onChange={f('email')} placeholder="info@constructionstremblay.ca"/></div>
      </div>
      <div><label className="label">Adresse</label><input className="input" value={form.address} onChange={f('address')} placeholder="123 rue Principale"/></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Ville</label><input className="input" value={form.city} onChange={f('city')} placeholder="Montréal"/></div>
        <div><label className="label">Code postal</label><input className="input" value={form.postal_code} onChange={f('postal_code')} placeholder="H1A 1A1"/></div>
      </div>

      {/* Licences construction Québec */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Numéro RBQ</label>
          <input className="input" value={form.rbq_number} onChange={f('rbq_number')} placeholder="1234-5678-90"/>
          <p className="text-xs text-gray-400 mt-0.5">Régie du bâtiment du Québec — affiché sur soumissions et contrats</p>
        </div>
        <div>
          <label className="label">Numéro NEQ</label>
          <input className="input" value={form.neq_number} onChange={f('neq_number')} placeholder="1234567890"/>
          <p className="text-xs text-gray-400 mt-0.5">Numéro d'entreprise du Québec</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Numéro TPS</label>
          <input className="input" value={form.tps_number} onChange={f('tps_number')} placeholder="123456789 RT0001"/>
          <p className="text-xs text-gray-400 mt-0.5">Apparaît sur les factures PDF</p>
        </div>
        <div>
          <label className="label">Numéro TVQ</label>
          <input className="input" value={form.tvq_number} onChange={f('tvq_number')} placeholder="1234567890 TQ0001"/>
        </div>
      </div>
      <div><label className="label">Site web</label><input className="input" value={form.website} onChange={f('website')} placeholder="https://constructions-tremblay.ca"/></div>

      {/* Médias sociaux */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-3">Médias sociaux</p>
        <div className="space-y-3">
          <div><label className="label">Facebook</label><input className="input" value={form.facebook} onChange={f('facebook')} placeholder="https://facebook.com/votreentreprise"/></div>
          <div><label className="label">Instagram</label><input className="input" value={form.instagram} onChange={f('instagram')} placeholder="https://instagram.com/votreentreprise"/></div>
          <div><label className="label">LinkedIn</label><input className="input" value={form.linkedin} onChange={f('linkedin')} placeholder="https://linkedin.com/company/votreentreprise"/></div>
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin"/> : saved ? <Check size={14}/> : <Save size={14}/>}
        {saved ? 'Enregistré!' : 'Enregistrer'}
      </button>
    </form>
  );
}

const ROLE_LABELS = {
  owner:           'Propriétaire',
  chef_chantier:   'Chef de chantier',
  technicien:      'Technicien',
  sous_traitant:   'Sous-traitant',
  client_readonly: 'Client (lecture)',
};
const ROLE_COLORS = {
  owner:           'bg-brand/10 text-brand',
  chef_chantier:   'bg-blue-100 text-blue-700',
  technicien:      'bg-green-100 text-green-700',
  sous_traitant:   'bg-purple-100 text-purple-700',
  client_readonly: 'bg-gray-100 text-gray-500',
};
const ASSIGNABLE_ROLES = ['chef_chantier', 'technicien', 'sous_traitant', 'client_readonly'];

function TeamTab() {
  const { user } = useAuthStore();
  const [data, setData]       = useState({ members: [], invites: [] });
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('technicien');
  const [inviting, setInviting]       = useState(false);
  const [inviteMsg, setInviteMsg]     = useState(null);
  const [removing, setRemoving]       = useState({});

  const isOwner = data.members.find(m => m.email === user?.email)?.is_owner;

  const load = () => membersApi.list()
    .then(({ data: d }) => setData(d))
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const invite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      const { data: res } = await membersApi.invite({ email: inviteEmail, role: inviteRole });
      setInviteMsg({ ok: true, text: res.added ? `${res.user.name || inviteEmail} ajouté comme ${ROLE_LABELS[inviteRole]}.` : res.message });
      setInviteEmail('');
      load();
    } catch (err) {
      setInviteMsg({ ok: false, text: err.response?.data?.error || 'Erreur lors de l\'invitation.' });
    } finally { setInviting(false); }
  };

  const changeRole = async (memberId, role) => {
    try {
      await membersApi.updateRole(memberId, role);
      setData(d => ({ ...d, members: d.members.map(m => m.id === memberId ? { ...m, role } : m) }));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const removeMember = async (memberId, name) => {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    setRemoving(r => ({ ...r, [memberId]: true }));
    try {
      await membersApi.remove(memberId);
      setData(d => ({ ...d, members: d.members.filter(m => m.id !== memberId) }));
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally { setRemoving(r => ({ ...r, [memberId]: false })); }
  };

  const cancelInvite = async (inviteId) => {
    try {
      await membersApi.cancelInvite(inviteId);
      setData(d => ({ ...d, invites: d.invites.filter(i => i.id !== inviteId) }));
    } catch {}
  };

  if (loading) return <div className="flex items-center gap-2 text-gray-400"><Loader2 size={14} className="animate-spin"/> Chargement…</div>;

  return (
    <div className="space-y-6">
      {/* Members list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users size={15}/> Membres ({data.members.length})</h3>
        <div className="space-y-2">
          {data.members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#F26522' }}>
                {(m.name?.[0] || m.email[0]).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.name || m.email}</p>
                {m.name && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
              </div>
              {m.is_owner ? (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS.owner}`}>{ROLE_LABELS.owner}</span>
              ) : isOwner ? (
                <select
                  className="input py-0.5 text-xs w-40"
                  value={m.role}
                  onChange={e => changeRole(m.id, e.target.value)}
                >
                  {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              ) : (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role] || ROLE_COLORS.technicien}`}>{ROLE_LABELS[m.role] || m.role}</span>
              )}
              {isOwner && !m.is_owner && (
                <button
                  onClick={() => removeMember(m.id, m.name || m.email)}
                  disabled={removing[m.id]}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg"
                >
                  {removing[m.id] ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Invitations en attente</h3>
          <div className="space-y-2">
            {data.invites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{inv.email}</p>
                  <p className="text-xs text-gray-400">{ROLE_LABELS[inv.role] || inv.role} · En attente de connexion</p>
                </div>
                {isOwner && (
                  <button onClick={() => cancelInvite(inv.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Annuler</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form — owner only */}
      {isOwner && (
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><UserPlus size={15}/> Inviter un membre</h3>
          <form onSubmit={invite} className="flex gap-2 flex-wrap">
            <input
              className="input flex-1 min-w-48"
              type="email"
              placeholder="courriel@exemple.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
            />
            <select className="input w-44" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button type="submit" className="btn-primary flex-shrink-0" disabled={inviting}>
              {inviting ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>}
              Inviter
            </button>
          </form>
          {inviteMsg && (
            <p className={`text-xs mt-2 ${inviteMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{inviteMsg.text}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Si l'utilisateur a déjà un compte MONFLUX, il est ajouté immédiatement. Sinon, l'invitation s'active à sa première connexion.
          </p>
        </div>
      )}

      {/* Role legend */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5"><Shield size={12}/> Rôles disponibles</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            ['chef_chantier', 'Accès complet aux projets et à l\'équipe'],
            ['technicien', 'Punch, feuilles de temps, tâches assignées'],
            ['sous_traitant', 'Corps de métiers et documents partagés'],
            ['client_readonly', 'Portail client lecture seule'],
          ].map(([role, desc]) => (
            <div key={role} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
              <p className="text-xs text-gray-400 leading-tight">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SUPPLIERS = [
  // Quincailleries QC — scraped via Apify/API
  { id: 'homedepot',      name: 'Home Depot Canada',  url: 'https://www.homedepot.ca',          active: true,  scraperKey: 'homedepot' },
  { id: 'rona',           name: 'Rona',               url: 'https://www.rona.ca',               active: true,  scraperKey: 'rona' },
  { id: 'canadiantire',   name: 'Canadian Tire',       url: 'https://www.canadiantire.ca',       active: false, scraperKey: 'canadiantire' },
  { id: 'lowes',          name: "Lowe's Canada",       url: 'https://www.lowescanada.ca',        active: false, scraperKey: null },
  { id: 'patrickmorin',   name: 'Patrick Morin',       url: 'https://www.patrickmorin.com',      active: false, scraperKey: null },
  { id: 'canac',          name: 'Canac',               url: 'https://www.canac.ca',              active: false, scraperKey: null },
  { id: 'bmr',            name: 'BMR',                 url: 'https://www.bmr.ca',               active: false, scraperKey: null },
  { id: 'richelieu',      name: 'Richelieu',           url: 'https://www.richelieu.com',         active: false, scraperKey: null },
  { id: 'ikea',           name: 'IKEA Canada',         url: 'https://www.ikea.com/ca',           active: false, scraperKey: null },
  // Marketplaces — scraped via Apify
  { id: 'amazon',         name: 'Amazon.ca',           url: 'https://www.amazon.ca',             active: false, scraperKey: 'amazon' },
  { id: 'aliexpress',     name: 'AliExpress',          url: 'https://www.aliexpress.com',        active: false, scraperKey: 'aliexpress' },
  { id: 'kijiji',         name: 'Kijiji',              url: 'https://www.kijiji.ca',             active: false, scraperKey: 'kijiji' },
  { id: 'facebook',       name: 'Facebook Marketplace',url: 'https://www.facebook.com/marketplace', active: false, scraperKey: 'facebook' },
];

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-suppliers') || 'null') || DEFAULT_SUPPLIERS; } catch { return DEFAULT_SUPPLIERS; }
  });
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const toggle = (id) => setSuppliers(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const remove = (id) => setSuppliers(prev => prev.filter(s => s.id !== id));
  const add = () => {
    if (!newName.trim()) return;
    setSuppliers(prev => [...prev, { id: `custom-${Date.now()}`, name: newName.trim(), url: newUrl.trim(), active: true }]);
    setNewName(''); setNewUrl('');
  };
  const save = () => {
    localStorage.setItem('monflux-suppliers', JSON.stringify(suppliers));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Fournisseurs de matériaux</h3>
        <p style={{ fontSize: 12.5, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
          Flo utilise cette liste pour proposer des matériaux et des prix lors de la recherche dans les projets. Active les fournisseurs pertinents pour ton marché.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {suppliers.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: s.active ? '#F0FDF4' : '#F9FAFB', borderRadius: 9, border: `1px solid ${s.active ? '#BBF7D0' : '#E5E7EB'}` }}>
            <button onClick={() => toggle(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, flexShrink: 0, color: s.active ? '#16A34A' : '#D1D5DB' }}>
              {s.active ? '●' : '○'}
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{s.name}</span>
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none' }}>{s.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</a>
            )}
            <button onClick={() => remove(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 16, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>

      {/* Ajouter un fournisseur custom */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom du fournisseur"
          style={{ flex: 1, minWidth: 140, padding: '7px 11px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}/>
        <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..."
          style={{ flex: 1, minWidth: 200, padding: '7px 11px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none' }}/>
        <button onClick={add} disabled={!newName.trim()}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: newName.trim() ? 1 : 0.4 }}>
          + Ajouter
        </button>
      </div>

      <button onClick={save}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, border: 'none', background: saved ? '#16A34A' : '#6366F1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        {saved ? <Check size={14}/> : <Save size={14}/>}
        {saved ? 'Enregistré !' : 'Enregistrer les fournisseurs'}
      </button>
    </div>
  );
}

function DevTab() {
  const [devPlans, setDevPlans] = useState([]);
  const [devCurrent, setDevCurrent] = useState(null);
  const [devSwitching, setDevSwitching] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [devNote, setDevNote] = useState('');
  const { dev: devApi } = { dev: { plans: () => import('../api').then(m => m.dev.plans()), current: () => import('../api').then(m => m.dev.current()), switch: (d) => import('../api').then(m => m.dev.switch(d)), clear: () => import('../api').then(m => m.dev.clear()) } };

  useEffect(() => {
    import('../api').then(({ dev }) => {
      dev.plans().then(({ data }) => setDevPlans(data)).catch(() => {});
      dev.current().then(({ data }) => setDevCurrent(data)).catch(() => {});
    });
  }, []);

  const switchPlan = async () => {
    if (!selectedPlan) return;
    setDevSwitching(true);
    try {
      const { dev } = await import('../api');
      await dev.switch({ plan_slug: selectedPlan, note: devNote });
      const { data } = await dev.current();
      setDevCurrent(data);
    } catch {} finally { setDevSwitching(false); }
  };

  const clearPlan = async () => {
    const { dev } = await import('../api');
    await dev.clear();
    setDevCurrent(null);
  };

  return (
    <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-purple-600" />
        <h2 className="font-semibold text-purple-900 text-sm">⚡ MODE DEV — Simuler un forfait</h2>
      </div>
      {devCurrent?.is_dev_override && (
        <div className="mb-3 px-3 py-2 bg-purple-100 rounded-lg text-xs text-purple-700">
          Override actif: <strong>{devCurrent.slug}</strong>
          {devCurrent.dev_note && ` — ${devCurrent.dev_note}`}
          <button className="ml-3 text-purple-400 hover:text-purple-700 underline" onClick={clearPlan}>Réinitialiser</button>
        </div>
      )}
      <div className="flex gap-2">
        <select className="input flex-1 text-sm" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
          <option value="">Choisir un forfait…</option>
          {devPlans.map(p => <option key={p.slug} value={p.slug}>{p.name} ({p.base_price}$ + {p.per_seat_price}$/siège)</option>)}
        </select>
        <input className="input w-40 text-sm" placeholder="Note (optionnel)" value={devNote} onChange={e => setDevNote(e.target.value)} />
        <button className="btn-primary flex-shrink-0" onClick={switchPlan} disabled={!selectedPlan || devSwitching}>
          {devSwitching ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Appliquer
        </button>
      </div>
    </div>
  );
}

// ── Onglet Rôles & permissions ─────────────────────────────────────────────
const ROLE_LIST = [
  { key: 'owner',           label: 'Propriétaire' },
  { key: 'chef_chantier',   label: 'Chef chantier' },
  { key: 'technicien',      label: 'Technicien' },
  { key: 'sous_traitant',   label: 'Sous-traitant' },
  { key: 'client',          label: 'Client' },
  { key: 'fournisseur',     label: 'Fournisseur' },
];
const ACTION_LIST = ['voir', 'éditer', 'créer', 'supprimer'];

function RolesTab() {
  const [matrix, setMatrix] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-roles-matrix') || 'null') || null; } catch { return null; }
  });

  const modules = [
    { key: 'dashboard', label: 'Tableau de bord' },
    { key: 'projets', label: 'Projets' },
    { key: 'chat', label: 'Florence / IA' },
    { key: 'leads', label: 'Leads' },
    { key: 'soumissions', label: 'Soumissions' },
    { key: 'contrats', label: 'Contrats' },
    { key: 'factures', label: 'Factures' },
    { key: 'commandes', label: 'Commandes' },
    { key: 'sous_traitants', label: 'Sous-traitants' },
    { key: 'punch', label: 'Punch' },
    { key: 'rapport', label: 'Rapport' },
    { key: 'portail_client', label: 'Portail client' },
    { key: 'portail_fournisseur', label: 'Portail fournisseur' },
  ];

  const getDefault = () => {
    const m = {};
    ROLE_LIST.forEach(r => {
      m[r.key] = {};
      modules.forEach(mod => {
        m[r.key][mod.key] = {};
        ACTION_LIST.forEach(a => {
          m[r.key][mod.key][a] = r.key === 'owner' || r.key === 'chef_chantier';
        });
      });
    });
    return m;
  };

  const mat = matrix || getDefault();

  const toggle = (role, mod, action) => {
    const next = JSON.parse(JSON.stringify(mat));
    next[role][mod][action] = !next[role][mod][action];
    setMatrix(next);
    localStorage.setItem('monflux-roles-matrix', JSON.stringify(next));
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Lock size={16} style={{ color: '#E8794E' }}/>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Rôles & permissions</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Définissez ce que chaque rôle peut voir et faire. Client et fournisseur incluent les portails publics.</p>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 8px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151', position: 'sticky', left: 0, zIndex: 1 }}>Module</th>
            {ROLE_LIST.map(r => (
              <th key={r.key} colSpan={ACTION_LIST.length} style={{ textAlign: 'center', padding: '6px 4px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                {r.label}
              </th>
            ))}
          </tr>
          <tr>
            <th style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', position: 'sticky', left: 0, zIndex: 1 }} />
            {ROLE_LIST.flatMap(r => ACTION_LIST.map(a => (
              <th key={`${r.key}-${a}`} style={{ padding: '3px 2px', background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', textAlign: 'center', color: '#9CA3AF', fontWeight: 500, fontSize: 9, whiteSpace: 'nowrap' }}>{a}</th>
            )))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod, mi) => (
            <tr key={mod.key} style={{ background: mi % 2 === 0 ? '#fff' : '#F9FAFB' }}>
              <td style={{ padding: '6px 8px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #F3F4F6', position: 'sticky', left: 0, background: mi % 2 === 0 ? '#fff' : '#F9FAFB', zIndex: 1, whiteSpace: 'nowrap' }}>{mod.label}</td>
              {ROLE_LIST.flatMap(r => ACTION_LIST.map(a => {
                const checked = mat[r.key]?.[mod.key]?.[a] ?? false;
                const isOwnerFixed = r.key === 'owner';
                return (
                  <td key={`${r.key}-${a}`} style={{ padding: '6px 4px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' }}>
                    <input type="checkbox" checked={checked} disabled={isOwnerFixed}
                      onChange={() => !isOwnerFixed && toggle(r.key, mod.key, a)}
                      style={{ accentColor: '#E8794E', cursor: isOwnerFixed ? 'default' : 'pointer' }}/>
                  </td>
                );
              }))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>La matrice est enregistrée localement. L'intégration DB sera disponible dans une prochaine version.</p>
    </div>
  );
}

// ── Onglet Flo ─────────────────────────────────────────────────────────────
function FloTab() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-flo-settings') || 'null') || {}; } catch { return {}; }
  });

  const save = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem('monflux-flo-settings', JSON.stringify(next));
  };

  const MODELS = [
    { key: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (défaut)' },
    { key: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (rapide)' },
    { key: 'claude-opus-4-8', label: 'Opus 4.8 (puissant)' },
  ];
  const INTERVENTION_LEVELS = [
    { key: 'proactive', label: 'Proactif — Flo propose spontanément des suggestions' },
    { key: 'on_demand', label: 'Sur demande — Flo répond seulement quand on la consulte' },
    { key: 'minimal',   label: 'Minimal — Flo est disponible mais ne suggère rien' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bot size={18} style={{ color: '#E8794E' }}/>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Configuration de Flo</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Personnalisez la persona, le modèle et le niveau d'intervention.</p>
        </div>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Modèle IA</label>
        <select className="input" value={settings.model || 'claude-sonnet-4-6'} onChange={e => save({ model: e.target.value })}>
          {MODELS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Niveau d'intervention</label>
        {INTERVENTION_LEVELS.map(l => (
          <label key={l.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
            <input type="radio" name="intervention" value={l.key} checked={(settings.intervention || 'proactive') === l.key} onChange={() => save({ intervention: l.key })} style={{ marginTop: 2, accentColor: '#E8794E' }}/>
            <span style={{ fontSize: 13, color: '#374151' }}>{l.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Contexte/prompt additionnel (optionnel)</label>
        <textarea className="input resize-none" style={{ minHeight: 80 }}
          placeholder="Ex : On travaille surtout en rénovation résidentielle à Montréal. On facture en fin de projet."
          value={settings.custom_prompt || ''}
          onChange={e => save({ custom_prompt: e.target.value })}
        />
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Ce contexte s'ajoute à la persona de base de Flo pour toutes les conversations.</p>
      </div>

      <div style={{ background: '#FFF1EB', border: '1px solid #FDDCCA', borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#E8794E', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14}/> Visite guidée
        </p>
        <p style={{ fontSize: 12, color: '#7C8089', margin: '0 0 12px' }}>Relancez la visite guidée pour redécouvrir les fonctionnalités MONFLUX.</p>
        <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => navigate('/onboarding?tour=1')}>
          <Sparkles size={12}/> Relancer la visite guidée
        </button>
      </div>
    </div>
  );
}

// ── Onglet Flow & modules ──────────────────────────────────────────────────
function FlowTab() {
  const { modules, toggleModule, loading } = useConfigStore();

  const moduleList = SECONDARY_MODULES.map(m => ({
    ...m,
    enabled: modules?.[m.key] !== false,
  }));

  const FLOW_FLAGS = [
    { key: 'estimation_flow', label: 'Module Estimation', desc: 'Activer les outils d\'estimation approximative et devis' },
    { key: 'billing_progress', label: 'Facturation progressive', desc: 'Permettre la facturation par étapes/jalons plutôt qu\'en fin de projet' },
    { key: 'field_team', label: 'Équipe terrain', desc: 'Activer le punch, les feuilles de temps et le suivi de l\'équipe' },
    { key: 'materiaux', label: 'Module Matériaux', desc: 'Recherche et commande de matériaux dans les projets' },
    { key: 'sous_traitants', label: 'Module Sous-traitants', desc: 'Gestion des sous-traitants et dénonciations' },
  ];

  const [flags, setFlags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-flow-flags') || '{}'); } catch { return {}; }
  });

  const toggleFlag = (key) => {
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    localStorage.setItem('monflux-flow-flags', JSON.stringify(next));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Layers size={18} style={{ color: '#E8794E' }}/>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Flow & modules</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Activez les modules secondaires et configurez les fonctionnalités disponibles.</p>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Modules de navigation</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {moduleList.map(m => (
            <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#15171C', margin: 0 }}>{m.label}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{m.path}</p>
              </div>
              <button type="button" onClick={() => toggleModule(m.key)} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.enabled ? '#E8794E' : '#D1D5DB' }}>
                {m.enabled ? <ToggleRight size={26}/> : <ToggleLeft size={26}/>}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Fonctionnalités de flow</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FLOW_FLAGS.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#15171C', margin: 0 }}>{f.label}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{f.desc}</p>
              </div>
              <button type="button" onClick={() => toggleFlag(f.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: flags[f.key] ? '#E8794E' : '#D1D5DB' }}>
                {flags[f.key] ? <ToggleRight size={26}/> : <ToggleLeft size={26}/>}
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Les flags de flow sont enregistrés localement. L'intégration DB sera disponible dans une prochaine version.</p>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'profil',       label: 'Mon profil',           icon: User },
  { id: 'company',      label: 'Entreprise',            icon: Building2 },
  { id: 'team',         label: 'Équipe',                icon: Users },
  { id: 'roles',        label: 'Rôles & permissions',  icon: Lock },
  { id: 'flo',          label: 'Flo',                   icon: Bot },
  { id: 'flow',         label: 'Flow & modules',        icon: Layers },
  { id: 'sources',      label: 'Sources leads',         icon: Settings },
  { id: 'fournisseurs', label: 'Fournisseurs',          icon: Settings },
];

export default function Parametres() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enabled: devEnabled } = useDevStore();
  const initialTab = searchParams.get('tab') || 'profil';
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = devEnabled ? [...TABS, { id: 'dev', label: 'Dev', icon: Zap }] : TABS;

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Settings size={20} /> Paramètres
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="card">
          {activeTab === 'profil'       && <ProfileTab />}
          {activeTab === 'company'      && <CompanyTab />}
          {activeTab === 'team'         && <TeamTab />}
          {activeTab === 'roles'        && <RolesTab />}
          {activeTab === 'flo'          && <FloTab />}
          {activeTab === 'flow'         && <FlowTab />}
          {activeTab === 'sources'      && <LeadSourcesTab />}
          {activeTab === 'fournisseurs' && <SuppliersTab />}
          {activeTab === 'dev'          && devEnabled && <DevTab />}
        </div>
      </div>
    </Layout>
  );
}
