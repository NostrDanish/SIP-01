import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BatteryCharging,
  Boxes,
  Compass,
  Database,
  FileText,
  Globe,
  HeartPulse,
  Network,
  RefreshCw,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Layout } from '@/components/Layout';
import { C, Callout, Pill } from '@/components/doc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIndexStats, type IndexerStat, type RelayCoverage, type SourceFamilyStat } from '@/hooks/useIndexStats';
import { OBSERVATION_RELAYS } from '@/lib/sip01';
import { HEARTBEAT_TTL_S, SHARD_COUNT } from '@/lib/heartbeat';
import { useSeoMeta } from '@/lib/seo';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(38 88% 58%)',
  'hsl(43 74% 66%)',
  'hsl(27 87% 67%)',
  'hsl(12 76% 61%)',
  'hsl(173 58% 39%)',
  'hsl(197 37% 55%)',
  'hsl(280 55% 62%)',
  'hsl(340 65% 60%)',
];

/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className="size-4 text-primary" aria-hidden />
        </div>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold font-mono tracking-tight">{value}</div>
        )}
        {sub && !loading && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-1.5 text-xs font-mono shadow-md">
      <span className="text-muted-foreground">{label}</span>{' '}
      <span className="text-primary font-semibold">{payload[0].value}</span>
    </div>
  );
}

