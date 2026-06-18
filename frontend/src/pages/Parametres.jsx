import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { companies, dev as devApi } from '../api';
import { useAuthStore, useDevStore } from '../store';
import { Settings, Zap, ToggleLeft, ToggleRight, Loader2, Check } from 'lucide-react';

const LEAD_SOURCES = [
  { key: 'soumissions_reno', label: 'SoumissionsRenovations.ca', desc: 'Scraping des leads publics sur le site (nécessite accord avec le site)' },
  { key: 'facebook_ads',     label: 'Facebook Lead Ads',          desc: 'Leads depuis vos campagnes Meta (compte Business connecté requis)' },
  { key: 'google_lsa',       label: 'Google Local Services Ads',  desc: 'Leads depuis Google LSA (compte connecté requis)' },
  { key: 'kijiji',           label: 'Kijiji',                     desc: 'Recherche de leads sur Kijiji (région et mots-clés configurés)' },
];

const FREQ_OPTIONS = [6,12,24,48,72];

export default function Parametres() {
  const { plan } = useAuthStore();
  const { enabled: devEnabled } = useDevStore();
  const [config, setConfig] = useState(null);
  const [devPlans, setDevPlans] = useState([]);
  const [devCurrent, setDevCurrent] = useState(null);
  const [saving, setSaving] = useState({});
  const [devSwitching, setDevSwitching] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [devNote, setDevNote] = useState('');

  useEffect(() => {
    companies.get().then(({ data }) => setConfig(data.config)).catch(() => {});
    if (devEnabled) {
      devApi.plans().then(({ data }) => setDevPlans(data)).catch(() => {});
      devApi.current().then(({ data }) => setDevCurrent(data)).catch(() => {});
    }
  }, []);

  const toggleSource = async (key, enabled) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await companies.updateLeadSource(key, { enabled });
      setConfig(c => ({
        ...c,
        lead_sources: { ...c.lead_sources, [key]: { ...(c.lead_sources?.[key] || {}), enabled } }
      }));
    } catch {} finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const setFrequency = async (key, frequency_hours) => {
    await companies.updateLeadSource(key, { frequency_hours: Number(frequency_hours) });
    setConfig(c => ({
      ...c,
      lead_sources: { ...c.lead_sources, [key]: { ...(c.lead_sources?.[key] || {}), frequency_hours: Number(frequency_hours) } }
    }));
  };

  const switchPlan = async () => {
    if (!selectedPlan) return;
    setDevSwitching(true);
    try {
      await devApi.switch({ plan_slug: selectedPlan, note: devNote });
      const { data } = await devApi.current();
      setDevCurrent(data);
    } catch {} finally { setDevSwitching(false); }
  };

  const clearPlan = async () => {
    await devApi.clear();
    setDevCurrent(null);
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Settings size={20} /> Paramètres
        </h1>

        {/* DEV Plan Switcher */}
        {devEnabled && (
          <div className="card mb-6 border-purple-200 bg-purple-50">
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
        )}

        {/* Lead Sources */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-1">Sources de leads externes</h2>
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
                  <button
                    onClick={() => toggleSource(key, !isOn)}
                    disabled={saving[key]}
                    className="flex-shrink-0 mt-0.5"
                  >
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
      </div>
    </Layout>
  );
}
