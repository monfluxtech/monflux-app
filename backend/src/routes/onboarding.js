import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/onboarding/chat
// Streams the Claude-powered onboarding conversation
router.post('/chat', authenticateToken, async (req, res) => {
  const { messages, session_id } = req.body;
  if (!messages?.length) {
    return res.status(400).json({ error: 'Messages requis' });
  }

  const systemPrompt = `Tu es l'assistant d'onboarding de MONFLUX, un logiciel de gestion pour entrepreneurs en construction au Québec.
Ton rôle est de créer le profil de la compagnie à travers une conversation naturelle en français québécois.
Pose une question à la fois. Sois concis, amical et professionnel.

Tu dois collecter (dans l'ordre naturel de la conversation):
1. Nom de la compagnie
2. Type d'utilisation: compagnie établie / nouveau contracteur / particulier qui gère ses propres rénovations
3. Secteur principal: résidentiel, commercial, industriel ou mixte
4. Taille d'équipe approximative
5. Numéro RBQ (optionnel, tu peux laisser faire si l'utilisateur hésite)
6. Modules souhaités parmi: leads, soumissions, chantiers, facturation, sous-traitants, pointage (QR punch)
7. Fournisseurs préférés (Rona, Home Depot, Canac, BMR, Richelieu, etc.)
8. WhatsApp Business connecté? Gmail connecté?

Quand tu as assez d'info (minimum: nom, type, secteur), retourne un bloc JSON délimité exactement ainsi:
<PROFILE_COMPLETE>
{"company_name":"...","sector":"residential|commercial|industrial|mixed","profile_type":"company|individual","size":"solo|2_5|6_10|11_25","modules":[],"preferred_suppliers":[],"rbq_number":"...","onboarding_profile":{}}
</PROFILE_COMPLETE>

N'invente jamais de données. Si l'utilisateur dit qu'il ne sait pas, passe à la prochaine question.`;

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';

    stream.on('text', (text) => {
      fullText += text;
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('message', async (msg) => {
      const profileMatch = fullText.match(/<PROFILE_COMPLETE>([\s\S]*?)<\/PROFILE_COMPLETE>/);
      if (profileMatch) {
        try {
          const profile = JSON.parse(profileMatch[1].trim());
          res.write(`data: ${JSON.stringify({ type: 'profile_ready', profile })}\n\n`);
        } catch {}
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

      // Persist messages to onboarding_sessions if session_id provided
      if (session_id) {
        try {
          await query(
            `UPDATE onboarding_sessions SET messages = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(messages), session_id]
          );
        } catch {}
      }
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Erreur IA' })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur IA' });
  }
});

// POST /api/onboarding/complete
// Creates company + membership + config from the profile collected by the chat
router.post('/complete', authenticateToken, async (req, res) => {
  const { profile, session_id } = req.body;
  if (!profile?.company_name) {
    return res.status(400).json({ error: 'Profil incomplet' });
  }

  const client = await (await import('../db.js')).getClient();
  try {
    await client.query('BEGIN');

    // 1. Create company
    const { rows: [company] } = await client.query(
      `INSERT INTO companies
         (name, rbq_number, sector, size, profile_type, modules_enabled,
          onboarding_completed, onboarding_profile)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7)
       RETURNING id`,
      [
        profile.company_name,
        profile.rbq_number || null,
        profile.sector || 'residential',
        profile.size || 'solo',
        profile.profile_type || 'company',
        JSON.stringify(profile.modules || ['leads','quotes','projects','invoicing','subcontractors','punch']),
        JSON.stringify(profile),
      ]
    );
    const company_id = company.id;

    // 2. Add user as owner
    await client.query(
      `INSERT INTO company_members (company_id, user_id, role, is_owner)
       VALUES ($1, $2, 'owner', TRUE)`,
      [company_id, req.user.userId]
    );

    // 3. Create free subscription
    const { rows: [freePlan] } = await client.query(
      `SELECT id FROM plans WHERE slug = 'free'`
    );
    await client.query(
      `INSERT INTO subscriptions (company_id, plan_id, status, seats)
       VALUES ($1, $2, 'active', 1)`,
      [company_id, freePlan.id]
    );

    // 4. Create default company config
    await client.query(
      `INSERT INTO company_config (company_id, preferred_suppliers)
       VALUES ($1, $2)`,
      [company_id, JSON.stringify(profile.preferred_suppliers || ['rona','home_depot'])]
    );

    // 5. Mark onboarding session complete
    if (session_id) {
      await client.query(
        `UPDATE onboarding_sessions
         SET completed = TRUE, completed_at = NOW(), company_id = $1
         WHERE id = $2`,
        [company_id, session_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      company_id,
      message: 'Compagnie créée avec succès',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création de la compagnie' });
  } finally {
    client.release();
  }
});

// POST /api/onboarding/session — init or get session
router.post('/session', authenticateToken, async (req, res) => {
  try {
    // Check if user already has a pending session
    const { rows: existing } = await query(
      `SELECT id FROM onboarding_sessions
       WHERE user_id = $1 AND completed = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.userId]
    );
    if (existing.length) {
      return res.json({ session_id: existing[0].id, is_new: false });
    }
    const { rows: [session] } = await query(
      `INSERT INTO onboarding_sessions (user_id, messages)
       VALUES ($1, '[]')
       RETURNING id`,
      [req.user.userId]
    );
    res.status(201).json({ session_id: session.id, is_new: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
