# Deploying to Cloudflare Pages

## Quick Setup

1. **Initialize Git Repository**

```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Push to GitHub**

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

3. **Deploy to Cloudflare Pages**

   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub account
   - Select your repository
   - Configure build settings:
     - **Framework preset**: SvelteKit
     - **Build command**: `npm run build`
     - **Build output directory**: `.svelte-kit/cloudflare`
     - **Root directory**: `/` (leave default)
   - Click "Save and Deploy"

## Automatic Deployments

Every push to your `main` branch will automatically trigger a new deployment.

## Writing and Publishing Blog Posts

### Workflow

1. **Write your post** in `/src/posts/your-post-name.md`

```markdown
---
title: "CVE-2024-XXXXX Analysis"
description: "Deep dive into a critical RCE vulnerability"
date: "2024-12-15"
tags: ["cve", "rce", "web-security"]
---

## Introduction

Your content here...
```

2. **Add media files** (optional)

```
src/posts/
└── cve-2024-analysis/
    ├── index.md
    ├── exploit-screenshot.png
    └── demo.mp4
```

Reference in markdown:

```markdown
![Exploit demonstration](./exploit-screenshot.png)
```

3. **Commit and push**

```bash
git add .
git commit -m "Add new blog post: CVE-2024-XXXXX analysis"
git push
```

4. **Auto-deploy**: Cloudflare Pages will automatically build and deploy in 1-2 minutes

## Using Obsidian (Optional)

If you prefer writing in Obsidian:

1. **Set up Obsidian vault** pointing to `/src/posts/`
2. **Install Obsidian Git plugin**
3. Configure auto-commit and push
4. Write in Obsidian → Auto-commit → Auto-deploy

## Environment Variables

If you need environment variables (API keys, etc.):

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to Settings → Environment variables
4. Add variables for Production and Preview environments

Access them in your code:

```javascript
const apiKey = import.meta.env.VITE_API_KEY;
```

## Custom Domain

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Add your domain (e.g., `blog.yourdomain.com`)
4. Update DNS records as instructed
5. SSL/HTTPS is automatically configured

## Monitoring

- **Server Health**: The health API endpoint is at `/api/health`
- **Analytics**: Enable Cloudflare Web Analytics in your dashboard
- **Build Logs**: Check deployment logs in Cloudflare Pages dashboard

## Troubleshooting

### Build fails

Check build logs in Cloudflare dashboard. Common issues:

- **Missing dependencies**: Make sure `package.json` includes all dependencies
- **TypeScript errors**: Run `npm run build` locally to test
- **Markdown errors**: Check frontmatter syntax in blog posts

### Images not loading

- Make sure images are in the correct directory relative to your markdown file
- Use `./image.png` for same directory, not `/image.png`

### Syntax highlighting not working

- Verify the language is in the `svelte.config.js` langs array
- Use lowercase language names in markdown code blocks

## Performance

Cloudflare Pages provides:

- **Global CDN**: Content served from 200+ locations worldwide
- **Auto-scaling**: Handles traffic spikes automatically
- **DDoS protection**: Built-in security
- **Free tier**: 500 builds/month, unlimited requests

## Security

- All pages are served over HTTPS
- No server-side code execution (static site)
- Images and videos are served from Cloudflare CDN
- Review your posts for sensitive information before committing

Questions? Check the [Cloudflare Pages docs](https://developers.cloudflare.com/pages/) or the [SvelteKit docs](https://kit.svelte.dev/).
