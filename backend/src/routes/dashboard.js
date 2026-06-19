import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/summary', async (req, res) => {
  const cid = req.company_id;
  try {
    const [leads, projects, invoices, quotes, timesheets] = await Promise.all([
      query(`SELECT status FROM leads WHERE company_id = $1`, [cid]),
      query(`SELECT status, contract_value FROM projects WHERE company_id = $1`, [cid]),
      query(`SELECT status, total, amount_due, due_date FROM invoices WHERE company_id = $1`, [cid]),
      query(`SELECT status, total FROM quotes WHERE company_id = $1`, [cid]),
      query(`SELECT hours_total FROM timesheets WHERE company_id = $1`, [cid]),
    ]);

    const active_projects  = projects.rows.filter(p => p.status === 'active').length;
    const total_revenue    = invoices.rows.reduce((s,i) => s + Number(i.total||0), 0);
    const outstanding      = invoices.rows.filter(i => ['sent','viewed','partial','overdue'].includes(i.status)).reduce((s,i) => s + Number(i.amount_due||0), 0);
    const overdue_count    = invoices.rows.filter(i => i.status === 'overdue').length;
    const pipeline_value   = quotes.rows.filter(q => ['draft','sent','viewed'].includes(q.status)).reduce((s,q) => s + Number(q.total||0), 0);
    const new_leads        = leads.rows.filter(l => l.status === 'new').length;
    const total_hours      = timesheets.rows.reduce((s,t) => s + Number(t.hours_total||0), 0);

    res.json({
      active_projects,
      total_revenue,
      outstanding,
      overdue_count,
      pipeline_value,
      new_leads,
      total_hours,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Recent activity feed (last 20 events across all entities)
router.get('/activity', async (req, res) => {
  const cid = req.company_id;
  try {
    const [leads, quotes, invoices, projects, ts] = await Promise.all([
      query(
        `SELECT id, title AS label, status, created_at AS ts, 'lead' AS type FROM leads
         WHERE company_id = $1 ORDER BY created_at DESC LIMIT 8`, [cid]
      ),
      query(
        `SELECT id, title AS label, status, created_at AS ts, 'quote' AS type FROM quotes
         WHERE company_id = $1 ORDER BY created_at DESC LIMIT 8`, [cid]
      ),
      query(
        `SELECT id, number AS label, status, created_at AS ts, 'invoice' AS type FROM invoices
         WHERE company_id = $1 ORDER BY created_at DESC LIMIT 8`, [cid]
      ),
      query(
        `SELECT id, name AS label, status, created_at AS ts, 'project' AS type FROM projects
         WHERE company_id = $1 ORDER BY created_at DESC LIMIT 6`, [cid]
      ),
      query(
        `SELECT id, worker_name AS label, 'active' AS status, clock_in AS ts, 'punch' AS type FROM timesheets
         WHERE company_id = $1 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 5`, [cid]
      ),
    ]);

    const all = [
      ...leads.rows, ...quotes.rows, ...invoices.rows,
      ...projects.rows, ...ts.rows,
    ]
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, 20);

    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
