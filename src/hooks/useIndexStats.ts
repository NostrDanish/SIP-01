/**
 * Live SIP-01 index statistics.
 *
 * Everything is derived from the events themselves — no hardcoded indexer
 * registry. Any crawler that starts publishing valid kind 39697 observations
 * (or kind 16919 heartbeats) appears on the dashboard automatically, which is
 * the point: Crwalstr, indexstr, and every future indexer share one pool.
 *
 * Reads fan out per relay over OBSERVATION_RELAYS — the union of the known
 * crawler publish pools (Crawlstr + indexstr) and the NIP-50 search relays —
 * plus the user's own relay pool. Kind 39697 lives on ANY relay (the index
 * relay is just a relay with extra validation/search), so the dashboard reads
 * the widest set we know and reports per-relay coverage alongside the stats.
 */
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

import { SIP01 } from '@/lib/sip01';
import { OBSERVATION_RELAYS } from '@/lib/sip01';
import { parseSip01Event, validateSip01Event, type Sip01Observation } from '@/lib/sip01-utils';
import {
  dedupeHeartbeats,
  heartbeatFamily,
  isNodeLive,
  HEARTBEAT_KIND,
  type HeartbeatFamily,
  type ParsedHeartbeat,
} from '@/lib/heartbeat';

/** Pages of 500 observations walked backwards from "now", per relay. */
const OBS_PAGES = 4;
const PAGE_SIZE = 500;

/** Per-relay read timeout — one slow relay must not stall the dashboard. */
const RELAY_TIMEOUT_MS = 12_000;

async function fetchObservationWindow(
  queryFn: (filters: object[], opts: { signal: AbortSignal }) => Promise<NostrEvent[]>,
  signal: AbortSignal,
): Promise<NostrEvent[]> {
  const byId = new Map<string, NostrEvent>();
  let until: number | undefined;
  for (let page = 0; page < OBS_PAGES; page++) {
    const filter: Record<string, unknown> = { kinds: [SIP01.kind], limit: PAGE_SIZE };
    if (until !== undefined) filter.until = until;
    let batch: NostrEvent[] = [];
    try {
      batch = await queryFn([filter], { signal });
    } catch {
      break; // relay group failed — keep what we have
    }
    if (batch.length === 0) break;
    let oldest = Infinity;
    for (const e of batch) {
      byId.set(e.id, e);
      if (e.created_at < oldest) oldest = e.created_at;
    }
    if (batch.length < PAGE_SIZE || !Number.isFinite(oldest)) break;
    until = oldest - 1;
  }
  return [...byId.values()];
}

export interface IndexerStat {
  pubkey: string;
  observations: number;
  documents: number;
  lastSeen: number;
  sources: string[];
  networks: string[];
}

/** Per-relay read result — the dashboard's provenance panel. */
export interface RelayCoverage {
  /** Relay URL, or a label for the user's own relay pool. */
  url: string;
  /** True for the user's configured relay pool entry. */
  isPool: boolean;
  /** Kind 39697 events this relay returned (before cross-relay dedup). */
  observations: number;
  /** Kind 16919 heartbeats this relay returned. */
  heartbeats: number;
  /** ok = answered; partial = answered but hit the read timeout; failed = unreachable. */
  status: 'ok' | 'partial' | 'failed';
}

/** Observation-layer stats for one publisher software family (source tag). */
export interface SourceFamilyStat {
  /** Family key: 'crawlstr' | 'indexstr' | 'other'. */
  family: 'crawlstr' | 'indexstr' | 'other';
  /** Display label. */
  label: string;
  observations: number;
  /** Distinct indexer pubkeys in this family. */
  indexers: number;
  /** Distinct d tags in this family. */
  documents: number;
  /** Newest observation time (unix seconds), 0 when none. */
  lastSeen: number;
  /** Raw source strings seen, e.g. ['crawlstr/1']. */
  sources: string[];
}

