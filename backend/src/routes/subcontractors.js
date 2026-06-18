import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { rows } = await query(`SELECT * FROM subcontractors WHERE company_id = $1 ORDER BY name`, [req.company_id]);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, company_name, email, phone, whatsapp, rbq_number, specialties, hourly_rate, day_rate, is_preferred, notes } = req.body;
  const { rows: [s] } = await query(
    `INSERT INTO subcontractors (company_id,name,company_name,email,phone,whatsapp,rbq_number,specialties,hourly_rate,day_rate,is_preferred,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.company_id, name, company_name, email, phone, whatsapp, rbq_number, specialties||[], hourly_rate||null, day_rate||null, is_preferred||false, notes]
  );
  res.status(201).json(s);
});

router.patch('/:id', async (req, res) => {
  const allowed = ['name','company_name','email','phone','whatsapp','rbq_number','specialties','hourly_rate','day_rate','is_preferred','rating','notes'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [s] } = await query(
    `UPDATE subcontractors SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  res.json(s);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM subcontractors WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
