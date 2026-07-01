import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { logActivity } from '../activityLog.js';

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

    // Strip internal fields — signature_data (raw canvas/typed blob) never needs to round-trip
    // back over the public link once captured; it stays reserved for the internal app + audit log.
    const { company_id, signature_data, ...safe } = q;
    res.json({ ...safe, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/quote/:token/sign
// Capture les preuves de non-répudiation : nom, type/données de signature, IP, user-agent,
// hash du document signé (calculé côté serveur à partir de l'état réel en DB, pas fourni par le client),
// consentement explicite. Le tout est aussi journalisé dans activity_log (insert-only = immuable en pratique).
router.post('/quote/:token/sign', async (req, res) => {
  try {
    const { signer_name, signature_type, signature_data, consent } = req.body || {};
    if (!signer_name || !String(signer_name).trim()) return res.status(400).json({ error: 'Nom du signataire requis' });
    if (!['drawn', 'typed'].includes(signature_type)) return res.status(400).json({ error: 'Type de signature invalide' });
    if (!signature_data) return res.status(400).json({ error: 'Signature requise' });
    if (consent !== true) return res.status(400).json({ error: 'Consentement requis pour signer électroniquement' });

    const { rows: [q] } = await query(
      `SELECT id, company_id, project_id, status, signed_at FROM quotes WHERE interactive_token = $1`,
      [req.params.token]
    );
    if (!q) return res.status(404).json({ error: 'Soumission introuvable' });
    if (q.signed_at) return res.status(409).json({ error: 'Déjà signée' });

    const { rows: items } = await query(`SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`, [q.id]);
    const { rows: [full] } = await query(`SELECT * FROM quotes WHERE id = $1`, [q.id]);
    const documentSnapshot = {
      quote: {
        id: full.id, title: full.title, subtotal: full.subtotal,
        tps_amount: full.tps_amount, tvq_amount: full.tvq_amount, total: full.total,
        valid_until: full.valid_until, description: full.description,
      },
      items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, unit_price: i.unit_price, type: i.type })),
    };
    const documentHash = crypto.createHash('sha256').update(JSON.stringify(documentSnapshot)).digest('hex');

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;
    const signerNameTrimmed = String(signer_name).trim();

    // Chiffrement au repos si pgcrypto est disponible sur cet hébergeur — sinon on stocke en clair
    // plutôt que de bloquer la signature (dégradation gracieuse, jamais de perte de preuve).
    let storedSignatureData = signature_data;
    let signatureEncrypted = false;
    const encryptionKey = process.env.SIGNATURE_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (encryptionKey) {
      try {
        const { rows: [enc] } = await query(
          `SELECT encode(pgp_sym_encrypt($1, $2), 'base64') AS enc`,
          [signature_data, encryptionKey]
        );
        storedSignatureData = enc.enc;
        signatureEncrypted = true;
      } catch (encErr) {
        console.warn('Signature encryption unavailable (pgcrypto missing?) — storing signature in plaintext:', encErr.message);
      }
    }

    const { rows: [updated] } = await query(
      `UPDATE quotes SET status = 'signed', signed_at = NOW(), signed_ip = $1, signer_name = $2,
         signature_type = $3, signature_data = $4, signed_user_agent = $5, signed_document_hash = $6,
         signed_consent = TRUE, signature_encrypted = $7
       WHERE interactive_token = $8 RETURNING id, signed_at, signer_name`,
      [ip, signerNameTrimmed, signature_type, storedSignatureData, userAgent, documentHash, signatureEncrypted, req.params.token]
    );

    logActivity({
      companyId: q.company_id,
      projectId: q.project_id,
      actorType: 'client',
      action: 'quote_signed',
      payload: {
        quote_id: q.id, signer_name: signerNameTrimmed, signature_type,
        ip, user_agent: userAgent, document_hash: documentHash, consent: true,
        actor: 'client_portal',
      },
    });

    res.json({ success: true, signed_at: updated.signed_at, signer_name: updated.signer_name });
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

// Résout le projet + company_id à partir d'un portal_token client — utilisé par toutes les routes
// de soumission/consultation ci-dessous. Ne retourne jamais field_assessment complet (données internes).
async function resolveClientProject(token) {
  const { rows: [project] } = await query(
    `SELECT id, company_id FROM projects WHERE portal_token = $1`,
    [token]
  );
  return project || null;
}

// GET /api/public/portal/:token/invoices — factures client (statut + montants, aucune donnée de coût/marge)
router.get('/portal/:token/invoices', async (req, res) => {
  try {
    const project = await resolveClientProject(req.params.token);
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const { rows } = await query(
      `SELECT number, status, total, due_date, sent_at, paid_at, public_token
       FROM invoices
       WHERE project_id = $1 AND company_id = $2 AND status != 'draft'
       ORDER BY created_at DESC`,
      [project.id, project.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/public/portal/:token/documents — tous les documents destinés au client, en un seul endroit
router.get('/portal/:token/documents', async (req, res) => {
  try {
    const project = await resolveClientProject(req.params.token);
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const [{ rows: quotes }, { rows: contracts }, { rows: invoices }, { rows: quittances }] = await Promise.all([
      query(`SELECT id, title, status, interactive_token, sent_at, signed_at, created_at FROM quotes
             WHERE project_id = $1 AND company_id = $2 AND status != 'draft' ORDER BY created_at DESC`,
        [project.id, project.company_id]),
      query(`SELECT id, title, status, public_token, created_at FROM contracts
             WHERE project_id = $1 AND company_id = $2 AND status != 'draft' ORDER BY created_at DESC`,
        [project.id, project.company_id]),
      query(`SELECT id, number, status, public_token, created_at FROM invoices
             WHERE project_id = $1 AND company_id = $2 AND status != 'draft' ORDER BY created_at DESC`,
        [project.id, project.company_id]),
      query(`SELECT id, status, public_token, created_at FROM quittances
             WHERE project_id = $1 AND company_id = $2 AND status != 'draft' ORDER BY created_at DESC`,
        [project.id, project.company_id]).catch(() => ({ rows: [] })),
    ]);

    const documents = [
      ...quotes.map((q) => ({ type: 'quote', label: q.title || 'Soumission', status: q.status, created_at: q.created_at, url: `${frontendUrl}/soumission/${q.interactive_token}` })),
      ...contracts.map((c) => ({ type: 'contract', label: c.title || 'Contrat', status: c.status, created_at: c.created_at, url: `${frontendUrl}/contrat/${c.public_token}` })),
      ...invoices.map((i) => ({ type: 'invoice', label: `Facture #${i.number}`, status: i.status, created_at: i.created_at, url: `${frontendUrl}/facture/${i.public_token}` })),
      ...quittances.map((q) => ({ type: 'quittance', label: 'Quittance', status: q.status, created_at: q.created_at, url: `${frontendUrl}/quittance/${q.public_token}` })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/portal/:token/change-orders — le client soumet une demande de modification
router.post('/portal/:token/change-orders', async (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Titre requis' });
    const project = await resolveClientProject(req.params.token);
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const { rows: [numRow] } = await query(
      `SELECT COALESCE(MAX(number), 0) + 1 AS next_num FROM change_orders WHERE company_id = $1`,
      [project.company_id]
    );
    const { rows: [co] } = await query(
      `INSERT INTO change_orders (company_id, project_id, title, description, amount, notes, number, status)
       VALUES ($1,$2,$3,$4,0,$5,$6,'pending_approval') RETURNING id`,
      [project.company_id, project.id, String(title).trim(), description || null, 'Soumise par le client depuis le portail.', numRow.next_num]
    );

    logActivity({
      companyId: project.company_id, projectId: project.id, actorType: 'client',
      action: 'change_order_created',
      payload: { change_order_id: co.id, title: String(title).trim(), actor: 'client_portal' },
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/portal/:token/non-conformites — le client signale une non-conformité
router.post('/portal/:token/non-conformites', async (req, res) => {
  try {
    const { titre, description } = req.body || {};
    if (!titre || !String(titre).trim()) return res.status(400).json({ error: 'Titre requis' });
    const { rows: [project] } = await query(
      `SELECT id, company_id, field_assessment FROM projects WHERE portal_token = $1`,
      [req.params.token]
    );
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const fa = project.field_assessment || {};
    const entry = {
      id: `nc-${Date.now()}`,
      titre: String(titre).trim(),
      description: description || '',
      source: 'client',
      statut: 'ouverte',
      date_signalement: new Date().toISOString().slice(0, 10),
      responsable: '',
      date_correction: '',
      notes: '',
    };
    const nextFa = { ...fa, non_conformites: [entry, ...(fa.non_conformites || [])] };
    await query(`UPDATE projects SET field_assessment = $1, updated_at = NOW() WHERE id = $2`, [nextFa, project.id]);

    logActivity({
      companyId: project.company_id, projectId: project.id, actorType: 'client',
      action: 'non_conformity_reported',
      payload: { titre: entry.titre, actor: 'client_portal' },
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/public/portal/:token/media — le client ajoute une note / photo / vidéo
router.post('/portal/:token/media', async (req, res) => {
  try {
    const { caption, url, mime_type, author_name } = req.body || {};
    if (!caption?.trim() && !url?.trim()) return res.status(400).json({ error: 'Note ou photo/vidéo requise' });
    const project = await resolveClientProject(req.params.token);
    if (!project) return res.status(404).json({ error: 'Portail introuvable ou lien invalide' });

    const { rows: [m] } = await query(
      `INSERT INTO site_media (company_id, project_id, type, url, mime_type, caption, author_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [project.company_id, project.id, url ? 'photo' : 'note', url || null, mime_type || null, caption || null, author_name?.trim() || 'Client']
    );

    logActivity({
      companyId: project.company_id, projectId: project.id, actorType: 'client',
      action: 'note_added',
      payload: { media_id: m.id, actor: 'client_portal' },
    });

    res.status(201).json({ success: true });
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