/** Classify an observation's source tag into a known publisher family. */
function sourceFamily(source: string | undefined): SourceFamilyStat['family'] {
  const s = (source ?? '').toLowerCase();
  if (s.startsWith('crawlstr')) return 'crawlstr';
  if (s.startsWith('indexstr')) return 'indexstr';
  return 'other';
}

const FAMILY_LABELS: Record<SourceFamilyStat['family'], string> = {
  crawlstr: 'Crawlstr scouts',
  indexstr: 'indexstr network',
  other: 'Other publishers',
};

export interface IndexStats {
  observations: Sip01Observation[];
  /** Distinct d tags (unique documents). */
  documents: number;
  /** Distinct indexer pubkeys. */
  indexerCount: number;
  /** Distinct hosts observed. */
  hosts: number;
  /** Share of events passing full SIP-01 validation (0–1), null while computing. */
  validityRate: number | null;
  /** Observations per UTC day, oldest → newest. */
  perDay: { day: string; count: number }[];
  /** Top topic tags. */
  topics: { name: string; count: number }[];
  /** Top hosts. */
  topHosts: { name: string; count: number }[];
  /** Observations per source software string. */
  sources: { name: string; count: number }[];
  /** Observations per language (l tag). */
  languages: { name: string; count: number }[];
  /** Observations per network extension tag. */
  networks: { name: string; count: number }[];
  /** Observations per doc-type extension tag. */
  docTypes: { name: string; count: number }[];
  /** Leaderboard of indexers. */
  indexers: IndexerStat[];
  /** Observation-layer stats per publisher software family (source tag). */
  families: SourceFamilyStat[];
  /** Per-relay provenance for the current window. */
  relayCoverage: RelayCoverage[];
  /** Heartbeat network view (kind 16919), latest per node. */
  heartbeats: ParsedHeartbeat[];
  liveNodes: ParsedHeartbeat[];
  /** Live-node count per crawler software family (crawlstr / indexstr / unknown). */
  liveByFamily: Record<HeartbeatFamily, number>;
  shardsCovered: number;
  selfReported: { pagesIndexed: number; published: number; queueSize: number };
  /** True when any events were found at all. */
  hasData: boolean;
}

