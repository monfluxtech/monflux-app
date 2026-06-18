import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

router.get('/project/:projectId', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC`,
    [req.params.projectId]
  );
  res.json(rows);
});

// POST /api/documents — register uploaded doc & trigger AI extraction
router.post('/', async (req, res) => {
  const { project_id, phase_id, type, name, file_url, mime_type, file_size } = req.body;
  if (!project_id || !file_url) return res.status(400).json({ error: 'project_id et file_url requis' });

  const { rows: [doc] } = await query(
    `INSERT INTO project_documents (project_id, uploaded_by, type, name, file_url, mime_type, file_size, phase_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [project_id, req.user.userId, type||'other', name||'Document', file_url, mime_type||null, file_size||null, phase_id||null]
  );

  // Trigger async AI extraction if it's a plan or photo
  if (['plan','photo'].includes(type)) {
    extractDimensions(doc.id, file_url, mime_type).catch(console.error);
  }

  res.status(201).json(doc);
});

async function extractDimensions(doc_id, file_url, mime_type) {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const isImage = mime_type?.startsWith('image/');
    let content;

    if (isImage) {
      const resp = await fetch(file_url);
      const buffer = await resp.arrayBuffer();
      const b64 = Buffer.from(buffer).toString('base64');
      content = [
        { type: 'image', source: { type: 'base64', media_type: mime_type, data: b64 } },
        { type: 'text', text: `Analyse ce plan ou cette photo de chantier. 
Extrais en JSON toutes les dimensions visibles: surfaces (m²), longueurs (m), ouvertures (fenêtres, portes), type de pièce/zone.
Format: {"surfaces":[],"dimensions":[],"openings":[],"rooms":[],"notes":"..."}
Réponds uniquement avec le JSON valide.` }
      ];
    } else {
      content = [{ type: 'text', text: `Voici l'URL d'un plan: ${file_url}\nExtrais les dimensions disponibles en JSON.` }];
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    });

    const raw = msg.content[0]?.text || '{}';
    const extracted = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}');

    await query(
      `UPDATE project_documents SET extracted_data = $1, extraction_done = TRUE WHERE id = $2`,
      [JSON.stringify(extracted), doc_id]
    );
  } catch (err) {
    await query(
      `UPDATE project_documents SET extraction_error = $1, extraction_done = FALSE WHERE id = $2`,
      [err.message, doc_id]
    );
  }
}

export default router;
