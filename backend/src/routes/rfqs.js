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

// GET /api/rfqs/project/:projectId — RFQs for a specific project with response counts
router.get('/project/:projectId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT r.*,
         (SELECT COUNT(*) FROM rfq_responses rr WHERE rr.rfq_id = r.id) AS responses_count
       FROM rfqs r
       WHERE r.company_id = $1 AND r.project_id = $2
       ORDER BY r.created_at DESC`,
      [req.company_id, req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/rfqs/:id — single RFQ with subcontractor responses
router.get('/:id', async (req, res) => {
  try {
    const { rows: [r] } = await query(
      `SELECT * FROM rfqs WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!r) return res.status(404).json({ error: 'RFQ non trouvée' });
    const { rows: responses } = await query(
      `SELECT rr.*, s.name AS sub_name, s.company_name, s.email, s.phone
       FROM rfq_responses rr
       LEFT JOIN subcontractors s ON s.id = rr.subcontractor_id
       WHERE rr.rfq_id = $1`,
      [req.params.id]
    );
    res.json({ ...r, responses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
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
