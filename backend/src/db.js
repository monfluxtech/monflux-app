import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const sslConfig = (() => {
  if (!process.env.DATABASE_URL) return false;
  if (process.env.DATABASE_URL.includes('sslmode=disable')) return false;
  if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false };
  return false;
})();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

async function applyMigrations() {
  // Each migration runs independently; errors are logged but don't stop the server.
  const run = async (label, sql) => {
    try {
      await pool.query(sql);
      console.log(`✅ migration: ${label}`);
    } catch (err) {
      // "already exists" = idempotent, expected on re-deploy. Anything else is a real warning.
      if (!err.message.includes('already exists')) {
        console.warn(`⚠️  migration [${label}]:`, err.message);
      }
    }
  };

  // ── Core users columns — ensure all columns exist regardless of schema version ─
  await run('users: name',         `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`);
  await run('users: phone',        `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
  await run('users: avatar_url',   `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  await run('users: language',     `ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr'`);
  await run('users: landing_pref', `ALTER TABLE users ADD COLUMN IF NOT EXISTS landing_pref TEXT DEFAULT 'dashboard'`);
  await run('users: is_verified',  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
  await run('users: last_login_at',`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`);

  // ── Portal messages — client feedback from project portal (2026-06) ────────
  await run('portal_messages create',
    `CREATE TABLE IF NOT EXISTS portal_messages (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL DEFAULT 'Client',
      content     TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  // ── Projects portal token (2026-06) ─────────────────────────────────────────
  await run('portal_token column',
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS portal_token UUID DEFAULT gen_random_uuid()`);
  await run('portal_token index',
    `CREATE UNIQUE INDEX IF NOT EXISTS projects_portal_token_idx ON projects(portal_token) WHERE portal_token IS NOT NULL`);

  // ── Fix quittances table (2026-06) ──────────────────────────────────────────
  // The original schema.sql quittances had invoice_id NOT NULL (incompatible).
  // Drop and recreate with the correct schema for client satisfaction certificates.
  await run('quittances drop old',
    `DROP TABLE IF EXISTS quittances CASCADE`);
  await run('quittances create',
    `CREATE TABLE IF NOT EXISTS quittances (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
      client_name         TEXT NOT NULL DEFAULT '',
      client_email        TEXT,
      project_description TEXT,
      amount_paid         NUMERIC(12,2) DEFAULT 0,
      public_token        UUID NOT NULL DEFAULT gen_random_uuid(),
      status              TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','sent','signed')),
      signed_at           TIMESTAMPTZ,
      signed_ip           TEXT,
      notes               TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await run('quittances token index',
    `CREATE UNIQUE INDEX IF NOT EXISTS quittances_token_idx ON quittances(public_token)`);

  // ── Fix change_orders table (2026-06) ────────────────────────────────────────
  // The original schema.sql change_orders has number INT NOT NULL (no DEFAULT),
  // which causes INSERT failures. Also missing signer_name / signed_ip columns.
  await run('change_orders: make number nullable',
    `ALTER TABLE change_orders ALTER COLUMN number DROP NOT NULL`);
  await run('change_orders: add signer_name',
    `ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS signer_name TEXT`);
  await run('change_orders: add signed_at',
    `ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ`);
  await run('change_orders: add signed_ip',
    `ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS signed_ip TEXT`);

  // ── Company social media links (2026-06) ─────────────────────────────────────
  await run('companies: add social_links',
    `ALTER TABLE companies ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb`);

  // ── Project map coordinates (2026-06) ────────────────────────────────────────
  await run('projects: add latitude',  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7)`);
  await run('projects: add longitude', `ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7)`);
  await run('projects: add geocoded_at', `ALTER TABLE projects ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ`);

  // ── AI usage metering — monthly request quota + add-on credits (2026-06) ─────
  await run('ai_usage create',
    `CREATE TABLE IF NOT EXISTS ai_usage (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      period      TEXT NOT NULL,
      used        INT NOT NULL DEFAULT 0,
      credits     INT NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (company_id, period)
    )`);

  // ── Batch J — Portefeuille de projets & rentabilité (2026-06-19) ─────────────
  // Internal labour cost rate ($/h) used to cost punched hours of own employees.
  await run('companies: default_labor_cost_rate',
    `ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_labor_cost_rate NUMERIC(10,2) DEFAULT 0`);

  // Corps de métiers requis sur un projet + sous-traitant choisi par métier.
  await run('project_trades create',
    `CREATE TABLE IF NOT EXISTS project_trades (
      id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      trade                   TEXT NOT NULL,
      status                  TEXT NOT NULL DEFAULT 'to_find'
                                CHECK (status IN ('to_find','contacted','quoted','confirmed','done')),
      chosen_subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE SET NULL,
      estimated_cost          NUMERIC(12,2),
      notes                   TEXT,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await run('project_trades index',
    `CREATE INDEX IF NOT EXISTS project_trades_project_idx ON project_trades(project_id)`);

  // Dépenses réelles d'un projet (factures fournisseurs, matériaux, autres) → rentabilité réelle.
  await run('project_expenses create',
    `CREATE TABLE IF NOT EXISTS project_expenses (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type              TEXT NOT NULL DEFAULT 'supplier_invoice'
                          CHECK (type IN ('supplier_invoice','material','equipment','permit','rental','other')),
      description       TEXT,
      amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
      subcontractor_id  UUID REFERENCES subcontractors(id) ON DELETE SET NULL,
      expense_date      DATE,
      created_by        UUID,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await run('project_expenses index',
    `CREATE INDEX IF NOT EXISTS project_expenses_project_idx ON project_expenses(project_id)`);

  // ── Member invites — pending email invitations (2026-06) ────────────────────
  await run('member_invites create',
    `CREATE TABLE IF NOT EXISTS member_invites (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      email       TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'technicien',
      invited_by  UUID REFERENCES users(id) ON DELETE SET NULL,
      accepted_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await run('member_invites unique',
    `CREATE UNIQUE INDEX IF NOT EXISTS member_invites_company_email_pending_idx
     ON member_invites(company_id, email) WHERE accepted_at IS NULL`);

  // ── Accept pending invite on signup (function + trigger) ────────────────────
  await run('accept_invite_fn',
    `CREATE OR REPLACE FUNCTION accept_member_invites()
     RETURNS TRIGGER LANGUAGE plpgsql AS $$
     BEGIN
       INSERT INTO company_members (company_id, user_id, role, is_owner)
       SELECT company_id, NEW.id, role, FALSE
       FROM member_invites
       WHERE LOWER(email) = LOWER(NEW.email) AND accepted_at IS NULL
       ON CONFLICT DO NOTHING;

       UPDATE member_invites
       SET accepted_at = NOW()
       WHERE LOWER(email) = LOWER(NEW.email) AND accepted_at IS NULL;

       RETURN NEW;
     END;
     $$`);
  await run('accept_invite_trigger',
    `DO $$ BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_trigger WHERE tgname = 'trg_accept_member_invites'
       ) THEN
         CREATE TRIGGER trg_accept_member_invites
         AFTER INSERT ON users
         FOR EACH ROW EXECUTE FUNCTION accept_member_invites();
       END IF;
     END $$`);

  // ── Refonte v3 — pipeline projet personnalisable (2026-06) ──────────────────
  const DEFAULT_PIPELINE_JSON = `'[
      {"key":"brouillon","label":"Brouillon","color":"#94a3b8"},
      {"key":"estimation","label":"Estimation terrain","color":"#a855f7"},
      {"key":"prix_envoye","label":"Prix envoyé","color":"#f59e0b"},
      {"key":"accepte","label":"Accepté","color":"#3b82f6"},
      {"key":"planifie","label":"Planifié","color":"#6366f1"},
      {"key":"en_chantier","label":"En chantier","color":"#22c55e"},
      {"key":"a_facturer","label":"À facturer","color":"#eab308"},
      {"key":"paye","label":"Payé","color":"#10b981"},
      {"key":"clos","label":"Clos","color":"#64748b","terminal":true}
     ]'::jsonb`;
  await run('companies pipeline_stages column',
    `ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_stages JSONB`);
  // Column-level default so new companies (onboarding) inherit the pipeline.
  await run('companies pipeline_stages default',
    `ALTER TABLE companies ALTER COLUMN pipeline_stages SET DEFAULT ${DEFAULT_PIPELINE_JSON}`);

  // Seed the default 9-stage sales+ops pipeline where none is set yet.
  await run('seed default pipeline',
    `UPDATE companies SET pipeline_stages = ${DEFAULT_PIPELINE_JSON}
     WHERE pipeline_stages IS NULL`);

  // Map legacy project statuses onto the new pipeline keys (one-time, idempotent).
  await run('migrate legacy project statuses',
    `UPDATE projects SET status = CASE status
       WHEN 'active'    THEN 'en_chantier'
       WHEN 'lead'      THEN 'brouillon'
       WHEN 'quote'     THEN 'prix_envoye'
       WHEN 'on_hold'   THEN 'planifie'
       WHEN 'completed' THEN 'clos'
       WHEN 'cancelled' THEN 'clos'
       ELSE status
     END
     WHERE status IN ('active','lead','quote','on_hold','completed','cancelled')`);

  // ── Refonte v3 — visibilité modulaire (2026-06) ─────────────────────────────
  // Seed default module visibility where none exists. Core tabs (dashboard, ia,
  // projets) are always visible and not stored here. Contacts hidden by default.
  await run('seed default modules_enabled',
    `UPDATE companies SET modules_enabled = '{
      "leads":true,"soumissions":true,"factures":true,"sous_traitants":true,
      "punch":true,"rapport":true,
      "contacts":false,"contrats":false,"commandes":false,"factures_achat":false
     }'::jsonb
     WHERE modules_enabled IS NULL OR modules_enabled = '{}'::jsonb`);

  // ── Refonte v3 B2 — onboarding intelligent : métiers, responsabilités,
  //    checklists terrain (2026-06) ────────────────────────────────────────────
  await run('companies trades column',
    `ALTER TABLE companies ADD COLUMN IF NOT EXISTS trades JSONB DEFAULT '[]'::jsonb`);
  await run('users responsibilities column',
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS responsibilities JSONB DEFAULT '[]'::jsonb`);
  await run('company_config field_checklists column',
    `ALTER TABLE company_config ADD COLUMN IF NOT EXISTS field_checklists JSONB DEFAULT '{}'::jsonb`);

  // ── Refonte v3 B4 — Vente : contrats liés aux soumissions ────────────────────
  await run('contracts create',
    `CREATE TABLE IF NOT EXISTS contracts (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
      quote_id     UUID REFERENCES quotes(id) ON DELETE SET NULL,
      title        TEXT NOT NULL DEFAULT 'Contrat de services',
      content      TEXT,
      status       TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','sent','signed','cancelled')),
      signer_name  TEXT,
      signed_at    TIMESTAMPTZ,
      signed_ip    TEXT,
      public_token UUID NOT NULL DEFAULT gen_random_uuid(),
      created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await run('contracts token index',
    `CREATE UNIQUE INDEX IF NOT EXISTS contracts_token_idx ON contracts(public_token)`);
  await run('contracts project index',
    `CREATE INDEX IF NOT EXISTS contracts_project_idx ON contracts(project_id)`);

  // ── Refonte v3 B3 — fiche projet : en-tête riche + estimation terrain ────────
  await run('projects header columns', `ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS payment_terms       TEXT,
      ADD COLUMN IF NOT EXISTS project_manager     TEXT,
      ADD COLUMN IF NOT EXISTS approvers           JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS materials_buyer     TEXT,
      ADD COLUMN IF NOT EXISTS permits_responsible TEXT,
      ADD COLUMN IF NOT EXISTS permits_required    BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS machines            JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS field_assessment    JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS estimated_price     NUMERIC(12,2),
      ADD COLUMN IF NOT EXISTS price_sent_at       TIMESTAMPTZ`);

  // ── Refonte v3 B6 — Chantier : commandes matériaux ───────────────────────────
  await run('material_orders table', `
    CREATE TABLE IF NOT EXISTS material_orders (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      order_number    TEXT,
      supplier        TEXT NOT NULL,
      description     TEXT,
      status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','ordered','partial','received','cancelled')),
      total_amount    NUMERIC(12,2),
      order_date      DATE,
      expected_date   DATE,
      received_date   DATE,
      notes           TEXT,
      created_by      UUID REFERENCES users(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await run('material_orders project index',
    `CREATE INDEX IF NOT EXISTS mat_orders_project_idx ON material_orders(project_id)`);

  // ── Refonte v3 B7 — IA chantier : médias + analyse ───────────────────────────
  await run('site_media table', `
    CREATE TABLE IF NOT EXISTS site_media (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type            TEXT NOT NULL DEFAULT 'photo'
                        CHECK (type IN ('photo','note','voice','video')),
      url             TEXT,
      mime_type       TEXT,
      caption         TEXT,
      transcript      TEXT,
      ai_analysis     JSONB,
      ai_status       TEXT NOT NULL DEFAULT 'none'
                        CHECK (ai_status IN ('none','pending','done','error')),
      ai_error        TEXT,
      created_by      UUID REFERENCES users(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await run('site_media project index',
    `CREATE INDEX IF NOT EXISTS site_media_project_idx ON site_media(project_id)`);

  // Impact IA d'un avenant — stocké sur change_orders
  await run('change_orders: add ai_impact',
    `ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS ai_impact JSONB`);

  // ── B11 — Contacts CRM : client récurrent, relances, liens projet ────────────
  await run('contacts: is_recurring',
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE`);
  await run('contacts: source',
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT`);
  await run('contacts: follow_up_at',
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ`);
  await run('contacts: follow_up_note',
    `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS follow_up_note TEXT`);
  // Link contacts to projects
  await run('projects: contact_id',
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL`);
  await run('projects: contact_id index',
    `CREATE INDEX IF NOT EXISTS projects_contact_idx ON projects(contact_id)`);
  await run('projects: created_from_project',
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_from_project UUID REFERENCES projects(id) ON DELETE SET NULL`);

  // ── Phases: corps de métier assigné (Gantt) ─────────────────────────────────
  await run('project_phases: trade_name',
    `ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS trade_name TEXT`);

  // ── v3 pipeline stages — add to project_status enum ─────────────────────────
  for (const val of ['brouillon','estimation','prix_envoye','accepte','planifie','en_chantier','a_facturer','paye','clos']) {
    await run(`project_status: ${val}`,
      `ALTER TYPE project_status ADD VALUE IF NOT EXISTS '${val}'`);
  }
}

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connected');
    await applyMigrations();
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    throw err;
  }
}

export default pool;
