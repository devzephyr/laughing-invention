Cloudflare Pages + is-a.dev Setup

Prereqs
- Cloudflare account (Pages enabled)
- Neon Postgres connection string
- Resend API key and sender domain set up
- GitHub repo: devzephyr/laughing-invention

Project Build Settings (Cloudflare Pages)
- Framework preset: None
- Build command: pnpm i --frozen-lockfile && npx @cloudflare/next-on-pages@latest build
- Build output directory: .vercel/output/static
- Node version: 20

Environment variables (Production + Preview)
- DATABASE_URL = <your Neon connection string>
- RESEND_API_KEY = <your Resend API key>
- RESEND_FROM = Portfolio <onboarding@resend.dev> (or your verified domain)
- RESEND_TO = <your admin email>
- NEXT_PUBLIC_TURNSTILE_SITE_KEY = <Turnstile site key> (optional but recommended)
- TURNSTILE_SECRET_KEY = <Turnstile secret> (optional)
- MESSAGE_HASH_SALT = <random long string>
- ADMIN_USER = <choose admin user>
- ADMIN_PASS = <choose strong password>

Database bootstrap (local once)
- Create .env.local in web/ with DATABASE_URL
- From web/: pnpm install
- pnpm migrate
- pnpm seed

is-a.dev custom domain
1) Deploy once to Cloudflare Pages to get your project’s URL like <project>.pages.dev
2) Fork https://github.com/is-a-dev/register and add a file domains/<subdomain>.json:
   {
     "owner": { "username": "devzephyr", "email": "<you@domain>" },
     "record": { "CNAME": "<project>.pages.dev" }
   }
3) Open a PR. When it merges, the DNS CNAME is created for <subdomain>.is-a.dev.
4) In Cloudflare Pages > Custom domains, add <subdomain>.is-a.dev and complete verification (certificate will auto-provision).

Notes
- This project uses the Neon serverless driver, which is Edge/Workers compatible.
- Resend SDK works on Edge; if you see runtime errors, pin to the latest.
- Turnstile widget is optional; add the site key to enable the form CAPTCHA.
- Basic auth protects /admin/* pages via middleware. Configure ADMIN_USER and ADMIN_PASS.
