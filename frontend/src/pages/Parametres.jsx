import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth as authApi, companies, members as membersApi } from '../api';
import { useAuthStore, useDevStore, useConfigStore } from '../store';
import { useUiPrefs } from '../hooks/useUiPrefs';
import { SECONDARY_MODULES } from '../config/modules';
import { Settings, User, Zap, ToggleLeft, ToggleRight, Loader2, Check, Save, Building2, Users, UserPlus, Trash2, Shield, Sparkles, Lock, Layers, Bot, FileSignature, Plus, Code2 } from 'lucide-react';

const MERGE_FIELDS = [
  ['contract_title', 'Titre du contrat'],
  ['project_title', 'Titre du projet'],
  ['client_name', 'Nom du client'],
  ['project_address', 'Adresse du projet'],
  ['quote_total', 'Montant du devis'],
  ['payment_terms_sentence', 'Modalités de paiement'],
  ['start_date', 'Date de début'],
  ['end_date', 'Date de fin'],
  ['scope_summary', 'Résumé de la portée'],
  ['quote_items_html', 'Tableau des postes du devis'],
];

// Éditeur de modèle "low-code" : document formaté (comme le Contrat dans une fiche projet)
// avec des jetons de fusion cliquables à insérer au curseur, plutôt qu'un textarea de code brut.
function TemplateDocumentEditor({ template, onChangeContent }) {
  const editorRef = useRef(null);
  const [showCode, setShowCode] = useState(false);

  const insertField = (key) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const token = document.createTextNode(`{{${key}}}`);
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(token);
      range.setStartAfter(token);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.appendChild(token);
    }
    onChangeContent(el.innerHTML);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {MERGE_FIELDS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => insertField(key)}
            style={{ fontSize: 11, padding: '4px 9px', borderRadius: 999, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
            + {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px 28px', boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChangeContent(e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: template.content || '' }}
          style={{ minHeight: 220, outline: 'none', fontSize: 13, color: '#374151', lineHeight: 1.8, fontFamily: "'Georgia', serif" }}
        />
      </div>

      <button type="button" onClick={() => setShowCode((v) => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: 0 }}>
        <Code2 size={12} /> {showCode ? 'Masquer le code source' : 'Voir le code source'}
      </button>
      {showCode && (
        <textarea
          className="input mt-2"
          rows={8}
          value={template.content || ''}
          onChange={(e) => onChangeContent(e.target.value)}
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5, lineHeight: 1.6 }}
        />
      )}
    </div>
  );
}

