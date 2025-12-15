# Cybersecurity Blog

A minimalist blog built with SvelteKit, styled after natural.co's design system.

## Features

- Markdown-based blog posts with MDSveX
- Natural.co-inspired design system
- Syntax highlighting for code examples
- Image and video support for demonstrations
- Cloudflare Pages deployment
- Server health monitoring

## Writing Blog Posts

Create a new markdown file in `src/posts/`:

```markdown
---
title: "Your Post Title"
description: "Brief description"
date: "2024-12-14"
tags: ["web-security", "xss"]
---

## Your Content Here

Write your security research, include code examples, screenshots, and videos.
```

### Adding Images and Videos

For posts with media files, create a directory:

```
src/posts/
└── your-post-name/
    ├── index.md
    ├── screenshot-1.png
    └── exploit-demo.mp4
```

Reference them in your markdown:

```markdown
![Screenshot](./screenshot-1.png)
![Video demo](./exploit-demo.mp4)
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Cloudflare Pages

1. Push your code to GitHub
2. Go to Cloudflare Pages dashboard
3. Connect your GitHub repository
4. Set build command: `npm run build`
5. Set build output directory: `.svelte-kit/cloudflare`
6. Deploy

Every push to your main branch will automatically trigger a new deployment.

## Customization

### Update Social Links

Edit `src/routes/+page.svelte` and update the social links section with your profiles.

### Update Resume

Edit `src/routes/resume/+page.svelte` with your experience and skills.

### Change Colors

All design tokens are in `src/app.css`. Modify CSS variables to customize the theme.

## Project Structure

```
├── src/
│   ├── app.css             # Global styles & design tokens
│   ├── app.html            # HTML template
│   ├── posts/              # Blog posts (markdown)
│   │   └── getting-started.md
│   ├── routes/
│   │   ├── +layout.svelte  # Root layout
│   │   ├── +page.svelte    # Homepage
│   │   ├── blog/           # Blog pages
│   │   ├── resume/         # Resume page
│   │   └── api/health/     # Health check API
│   └── lib/
├── static/                 # Static assets
├── svelte.config.js
└── package.json
```

## License

MIT
