import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query, getClient } from '../db.js';
import { authenticateToken, resolveCompany, enforceAiQuota } from '../middleware/auth.js';
import { FLO_BASE_PERSONA, detectPersona, getSystemPrompt } from '../prompts.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

let _anthropic = null;
const anthropic = () => {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
};

const LEAD_SOURCES = ['manual','email','whatsapp','facebook_ads','google_lsa','soumissions_reno','kijiji','referral','website','other'];
const PROJECT_TYPES = ['kitchen','bathroom','basement','addition','new_build','roofing','exterior','commercial','interior','other'];

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
        budget_min:    { type: 'number',  description: 'Budget estimé minimum en $ CA' },
        budget_max:    { type: 'number',  description: 'Budget estimé maximum en $ CA' },
        type_of_work:  { type: 'string',  enum: PROJECT_TYPES, description: 'Type de travaux' },
        city:          { type: 'string',  description: 'Ville du projet' },
        description:   { type: 'string',  description: 'Notes ou détails additionnels' },
        source:        { type: 'string',  enum: LEAD_SOURCES, description: 'Provenance du lead' },
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
  {
    name: 'list_records',
    description: "Consulte/liste les données existantes de l'entreprise (projets, leads, factures, soumissions). Utilise cet outil dès que l'utilisateur demande de voir, résumer, ou compter des éléments existants.",
    input_schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['projects','leads','invoices','quotes'], description: 'Type de données à consulter' },
        status: { type: 'string', description: "Filtre optionnel par statut (ex: 'active' pour projets, 'overdue' pour factures)" },
      },
      required: ['entity'],
    },
  },
];

async function executeTool(name, input, company_id) {
  try {
    if (name === 'create_lead') {
      const { title, contact_name, contact_phone, contact_email, budget_min, budget_max, type_of_work, city, description, source } = input;
      const client = await getClient();
      try {
        await client.query('BEGIN');
        let cid = null;
        if (contact_name || contact_phone || contact_email) {
          const existing = contact_email
            ? await client.query(`SELECT id FROM contacts WHERE company_id=$1 AND email=$2 LIMIT 1`, [company_id, contact_email])
            : { rows: [] };
          if (existing.rows.length) {
            cid = existing.rows[0].id;
            await client.query(`UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone) WHERE id=$3`, [contact_name||null, contact_phone||null, cid]);
          } else {
            const { rows: [c] } = await client.query(
              `INSERT INTO contacts (company_id,name,phone,email) VALUES ($1,$2,$3,$4) RETURNING id`,
              [company_id, contact_name||'', contact_phone||null, contact_email||null]
            );
            cid = c.id;
          }
        }
        const { rows: [lead] } = await client.query(
          `INSERT INTO leads (company_id, contact_id, title, description, type_of_work, budget_min, budget_max, city, source, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new') RETURNING *`,
          [company_id, cid, title, description||null,
           PROJECT_TYPES.includes(type_of_work) ? type_of_work : 'other',
           budget_min||null, budget_max||null, city||null,
           LEAD_SOURCES.includes(source) ? source : 'manual']
        );
        await client.query('COMMIT');
        return { success: true, type: 'lead', item: { ...lead, contact_name: contact_name||null } };
      } catch (e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }
    }

    if (name === 'create_project') {
      const { name: projName, client_name, address, contract_value, start_date, end_date, notes } = input;
      const { rows: [proj] } = await query(
        `INSERT INTO projects (company_id, name, client_name, address, contract_value, start_date, end_date, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING *`,
        [company_id, projName, client_name||null, address||null, contract_value||null, start_date||null, end_date||null, notes||null]
      );
      return { success: true, type: 'project', item: proj };
    }

    if (name === 'schedule_followup') {
      const { lead_title, follow_up_at } = input;
      const { rows: [lead] } = await query(
        `UPDATE leads SET follow_up_at = $1
         WHERE company_id = $2
           AND id = (
             SELECT l.id FROM leads l
             LEFT JOIN contacts c ON c.id = l.contact_id
             WHERE l.company_id = $2
               AND (l.title ILIKE $3 OR c.name ILIKE $3)
               AND l.status NOT IN ('won','lost')
             ORDER BY l.created_at DESC LIMIT 1
           )
         RETURNING *`,
        [follow_up_at, company_id, `%${lead_title}%`]
      );
      return { success: !!lead, type: 'followup', item: lead || null };
    }

    if (name === 'list_records') {
      const { entity, status } = input;
      if (entity === 'projects') {
        const { rows } = await query(
          `SELECT name, status, progress_pct, contract_value, client_name, start_date, end_date
           FROM projects WHERE company_id=$1 ${status ? 'AND status=$2' : ''}
           ORDER BY start_date DESC NULLS LAST LIMIT 50`,
          status ? [company_id, status] : [company_id]
        );
        return { success: true, type: 'projects', count: rows.length, items: rows };
      }
      if (entity === 'leads') {
        const { rows } = await query(
          `SELECT l.title, l.status, l.budget_min, l.budget_max, l.city, l.follow_up_at, c.name AS contact_name
           FROM leads l LEFT JOIN contacts c ON c.id=l.contact_id
           WHERE l.company_id=$1 ${status ? 'AND l.status=$2' : ''}
           ORDER BY l.created_at DESC LIMIT 50`,
          status ? [company_id, status] : [company_id]
        );
        return { success: true, type: 'leads', count: rows.length, items: rows };
      }
      if (entity === 'invoices') {
        const { rows } = await query(
          `SELECT number, status, client_name, total, amount_due, due_date
           FROM invoices WHERE company_id=$1 ${status ? 'AND status=$2' : ''}
           ORDER BY created_at DESC LIMIT 50`,
          status ? [company_id, status] : [company_id]
        );
        return { success: true, type: 'invoices', count: rows.length, items: rows };
      }
      if (entity === 'quotes') {
        const { rows } = await query(
          `SELECT title, status, total FROM quotes WHERE company_id=$1 ${status ? 'AND status=$2' : ''}
           ORDER BY created_at DESC LIMIT 50`,
          status ? [company_id, status] : [company_id]
        );
        return { success: true, type: 'quotes', count: rows.length, items: rows };
      }
      return { success: false, error: 'Entité inconnue' };
    }
  } catch (err) {
    console.error('Tool execution error:', err);
    return { success: false, error: err.message };
  }
  return { success: false, error: 'Outil inconnu' };
}

