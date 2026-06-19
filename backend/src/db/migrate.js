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
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running schema migration...');
    await client.query(schema);
    console.log('✅ Schema applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
