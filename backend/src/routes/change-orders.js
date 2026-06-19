import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/change-orders?project_id=xxx
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    const base = `SELECT co.*, p.name AS project_name
                  FROM change_orders co
                  LEFT JOIN projects p ON p.id = co.project_id
                  WHERE co.company_id = $1`;
    const { rows } = project_id
      ? await query(`${base} AND co.project_id = $2 ORDER BY co.created_at DESC`, [req.company_id, project_id])
      : await query(`${base} ORDER BY co.created_at DESC`, [req.company_id]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/change-orders
router.post('/', async (req, res) => {
  const { project_id, title, description, amount, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  try {
    const { rows: [co] } = await query(
      `INSERT INTO change_orders (company_id, project_id, title, description, amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.company_id, project_id || null, title, description || null, amount || 0, notes || null]
    );
    res.status(201).json(co);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/change-orders/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['title', 'description', 'amount', 'status', 'notes'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  const set = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const vals = [...Object.values(updates), req.params.id, req.company_id];
  try {
    const { rows: [co] } = await query(
      `UPDATE change_orders SET ${set}, updated_at = NOW()
       WHERE id = $${vals.length - 1} AND company_id = $${vals.length} RETURNING *`,
      vals
    );
    if (!co) return res.status(404).json({ error: 'Non trouvé' });
    res.json(co);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/change-orders/:id
router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM change_orders WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;
