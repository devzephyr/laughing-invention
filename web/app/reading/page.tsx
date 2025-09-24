import { sql } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { Reveal } from "@/components/scroll/Reveal";
import Link from "next/link";
import clsx from "clsx";

export const revalidate = 60;

type ReadingItem = {
  title: string;
  author: string | null;
  year: number | null;
  status: string;
  notes: string | null;
  added_at: string;
};

export default async function ReadingPage({ searchParams }: { searchParams?: { status?: string } }) {
  const status = searchParams?.status?.toLowerCase();
  const valid = new Set(["reading","finished","wishlist","reference","completed","in_progress"]);
  let rows: ReadingItem[] = [];
  try {
    rows = status && valid.has(status)
      ? (await sql`select title, author, year, status, notes, added_at from reading where status = ${status} order by added_at desc`) as unknown as ReadingItem[]
      : (await sql`select title, author, year, status, notes, added_at from reading order by added_at desc`) as unknown as ReadingItem[];
  } catch (err) {
    console.error('Reading query failed', err);
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">What I’m reading</h1>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["all","reading","finished","wishlist","reference","completed","in_progress"]).map((s) => (
          <Link key={s} href={s === 'all' ? '/reading' : `/reading?status=${s}`}
            className={clsx("px-2 py-1 rounded border", s === (status ?? 'all') ? "bg-emerald-500 text-white border-emerald-600" : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900")}
          >
            {s.replace('_',' ')}
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4">
        {rows.length === 0 && <p className="opacity-80">No reading items yet.</p>}
        {rows.map((it, i) => (
          <Reveal key={i} delay={i * 80}>
            <article className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm transition-transform">
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{it.title}</h2>
                <span className="text-xs uppercase tracking-wide opacity-70">{it.status}</span>
              </div>
              <p className="text-sm opacity-80">{it.author ?? 'Unknown'}{it.year ? ` · ${it.year}` : ''}</p>
              {it.notes && <p className="text-xs opacity-70 mt-1">{it.notes}</p>}
            </article>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
