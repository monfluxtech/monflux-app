/**
 * ⚡ DEV-ONLY routes — plan switcher without Stripe
 * Mounted at /api/dev only when NODE_ENV !== 'production'
 */
import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dev/plans — list available plans
router.get('/plans', authenticateToken, async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, name, base_price, per_seat_price, included_seats, features FROM plans ORDER BY base_price`
  );
  res.json(rows);
});

// GET /api/dev/current — show current effective plan
router.get('/current', authenticateToken, resolveCompany, async (req, res) => {
  const { rows } = await query(
    `SELECT es.*, p.slug, p.name, p.features
     FROM effective_subscriptions es
     JOIN plans p ON p.id = es.plan_id
     WHERE es.company_id = $1`,
    [req.company_id]
  );
  res.json(rows[0] || null);
});

// POST /api/dev/switch — override active plan
router.post('/switch', authenticateToken, resolveCompany, async (req, res) => {
  const { plan_slug, seats, note } = req.body;
  if (!plan_slug) return res.status(400).json({ error: 'plan_slug requis' });

  const { rows: [plan] } = await query(`SELECT id FROM plans WHERE slug = $1`, [plan_slug]);
  if (!plan) return res.status(404).json({ error: `Plan "${plan_slug}" introuvable` });

  // Upsert the override
  await query(
    `INSERT INTO dev_plan_overrides (company_id, plan_id, seats_override, note, set_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (company_id) DO UPDATE SET
       plan_id = EXCLUDED.plan_id,
       seats_override = EXCLUDED.seats_override,
       note = EXCLUDED.note,
       set_by = EXCLUDED.set_by,
       is_active = TRUE,
       created_at = NOW()`,
    [req.company_id, plan.id, seats || null, note || `Switched to ${plan_slug} via DEV`, req.user.userId]
  );

  res.json({ success: true, plan_slug, seats: seats || null, note });
});

// DELETE /api/dev/switch — clear override (revert to real subscription)
router.delete('/switch', authenticateToken, resolveCompany, async (req, res) => {
  await query(
    `UPDATE dev_plan_overrides SET is_active = FALSE WHERE company_id = $1`,
    [req.company_id]
  );
  res.json({ success: true, message: 'Override supprimé — forfait réel restauré' });
});

export default router;