// Compact live snapshot of the business — injected into the system prompt so the
// AI can answer "résume mes projets" instantly without a tool round-trip.
async function buildBusinessSnapshot(company_id) {
  try {
    const [proj, leads, inv] = await Promise.all([
      query(`SELECT status, COUNT(*)::int AS n, COALESCE(SUM(contract_value),0)::float AS val FROM projects WHERE company_id=$1 GROUP BY status`, [company_id]),
      query(`SELECT status, COUNT(*)::int AS n FROM leads WHERE company_id=$1 GROUP BY status`, [company_id]),
      query(`SELECT status, COUNT(*)::int AS n, COALESCE(SUM(amount_due),0)::float AS due FROM invoices WHERE company_id=$1 GROUP BY status`, [company_id]),
    ]);
    const activeProj = proj.rows.find(r => r.status === 'active');
    const overdue = inv.rows.find(r => r.status === 'overdue');
    const unpaidDue = inv.rows.filter(r => ['sent','viewed','partial','overdue'].includes(r.status)).reduce((s, r) => s + r.due, 0);
    const newLeads = leads.rows.find(r => r.status === 'new');
    const parts = [];
    parts.push(`Projets actifs: ${activeProj?.n || 0}${activeProj ? ` (valeur contrats ${Math.round(activeProj.val).toLocaleString('fr-CA')}$)` : ''}`);
    parts.push(`Nouveaux leads: ${newLeads?.n || 0}`);
    parts.push(`À encaisser: ${Math.round(unpaidDue).toLocaleString('fr-CA')}$${overdue ? ` dont ${overdue.n} facture(s) en retard` : ''}`);
    return parts.join(' · ');
  } catch {
    return 'Aucune donnée disponible pour le moment.';
  }
}

// POST /api/chat — general AI chat (streaming + tool use)
router.post('/', enforceAiQuota, async (req, res) => {
  const { messages, context_type = 'general', project_id, conversation_id, active_section, project_context } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'Messages requis' });

  const { rows: [company] } = await query(
    `SELECT name, sector, modules_enabled FROM companies WHERE id = $1`,
    [req.company_id]
  );

  const today = new Date().toISOString().slice(0, 10);
  const snapshot = await buildBusinessSnapshot(req.company_id);

  // Détecter la persona selon la dernière question de l'utilisateur
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const persona = detectPersona(lastUserMsg);

  // Contexte de projet enrichi avec la section active
  const projCtx = {
    ...(project_context || {}),
    activeSection: active_section || null,
  };

  const floContext = getSystemPrompt(persona, projCtx);
  const systemPrompt = `${floContext}

ENTREPRISE : ${company?.name || 'N/A'} · Secteur : ${company?.sector || 'construction'} · Québec
Date : ${today}
Au Québec on dit « punch » (pas « pointage »).

ÉTAT EN TEMPS RÉEL : ${snapshot}

ACTIONS DISPONIBLES :
- Créer un lead, projet, relance → create_lead / create_project / schedule_followup
- Voir, résumer, lister des données → list_records (utilise proactivement, ne dis jamais que tu ne peux pas consulter)
- Rédiger ou envoyer un courriel → tu peux rédiger un brouillon, l'utilisateur valide avant envoi`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    let fullText = '';

    // First streaming call — with tools enabled
    const stream = await anthropic().messages.stream({
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

    let finalMsg = await stream.finalMessage();

    // Agentic tool loop — handles create AND read tools, allows chaining (max 4 rounds)
    const convo = [...messages.map(m => ({ role: m.role, content: m.content }))];
    let rounds = 0;
    while (finalMsg.stop_reason === 'tool_use' && rounds < 4) {
      rounds++;
      const toolBlocks = finalMsg.content.filter(b => b.type === 'tool_use');
      convo.push({ role: 'assistant', content: finalMsg.content });

      const toolResults = [];
      for (const tb of toolBlocks) {
        const result = await executeTool(tb.name, tb.input, req.company_id);
        // Only surface a creation card for write actions
        if (['create_lead','create_project','schedule_followup'].includes(tb.name)) {
          send({ type: 'action', action: tb.name, result });
        }
        toolResults.push({ type: 'tool_result', tool_use_id: tb.id, content: JSON.stringify(result) });
      }
      convo.push({ role: 'user', content: toolResults });

      const nextStream = await anthropic().messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages: convo,
      });
      nextStream.on('text', (text) => { fullText += text; send({ type: 'text', text }); });
      finalMsg = await nextStream.finalMessage();
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
