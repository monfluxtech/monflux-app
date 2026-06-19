import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { status, source } = req.query;
  let sql = `SELECT l.*, c.name AS contact_name, c.phone AS contact_phone, c.email AS contact_email
             FROM leads l LEFT JOIN contacts c ON c.id = l.contact_id
             WHERE l.company_id = $1`;
  const params = [req.company_id];
  if (status) { params.push(status); sql += ` AND l.status = $${params.length}`; }
  if (source) { params.push(source); sql += ` AND l.source = $${params.length}`; }
  sql += ' ORDER BY l.created_at DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [l] } = await query(
    `SELECT l.*, c.name AS contact_name FROM leads l LEFT JOIN contacts c ON c.id = l.contact_id
     WHERE l.id = $1 AND l.company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!l) return res.status(404).json({ error: 'Lead non trouvé' });
  res.json(l);
});

router.post('/', async (req, res) => {
  const { contact_id, contact_name, contact_phone, contact_email, source, title, description, type_of_work, budget_min, budget_max, region, city, priority } = req.body;
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    let cid = contact_id || null;
    if (!cid && (contact_name || contact_phone || contact_email)) {
      // Upsert contact by email or phone
      const existing = contact_email
        ? await client.query(`SELECT id FROM contacts WHERE company_id=$1 AND email=$2 LIMIT 1`, [req.company_id, contact_email])
        : { rows: [] };
      if (existing.rows.length > 0) {
        cid = existing.rows[0].id;
        await client.query(`UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone) WHERE id=$3`, [contact_name||null, contact_phone||null, cid]);
      } else {
        const { rows: [c] } = await client.query(
          `INSERT INTO contacts (company_id,name,phone,email) VALUES ($1,$2,$3,$4) RETURNING id`,
          [req.company_id, contact_name||'', contact_phone||null, contact_email||null]
        );
        cid = c.id;
      }
    }
    const { rows: [l] } = await client.query(
      `INSERT INTO leads (company_id,contact_id,source,title,description,type_of_work,budget_min,budget_max,region,city,priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.company_id, cid, source||'manual', title, description, type_of_work||'other',
       budget_min||null, budget_max||null, region||null, city||null, priority||'normal']
    );
    await client.query('COMMIT');
    res.status(201).json({ ...l, contact_name: contact_name||null, contact_phone: contact_phone||null, contact_email: contact_email||null });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['status','title','description','type_of_work','budget_min','budget_max','priority','follow_up_at','ai_score','ai_notes','assigned_to'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (updates.status === 'won')  updates.won_at = new Date().toISOString();
  if (updates.status === 'lost') updates.lost_at = new Date().toISOString();
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [l] } = await query(
    `UPDATE leads SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  if (!l) return res.status(404).json({ error: 'Lead non trouvé' });
  res.json(l);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM leads WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
