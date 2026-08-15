import { Layout } from '@/components/Layout';
import { C, Callout, CodeBlock, DocSection, Pill, SpecTable } from '@/components/doc';
import { BASELINE_FILTERS, SEARCH_OPERATORS } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';

const NIP11_BLOCK = `{
  "uncaged_index": {
    "sip01": true,
    "nip50": true,
    "nip77": true,
    "document_kinds": [39697],
    "scope": "global",              // or "eu", "crypto", "github", "tor"…
    "domains": ["*"],               // operator-configured allowlist
    "languages": ["en", "de"],      // omitted when unrestricted
    "document_types": ["page", "repository"],
    "filters": ["site", "domain", "url", "inurl", "title", "topic",
                "type", "platform", "category", "network", "country",
                "mime", "filetype", "source", "lang", "before", "after",
                "distinct:domain"]
  }
}`;

export default function QueryPage() {
  useSeoMeta({
    title: 'SIP-01 Query Reference — NIP-01 filters, NIP-50 operators, NIP-11, NIP-77',
    description: 'How clients tap into the SIP-01 search index: baseline NIP-01 filters on single-letter tags, NIP-50 web-search operators, capability advertisement, and negentropy federation.',
  });

  return (
    <Layout>
      <div className="container max-w-5xl py-12 md:py-16">
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">read path</Pill>
            <Pill tone="opt">spec §15</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Query Reference</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Two layers, one guarantee: <strong className="text-foreground">plain NIP-01 filters work on every
            relay</strong>, and NIP-50 operators accelerate on SIP-01-aware relays. Queries with unknown
            operators are always safe — NIP-50 directs relays to ignore extensions they don’t support
            (SHOULD), and SIP-01 defines only what its operators <em>mean</em>, never a new query mechanism.
          </p>
        </header>

        <div className="space-y-14">
          <DocSection id="baseline" number="1" title="Baseline — works on every NIP-01 relay">
            <p>
              Every filterable field is a single-letter tag, so stock relays can slice the index with ordinary
              filters. Merge across 2+ relays by event id, then group by <C>d</C>.
            </p>
            <SpecTable
              head={['Filter', 'What it returns']}
              rows={BASELINE_FILTERS.map((f) => [
                <code key="f" className="font-mono text-xs whitespace-nowrap">{f.filter}</code>,
                f.note,
              ])}
            />
            <CodeBlock
              title="all independent observations of one url"
              code={`["REQ", "obs", { "kinds": [39697], "#d": ["widx:3641c5f2274c5471278ab5bf1df6d185"] }]

# distinct pubkey count in the result set = independent indexer count`}
            />
            <Callout kind="info" title="Cheap counts — NIP-45 (optional)">
              Where a relay supports NIP-45, <C>["COUNT", "obs", {'{ "kinds": [39697], "#d": ["widx:…"] }'}]</C>{' '}
              returns <C>{'{ "count": … }'}</C> without transferring events. Handy for dashboards — but the
              portable baseline stays fetch-and-count: distinct <C>pubkey</C>s per <C>d</C> is a number no
              plain COUNT can give you anyway (the UNCAGED relay’s <C>distinct:author</C> is a relay extension
              beyond base NIP-45, not part of the protocol).
            </Callout>
          </DocSection>

          <DocSection id="nip50" number="2" title="Acceleration — NIP-50 web-search operators">
            <p>
              SIP-01-aware relays (e.g. the UNCAGED Index Relay) map these operators onto dedicated index fields.
              Each operator has a negated <C>-op:</C> form, and all combine freely with free text (which matches
              title + description + URL tokens).
            </p>
            <SpecTable
              head={['Operator', 'Index field', 'Behavior', 'Example']}
              rows={SEARCH_OPERATORS.map((op) => [
                <code key="o" className="font-mono text-xs font-semibold text-primary whitespace-nowrap">{op.op}</code>,
                <code key="f" className="font-mono text-xs text-muted-foreground">{op.field}</code>,
                op.description,
                <code key="e" className="font-mono text-xs whitespace-nowrap">{op.example}</code>,
              ])}
            />
            <CodeBlock
              title="combined query"
              code={`["REQ", "search", {
  "kinds": [39697],
  "search": "bitcoin privacy site:github.com lang:en after:2026-01-01",
  "limit": 50
}]`}
            />
            <Callout kind="info" title="since/until vs. before:/after:">
              Native <C>since</C>/<C>until</C> filter on <strong>observation time</strong> (the event’s{' '}
              <C>created_at</C>). The <C>before:</C>/<C>after:</C> operators range over the page’s{' '}
              <strong>claimed publication time</strong> (the <C>published</C> tag). Two clocks, both queryable.
            </Callout>
            <Callout kind="warn" title="Operator semantics are per-relay — check NIP-11 first">
              These meanings hold on <strong>SIP-01-aware relays</strong> (advertised via{' '}
              <C>supported_nips</C> + the <C>uncaged_index</C> block below). One name collides upstream: NIP-50’s
              own registered <C>domain:</C> extension filters by the author’s NIP-05 domain, while SIP-01’s{' '}
              <C>domain:</C> matches the document’s URL host. On a relay of unknown nature, prefer{' '}
              <C>site:</C> — it has no upstream collision.
            </Callout>
          </DocSection>

          <DocSection id="nip11" number="3" title="Capability discovery — NIP-11">
            <p>
              SIP-01-aware relays advertise what they index in the relay information document, so engines can
              route queries: a crypto-scoped relay gets crypto queries, a tor relay gets onion queries, and a
              global relay gets everything.
            </p>
            <CodeBlock code={NIP11_BLOCK} title="relay information document (excerpt)" />
            <p className="text-muted-foreground text-sm">
              <C>scope</C>, <C>domains</C>, <C>languages</C>, and <C>document_types</C> are operator-configured —
              this is how specialized index relays declare themselves.
            </p>
          </DocSection>

          <DocSection id="federation" number="4" title="Federation — NIP-77 negentropy">
            <p>
              Two relays reconcile their SIP-01 indexes with a single negentropy session over the kind filter.
              No central master: any relay can ingest from crawlers, replicate from peers, and serve search.
            </p>
            <CodeBlock
              title="relay-to-relay sync"
              code={`["NEG-OPEN", "sync", { "kinds": [39697] }, <initial negentropy hex>]`}
            />
            <Callout kind="ok" title="The network survives any single relay disappearing">
              Observations are ordinary Nostr events — signed, replicable, and stored by anyone. If the biggest
              index relay vanishes tomorrow, the index lives on everywhere else.
            </Callout>
          </DocSection>

          <DocSection id="client-recipe" number="5" title="Client recipe — tap into the index">
            <ol className="list-decimal pl-6 space-y-2">
              <li>Pick 2+ relays. Prefer ones advertising <C>uncaged_index</C> in their NIP-11 document.</li>
              <li>Subscribe with <C>{'{ "kinds": [39697], … }'}</C> — baseline tags first, <C>search</C> when advertised.</li>
              <li>Validate each event (<C>d</C> ↔ <C>u</C>, <C>v</C>, optional <C>x</C>) — drop invalid. The <a href="/explorer" className="text-primary hover:underline">explorer</a> ships a validator you can lift.</li>
              <li>Group by <C>d</C>. Distinct <C>pubkey</C> count = independent observations — your first ranking signal.</li>
              <li>Rank and filter locally. That part is yours; the protocol deliberately says nothing about it.</li>
            </ol>
            <CodeBlock
              title="minimal ts client (nostrify)"
              code={`const events = await nostr.query([
  { kinds: [39697], '#t': ['nostr'], limit: 50 },
]);

// group by d → count independent indexers
const byDoc = Map.groupBy(events, (e) => e.tags.find(([n]) => n === 'd')?.[1]);
for (const [d, group] of byDoc) {
  const indexers = new Set(group.map((e) => e.pubkey));
  console.log(d, 'seen by', indexers.size, 'independent indexers');
}`}
            />
          </DocSection>
        </div>
      </div>
    </Layout>
  );
}
