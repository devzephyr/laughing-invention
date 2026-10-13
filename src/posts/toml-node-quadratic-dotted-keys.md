---
title: "One Long Key: How 200 KB of TOML Kills a Node Process"
description: "toml for npm rebuilt every dotted key's full path at every segment, so one long key cost O(n²) time and memory. A 100 KB key froze the event loop for 6.8 seconds, and around 200 KB crashed Node with an out-of-memory error that try/catch can't stop. GHSA-9j65-hcg3-gc64, fixed in 5.0.1."
date: "2026-10-13"
tags: ["toml", "nodejs", "denial-of-service", "algorithmic-complexity", "cwe-407", "responsible-disclosure"]
advisories:
  - id: "GHSA-9j65-hcg3-gc64"
    repo: "BinaryMuse/toml-node"
    product: "toml (npm)"
    kind: "Quadratic-complexity DoS"
    affected: "<= 5.0.0"
    fixed: "5.0.1"
    severity: "High"
---

The `toml` package on npm was downloaded 44,952,961 times in the week before this fix shipped. Give its `parse()` one dotted key with 16,000 segments, about 100 KB of text, and it blocks the Node event loop for 6.8 seconds. Double the key and the process dies:

```text
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

No nesting, no exotic syntax. One line of `k0.k1.k2. … = 1`.

I reported it to the maintainer on September 12, 2026. Around the same time, pi3ch and midnightmichigan of SecDim Security Research reported the same bug on their own, so it went out as one advisory, [GHSA-9j65-hcg3-gc64](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-9j65-hcg3-gc64), crediting all three of us. The advisory text is SecDim's write-up. Michelle Tilley shipped the fix in `toml` 5.0.1 on October 12, 2026, along with fixes for three other advisories, and her fix is better than the one the advisory suggested. It's rated High. No CVE has been assigned.

This one is worth writing up because the library already had a denial-of-service guard. Three months earlier it shipped `maxDepth` to stop a stack overflow. That guard limits how deep a document nests. This bug doesn't care how deep you nest. It only cares how long your key is.

## What a Dotted Key Is

TOML lets you write nested tables as one dotted key:

```toml
server.http.port = 8080
```

That's shorthand for `{ server: { http: { port: 8080 } } }`. The same dotted paths show up in table headers (`[server.http]`), array-of-tables headers (`[[server.http]]`) and keys inside inline tables (`t = { a.b.c = 1 }`). The [spec](https://toml.io/en/v1.0.0#keys) puts no limit on how many segments a key can have, and neither did the parser. The grammar rules `dot_ended_table_key_part+` and `inline_dot_key_part+` in `src/toml.pegjs` are unbounded `+` repetitions.

To walk a dotted key, the compiler loops over its segments and creates a table at each one. That part is fine and linear. The problem is what it did on the side.

## The Bug: Rebuilding the Prefix From Scratch

TOML has rules about redefinition. You can't assign `a.b = 1` and then `a.b.c = 2`, and you can't use a dotted key to extend a table some other header already defined. The 5.0.0 compiler enforced those rules with three `Set`s of path strings: `assignedPaths`, `valueAssignments` and `explicitTablePaths`. To check a path against them, it needed the path as a string. So at every segment it built one.

Here is `assign()` from `lib/compiler.js` in 5.0.0, the code behind top-level dotted keys:

```js {3,7}
for (var i = 0; i < keys.length - 1; i++) {
  var k = keys[i];
  var intermediatePath = makeFullPath(keys.slice(0, i + 1));

  if (typeof target[k] === "undefined") {
    target[k] = createTable();
    assignedPaths.add(intermediatePath);
  } else if (/* ... redefinition checks against the Sets ... */) {
    genError("Cannot redefine existing key '" + intermediatePath + "'.", off);
  }
  target = target[k];
}
```

And the helpers it calls:

```js
function pathKey(keys) {
  return keys.map(quoteDottedString).join(".");
}

