import { useState } from 'react';
import { Check, Copy, Download, ListTree } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { C, Callout, CodeBlock, DocSection, Pill, SpecTable } from '@/components/doc';
import { CORE_TAGS, D_VECTORS, EXTENSION_TAGS, NIP_DEPENDENCIES, SIP01, X_VECTORS } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';

const TOC = [
  { id: 'abstract', n: '', label: 'Abstract' },
  { id: 'scope', n: '1', label: 'Scope' },
  { id: 'event-kind', n: '2', label: 'Event kind' },
  { id: 'identity', n: '3', label: 'Document identity' },
  { id: 'structure', n: '4', label: 'Event structure' },
  { id: 'required', n: '5', label: 'Required fields' },
  { id: 'optional', n: '6', label: 'Optional fields' },
  { id: 'normalization', n: '7', label: 'URL normalization' },
  { id: 'content-identity', n: '8', label: 'Content identity (x)' },
  { id: 'extensions', n: '9', label: 'Extension tag registry' },
  { id: 'versioning', n: '10', label: 'Versioning' },
  { id: 'security', n: '11', label: 'Security & URL allowlist' },
  { id: 'deviations', n: '12', label: 'Deviations & reviewer notes' },
  { id: 'test-vectors', n: '13', label: 'Test vectors' },
  { id: 'indexer-identity', n: '14', label: 'Indexer identity' },
  { id: 'relay-usage', n: '15', label: 'Relay usage & querying' },
  { id: 'privacy', n: '16', label: 'Privacy' },
  { id: 'compatibility', n: '17', label: 'Compatibility & migration' },
  { id: 'search-nodes', n: '18', label: 'Search node behavior' },
  { id: 'examples', n: '19', label: 'Examples' },
  { id: 'references', n: '20', label: 'NIP dependencies & references' },
];

const FULL_EVENT = `{
  "kind": 39697,
  "pubkey": "<indexer pubkey, hex>",
  "created_at": 1786250000,
  "content": "{\\"title\\":\\"Example Page\\",\\"description\\":\\"A page about examples.\\",\\"image\\":\\"https://example.com/og.jpg\\"}",
  "tags": [
    ["d", "widx:3641c5f2274c5471278ab5bf1df6d185"],
    ["u", "https://example.com/page"],
    ["t", "nostr"],
    ["t", "privacy"],
    ["l", "en"],
    ["x", "2a5cbdf44513f552fb571d6c6de2ddf16c5452b235cc887980b52898fb38e7c1"],
    ["v", "1"],
    ["published", "1786200000"],
    ["source", "crawlstr/1"],
    ["alt", "Web index observation: Example Page"]
  ],
  "sig": "..."
}`;

const MINIMAL_EVENT = `{
  "kind": 39697,
  "content": "{\\"title\\":\\"Example\\"}",
  "tags": [
    ["d", "widx:0f115db062b7c0dd030b16878c99dea5"],
    ["u", "https://example.com/"],
    ["v", "1"],
    ["alt", "Web index observation: Example"]
  ]
}`;

const EXTENDED_EVENT = `{
  "kind": 39697,
  "content": "{\\"title\\":\\"Crwalstr — a browser-based web crawler for Nostr\\",\\"description\\":\\"A browser-based web crawler that publishes SIP-01 web index observations.\\"}",
  "tags": [
    ["d", "widx:cdfd4df8c01d609fc9cdf943afa80197"],
    ["u", "https://github.com/NostrDanish/Crwalstr"],
    ["t", "nostr"],
    ["t", "crawler"],
    ["t", "search"],
    ["l", "en"],
    ["x", "babd08c579e107b98a360a7f713d5d822bbd9f24087b86d98404db214f0e5500"],
    ["v", "1"],
    ["type", "repository"],
    ["platform", "github"],
    ["network", "clearnet"],
    ["source", "crawlstr/1"],
    ["alt", "Web index observation: Crwalstr — a browser-based web crawler for Nostr"]
  ]
}`;

const NIP11_BLOCK = `{
  "uncaged_index": {
    "sip01": true,
    "nip50": true,
    "nip77": true,
    "document_kinds": [39697],
    "scope": "global",
    "domains": ["*"],
    "languages": ["en", "de"],
    "document_types": ["page", "repository"],
    "filters": ["site", "domain", "url", "inurl", "title", "topic",
                "type", "platform", "category", "network", "country",
                "mime", "filetype", "source", "lang", "before", "after",
                "distinct:domain"]
  }
}`;

