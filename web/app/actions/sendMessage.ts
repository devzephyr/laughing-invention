'use server';

import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { headers } from 'next/headers';
import { z } from 'zod';

const MessageSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  subject: z.string().max(160).optional().default(''),
  message: z.string().min(10).max(4000),
});

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sendMessage(formData: FormData) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const resend = new Resend(resendKey);

  // Optional Turnstile verification (recommended in production)
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const token = (formData.get('cf-turnstile-response') || '').toString();
  if (turnstileSecret) {
    if (!token) {
      throw new Error('Verification failed. Please try again.');
    }
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: turnstileSecret, response: token }),
    }).then((r) => r.json() as Promise<{ success: boolean } & Record<string, unknown>>);
    if (!verify.success) {
      throw new Error('Verification failed. Please try again.');
    }
  }

  const raw = {
    name: (formData.get('name') || '').toString().trim(),
    email: (formData.get('email') || '').toString().trim(),
    subject: (formData.get('subject') || '').toString().trim(),
    message: (formData.get('message') || '').toString().trim(),
  };
  const { name, email, subject, message } = MessageSchema.parse(raw);

  // Basic rate-limit by hashed IP (privacy-preserving)
  const hdrs = headers();
  const ip =
    hdrs.get('cf-connecting-ip') ||
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0';
  const ua = hdrs.get('user-agent') || '';
  const salt = process.env.MESSAGE_HASH_SALT || 'default-salt-change-me';
  const ipHash = await sha256Hex(ip + '|' + salt);

  // Allow at most 3 messages per 10 minutes per ipHash
  const [{ count }] = (await sql`
    with recent as (
      select 1 as x from messages
      where ip_hash = ${ipHash}
        and created_at > now() - interval '10 minutes'
    )
    select count(*)::int as count from recent
  `) as unknown as Array<{ count: number }>;
  if (count >= 3) {
    throw new Error('Too many messages recently. Please wait and try again.');
  }

  await sql`
    INSERT INTO messages (name, email, subject, body, ip_hash, user_agent, created_at)
    VALUES (${name}, ${email}, ${subject}, ${message}, ${ipHash}, ${ua}, NOW())
  `;

  const adminTo = process.env.RESEND_TO || 'you@example.com';
  const fromAddr = process.env.RESEND_FROM || 'Portfolio <onboarding@resend.dev>';

  await resend.emails.send({
    from: fromAddr,
    to: [adminTo],
    replyTo: email,
    subject: `New message: ${subject || 'No subject'}`,
    text: `From: ${name} <${email}>\nIP: ${ip}\nUA: ${ua}\n\n${message}`,
  });

  // Courtesy receipt (non-deliverability safe)
  await resend.emails.send({
    from: fromAddr,
    to: [email],
    subject: 'Thanks for reaching out 👋',
    text: `Hey ${name},\n\nGot your message—I'll reply soon.\n\n– Adeyemi`,
  });

  return { ok: true } as const;
}
