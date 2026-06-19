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
  connectionTimeoutMillis: 2000,
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
