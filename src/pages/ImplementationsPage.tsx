import { ExternalLink, FileCode2, GitFork } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { Callout, DocSection, Pill } from '@/components/doc';
import { REPOS } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';

export default function ImplementationsPage() {
  useSeoMeta({
    title: 'SIP-01 Implementations — relays, crawlers, and search engines',
    description: 'The SIP-01 ecosystem: UNCAGED Index Relay, Crwalstr crawler, UNCAGED-ENGINE template, 0xSearchstr and 0xPresearchstr engines — one shared contract, five codebases.',
  });

  return (
    <Layout>
      <div className="container max-w-5xl py-12 md:py-16">
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">ecosystem</Pill>
            <Pill tone="opt">5 repositories</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Implementations</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            The NIP acceptance bar is “implemented in at least two clients and one relay.” SIP-01 ships with two
            engines, a forkable engine template, a browser crawler, and a validating index relay — all speaking
            byte-identical SIP-01.
          </p>
        </header>

        <div className="rounded-xl overflow-hidden border border-border mb-10 relative">
          <img src="/banner.jpg" alt="UNCAGED — decentralized search index" className="w-full max-h-64 object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" aria-hidden />
        </div>

        <div className="space-y-6 mb-16">
          {REPOS.map((repo) => (
            <article key={repo.name} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-lg hover:text-primary transition-colors inline-flex items-center gap-2"
                  >
                    {repo.name}
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </a>
                  <Pill tone="gold">{repo.badge}</Pill>
                </div>
                <p className="text-sm text-primary/80 font-mono mb-3">{repo.role}</p>
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-5">{repo.description}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {repo.keyFiles.map((f) => (
                    <div key={f.path} className="rounded-lg border border-border/70 bg-muted/40 px-3.5 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-foreground mb-1 break-all">
                        <FileCode2 className="size-3.5 text-primary shrink-0" />
                        {f.path}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-14">
          <DocSection id="roles" number="§" title="Who does what">
            <p>
              The protocol keeps the three roles deliberately separate so no single entity can control the index:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">Crawlers</strong> (Crwalstr, engine autosigners) only{' '}
                <em>publish</em> signed observations. They never talk to a search backend.
              </li>
              <li>
                <strong className="text-foreground">Relays</strong> (UNCAGED Index Relay) validate, dedupe, and
                index — and expose signals, never verdicts.
              </li>
              <li>
                <strong className="text-foreground">Engines</strong> (0xSearchstr, 0xPresearchstr, UNCAGED-ENGINE
                forks) consume observations and rank them however they choose. Competition happens here, not at
                the data layer.
              </li>
            </ul>
          </DocSection>

          <DocSection id="fork" number="§" title="Run your own">
            <p>
              Every layer is forkable. Fork <strong className="text-foreground">UNCAGED-ENGINE</strong> to launch
              a topical engine (cooking, research, code — the <C>t</C> tags are your slices). Fork{' '}
              <strong className="text-foreground">Crwalstr</strong> to add crawler capacity from any browser.
              Run an <strong className="text-foreground">UNCAGED Index Relay</strong> with a scoped{' '}
              <C>uncaged_index</C> block to operate a niche index. They all meet at kind 39697.
            </p>
            <Callout kind="info" title="The schema is the federation contract">
              Compatibility lives in the event schema, not in any signer or server. If your fork emits valid
              SIP-01, it feeds — and reads — the same shared pool as everyone else.
            </Callout>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/NostrDanish/UNCAGED-ENGINE"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <GitFork className="size-4" /> Fork UNCAGED-ENGINE
              </a>
              <a
                href="https://github.com/NostrDanish/UNCAGED-Index-Relay"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
              >
                Run an index relay
              </a>
            </div>
          </DocSection>
        </div>
      </div>
    </Layout>
  );
}