export function useIndexStats() {
  const { nostr } = useNostr();

  const query = useQuery({
    queryKey: ['sip01-index-stats-v1'],
    queryFn: async (c) => {
      /* Fan out per relay so we can report exactly where the data lives.
         NRelay1 auto-closes idle connections (30s), so per-run handles are
         safe; each relay gets its own timeout so one slow relay can't stall
         the page. */
      const perRelay = await Promise.allSettled(
        OBSERVATION_RELAYS.map(async (url) => {
          const relay = nostr.relay(url);
          const signal = AbortSignal.any([c.signal, AbortSignal.timeout(RELAY_TIMEOUT_MS)]);
          const events = await fetchObservationWindow((f, o) => relay.query(f as never, o), signal);
          let heartbeats: NostrEvent[] = [];
          try {
            heartbeats = await relay.query([{ kinds: [HEARTBEAT_KIND], limit: 500 }], { signal });
          } catch {
            /* timed out mid-read — keep whatever observations we got */
          }
          const timedOut = signal.aborted && !c.signal.aborted;
          const gotData = events.length + heartbeats.length > 0;
          const status: RelayCoverage['status'] = gotData ? (timedOut ? 'partial' : 'ok') : timedOut ? 'failed' : 'ok';
          return { url, events, heartbeats, status };
        }),
      );

      // The user's own NIP-65 pool, same treatment.
      const poolSignal = AbortSignal.any([c.signal, AbortSignal.timeout(RELAY_TIMEOUT_MS)]);
      const poolResult: {
        events: NostrEvent[];
        heartbeats: NostrEvent[];
        timedOut: boolean;
      } = { events: [], heartbeats: [], timedOut: false };
      try {
        poolResult.events = await fetchObservationWindow((f, o) => nostr.query(f as never, o), poolSignal);
        poolResult.heartbeats = await nostr.query([{ kinds: [HEARTBEAT_KIND], limit: 500 }], { signal: poolSignal });
        poolResult.timedOut = poolSignal.aborted && !c.signal.aborted;
      } catch {
        poolResult.timedOut = poolSignal.aborted && !c.signal.aborted;
      }

      const relayCoverage: RelayCoverage[] = [];
      const obsEvents: NostrEvent[] = [];
      const hbEvents: NostrEvent[] = [];

      for (const [i, r] of perRelay.entries()) {
        const url = OBSERVATION_RELAYS[i];
        if (r.status === 'fulfilled') {
          relayCoverage.push({
            url,
            isPool: false,
            observations: r.value.events.length,
            heartbeats: r.value.heartbeats.length,
            status: r.value.status,
          });
          obsEvents.push(...r.value.events);
          hbEvents.push(...r.value.heartbeats);
        } else {
          relayCoverage.push({ url, isPool: false, observations: 0, heartbeats: 0, status: 'failed' });
        }
      }
      const poolGotData = poolResult.events.length + poolResult.heartbeats.length > 0;
      relayCoverage.push({
        url: 'your relay pool',
        isPool: true,
        observations: poolResult.events.length,
        heartbeats: poolResult.heartbeats.length,
        status: poolGotData ? (poolResult.timedOut ? 'partial' : 'ok') : poolResult.timedOut ? 'failed' : 'ok',
      });
      obsEvents.push(...poolResult.events);
      hbEvents.push(...poolResult.heartbeats);

      const byId = new Map(obsEvents.map((e) => [e.id, e]));
      const observations = [...byId.values()]
        .map(parseSip01Event)
        .filter((o): o is Sip01Observation => o !== null)
        .sort((a, b) => b.observedAt - a.observedAt);

      const hbById = new Map(hbEvents.map((e) => [e.id, e]));
      const heartbeats = dedupeHeartbeats([...hbById.values()]);
      const now = Math.floor(Date.now() / 1000);
      const liveNodes = heartbeats.filter((hb) => isNodeLive(hb, now));
      const liveByFamily: Record<HeartbeatFamily, number> = { crawlstr: 0, indexstr: 0, unknown: 0 };
      for (const hb of liveNodes) liveByFamily[heartbeatFamily(hb.source)] += 1;

      /* ---- aggregates ---- */
      const docs = new Set(observations.map((o) => o.d));
      const hostSet = new Set(observations.map((o) => o.host));
      const indexerMap = new Map<string, IndexerStat>();
      const familyMap = new Map<
        SourceFamilyStat['family'],
        { observations: number; indexers: Set<string>; docs: Set<string>; lastSeen: number; sources: Set<string> }
      >();

      const topicCount = new Map<string, number>();
      const hostCount = new Map<string, number>();
      const sourceCount = new Map<string, number>();
      const langCount = new Map<string, number>();
      const networkCount = new Map<string, number>();
      const typeCount = new Map<string, number>();
      const dayCount = new Map<string, number>();

      const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

      for (const o of observations) {
        for (const t of o.topics) bump(topicCount, t);
        bump(hostCount, o.host);
        bump(sourceCount, o.source ?? '(unspecified)');
        if (o.language) bump(langCount, o.language);
        if (o.extensions.network) bump(networkCount, o.extensions.network);
        if (o.extensions.type) bump(typeCount, o.extensions.type);
        bump(dayCount, new Date(o.observedAt * 1000).toISOString().slice(0, 10));

        const prev = indexerMap.get(o.indexer);
        indexerMap.set(o.indexer, {
          pubkey: o.indexer,
          observations: (prev?.observations ?? 0) + 1,
          documents: 0, // filled below
          lastSeen: Math.max(prev?.lastSeen ?? 0, o.observedAt),
          sources: [...new Set([...(prev?.sources ?? []), ...(o.source ? [o.source] : [])])],
          networks: [...new Set([...(prev?.networks ?? []), ...(o.extensions.network ? [o.extensions.network] : [])])],
        });

        const famKey = sourceFamily(o.source);
        const fam = familyMap.get(famKey) ?? {
          observations: 0,
          indexers: new Set<string>(),
          docs: new Set<string>(),
          lastSeen: 0,
          sources: new Set<string>(),
        };
        fam.observations += 1;
        fam.indexers.add(o.indexer);
        fam.docs.add(o.d);
        fam.lastSeen = Math.max(fam.lastSeen, o.observedAt);
        if (o.source) fam.sources.add(o.source);
        familyMap.set(famKey, fam);
      }

      // documents per indexer
      const docsByIndexer = new Map<string, Set<string>>();
      for (const o of observations) {
        const set = docsByIndexer.get(o.indexer) ?? new Set<string>();
        set.add(o.d);
        docsByIndexer.set(o.indexer, set);
      }
      for (const [pk, set] of docsByIndexer) {
        const stat = indexerMap.get(pk);
        if (stat) stat.documents = set.size;
      }

      const topOf = (map: Map<string, number>, n: number) =>
        [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));

      const perDay = [...dayCount.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, count]) => ({ day, count }));

      // Both ecosystem families are always reported (even at 0) so the
      // dashboard can show "stats from both"; 'other' only when present.
      const families: SourceFamilyStat[] = (['crawlstr', 'indexstr', 'other'] as const)
        .filter((fam) => fam !== 'other' || familyMap.has('other'))
        .map((fam) => {
          const f = familyMap.get(fam);
          return {
            family: fam,
            label: FAMILY_LABELS[fam],
            observations: f?.observations ?? 0,
            indexers: f?.indexers.size ?? 0,
            documents: f?.docs.size ?? 0,
            lastSeen: f?.lastSeen ?? 0,
            sources: f ? [...f.sources].sort() : [],
          };
        });

      const stats: Omit<IndexStats, 'validityRate'> = {
        observations,
        documents: docs.size,
        indexerCount: indexerMap.size,
        hosts: hostSet.size,
        perDay,
        topics: topOf(topicCount, 10),
        topHosts: topOf(hostCount, 10),
        sources: topOf(sourceCount, 8),
        languages: topOf(langCount, 8),
        networks: topOf(networkCount, 6),
        docTypes: topOf(typeCount, 6),
        indexers: [...indexerMap.values()].sort((a, b) => b.observations - a.observations).slice(0, 20),
        families,
        relayCoverage,
        heartbeats,
        liveNodes,
        liveByFamily,
        shardsCovered: new Set(liveNodes.map((hb) => hb.shard)).size,
        selfReported: liveNodes.reduce(
          (acc, hb) => ({
            pagesIndexed: acc.pagesIndexed + hb.stats.pagesIndexed,
            published: acc.published + hb.stats.published,
            queueSize: acc.queueSize + hb.stats.queueSize,
          }),
          { pagesIndexed: 0, published: 0, queueSize: 0 },
        ),
        hasData: observations.length > 0 || heartbeats.length > 0,
      };
      return stats;
    },
    refetchInterval: 60_000,
    staleTime: 45_000,
  });

  /* Separate (cached) validation pass — sha256 per event, so keep it async
     and keyed by the observed ids. */
  const ids = query.data?.observations.map((o) => o.event.id).join(',').slice(0, 800);
  const validation = useQuery({
    queryKey: ['sip01-stats-validate', ids],
    enabled: !!query.data && query.data.observations.length > 0,
    queryFn: async () => {
      let valid = 0;
      for (const o of query.data!.observations) {
        const v = await validateSip01Event(o.event);
        if (v.valid) valid++;
      }
      return valid;
    },
    staleTime: Infinity,
  });

  const data: IndexStats | undefined = query.data
    ? {
        ...query.data,
        validityRate:
          validation.data !== undefined && query.data.observations.length > 0
            ? validation.data / query.data.observations.length
            : null,
      }
    : undefined;

  return { data, isLoading: query.isLoading, isFetching: query.isFetching, refetch: query.refetch };
}
