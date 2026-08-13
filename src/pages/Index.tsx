import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  Database,
  FileJson2,
  Fingerprint,
  Globe,
  Layers,
  Radio,
  Search,
  Server,
  ShieldCheck,
  Tags,
} from 'lucide-react';

import { Layout } from '@/components/Layout';
import { CodeBlock, Pill } from '@/components/doc';
import { REPOS, SIP01 } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';

const PRINCIPLES = [
  {
    icon: Fingerprint,
    title: 'Deterministic identity',
    body: 'd = widx: + sha256(normalized URL)[0:32]. Every indexer on earth produces the same d for the same page — so “7 independent indexers saw this” is one group-by away.',
  },
  {
    icon: Layers,
    title: 'Addressable, not spammy',
    body: 'Kind 39697 lives in the 30000–39999 range: a recrawl replaces the crawler’s previous observation. Relay storage stays bounded; history keepers archive superseded versions.',
  },
  {
    icon: Tags,
    title: 'Modular by design',
    body: 'A fixed, minimal core plus a registered extension-tag registry (type, platform, category, network, country, mime). Unknown tags are ignored — extensions ship without forking the spec.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero query leakage',
    body: 'Observations contain a URL and public metadata — never who searched for what. Indexer keys are per-device, pseudonymous, and never the user’s personal key.',
  },
  {
    icon: Radio,
    title: 'Stock-relay compatible',
    body: 'Every filterable field is a single-letter tag (d, u, t, l, x, v) — plain NIP-01 filters work everywhere. NIP-50 search operators are an optional acceleration, never a requirement.',
  },
  {
    icon: Database,
    title: 'Signals, not ranking',
    body: 'The protocol carries facts; relays may add local scores; engines decide what “best” means. No single indexer, relay, or engine is authoritative.',
  },
];

const PIPELINE = [
  { icon: Bot, name: 'Crawlers', desc: 'Crwalstr & friends observe pages and sign observations', href: 'https://github.com/NostrDanish/Crwalstr' },
  { icon: FileJson2, name: 'kind 39697', desc: 'One addressable event per (indexer, normalized URL)' },
  { icon: Server, name: 'Index relays', desc: 'Validate, dedupe, index, and federate via NIP-77', href: 'https://github.com/NostrDanish/UNCAGED-Index-Relay' },
  { icon: Search, name: 'Search engines', desc: 'Group by d, count indexers, rank however they want', href: 'https://github.com/NostrDanish/UNCAGED-ENGINE' },
];

const EXAMPLE_EVENT = `{
  "kind": 39697,
  "content": "{\\"title\\":\\"Example Page\\",\\"description\\":\\"A page about examples.\\"}",
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
}`;

export default function Index() {
  useSeoMeta({
    title: 'SIP-01 — Search Index Protocol · kind 39697',
    description: SIP01.tagline,
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 -z-10 bg-blueprint" aria-hidden />
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(38_88%_58%/0.12),transparent_70%)]"
          aria-hidden
        />
        <div className="container py-20 md:py-28 max-w-5xl">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Pill tone="gold">draft · v{SIP01.version}</Pill>
            <Pill tone="opt">nostr</Pill>
            <Pill tone="opt">kind {SIP01.kind} · addressable</Pill>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
            The open protocol for a{' '}
            <span className="text-primary">decentralized web index</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-8">
            SIP-01 is a Nostr standard for <strong className="text-foreground">Web Index Observations</strong> —
            signed statements of the form <em>“indexer <span className="font-mono text-base">pubkey</span> observed
            this web document at this time.”</em> One shared index. Many independent indexers. Many independent
            search engines. No single owner.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/spec"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BookOpen className="size-4" />
              Read the specification
            </Link>
            <Link
              to="/explorer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Globe className="size-4" />
              Explore the live index
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Activity className="size-4" />
              Index dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="container py-16 md:py-20 max-w-6xl">
        <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-primary mb-3">How it fits together</h2>
        <p className="text-2xl md:text-3xl font-bold tracking-tight mb-10 max-w-2xl">
          Crawlers publish. Relays validate and index. Engines rank.
        </p>
        <div className="grid gap-4 md:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <div key={step.name} className="relative">
              <div className="h-full rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <step.icon className="size-6 text-primary" aria-hidden />
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <div className="font-semibold mb-1.5">{step.name}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {step.href && (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-primary mt-3 hover:underline"
                  >
                    source <ArrowRight className="size-3" />
                  </a>
                )}
              </div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3.5 -translate-y-1/2 size-4 text-primary/60 z-10" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Event anatomy */}
      <section className="border-y border-border/70 bg-card/40">
        <div className="container py-16 md:py-20 max-w-6xl grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-primary mb-3">The atom of the index</h2>
            <p className="text-2xl md:text-3xl font-bold tracking-tight mb-5">
              One event. Three identities.
            </p>
            <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85">
              <p>
                <strong className="text-foreground">URL identity</strong> — the <code className="font-mono text-sm bg-accent px-1.5 py-0.5 rounded border border-border/60">d</code> tag,
                derived deterministically from the normalized URL. All indexers agree on it without coordination.
              </p>
              <p>
                <strong className="text-foreground">Canonical URL</strong> — the <code className="font-mono text-sm bg-accent px-1.5 py-0.5 rounded border border-border/60">u</code> tag,
                the page’s preferred URL after normalization (tracking parameters stripped, query keys sorted).
              </p>
              <p>
                <strong className="text-foreground">Content identity</strong> — the <code className="font-mono text-sm bg-accent px-1.5 py-0.5 rounded border border-border/60">x</code> tag,
                a SHA-256 of the observed metadata. Same <code className="font-mono text-sm">d</code> + same <code className="font-mono text-sm">x</code> = indexers agree;
                same <code className="font-mono text-sm">d</code>, different <code className="font-mono text-sm">x</code> = the page changed.
              </p>
              <p className="text-muted-foreground">
                Every hash in this example is real — verify it yourself in the{' '}
                <Link to="/explorer" className="text-primary hover:underline">calculator</Link>, or against the{' '}
                <Link to="/spec#test-vectors" className="text-primary hover:underline">test vectors</Link>.
              </p>
            </div>
          </div>
          <CodeBlock code={EXAMPLE_EVENT} title="kind 39697 · web index observation" />
        </div>
      </section>

      {/* Principles */}
      <section className="container py-16 md:py-20 max-w-6xl">
        <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-primary mb-3">Design principles</h2>
        <p className="text-2xl md:text-3xl font-bold tracking-tight mb-10">Built to be unstoppable, boring, and forkable</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors">
              <p.icon className="size-5 text-primary mb-4" aria-hidden />
              <div className="font-semibold mb-2">{p.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem strip */}
      <section className="border-t border-border/70 bg-card/40">
        <div className="container py-16 md:py-20 max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-primary mb-3">Running in production</h2>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">Six codebases, one contract</p>
            </div>
            <Link to="/implementations" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              All implementations <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REPOS.slice(0, 3).map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-semibold text-sm group-hover:text-primary transition-colors">{repo.name}</span>
                  <Pill tone="gold">{repo.badge}</Pill>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{repo.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 md:py-24 max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Implement it in an afternoon
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          The core schema fits on an index card: one kind, five required fields, one hash function.
          Tap into the shared index with a single filter.
        </p>
        <div className="inline-block text-left max-w-full">
          <CodeBlock
            title="the whole read path"
            code={`["REQ", "web", { "kinds": [39697], "#t": ["nostr"], "limit": 50 }]`}
          />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/spec"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Specification <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/query"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Query reference
          </Link>
        </div>
      </section>
    </Layout>
  );
}