const Row = ({ label, value, mono }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 130, flexShrink: 0, paddingTop: 1 }}>{label}</span>
    <span style={{ fontSize: 12.5, color: '#374151', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
  </div>
);
const Chip = ({ label, color, bg }) => (
  <span style={{ fontSize: 11, background: bg, color, borderRadius: 5, padding: '3px 9px', fontWeight: 600 }}>{label}</span>
);

const LEAD_SOURCES = [
  { key: 'soumissions_reno', label: 'SoumissionsRenovations.ca', desc: 'Scraping des leads publics sur le site (nécessite accord avec le site)' },
  { key: 'facebook_ads',     label: 'Facebook Lead Ads',          desc: 'Leads depuis vos campagnes Meta (compte Business connecté requis)' },
  { key: 'google_lsa',       label: 'Google Local Services Ads',  desc: 'Leads depuis Google LSA (compte connecté requis)' },
  { key: 'kijiji',           label: 'Kijiji',                     desc: 'Recherche de leads sur Kijiji (région et mots-clés configurés)' },
];

const FREQ_OPTIONS = [6, 12, 24, 48, 72];

const DEFAULT_CONTRACT_TEMPLATES = {
  version: 1,
  default_key: 'general',
  templates: [
    {
      key: 'general',
      label: 'Contrat général',
      description: 'Rénovation générale et projets standards',
      project_types: ['default', 'general', 'renovation'],
      content: '<h1>{{contract_title}}</h1><p>Projet : <strong>{{project_title}}</strong></p><p>Client : <strong>{{client_name}}</strong></p><p>Adresse : {{project_address}}</p><h2>Portée</h2><p>{{scope_summary}}</p>{{quote_items_html}}<h2>Prix</h2><p>Montant : <strong>{{quote_total}}</strong></p><p>{{payment_terms_sentence}}</p><h2>Échéancier</h2><p>Début : {{start_date}} · Fin : {{end_date}}</p>',
    },
    {
      key: 'interior',
      label: 'Contrat intérieur',
      description: 'Cuisine, salle de bain, sous-sol, finition',
      project_types: ['cuisine', 'salle_de_bain', 'interior'],
      content: '<h1>{{contract_title}}</h1><p>Travaux intérieurs au {{project_address}}.</p><p>{{scope_summary}}</p>{{quote_items_html}}<p>Montant : <strong>{{quote_total}}</strong></p><p>{{payment_terms_sentence}}</p>',
    },
    {
      key: 'exterior',
      label: 'Contrat extérieur',
      description: 'Toiture, revêtement, terrasse, façade',
      project_types: ['toiture', 'revetement', 'terrasse', 'exterieur'],
      content: '<h1>{{contract_title}}</h1><p>Travaux extérieurs au {{project_address}}.</p><p>{{scope_summary}}</p>{{quote_items_html}}<p>Montant : <strong>{{quote_total}}</strong></p><p>{{payment_terms_sentence}}</p>',
    },
    {
      key: 'service',
      label: 'Entente de service',
      description: 'Petits travaux, entretien, interventions ponctuelles',
      project_types: ['service', 'entretien', 'maintenance'],
      content: '<h1>{{contract_title}}</h1><p>Intervention prévue au {{project_address}}.</p><p>{{scope_summary}}</p><p>Montant : <strong>{{quote_total}}</strong></p>',
    },
  ],
};

const getContractTemplatesConfig = (value) => {
  const base = { ...DEFAULT_CONTRACT_TEMPLATES };
  const incoming = value && Array.isArray(value.templates) ? value : DEFAULT_CONTRACT_TEMPLATES;
  const known = new Map(base.templates.map((template) => [template.key, template]));
  incoming.templates.forEach((template) => {
    if (!template?.key) return;
    known.set(template.key, { ...known.get(template.key), ...template });
  });
  return {
    version: 1,
    default_key: known.has(incoming.default_key) ? incoming.default_key : base.default_key,
    templates: [...known.values()],
  };
};

function ProfileTab() {
  const { user, company, plan, token, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', language: user?.language || 'fr' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    companies.get().then(({ data }) => {
      if (data.onboarding_profile) setOnboardingData(data.onboarding_profile);
    }).catch(() => {});
  }, []);

  const TRADE_LABELS = { general: 'Entrepreneur général', charpenterie: 'Charpenterie', plomberie: 'Plomberie', electricite: 'Électricité', demolition: 'Démolition', excavation: 'Excavation', toiture: 'Toiture', peinture: 'Peinture', gypse: 'Gypse', beton_fondation: 'Béton/Fondation', ceramique: 'Céramique', hvac: 'HVAC' };
  const RESP_LABELS = { estimation: 'Estimation', achats: 'Achats', supervision: 'Supervision chantier', facturation: 'Facturation', approbation: 'Approbation', sous_traitants: 'Sous-traitants', sst: 'SST', planification: 'Planification' };

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
    <div className="space-y-8 max-w-lg">
    <form onSubmit={submit} className="space-y-5">
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

    {/* ── Onboarding ── */}
    {onboardingData && (
      <div style={{ background: '#F9FAFB', border: '1px solid #E8EAED', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#15171C', margin: 0 }}>Onboarding</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>Informations collectées lors de la configuration initiale de l'application</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => navigate('/onboarding')} style={{ fontSize: 11, fontWeight: 700, color: '#E8794E', background: '#FFF0E8', border: '1.5px solid #E8794E33', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
              Refaire l'onboarding
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Identité */}
          {(onboardingData.company_name || onboardingData.profile_type) && (
            <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8794E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Identité</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {onboardingData.company_name && <Row label="Entreprise" value={onboardingData.company_name} />}
                {onboardingData.profile_type && <Row label="Type de profil" value={{ company: 'Entreprise', individual: 'Individuel / Travailleur autonome', new_contractor: 'Nouvel entrepreneur' }[onboardingData.profile_type] || onboardingData.profile_type} />}
                {onboardingData.sector && <Row label="Secteur" value={{ residential: 'Résidentiel', commercial: 'Commercial', industrial: 'Industriel', mixed: 'Mixte' }[onboardingData.sector] || onboardingData.sector} />}
                {onboardingData.size && <Row label="Taille équipe" value={{ solo: '1 personne', '2_5': '2–5 personnes', '6_10': '6–10 personnes', '11_25': '11–25 personnes', '26_50': '26–50 personnes', '50_plus': '50+ personnes' }[onboardingData.size] || onboardingData.size} />}
                {onboardingData.rbq_number && <Row label="Licence RBQ" value={onboardingData.rbq_number} mono />}
              </div>
            </div>
          )}

          {/* Métiers & responsabilités */}
          {(Array.isArray(onboardingData.trades) && onboardingData.trades.length > 0) || (Array.isArray(onboardingData.responsibilities) && onboardingData.responsibilities.length > 0) ? (
            <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8794E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Métiers & responsabilités</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.isArray(onboardingData.trades) && onboardingData.trades.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 110, flexShrink: 0, paddingTop: 2 }}>Métiers</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {onboardingData.trades.map(t => <Chip key={t} label={TRADE_LABELS[t] || t} color="#4f46e5" bg="#EEF2FF" />)}
                    </div>
                  </div>
                )}
                {Array.isArray(onboardingData.responsibilities) && onboardingData.responsibilities.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 110, flexShrink: 0, paddingTop: 2 }}>Responsabilités</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {onboardingData.responsibilities.map(r => <Chip key={r} label={RESP_LABELS[r] || r} color="#16A34A" bg="#F0FDF4" />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Modules actifs */}
          {Array.isArray(onboardingData.modules) && onboardingData.modules.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8794E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Modules activés</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {onboardingData.modules.map(m => <Chip key={m} label={m} color="#E8794E" bg="#FFF0E8" />)}
              </div>
            </div>
          )}

          {/* Types de projets & usage */}
          {(onboardingData.onboarding_profile?.project_types || onboardingData.onboarding_profile?.usage_type || onboardingData.project_types || onboardingData.usage_type) && (
            <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8794E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Contexte d'utilisation</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(onboardingData.onboarding_profile?.usage_type || onboardingData.usage_type) && (
                  <Row label="Type d'usage" value={onboardingData.onboarding_profile?.usage_type || onboardingData.usage_type} />
                )}
                {(onboardingData.onboarding_profile?.project_types || onboardingData.project_types) && (
                  <Row label="Types de projets" value={onboardingData.onboarding_profile?.project_types || onboardingData.project_types} />
                )}
              </div>
            </div>
          )}

          {/* Fournisseurs */}
          {Array.isArray(onboardingData.preferred_suppliers) && onboardingData.preferred_suppliers.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#E8794E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Fournisseurs préférés</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {onboardingData.preferred_suppliers.map((s, i) => <Chip key={i} label={typeof s === 'string' ? s : s.name || JSON.stringify(s)} color="#374151" bg="#F3F4F6" />)}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ── Visite guidée ── */}
    <div style={{ background: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 24 }}>🗺️</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#3730A3', margin: '0 0 3px' }}>Visite guidée</p>
        <p style={{ fontSize: 12, color: '#6366F1', margin: 0 }}>Un tour rapide qui te montre comment naviguer dans l'application, section par section.</p>
      </div>
      <button
        onClick={() => { localStorage.setItem('mf_tour_step', '0'); window.dispatchEvent(new Event('mf:start-tour')); }}
        style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#6366F1', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', flexShrink: 0 }}
      >
        Lancer la visite
      </button>
    </div>
    </div>
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

function ContractTemplatesTab() {
  const [config, setConfig] = useState(DEFAULT_CONTRACT_TEMPLATES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    companies.get()
      .then(({ data }) => setConfig(getContractTemplatesConfig(data.config?.contract_templates)))
      .catch(() => {});
  }, []);

  const updateTemplate = (key, field, value) => {
    setConfig((current) => ({
      ...current,
      templates: current.templates.map((template) => (
        template.key === key
          ? {
              ...template,
              [field]: field === 'project_types'
                ? String(value || '').split(',').map((part) => part.trim()).filter(Boolean)
                : value,
            }
          : template
      )),
    }));
  };

  const addTemplate = () => {
    const nextIndex = config.templates.length + 1;
    const key = `custom_${nextIndex}`;
    setConfig((current) => ({
      ...current,
      templates: [
        ...current.templates,
        {
          key,
          label: `Modèle ${nextIndex}`,
          description: 'Nouveau modèle personnalisé',
          project_types: [],
          content: '<h1>{{contract_title}}</h1><p>{{scope_summary}}</p><p>{{quote_total}}</p>',
        },
      ],
    }));
  };

  const removeTemplate = (key) => {
    setConfig((current) => {
      const nextTemplates = current.templates.filter((template) => template.key !== key);
      const nextDefault = current.default_key === key ? (nextTemplates[0]?.key || 'general') : current.default_key;
      return { ...current, default_key: nextDefault, templates: nextTemplates };
    });
  };

  const saveTemplates = async () => {
    setSaving(true);
    try {
      await companies.updateConfig({ contract_templates: config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div style={{ background: '#F9FAFB', border: '1px solid #E8EAED', borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: '0 0 6px' }}>Variables de fusion disponibles</p>
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
          Utilisez par exemple <code>{'{{contract_title}}'}</code>, <code>{'{{project_title}}'}</code>, <code>{'{{client_name}}'}</code>, <code>{'{{project_address}}'}</code>, <code>{'{{quote_total}}'}</code>, <code>{'{{payment_terms_sentence}}'}</code>, <code>{'{{start_date}}'}</code>, <code>{'{{end_date}}'}</code>, <code>{'{{scope_summary}}'}</code>, <code>{'{{quote_items_html}}'}</code>.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Modèle par défaut</label>
          <select className="input" value={config.default_key} onChange={(e) => setConfig((current) => ({ ...current, default_key: e.target.value }))}>
            {config.templates.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}
          </select>
        </div>
        <button type="button" className="btn-secondary mt-6" onClick={addTemplate}>
          <Plus size={14} /> Ajouter un modèle
        </button>
      </div>

      <div className="space-y-4">
        {config.templates.map((template) => (
          <div key={template.key} style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <input className="input mb-2" value={template.label} onChange={(e) => updateTemplate(template.key, 'label', e.target.value)} />
                <input className="input mb-2" value={template.description || ''} onChange={(e) => updateTemplate(template.key, 'description', e.target.value)} placeholder="Description du modèle" />
                <input
                  className="input"
                  value={(template.project_types || []).join(', ')}
                  onChange={(e) => updateTemplate(template.key, 'project_types', e.target.value)}
                  placeholder="Types de projets associés, séparés par des virgules"
                />
              </div>
              {config.templates.length > 1 && (
                <button type="button" className="btn-ghost text-red-500" onClick={() => removeTemplate(template.key)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <TemplateDocumentEditor
              template={template}
              onChangeContent={(html) => updateTemplate(template.key, 'content', html)}
            />
          </div>
        ))}
      </div>

      <button type="button" className="btn-primary" onClick={saveTemplates} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? 'Enregistré!' : 'Enregistrer les modèles'}
      </button>
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
      logo: data.logo || '',
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

      {/* ── Logo ── */}
      <div>
        <label className="label">Logo de l'entreprise</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 76, height: 76, border: '1.5px dashed #D1D5DB', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#F9FAFB', flexShrink: 0 }}>
            {form.logo
              ? <img src={form.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              : <Building2 size={26} style={{ color: '#D1D5DB' }} />
            }
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', background: '#F4F5F6', border: '1px solid #E8EAED', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', display: 'inline-block' }}>
              {form.logo ? 'Changer le logo' : 'Ajouter un logo'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setForm(p => ({ ...p, logo: ev.target.result }));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {form.logo && (
              <button type="button" onClick={() => setForm(p => ({ ...p, logo: '' }))} style={{ marginLeft: 8, fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                Retirer
              </button>
            )}
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5, lineHeight: 1.4 }}>PNG, JPG ou SVG · Apparaît sur vos PDF (soumissions, contrats, factures)</p>
          </div>
        </div>
      </div>

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
  const { prefs: uiPrefs, setPref: setUiPref } = useUiPrefs();
  const [suppliers, setSuppliers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-suppliers') || 'null') || DEFAULT_SUPPLIERS; } catch { return DEFAULT_SUPPLIERS; }
  });
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (uiPrefs.suppliers) setSuppliers(uiPrefs.suppliers);
  }, [uiPrefs.suppliers]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => setSuppliers(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  const remove = (id) => setSuppliers(prev => prev.filter(s => s.id !== id));
  const add = () => {
    if (!newName.trim()) return;
    setSuppliers(prev => [...prev, { id: `custom-${Date.now()}`, name: newName.trim(), url: newUrl.trim(), active: true }]);
    setNewName(''); setNewUrl('');
  };
  const save = () => {
    localStorage.setItem('monflux-suppliers', JSON.stringify(suppliers));
    setUiPref('suppliers', suppliers);
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
const ACTION_LIST = ['voir', 'éditer', 'créer', 'suppr.'];

const MODULE_WIDGETS = {
  dashboard:          [{ key: 'kpi_finances', label: 'KPI Finances' }, { key: 'kpi_planning', label: 'KPI Planning' }, { key: 'ia_resume', label: 'Résumé IA' }, { key: 'alertes', label: 'Alertes' }],
  projets:            [{ key: 'vue_liste', label: 'Vue liste' }, { key: 'vue_kanban', label: 'Vue Kanban' }, { key: 'vue_gantt', label: 'Vue Gantt' }, { key: 'vue_calendrier', label: 'Vue calendrier' }, { key: 'vue_carte', label: 'Vue carte' }, { key: 'vue_portefeuille', label: 'Vue portefeuille' }, { key: 'kpi_ligne', label: 'KPI par ligne' }],
  chat:               [{ key: 'chat_flo', label: 'Chat Florence' }, { key: 'soumissions_ia', label: 'Soumissions IA' }, { key: 'analyse_fichiers', label: 'Analyse fichiers' }, { key: 'phases_ia', label: 'Phases IA' }],
  leads:              [{ key: 'vue_liste', label: 'Vue liste' }, { key: 'pipeline', label: 'Pipeline vente' }],
  soumissions:        [{ key: 'liste', label: 'Liste soumissions' }, { key: 'pdf', label: 'PDF soumission' }],
  contrats:           [{ key: 'liste', label: 'Liste contrats' }, { key: 'signature', label: 'Signature électronique' }],
  factures:           [{ key: 'liste', label: 'Liste factures' }, { key: 'pdf', label: 'PDF facture' }],
  commandes:          [{ key: 'liste', label: 'Liste commandes' }],
  sous_traitants:     [{ key: 'liste', label: 'Liste sous-traitants' }, { key: 'denonciations', label: 'Dénonciations' }],
  punch:              [{ key: 'pointer', label: 'Pointer entrée/sortie' }, { key: 'feuilles', label: 'Feuilles de temps' }],
  rapport:            [{ key: 'export', label: 'Export rapport' }],
  portail_client:     [{ key: 'acces', label: 'Accès portail' }],
  portail_fournisseur:[{ key: 'acces', label: 'Accès portail' }],
};

function RolesTab() {
  const { prefs: uiPrefs, setPref: setUiPref } = useUiPrefs();
  const [matrix, setMatrix] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-roles-matrix') || 'null') || null; } catch { return null; }
  });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (uiPrefs.roles_matrix) setMatrix(uiPrefs.roles_matrix);
  }, [uiPrefs.roles_matrix]); // eslint-disable-line react-hooks/exhaustive-deps

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
        (MODULE_WIDGETS[mod.key] || []).forEach(w => {
          m[r.key][`${mod.key}__${w.key}`] = {};
          ACTION_LIST.forEach(a => {
            m[r.key][`${mod.key}__${w.key}`][a] = r.key === 'owner' || r.key === 'chef_chantier';
          });
        });
      });
    });
    return m;
  };

  const mat = matrix || getDefault();

  const toggle = (role, matKey, action) => {
    const next = JSON.parse(JSON.stringify(mat));
    if (!next[role]) next[role] = {};
    if (!next[role][matKey]) next[role][matKey] = {};
    next[role][matKey][action] = !next[role][matKey][action];
    setMatrix(next);
    localStorage.setItem('monflux-roles-matrix', JSON.stringify(next));
    setUiPref('roles_matrix', next);
  };

  const toggleExpanded = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const CB = ({ role, matKey, action }) => {
    const checked = mat[role]?.[matKey]?.[action] ?? false;
    const fixed = role === 'owner';
    return (
      <td style={{ padding: '5px 3px', borderBottom: '1px solid #F3F4F6', textAlign: 'center' }}>
        <input type="checkbox" checked={checked} disabled={fixed}
          onChange={() => !fixed && toggle(role, matKey, action)}
          style={{ accentColor: '#E8794E', cursor: fixed ? 'default' : 'pointer', width: 12, height: 12 }}
        />
      </td>
    );
  };

  const colW = { minWidth: 38 };

  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
        Définissez ce que chaque rôle peut voir et faire. Cliquez sur ▶ à côté d'un module pour afficher ses widgets.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '7px 10px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151', position: 'sticky', left: 0, zIndex: 2, minWidth: 160 }}>Module / Widget</th>
            {ROLE_LIST.map(r => (
              <th key={r.key} colSpan={ACTION_LIST.length} style={{ textAlign: 'center', padding: '7px 2px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', ...colW }}>
                {r.label}
              </th>
            ))}
          </tr>
          <tr>
            <th style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', position: 'sticky', left: 0, zIndex: 2 }} />
            {ROLE_LIST.flatMap(r => ACTION_LIST.map(a => (
              <th key={`${r.key}-${a}`} style={{ padding: '3px 2px', background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', textAlign: 'center', color: '#9CA3AF', fontWeight: 500, fontSize: 9, whiteSpace: 'nowrap', ...colW }}>{a}</th>
            )))}
          </tr>
        </thead>
        <tbody>
          {modules.map((mod, mi) => {
            const isExp = !!expanded[mod.key];
            const widgets = MODULE_WIDGETS[mod.key] || [];
            const bg = mi % 2 === 0 ? '#fff' : '#F9FAFB';
            return (
              <>
                {/* Module row */}
                <tr key={mod.key} style={{ background: bg }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#15171C', borderBottom: '1px solid #F3F4F6', position: 'sticky', left: 0, background: bg, zIndex: 1, whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => widgets.length > 0 && toggleExpanded(mod.key)}
                      style={{ background: 'none', border: 'none', cursor: widgets.length > 0 ? 'pointer' : 'default', padding: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#15171C' }}
                    >
                      {widgets.length > 0 && (
                        <span style={{ display: 'inline-block', transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform .15s', fontSize: 9, color: '#9CA3AF' }}>▶</span>
                      )}
                      {mod.label}
                    </button>
                  </td>
                  {ROLE_LIST.flatMap(r => ACTION_LIST.map(a => (
                    <CB key={`${r.key}-${a}`} role={r.key} matKey={mod.key} action={a} />
                  )))}
                </tr>

                {/* Widget sub-rows */}
                {isExp && widgets.map(w => {
                  const wKey = `${mod.key}__${w.key}`;
                  return (
                    <tr key={wKey} style={{ background: '#FFFBF7' }}>
                      <td style={{ padding: '5px 8px 5px 24px', color: '#6B7280', borderBottom: '1px solid #F3F4F6', position: 'sticky', left: 0, background: '#FFFBF7', zIndex: 1, whiteSpace: 'nowrap', fontSize: 10.5 }}>
                        <span style={{ color: '#D1D5DB', marginRight: 6 }}>└</span>{w.label}
                      </td>
                      {ROLE_LIST.flatMap(r => ACTION_LIST.map(a => (
                        <CB key={`${r.key}-${a}`} role={r.key} matKey={wKey} action={a} />
                      )))}
                    </tr>
                  );
                })}
              </>
            );
          })}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>La matrice est enregistrée localement. L'intégration DB sera disponible dans une prochaine version.</p>
    </div>
  );
}

// ── Onglet Flo ─────────────────────────────────────────────────────────────
function FloTab() {
  const navigate = useNavigate();
  const { prefs: uiPrefs, setPref: setUiPref } = useUiPrefs();
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('monflux-flo-settings') || 'null') || {}; } catch { return {}; }
  });
  useEffect(() => {
    if (uiPrefs.flo_settings && Object.keys(uiPrefs.flo_settings).length > 0) setSettings(uiPrefs.flo_settings);
  }, [uiPrefs.flo_settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    localStorage.setItem('monflux-flo-settings', JSON.stringify(next));
    setUiPref('flo_settings', next);
  };

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
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Personnalisez la persona et le niveau d'intervention.</p>
        </div>
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
  const { prefs: uiPrefs, setPref: setUiPref } = useUiPrefs();

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
  useEffect(() => {
    if (uiPrefs.flow_flags && Object.keys(uiPrefs.flow_flags).length > 0) setFlags(uiPrefs.flow_flags);
  }, [uiPrefs.flow_flags]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFlag = (key) => {
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    localStorage.setItem('monflux-flow-flags', JSON.stringify(next));
    setUiPref('flow_flags', next);
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
  { id: 'contrats',     label: 'Modèles de contrats',  icon: FileSignature },
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

  const active = tabs.find(t => t.id === activeTab);

  return (
    <Layout>
      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#15171C', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Settings size={20} style={{ color: '#E8794E' }} /> Paramètres
        </h1>

        {/* 2-column layout: vertical nav + content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>

          {/* Left vertical nav */}
          <nav style={{ width: 210, flexShrink: 0, borderRight: '1px solid #F3F4F6', paddingTop: 8, paddingBottom: 8, alignSelf: 'stretch' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === id ? 700 : 500,
                  color: activeTab === id ? '#E8794E' : '#6B7280',
                  borderLeft: `3px solid ${activeTab === id ? '#E8794E' : 'transparent'}`,
                  textAlign: 'left', transition: 'all .12s',
                }}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                {label}
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div style={{ flex: 1, padding: 32, minWidth: 0 }}>
            {active && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <active.icon size={16} style={{ color: '#E8794E' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#15171C', margin: 0 }}>{active.label}</h2>
                </div>
                <div style={{ height: 1, background: '#F3F4F6', marginTop: 12 }} />
              </div>
            )}
            {activeTab === 'profil'       && <ProfileTab />}
            {activeTab === 'company'      && <CompanyTab />}
            {activeTab === 'team'         && <TeamTab />}
            {activeTab === 'roles'        && <RolesTab />}
            {activeTab === 'contrats'     && <ContractTemplatesTab />}
            {activeTab === 'flo'          && <FloTab />}
            {activeTab === 'flow'         && <FlowTab />}
            {activeTab === 'sources'      && <LeadSourcesTab />}
            {activeTab === 'fournisseurs' && <SuppliersTab />}
            {activeTab === 'dev'          && devEnabled && <DevTab />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
