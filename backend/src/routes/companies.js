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
    'default_deposit_pct','payment_terms_days','modules_enabled','social_links',
    'default_labor_cost_rate','pipeline_stages'];
  // pipeline_stages is a JSONB *array* — node-pg would encode a JS array as a
  // Postgres array, not JSON. Stringify JSONB fields so they land as jsonb.
  const JSONB_FIELDS = ['modules_enabled','social_links','pipeline_stages'];
  const updates = Object.fromEntries(
    Object.entries(req.body)
      .filter(([k]) => allowed.includes(k))
      .map(([k, v]) => [k, JSONB_FIELDS.includes(k) && v != null ? JSON.stringify(v) : v])
  );
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
    'ai_auto_followup','ai_followup_delay_days','landing_preference','custom_fields','automations',
    'lead_sources'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.company_id];
  const { rows: [cfg] } = await query(
    `UPDATE company_config SET ${setClause}, updated_at = NOW() WHERE company_id = $${values.length} RETURNING *`,
    values
  );
  res.json(cfg);
});

// PATCH /api/companies/config/lead-sources/:source — toggle/configure une source individuelle
router.patch('/config/lead-sources/:source', async (req, res) => {
  const VALID_SOURCES = ['soumissions_reno','facebook_ads','google_lsa','kijiji'];
  const { source } = req.params;
  if (!VALID_SOURCES.includes(source)) {
    return res.status(400).json({ error: `Source invalide. Valeurs: ${VALID_SOURCES.join(', ')}` });
  }

  const { enabled, frequency_hours, max_per_run } = req.body;

  // Merge patch into the JSONB key for this source only
  const patch = {};
  if (enabled !== undefined)        patch.enabled = Boolean(enabled);
  if (frequency_hours !== undefined) patch.frequency_hours = Number(frequency_hours);
  if (max_per_run !== undefined)     patch.max_per_run = Number(max_per_run);

  const { rows: [cfg] } = await query(
    `UPDATE company_config
     SET lead_sources = jsonb_set(
           COALESCE(lead_sources, '{}'),
           $1::text[],
           COALESCE(lead_sources->$2, '{}') || $3::jsonb
         ),
         updated_at = NOW()
     WHERE company_id = $4
     RETURNING lead_sources`,
    [
      `{${source}}`,
      source,
      JSON.stringify(patch),
      req.company_id,
    ]
  );
  res.json({ source, config: cfg?.lead_sources?.[source] || patch });
});

export default router;
