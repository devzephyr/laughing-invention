---
title: "Kimai Guarded the Report and Forgot the Export"
description: "Kimai locked its project report behind a permission check and left the export route beside it open. Any logged-in user could download customer names, project names, and budget metadata across every customer. Advisory GHSA-pvc4-crg3-gj44, patched in 2.64.0."
date: "2026-08-17"
tags: ["kimai", "access-control", "broken-authorization", "symfony", "cwe-862", "web-security"]
---

I found a missing authorization check in Kimai, the open-source time tracker. The project overview report returns a 403 to a user without reporting permission. The export route beside it returns the data. Any authenticated account, down to a plain ROLE_USER on stock permissions, could request that route and download a spreadsheet the report itself would refuse to show.

Kevin Papst, Kimai's maintainer, assigned it advisory GHSA-pvc4-crg3-gj44, rated it Low, and shipped the fix in 2.64.0. The rating is Low because the data that leaks is metadata rather than money. Two things earn a walk-through here: how the guard ended up on the wrong method, and how I mishandled the disclosure.

## What Kimai Is

Kimai is a PHP/Symfony time tracker that freelancers, agencies, and teams use to log billable hours against customers and projects. It records who worked on what, for how long, at what rate. The reporting module aggregates that into project overviews: budget consumption, per-customer totals, the numbers you hand to an accountant or a client.

Kimai permissions those reports. A contractor logging their own hours has no reason to pull the company-wide project overview, so Kimai gates the report behind the `report:project` permission. That gate worked. The export route next to it carried no equivalent gate.

## The Bug

The project view report lives in `src/Controller/Reporting/ProjectViewController.php`. The controller serves the same data through two entry points: an `__invoke` action that renders the HTML report, and an `export` action that streams the same numbers as a spreadsheet. Both call the same private `getData()` method.

Kimai attached both permission checks to `__invoke`: `report:project` for reporting access and a `budget_any` expression for budget visibility. The class carried only the `/reporting/project_view` route prefix, so the export route, `report_project_view_export`, inherited neither guard.

Here is the vulnerable controller, trimmed:

```php
#[Route(path: '/reporting/project_view')]
final class ProjectViewController extends AbstractController
{
    #[Route(path: '', name: 'report_project_view', methods: ['GET', 'POST'])]
    #[IsGranted('report:project')]
    #[IsGranted(new Expression("is_granted('budget_any', 'project')"))]
    public function __invoke(Request $request, ProjectStatisticService $service): Response
    {
        $data = $this->getData($request, $service);
        return $this->render('reporting/project_view.html.twig', /* ... */);
    }

    #[Route(path: '/export', name: 'report_project_view_export', methods: ['GET', 'POST'])]
    // no IsGranted attribute -- the export inherits nothing from the class
    public function export(Request $request, ProjectStatisticService $service): Response
    {
        $data = $this->getData($request, $service);
        $content = $this->renderView('reporting/project_list_export.html.twig', $data);
        // ... loads the HTML into a spreadsheet and streams it back ...
        return $writer->getFileResponse($spreadsheet);
    }

    private function getData(Request $request, ProjectStatisticService $service): array { /* ... */ }
}
```

Two routes, one `getData()`, and both guards on one of them. The HTML action checks permission. The export action assembles the identical dataset and streams it to anyone with a login.

Every other reporting controller in Kimai that exposes an export route places its guards at the class level, so the export falls under the same rule as the report. ProjectViewController was the only one guarding the method instead of the class. That is how the export slipped out uncovered.

## How It Works

**Step 1: Log in as any user.** A ROLE_USER account that can log its own time and nothing else works.

**Step 2: Accept the 403 on the report.** A user without reporting permission gets a 403 on the report page and does not see the export button. The gate hides the link.

**Step 3: Request the export route directly.** `report_project_view_export` runs without an `IsGranted` check, calls `getData()`, and builds the project overview.

**Step 4: Download the data.** The spreadsheet holds the project overview across every customer.

No injection, no crafted payload, no session theft. You request the route the class forgot to guard and it returns the file.

## What the Export Exposes

The real blast radius is narrow. The export exposes per-project metadata across every customer:

- Customer names
- Project names
- Currency
- Budget type
- Aggregate totals

The financial values stay out of it, and the reason is worth pinning down. The export bypassed both controller guards, including the `budget_any` expression that gates budget visibility on the report. Budget amounts, revenue, and hourly rates survived anyway, because `templates/reporting/project_list_export.html.twig` guards each of those fields on its own, tied to budget permissions. Those template checks sit at the point of display, so they held when the controller checks did not. A user exploiting this reads the shape of the business, the customer list and the project structure, without the money attached.

