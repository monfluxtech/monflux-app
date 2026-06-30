// Règles de disponibilité pour chaque section de la fiche projet.
// minStatus : clé de DEFAULT_PIPELINE à partir de laquelle la section est active.
//             null = toujours disponible.
// requires   : clé de modules_enabled requise, ou null.
// La section désactivée reste dans le TOC (grisée) et dans le DOM (stub repliable).

export const SECTION_RULES = {
  's-estimation':   { minStatus: null,        requires: 'estimation' },
  's-pipeline':     { minStatus: null,        requires: null },
  's-equipe':       { minStatus: null,        requires: null },
  's-materiaux':    { minStatus: null,        requires: 'materiaux' },
  's-soumission':   { minStatus: null,        requires: null },
  's-punch':        { minStatus: 'accepte',   requires: null },
  's-expenses':     { minStatus: 'accepte',   requires: null },
  's-invoices':     { minStatus: 'accepte',   requires: null },
  's-extras':       { minStatus: 'accepte',   requires: null },
  's-nonconformites': { minStatus: 'accepte', requires: null },
  's-quittances':   { minStatus: 'accepte',   requires: null },
  's-denonciations':{ minStatus: 'accepte',   requires: 'sous_traitants' },
  's-media':        { minStatus: null,        requires: null },
};

// Retourne true si le statut courant du projet atteint minStatus dans le pipeline.
export function statusReached(currentStatus, minStatus, pipeline) {
  if (!minStatus) return true;
  const idx = (s) => pipeline.findIndex(p => p.key === s);
  const cur = idx(currentStatus);
  const min = idx(minStatus);
  if (cur === -1 || min === -1) return false;
  return cur >= min;
}

// Raison d'indisponibilité lisible pour l'utilisateur.
export function unavailableReason(sectionId, currentStatus, pipeline, modules) {
  const rule = SECTION_RULES[sectionId];
  if (!rule) return null;

  if (rule.requires && !modules?.[rule.requires]) {
    const labels = {
      estimation:     'le module Estimation',
      materiaux:      'le module Matériaux',
      sous_traitants: 'le module Sous-traitants',
    };
    return `Nécessite ${labels[rule.requires] || rule.requires} (activable dans Paramètres › Flow & modules)`;
  }

  if (rule.minStatus && !statusReached(currentStatus, rule.minStatus, pipeline)) {
    const stage = pipeline.find(p => p.key === rule.minStatus);
    return `Disponible après « ${stage?.label || rule.minStatus} »`;
  }

  return null;
}

// Vérifie si une section est disponible.
export function isSectionAvailable(sectionId, currentStatus, pipeline, modules) {
  return !unavailableReason(sectionId, currentStatus, pipeline, modules);
}
