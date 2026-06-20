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

// GET /:id/portal — obtenir (ou générer) le token de portail
router.get('/:id/portal', async (req, res) => {
  let { rows: [s] } = await query(
    `SELECT id, portal_token FROM subcontractors WHERE id = $1 AND company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!s) return res.status(404).json({ error: 'Sous-traitant introuvable' });
  if (!s.portal_token) {
    ({ rows: [s] } = await query(
      `UPDATE subcontractors SET portal_token = gen_random_uuid() WHERE id = $1 RETURNING id, portal_token`,
      [req.params.id]
    ));
  }
  res.json({ portal_token: s.portal_token });
});

// GET /:id/payments
router.get('/:id/payments', async (req, res) => {
  const { rows } = await query(
    `SELECT sp.*, p.name AS project_name
     FROM subcontractor_payments sp
     LEFT JOIN projects p ON p.id = sp.project_id
     WHERE sp.subcontractor_id = $1 AND sp.company_id = $2
     ORDER BY sp.created_at DESC`,
    [req.params.id, req.company_id]
  );
  res.json(rows);
});

// POST /:id/payments
router.post('/:id/payments', async (req, res) => {
  const { project_id, amount, description, payment_date, payment_method, status, invoice_ref } = req.body;
  const { rows: [p] } = await query(
    `INSERT INTO subcontractor_payments (company_id, subcontractor_id, project_id, amount, description, payment_date, payment_method, status, invoice_ref)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.company_id, req.params.id, project_id || null, amount, description || null,
     payment_date || null, payment_method || 'virement', status || 'pending', invoice_ref || null]
  );
  res.status(201).json(p);
});

// PATCH /:id/payments/:pid
router.patch('/:id/payments/:pid', async (req, res) => {
  const allowed = ['amount', 'description', 'payment_date', 'payment_method', 'status', 'invoice_ref'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.json({});
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.pid, req.company_id];
  const { rows: [p] } = await query(
    `UPDATE subcontractor_payments SET ${setClause} WHERE id = $${values.length - 1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  res.json(p || {});
});

// DELETE /:id/payments/:pid
router.delete('/:id/payments/:pid', async (req, res) => {
  await query(`DELETE FROM subcontractor_payments WHERE id = $1 AND company_id = $2`, [req.params.pid, req.company_id]);
  res.json({ success: true });
});

export default router;
