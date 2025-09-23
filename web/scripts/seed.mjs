import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function loadJSON(name) {
  const p = join(__dirname, '..', 'seed', name);
  const buf = await readFile(p, 'utf-8');
  return JSON.parse(buf);
}

async function seedProjects() {
  const rows = await loadJSON('projects.json');
  for (const r of rows) {
    await sql`
      insert into projects (title, slug, summary, tags, repo_url, live_url, hero_image, created_at)
      values (${r.title}, ${r.slug}, ${r.summary}, ${r.tags}, ${r.repo_url}, ${r.live_url}, ${r.hero_image}, ${r.created_at})
      on conflict (slug) do update set title = excluded.title, summary = excluded.summary, tags = excluded.tags, repo_url = excluded.repo_url, live_url = excluded.live_url, hero_image = excluded.hero_image, created_at = excluded.created_at;
    `;
  }
  console.log(`Seeded ${rows.length} projects`);
}

async function seedLabs() {
  const rows = await loadJSON('labs.json');
  for (const r of rows) {
    await sql`
      insert into labs (title, slug, summary, stack, writeup_md, created_at)
      values (${r.title}, ${r.slug}, ${r.summary}, ${r.stack}, ${r.writeup_md}, ${r.created_at})
      on conflict (slug) do update set title = excluded.title, summary = excluded.summary, stack = excluded.stack, writeup_md = excluded.writeup_md, created_at = excluded.created_at;
    `;
  }
  console.log(`Seeded ${rows.length} labs`);
}

async function seedWriteups() {
  const rows = await loadJSON('writeups.json');
  for (const r of rows) {
    await sql`
      insert into writeups (title, slug, summary, published_at, md_path)
      values (${r.title}, ${r.slug}, ${r.summary}, ${r.created_at}, NULL)
      on conflict (slug) do update set title = excluded.title, summary = excluded.summary, published_at = excluded.published_at;
    `;
  }
  console.log(`Seeded ${rows.length} writeups`);
}

async function seedReading() {
  const rows = await loadJSON('reading.json');
  for (const r of rows) {
    await sql`
      insert into reading (title, author, year, status, notes)
      values (${r.title}, ${r.author}, ${r.year}, ${r.status}, ${r.notes})
      on conflict do nothing;
    `;
  }
  console.log(`Seeded ${rows.length} reading items`);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  await seedProjects();
  await seedLabs();
  await seedWriteups();
  await seedReading();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

