import express from 'express';
import { query, getClient } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
import { buildContractMergeFields, detectContractTemplateKey, normalizeContractTemplates, renderContractTemplate } from '../lib/contracts.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT q.*, c.name AS client_name FROM quotes q
     LEFT JOIN contacts c ON c.id = (SELECT client_id FROM projects WHERE id = q.project_id LIMIT 1)
     WHERE q.company_id = $1 ORDER BY q.created_at DESC`,
    [req.company_id]
  );
  res.json(rows);
});

// GET /api/quotes/project/:projectId — quotes for a specific project, with line items
router.get('/project/:projectId', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT q.* FROM quotes q
       WHERE q.company_id = $1 AND q.project_id = $2 ORDER BY q.created_at DESC`,
      [req.company_id, req.params.projectId]
    );
    const result = await Promise.all(rows.map(async (q) => {
      const { rows: items } = await query(
        `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`,
        [q.id]
      );
      return { ...q, items };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  const { rows: [q] } = await query(`SELECT * FROM quotes WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
  const { rows: items } = await query(`SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`, [req.params.id]);
  // signature_data peut être chiffré (opaque, base64) — utiliser GET /:id/signature pour la valeur en clair.
  const { signature_data, ...safeQuote } = q;
  res.json({ ...safeQuote, items });
});

// GET /api/quotes/:id/signature — déchiffre et retourne la signature (image ou nom tapé), usage interne authentifié
router.get('/:id/signature', async (req, res) => {
  try {
    const { rows: [q] } = await query(
      `SELECT signature_data, signature_encrypted, signature_type, signer_name, signed_at, signed_ip, signed_document_hash
       FROM quotes WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
    if (!q.signature_data) return res.status(404).json({ error: 'Aucune signature enregistrée' });

    let signatureData = q.signature_data;
    if (q.signature_encrypted) {
      const encryptionKey = process.env.SIGNATURE_ENCRYPTION_KEY || process.env.JWT_SECRET;
      try {
        const { rows: [dec] } = await query(
          `SELECT pgp_sym_decrypt(decode($1, 'base64'), $2) AS dec`,
          [q.signature_data, encryptionKey]
        );
        signatureData = dec.dec;
      } catch (decErr) {
        console.error('Signature decryption failed:', decErr.message);
        return res.status(500).json({ error: 'Erreur de déchiffrement de la signature' });
      }
    }

    res.json({
      signature_data: signatureData,
      signature_type: q.signature_type,
      signer_name: q.signer_name,
      signed_at: q.signed_at,
      signed_ip: q.signed_ip,
      signed_document_hash: q.signed_document_hash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  const { project_id, lead_id, title, format, valid_until, items = [] } = req.body;
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    const { rows: [q] } = await client.query(
      `INSERT INTO quotes (company_id, project_id, lead_id, title, format, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.company_id, project_id||null, lead_id||null, title||'Soumission', format||'pdf', valid_until||null]
    );
    for (const [i, item] of items.entries()) {
      await client.query(
        `INSERT INTO quote_items (quote_id,type,name,qty,unit,unit_price,total,display_order,supplier,supplier_url,show_on_quote)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [q.id, item.type||'material', item.name, item.qty||1, item.unit||'un.', item.unit_price||0,
         (item.qty||1)*(item.unit_price||0), i, item.supplier||null, item.url||item.supplier_url||null,
         item.show_on_quote !== false]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(q);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = ['status','title','valid_until','format','notes','followup_config','subtotal','total','category_notes','detail_level'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (updates.category_notes) updates.category_notes = JSON.stringify(updates.category_notes);
  const hasItems = Array.isArray(req.body.items);

  // If line items are provided, replace them and recompute totals inside a transaction.
  if (hasItems) {
    const items = req.body.items;
    const subtotal = items.reduce((s, it) => s + (Number(it.qty)||1) * (Number(it.unit_price)||0), 0);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Ownership check
      const { rows: [own] } = await client.query(`SELECT id FROM quotes WHERE id=$1 AND company_id=$2`, [req.params.id, req.company_id]);
      if (!own) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Soumission non trouvée' }); }

      await client.query(`DELETE FROM quote_items WHERE quote_id=$1`, [req.params.id]);
      for (const [i, item] of items.entries()) {
        await client.query(
          `INSERT INTO quote_items (quote_id,type,name,qty,unit,unit_price,total,display_order,supplier,supplier_url,show_on_quote)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [req.params.id, item.type||'material', item.name, item.qty||1, item.unit||'un.', item.unit_price||0,
           (Number(item.qty)||1)*(Number(item.unit_price)||0), i, item.supplier||null, item.url||item.supplier_url||null,
           item.show_on_quote !== false]
        );
      }
      // Merge explicit field updates with recomputed totals
      const merged = { ...updates, subtotal, total: subtotal };
      const setClause = Object.keys(merged).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(merged), req.params.id];
      const { rows: [q] } = await client.query(
        `UPDATE quotes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      );
      await client.query('COMMIT');
      const { rows: savedItems } = await query(`SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY display_order`, [req.params.id]);
      return res.json({ ...q, items: savedItems });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
      client.release();
    }
  }

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ valide' });
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [q] } = await query(
    `UPDATE quotes SET ${setClause}, updated_at = NOW() WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
  res.json(q);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM quotes WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

// POST /api/quotes/:id/send — mark as sent + advance project pipeline to prix_envoye
router.post('/:id/send', async (req, res) => {
  try {
    const { rows: [q] } = await query(
      `UPDATE quotes SET status = 'sent', updated_at = NOW()
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [req.params.id, req.company_id]
    );
    if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
    if (q.project_id) {
      await query(
        `UPDATE projects SET status = 'prix_envoye', price_sent_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND company_id = $2
           AND status NOT IN ('accepte','en_chantier','a_facturer','paye','clos')`,
        [q.project_id, req.company_id]
      );
    }
    res.json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/quotes/:id/generate-contract — generate a contract from the quote
router.post('/:id/generate-contract', async (req, res) => {
  try {
    const { template_key: requestedTemplateKey, replace_contract_id: replaceContractId } = req.body || {};
    const { rows: [q] } = await query(
      `SELECT q.*, p.name AS project_name, p.address AS project_address, p.city AS project_city,
              p.payment_terms, p.start_date AS project_start_date, p.end_date AS project_end_date,
              p.description AS project_description, p.type AS project_type, p.field_assessment,
              p.client_name AS project_client_name, p.client_email AS project_client_email,
              c.id AS client_id, c.name AS client_name, c.email AS client_email
       FROM quotes q
       LEFT JOIN projects p ON p.id = q.project_id
       LEFT JOIN contacts c ON c.id = p.client_id
       WHERE q.id = $1 AND q.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });

    const [{ rows: items }, { rows: [company] }, { rows: [config] }] = await Promise.all([
      query(`SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY display_order`, [q.id]),
      query(`SELECT * FROM companies WHERE id = $1`, [req.company_id]),
      query(`SELECT * FROM company_config WHERE company_id = $1`, [req.company_id]),
    ]);

    const project = {
      id: q.project_id,
      name: q.project_name,
      address: q.project_address,
      city: q.project_city,
      payment_terms: q.payment_terms,
      start_date: q.project_start_date,
      end_date: q.project_end_date,
      description: q.project_description,
      type: q.project_type,
      field_assessment: q.field_assessment || {},
      client_name: q.project_client_name,
      client_email: q.project_client_email,
    };
    const client = {
      id: q.client_id,
      name: q.client_name || q.project_client_name,
      email: q.client_email || q.project_client_email,
    };
    const quote = { ...q, items };

    const templateConfig = normalizeContractTemplates(config?.contract_templates);
    const detectedTemplateKey = requestedTemplateKey || detectContractTemplateKey(project, templateConfig);
    const template = templateConfig.templates.find((item) => item.key === detectedTemplateKey)
      || templateConfig.templates.find((item) => item.key === templateConfig.default_key)
      || templateConfig.templates[0];

    const mergeFields = buildContractMergeFields({ company, project, quote, client });
    const content = renderContractTemplate(template?.content, mergeFields);
    const meta = {
      template_label: template?.label || 'Contrat',
      detected_template_key: detectedTemplateKey,
      merge_fields: mergeFields,
    };
    let contract;
    if (replaceContractId) {
      try {
        ({ rows: [contract] } = await query(
          `UPDATE contracts
           SET title = $1, content = $2, template_key = $3, meta = $4, updated_at = NOW()
           WHERE id = $5 AND company_id = $6
           RETURNING *`,
          [mergeFields.contract_title, content, template?.key || null, JSON.stringify(meta), replaceContractId, req.company_id]
        ));
      } catch (err) {
        if (!/template_key|meta|content/i.test(String(err?.message || ''))) throw err;
        try {
          ({ rows: [contract] } = await query(
            `UPDATE contracts
             SET title = $1, content = $2, updated_at = NOW()
             WHERE id = $3 AND company_id = $4
             RETURNING *`,
            [mergeFields.contract_title, content, replaceContractId, req.company_id]
          ));
        } catch (legacyErr) {
          if (!/content/i.test(String(legacyErr?.message || ''))) throw legacyErr;
          ({ rows: [contract] } = await query(
            `UPDATE contracts
             SET title = $1, terms = $2, updated_at = NOW()
             WHERE id = $3 AND company_id = $4
             RETURNING *`,
            [mergeFields.contract_title, content, replaceContractId, req.company_id]
          ));
          if (contract && !contract.content) contract.content = contract.terms || content;
        }
      }
    }
    if (!contract) {
      try {
        ({ rows: [contract] } = await query(
          `INSERT INTO contracts (company_id, project_id, quote_id, title, content, created_by, template_key, meta)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [
            req.company_id, q.project_id || null, q.id,
            mergeFields.contract_title,
            content, req.user.userId,
            template?.key || null,
            JSON.stringify(meta),
          ]
        ));
      } catch (err) {
        if (!/template_key|meta|content|created_by/i.test(String(err?.message || ''))) throw err;
        try {
          ({ rows: [contract] } = await query(
            `INSERT INTO contracts (company_id, project_id, quote_id, title, content, created_by)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [
              req.company_id, q.project_id || null, q.id,
              mergeFields.contract_title,
              content, req.user.userId,
            ]
          ));
        } catch (legacyErr) {
          if (!/content|created_by/i.test(String(legacyErr?.message || ''))) throw legacyErr;
          ({ rows: [contract] } = await query(
            `INSERT INTO contracts (company_id, project_id, quote_id, title, terms)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [
              req.company_id, q.project_id || null, q.id,
              mergeFields.contract_title,
              content,
            ]
          ));
          if (contract && !contract.content) contract.content = contract.terms || content;
        }
      }
    }
    res.status(201).json({ ...contract, content: contract?.content || contract?.terms || content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/convert', async (req, res) => {
  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');
    const { rows: [q] } = await client.query(
      `SELECT q.*, l.title AS lead_title, l.id AS l_id, c.name AS client_name, c.email AS client_email
       FROM quotes q
       LEFT JOIN leads l ON l.id = q.lead_id
       LEFT JOIN contacts c ON c.id = l.contact_id
       WHERE q.id = $1 AND q.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!q) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Soumission non trouvée' }); }

    // Create project
    const { rows: [proj] } = await client.query(
      `INSERT INTO projects (company_id,name,status,type_of_work,budget_total)
       VALUES ($1,$2,'active',$3,$4) RETURNING *`,
      [req.company_id, q.title || q.lead_title || 'Nouveau projet', q.type_of_work || 'other', q.total || 0]
    );

    // Link quote to project
    await client.query(`UPDATE quotes SET project_id=$1, status='converted' WHERE id=$2`, [proj.id, q.id]);

    // Mark lead as won
    if (q.l_id) {
      await client.query(`UPDATE leads SET status='won', won_at=NOW() WHERE id=$1`, [q.l_id]);
    }

    // Create first invoice (acompte 30%)
    const acompte = Math.round((Number(q.total) || 0) * 0.3 * 100) / 100;
    const { rows: [count] } = await client.query(`SELECT COUNT(*)+1 AS n FROM invoices WHERE company_id=$1`, [req.company_id]);
    const number = `FAC-${String(count.n).padStart(4,'0')}`;
    const { rows: [inv] } = await client.query(
      `INSERT INTO invoices (company_id,project_id,number,client_name,client_email,subtotal,tps_pct,tvq_pct,tps_amount,tvq_amount,total,amount_due,status)
       VALUES ($1,$2,$3,$4,$5,$6,5,9.975,$7,$8,$9,$10,'draft') RETURNING *`,
      [req.company_id, proj.id, number, q.client_name||'Client', q.client_email||null,
       acompte, acompte*0.05, acompte*0.09975,
       acompte*(1+0.05+0.09975), acompte*(1+0.05+0.09975)]
    );
    await client.query(
      `INSERT INTO invoice_items (invoice_id,description,qty,unit_price,total,order_idx) VALUES ($1,$2,1,$3,$4,0)`,
      [inv.id, 'Acompte (30%)', acompte, acompte]
    );

    await client.query('COMMIT');
    res.status(201).json({ project: proj, invoice: inv });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

export default router;
