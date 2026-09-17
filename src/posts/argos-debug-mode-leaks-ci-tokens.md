---
title: "Argos CLI Debug Mode Prints Your CI Tokens, and the Docs Tell You to Enable It"
description: "Two advisories I filed against argos-javascript: the documented debug flag dumps GITHUB_TOKEN and ARGOS_TOKEN into CI logs, and the OAuth login echoes attacker-controlled ANSI into your terminal. Both fixed within a day."
date: "2026-09-13"
tags: ["argos", "github-actions", "ci-cd", "secrets", "security-research"]
---

Run the one troubleshooting command Argos documents for its CLI, `DEBUG=@argos-ci/core argos upload ./screenshots`, and the output contains your `GITHUB_TOKEN`, the OIDC request token, and your `ARGOS_TOKEN`. Not masked, not truncated. In CI, that lands in the build log. On a public repo, that log is readable by anyone with a browser.

I reported two bugs to argos-ci/argos-javascript on September 12. They published both advisories the next day with fixes in `@argos-ci/core` 6.8.5 and `@argos-ci/cli` 6.9.4. That is a fast, competent response. The bugs themselves should never have shipped.

- **[GHSA-28pg-v3hp-9g7f](https://github.com/argos-ci/argos-javascript/security/advisories/GHSA-28pg-v3hp-9g7f)**, Medium, CVSS 6.8 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N`), CWE-532: debug logging leaks every environment secret.
- **[GHSA-q9j4-4h4j-mv5m](https://github.com/argos-ci/argos-javascript/security/advisories/GHSA-q9j4-4h4j-mv5m)**, Low, CVSS 1.7 (`CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:L/A:N`), CWE-117: the `argos login` OAuth flow prints the attacker-controlled `error_description` parameter to your terminal with escape codes intact.

## The Bugs

### GHSA-28pg-v3hp-9g7f: the debug flag that hands out credentials

`packages/core/src/ci-environment/index.ts` builds a `context` object holding the entire unfiltered `process.env` snapshot, then logs it:

```js
debug("Detecting CI environment", context)
```

The `debug()` helper in `packages/core/src/debug.ts` is a thin wrapper around the popular `debug` package. It gates on verbosity. It filters nothing. One call, and the runner's `GITHUB_TOKEN`, `ACTIONS_ID_TOKEN_REQUEST_TOKEN`, npm tokens, cloud keys, and whatever else was in the environment go to stderr. This runs on every config load, which means every `upload()`, `deploy()`, `uploadMedia()`, `finalize()`, and `skip()` call.

Two more sites in `packages/core/src/upload.ts` (lines 191 and 216) log the full `params` and resolved `config` objects. Both contain the 40-character `ARGOS_TOKEN`.

Here is the part that makes this a bug and not a design choice: the same package already redacts tokens in two other commands. `media.ts` and `deploy.ts` both do `const { token: _token, ...debugParams } = …` before logging. Whoever wrote those lines knew debug output must not carry tokens. The upload path and the CI-detection path missed the memo.

And this debug mode is not some undocumented escape hatch. The [CLI reference](https://argos-ci.com/docs/reference/argos-command-line-interface-cli) tells users to enable it to inspect CI detection:

```bash
DEBUG=@argos-ci/core argos upload ./screenshots
```

People enable this when uploads misbehave, then paste the output into GitHub issues and Discord, the two support channels linked at the bottom of every docs page. One paste publishes the long-lived `ARGOS_TOKEN`. In CI on a public repo, the job's `GITHUB_TOKEN` (commonly `contents:write` by default) sits in a world-readable log for the duration of the run.

The reproduction against then-latest 6.8.4 took one command:

```bash
DEBUG=@argos-ci/core GITHUB_TOKEN=ghp_CANARY... node -e "import('@argos-ci/core').then(m => m.upload({ apiBaseUrl:'https://api.argos-ci.com', token:'a'.repeat(40), commit:'0'.repeat(40), branch:'main', screenshots:[] })).catch(()=>{})"
```

The canary appears in stderr before the first network request. The call fails afterwards against the real API. The token was already printed.

### GHSA-q9j4-4h4j-mv5m: ANSI injection through the OAuth callback

Smaller bug, same pattern of trusting input that crosses a boundary. `argos login` spins up a loopback listener for the OAuth callback. In `packages/cli/src/commands/login.ts`, the callback's `error_description` query parameter flows through `url.searchParams.get`, into an `Error`, and out through `console.error` untouched. The only transform is a `color()` wrapper that adds red formatting. It strips nothing.

Feed the callback this:

```
/callback?error=access_denied&error_description=%1B%5B2K%0D%5BFAKE%5D%20Security%20alert:%20run%20evil.sh
```

The `\x1b[2K\r` erases the current terminal line and the attacker's text renders as if the CLI printed it. Combined with the `ARGOS_APP_BASE_URL` env var pointing the login flow at a hostile authorization server, you get a phishing primitive aimed at developers. Low severity, no code execution, still worth fixing.

## Timeline

| When | What |
|---|---|
| 2026-09-12 | Both issues reported privately via GitHub Security Advisories |
| 2026-09-13 | Advisories published, fixes shipped in `@argos-ci/core` 6.8.5 and `@argos-ci/cli` 6.9.4 |
| Pending | CVE IDs requested by the maintainers, not yet assigned |

One day from report to published advisory and released patch. That is the fast end of coordinated disclosure.

## Why This Actually Matters

Secret-in-log bugs are the least glamorous vulnerability class and one of the most damaging. `ARGOS_TOKEN` is a long-lived credential; whoever holds it can push builds and media to that Argos project until someone rotates it. `GITHUB_TOKEN` dies with the job, but a watcher polling public Actions logs during a ten-minute run has a live token with whatever permissions the workflow granted, default `contents:write` on a lot of repos. The OIDC request token similarly dies with the job and similarly buys minutes of cloud-scoped access where OIDC federation is configured.

The GitHub Actions console masks secret *values* it knows about when they appear in logs, which saves you for `secrets.*`. It does nothing for env snapshots of variables it does not classify as secrets, and it cannot mask partial or reformatted leakage. `process.env` dumps are exactly where that masking breaks down.

The sibling inconsistency is the real lesson. Argos had the correct pattern in two files and the bug in two others. Security fixes that live in individual call sites instead of a shared helper rot this way. The durable fix is a redaction layer inside their `debug` wrapper that drops `*_TOKEN` and `*_SECRET` keys by default, applied to every log line in the package regardless of which engineer wrote the call site.

## What To Do

1. **Upgrade.** `@argos-ci/core` 6.8.5 and `@argos-ci/cli` 6.9.4 or later. `npm outdated | grep argos` in every repo that runs visual tests.
2. **Rotate `ARGOS_TOKEN`** if you ever ran a CI job with `DEBUG=argos*` or `DEBUG=@argos-ci/core` on a project whose logs or paste history could be public. Settings → General → Token in the Argos dashboard.
3. **Grep old logs and pastes** for `Detecting CI environment` and your token patterns. GitHub issue search and Discord history count as pastes.
4. **If you rotated late**, review repo commit history for pushes during windows where `DEBUG` was on and the default `GITHUB_TOKEN` had write permissions.

## References

**Advisories:**

- [GHSA-28pg-v3hp-9g7f: debug logging leaks GITHUB_TOKEN, OIDC request token, and ARGOS_TOKEN into CI logs](https://github.com/argos-ci/argos-javascript/security/advisories/GHSA-28pg-v3hp-9g7f)
- [GHSA-q9j4-4h4j-mv5m: OAuth error_description terminal output handling](https://github.com/argos-ci/argos-javascript/security/advisories/GHSA-q9j4-4h4j-mv5m)

**Vendor Documentation:**

- [Argos CLI reference (documents the DEBUG flag)](https://argos-ci.com/docs/reference/argos-command-line-interface-cli)

---

Patch the package, rotate the token, and treat debug flags in CI tooling as what they are: a place where someone forgot to decide what counts as a secret.
