import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken, resolveCompany, requireFeature } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/health-check — AI dashboard health summary
router.get('/health-check', requireFeature('ai_health_check'), async (req, res) => {
  try {
    const [projects, overdueinv, pendingLeads, pendingActions] = await Promise.all([
      query(`SELECT id,name,status,progress_pct,end_date,contract_value FROM projects WHERE company_id=$1 AND status='active'`, [req.company_id]),
      query(`SELECT COUNT(*) AS n, SUM(amount_due) AS total FROM invoices WHERE company_id=$1 AND status='overdue'`, [req.company_id]),
      query(`SELECT COUNT(*) AS n FROM leads WHERE company_id=$1 AND status='new'`, [req.company_id]),
      query(`SELECT COUNT(*) AS n FROM ai_actions WHERE company_id=$1 AND status='pending'`, [req.company_id]),
    ]);

    const context = {
      active_projects: projects.rows,
      overdue_invoices: overdueinv.rows[0],
      pending_leads: pendingLeads.rows[0].n,
      pending_actions: pendingActions.rows[0].n,
    };

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Voici l'état de mes chantiers et admin MONFLUX:
${JSON.stringify(context, null, 2)}

Fais-moi un résumé exécutif en 3-5 points concis (bullet points) en français québécois.
Priorise ce qui demande attention immédiate. Sois direct et actionnable.`,
      }],
    });

    res.json({
      summary: msg.content[0].text,
      data: context,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur IA' });
  }
});

// POST /api/ai/estimate — AI material estimation
router.post('/estimate', requireFeature('ai_estimation'), async (req, res) => {
  const { description, extracted_dimensions, project_type, preferred_suppliers = ['rona','home_depot'] } = req.body;

  try {
    const prompt = `Tu es un estimateur expert en construction résidentielle et commerciale au Québec.
Génère une liste détaillée de matériaux pour ce projet:

Description: ${description || ''}
Type: ${project_type || 'non spécifié'}
${extracted_dimensions ? `Dimensions extraites des plans: ${JSON.stringify(extracted_dimensions)}` : ''}
Fournisseurs préférés: ${preferred_suppliers.join(', ')}

Retourne UNIQUEMENT un JSON valide avec ce format:
{
  "items": [
    {
      "name": "Gypse 4x8 1/2\"",
      "qty": 45,
      "unit": "feuilles",
      "unit_price_estimate": 18.99,
      "supplier": "Rona",
      "search_query": "gypse 4x8 demi pouce rona",
      "category": "interior_walls",
      "notes": "Prévoir 10% de gaspillage"
    }
  ],
  "labor_breakdown": [
    { "task": "Pose gypse", "hours": 16, "skill": "carpenter" }
  ],
  "total_materials_estimate": 0,
  "total_labor_hours": 0,
  "notes": ""
}`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = msg.content[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const estimate = JSON.parse(jsonMatch[0]);

    res.json(estimate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur génération estimation' });
  }
});

// GET /api/ai/actions — pending AI actions sidebar
router.get('/actions', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM ai_actions WHERE company_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 20`,
    [req.company_id]
  );
  res.json(rows);
});

// PATCH /api/ai/actions/:id
router.patch('/actions/:id', async (req, res) => {
  const { status } = req.body;
  const { rows: [a] } = await query(
    `UPDATE ai_actions SET status=$1, executed_at=CASE WHEN $1='executed' THEN NOW() ELSE NULL END,
       dismissed_at=CASE WHEN $1='dismissed' THEN NOW() ELSE NULL END
     WHERE id=$2 AND company_id=$3 RETURNING *`,
    [status, req.params.id, req.company_id]
  );
  res.json(a);
});

export default router;
