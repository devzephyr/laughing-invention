Wasmer Edge (Next.js) quick setup

1) Install Wasmer CLI and login

   wasmer login

2) Secrets (in Wasmer dashboard or CLI)

   DATABASE_URL
   RESEND_API_KEY
   RESEND_TO
   RESEND_FROM (optional)
   NEXT_PUBLIC_SITE_URL

3) Build locally first

   cd web
   pnpm install
   pnpm build

4) Deploy

   wasmer deploy

Notes
- Config starter added at wasmer.toml (root). It points to the Next.js app in ./web and runs pnpm build / pnpm start.
- If Wasmer prompts for framework detection, choose Next.js.
- Set a custom domain in Wasmer after first deploy if desired.

