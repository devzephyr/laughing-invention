---
title: "Writing Posts on This Blog"
description: "Quick reference for writing blog posts with markdown, code examples, and media files."
date: "2024-12-14"
tags: ["tutorial", "meta"]
---

## What This Is

This is a placeholder post to show how the blog works. Posts are written in markdown and get automatically converted to HTML with syntax highlighting.

## Code Blocks

You can paste code directly into your posts:

```python
# XSS payload example
payload = "<script>alert('XSS')</script>"

import urllib.parse
encoded = urllib.parse.quote(payload)
print(f"Encoded: {encoded}")
```

Another example with JavaScript:

```javascript
// Prototype pollution
function merge(target, source) {
  for (let key in source) {
    if (typeof source[key] === 'object') {
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

const malicious = JSON.parse('{"__proto__": {"admin": true}}');
merge({}, malicious);
```

## Images and Videos

For screenshots or screen recordings, put them in the same folder as your post:

```markdown
![Screenshot](./screenshot.png)
![Demo video](./demo.mp4)
```

If you want a folder structure:

```
src/posts/
├── my-post.md
└── xss-analysis/
    ├── index.md
    ├── screenshot-1.png
    └── exploit.mp4
```

## Post Metadata

Every post needs frontmatter at the top:

```yaml
---
title: "Post Title"
description: "Short description"
date: "2024-12-14"
tags: ["web", "xss"]
---
```

## Publishing

Write your post, commit to git, push to GitHub. Cloudflare Pages handles the rest.

That's it.