That second layer of template guards is why the rating stays Low. It is also luck. The financial fields survived because someone guarded them again at the template. Trust those values to the controller gate alone and the same missing attribute leaks revenue for every project in the system.

## Why This Pattern Keeps Happening

Symfony's attribute-based access control reads well. You put `#[IsGranted]` on the action and the framework enforces it before the method runs. The attribute protects one method. It knows nothing about the private `getData()` helper underneath it, and nothing about the sibling action that calls the same helper.

The sequence that produces this bug feels routine:

1. Build the report action, guard it, ship it.
2. Add an export action later for the same report. Copy the routing, wire up the spreadsheet, call the same `getData()`.
3. Miss that the guard was an attribute on the other method rather than a property of the data.

The data carries a sensitivity level. The framework attaches permission to methods. Each new method that reaches the same data re-declares the guard by hand, and hand-declared guards get missed. Kimai caught it in one controller after the fact. Search your own Symfony reporting controllers for an export action beside a guarded `__invoke` and you may find more.

## The Fix

The patch (PR #6115) moved both attributes off `__invoke` and onto the controller class, so they cover every action inside it, the report and the export together:

```php
#[Route(path: '/reporting/project_view')]
#[IsGranted('report:project')]
#[IsGranted(new Expression("is_granted('budget_any', 'project')"))]
final class ProjectViewController extends AbstractController
{
    #[Route(path: '', name: 'report_project_view', methods: ['GET', 'POST'])]
    public function __invoke(Request $request, ProjectStatisticService $service): Response { /* ... */ }

    #[Route(path: '/export', name: 'report_project_view_export', methods: ['GET', 'POST'])]
    public function export(Request $request, ProjectStatisticService $service): Response { /* ... */ }

    private function getData(Request $request, ProjectStatisticService $service): array { /* ... */ }
}
```

Two attributes on the class, and both routes fall under the same rule. An action added later inherits the guards instead of needing them re-attached. This shipped in Kimai 2.64.0.

## Remediation

Upgrade to 2.64.0 or later. That closes it.

```bash
# check your version
bin/console kimai:version
```

If you run 2.63.0 or earlier and cannot upgrade yet, the exposure covers authenticated users on your own instance. The limiting factors:

- An attacker needs a valid Kimai login. The route is not reachable unauthenticated.
- Only non-financial metadata leaks. Budget and rate values stay guarded.
- The data is project and customer structure, not time entries or credentials.

A Kimai instance with trusted internal users only carries low practical risk. A multi-tenant or open-registration instance, where any signup receives a ROLE_USER account, should upgrade now, because "any authenticated user" there includes anyone who can register.

## Disclosure

I mishandled this part, and the advisory states it in plain text: the issue went public through a pull request in the Kimai repository before a fix existed.

A security report has to stay private until a patched version ships, because the report is the risk. I opened a PR with the details instead of keeping the finding inside GitHub's private advisory workflow. From the moment that PR was visible, anyone could read what the bug was and how to reach it while every Kimai install was still unpatched. Kevin cut a release on a Sunday, during a family vacation, to close the window I opened.

For an ordinary bug, a public PR is the right move, and maintainers welcome it. A security issue runs on the reverse rule: private until the fix ships. I understand that difference now in a way I did not before I made a maintainer scramble on his day off.

Kevin accepted the report, moved the guards to the class, published GHSA-pvc4-crg3-gj44, and requested a CVE. No CVE has been assigned as of publication. GHSA-pvc4-crg3-gj44 is the reference for this issue, and it is the identifier that matters anyway: the advisory is what tells operators what broke and which version fixes it.

## References

**Primary Source:**
- [GitHub Security Advisory GHSA-pvc4-crg3-gj44](https://github.com/kimai/kimai/security/advisories/GHSA-pvc4-crg3-gj44)
- [Kimai Security Advisory Page](https://www.kimai.org/en/security/ghsa-pvc4-crg3-gj44)

**Project & Fix:**
- [Kimai on GitHub](https://github.com/kimai/kimai)
- [PR #6115: move permission check to controller level to match other reports](https://github.com/kimai/kimai/pull/6115)

---

Kimai guarded the report and left the export beside it uncovered, one `IsGranted` attribute scoped to a method instead of the class. Scope the guard to the controller, so every route that reaches the data inherits it.
