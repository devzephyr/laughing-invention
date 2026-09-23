---
title: "A Where Is Not a Yes: Payload Alt Text Health Report Leaked Every Tenant's Counts"
description: "The alt text health report in @jhb.software/payload-alt-text-plugin scanned every tenant with overrideAccess: true and flattened Where-based read rules to a yes, handing any logged-in user counts and up to 100 document IDs from rows they cannot read. GHSA-3pmw-vxv3-8vgq, CVSS 4.3, fixed in 0.13.0."
date: "2026-09-23"
tags: ["payload-cms", "access-control", "multi-tenant", "cwe-863", "security-research"]
---

Any authenticated user could ask the alt text health report how many images sit in every tenant's media library, how many are missing alt text, and receive up to 100 document IDs as proof. The report's own gate said yes. The user's read rule, the one that exists precisely to keep tenants apart, said "only my rows." The plugin flattened that rule into a boolean and read everything.

I reported the bug to jhb-software/payload-plugins through GitHub's private advisory workflow. Jens Becker triaged it with a few scope corrections, shipped 0.13.0, and published GHSA-3pmw-vxv3-8vgq today: Moderate, CVSS 4.3 (`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N`), CWE-863, affecting every version of `@jhb.software/payload-alt-text-plugin` from 0.4.0 through 0.12.0.

It is the second advisory against this plugin in four months, and both trace to the same property of Payload CMS: the Local API trusts you by default, and any code that re-implements access control one altitude coarser than the data it exposes will eventually leak.

## What the Plugin Is

`@jhb.software/payload-alt-text-plugin` adds AI alt text generation to Payload CMS upload collections: a generate button on each image, bulk generation from the list view, and a dashboard health widget that reports alt text coverage. That health report is the subject here. It exists as `GET /api/alt-text/health` (since 0.9.0) and as the `Alt text health` dashboard widget, and it answers one question per configured collection: how complete is the alt text?

A useful question. The bug is who got to ask it, and about whose images.

## The Bug

A Payload collection's `read` access function returns one of three things:

- `true` — full read access.
- `false` — no read access.
- A `Where` constraint — "you may read, but only rows matching this clause."

That third return value is how every multi-tenant Payload project draws the wall between customers. The standard tenant-scoped rule looks like this:

```ts
// The usual tenant-scoped pattern in Payload
read: ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return {
    tenant: { equals: user?.tenant?.id ?? null }, // a Where, not a boolean
  }
}
```

The plugin's 0.12.0 health report handled the first two correctly and silently discarded the third. Three pieces of code conspired.

**The endpoint gate.** The plugin's default `access` is `({ req }) => !!req.user`. Any authenticated user passes. Fine for a coverage report about your own images.

**The visibility test.** After the shared scan runs, the report filtered collections per request through this:

```ts
// 0.12.0 — altTextHealth.js
async function userCanReadCollection(req, slug) {
  const readAccess = req.payload.collections?.[slug]?.config.access?.read
  if (typeof readAccess !== 'function') return true
  try {
    // A Where object is not false — so a partial grant reads as a full one
    return (await readAccess({ req })) !== false
  } catch {
    return false
  }
}
```

`!== false` collapses Payload's `true | false | Where` union onto a boolean. A `Where` is truthy and not `false`, so the tenant-scoped rule came back as "yes, this user can read the collection." The constraint itself went nowhere. It was never attached to any query.

**The scan.** Where did the numbers come from? A single shared scan, computed with the override switch on:

```ts
// 0.12.0 — the shared, elevated scan
const result = await payload.find({
  collection,
  depth: 0,
  limit: PAGE_SIZE,        // 500 per page, paged to the end
  overrideAccess: true,    // every row, every tenant
  select: { alt: true },
  where,                   // MIME type filter + the opt-in baseFilter, nothing else
})
```

The per-request visibility test ran *after* this cached, elevated scan, filtering at collection granularity. The code's own comment admits the design: "access is applied per request at collection granularity, matching the aggregate's altitude." That altitude is exactly where the leak lived. A collection-level yes/no cannot express "some rows," so the Where vanished, and the aggregate counted rows the caller's own read rule excludes.

The bitter part is that 0.12.0 already understood the failure mode one layer over. The cache key included the resolved `baseFilter` with this comment: "makes it impossible to narrow the scan without also narrowing its cache, which would serve one tenant's counts to another." The code engineered against serving one tenant's counts to another through the filter dimension while doing precisely that through the access dimension.

## How It Works

The PoC was the boring, standard setup: a Payload project with the multi-tenant pattern, two tenants, Where-based read rules, one low-privilege editor account.

**Step 1: Log in as any authenticated user.** The endpoint gate is `!!req.user` by default. No role requirement, no `healthCheck.access` configured.

**Step 2: Request the health report.** `GET /api/alt-text/health` with the session token.

