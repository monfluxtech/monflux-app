import express from 'express';
import { query, getClient } from '../db.js';
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
  const hasItems = Array.isArray(req.body.items);

  // If line items are provided, replace them and recompute totals inside a transaction.
  if (hasItems) {
    const items = req.body.items;
    const subtotal = items.reduce((s, it) => s + (Number(it.qty)||1) * (Number(it.unit_price)||0), 0);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Ownership check
      const { rows: [own] } = await client.query(`SELECT id FROM quotes WHERE id=$1 AND company_id=$2`, [req.params.id, req.company_id]);
      if (!own) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Soumission non trouvée' }); }

      await client.query(`DELETE FROM quote_items WHERE quote_id=$1`, [req.params.id]);
      for (const [i, item] of items.entries()) {
        await client.query(
          `INSERT INTO quote_items (quote_id,type,name,qty,unit,unit_price,total,display_order,supplier,supplier_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [req.params.id, item.type||'material', item.name, item.qty||1, item.unit||'un.', item.unit_price||0,
           (Number(item.qty)||1)*(Number(item.unit_price)||0), i, item.supplier||null, item.supplier_url||null]
        );
      }
      // Merge explicit field updates with recomputed totals
      const merged = { ...updates, subtotal, total: subtotal };
      const setClause = Object.keys(merged).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(merged), req.params.id];
      const { rows: [q] } = await client.query(
        `UPDATE quotes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      );
      await client.query('COMMIT');
      const { rows: savedItems } = await query(`SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY display_order`, [req.params.id]);
      return res.json({ ...q, items: savedItems });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
      client.release();
    }
  }

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [q] } = await query(
    `UPDATE quotes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
  res.json(q);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM quotes WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

router.post('/:id/convert', async (req, res) => {
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    const { rows: [q] } = await client.query(
      `SELECT q.*, l.title AS lead_title, l.id AS l_id, c.name AS client_name, c.email AS client_email
       FROM quotes q
       LEFT JOIN leads l ON l.id = q.lead_id
       LEFT JOIN contacts c ON c.id = l.contact_id
       WHERE q.id = $1 AND q.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!q) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Soumission non trouvée' }); }

    // Create project
    const { rows: [proj] } = await client.query(
      `INSERT INTO projects (company_id,name,status,type_of_work,budget_total)
       VALUES ($1,$2,'active',$3,$4) RETURNING *`,
      [req.company_id, q.title || q.lead_title || 'Nouveau projet', q.type_of_work || 'other', q.total || 0]
    );

    // Link quote to project
    await client.query(`UPDATE quotes SET project_id=$1, status='converted' WHERE id=$2`, [proj.id, q.id]);

    // Mark lead as won
    if (q.l_id) {
      await client.query(`UPDATE leads SET status='won', won_at=NOW() WHERE id=$1`, [q.l_id]);
    }

    // Create first invoice (acompte 30%)
    const acompte = Math.round((Number(q.total) || 0) * 0.3 * 100) / 100;
    const { rows: [count] } = await client.query(`SELECT COUNT(*)+1 AS n FROM invoices WHERE company_id=$1`, [req.company_id]);
    const number = `FAC-${String(count.n).padStart(4,'0')}`;
    const { rows: [inv] } = await client.query(
      `INSERT INTO invoices (company_id,project_id,number,client_name,client_email,subtotal,tps_pct,tvq_pct,tps_amount,tvq_amount,total,amount_due,status)
       VALUES ($1,$2,$3,$4,$5,$6,5,9.975,$7,$8,$9,$10,'draft') RETURNING *`,
      [req.company_id, proj.id, number, q.client_name||'Client', q.client_email||null,
       acompte, acompte*0.05, acompte*0.09975,
       acompte*(1+0.05+0.09975), acompte*(1+0.05+0.09975)]
    );
    await client.query(
      `INSERT INTO invoice_items (invoice_id,description,qty,unit_price,total,order_idx) VALUES ($1,$2,1,$3,$4,0)`,
      [inv.id, 'Acompte (30%)', acompte, acompte]
    );

    await client.query('COMMIT');
    res.status(201).json({ project: proj, invoice: inv });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

export default router;
