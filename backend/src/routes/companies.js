import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { rows: [c] } = await query(`SELECT * FROM companies WHERE id = $1`, [req.company_id]);
  if (!c) return res.status(404).json({ error: 'Compagnie non trouvée' });
  const { rows: [cfg] } = await query(`SELECT * FROM company_config WHERE company_id = $1`, [req.company_id]);
  res.json({ ...c, config: cfg });
});

router.patch('/', async (req, res) => {
  const allowed = ['name','rbq_number','neq_number','logo_url','address','city','postal_code',
    'phone','email','website','sector','size','tps_number','tvq_number',
    'default_deposit_pct','payment_terms_days','modules_enabled'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.company_id];
  const { rows: [c] } = await query(
    `UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  res.json(c);
});

router.patch('/config', async (req, res) => {
  const allowed = ['preferred_suppliers','ai_auto_read_email','ai_auto_detect_leads',
    'ai_auto_followup','ai_followup_delay_days','landing_preference','custom_fields','automations'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.company_id];
  const { rows: [cfg] } = await query(
    `UPDATE company_config SET ${setClause}, updated_at = NOW() WHERE company_id = $${values.length} RETURNING *`,
    values
  );
  res.json(cfg);
});

export default router;
