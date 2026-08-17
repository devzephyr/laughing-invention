---
title: "Why Can't We Agree on What a Passkey Is?"
description: "One credential has 14 names because three standards bodies and a marketing coalition all held authority to name it and none held authority to stop. The passkey vocabulary mess is a governance problem, not a spelling one."
date: "2026-07-07"
tags: ["passkeys", "webauthn", "fido2", "authentication", "identity", "standards"]
---

A product manager says "passkey." A security architect says "resident key." An iOS engineer says "platform authenticator credential." They are on the same call, describing the same feature, and each of them is right. The meeting unsticks after someone writes each term on a whiteboard beside its spec definition and everyone realizes they have agreed for twenty minutes.

That anecdote opens a [passkey glossary](https://mojoauth.com/blog/passkey-glossary-webauthn-fido2-aaguid-explained) published this year. Passkeys are the strongest consumer authentication upgrade in twenty years: phishing-resistant by design, no shared secret to breach, five billion of them in use per the FIDO Alliance's 2026 count. The technology works. Eight years after it shipped, the industry still cannot settle on a name for the credential or count how many sites accept it.

Engineers did not cause this by being careless. Three standards bodies and a marketing coalition each held the authority to name this credential, and none held the authority to retire anyone else's name. The vocabulary problem is a governance problem.

## The Symptom: 14 Names for One Credential

Start with the evidence. The same underlying credential, or a strict subset of it, shows up under all of these names across the specs and the marketing, and teams use them in real documentation today.

| Term | Coined by | Year | What it means |
|------|-----------|------|----------------------|
| Public key credential | W3C WebAuthn | 2019 | The base API object. Everything below is a flavor of this. |
| WebAuthn credential | W3C | 2019 | Colloquial name for the above. |
| FIDO2 credential | FIDO Alliance | 2018 | Umbrella term. Superset of everything, discoverable or not. |
| Resident key | FIDO CTAP2 | 2018 | The `rk` flag. Original name for a discoverable credential. |
| Discoverable credential | W3C WebAuthn L2 | 2021 | Same thing as a resident key, renamed by W3C. |
| Client-side discoverable credential | W3C | 2021 | The formal, pedantic version of the above. |
| Non-discoverable credential | W3C | 2021 | The opposite. Needs a credential ID first. Not a passkey. |
| Platform authenticator credential | Vendor | 2019 | Made by Touch ID, Face ID, Windows Hello. |
| Roaming authenticator credential | W3C | 2019 | Made by a security key you plug in. Also "security key." |
| Passkey | FIDO Alliance marketing | 2022 | Discoverable credential + user verification. The consumer word. |
| Multi-device FIDO credential | FIDO / Apple / Google / MS | 2022 | The syncable kind, before "passkey" won. |
| Synced passkey | Apple / Google / MS | 2022 to 2024 | Private key replicates via iCloud Keychain or Google Password Manager. |
| Device-bound passkey | Enterprise / hardware | 2022 to 2023 | Private key never leaves the authenticator. |
| Single-device / hardware-bound credential | Enterprise | 2023 | The device-bound kind, under yet another name. |

That table holds fourteen labels for one family of credential. Resident key, discoverable credential, and client-side discoverable credential name one identical concept. A passkey is a discoverable credential with user verification required, so it sits as a subset. Multi-device FIDO credential became synced passkey with no change to the bytes. The wire format held still while the vocabulary forked.

## Where the Names Came From

The "Coined by" column carries the story. Four authorities named the same concept, each for its own audience, and no referee sat above them.

FIDO's CTAP2 group named the plumbing first in 2018. The Client-to-Authenticator Protocol calls a self-stored credential a resident key, because at the protocol level it resides on the device. That word fit the engineering document it lived in.

W3C named the browser API next and picked different words. WebAuthn shipped in 2019 with its own working group and an audience of web developers. Its 2021 revision judged "resident key" confusing and renamed the concept "discoverable credential." W3C cannot edit FIDO's specifications, so it added a second name rather than replacing the first. Both remain normative.

FIDO's marketing group named it a third time in 2022. Few consumers would say "discoverable client-side FIDO2 credential with user verification," so the FIDO Alliance, Apple, Google, and Microsoft coined "passkey" and promoted it across their platforms. It won on merit. The word sits on top of two technical terms rather than replacing either.

The platform vendors named it a fourth time once sync arrived, between 2022 and 2024. Sync let a passkey copy itself through iCloud Keychain or Google Password Manager, and security teams then needed to separate the copy-everywhere kind from the stays-put kind, so "synced" and "device-bound" attached to the front and picked up enterprise aliases. One word split into two categories and four more names.

No step retired a term, because no single body could tell another to drop its own vocabulary. W3C owns the API. FIDO owns the protocol and the brand. NIST owns the assurance levels that decide what counts as multi-factor. The vendors own the products people touch. Convergence would require all four to abandon words that still work inside their own domains, and none of them has a reason to. The disagreement holds because the structure rewards it.

## This Has Happened Before

Passkeys are not the first technology to fracture this way. OAuth 2.0 shipped as a framework rather than a protocol, and a decade of incompatible "OAuth" implementations followed. Vendors sell "zero trust" as at least six different architectures. The pattern repeats whenever a good idea draws multiple standards bodies and a crowd of vendors, each with a fair reason to describe it in its own terms and no mechanism to force them together.

Standards bodies excel at adding specifications and struggle to retire vocabulary, because dropping a term means telling a peer organization its word was wrong. Passkeys make the cost visible, because in authentication a naming slip turns into a security bug.

## The Cost of Not Agreeing

The disagreement maps onto properties that break real deployments.

RP ID scoping binds a passkey to one Relying Party ID, which must be the origin's effective domain or a registrable suffix, with no scheme, port, or path. Register it against the wrong value and the credential works on localhost and fails in production. Developers hit this bug more than any other in WebAuthn, and they hit it because the UI that says "Sign in with a passkey" does not show which domain owns the credential.

User verification is the property that makes a passkey count as multi-factor. The word "passkey" implies UV; the API leaves it optional. Ship a relying party that skips the UV requirement and you have labeled something "passwordless" that proves only device possession, not the identity of the person holding it.

Synced and device-bound passkeys sit on opposite sides of a compliance line. NIST counts a synced passkey as single-factor for restoration, because whoever holds your cloud account can restore the key. A device-bound passkey on hardware reaches AAL3 and satisfies PCI MFA. One word, "passkey," decides whether a system passes the audit, and telling the two apart in code means inspecting the AAGUID, the 128-bit authenticator model ID, which many platform authenticators report as all-zeros to stay anonymous.

A team that uses four words for the credential and none for the property that decides the audit cannot reason about any of this.

## We Cannot Even Count Them

The disagreement produced one more consequence. Because the industry settled on no standard way for a site to advertise passkey support, no one knows how many sites offer it.

Researchers at the University of Surrey measured it in March 2026 across the Tranco top 100K:

- 11.3% of sites support passkeys, 9,397 in total, which runs 62 times higher than the largest hand-curated directory had listed.
- The best manual directory captured around 4% of live deployments. It missed 96.2% of the sites the scan found.
- Confirming support meant executing JavaScript on 82.3% of sites. Static analysis misses most of them.
- Sites label the identical feature "Sign in with a passkey," "Use Touch ID," "Windows Hello," or a localized string, and tuck it under "More sign-in options."

OAuth and OpenID Connect expose a discovery endpoint that lists what a server supports. WebAuthn ships no equivalent. The researchers whose job was counting passkeys had to reverse-engineer each site by instrumenting `navigator.credentials` and reading button text. The lack of a standard follows all the way through: no one can measure the ecosystem, including the people paid to try.

## What Would Fix It

At the standards level, close to nothing, and not soon. The words have shipped. No one un-publishes a normative specification, and no organization holds the authority to force the other three to converge. "Passkey" has won as the consumer term, which helps, and the technical thicket under it stays put.

The fix that remains is local. Do what that vendor call did: put the word on the whiteboard next to its spec definition before anyone writes code. Decide whether you mean discoverable or not, user-verified or not, synced or device-bound, and write the precise term into your design docs and your security reviews. You cannot make four standards bodies agree, but you can keep the ambiguity out of your own codebase.

Four authorities named this credential and none could overrule the rest, so the industry will keep disagreeing about what a passkey is. Agree inside your own walls, and ship it. It remains the best credential available.

## References

**Primary Sources:**
- [State of Passkey Authentication in the Wild: A Census of the Top 100K Sites](https://arxiv.org/html/2602.15135v2) -- Bhardwaj & Sastry, University of Surrey, March 2026
- [The Passkey Glossary: WebAuthn, FIDO2, AAGUID, RP ID, and Discoverable Credentials Explained](https://mojoauth.com/blog/passkey-glossary-webauthn-fido2-aaguid-explained)

**Standards:**
- [W3C Web Authentication (WebAuthn) Level 2](https://www.w3.org/TR/webauthn-2/)
- [FIDO Alliance Specifications](https://fidoalliance.org/specifications/)
- [FIDO Alliance: Passkeys](https://fidoalliance.org/passkeys/)

**Additional Reading:**
- [NCSC: Comparing traditional user credentials and FIDO2 credentials for personal use](https://www.ncsc.gov.uk/paper/traditional-user-and-fido2-credentials-personal-use)
- [Corbado: What is the Difference Between FIDO2 and Passkeys?](https://www.corbado.com/faq/what-is-difference-fido2-passkeys)
