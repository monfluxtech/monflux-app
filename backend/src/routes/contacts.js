import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { type, q } = req.query;
  let sql = `SELECT * FROM contacts WHERE company_id = $1`;
  const params = [req.company_id];
  if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
  if (q)    { params.push(`%${q}%`); sql += ` AND name ILIKE $${params.length}`; }
  sql += ' ORDER BY name';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [c] } = await query(
    `SELECT * FROM contacts WHERE id = $1 AND company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!c) return res.status(404).json({ error: 'Contact non trouvé' });
  res.json(c);
});

router.post('/', async (req, res) => {
  const { name, type, email, phone, whatsapp, address, city, company_name, notes, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const { rows: [c] } = await query(
    `INSERT INTO contacts (company_id,name,type,email,phone,whatsapp,address,city,company_name,notes,tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.company_id, name, type||'prospect', email, phone, whatsapp, address, city, company_name, notes, tags||[]]
  );
  res.status(201).json(c);
});

router.patch('/:id', async (req, res) => {
  const allowed = ['name','type','email','phone','whatsapp','address','city','company_name','notes','tags'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [c] } = await query(
    `UPDATE contacts SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  if (!c) return res.status(404).json({ error: 'Contact non trouvé' });
  res.json(c);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM contacts WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
