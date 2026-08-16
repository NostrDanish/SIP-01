import type { RelayMetadata } from '@/contexts/AppContext';
import { OBSERVATION_RELAYS } from '@/lib/sip01';

/**
 * The app relay list — every relay this site reads the SIP-01 index from.
 *
 * The default is the full ecosystem read set: the union of the known crawler
 * publish pools (Crawlstr + indexstr) and the NIP-50 search relays, plus
 * relay.dreamith.to. Visitors can freely edit the list in /settings (it is
 * stored locally, never published to Nostr) and reset back to these defaults.
 *
 * `write` is false throughout: this site is read-only and publishes nothing.
 * The flag only exists because RelayMetadata is the shared template type.
 */
export const APP_RELAYS: RelayMetadata = {
  relays: [...OBSERVATION_RELAYS, 'wss://relay.dreamith.to/'].map((url) => ({
    url,
    read: true,
    write: false,
  })),
  updatedAt: 0,
};
