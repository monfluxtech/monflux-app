import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

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

router.patch('/:id/approve', async (req, res) => {
  const { rows: [t] } = await query(
    `UPDATE timesheets SET approved_by = $1, approved_at = NOW()
     WHERE id = $2 RETURNING *`,
    [req.user.userId, req.params.id]
  );
  res.json(t);
});

export default router;
