import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/quittances?project_id=
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  let sql = `SELECT q.*, p.name AS project_name
             FROM quittances q
             LEFT JOIN projects p ON p.id = q.project_id
             WHERE q.company_id = $1`;
  const params = [req.company_id];
  if (project_id) { params.push(project_id); sql += ` AND q.project_id = $${params.length}`; }
  sql += ' ORDER BY q.created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

// POST /api/quittances
router.post('/', async (req, res) => {
  const { project_id, client_name, client_email, project_description, amount_paid, notes } = req.body;
  if (!client_name) return res.status(400).json({ error: 'Nom du client requis' });

  const { rows: [q] } = await query(
    `INSERT INTO quittances
       (company_id, project_id, client_name, client_email, project_description, amount_paid, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [req.company_id, project_id||null, client_name, client_email||null, project_description||null, amount_paid||0, notes||null]
  );
  res.status(201).json(q);
});

// PATCH /api/quittances/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['client_name','client_email','project_description','amount_paid','notes','status'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Rien à mettre à jour' });

  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [q] } = await query(
    `UPDATE quittances SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND company_id = $${values.length}
     RETURNING *`,
    values
  );
  res.json(q);
});

// DELETE /api/quittances/:id
router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM quittances WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