export default function SpecPage() {
  useSeoMeta({
    title: `SIP-01 Specification v${SIP01.version} — Search Index Protocol`,
    description: 'The complete SIP-01 specification: kind 39697 Web Index Observations, URL normalization, content identity, the extension tag registry, and test vectors.',
  });

  const [copied, setCopied] = useState(false);
  const copySpec = async () => {
    try {
      const res = await fetch('/spec/SIP-01.md');
      await navigator.clipboard.writeText(await res.text());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  return (
    <Layout>
      <div className="container max-w-6xl py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
                <ListTree className="size-3.5" /> Contents
              </div>
              <nav className="flex flex-col gap-0.5 border-l border-border" aria-label="Specification sections">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-[13px] text-muted-foreground hover:text-primary px-3 py-1 -ml-px border-l-2 border-transparent hover:border-primary transition-colors"
                  >
                    {item.n && <span className="font-mono text-primary/70 mr-1.5">{item.n}</span>}
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl">
            {/* Header */}
            <header className="mb-14">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Pill tone="gold">draft</Pill>
                <Pill tone="opt">optional</Pill>
                <Pill tone="opt">kind: 39697</Pill>
                <Pill tone="opt">v{SIP01.version}</Pill>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                SIP-01 <span className="text-muted-foreground font-normal">—</span>{' '}
                <span className="text-primary">Search Index Protocol</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Web Index Observations on Nostr. {SIP01.tagline}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href="/spec/SIP-01.md"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Download className="size-4" /> Raw markdown
                </a>
                <button
                  onClick={copySpec}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy for GitHub'}
                </button>
              </div>
            </header>

            <div className="space-y-14">
              <DocSection id="abstract" title="Abstract">
                <p>
                  SIP-01 defines a stable, interoperable Nostr representation of an <strong>indexed web
                  document</strong> — a signed observation, by an indexer, of a URL and its lightweight public
                  metadata. Any crawler can publish observations, any relay can store and replicate them, any
                  search node can consume them into a local index, and any search engine can rank and filter them
                  however it wants — without depending on Google, Bing, a single company, one crawler, one relay,
                  one search engine, or one signing key.
                </p>
                <Callout kind="info" title="An event answers exactly one question">
                  “Indexer <C>pubkey</C> observed this web document at this time, and here is its lightweight
                  metadata.”
                </Callout>
              </DocSection>

              <DocSection id="scope" number="1" title="Scope">
                <p>
                  The protocol describes <strong>what an indexed web document looks like on Nostr</strong> —
                  nothing else. It does <strong>not</strong> define:
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>ranking algorithms (that belongs to search engines);</li>
                  <li>moderation/filtering policy (that belongs to search nodes/engines);</li>
                  <li>application branding or per-app features;</li>
                  <li>user identity or reputation (optional higher layers);</li>
                  <li>NIP-50 search syntax (a <em>query mechanism</em>, not a document format);</li>
                  <li>
                    relay-internal scoring (crawl/authority/quality/spam scores). Such signals are computed
                    locally by relays and engines and are <strong>never</strong> published as part of this
                    document format.
                  </li>
                </ul>
              </DocSection>

              <DocSection id="event-kind" number="2" title="Event kind">
                <SpecTable
                  head={['Property', 'Value']}
                  rows={[
                    [<C key="k">Kind</C>, <strong key="v" className="font-mono text-primary">39697</strong>],
                    [<C key="k">Name</C>, 'Web Index Observation'],
                    [<C key="k">Range</C>, 'Addressable (30000–39999, NIP-01 kind-range conventions; formerly NIP-33)'],
                    [<C key="k">Registry status</C>, 'Unused by any registered NIP at time of writing (draft allocation, re-verified in v1.2)'],
                  ]}
                />
                <p>Addressability is deliberate:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>
                    A crawler re-observing a page <strong>updates</strong> its previous observation instead of
                    spamming a new immutable event per crawl — relay storage stays bounded: one live slot per{' '}
                    <C>(pubkey, d)</C>.
                  </li>
                  <li>
                    <strong>Multiple independent indexers</strong> observing the same URL produce multiple events
                    with the <strong>same <C>d</C> tag and different pubkeys</strong> — the core of the “N
                    independent indexers saw this page” model. Consumers group by <C>d</C> and count distinct
                    authors.
                  </li>
                  <li>
                    Trade-off: no built-in observation history. Search nodes that want history archive every
                    version they see; relays MAY preserve superseded versions.
                  </li>
                </ul>
                <Callout kind="info" title="Why not NIP-78 (kind 30078)">
                  NIP-78 is explicitly for applications “that do not care about interoperability” — the opposite
                  of a shared index. Kind 30078 remains fine for genuinely app-specific data, but it is not a
                  shared document protocol.
                </Callout>
              </DocSection>

              <DocSection id="identity" number="3" title="Document identity">
                <p>Three distinct identities, kept separate on purpose:</p>
                <SpecTable
                  head={['Identity', 'Field', 'Meaning']}
                  rows={[
                    ['URL identity', <C key="f">d</C>, 'Stable slot for the normalized URL (§7). All indexers observing the same normalized URL produce the same d.'],
                    ['Canonical URL', <C key="f">u</C>, 'The page’s preferred URL after canonical/redirect resolution. Defaults to the normalized URL when unknown.'],
                    ['Content identity', <C key="f">x</C>, 'Hash of the observed metadata (§8). Changes when the page meaningfully changes.'],
                    ['Observation', 'the event', 'One indexer’s signed view at created_at.'],
                  ]}
                />
                <CodeBlock title="url identity" code={`d = "widx:" + sha256_utf8(normalized_url) hex, truncated to 32 chars`} />
                <p>
                  The <C>widx:</C> namespace prefix prevents collisions with other addressable schemas a reader
                  might encounter.
                </p>
              </DocSection>

              <DocSection id="structure" number="4" title="Event structure">
                <CodeBlock code={FULL_EVENT} title="kind 39697 · full observation" />
                <Callout kind="ok" title="Every hash is real">
                  The example above is fully self-consistent: its <C>d</C> matches its <C>u</C>, and its{' '}
                  <C>x</C> matches its <C>content</C>. Verify against §13 — or paste the URL into the{' '}
                  <a href="/explorer" className="text-primary hover:underline">explorer’s calculator</a>.
                </Callout>
              </DocSection>

              <DocSection id="required" number="5" title="Required fields">
                <SpecTable
                  head={['Field', 'Where', 'Rule']}
                  rows={[
                    [<C key="t">d</C>, 'tag', 'Exactly one. widx: + 32 lowercase hex chars. MUST equal the SHA-256-derived id of the u tag’s normalized form (§7). Readers SHOULD verify.'],
                    [<C key="t">u</C>, 'tag', 'Exactly one. The canonical URL. MUST be a valid http(s) URL, ≤ 2048 chars, and pass the URL allowlist (§11).'],
                    [<C key="t">title</C>, 'content JSON', 'String, 1–300 chars after trim.'],
                    [<C key="t">v</C>, 'tag', 'Exactly one. Schema version. This document defines "1".'],
                    [<C key="t">alt</C>, 'tag', 'Exactly one. Human-readable summary, non-empty, ≤ 1000 chars. See §12.3 for rationale.'],
                  ]}
                />
              </DocSection>

              <DocSection id="optional" number="6" title="Optional fields">
                <SpecTable
                  head={['Field', 'Where', 'Meaning']}
                  rows={CORE_TAGS.filter((t) => t.requirement === 'optional').map((t) => [
                    <C key="t">{t.tag}</C>,
                    t.location === 'content' ? 'content JSON' : 'tag',
                    `${t.description} — ${t.shape}`,
                  ])}
                />
                <Callout kind="info">
                  Optional fields MUST NOT be required to interpret the event. A consumer that only understands{' '}
                  <C>d</C>, <C>u</C>, <C>title</C>, <C>v</C> has a working index entry.
                </Callout>
              </DocSection>

              <DocSection id="normalization" number="7" title="URL normalization">
                <p>Before hashing into <C>d</C>, URLs MUST be normalized:</p>
                <ol className="list-decimal pl-6 space-y-1.5">
                  <li>Parse; reject anything not <C>http://</C> or <C>https://</C>.</li>
                  <li>Lowercase scheme and host; strip a leading <C>www.</C> from the host.</li>
                  <li>Remove default ports (<C>:80</C> http, <C>:443</C> https).</li>
                  <li>Remove the fragment (<C>#…</C>) entirely.</li>
                  <li>
                    Remove known tracking parameters: <C>utm_source</C>, <C>utm_medium</C>, <C>utm_campaign</C>,{' '}
                    <C>utm_term</C>, <C>utm_content</C>, <C>fbclid</C>, <C>gclid</C>, <C>dclid</C>, <C>mc_cid</C>,{' '}
                    <C>mc_eid</C>, <C>igshid</C>, <C>ref_src</C>, <C>spm</C>, <C>si</C>.{' '}
                    <strong>All other query parameters are preserved</strong> — many are semantically required (
                    <C>?id=</C>, <C>?page=</C>, <C>?q=</C>).
                  </li>
                  <li>Sort remaining query parameters alphabetically by key (stable for duplicate keys).</li>
                  <li>Remove a trailing <C>/</C> from the path (except the bare root <C>/</C>).</li>
                  <li>Re-encode: <C>URL.toString()</C> after the above (WHATWG URL semantics).</li>
                </ol>
                <Callout kind="warn" title="Byte-compatibility is the whole game">
                  Implementations MUST produce byte-identical <C>d</C> tags for the same page or deduplication
                  breaks. The reference implementation is <C>normalizeIndexUrl()</C> in{' '}
                  <C>src/lib/webIndex.ts</C> (0xSearchstr / UNCAGED-ENGINE), mirrored byte-compatibly by Crwalstr
                  and the UNCAGED Index Relay, and covered by tests. This site ships the same algorithm in{' '}
                  <C>src/lib/sip01-utils.ts</C>.
                </Callout>
              </DocSection>

              <DocSection id="content-identity" number="8" title="Content identity (x tag)">
                <p><C>x</C> = lowercase hex SHA-256 of the UTF-8 string:</p>
                <CodeBlock title="content identity input" code={`title + "\\n" + description`} />
                <p>
                  of the <strong>observed</strong> metadata (before any consumer-side truncation), with an absent{' '}
                  <C>description</C> treated as the empty string. It is a cheap agreement signal: two indexers
                  with the same <C>d</C> and same <C>x</C> observed the same content; same <C>d</C> different{' '}
                  <C>x</C> means the page changed or indexers disagree — both useful to search nodes. It is
                  deliberately <strong>not</strong> a hash of the full HTML; crawlers may add a full-content hash
                  as an extension tag (§9).
                </p>
              </DocSection>

              <DocSection id="extensions" number="9" title="Extension tag registry">
                <p>
                  SIP-01 is <strong>modular</strong>: the core schema is fixed, but engines and crawlers need
                  domain-specific facets (repositories, media types, networks, …) without forking the protocol.
                  Extensions are additional <strong>optional tags</strong> registered here.
                </p>
                <h3 className="text-lg font-semibold pt-2">9.1 Rules for all extensions</h3>
                <ol className="list-decimal pl-6 space-y-1.5">
                  <li>Extensions MUST be optional. A consumer that ignores every extension still has a fully working index entry.</li>
                  <li>Extensions MUST NOT change the meaning of core fields. Publishers MUST NOT change the meaning of an existing field without bumping <C>v</C> (§10).</li>
                  <li>Consumers and relays MUST ignore unknown tags (forwards compatibility).</li>
                  <li>
                    <strong>Single-letter tag names are reserved for relay-filterable fields</strong> — NIP-01
                    relays index only single-letter tags. Multi-letter extensions are engine-level facets:
                    usable on SIP-01-aware relays via NIP-50 operators, not via <C>#tag</C> filters on stock relays.
                  </li>
                  <li>Extension values SHOULD be keyword-shaped (<C>^[a-zA-Z0-9][a-zA-Z0-9_-]{'{'}0,49{'}'}$</C>) unless the registry entry says otherwise.</li>
                  <li>
                    Extensions are registered by adding a row to §9.2 via specification update. Before
                    registration, experimental extensions SHOULD use the <C>x-</C> name prefix.
                  </li>
                </ol>
                <h3 className="text-lg font-semibold pt-2">9.2 Registered extensions (v1)</h3>
                <SpecTable
                  head={['Tag', 'Shape', 'Case', 'Meaning']}
                  rows={EXTENSION_TAGS.map((t) => [
                    <C key="t">{t.tag}</C>,
                    <span key="s" className="font-mono text-xs">{t.shape.split(',')[0]}</span>,
                    t.tag === 'country' ? 'upper (ISO 3166-1)' : 'lower',
                    t.description,
                  ])}
                />
                <h3 className="text-lg font-semibold pt-2">9.3 Hash extensions</h3>
                <p>
                  <C>x</C> (core) hashes the <em>metadata</em>. Future hash extensions — full-body HTML hash,
                  screenshot hash, simhash for near-duplicate detection — are registered as new tags with their
                  hash algorithm stated explicitly. None are registered yet.
                </p>
                <h3 className="text-lg font-semibold pt-2">9.4 Application-specific data</h3>
                <p>
                  Application-specific signals (a staking signal, a vote, a curated badge) go in{' '}
                  <strong>separate events referencing the observation</strong> (by <C>d</C> tag or event
                  coordinate) — never by changing the meaning of core fields.
                </p>
              </DocSection>

              <DocSection id="versioning" number="10" title="Versioning">
                <p>
                  <C>v</C> versions the <strong>schema</strong>, not any application. <C>v = 1</C> is this
                  document. Consumers MUST ignore events with unknown <C>v</C> (or attempt best-effort parsing of
                  the fields they know). Publishers MUST NOT change the meaning of an existing field without
                  bumping <C>v</C>. Relays MAY reject unknown <C>v</C> at ingestion — a relay cannot index what
                  it cannot interpret.
                </p>
              </DocSection>

              <DocSection id="security" number="11" title="Security & URL allowlist">
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>
                    <C>u</C> MUST be <C>http(s)</C> (<C>https</C> preferred; <C>http</C> tolerated but MAY be
                    ranked lower). <C>image</C> MUST be <C>https:</C>. <C>javascript:</C>, <C>data:</C>,{' '}
                    <C>file:</C>, <C>vbscript:</C> etc. MUST be rejected at parse AND build time.
                  </li>
                  <li>
                    Consumers MUST sanitize all event-sourced strings before DOM use (framework escaping covers
                    text; URLs additionally pass an allowlist sanitizer).
                  </li>
                  <li>Field length caps (§5/§6) are hard limits — drop or truncate overlong input.</li>
                  <li>
                    Server-side crawlers fetching these URLs MUST apply SSRF protections (no
                    RFC-1918/loopback/link-local/cloud-metadata targets, redirect limits).
                  </li>
                  <li>
                    The protocol carries <strong>no search queries</strong>. An observation event reveals a URL +
                    metadata, never who searched for what (§16).
                  </li>
                </ul>
              </DocSection>

              <DocSection id="deviations" number="12" title="Deviations & reviewer notes">
                <p>Decisions that deliberately diverge from existing conventions, stated up front:</p>
                <h3 className="text-lg font-semibold pt-2">12.1 The x tag (vs. NIP-94)</h3>
                <p>
                  NIP-94 defines <C>x</C> as the SHA-256 of a <strong>file’s binary</strong>. SIP-01 reuses the
                  tag letter as a <strong>metadata-agreement hash</strong> (<C>sha256(title + "\n" +
                  description)</C>) because the indexed object is a web page observation, not a file, and the
                  agreement signal — not download integrity — is what search nodes need. The two never collide in
                  practice (kind 39697 carries no NIP-94 payloads), and the letter choice keeps the tag
                  relay-filterable.
                </p>
                <h3 className="text-lg font-semibold pt-2">12.2 The published tag (vs. NIP-23’s published_at)</h3>
                <p>
                  NIP-23 uses <C>published_at</C>. SIP-01 uses <C>published</C> for brevity in a high-volume index
                  record. Multi-letter tags are not relay-indexed either way, so this costs no filterability; the
                  relay profile maps it to a <C>published_at</C> index field.
                </p>
                <h3 className="text-lg font-semibold pt-2">12.3 The alt tag (NIP-31 status)</h3>
                <p>
                  NIP-31 is currently marked <em>unrecommended</em> in the NIPs repository (“unnecessarily
                  bloated”). SIP-01 keeps a <strong>required</strong> <C>alt</C> tag anyway, treating it as the
                  now-common <C>alt</C> <em>convention</em> rather than a NIP-31 dependency: kind 39697 events
                  surface in generic clients, relay monitors, and moderation tools where one line of
                  human-readable context is worth its bytes. Consumers MUST NOT rely on <C>alt</C> for parsing;
                  it is presentation-only.
                </p>
                <h3 className="text-lg font-semibold pt-2">12.4 Relay-side validation</h3>
                <p>
                  Relays implementing SIP-01 ingestion (e.g. the UNCAGED Index Relay) reject invalid observations
                  with an <C>OK false</C> <C>invalid:</C> message — reader guidance (§18) applied at the door. It
                  does not change the event format: other relays remain free to store kind 39697 without
                  validation.
                </p>
                <h3 className="text-lg font-semibold pt-2">12.5 The bare l tag (vs. NIP-32’s label form)</h3>
                <p>
                  Upstream, the <C>l</C> tag is defined by <strong>NIP-32 (Labeling)</strong> as a <em>label</em>{' '}
                  qualified by an <C>L</C> namespace tag — a language self-label would be{' '}
                  <C>["L", "ISO-639-1"]</C> + <C>["l", "en", "ISO-639-1"]</C>, and an unmarked <C>l</C> implies
                  the <C>ugc</C> namespace. SIP-01 instead uses the bare two-element form <C>["l", "en"]</C> as a
                  dedicated document-language field: publishers SHOULD include at most one (consumers read the
                  first), validated as <C>^[a-z]{'{'}2{'}'}$</C>. Language is a first-class, single-valued index
                  field (aware relays map it to a <C>language</C> keyword field and the <C>lang:</C> operator),
                  not an open-ended label, and the
                  bare form keeps high-volume records small. The forms never collide inside kind 39697 because
                  SIP-01 events carry no <C>L</C> tags; a consumer that wants NIP-32 semantics can read the bare{' '}
                  <C>l</C> as a self-reported <C>ISO-639-1</C> label. (Revisions ≤ v1.1 wrongly cited
                  NIP-23/NIP-24 for this convention — neither defines an <C>l</C> tag.)
                </p>
              </DocSection>

              <DocSection id="test-vectors" number="13" title="Test vectors">
                <p>
                  All vectors are reproducible with any SHA-256 implementation. Normalization inputs are
                  processed per §7. Vector 2 exercises the whole pipeline: scheme/host lowercasing,{' '}
                  <C>www.</C> stripping, default-port removal, fragment removal, tracking-parameter removal,
                  query sorting, and trailing-slash removal. Vector 4 shows that <strong>paths stay
                  case-sensitive</strong>.
                </p>
                <h3 className="text-lg font-semibold pt-2">13.1 URL identity (d)</h3>
                <SpecTable
                  head={['Input URL', 'Normalized', 'd tag']}
                  rows={D_VECTORS.map((v) => [
                    <code key="i" className="font-mono text-xs break-all">{v.input}</code>,
                    <code key="n" className="font-mono text-xs break-all">{v.normalized}</code>,
                    <code key="d" className="font-mono text-xs text-primary break-all">{v.d}</code>,
                  ])}
                />
                <h3 className="text-lg font-semibold pt-2">13.2 Content identity (x)</h3>
                <SpecTable
                  head={['title', 'description', 'x tag']}
                  rows={X_VECTORS.map((v) => [
                    <code key="t" className="font-mono text-xs">{v.title}</code>,
                    <code key="d" className="font-mono text-xs">{v.description || '(absent)'}</code>,
                    <code key="x" className="font-mono text-xs text-primary break-all">{v.x}</code>,
                  ])}
                />
              </DocSection>

              <DocSection id="indexer-identity" number="14" title="Indexer identity">
                <p>
                  Every observation is signed by the indexer’s Nostr keypair — the <C>pubkey</C> IS the indexer
                  identity. Requirements:
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Indexer keys are <strong>generated locally, stored locally, never uploaded</strong>.</li>
                  <li>
                    Indexer keys are <strong>separate from any personal Nostr identity</strong>. Automatic
                    indexing never uses the logged-in user’s key.
                  </li>
                  <li>
                    Indexer keys are <strong>replaceable</strong>: regenerating creates a new indexer. Old events
                    remain signed by the old key and keep their history; reputation does not transfer.
                  </li>
                  <li>
                    No single central signing key is authoritative. A server-side crawler or autosigner is just
                    one more independent indexer among the browsers.
                  </li>
                </ul>
              </DocSection>

              <DocSection id="relay-usage" number="15" title="Relay usage & querying">
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Publishers SHOULD publish to 2+ relays. Consumers SHOULD query 2+ and merge by event id, grouping by <C>d</C>.</li>
                  <li>
                    <strong>Baseline (every NIP-01 relay):</strong> plain filters on indexed single-letter tags —{' '}
                    <C>#d</C>, <C>#t</C>, <C>#u</C>, <C>#x</C> — plus <C>authors</C>, <C>since/until</C>{' '}
                    (observation time), and <C>limit</C>.
                  </li>
                  <li>
                    <strong>Acceleration (optional):</strong> NIP-50 <C>search</C> on capable relays with
                    web-search operators (<C>site:</C>, <C>domain:</C>, <C>url:</C>, …). NIP-50 explicitly
                    sanctions <C>key:value</C> extensions and directs relays to ignore ones they don’t support
                    (SHOULD), so these queries are safe to send anywhere. Full table:{' '}
                    <a href="/query" className="text-primary hover:underline">query reference</a>.
                  </li>
                  <li>
                    <strong>Counting (optional):</strong> where relays support NIP-45, <C>["COUNT", …]</C>{' '}
                    yields cheap observation counts (e.g. per <C>#d</C>). The portable baseline remains fetching
                    the <C>#d</C> group and counting distinct pubkeys client-side (§18). Relay-specific
                    extensions (e.g. distinct-author counting) are relay-profile features, not part of this
                    document format.
                  </li>
                  <li>
                    <strong>Federation:</strong> NIP-77 negentropy sync works on any filter —{' '}
                    <C>["NEG-OPEN", "sync", {'{"kinds": [39697]}'}, &lt;hex&gt;]</C>. No relay is the permanent
                    global index.
                  </li>
                </ul>
                <Callout kind="warn" title="NIP-50 precision notes">
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                      Operator support is per-relay. SIP-01 does <strong>not</strong> claim its operators are
                      universally supported by all NIP-50 relays — clients SHOULD check <C>supported_nips</C>{' '}
                      for <C>50</C> and the <C>uncaged_index</C> block below before relying on SIP-01 operator
                      semantics.
                    </li>
                    <li>
                      <C>domain:</C> collides with NIP-50’s own registered extension (events whose{' '}
                      <em>author</em> has a NIP-05 identifier at the domain). SIP-01-aware relays give it
                      document-URL semantics (exact host match); a generic NIP-50 relay may interpret it per
                      NIP-05. When the relay’s nature is unknown, prefer <C>site:</C> — it has no upstream
                      collision.
                    </li>
                  </ul>
                </Callout>
                <p>SIP-01-aware relays SHOULD advertise their scope in the NIP-11 relay information document:</p>
                <CodeBlock code={NIP11_BLOCK} title="nip-11 · capability advertisement" />
              </DocSection>

              <DocSection id="privacy" number="16" title="Privacy">
                <ul className="list-disc pl-6 space-y-1.5">
                  <li><strong>Searching needs no login, no key, no profile.</strong> Reads are unauthenticated.</li>
                  <li>
                    <strong>Auto-indexing publishes document observations, never queries.</strong> The event
                    contains a URL and its public metadata — nothing about the user whose search surfaced it.
                  </li>
                  <li>
                    The auto-indexing identity is pseudonymous: it is not cryptographically tied to the user’s
                    personal Nostr identity. Network observers may still correlate IP/timing; the protocol
                    guarantees key separation, not network anonymity.
                  </li>
                </ul>
              </DocSection>

              <DocSection id="compatibility" number="17" title="Compatibility & migration">
                <p>
                  Kind 39697 is the canonical document index. Earlier app-specific query caches (e.g. kind 30078{' '}
                  <C>d:"0xsearchstr:cache:*"</C>, written by historical 0xSearchstr deployments) are frozen legacy
                  data: consumers MAY merge them in by normalized URL, but new document indexing MUST use kind
                  39697. There is no flag day — old data keeps working, new data uses this protocol.
                </p>
              </DocSection>

              <DocSection id="search-nodes" number="18" title="Search node behavior">
                <p>A search node consuming this protocol SHOULD:</p>
                <ol className="list-decimal pl-6 space-y-1.5">
                  <li>Subscribe to kind 39697 across several relays.</li>
                  <li>
                    Verify <C>d</C> ↔ normalized <C>u</C> consistency and <C>v</C> support; drop invalid. When{' '}
                    <C>x</C> is present, verify it against the content.
                  </li>
                  <li>Group by <C>d</C>: distinct <C>pubkey</C> count = independent observations.</li>
                  <li>Store locally (inverted index), rank locally, filter locally.</li>
                  <li>Use <C>x</C> and <C>created_at</C> for freshness/agreement signals.</li>
                  <li>Never treat any single indexer, relay, or engine as authoritative.</li>
                </ol>
              </DocSection>

              <DocSection id="examples" number="19" title="Examples">
                <p>Minimal valid event (only required fields; every value real):</p>
                <CodeBlock code={MINIMAL_EVENT} title="minimal · self-consistent" />
                <p>
                  An event with extension tags (§9) — also fully self-consistent: <C>d</C> is §13.1 vector 4 and{' '}
                  <C>x</C> is the real <C>sha256(title + "\n" + description)</C> of its content.
                </p>
                <CodeBlock code={EXTENDED_EVENT} title="with extensions · self-consistent" />
              </DocSection>

              <DocSection id="references" number="20" title="NIP dependencies & references">
                <p>
                  SIP-01 is deliberately the smallest possible new piece: where an existing NIP already provides
                  a primitive, SIP-01 reuses it rather than defining a competing mechanism. Following the NIPs
                  repository’s own guidance — <em>the NIP list is not a checklist; each application implements
                  the subset relevant to its use case</em> — this table states exactly what SIP-01 takes from
                  each referenced NIP, whether the reference is normative, and what happens when an
                  implementation doesn’t support it. Statuses were re-verified against the upstream{' '}
                  <a href="https://github.com/nostr-protocol/nips" target="_blank" rel="noreferrer" className="text-primary hover:underline">nostr-protocol/nips</a>{' '}
                  repository for v1.2 — never assume an older citation is still accurate without checking
                  upstream.
                </p>
                <h3 className="text-lg font-semibold pt-2">20.1 Dependency table</h3>
                <SpecTable
                  head={['NIP', 'What SIP-01 uses', 'Type', 'Requirement', 'If unsupported']}
                  rows={NIP_DEPENDENCIES.map((d) => [
                    <a key="n" href={d.url} target="_blank" rel="noreferrer" className="font-mono text-xs font-semibold text-primary hover:underline whitespace-nowrap">{d.nip}</a>,
                    <span key="u" className="text-xs leading-relaxed">{d.uses}</span>,
                    <span key="t" className="font-mono text-xs text-muted-foreground whitespace-nowrap">{d.type}</span>,
                    d.requirement === 'required'
                      ? <Pill key="r" tone="req">required · {d.qualifier}</Pill>
                      : d.requirement === 'optional'
                        ? <Pill key="r" tone="opt">optional · {d.qualifier}</Pill>
                        : <Pill key="r" tone="opt">none · {d.qualifier}</Pill>,
                    <span key="i" className="text-xs leading-relaxed text-muted-foreground">{d.unsupported}</span>,
                  ])}
                />
                <Callout kind="info" title="NIP-01 is the only hard dependency">
                  This table is not a requirement that every implementation support every listed NIP — it exists
                  to make the protocol boundaries explicit. Everything beyond NIP-01 is optional acceleration,
                  relay-facing metadata, or documentation of where a convention was borrowed from. Don’t add a
                  NIP reference merely because it sounds related: every row above states a concrete, audited
                  relationship.
                </Callout>
                <h3 className="text-lg font-semibold pt-2">20.2 Other references</h3>
                <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
                  <li>
                    Relay profile:{' '}
                    <a className="text-primary hover:underline" href="https://github.com/NostrDanish/UNCAGED-Index-Relay/blob/main/docs/SIP-01.md" target="_blank" rel="noreferrer">
                      UNCAGED-Index-Relay docs/SIP-01.md
                    </a>
                  </li>
                  <li>
                    Reference implementations:{' '}
                    <a className="text-primary hover:underline" href="https://github.com/NostrDanish/0xSearchstr" target="_blank" rel="noreferrer">0xSearchstr</a>,{' '}
                    <a className="text-primary hover:underline" href="https://github.com/NostrDanish/UNCAGED-ENGINE" target="_blank" rel="noreferrer">UNCAGED-ENGINE</a>,{' '}
                    <a className="text-primary hover:underline" href="https://github.com/NostrDanish/Crwalstr" target="_blank" rel="noreferrer">Crwalstr</a>,{' '}
                    <a className="text-primary hover:underline" href="https://github.com/NostrDanish/UNCAGED-Index-Relay" target="_blank" rel="noreferrer">UNCAGED Index Relay</a>
                  </li>
                </ul>
              </DocSection>
            </div>
          </article>
        </div>
      </div>
    </Layout>
  );
}
