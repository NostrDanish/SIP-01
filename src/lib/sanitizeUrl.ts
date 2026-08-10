/**
 * Sanitize an untrusted URL string (from Nostr events) for use as href/src.
 * Allows only http: and https: — everything else returns undefined.
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}
