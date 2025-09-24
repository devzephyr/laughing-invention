import { neon } from "@neondatabase/serverless";

// Lazy, Edge-friendly serverless Postgres client.
// Avoid throwing at module load so Next build doesn't fail.
let cached: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  cached = neon(url);
  return cached;
}

export const sql: any = (...args: any[]) => {
  const tag = getSql();
  return (tag as any)(...args);
};

