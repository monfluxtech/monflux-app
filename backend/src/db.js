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

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    throw err;
  }
}

export default pool;
