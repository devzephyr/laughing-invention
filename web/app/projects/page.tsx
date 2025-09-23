import { sql } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

type Project = {
  title: string;
  slug: string;
  summary: string | null;
  tags: string[] | null;
  repo_url: string | null;
  live_url: string | null;
  hero_image: string | null;
  created_at: string;
};

export default async function ProjectsPage() {
  let rows: Project[] = [];
  try {
    rows = (await sql`
      select title, slug, summary, tags, repo_url, live_url, hero_image, created_at
      from projects
      order by created_at desc
    `) as unknown as Project[];
  } catch (err) {
    console.error('Projects query failed', err);
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-6">Projects</h1>
      <div className="grid gap-4">
        {rows.length === 0 && <p className="opacity-80">No projects yet.</p>}
        {rows.map((p) => (
          <Card key={p.slug} className="p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{p.title}</h2>
              <span className="text-xs opacity-70">{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
            {p.summary && <p className="text-sm opacity-80 mt-1">{p.summary}</p>}
            {p.tags && p.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-80">
                {p.tags.map((t, i) => (
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