function makeFullPath(keys) {
  return pathKey(currentPath.concat(keys));
}
```

At segment `i`, `keys.slice(0, i + 1)` copies `i + 1` segments into a new array, `.map()` copies them again, and `.join(".")` writes a string as long as the whole prefix. That's O(i) work at step `i`. Over `n` segments it adds up to 1 + 2 + … + n = n(n+1)/2. For 16,000 segments, that's 128,008,000 segment copies to parse one line.

The same pattern sits in two more places. `deepRef()` does it for table headers and array-of-tables headers, and `setNestedKey()` does it for inline-table keys. One mistake, three entry points.

<iframe class="figure-frame" src="/figures/toml-node-quadratic-dotted-keys.html" title="Interactive figure: a read head that runs back to k0 at every segment of a dotted key, and the 5.0.1 fix that tags each table instead" loading="lazy"></iframe>

The string also wasn't needed. On the happy path it only ever fed `assignedPaths.add()`. Its only other use was in an error message, and on valid input no error is thrown.

## It Eats Memory Too

The time is quadratic. So is the memory, and that is what turns a slow parse into a dead process.

Look at line 7 again. Every prefix string goes into `assignedPaths` and stays there until the parse returns. Prefix `i` is about as long as the first `i` segments. With segments named `k0`, `k1`, `k2` and so on, I summed the prefix lengths:

| Segments | Input | Prefix characters held in the Set |
|---|---|---|
| 16,000 | 100,894 bytes | about 0.77 billion |
| 32,000 | 212,894 bytes | about 3.28 billion |
| 64,000 | 436,894 bytes | about 13.68 billion |

A 213 KB input asks V8 for more than 3 GB of strings. I confirmed that number directly: with the heap capped at 3 GB (`--max-old-space-size=3072`), the 32,000-segment key still crashes.

A V8 heap-limit crash is not an exception. It's a fatal error that aborts the process. Wrapping `toml.parse()` in `try/catch` doesn't help. Neither does a timeout around the call. The process is gone and every request it was serving goes with it.

## Exploitation: One Line of Text

The proof of concept is a loop:

```js
const toml = require('toml');

// n-segment dotted key: "k0.k1.k2. ... .k{n-1} = 1"
function segKey(n) {
  const parts = [];
  for (let i = 0; i < n; i++) parts.push('k' + i);
  return parts.join('.') + ' = 1\n';
}

