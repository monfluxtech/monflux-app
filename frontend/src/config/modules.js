// ── Refonte v3 — registre des modules & pipeline ────────────────────────────
// Source de vérité pour la navigation à 3 onglets + modules activables.

// Pipeline projet par défaut (doit refléter le seed SQL de db.js).
export const DEFAULT_PIPELINE = [
  { key: 'brouillon',   label: 'Brouillon',          color: '#94a3b8' },
  { key: 'estimation',  label: 'Estimation terrain', color: '#a855f7' },
  { key: 'prix_envoye', label: 'Prix envoyé',        color: '#f59e0b' },
  { key: 'accepte',     label: 'Accepté',            color: '#3b82f6' },
  { key: 'planifie',    label: 'Planifié',           color: '#6366f1' },
  { key: 'en_chantier', label: 'En chantier',        color: '#22c55e' },
  { key: 'a_facturer',  label: 'À facturer',         color: '#eab308' },
  { key: 'paye',        label: 'Payé',               color: '#10b981' },
  { key: 'clos',        label: 'Clos',               color: '#64748b', terminal: true },
];

// Onglets CŒUR — toujours visibles (filtrés par rôle), non désactivables.
// Ordre : aperçu global → travaux actifs → assistant.
export const CORE_MODULES = [
  { key: 'dashboard', label: 'Tableau de bord', path: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'projets',   label: 'Projets',         path: '/projets',   icon: 'FolderKanban' },
  { key: 'chat',      label: 'Florence — Flo',  path: '/chat',      icon: 'Sparkles', highlight: true },
];

// Onglets SECONDAIRES — activables par compagnie, dans l'ordre du cycle d'affaires.
// Les features "à venir" sont retirées du nav jusqu'à leur livraison.
export const SECONDARY_MODULES = [
  { key: 'leads',          label: 'Leads',          path: '/leads',          icon: 'Users' },
  { key: 'soumissions',    label: 'Soumissions',    path: '/soumissions',    icon: 'FileText' },
  { key: 'contrats',       label: 'Contrats',       path: '/contrats',       icon: 'FileSignature' },
  { key: 'factures',       label: 'Factures',       path: '/factures',       icon: 'Receipt' },
  { key: 'commandes',      label: 'Commandes',      path: '/commandes',      icon: 'ShoppingCart' },
  { key: 'sous_traitants', label: 'Sous-traitants', path: '/sous-traitants', icon: 'HardHat' },
  { key: 'contacts',       label: 'Contacts',       path: '/contacts',       icon: 'BookUser' },
  { key: 'punch',          label: 'Punch',          path: '/punch',          icon: 'QrCode' },
  { key: 'rapport',        label: 'Rapport',        path: '/rapport',        icon: 'BarChart3' },
];

// Rôle → modules permis. 'ALL' = tout. Les autres ne voient jamais le reste,
// même dans les vues cachées.
const ROLE_ALLOW = {
  owner:           'ALL',
  chef_chantier:   'ALL',
  technicien:      ['dashboard', 'chat', 'projets', 'punch', 'soumissions'],
  sous_traitant:   ['chat', 'projets', 'punch'],
  client_readonly: ['chat', 'projets'],
};

export function roleAllows(role, key) {
  const a = ROLE_ALLOW[role] || 'ALL';
  return a === 'ALL' ? true : a.includes(key);
}

export function defaultModulesEnabled() {
  return {
    leads: true, soumissions: true, contrats: true, factures: true,
    commandes: true, sous_traitants: true, contacts: true, punch: true, rapport: true,
  };
}
