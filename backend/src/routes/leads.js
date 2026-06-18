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
  const { contact_id, source, title, description, type_of_work, budget_min, budget_max, region, city, priority } = req.body;
  const { rows: [l] } = await query(
    `INSERT INTO leads (company_id,contact_id,source,title,description,type_of_work,budget_min,budget_max,region,city,priority)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.company_id, contact_id||null, source||'manual', title, description, type_of_work||'other',
     budget_min||null, budget_max||null, region||null, city||null, priority||'normal']
  );
  res.status(201).json(l);
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

export default router;
