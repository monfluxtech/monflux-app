import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOOLS = [
  {
    name: 'create_lead',
    description: "Crée un nouveau lead (client potentiel) dans MONFLUX quand l'utilisateur le demande explicitement.",
    input_schema: {
      type: 'object',
      properties: {
        title:         { type: 'string',  description: 'Titre ou description du projet (ex: Rénovation cuisine Laval)' },
        contact_name:  { type: 'string',  description: 'Nom du client potentiel' },
        contact_phone: { type: 'string',  description: 'Numéro de téléphone' },
        contact_email: { type: 'string',  description: 'Adresse courriel' },
        budget:        { type: 'number',  description: 'Budget estimé en dollars canadiens' },
        notes:         { type: 'string',  description: 'Notes additionnelles' },
        source:        { type: 'string',  enum: ['website','referral','facebook','kijiji','call','other'] },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_project',
    description: 'Crée un nouveau projet de construction actif dans MONFLUX.',
    input_schema: {
      type: 'object',
      properties: {
        name:           { type: 'string',  description: 'Nom du projet' },
        client_name:    { type: 'string',  description: 'Nom du client' },
        address:        { type: 'string',  description: 'Adresse du chantier' },
        contract_value: { type: 'number',  description: 'Valeur du contrat en $' },
        start_date:     { type: 'string',  description: 'Date de début YYYY-MM-DD' },
        end_date:       { type: 'string',  description: 'Date de fin prévue YYYY-MM-DD' },
        notes:          { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'schedule_followup',
    description: "Programme une date de relance pour un lead existant dans MONFLUX.",
    input_schema: {
      type: 'object',
      properties: {
        lead_title:   { type: 'string', description: 'Nom ou titre du lead à retrouver' },
        follow_up_at: { type: 'string', description: 'Date de relance au format YYYY-MM-DD' },
      },
      required: ['lead_title', 'follow_up_at'],
    },
  },
];

async function executeTool(name, input, company_id) {
  try {
    if (name === 'create_lead') {
      const { title, contact_name, contact_phone, contact_email, budget, notes, source } = input;
      const { rows: [lead] } = await query(
        `INSERT INTO leads (company_id, title, contact_name, contact_phone, contact_email, budget, notes, source, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'new') RETURNING *`,
        [company_id, title, contact_name||null, contact_phone||null, contact_email||null, budget||null, notes||null, source||'other']
      );
      return { success: true, type: 'lead', item: lead };
    }

    if (name === 'create_project') {
      const { name, client_name, address, contract_value, start_date, end_date, notes } = input;
      const { rows: [proj] } = await query(
        `INSERT INTO projects (company_id, name, client_name, address, contract_value, start_date, end_date, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING *`,
        [company_id, name, client_name||null, address||null, contract_value||null, start_date||null, end_date||null, notes||null]
      );
      return { success: true, type: 'project', item: proj };
    }

    if (name === 'schedule_followup') {
      const { lead_title, follow_up_at } = input;
      const { rows: [lead] } = await query(
        `UPDATE leads SET follow_up_at = $1
         WHERE company_id = $2
           AND id = (
             SELECT id FROM leads
             WHERE company_id = $2
               AND (title ILIKE $3 OR contact_name ILIKE $3)
               AND status NOT IN ('won','lost')
             ORDER BY created_at DESC LIMIT 1
           )
         RETURNING *`,
        [follow_up_at, company_id, `%${lead_title}%`]
      );
      return { success: !!lead, type: 'followup', item: lead || null };
    }
  } catch (err) {
    console.error('Tool execution error:', err);
    return { success: false, error: err.message };
  }
  return { success: false, error: 'Outil inconnu' };
}

// POST /api/chat — general AI chat (streaming + tool use)
router.post('/', async (req, res) => {
  const { messages, context_type = 'general', project_id, conversation_id } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'Messages requis' });

  const { rows: [company] } = await query(
    `SELECT name, sector, modules_enabled FROM companies WHERE id = $1`,
    [req.company_id]
  );

  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = `Tu es l'assistant IA de MONFLUX pour ${company?.name || 'cette entreprise'} (secteur: ${company?.sector || 'construction'}).
Tu aides les entrepreneurs en construction québécois à gérer leurs projets, leads, soumissions et facturations.
Tu parles en français québécois. Tu es direct, pratique et efficace.
Date d'aujourd'hui: ${today}
Contexte: ${context_type}${project_id ? ` / Projet: ${project_id}` : ''}
Plan actif: ${req.plan.slug} (${req.plan.is_dev_override ? 'MODE DEV' : 'réel'})
Quand l'utilisateur demande de créer un lead, un projet, ou planifier une relance, utilise les outils disponibles.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    let fullText = '';

    // First streaming call — with tools enabled
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: TOOLS,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    stream.on('text', (text) => {
      fullText += text;
      send({ type: 'text', text });
    });

    const finalMsg = await stream.finalMessage();

    // Handle tool use
    if (finalMsg.stop_reason === 'tool_use') {
      const toolBlock = finalMsg.content.find(b => b.type === 'tool_use');
      const toolResult = await executeTool(toolBlock.name, toolBlock.input, req.company_id);

      // Send action event so frontend can show a creation card
      send({ type: 'action', action: toolBlock.name, result: toolResult });

      // Second stream — friendly confirmation message
      const confirmStream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'assistant', content: finalMsg.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolBlock.id,
              content: JSON.stringify(toolResult),
            }],
          },
        ],
      });

      confirmStream.on('text', (text) => {
        fullText += text;
        send({ type: 'text', text });
      });

      await confirmStream.finalMessage();
    }

    send({ type: 'done' });
    res.end();

    // Persist conversation
    if (conversation_id && fullText) {
      const allMessages = [...messages, { role: 'assistant', content: fullText }];
      await query(
        `UPDATE ai_conversations SET messages = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(allMessages), conversation_id]
      ).catch(() => {});
    }
  } catch (err) {
    console.error('Chat error:', err);
    send({ type: 'error', error: 'Erreur IA' });
    res.end();
  }
});

// POST /api/chat/conversations
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
