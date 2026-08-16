import type { RelayMetadata } from '@/contexts/AppContext';

/**
 * App default relays. Used as the initial `relayMetadata` for new users and as
 * a fallback when the user has no NIP-65 relay list configured (e.g. during
 * nostrconnect handshakes before any user relays have been loaded).
 */
export const APP_RELAYS: RelayMetadata = {
  relays: [
    { url: 'wss://relay.ditto.pub/', read: true, write: true },
    { url: 'wss://relay.dreamith.to/', read: true, write: true },
    // This site is read-heavy (dashboard + explorer): primal and nos.lol are
    // also crawler publish targets, so they default to readable here.
    { url: 'wss://relay.primal.net/', read: true, write: true },
    { url: 'wss://nos.lol/', read: true, write: true },
  ],
  updatedAt: 0,
};
