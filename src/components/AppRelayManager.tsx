import { useState } from 'react';
import { Plus, RotateCcw, Wifi, WifiOff, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';
import { APP_RELAYS } from '@/lib/appRelays';

function normalizeRelayUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  for (const candidate of [trimmed, `wss://${trimmed}`]) {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'wss:' || url.protocol === 'ws:') return url.toString();
    } catch {
      /* try next */
    }
  }
  return null;
}

function renderRelayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'wss:' || parsed.protocol === 'ws:') {
      return parsed.pathname === '/' ? parsed.host : parsed.host + parsed.pathname;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

/**
 * The app relay list manager. One list, fully editable: every relay the site
 * reads the SIP-01 index from. Stored in the browser (AppContext), effective
 * immediately, never published to Nostr. "Reset" restores the shipped default
 * (the ecosystem read set from APP_RELAYS).
 */
export function AppRelayManager() {
  const { config, updateConfig } = useAppContext();
  const { toast } = useToast();
  const [newRelayUrl, setNewRelayUrl] = useState('');

  const relays = config.relayMetadata.relays;
  const enabledCount = relays.filter((r) => r.read).length;

  const saveRelays = (next: { url: string; read: boolean; write: boolean }[]) => {
    updateConfig((current) => ({
      ...current,
      relayMetadata: { relays: next, updatedAt: Math.floor(Date.now() / 1000) },
    }));
  };

  const handleAdd = () => {
    const normalized = normalizeRelayUrl(newRelayUrl);
    if (!normalized) {
      toast({
        title: 'Invalid relay URL',
        description: 'Enter a valid relay URL (e.g. wss://relay.example.com)',
        variant: 'destructive',
      });
      return;
    }
    if (relays.some((r) => r.url === normalized)) {
      toast({ title: 'Relay already in the list', variant: 'destructive' });
      return;
    }
    saveRelays([...relays, { url: normalized, read: true, write: false }]);
    setNewRelayUrl('');
    toast({ title: 'Relay added', description: renderRelayUrl(normalized) });
  };

  const handleRemove = (url: string) => {
    saveRelays(relays.filter((r) => r.url !== url));
  };

  const handleToggle = (url: string) => {
    saveRelays(relays.map((r) => (r.url === url ? { ...r, read: !r.read } : r)));
  };

  const handleReset = () => {
    saveRelays(APP_RELAYS.relays);
    toast({
      title: 'Reset to app defaults',
      description: `${APP_RELAYS.relays.length} relays restored — the full ecosystem read set.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {relays.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No relays configured — the dashboard and explorer won't find anything. Add a relay below or reset to
            the app defaults.
          </div>
        )}
        {relays.map((relay) => (
          <div
            key={relay.url}
            className="flex items-center gap-3 p-3 rounded-md border bg-muted/20"
          >
            {relay.read ? (
              <Wifi className="h-4 w-4 text-emerald-500 shrink-0" aria-label="enabled" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" aria-label="disabled" />
            )}
            <span className="font-mono text-sm flex-1 truncate" title={relay.url}>
              {renderRelayUrl(relay.url)}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Label htmlFor={`enable-${relay.url}`} className="text-xs text-muted-foreground cursor-pointer">
                read
              </Label>
              <Switch
                id={`enable-${relay.url}`}
                checked={relay.read}
                onCheckedChange={() => handleToggle(relay.url)}
                className="data-[state=checked]:bg-emerald-500 scale-90"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(relay.url)}
              className="size-6 text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
              aria-label={`Remove ${renderRelayUrl(relay.url)}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="new-relay-url" className="sr-only">
            Relay URL
          </Label>
          <Input
            id="new-relay-url"
            placeholder="wss://relay.example.com"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            className="font-mono text-sm"
            spellCheck={false}
          />
        </div>
        <Button onClick={handleAdd} disabled={!newRelayUrl.trim()} variant="outline" size="sm" className="h-10 shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add relay
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground font-mono">
          {enabledCount} of {relays.length} enabled
        </p>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-muted-foreground">
          <RotateCcw className="size-3.5" />
          Reset to app defaults
        </Button>
      </div>
    </div>
  );
}