**Step 3: The gate evaluates the tenant's read rule.** It returns a `Where` narrowing the editor to their tenant. `userCanReadCollection` compares it against `false`, gets `true`, and marks the collection visible.

**Step 4: The cached scan already counted everyone.** The scan ran with `overrideAccess: true` over every configured upload collection, every tenant, paged through 500 rows at a time. The visibility filter then handed back the full aggregate.

**Step 5: Read another tenant's metadata.** The response includes, per collection, `totalDocs`, missing/partial/complete counts, and up to 100 IDs of documents missing alt text. None of those rows belong to the caller.

## What Leaks

The response shape, straight from the code:

```json
{
  "checkedAt": "2026-09-23T09:12:44.102Z",
  "collections": [
    {
      "collection": "media",
      "completeDocs": 412,
      "invalidDocIds": [814, 905, 1121],
      "missingDocs": 37,
      "partialDocs": 11,
      "totalDocs": 460
    }
  ],
  "errors": [],
  "isLocalized": true,
  "localeCodes": ["en", "de"]
}
```

What a caller learned about collections their read rule excludes:

| Exposed | What it tells an attacker |
|---|---|
| `totalDocs` | The size of another tenant's media library |
| `missingDocs` / `partialDocs` / `completeDocs` | The accessibility debt and content-ops maturity of a tenant you do not work on |
| `invalidDocIds` (up to 100) | An enumeration primitive: live document IDs outside your tenant, useful for probing every other endpoint that takes an `id` |

What did not leak: filenames, alt text content, image URLs, document bodies. No document content is exposed.

Jens kept the severity at 4.3 and I agree with the number. Metadata-only leakage of counts and IDs is Confidentiality: Low, and the rating says so. But score the *boundary* correctly: in a multi-tenant CMS the `Where` clause is the wall between customers. Counts and IDs arriving through that wall is a tenant isolation failure, not a cosmetic reporting bug. The dashboard widget fetched the same data through the same code path, so the exposure was not limited to the REST endpoint.

## The Mitigation That Wasn't

The README advertised the plugin as "multi-tenant aware: the health report can be scoped to the tenant the request is for," and documented `healthCheck.baseFilter` as the mechanism:

```ts
// The 0.12.0 README's recommended tenant scoping
healthCheck: {
  access: ({ req }) => req.user?.role === 'admin',
  baseFilter: ({ collection, req }) => {
    const tenant = getTenantFromCookie(req.headers, req.payload.db.defaultIDType)
    return tenant ? { tenant: { equals: tenant } } : {}
  },
}
```

Two problems, either one fatal.

It was opt-in. A default install configures nothing, the filter resolves to `{}` for every collection, and the report scans everything for any authenticated user. The 0.12.0 code comment was blunt about what carried the security property: "The scan runs with `overrideAccess: true`, so a narrowing constraint has to be part of the query itself — this is what keeps the aggregate within one tenant." That is, the optional filter the operator had to remember to configure.

And the example derived the tenant from the `payload-tenant` cookie. A cookie is client-controlled. Send no cookie and `getTenantFromCookie` returns nothing, the filter resolves to `{}`, and the scan runs unfiltered. The "tenant scoping" of the report was a preference the client could decline, not a control. Jens flagged this in triage: the documented mitigation did not close the gap.

## The Fix

0.13.0 inverts the design. Instead of computing one elevated scan and filtering it afterward, the report now resolves what the requesting user may read and runs the scan *as that user*:

```ts
// 0.13.0 — the scan runs on a detached request as the requesting user
const scanReq = await createLocalReq(
  {
    context: req.context,
    req: { headers: req.headers, i18n: req.i18n },
    user: req.user ?? undefined,
  },
  payload,
)
const { constraints, readable: collections } =
  await resolveReadableCollections(scanReq, pluginConfig.collections)
```

The scanner no longer decides what a `Where` means. Payload does:

```ts
// 0.13.0 — row-level read access applies to the scan
const result = await req.payload.find({
  collection,
  depth: 0,
  limit: PAGE_SIZE,
  overrideAccess: false,
  req: scanReq,
  select: { alt: true },
  where,
})
```

The changes that matter:

- **`overrideAccess: false`, running as the requesting user.** A tenant-scoped rule now narrows the aggregate to that tenant automatically, with zero plugin configuration. The endpoint and the dashboard widget both get the correction.
- **The union is handled.** `resolveReadableCollections` records `true | Where` per collection as a *constraint*; only a literal `false` (or a throwing access function) hides the collection entirely. Fail closed on both edges.
- **The cache key carries access.** Constraints are hashed into the key next to the filters (`access:${stableStringify(constraints)}`), so an admin's full scan and a tenant editor's narrowed scan can never share a cache entry. The cross-tenant-serving scenario the 0.12.0 comments worried about is now structurally impossible rather than filtered away.
- **`baseFilter` is demoted.** It still exists, but it only narrows the report further. It is no longer load-bearing for isolation — which is exactly what a cookie-derived, opt-in filter should never have been.