toml.parse(segKey(16000)); // ~100.9 KB, ~6.6-6.8 s blocked
toml.parse(segKey(32000)); // ~200 KB, heap out of memory, process exits
```

The advisory's numbers, measured on Node 22:

| Segments | Input | Time |
|---|---|---|
| 1,000 | ~4.9 KB | 34 ms |
| 8,000 | ~46.9 KB | 1.6 s |
| 16,000 | ~100.9 KB | 6.8 s |
| 32,000 | ~200 KB | process crash (OOM) |

Going from 8,000 to 16,000 segments multiplies the time by about 4.2. Linear code would double. Quadratic code quadruples. That ratio is the whole diagnosis.

I re-ran it for this post on Node v25.1.0, a faster runtime with a larger default heap (4,288 MiB):

| Segments | 5.0.0 | 5.0.1 |
|---|---|---|
| 1,000 | 12 ms | 2 ms |
| 4,000 | 135 ms | 3 ms |
| 8,000 | 457 ms | 4 ms |
| 16,000 | 1,710 ms | 8 ms |
| 32,000 | 8,866 ms, 2.2 GB peak RSS | — |
| 64,000 | heap out of memory after about 11 s | 36 ms |

The newer runtime moves the crash point, but it doesn't fix anything. On 5.0.0 the 8,000-to-16,000 step still costs 3.7 times as much. A 32,000-segment key survives only because this machine's default heap is bigger than 3 GB. A process with a smaller heap, which is what you get in a memory-limited container, dies at 213 KB, and 437 KB kills even the large heap. The advisory reproduced the same scaling for the table-header and inline-table variants. I spot-checked both at 8,000 segments: 400 ms and 410 ms on 5.0.0, 4 ms each on 5.0.1.

Node runs your JavaScript on one thread. While `parse()` grinds, the process serves nobody: not the attacker, not anyone else. Any app that parses TOML from outside is exposed: a config upload, a manifest import, an API that takes TOML in the request body. The attacker needs no account and no special syntax. They need you to call `parse()` on one string.

## Why maxDepth Didn't Catch It

`toml` already had a resource guard. In July 2026, [GHSA-82x6-q7mm-w9cf](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-82x6-q7mm-w9cf) (CVE-2026-77465, CVSS 7.5) showed that deeply nested arrays or inline tables could overflow the call stack. Version 4.2.0 fixed it with a nesting limit: 500 levels by default, configurable through `maxDepth`.

That limit lives in the grammar's `value` rule. Dotted-key segments are parsed by their own repetition rules and never pass through it. The advisory tested this directly. With `maxDepth: 1`, the strictest setting there is, a 16,000-segment key took no measurably different time from the unrestricted run.

`maxDepth` asks how deep a document nests. This bug needed a different question: how much work does one key cost? A dotted key with 16,000 segments does build a table 16,000 levels deep. It just never touches the code that counts depth.

## The Fix Deleted the Strings

The advisory suggested the obvious patch: build the prefix as you go, appending one quoted segment per iteration instead of re-joining it every time. That takes the per-segment cost from O(i) to O(1).

Tilley went further. Commit [609c873](https://github.com/BinaryMuse/toml-node/commit/609c873fffea0a27ebe5b4dd098eed2b3daf3606), "Track table origin on the table instead of in string-keyed path sets", deletes the three `Set`s outright. Each table the compiler creates is tagged in a `WeakMap` with how the document made it: `header`, `implicit`, `dotted`, `inline` or `table-array`. The redefinition rules read the tag from the table itself:

```js
var intermediatePath = makeFullPath(keys.slice(0, i + 1)); // [!code --]
if (typeof target[k] === "undefined") { // [!code --]
  target[k] = createTable(); // [!code --]
  assignedPaths.add(intermediatePath); // [!code --]
var next = table[key]; // [!code ++]
if (next === undefined) { // [!code ++]
  next = createTable(DOTTED_TABLE); // [!code ++]
  table[key] = next; // [!code ++]
} else { // [!code ++]
  var kind = containerKinds.get(next); // [!code ++]
  if (kind !== DOTTED_TABLE && kind !== IMPLICIT_TABLE) { // [!code ++]
    var path = pathKey(prefix.concat(keys.slice(0, i + 1))); // [!code ++]
    // ...throw the right error, naming the path // [!code ++]
  } // [!code ++]
}
```

A path string still gets built, but only inside the branch that is about to throw. Valid input never builds one. The change is 101 lines added and 144 removed, and it fixed three advisories at once. The commit message lists the other two. Distinct key paths could render to the same string and switch off the guard on an unrelated key, which led to prototype pollution ([GHSA-h895-cgqg-jf52](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-h895-cgqg-jf52)). And every array-of-tables header rescanned every path defined so far ([GHSA-4qx8-w7c3-pj3p](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-4qx8-w7c3-pj3p)). The string sets caused all three. Delete them and all three go away.

That's the right call. The suggested patch would have made the strings cheaper. Hers made them unnecessary, and it also closed a correctness bug the strings had been hiding. The release adds regression tests that parse a 50,001-segment key in each of the four positions (dotted key, table header, array-of-tables header, inline table) and fail if any takes longer than 2,000 ms.

5.0.1 doesn't add a cap on segment count. With linear work per segment it doesn't need one: a 64,000-segment key now parses in 36 ms.

## What to Do

Upgrade to `toml` 5.0.1 or later. Check what you actually have installed, since `toml` usually arrives as a transitive dependency:

```bash
npm ls toml
```

If you can't upgrade right away, cap the size of untrusted TOML before you call `parse()`. With 5.0.0, 100 KB already buys a multi-second stall, so set the cap well below that. Better still, parse untrusted input in a worker thread or a child process with its own memory limit, so a bad document takes down a worker you can restart and not your server.

The general lesson is the one this bug teaches by example. A guard that limits one dimension of the input says nothing about the others. Depth was bounded. Length was not. When you audit a parser for denial of service, double every dimension of the input you can find and check that the runtime roughly doubles too. Any dimension where it quadruples is a bug.

## Disclosure Timeline

- **2026-07-14**: `toml` 5.0.0 released
- **2026-07-16**: SecDim's audited checkout, commit `1b2ac40`, one changelog-only commit past `v5.0.0`
- **2026-09-12**: I reported it to the maintainer
- **2026-10-12**: Fix committed (`609c873`), 5.0.1 published to npm, GHSA-9j65-hcg3-gc64 published

## References

**Primary Source:**
- [GHSA-9j65-hcg3-gc64: Quadratic-complexity DoS via long dotted keys or table paths in toml.parse()](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-9j65-hcg3-gc64)
- [toml-node v5.0.1 release](https://github.com/BinaryMuse/toml-node/releases/tag/v5.0.1)
- [Commit 609c873: Track table origin on the table instead of in string-keyed path sets](https://github.com/BinaryMuse/toml-node/commit/609c873fffea0a27ebe5b4dd098eed2b3daf3606)

**Related Advisories:**
- [GHSA-82x6-q7mm-w9cf: Uncontrolled recursion (the maxDepth fix, 4.2.0)](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-82x6-q7mm-w9cf)
- [GHSA-h895-cgqg-jf52: Prototype pollution via colliding path strings](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-h895-cgqg-jf52)
- [GHSA-4qx8-w7c3-pj3p: Quadratic time on many array-of-tables headers](https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-4qx8-w7c3-pj3p)

**Technical Resources:**
- [CWE-407: Inefficient Algorithmic Complexity](https://cwe.mitre.org/data/definitions/407.html)
- [TOML v1.0.0: Keys](https://toml.io/en/v1.0.0#keys)
- [Node.js: Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [toml on npm](https://www.npmjs.com/package/toml)
- [SecDim](https://secdim.com)
