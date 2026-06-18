import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT q.*, c.name AS client_name FROM quotes q
     LEFT JOIN contacts c ON c.id = (SELECT client_id FROM projects WHERE id = q.project_id LIMIT 1)
     WHERE q.company_id = $1 ORDER BY q.created_at DESC`,
    [req.company_id]
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [q] } = await query(`SELECT * FROM quotes WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
  const { rows: items } = await query(`SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`, [req.params.id]);
  res.json({ ...q, items });
});

router.post('/', async (req, res) => {
  const { project_id, lead_id, title, format, valid_until, items = [] } = req.body;
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    const { rows: [q] } = await client.query(
      `INSERT INTO quotes (company_id, project_id, lead_id, title, format, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.company_id, project_id||null, lead_id||null, title||'Soumission', format||'pdf', valid_until||null]
    );
    for (const [i, item] of items.entries()) {
      await client.query(
        `INSERT INTO quote_items (quote_id,type,name,qty,unit,unit_price,total,display_order,supplier,supplier_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [q.id, item.type||'material', item.name, item.qty||1, item.unit||'un.', item.unit_price||0,
         (item.qty||1)*(item.unit_price||0), i, item.supplier||null, item.supplier_url||null]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(q);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['status','title','valid_until','format','notes','followup_config','subtotal','total'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [q] } = await query(
    `UPDATE quotes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
  res.json(q);
});

export default router;
