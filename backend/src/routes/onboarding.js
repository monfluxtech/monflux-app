import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

let _anthropic = null;
const anthropic = () => {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
};

// ── Normalisation des modules choisis → clés de visibilité (cf. front config) ─
const MODULE_ALIASES = {
  leads: 'leads', lead: 'leads',
  soumissions: 'soumissions', soumission: 'soumissions', quotes: 'soumissions', devis: 'soumissions', estimation: 'soumissions',
  factures: 'factures', facturation: 'factures', invoicing: 'factures', invoices: 'factures', facture: 'factures',
  sous_traitants: 'sous_traitants', 'sous-traitants': 'sous_traitants', subcontractors: 'sous_traitants', sous_traitant: 'sous_traitants',
  punch: 'punch', pointage: 'punch', timesheets: 'punch',
  rapport: 'rapport', rapports: 'rapport', reports: 'rapport', report: 'rapport',
  contrats: 'contrats', contracts: 'contrats', contrat: 'contrats',
  commandes: 'commandes', orders: 'commandes', commande: 'commandes',
  factures_achat: 'factures_achat', 'factures-achat': 'factures_achat',
  contacts: 'contacts',
};

function buildModulesEnabled(modules) {
  const enabled = {
    leads: false, soumissions: false, factures: false, sous_traitants: false,
    punch: false, rapport: false,
    contacts: false, contrats: false, commandes: false, factures_achat: false,
  };
  for (const m of (modules || [])) {
    const key = MODULE_ALIASES[String(m).toLowerCase().trim()];
    if (key && key in enabled) enabled[key] = true;
  }
  // Filet : si rien de choisi, activer les modules d'affaires de base.
  if (!Object.values(enabled).some(Boolean)) {
    enabled.leads = enabled.soumissions = enabled.factures = enabled.sous_traitants = enabled.punch = true;
  }
  return enabled;
}

// ── Bibliothèque de checklists terrain par corps de métier ──────────────────
// Listes de points à vérifier sur place pour bien estimer (utilisées au Batch 3).
const TRADE_CHECKLISTS = {
  general: [
    "Dimensions et superficie réelles des espaces",
    "État général de la structure existante",
    "Accès au chantier (stationnement, ascenseur, escaliers)",
    "Présence de matières dangereuses (amiante, plomb, moisissure)",
    "Localisation des services (eau, gaz, électricité)",
    "Contraintes de l'immeuble (heures de travail, protection des lieux)",
    "Photos d'ensemble et des zones problématiques",
  ],
  charpenterie: [
    "Type de structure (bois, acier, béton)",
    "État des solives, poutres et colonnes",
    "Portées et points d'appui",
    "Niveau et planéité des planchers",
    "Présence de murs porteurs vs cloisons",
    "État de la charpente de toit",
  ],
  plomberie: [
    "Localisation de l'entrée d'eau principale",
    "Pression et débit d'eau",
    "Matériau de la tuyauterie existante (cuivre, PEX, fonte, plomb)",
    "Accès au drain principal et pente d'évacuation",
    "Présence d'un clapet anti-retour",
    "Capacité et âge du chauffe-eau",
  ],
  electricite: [
    "Capacité du panneau électrique (ampérage)",
    "Nombre de circuits / espaces disponibles",
    "Qualité de la mise à la terre",
    "Type de câblage (cuivre vs aluminium)",
    "Conformité au Code (prises GFCI, AFCI)",
    "Besoins en 240V (bornes, électroménagers)",
  ],
  demolition: [
    "Test d'amiante requis (bâtiment avant 1990)",
    "Murs porteurs vs cloisons à démolir",
    "Localisation des services à neutraliser (gaz, eau, élec)",
    "Plan d'évacuation des débris et conteneur",
    "Protection des surfaces et éléments à conserver",
    "Contrôle de la poussière et ventilation",
  ],
  excavation: [
    "Demande Info-Excavation (localisation des conduites)",
    "Type de sol et présence de roc",
    "Niveau de la nappe phréatique",
    "Accès pour la machinerie",
    "Gestion des sols excavés / contaminés",
    "Distances et marges réglementaires",
  ],
  toiture: [
    "Type de revêtement existant et pente",
    "État du pontage (deck) sous la couverture",
    "Nombre de couches déjà en place",
    "Ventilation et isolation de l'entretoit",
    "État des solins, noues et évents",
    "Drainage et débord de toit",
  ],
  peinture: [
    "Superficie des surfaces à peindre",
    "État des surfaces (fissures, trous, humidité)",
    "Préparation requise (sablage, apprêt, réparation)",
    "Type de finis existants (latex, huile, plâtre)",
    "Protection du mobilier et des planchers",
  ],
  gypse: [
    "Superficie de gypse à poser / réparer",
    "Hauteur des plafonds et accès",
    "Niveau de finition de joints requis",
    "Présence d'humidité (gypse vert/résistant requis)",
    "Coins, arches et détails particuliers",
  ],
  beton_fondation: [
    "État de la fondation existante (fissures, mouvement)",
    "Drainage périphérique et imperméabilisation",
    "Type de sol et capacité portante",
    "Accès pour bétonnière / pompe",
    "Coffrage et armature requis",
  ],
  ceramique: [
    "Superficie et planéité du support",
    "Type de support (béton, contreplaqué, membrane)",
    "Imperméabilisation requise (douche, plancher humide)",
    "Format des carreaux et plan de pose",
    "Chauffage de plancher à intégrer",
  ],
  hvac: [
    "Type de système existant (fournaise, thermopompe, plinthes)",
    "Capacité de chauffage/climatisation requise (BTU)",
    "État et tracé de la ventilation / conduits",
    "Alimentation électrique ou au gaz disponible",
    "Qualité de l'air et ventilation (échangeur d'air)",
  ],
};

