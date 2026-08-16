import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Layout } from '@/components/Layout';
import { C, Callout, Pill } from '@/components/doc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  documentId,
  normalizeIndexUrl,
  parseSip01Event,
  validateSip01Event,
  type Sip01Observation,
} from '@/lib/sip01-utils';
import { D_VECTORS, SIP01 } from '@/lib/sip01';
import { useAppContext } from '@/hooks/useAppContext';
import { useSeoMeta } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { sanitizeUrl } from '@/lib/sanitizeUrl';

/* ------------------------------------------------------------------ */
/* Live observations query                                             */
/* ------------------------------------------------------------------ */

function useObservations(topic: string) {
  const { nostr } = useNostr();
  const { config } = useAppContext();
  // The app relay list (editable in /settings) — re-read when it changes.
  const readRelays = config.relayMetadata.relays.filter((r) => r.read).map((r) => r.url);
  const relayKey = readRelays.join(',');
  return useQuery({
    queryKey: ['sip01-explorer', topic, relayKey],
    queryFn: async (c) => {
      if (readRelays.length === 0) return [];
      const group = nostr.group(readRelays);
      const filter = topic
        ? { kinds: [SIP01.kind], '#t': [topic], limit: 60 }
        : { kinds: [SIP01.kind], limit: 60 };
      const all = await group
        .query([filter], { signal: AbortSignal.any([c.signal, AbortSignal.timeout(12_000)]) })
        .catch(() => [] as NostrEvent[]);
      const byId = new Map(all.map((e) => [e.id, e]));
      return [...byId.values()].sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 60_000,
  });
}

/** Validate every event client-side (SIP-01 §18), cached per event id. */
function useValidations(events: NostrEvent[] | undefined) {
  return useQuery({
    queryKey: ['sip01-validate', events?.map((e) => e.id).join(',').slice(0, 400)],
    enabled: !!events && events.length > 0,
    queryFn: async () => {
      const map = new Map<string, { valid: boolean; errors: string[] }>();
      if (!events) return map;
      for (const e of events) {
        const v = await validateSip01Event(e);
        map.set(e.id, { valid: v.valid, errors: v.errors });
      }
      return map;
    },
    staleTime: Infinity,
  });
}

/* ------------------------------------------------------------------ */
/* Observation card                                                    */
/* ------------------------------------------------------------------ */

function ObservationCard({
  obs,
  valid,
}: {
  obs: Sip01Observation;
  valid?: boolean;
}) {
  const safeUrl = sanitizeUrl(obs.url);
  const safeImage = obs.image ? sanitizeUrl(obs.image) : undefined;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex gap-4">
        {safeImage ? (
          <img
            src={safeImage}
            alt=""
            className="size-16 rounded-md object-cover border border-border shrink-0 hidden sm:block"
            loading="lazy"
          />
        ) : (
          <div className="size-16 rounded-md border border-border bg-accent/50 hidden sm:flex items-center justify-center shrink-0">
            <Globe className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-[15px] leading-snug hover:text-primary transition-colors line-clamp-2 break-words"
            >
              {obs.title}
            </a>
            {valid === true && (
              <span title="Passes full SIP-01 v1 validation">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-1" />
              </span>
            )}
            {valid === false && (
              <span title="Fails SIP-01 validation">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-1" />
              </span>
            )}
          </div>
          {obs.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-1">{obs.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
            <span className="font-mono text-xs text-primary">{obs.host}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{obs.d.slice(0, 16)}…</span>
            <span className="text-[11px] text-muted-foreground">
              observed {new Date(obs.observedAt * 1000).toLocaleDateString()}
            </span>
            {obs.topics.map((t) => (
              <span key={t} className="font-mono text-[10px] bg-accent text-accent-foreground rounded px-1.5 py-0.5 border border-border/60">
                #{t}
              </span>
            ))}
            {Object.entries(obs.extensions).map(([k, v]) => (
              <span key={k} className="font-mono text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 border border-primary/25">
                {k}:{v}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* d-tag calculator                                                    */
/* ------------------------------------------------------------------ */

function Calculator() {
  const [input, setInput] = useState('HTTPS://WWW.Example.Com:443/page/?b=2&utm_source=x&a=1#top');
  const [result, setResult] = useState<{ normalized: string; d: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(async () => {
      const normalized = normalizeIndexUrl(input);
      if (cancelled) return;
      if (!normalized) {
        setResult(null);
        setError(input.trim() ? 'Not a valid http(s) URL' : null);
        setChecking(false);
        return;
      }
      const d = await documentId(normalized);
      if (cancelled) return;
      setResult({ normalized, d });
      setError(null);
      setChecking(false);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [input]);

  const knownVector = D_VECTORS.find((v) => v.normalized === result?.normalized);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/70 bg-muted/40">
        <h2 className="font-semibold flex items-center gap-2">
          <Search className="size-4 text-primary" /> URL → d-tag calculator
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Byte-compatible SIP-01 §7 normalization + §3 identity, running in your browser. Try the vectors from
          spec §13.
        </p>
      </div>
      <div className="p-5 space-y-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com/page?utm_source=…"
          className="font-mono text-sm"
          spellCheck={false}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="space-y-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">normalized (§7)</div>
              <div className="font-mono text-sm break-all rounded-md bg-accent/60 border border-border px-3 py-2">{result.normalized}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">d tag (§3)</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm text-primary break-all rounded-md bg-primary/10 border border-primary/25 px-3 py-2 flex-1">
                  {result.d}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Copy d tag"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.d).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                >
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            {knownVector && (
              <p className="text-sm text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> Matches spec test vector — {knownVector.d === result.d ? 'identical' : 'MISMATCH'}.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Find every independent observation of this URL:{' '}
              <code className="font-mono">{`{ "kinds": [39697], "#d": ["${result.d.slice(0, 24)}…"] }`}</code>
            </p>
          </div>
        )}
        {checking && !result && !error && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ExplorerPage() {
  useSeoMeta({
    title: 'SIP-01 Explorer — live kind 39697 observations',
    description: 'Browse live SIP-01 web index observations from public relays, validate them client-side per §18, and compute d tags with the §7 normalization calculator.',
  });

  const [topicInput, setTopicInput] = useState('');
  const [topic, setTopic] = useState('');
  const [grouped, setGrouped] = useState(false);
  const { data: events, isLoading, refetch, isFetching } = useObservations(topic);
  const validations = useValidations(events);
  const { config } = useAppContext();
  const readRelays = config.relayMetadata.relays.filter((r) => r.read).map((r) => r.url);

  const observations = useMemo(
    () => (events ?? []).map(parseSip01Event).filter((o): o is Sip01Observation => o !== null),
    [events],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Sip01Observation[]>();
    for (const o of observations) {
      const list = map.get(o.d) ?? [];
      list.push(o);
      map.set(o.d, list);
    }
    return [...map.entries()]
      .map(([d, list]) => ({ d, list, indexers: new Set(list.map((o) => o.indexer)).size }))
      .sort((a, b) => b.indexers - a.indexers || b.list[0].observedAt - a.list[0].observedAt);
  }, [observations]);

  const stats = useMemo(() => {
    const indexers = new Set(observations.map((o) => o.indexer));
    const validCount = validations.data
      ? [...validations.data.values()].filter((v) => v.valid).length
      : 0;
    return {
      docs: groups.length,
      observations: observations.length,
      indexers: indexers.size,
      validCount,
    };
  }, [observations, groups, validations.data]);

  return (
    <Layout>
      <div className="container max-w-5xl py-12 md:py-16">
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">live</Pill>
            <Pill tone="opt">read-only · no login</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Index Explorer</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Real kind {SIP01.kind} observations from public relays, validated in your browser exactly as spec §18
            tells search nodes to. Nothing here requires an account — reads are unauthenticated by design.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px] items-start">
          <div className="min-w-0">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <form
                className="flex gap-2 flex-1 min-w-56"
                onSubmit={(e) => {
                  e.preventDefault();
                  setTopic(topicInput.trim().toLowerCase());
                }}
              >
                <Input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="Filter by topic, e.g. nostr"
                  className="font-mono text-sm"
                  spellCheck={false}
                />
                <Button type="submit" variant="secondary">Filter</Button>
              </form>
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  onClick={() => setGrouped(false)}
                  className={cn('px-3 py-2 text-xs font-mono transition-colors', !grouped ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground')}
                >
                  observations
                </button>
                <button
                  onClick={() => setGrouped(true)}
                  className={cn('px-3 py-2 text-xs font-mono transition-colors', grouped ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground')}
                >
                  documents
                </button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh" disabled={isFetching}>
                <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              </Button>
            </div>

            {/* Stats */}
            {!isLoading && observations.length > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-1.5 mb-6 font-mono text-xs text-muted-foreground">
                <span><span className="text-primary font-semibold">{stats.observations}</span> observations</span>
                <span><span className="text-primary font-semibold">{stats.docs}</span> documents</span>
                <span><span className="text-primary font-semibold">{stats.indexers}</span> indexers</span>
                {validations.data && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">{stats.validCount}</span> valid
                  </span>
                )}
              </div>
            )}

            {/* Feed */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex gap-4">
                      <Skeleton className="size-16 rounded-md hidden sm:block" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : observations.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  {readRelays.length === 0 ? (
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      No relays enabled. Add one or reset to the defaults in{' '}
                      <a href="/settings" className="text-primary hover:underline">relay settings</a>.
                    </p>
                  ) : (
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      No observations found{topic ? ` for topic "${topic}"` : ''} on your app relays. The index
                      grows as crawlers run — try another topic or check back later.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : grouped ? (
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.d}>
                    <div className="flex items-center gap-2.5 mb-2 px-1">
                      <span className="font-mono text-xs text-muted-foreground">{g.d.slice(0, 20)}…</span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
                        <Users className="size-3.5" /> {g.indexers} independent indexer{g.indexers === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {g.list.slice(0, 2).map((o) => (
                        <ObservationCard key={o.event.id} obs={o} valid={validations.data?.get(o.event.id)?.valid} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {observations.map((o) => (
                  <ObservationCard key={o.event.id} obs={o} valid={validations.data?.get(o.event.id)?.valid} />
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-8 font-mono">
              sources: {readRelays.length} relays from{' '}
              <a href="/settings" className="text-primary hover:underline">your app relay list</a>
              {' · '}
              {readRelays.map((r) => r.replace('wss://', '').replace(/\/$/, '')).join(' · ')}
            </p>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <Calculator />
            <Callout kind="info" title="What the shield means">
              Every event is validated locally per spec §18: <C>d ↔ u</C> consistency, <C>v = 1</C>, length caps,
              and <C>x</C> ↔ content hash. A <ShieldCheck className="inline size-3.5 text-emerald-500 -mt-0.5" />{' '}
              means the observation passes the same checks the UNCAGED relay enforces at ingestion.
            </Callout>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-sm mb-2">Publish to this index</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Any crawler can join. Generate a keypair, build kind 39697 events per the spec, publish to 2+
                relays.
              </p>
              <a
                href="https://github.com/NostrDanish/Crwalstr"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Fork Crwalstr <ExternalLink className="size-3.5" />
              </a>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-sm mb-2">Verify the spec examples</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Paste <code className="font-mono text-xs">https://example.com/page</code> into the calculator —
                you should get <code className="font-mono text-xs text-primary">widx:3641c5f2…</code>, matching
                §13.
              </p>
              <a href="/spec#test-vectors" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                All test vectors <ArrowRight className="size-3.5" />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
