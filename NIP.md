# SIP-01 — Search Index Protocol (kind 39697)

This project is the **canonical documentation and exploration site** for
SIP-01, the Search Index Protocol. The protocol itself defines one custom
event kind:

| Schema | Kind | Type | Defined in |
|--------|------|------|------------|
| Web Index Observation (SIP-01) | **39697** | addressable | [`public/spec/SIP-01.md`](public/spec/SIP-01.md) |
| Crawler node heartbeat (indexstr) | **16919** | replaceable | read-only consumer — schema: [indexstr `src/crawler/heartbeat.ts`](https://github.com/NostrDanish/indexstr/blob/main/src/crawler/heartbeat.ts) |

This site reads both kinds for the public `/dashboard` (index statistics +
crawler network health). It publishes neither.

## Summary

One addressable event per `(indexer pubkey, normalized URL)` — an indexer's
signed statement: *"I observed this web page at this time, and here is its
public metadata."*

- `d` = `"widx:" + sha256(normalized_url)[0:32]` — deterministic URL identity,
  identical across all independent indexers (group-by-`d` / count-`pubkey`
  gives the independent-observation count).
- `u` = canonical URL, normalized per SIP-01 §7 (www-stripping, tracking-param
  removal, query-param sorting, trailing-slash removal).
- `x` = `sha256(title + "\n" + description)` — content-agreement hash.
- `v` = `"1"` — schema version.
- `content` = `{ title, description?, image? }` JSON.
- Modularity: optional core tags (`t`, `l`, `published`, `source`) plus a
  registered extension-tag registry (`type`, `platform`, `category`,
  `network`, `country`, `mime`) with an `x-` prefix rule for experiments.

All events carry an `alt` tag with a human-readable description
("Web index observation: …").

## This site

- **/spec** — the full submission-ready specification (also downloadable as
  raw markdown from `/spec/SIP-01.md`).
- **/registry** — the core + extension tag registry and how to extend it.
- **/query** — query reference (NIP-01 filters, NIP-50 operators, NIP-11
  capability advertisement, NIP-77 federation).
- **/audit** — the cross-implementation fact-check / bug-check report.
- **/explorer** — live kind 39697 explorer with a client-side validator and a
  URL → `d`-tag calculator implementing SIP-01 §7/§8 byte-compatibly.

## Reference implementations (cross-checked by the audit)

- [0xSearchstr](https://github.com/NostrDanish/0xSearchstr) — search engine + reference client impl
- [0xPresearchstr](https://github.com/NostrDanish/0xPresearchstr) — search engine (clearnet + tor/i2p)
- [UNCAGED-ENGINE](https://github.com/NostrDanish/UNCAGED-ENGINE) — engine template / reference impl
- [Crwalstr](https://github.com/NostrDanish/Crwalstr) — browser crawler (pure SIP-01 publisher)
- [UNCAGED-Index-Relay](https://github.com/NostrDanish/UNCAGED-Index-Relay) — validating index relay (NIP-50/NIP-77)

This site only **reads** kind 39697 from public relays (plus a local
validator/calculator). It publishes nothing.