function BarsCard({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No data in window</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: 'currentColor', fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(38 88% 58% / 0.08)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IndexerRow({ stat, rank }: { stat: IndexerStat; rank: number }) {
  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-accent/40 transition-colors">
      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{rank}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-primary">{stat.pubkey.slice(0, 12)}…</td>
      <td className="px-4 py-2.5 font-mono text-xs">
        {stat.sources.length > 0 ? stat.sources.join(', ') : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-right">{stat.observations}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-right">{stat.documents}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
        {new Date(stat.lastSeen * 1000).toLocaleString()}
      </td>
    </tr>
  );
}

function relayHost(url: string): string {
  return url.replace(/^wss?:\/\//, '').replace(/\/$/, '');
}

const COVERAGE_DOT: Record<RelayCoverage['status'], string> = {
  ok: 'bg-emerald-500',
  partial: 'bg-amber-500',
  failed: 'bg-red-500/70',
};

function RelayCoverageCard({ coverage, loading }: { coverage: RelayCoverage[]; loading?: boolean }) {
  const reporting = coverage.filter((r) => r.status !== 'failed' && (r.observations > 0 || r.heartbeats > 0));
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
            Relay coverage — where this window came from
          </CardTitle>
          {!loading && coverage.length > 0 && (
            <Pill tone="opt">{reporting.length} of {coverage.length} sources hold data</Pill>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {coverage.map((r) => (
                <div
                  key={r.url}
                  className="flex items-center gap-2.5 rounded-lg border border-border/70 px-3.5 py-2.5"
                >
                  <span
                    className={cn('size-2 rounded-full shrink-0', COVERAGE_DOT[r.status])}
                    title={r.status === 'ok' ? 'answered' : r.status === 'partial' ? 'answered, hit read timeout' : 'unreachable'}
                  />
                  <span className="font-mono text-xs truncate min-w-0 flex-1" title={r.isPool ? undefined : r.url}>
                    {r.isPool ? (
                      <Link to="/settings" className="hover:text-primary underline decoration-dotted underline-offset-2 transition-colors" title="Edit your relay list">
                        {r.url}
                      </Link>
                    ) : (
                      relayHost(r.url)
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                    {r.status === 'failed' ? (
                      'unreachable'
                    ) : (
                      <>
                        <span className="text-foreground/85">{r.observations.toLocaleString()}</span> obs
                        {r.heartbeats > 0 && <> · <span className="text-foreground/85">{r.heartbeats}</span> hb</>}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              <strong className="text-foreground">Any relay can host kind 39697.</strong> The UNCAGED index relay
              is just a relay with extra SIP-01 validation and NIP-50 search operators — the data is not tied to
              it. This page reads the union of the known crawler publish pools (Crawlstr + indexstr), the NIP-50
              search relays, and your own configured relays. Counts are per-relay, before cross-relay dedup.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const FAMILY_META: Record<SourceFamilyStat['family'], { icon: React.ElementType; blurb: string; href: string }> = {
  crawlstr: {
    icon: Compass,
    blurb: 'Lightweight scouts — human-directed & random discovery from any browser.',
    href: 'https://github.com/NostrDanish/Crwalstr',
  },
  indexstr: {
    icon: Network,
    blurb: 'Heavyweight distributed indexer — curated collections sharded across nodes.',
    href: 'https://github.com/NostrDanish/indexstr',
  },
  other: {
    icon: Boxes,
    blurb: 'Everything else publishing kind 39697 — autosigners, engines, new software.',
    href: 'https://github.com/NostrDanish/SIP-01',
  },
};

function FamilyCard({ stat, liveNodes, loading }: { stat: SourceFamilyStat; liveNodes?: number; loading?: boolean }) {
  const meta = FAMILY_META[stat.family];
  const Icon = meta.icon;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-1.5">
          <a
            href={meta.href}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-sm hover:text-primary transition-colors"
          >
            {stat.label}
          </a>
          <Icon className="size-4 text-primary" aria-hidden />
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{meta.blurb}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-3xl font-bold font-mono tracking-tight">
              {stat.observations.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-2">observations</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-mono">
              {stat.indexers} indexer{stat.indexers === 1 ? '' : 's'} · {stat.documents.toLocaleString()} docs
              {stat.lastSeen > 0 && <> · last {new Date(stat.lastSeen * 1000).toLocaleString()}</>}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
              {stat.sources.length > 0 ? stat.sources.join(', ') : 'no observations in window'}
              {stat.family !== 'other' && liveNodes !== undefined && (
                <> · <span className="text-emerald-500">{liveNodes} live</span> (heartbeats)</>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  useSeoMeta({
    title: 'SIP-01 Index Dashboard — live stats from the shared search index',
    description: 'Public, coordinator-free statistics for the SIP-01 index: observations, documents, indexers, topics, per-relay coverage, and live indexstr crawler-node heartbeats. Any SIP-01 publisher on any relay lands here by default.',
  });

  const { data, isLoading, isFetching, refetch } = useIndexStats();
  const [showAllIndexers, setShowAllIndexers] = useState(false);

  const indexers = data?.indexers ?? [];
  const visibleIndexers = showAllIndexers ? indexers : indexers.slice(0, 8);

  return (
    <Layout>
      <div className="container max-w-6xl py-12 md:py-16">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Pill tone="gold">live</Pill>
              <Pill tone="opt">kind 39697 + kind 16919</Pill>
              <Pill tone="opt">coordinator-free</Pill>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Index Dashboard</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Public statistics for the shared SIP-01 index, computed entirely from relay data in your browser.
              No indexer registry, no coordinator — <strong className="text-foreground">anyone publishing kind
              39697 to any relay lands here by default</strong>: Crwalstr, indexstr, autosigners, or anything
              new. We read every relay the crawlers publish to, plus yours.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2 shrink-0">
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          <StatCard icon={Activity} label="Observations" value={data?.observations.length ?? 0} sub="in query window" loading={isLoading} />
          <StatCard icon={FileText} label="Documents" value={data?.documents ?? 0} sub="distinct d tags" loading={isLoading} />
          <StatCard icon={Users} label="Indexers" value={data?.indexerCount ?? 0} sub="distinct pubkeys" loading={isLoading} />
          <StatCard icon={Globe} label="Hosts" value={data?.hosts ?? 0} sub="unique domains" loading={isLoading} />
          <StatCard
            icon={ShieldCheck}
            label="Valid SIP-01"
            value={data?.validityRate != null ? `${Math.round(data.validityRate * 100)}%` : '…'}
            sub="pass full §18 checks"
            loading={isLoading}
          />
          <StatCard
            icon={HeartPulse}
            label="Live nodes"
            value={data?.liveNodes.length ?? 0}
            sub={`heartbeat < ${HEARTBEAT_TTL_S / 60}min old`}
            loading={isLoading}
          />
        </div>

        {!isLoading && data && !data.hasData && (
          <Card className="border-dashed mb-8">
            <CardContent className="py-12 px-8 text-center">
              <p className="text-muted-foreground max-w-md mx-auto">
                No SIP-01 activity found on any queried relay right now. The index grows as crawlers run — start
                one and it will show up here automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Per-software stats — both sides of the publisher layer */}
        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <Users className="size-3.5" /> Publisher software — the crawler and the indexer network
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mb-8">
          {(data?.families ?? [
            { family: 'crawlstr', label: 'Crawlstr scouts', observations: 0, indexers: 0, documents: 0, lastSeen: 0, sources: [] },
            { family: 'indexstr', label: 'indexstr network', observations: 0, indexers: 0, documents: 0, lastSeen: 0, sources: [] },
          ] satisfies SourceFamilyStat[]).map((fam) => (
            <FamilyCard
              key={fam.family}
              stat={fam}
              liveNodes={fam.family === 'other' ? undefined : data?.liveByFamily[fam.family]}
              loading={isLoading}
            />
          ))}
        </div>

        {/* Per-relay provenance */}
        <RelayCoverageCard coverage={data?.relayCoverage ?? []} loading={isLoading} />

        {/* Activity chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Observations per day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.perDay ?? []} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="obsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(38 88% 58%)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="hsl(38 88% 58%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: 'currentColor', fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      width={36}
                      tick={{ fontSize: 10, fill: 'currentColor', fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(38 88% 58% / 0.4)' }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(38 88% 58%)" strokeWidth={2} fill="url(#obsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdowns */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {isLoading ? (
            <>
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </>
          ) : (
            <>
              <BarsCard title="Top topics (t tags)" data={data?.topics ?? []} />
              <BarsCard title="Top hosts" data={data?.topHosts ?? []} />
              <BarsCard title="Indexer software (source tag)" data={data?.sources ?? []} />
              <BarsCard title="Languages (l tag)" data={data?.languages ?? []} />
            </>
          )}
        </div>

        {/* Network health — heartbeats */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                Crawler network — node heartbeats
              </CardTitle>
              <Pill tone="opt">kind 16919 · crawlstr + indexstr · self-reported</Pill>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (data?.heartbeats.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center max-w-xl mx-auto">
                No crawler heartbeats in range right now. Crawlstr scouts and indexstr nodes publish one on
                start and every 10 minutes while running. SIP-01 publishers that don't emit heartbeats never
                appear in this panel — their signed kind 39697 observations land in the indexer leaderboard
                below instead.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="rounded-lg border border-border p-4">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Active nodes</div>
                    <div className="text-2xl font-bold font-mono">{data!.liveNodes.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {data!.liveByFamily.crawlstr} crawlstr · {data!.liveByFamily.indexstr} indexstr
                      {data!.liveByFamily.unknown > 0 && ` · ${data!.liveByFamily.unknown} other`} ·{' '}
                      {data!.heartbeats.length} total seen
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Shard coverage</div>
                    <div className="text-2xl font-bold font-mono">{data!.shardsCovered}<span className="text-muted-foreground text-lg">/{SHARD_COUNT}</span></div>
                    <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (data!.shardsCovered / SHARD_COUNT) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Pages indexed</div>
                    <div className="text-2xl font-bold font-mono">{data!.selfReported.pagesIndexed.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">self-reported, live nodes</div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Queues pending</div>
                    <div className="text-2xl font-bold font-mono">{data!.selfReported.queueSize.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{data!.selfReported.published.toLocaleString()} published total</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {data!.heartbeats.slice(0, 10).map((hb) => {
                    const live = data!.liveNodes.some((n) => n.pubkey === hb.pubkey);
                    return (
                      <div
                        key={hb.pubkey}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border/70 px-4 py-2.5"
                      >
                        <span className={cn('size-2 rounded-full shrink-0', live ? 'bg-emerald-500' : 'bg-muted-foreground/40')} aria-label={live ? 'online' : 'offline'} />
                        <span className="font-mono text-xs text-primary">{hb.pubkey.slice(0, 12)}…</span>
                        <span
                          className={cn(
                            'font-mono text-[11px] rounded px-1.5 py-0.5 border',
                            hb.source?.startsWith('crawlstr')
                              ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                              : hb.source?.startsWith('indexstr')
                                ? 'bg-primary/10 text-primary border-primary/25'
                                : 'bg-accent text-accent-foreground border-border/60',
                          )}
                        >
                          {hb.source ?? 'unknown'}
                        </span>
                        <span className="font-mono text-[11px] bg-accent text-accent-foreground rounded px-1.5 py-0.5 border border-border/60">
                          shard {hb.shard}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">{hb.platform}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{hb.network}</span>
                        {hb.charging && <BatteryCharging className="size-3.5 text-emerald-500" aria-label="charging" />}
                        <span className="font-mono text-[11px] text-muted-foreground ml-auto">
                          {hb.stats.pagesIndexed.toLocaleString()} pages · {new Date(hb.createdAt * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Heartbeats are <strong className="text-foreground">self-reported and unverified</strong> — they
                  describe coverage and health, never reputation. Reputation derives only from signed kind 39697
                  observations below. Both crawler families compute the same home shard (first byte of the
                  indexer pubkey); indexstr nodes also schedule work by it, Crawlstr scouts just report it.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Indexer leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Database className="size-4 text-primary" /> Indexer leaderboard — every kind 39697 publisher, any relay
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {isLoading ? (
              <div className="px-6 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : indexers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No indexers in window.</p>
            ) : (
              <>
                <div className="overflow-x-auto scrollbar-thin-x">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['#', 'indexer', 'software', 'obs.', 'docs', 'last seen'].map((h) => (
                          <th key={h} className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2 last:text-right">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleIndexers.map((s, i) => <IndexerRow key={s.pubkey} stat={s} rank={i + 1} />)}
                    </tbody>
                  </table>
                </div>
                {indexers.length > 8 && (
                  <div className="px-4 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => setShowAllIndexers((v) => !v)}>
                      {showAllIndexers ? 'Show fewer' : `Show all ${indexers.length} indexers`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Callout kind="info" title="Two layers, two kinds">
            <strong className="text-foreground">Kind 39697 observations are the index</strong> — anyone who
            publishes them is an indexer and lands on the leaderboard automatically; optionally add a{' '}
            <C>source</C> tag like <C>mycrawler/1</C>.{' '}
            <strong className="text-foreground">Kind 16919 heartbeats are the crawler network's shared health
            layer</strong> — published by both Crawlstr scouts and indexstr nodes on start and every 10 minutes
            while running. Engines and autosigners typically publish observations only.
          </Callout>
          <Callout kind="info" title="Where the numbers come from">
            Read live in your browser from {OBSERVATION_RELAYS.length} relays — the union of the Crawlstr and
            indexstr publish pools and the NIP-50 search relays — plus your configured relays, which you can
            change anytime in <Link to="/settings" className="text-primary hover:underline">relay settings</Link>.
            See the coverage panel above for per-relay detail. Auto-refreshes every 60s. Browse individual
            observations in the{' '}
            <Link to="/explorer" className="text-primary hover:underline">explorer</Link>.
          </Callout>
        </div>

        {/* Extra breakdowns */}
        {data && (data.networks.length > 0 || data.docTypes.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <BarsCard title="Networks (extension)" data={data.networks} />
            <BarsCard title="Document types (extension)" data={data.docTypes} />
          </div>
        )}

        <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Tags className="size-3.5" />
          <span>
            spec: <Link to="/spec" className="text-primary hover:underline">SIP-01 v1.2</Link> · kind 16919
            heartbeats: crawlstr scouts + indexstr nodes · any relay can host kind 39697
          </span>
        </div>
      </div>
    </Layout>
  );
}
