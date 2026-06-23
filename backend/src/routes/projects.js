import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken, resolveCompany, enforceAiQuota } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

let _anthropic = null;
const anthropic = () => {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
};

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

    const [{ rows: phases }, { rows: milestones }, { rows: members }, { rows: docs }, { rows: trades }, { rows: expenses }, { rows: cfgRows }] = await Promise.all([
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
      query(
        `SELECT cc.field_checklists, comp.trades AS company_trades
         FROM companies comp
         LEFT JOIN company_config cc ON cc.company_id = comp.id
         WHERE comp.id = $1`,
        [req.company_id]
      ),
    ]);

    res.json({
      ...project, phases, milestones, members, documents: docs, trades, expenses,
      field_checklists: cfgRows?.[0]?.field_checklists || {},
      company_trades: cfgRows?.[0]?.company_trades || [],
    });
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
          budget_materials, budget_labor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.company_id, name, description, type || 'other', status || 'brouillon',
        address, city, postal_code, client_id || null, lead_id || null,
        start_date || null, end_date || null, contract_value || null,
        budget_materials || null, budget_labor || null,
      ]
    );

    // Update created_from_project after insert (column added via migration)
    if (created_from_project) {
      try {
        await query(
          `UPDATE projects SET created_from_project = $1 WHERE id = $2`,
          [created_from_project, project.id]
        );
      } catch (_) { /* column not yet migrated — ignore */ }
    }

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
    'start_date','end_date','contract_value','budget_materials','budget_labor','progress_pct','notes',
    // Batch 3 — en-tête riche + estimation terrain
    'payment_terms','project_manager','approvers','materials_buyer','permits_responsible',
    'permits_required','machines','field_assessment','estimated_price'];
  // JSONB arrays/objects : stringifier (node-pg encoderait un Array en array PG).
  const JSONB_FIELDS = ['approvers','machines','field_assessment'];
  const updates = Object.fromEntries(
    Object.entries(req.body)
      .filter(([k]) => allowed.includes(k))
      .map(([k, v]) => [k, JSONB_FIELDS.includes(k) && v != null ? JSON.stringify(v) : v])
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
  const {
    name,
    display_order,
    color,
    start_date,
    end_date,
    trade_name,
    progress_pct,
    status,
  } = req.body;
  try {
    const nextOrder = Number.isFinite(Number(display_order))
      ? Number(display_order)
      : (
          await query(
            `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order
             FROM project_phases
             WHERE project_id = $1`,
            [req.params.id]
          )
        ).rows[0]?.next_order ?? 0;
    const { rows: [phase] } = await query(
      `INSERT INTO project_phases (
         project_id, name, display_order, color, start_date, end_date, trade_name, progress_pct, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.params.id,
        name,
        nextOrder,
        color || '#F26522',
        start_date || null,
        end_date || null,
        trade_name || null,
        Number.isFinite(Number(progress_pct)) ? Number(progress_pct) : 0,
        status || 'not_started',
      ]
    );
    res.status(201).json(phase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/projects/:id/phases/:phaseId
router.patch('/:id/phases/:phaseId', async (req, res) => {
  const allowed = ['name','status','color','start_date','end_date','actual_start','actual_end','progress_pct','display_order','trade_name','start_time','duration_hours','assigned_to_name','recurrence_type','recurrence_count'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
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

// DELETE /api/projects/:id/phases/:phaseId
router.delete('/:id/phases/:phaseId', async (req, res) => {
  try {
    await query(`DELETE FROM project_phases WHERE id = $1 AND project_id = $2`, [req.params.phaseId, req.params.id]);
    res.json({ ok: true });
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

// ── Batch 3 — Estimation terrain : checklist → prix global (IA) ───────────────
// POST /api/projects/:id/estimate-field
router.post('/:id/estimate-field', enforceAiQuota, async (req, res) => {
  const { field_assessment } = req.body;
  try {
    const { rows: [p] } = await query(
      `SELECT p.name, p.description, p.type, p.address, p.city, p.contract_value
       FROM projects p WHERE p.id = $1 AND p.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });

    const { rows: tradeRows } = await query(
      `SELECT trade, estimated_cost FROM project_trades WHERE project_id = $1`,
      [req.params.id]
    );

    const assessment = field_assessment || {};
    const prompt = `Tu es un estimateur senior en construction au Québec. À partir d'une visite de chantier
(la « checklist terrain » remplie ci-dessous), produis une ESTIMATION DE PRIX GLOBAL réaliste pour le client final
(prix de vente, taxes en sus), en dollars canadiens.

PROJET:
- Nom: ${p.name}
- Type: ${p.type || 'non spécifié'}
- Adresse: ${[p.address, p.city].filter(Boolean).join(', ') || 'non spécifiée'}
- Description: ${p.description || '—'}
- Corps de métiers prévus: ${tradeRows.map(t => t.trade).join(', ') || 'non précisés'}

CHECKLIST TERRAIN (réponses de l'inspection):
${JSON.stringify(assessment, null, 2)}

Retourne UNIQUEMENT un JSON valide:
{
  "expected_price": 0,
  "low_price": 0,
  "high_price": 0,
  "confidence": "low|medium|high",
  "breakdown": [{ "poste": "Démolition", "amount": 0, "basis": "courte justification" }],
  "assumptions": ["hypothèse 1", "hypothèse 2"],
  "missing_info": ["info manquante qui réduirait l'incertitude"],
  "notes": "synthèse en 1-2 phrases"
}
Règles: sois prudent et transparent. Si l'info terrain est insuffisante, élargis la fourchette low/high,
baisse la confiance et liste ce qui manque dans missing_info. N'invente pas de précision que tu n'as pas.`;

    const msg = await anthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const estimate = JSON.parse(jsonMatch[0]);

    // Persiste le prix attendu + l'estimation dans field_assessment.ai_estimate.
    const merged = { ...assessment, ai_estimate: { ...estimate, generated_at: new Date().toISOString() } };
    await query(
      `UPDATE projects SET estimated_price = $1, field_assessment = $2, updated_at = NOW()
       WHERE id = $3 AND company_id = $4`,
      [Number(estimate.expected_price) || null, JSON.stringify(merged), req.params.id, req.company_id]
    );

    res.json({ estimate, ai_usage: req.ai_usage });
  } catch (err) {
    console.error('estimate-field error:', err);
    res.status(500).json({ error: "Erreur lors de l'estimation" });
  }
});

