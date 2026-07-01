import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
import { logActivity } from '../activityLog.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  // Auto-mark overdue invoices before returning
  await query(
    `UPDATE invoices SET status = 'overdue', updated_at = NOW()
     WHERE company_id = $1 AND due_date < CURRENT_DATE AND status IN ('sent','viewed','partial')`,
    [req.company_id]
  );

  const { status, project_id } = req.query;
  let sql = `SELECT * FROM invoices WHERE company_id = $1`;
  const params = [req.company_id];
  if (status)     { params.push(status);     sql += ` AND status = $${params.length}`; }
  if (project_id) { params.push(project_id); sql += ` AND project_id = $${params.length}`; }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/project/:projectId/invoiced-descriptions', async (req, res) => {
  const { rows } = await query(
    `SELECT DISTINCT ii.description FROM invoice_items ii
     JOIN invoices i ON i.id = ii.invoice_id
     WHERE i.project_id = $1 AND i.company_id = $2 AND i.status != 'cancelled'`,
    [req.params.projectId, req.company_id]
  );
  res.json(rows.map((r) => r.description));
});

router.get('/:id', async (req, res) => {
  const { rows: [inv] } = await query(`SELECT * FROM invoices WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  if (!inv) return res.status(404).json({ error: 'Facture non trouvée' });
  const { rows: items } = await query(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY order_idx`, [req.params.id]);
  res.json({ ...inv, items });
});

router.post('/', async (req, res) => {
  const { project_id, milestone_id, client_name, client_email, due_date, notes, category_notes, detail_level, items = [], tps_pct = 5, tvq_pct = 9.975 } = req.body;
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
      `INSERT INTO invoices (company_id,project_id,milestone_id,number,client_name,client_email,due_date,notes,category_notes,detail_level,
         subtotal,tps_pct,tvq_pct,tps_amount,tvq_amount,total,amount_due)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [req.company_id, project_id||null, milestone_id||null, number, client_name, client_email, due_date||null, notes||null,
       category_notes ? JSON.stringify(category_notes) : '{}', detail_level || 'detailed',
       subtotal, tps_pct, tvq_pct, tps, tvq, total, total]
    );
    for (const [i, item] of items.entries()) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id,description,qty,unit_price,total,order_idx,type) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [inv.id, item.description, item.qty||1, item.unit_price||0, (item.qty||1)*(item.unit_price||0), i, item.type || 'other']
      );
    }
    await client.query('COMMIT');
    if (inv.project_id) {
      logActivity({ companyId: req.company_id, projectId: inv.project_id, userId: req.user.userId, action: 'invoice_created', payload: { number: inv.number, total: inv.total } });
    }
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
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    const { items, ...incoming } = req.body || {};
    const allowed = ['status','due_date','notes','next_reminder_at','amount_due','amount_paid','paid_at','payment_method','client_name','client_email','client_address','tps_pct','tvq_pct','category_notes','detail_level'];
    const updates = Object.fromEntries(Object.entries(incoming).filter(([k]) => allowed.includes(k)));
    if (updates.category_notes) updates.category_notes = JSON.stringify(updates.category_notes);

    const { rows: [current] } = await client.query(
      `SELECT * FROM invoices WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!current) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    let invoice = current;
    let safeItems = null;

    if (Array.isArray(items)) {
      safeItems = items.map((item, index) => {
        const qty = Number(item.qty) || 0;
        const unit_price = Number(item.unit_price) || 0;
        return {
          description: String(item.description || '').trim() || 'Poste',
          qty,
          unit_price,
          total: qty * unit_price,
          order_idx: index,
          type: item.type || 'other',
        };
      });
      const subtotal = safeItems.reduce((sum, item) => sum + item.total, 0);
      const tps_pct = Number(updates.tps_pct ?? current.tps_pct ?? 5);
      const tvq_pct = Number(updates.tvq_pct ?? current.tvq_pct ?? 9.975);
      const tps_amount = subtotal * tps_pct / 100;
      const tvq_amount = subtotal * tvq_pct / 100;
      const total = subtotal + tps_amount + tvq_amount;
      const amount_paid = Number(updates.amount_paid ?? current.amount_paid ?? 0);
      updates.subtotal = subtotal;
      updates.tps_pct = tps_pct;
      updates.tvq_pct = tvq_pct;
      updates.tps_amount = tps_amount;
      updates.tvq_amount = tvq_amount;
      updates.total = total;
      updates.amount_due = Math.max(total - amount_paid, 0);
    }

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(updates), req.params.id, req.company_id];
      const result = await client.query(
        `UPDATE invoices SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
        values
      );
      invoice = result.rows[0];
    }

    if (safeItems) {
      await client.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [req.params.id]);
      for (const item of safeItems) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id,description,qty,unit_price,total,order_idx,type) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [req.params.id, item.description, item.qty, item.unit_price, item.total, item.order_idx, item.type]
        );
      }
    }

    const { rows: updatedItems } = await client.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY order_idx`,
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json({ ...invoice, items: updatedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM invoices WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
