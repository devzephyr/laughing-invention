import { neon } from "@neondatabase/serverless";

// Edge-friendly serverless Postgres client
// Ensure DATABASE_URL is set in .env.local or platform secrets
export const sql = (() => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(url);
})();

