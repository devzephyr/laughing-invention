import { sql } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

type Lab = {
  title: string;
  slug: string;
  summary: string | null;
  stack: string[] | null;
  writeup_md: string | null;
  created_at: string;
};

export default async function LabsPage() {
  let rows: Lab[] = [];
  try {
    rows = (await sql`
      select title, slug, summary, stack, writeup_md, created_at
      from labs
      order by created_at desc
    `) as unknown as Lab[];
  } catch (err) {
    console.error('Labs query failed', err);
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-6">Labs</h1>
      <div className="grid gap-4">
        {rows.length === 0 && <p className="opacity-80">No labs yet.</p>}
        {rows.map((l) => (
          <Card key={l.slug} className="p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{l.title}</h2>
              <span className="text-xs opacity-70">{new Date(l.created_at).toLocaleDateString()}</span>
            </div>
            {l.summary && <p className="text-sm opacity-80 mt-1">{l.summary}</p>}
            {l.stack && l.stack.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-80">
                {l.stack.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-neutral-200/50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
