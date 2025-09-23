import { sql } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

type Writeup = {
  title: string;
  slug: string;
  summary: string | null;
  published_at: string | null;
};

export default async function WriteupsPage() {
  let rows: Writeup[] = [];
  try {
    rows = (await sql`
      select title, slug, summary, published_at
      from writeups
      order by coalesce(published_at, now()) desc
    `) as unknown as Writeup[];
  } catch (err) {
    console.error('Writeups query failed', err);
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-6">Write-ups</h1>
      <div className="grid gap-4">
        {rows.length === 0 && <p className="opacity-80">No write-ups yet.</p>}
        {rows.map((w) => (
          <Card key={w.slug} className="p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{w.title}</h2>
              <span className="text-xs opacity-70">{w.published_at ? new Date(w.published_at).toLocaleDateString() : ''}</span>
            </div>
            {w.summary && <p className="text-sm opacity-80 mt-1">{w.summary}</p>}
          </Card>
        ))}
      </div>
    </main>
  );
}
