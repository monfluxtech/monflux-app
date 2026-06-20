import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/projects — list all projects for company (Gantt feed)
router.get('/', async (req, res) => {
  try {
    // Scalar subqueries keep the per-project financials correct (joining phases +
    // members + timesheets at once would fan out and multiply the SUMs).
    const { rows } = await query(
      `SELECT p.*,
              c.name AS client_name, c.email AS client_email, c.phone AS client_phone,
              (SELECT COUNT(*) FROM project_phases pp WHERE pp.project_id = p.id) AS phase_count,
              (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count,
              (SELECT COALESCE(SUM(ts.hours_total),0) FROM timesheets ts WHERE ts.project_id = p.id) AS total_hours_logged,
              (SELECT COALESCE(SUM(i.total),0) FROM invoices i
                 WHERE i.project_id = p.id AND i.status <> 'draft') AS invoiced_real,
              (SELECT COALESCE(SUM(e.amount),0) FROM project_expenses e WHERE e.project_id = p.id) AS expenses_real,
              (SELECT COALESCE(SUM(tr.estimated_cost),0) FROM project_trades tr WHERE tr.project_id = p.id) AS trades_estimated_cost,
              (SELECT COALESCE(SUM(ts.hours_total * COALESCE(sc.hourly_rate, comp.default_labor_cost_rate)),0)
                 FROM timesheets ts
                 LEFT JOIN subcontractors sc ON sc.id = ts.subcontractor_id
                 WHERE ts.project_id = p.id) AS labor_cost_real
       FROM projects p
       LEFT JOIN contacts c ON c.id = p.client_id
       LEFT JOIN companies comp ON comp.id = p.company_id
       WHERE p.company_id = $1
       ORDER BY p.start_date ASC NULLS LAST, p.created_at DESC`,
      [req.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/projects/:id — project detail with phases & milestones
router.get('/:id', async (req, res) => {
  try {
    const { rows: [project] } = await query(
      `SELECT p.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone
       FROM projects p
       LEFT JOIN contacts c ON c.id = p.client_id
       WHERE p.id = $1 AND p.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

    const [{ rows: phases }, { rows: milestones }, { rows: members }, { rows: docs }, { rows: trades }, { rows: expenses }] = await Promise.all([
      query(`SELECT * FROM project_phases WHERE project_id = $1 ORDER BY display_order`, [req.params.id]),
      query(`SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY due_date`, [req.params.id]),
      query(
        `SELECT pm.*, u.name, u.email, u.avatar_url, s.name AS sub_name
         FROM project_members pm
         LEFT JOIN users u ON u.id = pm.user_id
         LEFT JOIN subcontractors s ON s.id = pm.subcontractor_id
         WHERE pm.project_id = $1`,
        [req.params.id]
      ),
      query(
        `SELECT id, type, name, file_url, mime_type, extraction_done, created_at
         FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC`,
        [req.params.id]
      ),
      query(
        `SELECT t.*, s.name AS subcontractor_name, s.company_name AS subcontractor_company,
                s.phone AS subcontractor_phone, s.hourly_rate AS subcontractor_hourly_rate
         FROM project_trades t
         LEFT JOIN subcontractors s ON s.id = t.chosen_subcontractor_id
         WHERE t.project_id = $1 ORDER BY t.created_at`,
        [req.params.id]
      ),
      query(
        `SELECT e.*, s.name AS subcontractor_name
         FROM project_expenses e
         LEFT JOIN subcontractors s ON s.id = e.subcontractor_id
         WHERE e.project_id = $1 ORDER BY e.expense_date DESC NULLS LAST, e.created_at DESC`,
        [req.params.id]
      ),
    ]);

    res.json({ ...project, phases, milestones, members, documents: docs, trades, expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  const {
    name, description, type, status, address, city, postal_code,
    client_id, lead_id, start_date, end_date, contract_value,
    budget_materials, budget_labor, created_from_project,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Nom du projet requis' });

  try {
    const { rows: [project] } = await query(
      `INSERT INTO projects
         (company_id, name, description, type, status, address, city, postal_code,
          client_id, lead_id, start_date, end_date, contract_value,
          budget_materials, budget_labor, created_from_project)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.company_id, name, description, type || 'other', status || 'brouillon',
        address, city, postal_code, client_id || null, lead_id || null,
        start_date || null, end_date || null, contract_value || null,
        budget_materials || null, budget_labor || null, created_from_project || null,
      ]
    );

    // If reusing a past project, copy its phases
    if (created_from_project) {
      const { rows: sourcePhases } = await query(
        `SELECT * FROM project_phases WHERE project_id = $1`,
        [created_from_project]
      );
      for (const phase of sourcePhases) {
        await query(
          `INSERT INTO project_phases (project_id, name, display_order, color, status)
           VALUES ($1,$2,$3,$4,'not_started')`,
          [project.id, phase.name, phase.display_order, phase.color]
        );
      }
    }

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name','description','type','status','address','city','postal_code',
    'start_date','end_date','contract_value','budget_materials','budget_labor','progress_pct','notes'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'Aucun champ valide fourni' });
  }

  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];

  try {
    const { rows: [project] } = await query(
      `UPDATE projects SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND company_id = $${values.length}
       RETURNING *`,
      values
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM projects WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects/:id/reset-portal-token — regenerate the public portal link
router.post('/:id/reset-portal-token', async (req, res) => {
  try {
    const { rows: [project] } = await query(
      `UPDATE projects SET portal_token = gen_random_uuid()
       WHERE id = $1 AND company_id = $2
       RETURNING portal_token`,
      [req.params.id, req.company_id]
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json({ portal_token: project.portal_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects/:id/phases
router.post('/:id/phases', async (req, res) => {
  const { name, display_order, color, start_date, end_date } = req.body;
  try {
    const { rows: [phase] } = await query(
      `INSERT INTO project_phases (project_id, name, display_order, color, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, name, display_order ?? 0, color || '#F26522', start_date || null, end_date || null]
    );
    res.status(201).json(phase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/projects/:id/phases/:phaseId
router.patch('/:id/phases/:phaseId', async (req, res) => {
  const allowed = ['name','status','color','start_date','end_date','actual_start','actual_end','progress_pct','display_order'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.phaseId];
  try {
    const { rows: [phase] } = await query(
      `UPDATE project_phases SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(phase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Geocode an address via OpenStreetMap Nominatim (free, no API key). Best-effort.
async function geocodeAddress(parts) {
  const q = parts.filter(Boolean).join(', ');
  if (!q.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=${encodeURIComponent(q)}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'MONFLUX/2.0 (construction SaaS)' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch (err) {
    console.warn('geocode error:', err.message);
    return null;
  }
}

// POST /api/projects/:id/geocode — resolve the project address to map coordinates
router.post('/:id/geocode', async (req, res) => {
  try {
    const { rows: [p] } = await query(
      `SELECT id, address, city FROM projects WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });
    const coords = await geocodeAddress([p.address, p.city, 'Québec', 'Canada']);
    if (!coords) return res.status(422).json({ error: 'Adresse introuvable sur la carte' });
    const { rows: [updated] } = await query(
      `UPDATE projects SET latitude = $1, longitude = $2, geocoded_at = NOW()
       WHERE id = $3 AND company_id = $4 RETURNING id, latitude, longitude`,
      [coords.lat, coords.lng, req.params.id, req.company_id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/projects/:id/portal-messages — contractor reads client feedback
router.get('/:id/portal-messages', async (req, res) => {
  try {
    const { rows: [p] } = await query(
      `SELECT id FROM projects WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });
    const { rows } = await query(
      `SELECT id, author_name, content, created_at
       FROM portal_messages WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Batch J — Rentabilité (théorique + réelle) ────────────────────────────────
// GET /api/projects/:id/profitability
// Théorique = montant de commande + coûts estimés (budgets + RFQ/métiers).
// Réelle    = factures clients émises − (punch × taux + dépenses/factures fournisseurs).
router.get('/:id/profitability', async (req, res) => {
  try {
    const { rows: [p] } = await query(
      `SELECT p.id, p.contract_value, p.budget_materials, p.budget_labor,
              comp.default_labor_cost_rate
       FROM projects p
       LEFT JOIN companies comp ON comp.id = p.company_id
       WHERE p.id = $1 AND p.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });

    const [{ rows: [t] }, { rows: [r] }] = await Promise.all([
      query(`SELECT COALESCE(SUM(estimated_cost),0) AS trades_est FROM project_trades WHERE project_id = $1`, [req.params.id]),
      query(
        `SELECT
           (SELECT COALESCE(SUM(i.total),0) FROM invoices i
              WHERE i.project_id = $1 AND i.status <> 'draft') AS invoiced,
           (SELECT COALESCE(SUM(e.amount),0) FROM project_expenses e WHERE e.project_id = $1) AS expenses,
           (SELECT COALESCE(SUM(ts.hours_total),0) FROM timesheets ts WHERE ts.project_id = $1) AS hours,
           (SELECT COALESCE(SUM(ts.hours_total * COALESCE(sc.hourly_rate, $2)),0)
              FROM timesheets ts LEFT JOIN subcontractors sc ON sc.id = ts.subcontractor_id
              WHERE ts.project_id = $1) AS labor_cost`,
        [req.params.id, Number(p.default_labor_cost_rate) || 0]
      ),
    ]);

    const num = (v) => Number(v) || 0;
    const contract = num(p.contract_value);
    const tradesEst = num(t.trades_est);
    const budgets = num(p.budget_materials) + num(p.budget_labor);

    // Théorique
    const costTheo = budgets + tradesEst;
    const marginTheo = contract - costTheo;

    // Réel
    const invoiced = num(r.invoiced);
    const laborCost = num(r.labor_cost);
    const expenses = num(r.expenses);
    const costReal = laborCost + expenses;
    const marginReal = invoiced - costReal;

    const pct = (margin, rev) => (rev > 0 ? Math.round((margin / rev) * 1000) / 10 : null);

    res.json({
      theoretical: {
        revenue: contract,
        cost: costTheo,
        cost_breakdown: { budget_materials: num(p.budget_materials), budget_labor: num(p.budget_labor), trades_estimated: tradesEst },
        margin: marginTheo,
        margin_pct: pct(marginTheo, contract),
      },
      actual: {
        revenue: invoiced,
        cost: costReal,
        cost_breakdown: { labor_punch: laborCost, expenses, hours_logged: num(r.hours), labor_cost_rate: num(p.default_labor_cost_rate) },
        margin: marginReal,
        margin_pct: pct(marginReal, invoiced),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Corps de métiers requis + sous-traitant choisi par métier ─────────────────
async function assertProjectInCompany(projectId, companyId) {
  const { rows } = await query(`SELECT id FROM projects WHERE id = $1 AND company_id = $2`, [projectId, companyId]);
  return rows.length > 0;
}

router.post('/:id/trades', async (req, res) => {
  const { trade, status, chosen_subcontractor_id, estimated_cost, notes } = req.body;
  if (!trade) return res.status(400).json({ error: 'Corps de métier requis' });
  try {
    if (!(await assertProjectInCompany(req.params.id, req.company_id)))
      return res.status(404).json({ error: 'Projet introuvable' });
    const { rows: [row] } = await query(
      `INSERT INTO project_trades (project_id, trade, status, chosen_subcontractor_id, estimated_cost, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, trade, status || 'to_find', chosen_subcontractor_id || null, estimated_cost ?? null, notes || null]
    );
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id/trades/:tradeId', async (req, res) => {
  const allowed = ['trade','status','chosen_subcontractor_id','estimated_cost','notes'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.tradeId, req.params.id];
  try {
    if (!(await assertProjectInCompany(req.params.id, req.company_id)))
      return res.status(404).json({ error: 'Projet introuvable' });
    const { rows: [row] } = await query(
      `UPDATE project_trades SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND project_id = $${values.length} RETURNING *`,
      values
    );
    if (!row) return res.status(404).json({ error: 'Métier introuvable' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/trades/:tradeId', async (req, res) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM project_trades WHERE id = $1 AND project_id = $2`,
      [req.params.tradeId, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Métier introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Dépenses réelles (factures fournisseurs, matériaux…) ──────────────────────
router.post('/:id/expenses', async (req, res) => {
  const { type, description, amount, subcontractor_id, expense_date } = req.body;
  try {
    if (!(await assertProjectInCompany(req.params.id, req.company_id)))
      return res.status(404).json({ error: 'Projet introuvable' });
    const { rows: [row] } = await query(
      `INSERT INTO project_expenses (company_id, project_id, type, description, amount, subcontractor_id, expense_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.company_id, req.params.id, type || 'supplier_invoice', description || null,
       Number(amount) || 0, subcontractor_id || null, expense_date || null, req.user.userId]
    );
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM project_expenses WHERE id = $1 AND project_id = $2 AND company_id = $3`,
      [req.params.expenseId, req.params.id, req.company_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Dépense introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
