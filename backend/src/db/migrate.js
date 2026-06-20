import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '../../schema.sql');

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('sslmode=disable'))
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 10000,  // fail fast if DB unreachable
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Skip if schema already applied (idempotent check)
    const check = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users' LIMIT 1"
    );
    if (check.rows.length > 0) {
      console.log('✅ Schema already applied, skipping migration');
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running schema migration...');
    await client.query(schema);
    console.log('✅ Schema applied successfully');
  } catch (err) {
    // Ne pas bloquer le démarrage si la migration initiale échoue —
    // applyMigrations() dans db.js gère toutes les migrations de manière idempotente.
    console.error('⚠️  Initial migration skipped:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
