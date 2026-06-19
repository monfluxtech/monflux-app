import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth as authApi, companies } from '../api';
import { useAuthStore, useDevStore } from '../store';
import { Settings, User, Zap, ToggleLeft, ToggleRight, Loader2, Check, Save } from 'lucide-react';

const LEAD_SOURCES = [
  { key: 'soumissions_reno', label: 'SoumissionsRenovations.ca', desc: 'Scraping des leads publics sur le site (nécessite accord avec le site)' },
  { key: 'facebook_ads',     label: 'Facebook Lead Ads',          desc: 'Leads depuis vos campagnes Meta (compte Business connecté requis)' },
  { key: 'google_lsa',       label: 'Google Local Services Ads',  desc: 'Leads depuis Google LSA (compte connecté requis)' },
  { key: 'kijiji',           label: 'Kijiji',                     desc: 'Recherche de leads sur Kijiji (région et mots-clés configurés)' },
];

const FREQ_OPTIONS = [6, 12, 24, 48, 72];

function ProfileTab() {
  const { user, setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', language: user?.language || 'fr' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.update(form);
      // Update store with new name
      const token = localStorage.getItem('token');
      setAuth({ token, user: { ...user, ...data }, company: null, plan: null });
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

const TABS = [
  { id: 'profil',   label: 'Mon profil',    icon: User },
  { id: 'sources',  label: 'Sources leads', icon: Settings },
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
          {activeTab === 'profil'  && <ProfileTab />}
          {activeTab === 'sources' && <LeadSourcesTab />}
          {activeTab === 'dev'     && devEnabled && <DevTab />}
        </div>
      </div>
    </Layout>
  );
}
