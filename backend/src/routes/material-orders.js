import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

// Global list (all projects)
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT mo.*, p.name AS project_name
       FROM material_orders mo
       LEFT JOIN projects p ON p.id = mo.project_id
       WHERE mo.company_id = $1
       ORDER BY mo.created_at DESC`,
      [req.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/project/:projectId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM material_orders
       WHERE company_id = $1 AND project_id = $2
       ORDER BY created_at DESC`,
      [req.company_id, req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  const { project_id, supplier, order_number, description, total_amount, order_date, expected_date, notes } = req.body;
  try {
    const { rows: [o] } = await query(
      `INSERT INTO material_orders
         (company_id, project_id, supplier, order_number, description, total_amount, order_date, expected_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.company_id, project_id, supplier, order_number || null, description || null,
       total_amount || null, order_date || null, expected_date || null, notes || null, req.user.userId]
    );
    res.status(201).json(o);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['supplier','order_number','description','status','total_amount','order_date','expected_date','received_date','notes'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  const sets = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals = fields.map(k => req.body[k]);
  try {
    const { rows: [o] } = await query(
      `UPDATE material_orders SET ${sets} WHERE id = $1 AND company_id = $${fields.length + 2} RETURNING *`,
      [req.params.id, ...vals, req.company_id]
    );
    if (!o) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(o);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query(
      `DELETE FROM material_orders WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
