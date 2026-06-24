import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken, resolveCompany, requireFeature, enforceAiQuota, getAiUsage } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

let anthropic = null;
const initAnthropicIfReady = () => {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
};

const aiReady = () => !!process.env.ANTHROPIC_API_KEY;
function aiNotConfigured(res) {
  return res.status(503).json({
    error: 'IA non configurée',
    code: 'ai_not_configured',
    hint: "Cette fonctionnalité sera active dès qu'une clé API sera configurée.",
  });
}

// POST /api/ai/health-check — AI dashboard health summary
router.get('/health-check', requireFeature('ai_health_check'), async (req, res) => {
  if (!aiReady()) {
    console.warn('[health-check] AI not ready, returning 503');
    return aiNotConfigured(res);
  }
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

    const client = initAnthropicIfReady();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Voici l'état de mes chantiers et admin MONFLUX:
${JSON.stringify(context, null, 2)}

Fais-moi un résumé exécutif en 3-5 points concis (bullet points) en français québécois.
Priorise ce qui demande attention immédiate. Sois direct et actionnable.`,
      }],
    }, { signal: controller.signal });

    clearTimeout(timeout);

    res.json({
      summary: msg.content[0].text,
      data: context,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout IA (30s)' });
    }
    res.status(500).json({ error: 'Erreur IA' });
  }
});

// POST /api/ai/estimate — AI material estimation
router.post('/estimate', requireFeature('ai_estimation'), enforceAiQuota, async (req, res) => {
  if (!aiReady()) return aiNotConfigured(res);
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

    const client = initAnthropicIfReady();
    const msg = await client.messages.create({
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

// POST /api/ai/group-purchases — regroupe les commandes matériaux par fournisseur,
// détecte les opportunités de regroupement et de promos. (B7)
router.post('/group-purchases', enforceAiQuota, async (req, res) => {
  const { project_id } = req.body;
  if (!aiReady()) return aiNotConfigured(res);
  try {
    const { rows: orders } = await query(
      `SELECT supplier, order_number, description, total_amount, status, expected_date
       FROM material_orders WHERE company_id = $1 ${project_id ? 'AND project_id = $2' : ''}
       ORDER BY supplier`,
      project_id ? [req.company_id, project_id] : [req.company_id]
    );
    if (!orders.length) {
      return res.json({ groups: [], opportunities: [], summary: 'Aucune commande matériaux à analyser.' });
    }

    const prompt = `Tu es un acheteur stratégique en construction au Québec.
Voici les commandes de matériaux ${project_id ? 'de ce projet' : 'de l\'entreprise'} :
${JSON.stringify(orders, null, 2)}

Analyse-les et propose des regroupements d'achats par fournisseur pour réduire les coûts et la logistique.
Connais les grands fournisseurs québécois (Rona, Home Depot, BMR, Patrick Morin, Canac, Réno-Dépôt) et leurs programmes (rabais volume, comptes pro, livraison gratuite au-delà d'un seuil).

Retourne UNIQUEMENT un JSON valide :
{
  "groups": [
    { "supplier": "...", "order_count": 0, "total_estimate": 0, "consolidation_note": "..." }
  ],
  "opportunities": [
    { "type": "volume|delivery|promo|account", "supplier": "...", "description": "...", "potential_saving": "estimation en $ ou %" }
  ],
  "summary": "résumé actionnable en 2-3 phrases en français québécois"
}`;

    const client = initAnthropicIfReady();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0]?.text || '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur regroupement achats' });
  }
});

// POST /api/ai/change-order-impact — analyse l'impact d'un avenant (échéancier, budget, dépendances). (B7)
router.post('/change-order-impact', enforceAiQuota, async (req, res) => {
  const { change_order_id } = req.body;
  if (!aiReady()) return aiNotConfigured(res);
  try {
    const { rows: [co] } = await query(
      `SELECT co.*, p.name AS project_name, p.contract_value, p.start_date, p.end_date,
              p.progress_pct, p.status AS project_status
       FROM change_orders co LEFT JOIN projects p ON p.id = co.project_id
       WHERE co.id = $1 AND co.company_id = $2`,
      [change_order_id, req.company_id]
    );
    if (!co) return res.status(404).json({ error: 'Avenant non trouvé' });

    const prompt = `Tu es un gestionnaire de projet de construction expérimenté au Québec.
Analyse l'impact de cet avenant (change order) sur le projet.

AVENANT :
- Titre : ${co.title}
- Description : ${co.description || '(aucune)'}
- Montant : ${co.amount || 0} $

PROJET :
- Nom : ${co.project_name}
- Valeur contrat : ${co.contract_value || 0} $
- Avancement : ${co.progress_pct || 0}%
- Début : ${co.start_date || 'n/d'} · Fin prévue : ${co.end_date || 'n/d'}

Évalue l'impact sur : le budget (% de variation), l'échéancier (jours additionnels estimés), les corps de métier touchés, et les risques.

Retourne UNIQUEMENT un JSON valide :
{
  "budget_impact": { "amount": 0, "percent_of_contract": 0, "note": "..." },
  "schedule_impact": { "estimated_days": 0, "note": "..." },
  "affected_trades": ["..."],
  "risks": ["..."],
  "recommendation": "recommandation claire en français québécois (approuver tel quel, négocier, etc.)",
  "overall_impact": "low|medium|high"
}`;

    const client = initAnthropicIfReady();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0]?.text || '{}';
    const impact = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');

    await query(`UPDATE change_orders SET ai_impact = $1 WHERE id = $2`,
      [JSON.stringify(impact), change_order_id]);
    res.json(impact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur analyse avenant' });
  }
});

// POST /api/ai/generate-phases — génère les phases de chantier à partir de la description
router.post('/generate-phases', enforceAiQuota, async (req, res) => {
  if (!aiReady()) return aiNotConfigured(res);
  const {
    description,
    project_type,
    start_date,
    end_date,
    project_name,
    address,
    client_name,
    budget,
    notes,
    trades = [],
    visit_answers = {},
    approx_lines = [],
  } = req.body;
  const tradeList = [...new Set((trades || []).map((t) => String(t || '').trim()).filter(Boolean))];
  const visitLines = Object.entries(visit_answers || {})
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
  const estimateLines = (approx_lines || [])
    .map((line) => `- ${line?.name || 'Ligne'}: ${line?.qty || ''} ${line?.unit || ''}`.trim())
    .join('\n');
  const projectSummary = [
    description,
    project_type,
    project_name,
    notes,
    visitLines,
    estimateLines,
  ].filter(Boolean).join('\n');

  if (!projectSummary.trim()) {
    return res.status(400).json({ error: 'Contexte projet requis' });
  }
  try {
    const prompt = `Tu es Florence, planificatrice de chantier MONFLUX spécialisée en construction au Québec.
Tu construis un plan de phases réaliste et adapté au projet décrit.

CONTEXTE DU PROJET
- Nom: ${project_name || 'Projet sans nom'}
- Description: ${description || 'Non précisée'}
- Type de travaux: ${project_type || 'non spécifié'}
- Adresse: ${address || 'Non précisée'}
- Client: ${client_name || 'Non précisé'}
- Début prévu: ${start_date || 'non précisé'}
- Fin cible: ${end_date || 'non précisée'}
- Budget: ${budget ? `${Number(budget).toLocaleString('fr-CA')} $` : 'non précisé'}
- Corps de métier connus: ${tradeList.length ? tradeList.join(', ') : 'à déduire selon le chantier'}
${visitLines ? `- Observations terrain:\n${visitLines}` : ''}
${estimateLines ? `- Lignes d'estimation:\n${estimateLines}` : ''}
${notes ? `- Notes: ${notes}` : ''}

CONTRAINTES
1. Génère entre 4 et 9 phases séquentielles vraiment pertinentes pour CE projet seulement.
2. Chaque phase doit avoir un nom clair, un trade_name précis et non vide.
3. Utilise prioritairement les corps de métier fournis. Si la liste est incomplète, complète-la intelligemment.
4. Les dates doivent être plausibles, ordonnées et au format YYYY-MM-DD.
5. N'inclus pas de phase inutile ou générique si elle ne s'applique pas au chantier.
6. Statut initial: "not_started". progress_pct initial: 0.

Réponds UNIQUEMENT en JSON valide, sans texte autour:
{
  "summary": "vue d'ensemble concise",
  "phases": [
    {
      "name": "Démolition intérieure",
      "trade_name": "Démolition",
      "start_date": "2026-07-02",
      "end_date": "2026-07-05",
      "progress_pct": 0,
      "status": "not_started",
      "color": "#E8794E",
      "display_order": 0
    }
  ]
}`;

    const client = initAnthropicIfReady();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0]?.text || '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');
    const phases = Array.isArray(result?.phases)
      ? result.phases
          .map((phase, index) => ({
            name: String(phase?.name || '').trim(),
            trade_name: String(phase?.trade_name || phase?.trade || '').trim(),
            start_date: phase?.start_date || null,
            end_date: phase?.end_date || null,
            progress_pct: 0,
            status: 'not_started',
            color: phase?.color || null,
            display_order: Number.isFinite(Number(phase?.display_order))
              ? Number(phase.display_order)
              : index,
          }))
          .filter((phase) => phase.name && phase.trade_name)
      : [];
    res.json({
      summary: result?.summary || '',
      phases,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur génération phases' });
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

// GET /api/ai/usage — current month AI request usage + remaining (quota + credits)
router.get('/usage', async (req, res) => {
  try {
    const usage = await getAiUsage(req.company_id, req.plan);
    res.json(usage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/ai/credits — add add-on AI credits to the current period.
// NOTE: payment processing is NOT wired here — this records the credits only.
// A real purchase must go through the billing flow before calling this.
router.post('/credits', async (req, res) => {
  const amount = Math.max(0, Math.min(10000, Number(req.body?.amount) || 0));
  if (!amount) return res.status(400).json({ error: 'Montant de crédits invalide' });
  try {
    const period = new Date().toISOString().slice(0, 7);
    await query(
      `INSERT INTO ai_usage (company_id, period, credits) VALUES ($1, $2, $3)
       ON CONFLICT (company_id, period) DO UPDATE SET credits = ai_usage.credits + $3, updated_at = NOW()`,
      [req.company_id, period, amount]
    );
    const usage = await getAiUsage(req.company_id, req.plan);
    res.json(usage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/ai/adjust-phases — Florence réorganise les phases existantes (dates, durées ouvrables, dépendances)
router.post('/adjust-phases', enforceAiQuota, async (req, res) => {
  if (!aiReady()) return aiNotConfigured(res);
  const { phases = [], project_name = '', start_date, project_type = '' } = req.body;
  if (!phases.length) return res.status(400).json({ error: 'Aucune phase à ajuster' });

  const phaseList = phases.map((ph, i) =>
    `${i+1}. "${ph.name}" (${ph.trade_name||'?'}) — durée actuelle: ${ph.duration_hours||'?'}h, début actuel: ${ph.start_date||'?'}`
  ).join('\n');

  const prompt = `Tu es Florence, planificatrice de chantier MONFLUX spécialisée en construction au Québec.
Tu reçois la liste des phases d'un chantier et tu les réorganises de façon réaliste.

PROJET: ${project_name} | Type: ${project_type} | Date de début cible: ${start_date || 'à déterminer'}

PHASES ACTUELLES (à ajuster — ne pas supprimer ni ajouter):
${phaseList}

RÈGLES:
1. Journée ouvrée = 8h, semaine = 5 jours (lundi–vendredi, pas de week-end).
2. Calcule duration_hours comme multiple de 8h (ex: 2 jours = 16h, 1 semaine = 40h).
3. Les phases doivent se suivre de façon logique (ex: démolition avant plomberie).
4. start_date = date de début réelle (YYYY-MM-DD, jamais un week-end).
5. Identifie les dépendances: pour chaque phase, quel est l'indice (1-based) de la phase qui doit être terminée avant? (null si aucune).
6. Garde tous les noms et trade_names EXACTEMENT comme fournis.

Réponds UNIQUEMENT en JSON valide:
{
  "phases": [
    {
      "id_original": 1,
      "start_date": "2026-07-02",
      "duration_hours": 16,
      "depends_on_index": null
    }
  ]
}`;

  try {
    const client = initAnthropicIfReady();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw = msg.content[0]?.text || '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');
    res.json({ adjustments: Array.isArray(result?.phases) ? result.phases : [] });
  } catch (err) {
    console.error('adjust-phases', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
