'use server';

import { Resend } from 'resend';
import { sql } from '@/lib/db';

export async function sendMessage(formData: FormData) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const resend = new Resend(resendKey);

  const name = (formData.get('name') || '').toString().slice(0, 120).trim();
  const email = (formData.get('email') || '').toString().slice(0, 160).trim();
  const subject = (formData.get('subject') || '').toString().slice(0, 160).trim();
  const body = (formData.get('message') || '').toString().slice(0, 4000).trim();

  if (!name || !email || !body) {
    throw new Error('Please fill in name, email, and message.');
  }

  await sql`
    INSERT INTO messages (name, email, subject, body, created_at)
    VALUES (${name}, ${email}, ${subject}, ${body}, NOW())
  `;

  const adminTo = process.env.RESEND_TO || 'you@example.com';
  const fromAddr = process.env.RESEND_FROM || 'Portfolio <onboarding@resend.dev>';

  await resend.emails.send({
    from: fromAddr,
    to: [adminTo],
    replyTo: email,
    subject: `New message: ${subject || 'No subject'}`,
    text: `From: ${name} <${email}>\n\n${body}`,
  });

  await resend.emails.send({
    from: fromAddr,
    to: [email],
    subject: 'Thanks for reaching out 👋',
    text: `Hey ${name},\n\nGot your message—I'll reply soon.\n\n– Adeyemi`,
  });

  return { ok: true } as const;
}
