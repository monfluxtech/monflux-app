import { query } from './db.js';

const ACTION_LABELS = {
  project_status_changed: (p) => `Statut changé → ${p?.new_status || ''}`,
  project_created:        ()  => 'Projet créé',
  invoice_created:        (p) => `Facture créée${p?.number ? ` #${p.number}` : ''}`,
  invoice_status_changed: (p) => `Facture ${p?.status || ''}`,
  phase_created:          (p) => `Phase ajoutée : ${p?.name || ''}`,
  phase_updated:          (p) => `Phase modifiée : ${p?.name || ''}`,
  phase_deleted:          (p) => `Phase supprimée : ${p?.name || ''}`,
  note_added:             ()  => 'Note ajoutée',
  punch_in:               (p) => `Punch entrée — ${p?.worker_name || ''}`,
  punch_out:              (p) => `Punch sortie — ${p?.worker_name || ''} (${p?.hours || '?'}h)`,
  flo_recommendation:     ()  => 'Recommandation Flo',
  change_order_created:   (p) => `Avenant : ${p?.title || ''}`,
  expense_added:          (p) => `Dépense : ${p?.description || ''}`,
};

export async function logActivity({ companyId, projectId = null, actorType = 'user', userId = null, action, payload = {} }) {
  try {
    await query(
      `INSERT INTO activity_log (company_id, project_id, user_id, actor_type, entity_type, entity_id, action, payload, changes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [companyId, projectId, userId, actorType, projectId ? 'project' : null, projectId, action, payload, payload]
    );
  } catch (err) {
    console.error('logActivity error (non-fatal):', err.message);
  }
}

export { ACTION_LABELS };
