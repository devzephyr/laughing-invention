---
title: "One Boolean and You Vanish: A Mass Assignment Fix in Kimai"
description: "A ROLE_TEAMLEAD user in Kimai 2.56.0 could set systemAccount:true on their own profile through the user API and disappear from every billing report, every user dropdown, and every teammate's view. One missing permission check. Patched in 2.57.0, credit in the release notes."
date: "2026-07-07"
tags: ["kimai", "mass-assignment", "cwe-915", "access-control", "responsible-disclosure", "web-security"]
---

Kimai is an open-source time-tracking app that companies use to log hours, bill customers, and run payroll reports. In version 2.56.0, a user with the `ROLE_TEAMLEAD` role could send one API request, flip a single boolean on their own account, and vanish from every management report in the system. Their timesheets stayed in the database. Their name stopped showing up anywhere a manager would look.

I found it during a manual audit of the user API, reported it to the maintainers, and Kevin Papst patched it in 2.57.0 with credit in the release notes. The bug was one missing permission check that every other field on that endpoint already had. The fix was three lines.

No CVE. No exotic primitive. Just a field that trusted whoever sent it.

That is the kind of bug worth reporting. Kimai is solid software run by a small team, and a project like that gets stronger when an outsider gives the code a careful read and hands the maintainers something they can act on. I am a student, not a Kimai user, doing what I can to help the open-source projects other people rely on.

## What systemAccount Is

Kimai has a concept called a "system account." Bot users and service integrations use it, the accounts that generate automated timesheets but should never clutter up a human-facing billing report. When `systemAccount` is `true`, Kimai hides that user from management reporting so the numbers stay clean.

That is a reasonable feature. The problem is who gets to set it.

`systemAccount` is an administrative flag. Turning your own account into a system account is a privilege decision, the same category as changing your roles or resetting a password. Kimai gates those decisions behind an admin check. It gated this one behind nothing.

## The Bug: One Missing Guard

Kimai's user-edit API runs through three layers, and the flag slipped past all three.

`UserEditType.php` registers the `systemAccount` field on the form with no `isGranted()` check. `UserApiEditForm` extends that form and inherits the field with no additional filter. Then `UserController.php` builds the form options, and the omission shows. The controller guards every sensitive field it exposes with a conditional check. Every one except this.

```php
if (!$this->isGranted('roles', $profile))       { $options['include_roles'] = false; }
if ($profile->getId() === $user->getId())        { $options['include_active_flag'] = false; }
if (!$this->isGranted('preferences', $profile)) { $options['include_preferences'] = false; }
if (!$this->isGranted('supervisor', $profile))  { $options['include_supervisor'] = false; }
if (!$this->isGranted('password', $profile))    { $options['include_password_reset'] = false; }
// systemAccount: no equivalent guard. Accepted from any authenticated caller.
```

Roles, active flag, preferences, supervisor, password reset. Five fields, five guards. The developer who wrote this understood the pattern and used it five times. Someone added `systemAccount` to the form later and never gave it the same guard. That is the whole bug. A field that belonged next to `roles` in the guard list never made it onto the list.

This is CWE-915, improperly controlled modification of a dynamically-determined object attribute. Mass assignment. The classic version is a web form that lets you POST `is_admin=true`. This is the same failure wearing a Symfony form.

## How It Works

**Step 1: Read your baseline.** As a `ROLE_TEAMLEAD` user, send `GET /api/users/{yourId}` with your API token. Confirm `systemAccount` reads `false`.

**Step 2: Flip it.** Send the write with a 22-byte body.

```text
PATCH /api/users/4 HTTP/1.1
Host: kimai.example
Authorization: Bearer <teamlead-api-token>
Content-Type: application/json

{"systemAccount":true}
```

The server returns `HTTP 200` and the response body shows `"systemAccount": true`. No admin approval, no error, no second factor.

**Step 3: Confirm it persisted.** Read the profile back under a different identity, an admin token, to prove the value landed in the database instead of echoing back to you. It reads `true`.

**Step 4: Revert if you want.** Send `{"systemAccount":false}` and the server accepts that too. You own the flag in both directions.

I confirmed all four steps through separate Caido replay sessions. Baseline, exploit, independent persistence check, revert. The write was real, durable, and reversible.

![Caido replay showing a PATCH to /api/users/4 accepted with HTTP 200 and systemAccount set to true in the response body](/screenshots/kimai-systemaccount-exploit.png)
*The exploit in Caido. A `ROLE_TEAMLEAD` token sends `{"systemAccount":true}` to `/api/users/4`, and the response comes back `HTTP 200` with `"systemAccount": true`. No admin in the loop.*

