import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { status, project_id } = req.query;
  let sql = `SELECT * FROM invoices WHERE company_id = $1`;
  const params = [req.company_id];
  if (status)     { params.push(status);     sql += ` AND status = $${params.length}`; }
  if (project_id) { params.push(project_id); sql += ` AND project_id = $${params.length}`; }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [inv] } = await query(`SELECT * FROM invoices WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  if (!inv) return res.status(404).json({ error: 'Facture non trouvée' });
  const { rows: items } = await query(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY order_idx`, [req.params.id]);
  res.json({ ...inv, items });
});

router.post('/', async (req, res) => {
  const { project_id, milestone_id, client_name, client_email, due_date, items = [], tps_pct = 5, tvq_pct = 9.975 } = req.body;
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    const subtotal = items.reduce((s, i) => s + (i.qty||1) * (i.unit_price||0), 0);
    const tps = subtotal * tps_pct / 100;
    const tvq = subtotal * tvq_pct / 100;
    const total = subtotal + tps + tvq;
    const { rows: [count] } = await client.query(`SELECT COUNT(*)+1 AS n FROM invoices WHERE company_id = $1`, [req.company_id]);
    const number = `INV-${String(count.n).padStart(4,'0')}`;
    const { rows: [inv] } = await client.query(
      `INSERT INTO invoices (company_id,project_id,milestone_id,number,client_name,client_email,due_date,
         subtotal,tps_pct,tvq_pct,tps_amount,tvq_amount,total,amount_due)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.company_id, project_id||null, milestone_id||null, number, client_name, client_email, due_date||null,
       subtotal, tps_pct, tvq_pct, tps, tvq, total, total]
    );
    for (const [i, item] of items.entries()) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id,description,qty,unit_price,total,order_idx) VALUES ($1,$2,$3,$4,$5,$6)`,
        [inv.id, item.description, item.qty||1, item.unit_price||0, (item.qty||1)*(item.unit_price||0), i]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(inv);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['status','due_date','notes','next_reminder_at'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [inv] } = await query(
    `UPDATE invoices SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  res.json(inv);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM invoices WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
