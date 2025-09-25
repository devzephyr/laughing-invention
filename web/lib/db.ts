import { neon } from "@neondatabase/serverless";

// Lazy, Edge-friendly serverless Postgres client.
// Avoid throwing at module load so Next build doesn't fail.
let cached: ReturnType<typeof neon> | null = null;
export function getSql(): ReturnType<typeof neon> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Don't throw during module evaluation; let callers handle absence.
    throw new Error("DATABASE_URL is not set");
  }
  cached = neon(url);
  return cached;
}

type SqlTag = ReturnType<typeof neon>;

// Wrapper that defers initialization until first use, keeping types strict and avoiding `any`.
export const sql: SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]) => {
  try {
    const tag = getSql();
    const invoke = tag as unknown as (strings: TemplateStringsArray, ...values: unknown[]) => unknown;
    return invoke(strings, ...values) as unknown as ReturnType<SqlTag>;
  } catch (err) {
    // Re-throw with context so callers can render a friendly message.
    throw err;
  }
}) as unknown as SqlTag;

