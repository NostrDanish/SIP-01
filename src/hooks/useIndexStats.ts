/**
 * Live SIP-01 index statistics.
 *
 * Everything is derived from the events themselves — no hardcoded indexer
 * registry. Any crawler that starts publishing valid kind 39697 observations
 * (or kind 16919 heartbeats) appears on the dashboard automatically, which is
 * the point: Crwalstr, indexstr, and every future indexer share one pool.
 */
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

import { SIP01 } from '@/lib/sip01';
import { SEARCH_RELAYS } from '@/lib/sip01';
import { parseSip01Event, validateSip01Event, type Sip01Observation } from '@/lib/sip01-utils';
import {
  dedupeHeartbeats,
  isNodeLive,
  HEARTBEAT_KIND,
  type ParsedHeartbeat,
} from '@/lib/heartbeat';

/** Pages of 500 observations walked backwards from "now". */
const OBS_PAGES = 4;
const PAGE_SIZE = 500;

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
  /** Heartbeat network view (kind 16919), latest per node. */
  heartbeats: ParsedHeartbeat[];
  liveNodes: ParsedHeartbeat[];
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
      const group = nostr.group(SEARCH_RELAYS);
      const [obsSettled, poolSettled, hbSettled, hbPoolSettled] = await Promise.allSettled([
        fetchObservationWindow((f, o) => group.query(f as never, o), c.signal),
        fetchObservationWindow((f, o) => nostr.query(f as never, o), c.signal),
        group.query([{ kinds: [HEARTBEAT_KIND], limit: 500 }], { signal: c.signal }),
        nostr.query([{ kinds: [HEARTBEAT_KIND], limit: 500 }], { signal: c.signal }),
      ]);

      const obsEvents = [
        ...(obsSettled.status === 'fulfilled' ? obsSettled.value : []),
        ...(poolSettled.status === 'fulfilled' ? poolSettled.value : []),
      ];
      const hbEvents = [
        ...(hbSettled.status === 'fulfilled' ? hbSettled.value : []),
        ...(hbPoolSettled.status === 'fulfilled' ? hbPoolSettled.value : []),
      ];

      const byId = new Map(obsEvents.map((e) => [e.id, e]));
      const observations = [...byId.values()]
        .map(parseSip01Event)
        .filter((o): o is Sip01Observation => o !== null)
        .sort((a, b) => b.observedAt - a.observedAt);

      const hbById = new Map(hbEvents.map((e) => [e.id, e]));
      const heartbeats = dedupeHeartbeats([...hbById.values()]);
      const now = Math.floor(Date.now() / 1000);
      const liveNodes = heartbeats.filter((hb) => isNodeLive(hb, now));

      /* ---- aggregates ---- */
      const docs = new Set(observations.map((o) => o.d));
      const hostSet = new Set(observations.map((o) => o.host));
      const indexerMap = new Map<string, IndexerStat>();

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
        heartbeats,
        liveNodes,
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
