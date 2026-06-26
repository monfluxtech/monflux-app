import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/activity-log?project_id=<uuid>&limit=50
router.get('/', async (req, res) => {
  const { project_id, limit = 50 } = req.query;
  try {
    const rows = await query(
      `SELECT al.id, al.project_id, al.actor_type, al.action, al.payload,
              al.created_at, u.name AS user_name, u.avatar_url
       FROM activity_log al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.company_id = $1
         ${project_id ? 'AND al.project_id = $3' : ''}
       ORDER BY al.created_at DESC
       LIMIT $2`,
      project_id ? [req.company_id, parseInt(limit, 10), project_id] : [req.company_id, parseInt(limit, 10)]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error('activity-log GET error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/activity-log  (manual entry from frontend, e.g. note added)
router.post('/', async (req, res) => {
  const { project_id, action, payload = {} } = req.body;
  if (!action) return res.status(400).json({ error: 'action requis' });
  try {
    const { rows: [row] } = await query(
      `INSERT INTO activity_log (company_id, project_id, user_id, actor_type, entity_type, entity_id, action, payload, changes)
       VALUES ($1, $2, $3, 'user', $4, $2, $5, $6, $6) RETURNING id, created_at`,
      [req.company_id, project_id || null, req.user.userId, project_id ? 'project' : null, action, payload]
    );
    res.status(201).json(row);
  } catch (err) {
    console.error('activity-log POST error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
