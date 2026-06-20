import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/rapport/profitability — rentabilité par projet
router.get('/profitability', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.id, p.name, p.status,
              COALESCE(p.contract_value, 0) AS contract_value,
              COALESCE((SELECT SUM(amount) FROM project_expenses WHERE project_id = p.id), 0) AS total_expenses,
              COALESCE((SELECT SUM(total) FROM invoices WHERE project_id = p.id AND status NOT IN ('cancelled')), 0) AS total_invoiced,
              COALESCE((SELECT SUM(amount_paid) FROM invoices WHERE project_id = p.id AND status = 'paid'), 0) AS total_collected
       FROM projects p
       WHERE p.company_id = $1
       ORDER BY COALESCE(p.contract_value, 0) DESC
       LIMIT 25`,
      [req.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/rapport/member-hours — heures par membre
router.get('/member-hours', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         COALESCE(worker_name, punched_by_name, member_name, 'Inconnu') AS member,
         ROUND(SUM(hours_total)::numeric, 1) AS total_hours,
         COUNT(*) AS shifts
       FROM timesheets
       WHERE company_id = $1
       GROUP BY 1
       ORDER BY total_hours DESC
       LIMIT 20`,
      [req.company_id]
    ).catch(() => ({ rows: [] }));
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

// GET /api/rapport/sub-payments — soldes sous-traitants
router.get('/sub-payments', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.name, s.company_name,
              COALESCE(SUM(sp.amount), 0) AS total_owed,
              COALESCE(SUM(CASE WHEN sp.status = 'paid' THEN sp.amount ELSE 0 END), 0) AS total_paid,
              COALESCE(SUM(CASE WHEN sp.status = 'pending' THEN sp.amount ELSE 0 END), 0) AS total_pending
       FROM subcontractors s
       LEFT JOIN subcontractor_payments sp ON sp.subcontractor_id = s.id AND sp.company_id = $1
       WHERE s.company_id = $1
       GROUP BY s.id, s.name, s.company_name
       HAVING COALESCE(SUM(sp.amount), 0) > 0
       ORDER BY total_owed DESC`,
      [req.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

export default router;
