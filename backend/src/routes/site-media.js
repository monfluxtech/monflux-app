import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
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

router.get('/project/:projectId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT m.*, u.name AS author_name
       FROM site_media m LEFT JOIN users u ON u.id = m.created_by
       WHERE m.company_id = $1 AND m.project_id = $2
       ORDER BY m.created_at DESC`,
      [req.company_id, req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  const { project_id, type, url, mime_type, caption, transcript } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id requis' });
  try {
    const { rows: [m] } = await query(
      `INSERT INTO site_media (company_id, project_id, type, url, mime_type, caption, transcript, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.company_id, project_id, type || 'photo', url || null, mime_type || null,
       caption || null, transcript || null, req.user.userId]
    );
    res.status(201).json(m);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM site_media WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/site-media/:id/analyze — analyse IA : non-conformités + sécurité
router.post('/:id/analyze', async (req, res) => {
  try {
    const { rows: [m] } = await query(
      `SELECT * FROM site_media WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!m) return res.status(404).json({ error: 'Média non trouvé' });

    if (!aiReady()) {
      return res.status(503).json({
        error: 'IA non configurée',
        code: 'ai_not_configured',
        hint: "L'analyse IA sera disponible dès qu'une clé API sera configurée.",
      });
    }

    await query(`UPDATE site_media SET ai_status = 'pending', ai_error = NULL WHERE id = $1`, [m.id]);

    const instructions = `Tu es un inspecteur de chantier expert au Québec (normes RBQ, CNESST, Code de construction).
Analyse cette ${m.type === 'photo' ? 'photo de chantier' : 'note de chantier'} et identifie :
1. Les NON-CONFORMITÉS (Code de construction, normes RBQ, malfaçons visibles)
2. Les RISQUES DE SÉCURITÉ (CNESST : EPI manquants, échafaudages, chutes, électrique, etc.)

Retourne UNIQUEMENT un JSON valide :
{
  "non_conformities": [
    { "issue": "...", "severity": "low|medium|high", "reference": "norme/article si connu", "recommendation": "..." }
  ],
  "safety_risks": [
    { "risk": "...", "severity": "low|medium|high", "cnesst_reference": "si applicable", "action": "..." }
  ],
  "summary": "résumé en 1-2 phrases en français québécois",
  "overall_severity": "low|medium|high"
}
Si rien n'est détecté, retourne des tableaux vides et un résumé positif.`;

    let content;
    if (m.type === 'photo' && m.url && m.mime_type?.startsWith('image/')) {
      const resp = await fetch(m.url);
      const buffer = await resp.arrayBuffer();
      const b64 = Buffer.from(buffer).toString('base64');
      content = [
        { type: 'image', source: { type: 'base64', media_type: m.mime_type, data: b64 } },
        { type: 'text', text: instructions },
      ];
    } else {
      const text = m.transcript || m.caption || '';
      content = [{ type: 'text', text: `${instructions}\n\nContenu de la note :\n"${text}"` }];
    }

    const client = initAnthropicIfReady();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content }],
    });

    const raw = msg.content[0]?.text || '{}';
    const analysis = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');

    const { rows: [updated] } = await query(
      `UPDATE site_media SET ai_analysis = $1, ai_status = 'done' WHERE id = $2 RETURNING *`,
      [JSON.stringify(analysis), m.id]
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    await query(`UPDATE site_media SET ai_status = 'error', ai_error = $1 WHERE id = $2`,
      [err.message, req.params.id]).catch(() => {});
    res.status(500).json({ error: "Erreur d'analyse IA" });
  }
});

export default router;