function buildFieldChecklists(trades) {
  const out = {};
  for (const t of (trades || [])) {
    const key = String(t).toLowerCase().trim();
    out[key] = TRADE_CHECKLISTS[key] || TRADE_CHECKLISTS.general;
  }
  if (!Object.keys(out).length) out.general = TRADE_CHECKLISTS.general;
  return out;
}

// POST /api/onboarding/chat
// Streams the Claude-powered onboarding conversation
router.post('/chat', authenticateToken, async (req, res) => {
  const { messages, session_id } = req.body;
  if (!messages?.length) {
    return res.status(400).json({ error: 'Messages requis' });
  }

  const systemPrompt = `Tu es l'assistant d'onboarding de MONFLUX, un logiciel de gestion pour entrepreneurs en construction au Québec.
Ton rôle est de bâtir un profil PRÉCIS et UTILE à travers une conversation naturelle, intelligente et humaine, en français québécois.
Pose UNE seule question à la fois. Sois concis, chaleureux et professionnel. Reformule brièvement ce que tu comprends quand c'est pertinent (« Parfait, donc… »).

═══ OPTIONS CLIQUABLES (très important) ═══
À CHAQUE question qui a des réponses typiques, propose des options cliquables. Termine ton message par un bloc d'options sur sa propre ligne :
- Choix unique : <OPTIONS>["Option A","Option B","Option C"]</OPTIONS>
- Choix multiple : <OPTIONS multi>["Option A","Option B","Option C"]</OPTIONS>
Règles : 3 à 7 options max, courtes, concrètes. L'utilisateur peut toujours écrire sa propre réponse — tes options sont des raccourcis, pas une cage. Pour une question ouverte (ex. le nom), n'émets PAS d'options.

═══ RÈGLE D'OR — ADAPTE-TOI ═══
Tiens compte de CHAQUE réponse déjà donnée. Ne repose jamais une question déjà répondue et ne contredis jamais l'utilisateur. La 2e info (après le nom) est le TYPE D'UTILISATION ; tout le reste en dépend.

═══ TYPE D'UTILISATION (parcours) ═══
A) Entreprise établie / nouveau contracteur — dirige ou représente une entreprise de construction.
B) Particulier qui coordonne ses PROPRES chantiers/rénos — pas d'entreprise.
  ⛔ Parcours B : ne demande JAMAIS taille d'équipe, secteur d'entreprise, RBQ, ni « dans quelle entreprise tu travailles ». Le « nom de la compagnie » = son nom personnel.

═══ INFOS À COLLECTER (dans cet ordre naturel) ═══
1. NOM (entreprise ou personne). Question ouverte.
2. TYPE D'UTILISATION. <OPTIONS>["Je dirige une entreprise","Je démarre comme contracteur","Je gère mes propres projets (particulier)"]</OPTIONS>
3. MÉTIER(S) / corps de métier principaux — détermine les listes de vérification terrain. Choix multiple.
   <OPTIONS multi>["Entrepreneur général","Charpenterie","Plomberie","Électricité","Démolition","Excavation","Toiture","Peinture","Gypse / tirage de joints","Béton / fondation","Céramique","CVAC (HVAC)"]</OPTIONS>
4. RESPONSABILITÉS de l'utilisateur dans les projets — sert à bâtir son tableau de bord. Choix multiple.
   <OPTIONS multi>["Estimation / soumissions","Achats de matériaux","Supervision de chantier","Facturation","Approbation des dépenses","Gestion des sous-traitants","Santé-sécurité (SST)","Planification / échéancier"]</OPTIONS>
5. BASES & MODULES à afficher — « Quelles vues veux-tu voir dès le départ ? » Choix multiple.
   <OPTIONS multi>["Leads","Soumissions","Factures","Sous-traitants","Punch (pointage)","Rapports"]</OPTIONS>
6. PARCOURS A seulement : secteur principal <OPTIONS>["Résidentiel","Commercial","Industriel","Mixte"]</OPTIONS>, puis taille d'équipe <OPTIONS>["Solo","2 à 5","6 à 10","11 à 25","26 à 50","50+"]</OPTIONS>, puis RBQ (optionnel — laisse tomber s'il hésite), puis fournisseurs préférés <OPTIONS multi>["Rona","Home Depot","Canac","BMR","Patrick Morin","Richelieu"]</OPTIONS>.

═══ FIN — bloc JSON ═══
Quand tu as au minimum : nom + type d'utilisation + au moins un métier + au moins un module, retourne EXACTEMENT (et seulement à ce moment) :
<PROFILE_COMPLETE>
{"company_name":"...","profile_type":"company|individual","sector":"residential|commercial|industrial|mixed|null","size":"solo|2_5|6_10|11_25|26_50|50_plus|null","rbq_number":"...|null","trades":["general","charpenterie","plomberie","electricite","demolition","excavation","toiture","peinture","gypse","beton_fondation","ceramique","hvac"],"responsibilities":["estimation","achats","supervision","facturation","approbation","sous_traitants","sst","planification"],"modules":["leads","soumissions","factures","sous_traitants","punch","rapport"],"preferred_suppliers":[],"onboarding_profile":{"usage_type":"company|new_contractor|individual","project_types":"..."}}
</PROFILE_COMPLETE>

Règles JSON :
- "trades", "responsibilities", "modules" : utilise EXACTEMENT les clés en minuscules listées ci-dessus (mappe les réponses humaines vers ces clés). N'inclus que ce que l'utilisateur a choisi.
- profile_type = "individual" pour un particulier ; sinon "company". Pour un particulier : sector, size, rbq_number = null.
- N'invente JAMAIS de données. Si inconnu, mets null. Ne mets pas le bloc OPTIONS dans le même message que PROFILE_COMPLETE.`;

  try {
    const stream = await anthropic().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
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

    // Normalise les ENUM (sinon une valeur hors-liste fait planter l'INSERT).
    const VALID_SECTORS = ['residential', 'commercial', 'industrial', 'mixed'];
    const VALID_SIZES = ['solo', '2_5', '6_10', '11_25', '26_50', '50_plus'];
    const isIndividual = profile.profile_type === 'individual';
    const sector = VALID_SECTORS.includes(profile.sector) ? profile.sector : (isIndividual ? null : 'residential');
    const size = VALID_SIZES.includes(profile.size) ? profile.size : (isIndividual ? null : 'solo');

    // Dérive la visibilité des modules, les métiers et les checklists terrain.
    const modulesEnabled = buildModulesEnabled(profile.modules);
    const trades = Array.isArray(profile.trades) ? profile.trades.map((t) => String(t).toLowerCase().trim()) : [];
    const responsibilities = Array.isArray(profile.responsibilities)
      ? profile.responsibilities.map((r) => String(r).toLowerCase().trim()) : [];
    const fieldChecklists = buildFieldChecklists(trades);

    // 1. Create company
    const { rows: [company] } = await client.query(
      `INSERT INTO companies
         (name, rbq_number, sector, size, profile_type, modules_enabled, trades,
          onboarding_completed, onboarding_profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8)
       RETURNING id`,
      [
        profile.company_name,
        profile.rbq_number || null,
        sector,
        size,
        profile.profile_type || 'company',
        JSON.stringify(modulesEnabled),
        JSON.stringify(trades),
        JSON.stringify(profile),
      ]
    );
    const company_id = company.id;

    // 2. Add user as owner + store responsibilities (drives the dashboard)
    await client.query(
      `INSERT INTO company_members (company_id, user_id, role, is_owner)
       VALUES ($1, $2, 'owner', TRUE)`,
      [company_id, req.user.userId]
    );
    await client.query(
      `UPDATE users SET responsibilities = $1 WHERE id = $2`,
      [JSON.stringify(responsibilities), req.user.userId]
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

    // 4. Create default company config + checklists terrain par métier
    await client.query(
      `INSERT INTO company_config (company_id, preferred_suppliers, field_checklists)
       VALUES ($1, $2, $3)`,
      [
        company_id,
        JSON.stringify(profile.preferred_suppliers || ['rona','home_depot']),
        JSON.stringify(fieldChecklists),
      ]
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
