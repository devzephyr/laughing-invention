# Portfolio Site Blueprint

## Vision
- Showcase cybersecurity focus with playful terminal hero, interactive background, and minimal typography.
- Blend key interactions from inspirations (terminal prompt, subtle motion, pinned scroll sequences, reading feed).
- Prioritize performance, accessibility (reduced motion, keyboard-first navigation), and modern tooling.

## Tech Stack
- Framework: Next.js 14 (App Router, server components, server actions) for hybrid rendering and file-based routing.
- Styling: Tailwind CSS + shadcn/ui components (Radix under the hood) for consistent UI primitives.
- Theming: `next-themes` for dark/light toggle, default to dark to emphasize terminal aesthetic.
- State/motion: React Server Components + Client components for interactivity; `framer-motion` (light usage) or GSAP for scroll sequences; fallback to CSS `@media (prefers-reduced-motion)`.
- Canvas background: custom WebGL/Canvas component using `react-three-fiber` or `react-canvas-confetti`? (Prefer tiny library or raw Canvas via `useEffect` for control). Provide reduced-motion and low-power fallbacks.
- Data Layer: Neon serverless Postgres via `@neondatabase/serverless` driver, with Drizzle ORM for schema migrations and type safety (optional but recommended).
- Email: Resend API triggered through Next.js Server Action; React Email templates for HTML emails.
- Hosting: Wasmer Edge (wasmer deploy CLI) packaging Next.js output; CI pipeline via GitHub Actions.

## Routing Structure
```
app/
  layout.tsx           # global layout, font loading with next/font
  page.tsx             # / home - terminal hero + intro
  projects/
    page.tsx
  labs/
    page.tsx
  writeups/
    page.tsx
  reading/
    page.tsx
  contact/
    page.tsx
  api/
    contact/route.ts   # POST handler to write to Neon + send email
```
- Shared components under `components/` (terminal hero, command palette, interactive background, cards, scroll sections).
- Utilities in `lib/` (db client, data fetchers, server actions, content loader, motion helpers).
- Content seeds in `content/` or `data/` for local JSON/MD fallback before DB integration.

## Key Features & Implementation Notes

### Terminal Hero
- Located at `/` top fold. Client component with simulated terminal prompt.
- Accept commands (`projects`, `labs`, `writeups`, `reading`, `contact`, `cv`, `help`, `clear`).
- Use keyboard shortcuts (e.g., `Ctrl+K` to focus input, arrow keys to cycle history).
- Autocomplete suggestions overlay (shadcn `Command` component adapted to look like terminal).
- On command:
  - `projects`, `labs`, `writeups`, `reading`, `contact`: smooth scroll to section via `scrollIntoView` or Next navigation.
  - `cv`: opens PDF from `/public/cv.pdf` in new tab using `window.open` with accessible fallback link.
  - `help`: reveals list of commands inline within terminal output.
  - `clear`: resets terminal buffer.
- Terminal output uses monospaced font (e.g., JetBrains Mono via next/font).
- Ensure focus management and ARIA roles for screen readers.

### Interactive Background
- Full-screen canvas behind hero and sections, layered using CSS `position: fixed` with pointer-events none.
- Particle system reacting to cursor; lighten/darken based on theme.
- Pause animation when page hidden or `prefers-reduced-motion: reduce`.
- Provide Low-power mode toggle in footer.

### Scroll Moments
- Home page includes pinned reveal sequence for quick facts (Jaytel-style) using `framer-motion` + `react-use` for scroll progress or `lenis` for smoothing.
- "What I'm Reading" on `/reading`: stacked cards reveal as you scroll (Jordan Hughes inspiration). Use Intersection Observer to trigger translations + opacity.
- Keep transitions at 60fps, degrade gracefully when reduced motion.

### Content Sections
- Projects: 6–9 cards with image, description, stack chips; layout responsive (grid -> stack).
- Labs: chronological list with details, optional `expand` for more info (collapsible component).
- Write-ups: list with tags (CTF, Blue Team), link to Markdown details or external blog.
- Reading: filterable shelves by status; include micro-interactions (hover jitter) but subtle.
- Contact: form with inputs (name, email, subject, message) using shadcn `Form`. Submit triggers Server Action -> Neon insert + Resend email + success toast. Include PGP public key block.

### Data Flow
- Use Server Components to fetch data from Neon (or static JSON during dev).
- Drizzle schema definitions in `lib/db/schema.ts`; migrations via drizzle-kit.
- Server Actions (e.g., `app/contact/actions.ts`) wrap Neon operations.
- Provide `seed.ts` script to populate Neon with sample data (run via CI or local).

### Deployment
- Local dev: `pnpm dev` with Next.js.
- Build: `pnpm build` and `pnpm start` (Edge runtime where possible).
- Deployment pipeline: GitHub Actions -> Wasmer CLI (`wasmer deploy`). Manage environment variables (Neon URLs, Resend key) via Wasmer secrets.
- For contact form: store hashed IP (SHA256) to respect privacy; use `crypto` module.

## Accessibility & Performance Guardrails
- All interactive components keyboard navigable.
- Respect `prefers-reduced-motion` to disable heavy animations/canvas.
- Lazy load heavy client components (terminal, canvas) with `dynamic(() => import(...), { ssr: false })` if necessary.
- Use Next Image for optimized images; precompute blur placeholders.
- Leverage caching (`revalidate` on data fetch) for static content, stale-while-revalidate for reading list updates.

## Next Steps
1. Initialize Next.js project with Tailwind + shadcn setup script.
2. Implement base layout, font loading, color tokens.
3. Create placeholder data and static rendering for key routes.
4. Build terminal hero MVP and interactive background (with toggles and fallbacks).
5. Layer scroll animations and refine microcopy.
6. Integrate Neon + Resend and prepare Wasmer deploy configuration.
