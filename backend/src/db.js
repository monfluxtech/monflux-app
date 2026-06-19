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
  const migrations = [
    // Quittances — Quebec satisfaction certificates (added 2026-06)
    `CREATE TABLE IF NOT EXISTS quittances (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
      client_name     TEXT NOT NULL,
      client_email    TEXT,
      project_description TEXT,
      amount_paid     NUMERIC(12,2) DEFAULT 0,
      public_token    UUID NOT NULL DEFAULT gen_random_uuid(),
      status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','signed')),
      signed_at       TIMESTAMPTZ,
      signed_ip       TEXT,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS quittances_token_idx ON quittances(public_token)`,
  ];
  for (const sql of migrations) {
    await pool.query(sql).catch(err => {
      if (!err.message.includes('already exists')) {
        console.warn('Migration warning:', err.message);
      }
    });
  }
  console.log('✅ Incremental migrations applied');
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
