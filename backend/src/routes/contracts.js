import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();

// ── Public endpoints (no auth) ────────────────────────────────────────────────
router.get('/public/:token', async (req, res) => {
  try {
    const { rows: [c] } = await query(
      `SELECT c.*, comp.name AS company_name
       FROM contracts c
       LEFT JOIN companies comp ON comp.id = c.company_id
       WHERE c.public_token = $1`,
      [req.params.token]
    );
    if (!c) return res.status(404).json({ error: 'Contrat non trouvé' });
    res.json(c);
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
    res.json(rows);
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
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['title', 'content', 'status'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  const set = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const vals = [...Object.values(updates), req.params.id, req.company_id];
  try {
    const { rows: [c] } = await query(
      `UPDATE contracts SET ${set}, updated_at = NOW()
       WHERE id = $${vals.length - 1} AND company_id = $${vals.length}
       RETURNING *`,
      vals
    );
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

export default router;
