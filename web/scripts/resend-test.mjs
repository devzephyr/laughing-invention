import { Resend } from 'resend';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const apiKey = process.env.RESEND_API_KEY;
const to = process.env.RESEND_TO;
const from = process.env.RESEND_FROM || 'Portfolio <onboarding@resend.dev>';

if (!apiKey) throw new Error('RESEND_API_KEY not set');
if (!to) throw new Error('RESEND_TO not set (your email)');

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: 'Portfolio Resend test',
  text: 'This is a test email sent from the portfolio setup script.'
});

if (error) {
  console.error('Failed:', error);
  process.exit(1);
}
console.log('Sent:', data?.id || data);

