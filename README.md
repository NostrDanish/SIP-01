<p align="center">
  <img src="public/icon.webp" alt="SIP-01 logo" width="128" height="128">
</p>

<h1 align="center">SIP-01 — Search Index Protocol</h1>

<p align="center">
  <strong>One shared decentralized index. Many independent indexers. Many independent search engines. No single owner.</strong>
</p>

<p align="center">
  <img alt="kind" src="https://img.shields.io/badge/kind-39697-f0b45a">
  <img alt="status" src="https://img.shields.io/badge/status-draft-f0b45a">
  <img alt="schema" src="https://img.shields.io/badge/schema%20version-1-f0b45a">
  <img alt="nostr" src="https://img.shields.io/badge/protocol-nostr-8e30eb">
</p>

SIP-01 is an open Nostr standard for **Web Index Observations** — signed statements of the form:

> *"Indexer `pubkey` observed this web document at this time, and here is its lightweight metadata."*

Any crawler can publish observations, any relay can store and replicate them, any search node can
consume them into a local index, and any search engine can rank and filter them however it wants —
without depending on Google, Bing, a single company, one crawler, one relay, one search engine, or
one signing key.

This repository is the **canonical specification and documentation site** for the protocol.

---

## The event at a glance

One addressable event (kind **39697**) per `(indexer pubkey, normalized URL)`:

```json
{
  "kind": 39697,
  "content": "{\"title\":\"Example Page\",\"description\":\"A page about examples.\"}",
  "tags": [
    ["d", "widx:3641c5f2274c5471278ab5bf1df6d185"],
    ["u", "https://example.com/page"],
    ["t", "nostr"],
    ["l", "en"],
    ["x", "2a5cbdf44513f552fb571d6c6de2ddf16c5452b235cc887980b52898fb38e7c1"],
    ["v", "1"],
    ["source", "crawlstr/1"],
    ["alt", "Web index observation: Example Page"]
  ]
}
```

Three identities, kept separate on purpose:

| Identity | Field | Rule |
|---|---|---|
| **URL identity** | `d` | `"widx:" + sha256(normalized_url)[0:32]` — identical across all indexers |
| **Canonical URL** | `u` | Normalized per spec §7 (www-stripping, tracker-param removal, query sorting) |
| **Content identity** | `x` | `sha256(title + "\n" + description)` — the indexer-agreement signal |

Every hash in this README is real and reproducible — see
[§13 test vectors](public/spec/SIP-01.md#13-test-vectors).

## Documentation

| Document | Contents |
|---|---|
| **[`public/spec/SIP-01.md`](public/spec/SIP-01.md)** | The full, submission-ready specification (v1.1) |
| **[`docs/IMPLEMENTATION-GUIDE.md`](docs/IMPLEMENTATION-GUIDE.md)** | Integration guide: publish, consume, or relay the index |
| **[`NIP.md`](NIP.md)** | Schema summary (repo convention) |
| Site `/dashboard` | Live public index stats — observations, documents, indexers, crawler heartbeats |
| Site `/registry` | Core + extension tag registry and the extension process |
| Site `/query` | Query reference: NIP-01 filters, NIP-50 operators, NIP-11, NIP-77 |
| Site `/audit` | Cross-implementation fact-check & bug report (v1 → v1.1) |
| Site `/explorer` | Live kind 39697 explorer + client-side validator + d-tag calculator |

## Modular by design

The core schema is frozen except through a `v` bump. Everything else — document types, platforms,
networks, future content hashes — ships through the **extension tag registry** (spec §9):

```json
["type", "repository"], ["platform", "github"], ["network", "clearnet"],
["country", "DE"], ["mime", "application/pdf"]
```

- Extensions are **optional** and **ignored by consumers that don't know them** (forwards-compatible).
- Experiments use an `x-` prefix; registration is a PR into the registry.
- Single-letter tag names are reserved for relay-filterable fields (NIP-01 relays only index
  single-letter tags) — multi-letter extensions are engine-level facets surfaced via NIP-50 operators.

## Quickstart

**Read from the index** (any Nostr library, any relay):

```ts
const events = await nostr.query([{ kinds: [39697], '#t': ['nostr'], limit: 50 }]);
// group by d → count distinct pubkeys = independent indexer agreement
```

**Publish to the index** (a crawler in ~20 lines — lift
[`src/lib/sip01-utils.ts`](src/lib/sip01-utils.ts), byte-compatible with every implementation):

```ts
const normalized = normalizeIndexUrl(url);          // spec §7
const d = await documentId(normalized);             // spec §3
const x = await contentHash(title, description);    // spec §8
await signer.signEvent({
  kind: 39697,
  content: JSON.stringify({ title, description }),
  tags: [['d', d], ['u', normalized], ['x', x], ['v', '1'],
         ['alt', `Web index observation: ${title}`]],
});
```

**Search the index** (NIP-50-aware relays):

```json
["REQ", "search", {
  "kinds": [39697],
  "search": "bitcoin privacy site:github.com lang:en after:2026-01-01",
  "limit": 50
}]
```

Full walkthroughs: [`docs/IMPLEMENTATION-GUIDE.md`](docs/IMPLEMENTATION-GUIDE.md).

## Ecosystem

| Repo | Role |
|---|---|
| [UNCAGED-Index-Relay](https://github.com/NostrDanish/UNCAGED-Index-Relay) | Validating index relay — NIP-50 operators, NIP-11 capabilities, NIP-77 federation |
| [Crwalstr](https://github.com/NostrDanish/Crwalstr) | Browser web crawler — pure SIP-01 publisher, per-device indexer keys |
| [indexstr](https://github.com/NostrDanish/indexstr) | Distributed indexing network — sharded crawling + node heartbeats (kind 16919) |
| [UNCAGED-ENGINE](https://github.com/NostrDanish/UNCAGED-ENGINE) | Reference search-engine implementation / forkable template |
| [0xSearchstr](https://github.com/NostrDanish/0xSearchstr) | Search engine — auto-indexes results via autosigner |
| [0xPresearchstr](https://github.com/NostrDanish/0xPresearchstr) | Search engine — clearnet + tor/i2p crawling, keyword stakes |

## Audit

SIP-01 v1 was fact-checked line-by-line against all five implementations and the official NIP
registry. Ten claims verified; nine findings — including a spec example that its own relay would
reject (placeholder hashes) and extension tags implemented but undocumented — are resolved in v1.1.
Full report: the site’s `/audit` page.

## Contributing

- **Spec changes / extension registration:** PR against `public/spec/SIP-01.md` (§9.2 for new
  extension tags). The bar: one crawler publishing it and one engine consuming it.
- **Implementations:** keep byte-compatibility with the §13 test vectors; the explorer's validator
  flags drift.
- **NIP submission:** this protocol is a NIP candidate. Feedback and review are welcome as issues.

## License

The specification text is public domain (CC0-style, as with the NIPs). Code in this repository
follows the repository license.

---

<p align="center">
  <a href="https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2FSIP-01.git" target="_blank">
    <img src="https://shakespeare.diy/badge.svg" alt="Edit with Shakespeare" />
  </a>
</p>
