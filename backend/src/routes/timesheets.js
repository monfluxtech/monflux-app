import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.post('/start', async (req, res) => {
  const { project_id, worker_name, phase_name, notes } = req.body || {};
  if (!project_id) return res.status(400).json({ error: 'Projet requis' });
  try {
    const { rows: [project] } = await query(
      `SELECT id FROM projects WHERE id = $1 AND company_id = $2`,
      [project_id, req.company_id]
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

    const resolvedWorkerName = String(worker_name || req.user?.name || '').trim() || null;
    const { rows: [timesheet] } = await query(
      `INSERT INTO timesheets (
         company_id, project_id, user_id, worker_name, phase_name, notes, clock_in, method
       )
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),'manual')
       RETURNING *`,
      [
        req.company_id,
        project_id,
        req.user.userId || null,
        resolvedWorkerName,
        phase_name || null,
        notes || null,
      ]
    );
    res.status(201).json(timesheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', async (req, res) => {
  const { project_id, from, to } = req.query;
  let sql = `SELECT t.*, p.name AS project_name, p.address AS project_address,
               u.name AS user_name, s.name AS sub_name
             FROM timesheets t
             LEFT JOIN projects p ON p.id = t.project_id
             LEFT JOIN users u ON u.id = t.user_id
             LEFT JOIN subcontractors s ON s.id = t.subcontractor_id
             WHERE t.company_id = $1`;
  const params = [req.company_id];
  if (project_id) { params.push(project_id); sql += ` AND t.project_id = $${params.length}`; }
  if (from)        { params.push(from);       sql += ` AND t.clock_in >= $${params.length}`; }
  if (to)          { params.push(to);         sql += ` AND t.clock_in <= $${params.length}`; }
  sql += ' ORDER BY t.clock_in DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.patch('/:id/stop', async (req, res) => {
  const { phase_name, notes } = req.body || {};
  try {
    const { rows: [timesheet] } = await query(
      `UPDATE timesheets
          SET clock_out = NOW(),
              hours_total = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0, 2),
              phase_name = COALESCE($1, phase_name),
              notes = COALESCE($2, notes)
        WHERE id = $3
          AND company_id = $4
          AND clock_out IS NULL
        RETURNING *`,
      [phase_name || null, notes || null, req.params.id, req.company_id]
    );
    if (!timesheet) return res.status(404).json({ error: 'Punch non trouvé ou déjà arrêté' });
    res.json(timesheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id/approve', async (req, res) => {
  const { rows: [t] } = await query(
    `UPDATE timesheets SET approved_by = $1, approved_at = NOW()
     WHERE id = $2 RETURNING *`,
    [req.user.userId, req.params.id]
  );
  res.json(t);
});

export default router;
