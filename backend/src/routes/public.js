import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET /api/public/quote/:token — no auth required
router.get('/quote/:token', async (req, res) => {
  try {
    const { rows: [q] } = await query(
      `SELECT q.*, co.name AS company_name, co.phone AS company_phone, co.email AS company_email,
              co.address AS company_address, co.logo_url AS company_logo
       FROM quotes q
       JOIN companies co ON co.id = q.company_id
       WHERE q.interactive_token = $1`,
      [req.params.token]
    );
    if (!q) return res.status(404).json({ error: 'Soumission introuvable' });

    // Record view
    await query(
      `UPDATE quotes SET viewed_at = COALESCE(viewed_at, NOW()), viewed_count = viewed_count + 1 WHERE interactive_token = $1`,
      [req.params.token]
    );

    const { rows: items } = await query(
      `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`,
      [q.id]
    );

    // Strip internal fields
    const { company_id, ...safe } = q;
    res.json({ ...safe, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/quote/:token/sign
router.post('/quote/:token/sign', async (req, res) => {
  try {
    const { rows: [q] } = await query(
      `SELECT id, status, signed_at FROM quotes WHERE interactive_token = $1`,
      [req.params.token]
    );
    if (!q) return res.status(404).json({ error: 'Soumission introuvable' });
    if (q.signed_at) return res.status(409).json({ error: 'Déjà signée' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { rows: [updated] } = await query(
      `UPDATE quotes SET status = 'signed', signed_at = NOW(), signed_ip = $1 WHERE interactive_token = $2 RETURNING *`,
      [ip, req.params.token]
    );
    res.json({ success: true, signed_at: updated.signed_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/quote/:token/decline
router.post('/quote/:token/decline', async (req, res) => {
  try {
    const { rows: [q] } = await query(
      `SELECT id, signed_at FROM quotes WHERE interactive_token = $1`,
      [req.params.token]
    );
    if (!q) return res.status(404).json({ error: 'Soumission introuvable' });
    await query(
      `UPDATE quotes SET status = 'rejected' WHERE interactive_token = $1 AND signed_at IS NULL`,
      [req.params.token]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/invoice/:token
router.get('/invoice/:token', async (req, res) => {
  try {
    const { rows: [inv] } = await query(
      `SELECT i.*, co.name AS company_name, co.phone AS company_phone,
              co.email AS company_email, co.address AS company_address, co.logo_url AS company_logo
       FROM invoices i
       JOIN companies co ON co.id = i.company_id
       WHERE i.public_token = $1`,
      [req.params.token]
    );
    if (!inv) return res.status(404).json({ error: 'Facture introuvable' });

    // Track view
    await query(`UPDATE invoices SET viewed_at = COALESCE(viewed_at, NOW()) WHERE public_token = $1`, [req.params.token]);

    const { rows: items } = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY order_idx`,
      [inv.id]
    );
    const { company_id, ...safe } = inv;
    res.json({ ...safe, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/quittance/:token — public signing page
router.get('/quittance/:token', async (req, res) => {
  try {
    const { rows: [q] } = await query(
      `SELECT qu.*, p.name AS project_name, p.address AS project_address,
              co.name AS company_name, co.phone AS company_phone,
              co.email AS company_email, co.address AS company_address, co.website AS company_website
       FROM quittances qu
       LEFT JOIN projects p ON p.id = qu.project_id
       JOIN companies co ON co.id = qu.company_id
       WHERE qu.public_token = $1`,
      [req.params.token]
    );
    if (!q) return res.status(404).json({ error: 'Quittance introuvable' });
    const { company_id, ...safe } = q;
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/quittance/:token/sign — client signs
router.post('/quittance/:token/sign', async (req, res) => {
  try {
    const { signer_name } = req.body;
    const { rows: [q] } = await query(
      `SELECT id, signed_at FROM quittances WHERE public_token = $1`,
      [req.params.token]
    );
    if (!q) return res.status(404).json({ error: 'Quittance introuvable' });
    if (q.signed_at) return res.status(409).json({ error: 'Déjà signée' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await query(
      `UPDATE quittances SET status = 'signed', signed_at = NOW(), signed_ip = $1,
         client_name = COALESCE($2, client_name)
       WHERE public_token = $3`,
      [ip, signer_name || null, req.params.token]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/change-order/:token — client views change order
router.get('/change-order/:token', async (req, res) => {
  try {
    const { rows: [co] } = await query(
      `SELECT co.*, p.name AS project_name, p.address AS project_address,
              c.name AS company_name, c.phone AS company_phone, c.email AS company_email,
              c.website AS company_website, c.address AS company_address
       FROM change_orders co
       JOIN companies c ON c.id = co.company_id
       LEFT JOIN projects p ON p.id = co.project_id
       WHERE co.public_token::text = $1 `,
      [req.params.token]
    );
    if (!co) return res.status(404).json({ error: 'Demande introuvable ou lien invalide' });
    const { company_id, ...safe } = co;
    res.json(safe);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/public/change-order/:token/approve — client approves
router.post('/change-order/:token/approve', async (req, res) => {
  try {
    const { signer_name } = req.body;
    const { rows: [co] } = await query(
      `SELECT id, approved_at, signed_at FROM change_orders WHERE public_token::text = $1 `,
      [req.params.token]
    );
    if (!co) return res.status(404).json({ error: 'Demande introuvable' });
    if (co.approved_at || co.signed_at) return res.status(409).json({ error: 'Déjà approuvée' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await query(
      `UPDATE change_orders
       SET status = 'approved',
           approved_at = NOW(),
           approved_by = COALESCE($1, approved_by),
           approved_ip = $2,
           signer_name = COALESCE($1, signer_name),
           signed_at   = NOW(),
           signed_ip   = $2,
           updated_at  = NOW()
       WHERE public_token::text = $3 `,
      [signer_name || null, ip, req.params.token]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/public/change-order/:token/reject — client rejects
router.post('/change-order/:token/reject', async (req, res) => {
  try {
    const { rows: [co] } = await query(
      `SELECT id, approved_at, rejected_at FROM change_orders WHERE public_token::text = $1 `,
      [req.params.token]
    );
    if (!co) return res.status(404).json({ error: 'Demande introuvable' });
    if (co.approved_at || co.rejected_at) return res.status(409).json({ error: 'Déjà traitée' });

    await query(
      `UPDATE change_orders SET status = 'rejected', rejected_at = NOW(), updated_at = NOW()
       WHERE public_token::text = $1 `,
      [req.params.token]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/public/portal/:token — client project progress portal
router.get('/portal/:token', async (req, res) => {
  try {
    const { rows: [project] } = await query(
      `SELECT p.id, p.name, p.status, p.address, p.city, p.start_date, p.end_date,
              p.progress_pct, p.description, p.field_assessment,
              co.name AS company_name, co.phone AS company_phone, co.email AS company_email,
              co.website AS company_website, co.logo_url AS company_logo
       FROM projects p
       JOIN companies co ON co.id = p.company_id
       WHERE p.portal_token = $1`,
      [req.params.token]
    );
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const { rows: phases } = await query(
      `SELECT name, status, progress_pct, display_order
       FROM project_phases
       WHERE project_id = $1
       ORDER BY display_order`,
      [project.id]
    );

    const { rows: messages } = await query(
      `SELECT author_name, content, created_at
       FROM portal_messages
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [project.id]
    );

    const { rows: [quote] } = await query(
      `SELECT id, title, status, interactive_token, sent_at, signed_at
       FROM quotes
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [project.id]
    );

    const { id, field_assessment, ...safeProject } = project;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.json({
      ...safeProject,
      phases,
      messages,
      portal_visibility: field_assessment?.portal_visibility || null,
      quote_title: quote?.title || null,
      quote_status: quote?.status || null,
      quote_sent_at: quote?.sent_at || null,
      quote_signed_at: quote?.signed_at || null,
      quote_url: quote?.interactive_token ? `${frontendUrl}/soumission/${quote.interactive_token}` : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/portal/:token/feedback — client leaves a note (optional)
router.post('/portal/:token/feedback', async (req, res) => {
  try {
    const { message, author_name } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message requis' });
    const { rows: [project] } = await query(
      `SELECT id FROM projects WHERE portal_token = $1`,
      [req.params.token]
    );
    if (!project) return res.status(404).json({ error: 'Portail introuvable' });

    await query(
      `INSERT INTO portal_messages (project_id, content, author_name)
       VALUES ($1, $2, $3)`,
      [project.id, message.trim(), author_name?.trim() || 'Client']
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/portal/supplier/:token — supplier project portal
router.get('/portal/supplier/:token', async (req, res) => {
  try {
    const { rows: [project] } = await query(
      `SELECT p.id, p.name, p.status, p.address, p.city, p.start_date, p.end_date,
              p.progress_pct, p.description, p.field_assessment,
              co.name AS company_name, co.phone AS company_phone, co.email AS company_email
       FROM projects p
       JOIN companies co ON co.id = p.company_id
       WHERE p.supplier_portal_token = $1`,
      [req.params.token]
    );
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const { rows: phases } = await query(
      `SELECT name, status, start_date, end_date, progress_pct, display_order
       FROM project_phases
       WHERE project_id = $1
       ORDER BY display_order`,
      [project.id]
    );

    const { id, field_assessment, ...safeProject } = project;
    res.json({ ...safeProject, phases, portal_visibility: field_assessment?.portal_visibility || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
