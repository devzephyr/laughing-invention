import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');
const sql = neon(url);

async function run() {
  const schemaPath = join(__dirname, 'schema.sql');
  const file = await readFile(schemaPath, 'utf-8');
  const statements = file
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    // eslint-disable-next-line no-await-in-loop
    await sql(stmt);
  }
  console.log('Schema applied.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

