export const num = (value) => Number(value) || 0;

export const money = (value) =>
  num(value).toLocaleString('fr-CA', { maximumFractionDigits: 0 }) + '$';

export const theoMargin = (project) =>
  num(project.contract_value) - (
    num(project.budget_materials) +
    num(project.budget_labor) +
    num(project.trades_estimated_cost)
  );

export const realMargin = (project) =>
  num(project.invoiced_real) - (
    num(project.labor_cost_real) +
    num(project.expenses_real)
  );

export const fmtProjectDate = (date) => {
  if (!date) return null;
  const parsed = new Date(String(date).slice(0, 10) + 'T00:00');
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
};

export const getProjectTitle = (project) =>
  project?.field_assessment?.work_type || project?.type || project?.name || 'Projet';

export const getProjectAddress = (project) => project?.address || '';

export const getProjectDateRange = (project) => {
  const start = fmtProjectDate(project?.start_date);
  const end = fmtProjectDate(project?.end_date);
  return start && end ? `${start} – ${end}` : start || end || '';
};

export const getProjectMeta = (project) =>
  [project?.address, getProjectDateRange(project)].filter(Boolean).join(' · ');

export const getPlanVsActual = (project) => {
  const planned = num(project?.planned_hours);
  const actual = num(project?.total_hours_logged);
  return { planned, actual, delta: actual - planned };
};

export const looksLikeRealAddress = (address) =>
  address && address.trim().length >= 8 && /\d/.test(address);

export const slugify = (value) => (
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'etat'
);

export const EMPTY_PROJECT_FORM = {
  work_type: '',
  address: '',
  city: '',
  postal_code: '',
  latitude: null,
  longitude: null,
  start_date: '',
  end_date: '',
  contract_value: '',
  description: '',
};

export const WORK_TYPE_OPTIONS = [
  { group: 'Résidentiel — Intérieur', items: ['Cuisine', 'Salle de bain', 'Sous-sol', 'Planchers', 'Peinture intérieure', 'Rénovation complète', 'Fenêtres et portes', 'Escaliers', 'Armoires / cuisines'] },
  { group: 'Résidentiel — Extérieur', items: ['Toiture', 'Agrandissement', 'Terrasse / balcon', 'Paysagement', 'Fondation', 'Piscine / spa', 'Revêtement extérieur', 'Clôture'] },
  { group: 'Systèmes', items: ['Électricité', 'Plomberie', 'Chauffage / climatisation (CVC)', 'Isolation', 'Domotique / sécurité'] },
  { group: 'Travaux spécialisés', items: ['Démolition', 'Excavation', 'Maçonnerie / béton', 'Construction neuve', 'Ingénierie structurelle'] },
  { group: 'Commercial / Institutionnel', items: ['Commercial', 'Industriel', 'Institutionnel'] },
  { group: 'Autre', items: ['Autre'] },
];

export const ALL_KPIS = [
  { key: 'contract', label: 'Valeur contrat', group: 'finances' },
  { key: 'invoiced', label: 'Facturé', group: 'finances' },
  { key: 'margin', label: 'Marge', group: 'finances' },
  { key: 'dates', label: 'Dates', group: 'planning' },
  { key: 'plan_actual', label: 'Réel vs planifié', group: 'planning' },
  { key: 'manager', label: 'Responsable', group: 'equipe' },
];

export const PROJECT_VIEW_OPTIONS = [
  { key: 'list', label: 'Liste', icon: 'list' },
  { key: 'kanban', label: 'Kanban', icon: 'kanban' },
  { key: 'gantt', label: 'Gantt', icon: 'gantt' },
  { key: 'calendar', label: 'Calendrier', icon: 'calendar' },
  { key: 'portefeuille', label: 'Portefeuille', icon: 'portfolio' },
  { key: 'map', label: 'Carte', icon: 'map' },
];