## What You Get

This is not remote code execution. You do not get admin. You get to vanish from the view of the people whose job is to watch you.

The moment `systemAccount` flips to `true`, three things happen, and Kimai's own source enforces every one.

**You drop out of every per-user report.** All four reporting controllers hardcode the filter that excludes system accounts:

```php
$query->setSystemAccount(false);
```

`ReportUsersWeekController`, `ReportUsersMonthController`, `ReportUsersYearController`, and `CustomerMonthlyProjectsController`. Weekly, monthly, yearly, and customer billing. A manager pulling any of those reports sees everyone except you. Your logged hours are still in the database. They just never render in the view anyone uses to check them.

**You disappear from every dropdown.** `UserRepository::getQueryBuilderForFormType()` filters `systemAccount = false` with no exception. Any user-picker in the application, every "assign to" and "filter by user" control, stops listing you.

**Your teammates stop seeing you.** `User::canSeeUser()` blocks non-system users from viewing system-account profiles. Flip the flag and your peers lose access to your profile.

Put it together and you have a self-service audit blind spot. A team lead who wants to log time against a project without appearing in the billing report can flip one boolean and slide out of view, while the timesheet data keeps flowing into the database unread. That is an integrity problem in the reporting layer, and the person creating it needs no privilege beyond the account they already have.

CVSS 4.3, `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N`. Medium. The score stays modest because there is no confidentiality breach and no availability hit. The whole exploit is one unguarded field on a well-guarded endpoint.

## Why It Matters

Kimai is not fringe software. Agencies and consultancies self-host it to produce the numbers that turn into invoices. The reporting layer is the product. When a non-admin can edit themselves out of that layer, the reports stop being trustworthy, and nobody gets an alert that it happened.

Mass assignment is old. It sits on every checklist, in every framework's security guide, in the OWASP top ten under broken access control. And it still ships, because the failure mode is not exotic. A developer adds a field six months after the team sets up the guard pattern, and never learns the pattern is there. The guard list in that controller proves the team knew how to do it right. The bug is one omission from a list they already maintained.

That is the lesson worth keeping. You do not find bugs like this by being clever. You find them by reading the guard list, noticing it has five entries, and asking whether there is a sixth field that should be on it.

## The Fix and the Credit

Kevin Papst shipped the fix in [Kimai 2.57.0 as part of PR #5929](https://github.com/kimai/kimai/pull/5929), a batch of security fixes merged on May 21, 2026. The change gates the `systemAccount` field behind an admin permission so a regular user can no longer set it on themselves. The PR description credits it:

> Prevent regular users from turning their account into a systemAccount (thanks Abdul-Ramon).

![Kimai 2.57.0 release notes on GitHub listing Abdul-Ramon among the contributors involved in the release](/screenshots/kimai-systemaccount-credit.png)
*The 2.57.0 release page. The credit line lists me next to the core maintainers.*

The 2.57.0 release notes list me alongside the core team in the "involved in this release" line. Reported, fixed fast, credited. That is the responsible disclosure loop closing the way it should.

If you run Kimai, get to 2.57.0 or later. If you are below it, a `ROLE_TEAMLEAD` account can remove itself from your reports right now, and you will not see it happen.

## Disclosure Timeline

- **2026-05-14**: Found during manual testing of the user API on 2.56.0
- **2026-05-15**: Confirmed through four Caido replay sessions and verified the root cause against the source
- **2026-05-19**: Reported to the Kimai maintainers
- **2026-05-21**: Fixed in 2.57.0 under PR #5929, credited in the release notes

## References

**Primary Source:**
- [Kimai PR #5929 (Release 2.57.0)](https://github.com/kimai/kimai/pull/5929)
- [Kimai 2.57.0 Release Notes](https://github.com/kimai/kimai/releases/tag/2.57.0)

**Technical Resources:**
- [CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes](https://cwe.mitre.org/data/definitions/915.html)
- [OWASP: Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [Kimai Roles and Permissions Documentation](https://www.kimai.org/documentation/permissions.html)

**Source Files:**
- [src/API/UserController.php](https://github.com/kimai/kimai/blob/main/src/API/UserController.php)
- [src/Form/UserEditType.php](https://github.com/kimai/kimai/blob/main/src/Form/UserEditType.php)
- [src/Form/API/UserApiEditForm.php](https://github.com/kimai/kimai/blob/main/src/Form/API/UserApiEditForm.php)

---

Finding this bug took no special tooling, just a careful read and a maintainer who acted on it fast. That is open source working the way it should, and it is the part of this work I like most: you read software other people count on, you send back what you find, and everyone who runs it comes out safer.
