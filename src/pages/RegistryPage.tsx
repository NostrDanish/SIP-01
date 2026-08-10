import { GitPullRequest, Hash, Radio, ShieldCheck } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { C, Callout, CodeBlock, DocSection, Pill, SpecTable } from '@/components/doc';
import { CORE_TAGS, EXTENSION_RULES, EXTENSION_TAGS } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';

export default function RegistryPage() {
  useSeoMeta({
    title: 'SIP-01 Tag Registry — core tags, extensions, and how to add new ones',
    description: 'The modular SIP-01 tag registry: core required/optional tags, registered extension tags, hash registry, and the rules for adding new search-engine facets without forking the protocol.',
  });

  return (
    <Layout>
      <div className="container max-w-5xl py-12 md:py-16">
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">modular</Pill>
            <Pill tone="opt">spec §5 / §6 / §9</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Tag Registry</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            SIP-01 stays small on purpose: a fixed core that every implementation understands, and a registry of
            optional extension tags that search engines and crawlers can grow — <strong className="text-foreground">without
            a new kind, without a flag day, without breaking anyone</strong>.
          </p>
        </header>

        <div className="space-y-14">
          <DocSection id="core" number="A" title="Core tags">
            <p>
              The core is frozen except through a <C>v</C> bump. Five required fields are all a consumer needs;
              everything else is additive.
            </p>
            <SpecTable
              head={['Tag', 'Req', 'Relay filter', 'Shape', 'Meaning']}
              rows={CORE_TAGS.map((t) => [
                <span key="t" className="font-mono font-semibold text-primary">{t.tag}</span>,
                t.requirement === 'required' ? <Pill key="r" tone="req">required</Pill> : <Pill key="r" tone="opt">optional</Pill>,
                t.relayIndexed
                  ? <span key="f" className="inline-flex items-center gap-1 text-emerald-500 text-xs font-mono"><Radio className="size-3.5" />#tag</span>
                  : <span key="f" className="text-muted-foreground text-xs font-mono">—</span>,
                <code key="s" className="font-mono text-xs">{t.shape}</code>,
                t.description,
              ])}
            />
            <Callout kind="info" title="Why relay-filterable matters">
              Stock NIP-01 relays index only <strong>single-letter</strong> tags. <C>d</C>, <C>u</C>, <C>t</C>,{' '}
              <C>l</C>, <C>x</C>, <C>v</C> therefore work in <C>#tag</C> filters on every relay on earth.{' '}
              <C>title</C>, <C>description</C> and <C>image</C> live in the content JSON — they are search-text
              material, not filter keys.
            </Callout>
          </DocSection>

          <DocSection id="registered" number="B" title="Registered extension tags">
            <p>
              Registered extensions are validated and indexed by SIP-01-aware relays (see the UNCAGED relay
              profile) and exposed as NIP-50 search operators. On stock relays they ride along harmlessly in the
              tag array.
            </p>
            <SpecTable
              head={['Tag', 'Shape', 'Case', 'Meaning', 'Operator']}
              rows={EXTENSION_TAGS.map((t) => [
                <span key="t" className="font-mono font-semibold text-primary">{t.tag}</span>,
                <code key="s" className="font-mono text-xs">{t.shape.split(',')[0]}</code>,
                t.tag === 'country' ? 'upper' : 'lower',
                t.description,
                <code key="o" className="font-mono text-xs text-primary">{t.tag}:</code>,
              ])}
            />
          </DocSection>

          <DocSection id="hash-registry" number="C" title="Hash registry">
            <p>
              <C>x</C> is the core metadata hash (<C>sha256(title + "\n" + description)</C>). Content-body and
              perceptual hashes — full-HTML SHA-256, screenshot hashes, simhash for near-duplicate detection —
              are registered here as new tags with the algorithm stated explicitly.
            </p>
            <SpecTable
              head={['Tag', 'Status', 'Meaning']}
              rows={[
                [<span key="t" className="font-mono text-muted-foreground">(none registered yet)</span>, <Pill key="s" tone="opt">reserved</Pill>, 'Reserved for content-body and perceptual hashes.'],
              ]}
            />
          </DocSection>

          <DocSection id="rules" number="D" title="Extension rules">
            <div className="grid gap-4 sm:grid-cols-2">
              {EXTENSION_RULES.map((rule, i) => (
                <div key={rule.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="font-mono text-xs text-primary font-semibold">§9.1.{i + 1}</span>
                    <span className="font-semibold text-sm">{rule.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rule.body}</p>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="propose" number="E" title="Proposing a new extension">
            <p>The registry grows by pull request, not by permission:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Experiment safely.</strong> Ship your facet with an{' '}
                <C>x-</C>-prefixed tag, e.g. <C>["x-simhash", "9b4f…"]</C>. Consumers and relays ignore it;
                nothing breaks.
              </li>
              <li>
                <strong className="text-foreground">Prove demand.</strong> A crawler publishing it and one engine
                consuming it is the bar — the same bar the NIPs repo sets (“implemented in at least two clients
                and one relay, when applicable”).
              </li>
              <li>
                <strong className="text-foreground">Register it.</strong> PR a row into §9.2 with the tag name,
                value shape, case rule, meaning, and the introducing implementation. Multi-letter names only —
                single-letter names need broad relay awareness.
              </li>
            </ol>
            <Callout kind="ok" title="Application signals don't belong in the document">
              Staking signals, votes, curated badges: publish them as <strong>separate events</strong>{' '}
              referencing the observation by its <C>d</C> tag or coordinate. The index record stays clean;
              engines compose the layers.
            </Callout>
            <CodeBlock
              title="experimental extension example"
              code={`{
  "kind": 39697,
  "tags": [
    ["d", "widx:3641c5f2274c5471278ab5bf1df6d185"],
    ["u", "https://example.com/page"],
    ["v", "1"],
    ["alt", "Web index observation: Example Page"],
    ["x-simhash", "9b4f2c…"]   // ← ignored by everyone who doesn't know it
  ]
}`}
            />
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
              <GitPullRequest className="size-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Registry PRs land in the protocol document itself:{' '}
                <a
                  href="https://github.com/NostrDanish/0xSearchstr/blob/main/docs/SEARCH_INDEX_PROTOCOL.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-mono text-xs"
                >
                  docs/SEARCH_INDEX_PROTOCOL.md
                </a>{' '}
                — mirrored across the engine repos. The relay profile (
                <a
                  href="https://github.com/NostrDanish/UNCAGED-Index-Relay/blob/main/docs/SIP-01.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-mono text-xs"
                >
                  UNCAGED-Index-Relay docs/SIP-01.md
                </a>
                ) then maps the new tag to an index field and a search operator.
              </p>
            </div>
          </DocSection>

          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.05] p-5">
            <ShieldCheck className="size-5 text-primary shrink-0" aria-hidden />
            <p className="text-sm text-foreground/85 leading-relaxed">
              <Hash className="inline size-4 mr-1 -mt-0.5 text-primary" aria-hidden />
              Every core filterable field is already single-letter. If your facet needs to be queryable on{' '}
              <em>stock</em> relays, model it as a topic: <C>["t", "your-facet"]</C> is filtered everywhere via{' '}
              <C>#t</C> — that is exactly what the 0–8 topic slots are for.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
