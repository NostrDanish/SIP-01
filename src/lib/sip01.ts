/**
 * SIP-01 structured protocol data — the single source of truth for the
 * documentation site. Mirrors public/spec/SIP-01.md (v1.1).
 */

export const SIP01 = {
  name: 'Search Index Protocol',
  short: 'SIP-01',
  kind: 39697,
  version: '1.1',
  schemaVersion: '1',
  dPrefix: 'widx:',
  tagline:
    'One shared decentralized index. Many independent indexers. Many independent search engines. No single owner.',
} as const;

/* ------------------------------------------------------------------ */
/* Implementations                                                     */
/* ------------------------------------------------------------------ */

export interface Repo {
  name: string;
  url: string;
  role: string;
  badge: 'Relay' | 'Crawler' | 'Engine' | 'Engine +' | 'Template';
  description: string;
  keyFiles: { path: string; note: string }[];
}

export const REPOS: Repo[] = [
  {
    name: 'UNCAGED-Index-Relay',
    url: 'https://github.com/NostrDanish/UNCAGED-Index-Relay',
    role: 'Validating index relay',
    badge: 'Relay',
    description:
      'The reference relay. Validates SIP-01 events at ingestion (d ↔ u and x ↔ content verified at the door), indexes them into dedicated OpenSearch fields, answers NIP-50 web-search operators, advertises capabilities via NIP-11, and federates with NIP-77 negentropy sync.',
    keyFiles: [
      { path: 'src/web-document.ts', note: 'SIP-01 validation + field extraction' },
      { path: 'docs/SIP-01.md', note: 'Relay profile — the relay-side contract' },
      { path: 'src/opensearch.ts', note: 'Web-search operator → query mapping' },
    ],
  },
  {
    name: 'Crwalstr',
    url: 'https://github.com/NostrDanish/Crwalstr',
    role: 'Browser web crawler',
    badge: 'Crawler',
    description:
      'A pure SIP-01 publisher. Each browser generates its own anonymous indexer keypair (never the user’s personal key), crawls pages, and publishes byte-compatible kind 39697 observations to the shared index.',
    keyFiles: [
      { path: 'src/crawler/webIndex.ts', note: 'Byte-compatible event builder' },
      { path: 'src/crawler/indexerIdentity.ts', note: 'Per-device anonymous indexer keys' },
      { path: 'NIP.md', note: 'Publisher-side schema reference' },
    ],
  },
  {
    name: 'indexstr',
    url: 'https://github.com/NostrDanish/indexstr',
    role: 'Distributed indexing network',
    badge: 'Crawler',
    description:
      'Crawlstr evolved into a network: curated URL collections, deterministic sharding (256 shards, one home shard per node pubkey), offline outbox, and node heartbeats (kind 16919) so the network can measure itself without a coordinator.',
    keyFiles: [
      { path: 'src/crawler/webIndex.ts', note: 'Byte-compatible event builder' },
      { path: 'src/crawler/heartbeat.ts', note: 'Node heartbeats — kind 16919' },
      { path: 'src/crawler/sharding.ts', note: 'Coordinator-free work splitting' },
    ],
  },
  {
    name: 'UNCAGED-ENGINE',
    url: 'https://github.com/NostrDanish/UNCAGED-ENGINE',
    role: 'Search engine template',
    badge: 'Template',
    description:
      'The reference search-engine implementation and forkable template. Ships the canonical webIndex.ts (build / parse / validate / normalize), the per-device indexer identity, and the web-index provider that groups observations by d and ranks by independent indexer count.',
    keyFiles: [
      { path: 'src/lib/webIndex.ts', note: 'Reference implementation (canonical)' },
      { path: 'docs/SEARCH_INDEX_PROTOCOL.md', note: 'Protocol draft (v1)' },
      { path: 'src/lib/indexerIdentity.ts', note: 'Per-device indexer identity' },
    ],
  },
  {
    name: '0xSearchstr',
    url: 'https://github.com/NostrDanish/0xSearchstr',
    role: 'Search engine',
    badge: 'Engine',
    description:
      'The original engine. Aggregates external providers and auto-indexes fresh results as SIP-01 observations via a server-side autosigner — “just one more independent indexer”. Reads merge the legacy kind-30078 query cache with kind 39697.',
    keyFiles: [
      { path: 'src/lib/webIndex.ts', note: 'Publisher/reader impl' },
      { path: 'docs/SEARCH_INDEX_PROTOCOL.md', note: 'Protocol draft (v1)' },
      { path: 'NIP.md', note: 'Legacy cache schema + trusted indexers' },
    ],
  },
  {
    name: '0xPresearchstr',
    url: 'https://github.com/NostrDanish/0xPresearchstr',
    role: 'Search engine — clearnet + tor/i2p',
    badge: 'Engine +',
    description:
      'The extended engine: multi-network crawling (clearnet, tor, i2p seed lists), keyword stakes, and the same SIP-01 read/write path. Proof that engines layer app-specific features on top of the shared index without touching the core schema.',
    keyFiles: [
      { path: 'backend/tor-crawler/src/index.ts', note: 'Tor network crawler' },
      { path: 'backend/nip50-relay/src/index.ts', note: 'Bundled search relay' },
      { path: 'src/lib/webIndex.ts', note: 'Publisher/reader impl' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tag registry                                                        */
/* ------------------------------------------------------------------ */

export interface TagSpec {
  tag: string;
  location?: string;
  requirement: 'required' | 'optional';
  shape: string;
  relayIndexed: boolean;
  description: string;
  status?: 'core' | 'registered' | 'reserved';
}

export const CORE_TAGS: TagSpec[] = [
  { tag: 'd', requirement: 'required', shape: '"widx:" + 32 lowercase hex', relayIndexed: true, status: 'core', description: 'URL identity. sha256(normalized u)[0:32]. Identical across all indexers — the dedup + agreement key.' },
  { tag: 'u', requirement: 'required', shape: 'http(s) URL ≤ 2048 chars', relayIndexed: true, status: 'core', description: 'Canonical URL. Validated against the allowlist; normalized per §7 before hashing.' },
  { tag: 'v', requirement: 'required', shape: '"1"', relayIndexed: true, status: 'core', description: 'Schema version. Unknown versions are ignored by consumers / rejected at ingestion.' },
  { tag: 'alt', requirement: 'required', shape: 'non-empty, ≤ 1000 chars', relayIndexed: false, status: 'core', description: 'Human-readable summary for generic clients. Presentation-only — never parsed.' },
  { tag: 'title', location: 'content', requirement: 'required', shape: 'string, 1–300 chars trimmed', relayIndexed: false, status: 'core', description: 'Document title, in the content JSON.' },
  { tag: 'description', location: 'content', requirement: 'optional', shape: 'string ≤ 1000 chars', relayIndexed: false, status: 'core', description: 'Plain-text summary, no markup.' },
  { tag: 'image', location: 'content', requirement: 'optional', shape: 'https: URL ≤ 2048 chars', relayIndexed: false, status: 'core', description: 'Representative image. https only.' },
  { tag: 't', requirement: 'optional', shape: '0–8 × ^[a-z0-9][a-z0-9-]{0,99}$', relayIndexed: true, status: 'core', description: 'Lowercase topics. How topical engines slice the index without a new kind.' },
  { tag: 'l', requirement: 'optional', shape: 'ISO 639-1, ^[a-z]{2}$', relayIndexed: true, status: 'core', description: 'Document language (NIP-23/24 convention). Takes precedence over detection.' },
  { tag: 'x', requirement: 'optional', shape: '64 lowercase hex', relayIndexed: true, status: 'core', description: 'Content identity: sha256(title + "\\n" + description). Same d + same x = indexers agree.' },
  { tag: 'published', requirement: 'optional', shape: 'unix seconds', relayIndexed: false, status: 'core', description: 'The page’s claimed publication time. (Observation time is the event’s created_at.)' },
  { tag: 'source', requirement: 'optional', shape: '≤ 100 chars', relayIndexed: false, status: 'core', description: 'Indexer software id, e.g. crawlstr/1. Informational — the pubkey is the real identity.' },
];

export const EXTENSION_TAGS: TagSpec[] = [
  { tag: 'type', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Logical document type: page, article, repository, video, image, file…' },
  { tag: 'platform', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Source platform: github, gitlab, youtube…' },
  { tag: 'category', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Content category; engine-defined vocabulary.' },
  { tag: 'network', requirement: 'optional', shape: 'keyword, lowercased', relayIndexed: false, status: 'registered', description: 'Network the document lives on: clearnet, tor, i2p…' },
  { tag: 'country', requirement: 'optional', shape: 'ISO 3166-1 alpha-2, uppercased', relayIndexed: false, status: 'registered', description: 'Country the document targets or originates from.' },
  { tag: 'mime', requirement: 'optional', shape: 'MIME type, lowercased', relayIndexed: false, status: 'registered', description: 'Document media type, e.g. application/pdf.' },
];

export const EXTENSION_RULES = [
  { title: 'Extensions are optional', body: 'A consumer that ignores every extension still has a fully working index entry. No extension may become load-bearing.' },
  { title: 'Never redefine core fields', body: 'Extensions must not change the meaning of existing fields. Changing core semantics requires a v bump, not a new tag.' },
  { title: 'Unknown tags are ignored', body: 'Consumers and relays MUST ignore unknown tags — extensions stay forwards-compatible. Relays that validate SIP-01 still store events carrying unknown tags.' },
  { title: 'Single-letter names are reserved', body: 'Stock NIP-01 relays only index single-letter tags (#d, #t, #u, #x…). Claiming a new single-letter name requires a registry update and broad relay awareness. Multi-letter extensions are engine-level facets — filterable on SIP-01-aware relays via NIP-50 operators, not via #tag filters on stock relays.' },
  { title: 'Keyword-shaped values', body: 'Extension values should match ^[a-zA-Z0-9][a-zA-Z0-9_-]{0,49}$ so they map cleanly onto keyword index fields.' },
  { title: 'Experiments use the x- prefix', body: 'Before registration, experimental tags use x- (e.g. ["x-rank-hint", "…"]) to avoid squatting on future registry names. Registration = a pull request adding a row to the registry.' },
];

/* ------------------------------------------------------------------ */
/* Query reference                                                     */
/* ------------------------------------------------------------------ */

export interface Operator {
  op: string;
  field: string;
  description: string;
  example: string;
}

export const SEARCH_OPERATORS: Operator[] = [
  { op: 'site:', field: 'url_domain_hierarchy', description: 'Host or any subdomain — site:github.com also matches docs.github.com. Repeated site: tokens OR together.', example: 'site:github.com' },
  { op: 'domain:', field: 'url_host', description: 'Exact host match, no subdomains.', example: 'domain:docs.github.com' },
  { op: 'url:', field: 'url', description: 'Exact normalized-URL match — the value is normalized with the same §7 rules.', example: 'url:HTTPS://WWW.Example.Com/?utm_source=x#top' },
  { op: 'inurl:', field: 'url', description: 'Tokenized match against the URL.', example: 'inurl:protocol' },
  { op: 'title:', field: 'title', description: 'Match against the document title; repeated tokens AND.', example: 'title:"search index"' },
  { op: 'topic:', field: 'tags_map.t', description: 'SIP-01 t topic tag.', example: 'topic:privacy' },
  { op: 'type:', field: 'doc_type', description: 'Logical document type extension tag.', example: 'type:repository' },
  { op: 'platform:', field: 'platform', description: 'Source platform extension tag.', example: 'platform:github' },
  { op: 'category:', field: 'category', description: 'Content category extension tag.', example: 'category:dev' },
  { op: 'network:', field: 'network', description: 'Network extension tag.', example: 'network:tor' },
  { op: 'country:', field: 'country', description: 'ISO 3166-1 alpha-2 country extension tag.', example: 'country:DE' },
  { op: 'mime:', field: 'content_type', description: 'MIME type extension tag.', example: 'mime:application/pdf' },
  { op: 'filetype:', field: 'file_ext', description: 'File extension from the URL path.', example: 'filetype:pdf' },
  { op: 'source:', field: 'source', description: 'Indexer software identifier.', example: 'source:crawlstr/1' },
  { op: 'lang:', field: 'language', description: 'Alias of language:. The l tag takes precedence over detected language.', example: 'lang:en' },
  { op: 'before: / after:', field: 'published_at', description: 'Content-freshness range on the page’s claimed published time (unix seconds or YYYY-MM-DD). Observation time uses native since/until.', example: 'after:2026-01-01' },
  { op: 'distinct:domain', field: '—', description: 'At most one result per host — the answer to ten links from the same site crowding the page.', example: 'distinct:domain' },
];

export const BASELINE_FILTERS = [
  { filter: '{ "kinds": [39697] }', note: 'Everything a relay holds. The firehose.' },
  { filter: '{ "kinds": [39697], "#d": ["widx:…"] }', note: 'Every independent observation of one URL.' },
  { filter: '{ "kinds": [39697], "#t": ["privacy"] }', note: 'Topic slices — topical engines live here.' },
  { filter: '{ "kinds": [39697], "#u": ["https://example.com/page"] }', note: 'Exact URL lookup.' },
  { filter: '{ "kinds": [39697], "#x": ["<hash>"] }', note: 'Content-identity lookup across URLs.' },
  { filter: '{ "kinds": [39697], "authors": ["<indexer>"] }', note: 'One indexer’s observations.' },
  { filter: '{ "kinds": [39697], "since": 1786200000 }', note: 'Observation-time ranges (created_at).' },
];

/* ------------------------------------------------------------------ */
/* Test vectors (spec §13 — real, reproducible)                        */
/* ------------------------------------------------------------------ */

export const D_VECTORS = [
  { input: 'https://example.com/', normalized: 'https://example.com/', d: 'widx:0f115db062b7c0dd030b16878c99dea5' },
  { input: 'HTTPS://WWW.Example.Com:443/page/?b=2&utm_source=x&a=1#top', normalized: 'https://example.com/page?a=1&b=2', d: 'widx:f68176b3eb966bd682c3c6eadcc5fe44' },
  { input: 'https://example.com/page', normalized: 'https://example.com/page', d: 'widx:3641c5f2274c5471278ab5bf1df6d185' },
  { input: 'https://github.com/NostrDanish/Crwalstr', normalized: 'https://github.com/NostrDanish/Crwalstr', d: 'widx:cdfd4df8c01d609fc9cdf943afa80197' },
];

export const X_VECTORS = [
  { title: 'Example', description: '', x: 'e1762f14d9924e37b32f1c81dfd256410af462f5136415c96877efa8c80345d0' },
  { title: 'Example Page', description: 'A page about examples.', x: '2a5cbdf44513f552fb571d6c6de2ddf16c5452b235cc887980b52898fb38e7c1' },
];

/* ------------------------------------------------------------------ */
/* Audit report (cross-implementation fact-check, 2026-08)             */
/* ------------------------------------------------------------------ */

export interface Finding {
  id: string;
  severity: 'bug' | 'warning' | 'note';
  area: string;
  title: string;
  detail: string;
  resolution: string;
}

export const AUDIT_VERIFIED = [
  { claim: 'Kind 39697 is addressable-range', evidence: '30000 ≤ 39697 ≤ 39999 per NIP-01/NIP-33. One live slot per (pubkey, d); recrawl replaces.', ok: true },
  { claim: 'Kind 39697 is unregistered', evidence: 'Absent from the official kind registry (neighbors: 39089/39092 starter packs, 39701 web bookmarks). Draft allocation stands.', ok: true },
  { claim: 'd = widx: + sha256(normalized u)[0:32]', evidence: 'Byte-identical in 0xSearchstr, UNCAGED-ENGINE, Crwalstr and the UNCAGED relay. Verified against independently computed SHA-256 vectors (§13).', ok: true },
  { claim: 'x = sha256(title + "\\n" + description)', evidence: 'Same formula in all four implementations; relay verifies it at ingestion and rejects mismatches.', ok: true },
  { claim: 'Tracking-parameter list (14 params)', evidence: 'Identical sets in client, crawler and relay implementations.', ok: true },
  { claim: 'NIP-50 extension usage is spec-compliant', evidence: 'NIP-50 explicitly allows key:value extensions and requires relays to ignore unsupported ones — operator queries are safe to send anywhere.', ok: true },
  { claim: 'Single-letter tags are relay-filterable', evidence: 'd, u, t, l, x, v are all single-letter → #tag filters work on every stock NIP-01 relay. Baseline queries need nothing custom.', ok: true },
  { claim: 'NIP-11 custom field is legal', evidence: 'The relay information document permits implementation-specific fields; uncaged_index advertises scope, languages and supported operators.', ok: true },
  { claim: 'NIP-77 federation claim', evidence: 'NEG-OPEN takes a filter; syncing {"kinds":[39697]} between relays is valid negentropy usage.', ok: true },
  { claim: 'Addressable replace semantics', evidence: 'A recrawl replacing the indexer’s previous observation matches NIP-01 addressable-event behavior exactly.', ok: true },
];

export const AUDIT_FINDINGS: Finding[] = [
  {
    id: 'F1',
    severity: 'bug',
    area: 'Spec examples',
    title: 'The v1 example events fail their own validation',
    detail:
      'The draft spec’s §5/§17 examples used placeholder hashes: d = widx:9f86d081… is sha256("test"), and x = e3b0c442… is the SHA-256 of the empty string. Neither matches the example’s u tag or content, so the UNCAGED relay would reject the spec’s own example event at ingestion.',
    resolution: 'Fixed in v1.1: every example and the new §13 test-vector tables use real, independently computed SHA-256 values. All examples are now self-consistent.',
  },
  {
    id: 'F2',
    severity: 'bug',
    area: 'Spec completeness',
    title: 'Extension tags implemented by the relay but missing from the spec',
    detail:
      'The relay validates and indexes type / platform / category / network / country / mime and cites “SIP-01 §7”, but the v1 spec’s §7 never defined them. Spec drift: the ecosystem’s modular surface existed only in relay code.',
    resolution: 'Fixed in v1.1: new §9 Extension Tag Registry formally registers the six tags, defines value shapes, and documents how new tags and hashes get added.',
  },
  {
    id: 'F3',
    severity: 'warning',
    area: 'Publisher hardening',
    title: 'Browser builders never enforced the 2048-char URL cap',
    detail:
      'webIndex.ts declares MAX_URL_LEN = 2048 but never applies it; the relay rejects over-long u tags at ingestion. A browser publisher could mint events the index relay then refuses.',
    resolution: 'v1.1 states the cap as a hard §5 limit. Publishers should enforce at build time; this site’s validator flags it.',
  },
  {
    id: 'F4',
    severity: 'warning',
    area: 'NIP review readiness',
    title: 'x-tag semantics differ from NIP-94',
    detail:
      'NIP-94’s x is the SHA-256 of a file binary; SIP-01’s x hashes title + "\\n" + description (a metadata-agreement signal). Same letter, different meaning — reviewers will ask.',
    resolution: 'Documented as a conscious deviation in v1.1 §12.1: the indexed object is a web page observation, not a file, and the agreement signal is what search nodes need. The letter keeps the tag relay-filterable.',
  },
  {
    id: 'F5',
    severity: 'warning',
    area: 'NIP review readiness',
    title: 'Required alt tag vs. NIP-31’s “unrecommended” status',
    detail:
      'NIP-31 is now marked unrecommended in the NIPs repo, yet SIP-01 requires exactly one alt tag (relay rejects without it).',
    resolution: 'Documented in v1.1 §12.3: alt is kept as the common convention (kind-1-centric clients, relay monitors and moderation tools get one human-readable line), framed as convention rather than NIP-31 dependency. Presentation-only; never parsed.',
  },
  {
    id: 'F6',
    severity: 'note',
    area: 'Naming',
    title: 'published vs. NIP-23’s published_at',
    detail: 'NIP-23 long-form uses published_at; SIP-01 uses published. Both are multi-letter and thus not relay-indexed, so filterability is unaffected.',
    resolution: 'Documented in v1.1 §12.2; the relay maps it to a published_at index field internally.',
  },
  {
    id: 'F7',
    severity: 'note',
    area: 'Cross-references',
    title: 'Relay code cites a nonexistent “NIP-SR4”',
    detail: 'web-document.ts references “NIP-SR4” for relay-computed ranking signals; no such document exists in any repo.',
    resolution: 'v1.1 §1 states explicitly that relay-computed scores are local signals, never part of the document format. The stale reference should be dropped or a real SR4 doc written.',
  },
  {
    id: 'F8',
    severity: 'note',
    area: 'Cap alignment',
    title: 'Minor cap mismatches between publishers and relay',
    detail: 'Browsers slice source to 40 chars (relay allows 100) and image to 2048 (relay checks scheme only). l validation is shape-only (/^[a-z]{2}$/), not the ISO code list. Topic shape (≤100 chars) was relay-only knowledge.',
    resolution: 'v1.1 unifies on: source ≤ 100, image ≤ 2048, topic shape ^[a-z0-9][a-z0-9-]{0,99}$, alt ≤ 1000 — all stated in §5/§6.',
  },
  {
    id: 'F9',
    severity: 'note',
    area: 'Query layer',
    title: 'COUNT distinct:author is a relay extension, not NIP-45',
    detail: 'The relay profile approximates independent-indexer counts via COUNT with distinct:author — a UNCAGED extension beyond base NIP-45.',
    resolution: 'Fine as an acceleration; v1.1 keeps the portable path (fetch #d observations, count distinct pubkeys client-side) as the baseline.',
  },
];

/* ------------------------------------------------------------------ */
/* Explorer relays                                                     */
/* ------------------------------------------------------------------ */

/** NIP-50-capable relays used by the ecosystem's engines. */
export const SEARCH_RELAYS = [
  'wss://relay.nostr.band/',
  'wss://relay.ditto.pub/',
  'wss://search.nos.today/',
  'wss://relay.noswhere.com/',
];