// POST /api/projects/:id/send-price — envoyer le prix global au client
// (Stub : enregistre l'envoi. La livraison email/WhatsApp s'activera avec les clés.)
router.post('/:id/send-price', async (req, res) => {
  const { price } = req.body;
  try {
    const { rows: [p] } = await query(
      `UPDATE projects
       SET estimated_price = COALESCE($1, estimated_price),
           price_sent_at = NOW(),
           status = CASE WHEN status IN ('brouillon','estimation') THEN 'prix_envoye' ELSE status END,
           updated_at = NOW()
       WHERE id = $2 AND company_id = $3
       RETURNING id, estimated_price, price_sent_at, status`,
      [price != null ? Number(price) : null, req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });
    res.json({ ...p, delivery: 'recorded', stub: true,
      message: 'Prix enregistré comme envoyé. La livraison automatique au client s’activera une fois les clés email/WhatsApp fournies.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects/:id/request-client-media — demander photos/vidéos au client
// (Stub : enregistre la demande dans field_assessment ; livraison à activer.)
router.post('/:id/request-client-media', async (req, res) => {
  const { items, message } = req.body;
  try {
    const { rows: [p] } = await query(
      `SELECT field_assessment, portal_token FROM projects WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });
    const assessment = p.field_assessment || {};
    assessment.client_request = {
      items: Array.isArray(items) ? items : [],
      message: message || '',
      requested_at: new Date().toISOString(),
    };
    await query(
      `UPDATE projects SET field_assessment = $1, updated_at = NOW() WHERE id = $2 AND company_id = $3`,
      [JSON.stringify(assessment), req.params.id, req.company_id]
    );
    res.json({
      ok: true, stub: true,
      portal_link: p.portal_token ? `/portal/${p.portal_token}` : null,
      message: 'Demande enregistrée. L’envoi automatique (email/WhatsApp) s’activera avec les clés ; en attendant, partage le lien du portail au client.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
