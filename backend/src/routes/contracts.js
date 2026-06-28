import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
import Anthropic from '@anthropic-ai/sdk';
import { buildContractMergeFields, buildFallbackFloContractHtml } from '../lib/contracts.js';

const router = express.Router();

let anthropic = null;
const getAnthropic = () => {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
};

// ── Public endpoints (no auth) ────────────────────────────────────────────────
router.get('/public/:token', async (req, res) => {
  try {
    const { rows: [c] } = await query(
      `SELECT c.*, comp.name AS company_name, comp.address AS company_address, comp.city AS company_city,
              comp.postal_code AS company_postal_code, comp.phone AS company_phone,
              comp.email AS company_email, comp.website AS company_website,
              p.name AS project_name, p.address AS project_address
       FROM contracts c
       LEFT JOIN projects p ON p.id = c.project_id
       LEFT JOIN companies comp ON comp.id = c.company_id
       WHERE c.public_token = $1`,
      [req.params.token]
    );
    if (!c) return res.status(404).json({ error: 'Contrat non trouvé' });
    res.json({ ...c, content: c.content || c.terms || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Stub e-signature — records signer name + IP; real e-sign key activates this in B8.
router.post('/public/:token/sign', async (req, res) => {
  const { signer_name } = req.body;
  if (!signer_name) return res.status(400).json({ error: 'Nom du signataire requis' });
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const { rows: [c] } = await query(
      `UPDATE contracts
         SET status = 'signed', signer_name = $1, signed_at = NOW(), signed_ip = $2,
             updated_at = NOW()
       WHERE public_token = $3 AND status <> 'signed'
       RETURNING *`,
      [signer_name, ip, req.params.token]
    );
    if (!c) return res.status(404).json({ error: 'Contrat non trouvé ou déjà signé' });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Authenticated endpoints ────────────────────────────────────────────────────
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { project_id } = req.query;
  try {
    const params = project_id ? [req.company_id, project_id] : [req.company_id];
    const { rows } = await query(
      `SELECT c.*, q.title AS quote_title, q.total AS quote_total
       FROM contracts c
       LEFT JOIN quotes q ON q.id = c.quote_id
       WHERE c.company_id = $1${project_id ? ' AND c.project_id = $2' : ''}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows.map((row) => ({ ...row, content: row.content || row.terms || '' })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  const { title, project_id, quote_id, content, template_key, meta } = req.body;
  if (!title) return res.status(400).json({ error: 'Le titre est requis' });
  try {
    let c;
    try {
      ({ rows: [c] } = await query(
        `INSERT INTO contracts (company_id, project_id, quote_id, title, content, created_by, template_key, meta)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.company_id, project_id || null, quote_id || null, title, content || null, req.user.userId, template_key || null, meta ? JSON.stringify(meta) : JSON.stringify({})]
      ));
    } catch (err) {
      if (!/template_key|meta|content|created_by/i.test(String(err?.message || ''))) throw err;
      try {
        ({ rows: [c] } = await query(
          `INSERT INTO contracts (company_id, project_id, quote_id, title, content, created_by)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [req.company_id, project_id || null, quote_id || null, title, content || null, req.user.userId]
        ));
      } catch (legacyErr) {
        if (!/content|created_by/i.test(String(legacyErr?.message || ''))) throw legacyErr;
        ({ rows: [c] } = await query(
          `INSERT INTO contracts (company_id, project_id, quote_id, title, terms)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [req.company_id, project_id || null, quote_id || null, title, content || null]
        ));
        if (c && !c.content) c.content = c.terms || content || '';
      }
    }
    res.status(201).json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: [c] } = await query(
      `SELECT * FROM contracts WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!c) return res.status(404).json({ error: 'Contrat non trouvé' });
    res.json({ ...c, content: c.content || c.terms || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['title', 'content', 'status', 'template_key', 'meta'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  if (updates.meta && typeof updates.meta !== 'string') updates.meta = JSON.stringify(updates.meta);
  try {
    let effectiveUpdates = { ...updates };
    let c;
    try {
      const set = Object.keys(effectiveUpdates).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const vals = [...Object.values(effectiveUpdates), req.params.id, req.company_id];
      ({ rows: [c] } = await query(
        `UPDATE contracts SET ${set}, updated_at = NOW()
         WHERE id = $${vals.length - 1} AND company_id = $${vals.length}
         RETURNING *`,
        vals
      ));
    } catch (err) {
      if (!/template_key|meta|content/i.test(String(err?.message || ''))) throw err;
      delete effectiveUpdates.template_key;
      delete effectiveUpdates.meta;
      if (!Object.keys(effectiveUpdates).length) {
        const { rows: [existing] } = await query(
          `SELECT * FROM contracts WHERE id = $1 AND company_id = $2`,
          [req.params.id, req.company_id]
        );
        c = existing ? { ...existing, content: existing.content || existing.terms || '' } : null;
      } else try {
        const set = Object.keys(effectiveUpdates).map((k, i) => `${k} = $${i + 1}`).join(', ');
        const vals = [...Object.values(effectiveUpdates), req.params.id, req.company_id];
        ({ rows: [c] } = await query(
          `UPDATE contracts SET ${set}, updated_at = NOW()
           WHERE id = $${vals.length - 1} AND company_id = $${vals.length}
           RETURNING *`,
          vals
        ));
      } catch (legacyErr) {
        if (!/content/i.test(String(legacyErr?.message || '')) || !('content' in effectiveUpdates)) throw legacyErr;
        const legacyUpdates = { ...effectiveUpdates, terms: effectiveUpdates.content };
        delete legacyUpdates.content;
        const set = Object.keys(legacyUpdates).map((k, i) => `${k} = $${i + 1}`).join(', ');
        const vals = [...Object.values(legacyUpdates), req.params.id, req.company_id];
        ({ rows: [c] } = await query(
          `UPDATE contracts SET ${set}, updated_at = NOW()
           WHERE id = $${vals.length - 1} AND company_id = $${vals.length}
           RETURNING *`,
          vals
        ));
        if (c && !c.content) c.content = c.terms || updates.content || '';
      }
    }
    if (!c) return res.status(404).json({ error: 'Contrat non trouvé' });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query(`DELETE FROM contracts WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /:id/send — marks contract as sent (real delivery in B8 via email/WhatsApp)
router.post('/:id/send', async (req, res) => {
  try {
    const { rows: [c] } = await query(
      `UPDATE contracts SET status = 'sent', updated_at = NOW()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [req.params.id, req.company_id]
    );
    if (!c) return res.status(404).json({ error: 'Contrat non trouvé' });
    res.json({ ...c, stub: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/enrich', async (req, res) => {
  const { goal } = req.body || {};
  try {
    const { rows: [contract] } = await query(
      `SELECT c.*, q.total AS quote_total, q.title AS quote_title, q.notes AS quote_notes,
              p.name AS project_name, p.address AS project_address, p.city AS project_city, p.postal_code AS project_postal_code,
              p.start_date, p.end_date, p.description AS project_description, p.type AS project_type, p.field_assessment,
              p.client_name, p.client_email, p.payment_terms,
              comp.name AS company_name, comp.address AS company_address, comp.city AS company_city,
              comp.postal_code AS company_postal_code, comp.phone AS company_phone, comp.email AS company_email,
              comp.default_deposit_pct, comp.payment_terms_days
       FROM contracts c
       LEFT JOIN quotes q ON q.id = c.quote_id
       LEFT JOIN projects p ON p.id = c.project_id
       LEFT JOIN companies comp ON comp.id = c.company_id
       WHERE c.id = $1 AND c.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!contract) return res.status(404).json({ error: 'Contrat non trouvé' });

    const { rows: quoteItems } = contract.quote_id
      ? await query(`SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`, [contract.quote_id])
      : { rows: [] };

    const mergeFields = buildContractMergeFields({
      company: {
        name: contract.company_name,
        address: contract.company_address,
        city: contract.company_city,
        postal_code: contract.company_postal_code,
        phone: contract.company_phone,
        email: contract.company_email,
        default_deposit_pct: contract.default_deposit_pct,
        payment_terms_days: contract.payment_terms_days,
      },
      project: {
        name: contract.project_name,
        address: contract.project_address,
        city: contract.project_city,
        postal_code: contract.project_postal_code,
        start_date: contract.start_date,
        end_date: contract.end_date,
        description: contract.project_description,
        type: contract.project_type,
        field_assessment: contract.field_assessment || {},
        client_name: contract.client_name,
        client_email: contract.client_email,
        payment_terms: contract.payment_terms,
      },
      quote: {
        id: contract.quote_id,
        title: contract.quote_title,
        total: contract.quote_total,
        notes: contract.quote_notes,
        items: quoteItems,
      },
      client: {
        name: contract.client_name,
        email: contract.client_email,
      },
    });

    let content = contract.content || '';
    let enrichedBy = 'fallback';
    const ai = getAnthropic();
    if (ai) {
      const prompt = `Tu es Florence (Flo), spécialiste MONFLUX des contrats de construction au Québec.
Tu reçois un contrat HTML existant. Ta tâche est de l'améliorer pour le rendre plus clair, professionnel et adapté au contexte du projet.

CONTEXTE PROJET
${JSON.stringify(mergeFields, null, 2)}

CONTRAT ACTUEL
${content}

OBJECTIF SUPPLÉMENTAIRE
${goal || 'Ajouter les précisions contextuelles pertinentes, clarifier les clauses et garder un ton professionnel.'}

Contraintes:
- Retourne UNIQUEMENT le HTML final du corps du document
- Conserve un format propre type document
- N'invente pas de données factuelles absentes
- Tu peux ajouter clauses utiles: accès chantier, conditions cachées, météo, changements, échéancier, coordination
`;
      const msg = await ai.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      });
      content = msg.content?.[0]?.text?.trim() || content;
      enrichedBy = 'flo';
    } else {
      content = buildFallbackFloContractHtml(content, mergeFields);
    }

    const nextMeta = { ...(contract.meta || {}), flo_enriched_at: new Date().toISOString(), flo_enriched_by: enrichedBy };
    let updated;
    try {
      ({ rows: [updated] } = await query(
        `UPDATE contracts
         SET content = $1, meta = $2, updated_at = NOW()
         WHERE id = $3 AND company_id = $4
         RETURNING *`,
        [content, JSON.stringify(nextMeta), req.params.id, req.company_id]
      ));
    } catch (err) {
      if (!/meta/i.test(String(err?.message || ''))) throw err;
      ({ rows: [updated] } = await query(
        `UPDATE contracts
         SET content = $1, updated_at = NOW()
         WHERE id = $2 AND company_id = $3
         RETURNING *`,
        [content, req.params.id, req.company_id]
      ));
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur enrichissement contrat' });
  }
});

export default router;
