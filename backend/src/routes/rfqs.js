import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, p.name AS project_name FROM rfqs r LEFT JOIN projects p ON p.id = r.project_id
     WHERE r.company_id = $1 ORDER BY r.created_at DESC`,
    [req.company_id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { project_id, phase_id, title, description, specialty, deadline } = req.body;
  const { rows: [r] } = await query(
    `INSERT INTO rfqs (company_id,project_id,phase_id,title,description,specialty,deadline,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.company_id, project_id||null, phase_id||null, title, description, specialty, deadline||null, req.user.userId]
  );
  res.status(201).json(r);
});

// POST /api/rfqs/:id/invite — invite subcontractors
router.post('/:id/invite', async (req, res) => {
  const { subcontractor_ids } = req.body;
  for (const sid of subcontractor_ids || []) {
    await query(
      `INSERT INTO rfq_responses (rfq_id, subcontractor_id, sent_at) VALUES ($1,$2,NOW())
       ON CONFLICT DO NOTHING`,
      [req.params.id, sid]
    );
  }
  res.json({ invited: subcontractor_ids?.length || 0 });
});

export default router;
