import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/chat — general AI chat (streaming)
router.post('/', async (req, res) => {
  const { messages, context_type = 'general', project_id, conversation_id } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'Messages requis' });

  const { rows: [company] } = await query(`SELECT name, sector, modules_enabled FROM companies WHERE id = $1`, [req.company_id]);

  const systemPrompt = `Tu es l'assistant IA de MONFLUX pour ${company?.name || 'cette entreprise'} (secteur: ${company?.sector || 'construction'}).
Tu aides les entrepreneurs en construction québécois à gérer leurs projets, leads, soumissions, sous-traitants et facturations.
Tu parles en français québécois. Tu es direct, pratique et efficace.
Contexte: ${context_type}${project_id ? ` / Projet: ${project_id}` : ''}
Plan actif: ${req.plan.slug} (${req.plan.is_dev_override ? 'MODE DEV' : 'réel'})`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    let fullText = '';
    stream.on('text', (text) => {
      fullText += text;
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('message', async () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

      // Persist conversation
      if (conversation_id) {
        const allMessages = [...messages, { role: 'assistant', content: fullText }];
        await query(
          `UPDATE ai_conversations SET messages = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(allMessages), conversation_id]
        ).catch(() => {});
      }
    });

    stream.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Erreur IA' })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Erreur IA' })}\n\n`);
    res.end();
  }
});

// POST /api/chat/conversations — start/get conversation
router.post('/conversations', async (req, res) => {
  const { context_type = 'general', project_id } = req.body;
  const { rows: [conv] } = await query(
    `INSERT INTO ai_conversations (company_id, user_id, context_type, project_id, messages)
     VALUES ($1,$2,$3,$4,'[]') RETURNING id`,
    [req.company_id, req.user.userId, context_type, project_id||null]
  );
  res.status(201).json(conv);
});

export default router;