## Why This Actually Matters

**A `Where` is not a yes.** `true | false | Where` is Payload's documented contract, and both idiomatic JavaScript shortcuts — `!== false` and bare truthiness — discard the third member. If your code consumes access results, either handle all three return types or don't evaluate access yourself and let the engine apply it. The plugin's 0.8.0 code chose the boolean shortcut, and the type system never said a word.

**Payload's Local API trusts by default.** `shouldOverrideAccess = overrideAccess !== false` means `undefined` overrides access. Every call site is guilty until proven innocent, and wrappers inherit the guilt. That default produced CVE-2026-59965 (GHSA-4qpv-39hg-f7fx, CVSS 7.1) in June: the generate and bulk endpoints called `findByID` and `update` without the opt-out, and any authenticated user could read and overwrite alt text across collections. This advisory is the same root cause wearing a different hat: an explicit `overrideAccess: true` wrapped in a hand-rolled access check that was coarser than the data it exposed. When a framework's default is trust, re-implementing its security model by hand, at a lower resolution, is how the second bug gets born.

**Opt-in security is not security.** `baseFilter` was the documented answer to multi-tenancy and it was both optional and fed by a client-controlled cookie. A mitigation the attacker can decline by not sending a header is a feature, not a control. The fixed version needs none of it, which is the tell: the correct design made the mitigation obsolete.

**Per-user data needs per-user cache keys.** The moment the scan became per-user, the constraint had to enter the cache key or one user's numbers would serve another. 0.12.0 had this exact insight for filters and missed it for access. If you cache anything derived from an authorization decision, the authorization decision belongs in the key.

## What To Do

```bash
# check what you're running
npm ls @jhb.software/payload-alt-text-plugin

# upgrade
pnpm add @jhb.software/payload-alt-text-plugin@^0.13.0
```

- Affected: `>= 0.4.0, < 0.13.0`. Patched: 0.13.0.
- Not affected if your upload collections' `read` rules return only `true`/`false`. The gap is specifically Where-returning rules, the tenant-scoped case.
- Defense in depth regardless of version: restrict the report to people allowed to see all tenants.

```ts
payloadAltTextPlugin({
  // ...
  healthCheck: {
    access: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  },
})
```

No CVE ID was assigned at publication; the GHSA is the canonical reference. The June advisory's CVE (CVE-2026-59965) was attached months after its own publication, so one may follow here too.

## Disclosure

I filed the report privately through GitHub Security Advisories. Jens's response was quick and rigorous, and worth describing accurately, including where my first writeup was wrong:

| When | What |
|---|---|
| Private report | Filed via GitHub Security Advisories against jhb-software/payload-plugins, scoped to the tenant-Where case |
| Sep 23, early morning | Jens replies with triage corrections: collections hidden on `false` shipped in 0.8.0, not 0.12.0 (the fix for GHSA-4qpv-39hg-f7fx), and the `/api/alt-text/health` path dates to 0.9.0. Both of my version claims adjusted. The core gap, Where-returning read rules treated as full visibility, held exactly as reported. He also confirmed the documented `baseFilter` example leaned on a client-controlled cookie |
| Sep 23, ~06:02 | Advisory accepted. CWE narrowed to CWE-863 (Incorrect Authorization), severity held at 4.3 |
| Sep 23, morning | 0.13.0 on npm, advisory published with me credited as devzephyr |

Report to published advisory and released fix inside a single morning, with the maintainer correcting the reporter's history rather than rubber-stamping it. That is coordinated disclosure working the way it should. The lesson for plugin authors is less comfortable: the same `overrideAccess` semantics have now produced two advisories in one small package, and both were findable by asking one question of every Local API call. What does this code assume about who can read?

## References

**Primary Source:**
- [GitHub Security Advisory GHSA-3pmw-vxv3-8vgq: payload-alt-text-plugin health report ignores row-level read access](https://github.com/jhb-software/payload-plugins/security/advisories/GHSA-3pmw-vxv3-8vgq)

**Prior Advisory in the Same Package:**
- [GHSA-4qpv-39hg-f7fx (CVE-2026-59965): alt text endpoint authorization bypass via Local API `overrideAccess` omission, fixed in 0.8.0](https://github.com/advisories/GHSA-4qpv-39hg-f7fx)

**Technical Resources:**
- [@jhb.software/payload-alt-text-plugin on npm](https://www.npmjs.com/package/@jhb.software/payload-alt-text-plugin)
- [jhb-software/payload-plugins on GitHub](https://github.com/jhb-software/payload-plugins)
- [Payload CMS access control: read rules returning true, false, or a Where](https://payloadcms.com/docs/access-control)
- [Payload CMS multi-tenant plugin (the `payload-tenant` cookie)](https://payloadcms.com/docs/plugins/multi-tenant)

---

Check your own Payload plugins for access results flattened to booleans. The `Where` you threw away was the wall.
