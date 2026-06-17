import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbAll } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const FORM_TEMPLATES = {
  daily_checklist: {
    name: 'Daily Checklist',
    fields: [
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'weather', label: 'Météo', type: 'text' },
      { id: 'workers', label: 'Nombre de travailleurs', type: 'number' },
      { id: 'tasks_completed', label: 'Tâches complétées', type: 'textarea' },
      { id: 'safety_incidents', label: 'Incidents de sécurité', type: 'textarea' },
      { id: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  progress_report: {
    name: 'Progress Report',
    fields: [
      { id: 'period', label: 'Période', type: 'text' },
      { id: 'percentage_complete', label: '% Complété', type: 'number' },
      { id: 'ahead_behind', label: 'En avance/en retard', type: 'select', options: ['En avance', 'À l\'horaire', 'En retard'] },
      { id: 'budget_status', label: 'Statut budget', type: 'text' },
      { id: 'next_milestones', label: 'Prochaines étapes', type: 'textarea' }
    ]
  },
  safety_incident: {
    name: 'Safety Incident Report',
    fields: [
      { id: 'date', label: 'Date et heure', type: 'datetime' },
      { id: 'worker_name', label: 'Nom du travailleur', type: 'text' },
      { id: 'incident_type', label: 'Type d\'incident', type: 'select', options: ['Blessure', 'Près-accident', 'Dégât', 'Autre'] },
      { id: 'description', label: 'Description', type: 'textarea' },
      { id: 'first_aid', label: 'Premiers soins donné', type: 'checkbox' },
      { id: 'witness', label: 'Témoins', type: 'textarea' }
    ]
  }
};

router.get('/templates', (req, res) => {
  res.json(FORM_TEMPLATES);
});

router.post('/:projectId/submit', authenticateToken, async (req, res) => {
  try {
    const { formType, data } = req.body;
    const { projectId } = req.params;
    
    const submissionId = uuidv4();
    await dbRun(
      'INSERT INTO form_submissions (id, project_id, user_id, form_type, data) VALUES (?, ?, ?, ?, ?)',
      [submissionId, projectId, req.user.userId, formType, JSON.stringify(data)]
    );
    
    res.json({ submissionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectId/submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await dbAll(
      'SELECT * FROM form_submissions WHERE project_id = ? ORDER BY submitted_at DESC',
      [req.params.projectId]
    );
    
    res.json(submissions.map(s => ({
      ...s,
      data: JSON.parse(s.data)
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
