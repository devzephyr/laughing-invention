import { sql } from '@/lib/db';
import DbStatusBadge from '@/components/DbStatusBadge';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export const revalidate = 0;

type Message = {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

// DbStatusBadge is a client component that will render a small status when ?admin=1 is present

export default async function AdminMessagesPage() {
  const rows = (await sql`
    select id, name, email, subject, body, ip_hash, user_agent, created_at
    from messages
    order by created_at desc
    limit 100
  `) as unknown as Message[];

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Messages (latest 100)</h1>
        {/* DbStatusBadge only shows when ?admin=1 is present (client-side widget) */}
        {/* import dynamically so it's client-only */}
        <DbStatusBadge />
      </div>
      {rows.length === 0 ? (
        <p className="opacity-80">No messages yet.</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((m) => (
            <article key={m.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="font-medium">{m.name} &lt;{m.email}&gt;</h2>
                  <p className="text-xs opacity-70">{m.subject || 'No subject'}</p>
                </div>
                <span className="text-xs opacity-70">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm">{m.body}</pre>
              <div className="mt-2 text-xs opacity-70 flex flex-wrap gap-3">
                <span>ip_hash: {m.ip_hash || '-'}</span>
                <span className="truncate">ua: {m.user_agent || '-'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
