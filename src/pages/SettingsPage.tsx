import { Link } from 'react-router-dom';
import { Radio, Server } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { LoginArea } from '@/components/auth/LoginArea';
import { RelayListManager } from '@/components/RelayListManager';
import { Callout, Pill } from '@/components/doc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { OBSERVATION_RELAYS } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';

export default function SettingsPage() {
  useSeoMeta({
    title: 'SIP-01 Settings — relay list',
    description: 'Choose which Nostr relays this site reads the SIP-01 index from. Relays change — your list is stored locally, and synced over Nostr (NIP-65) when you log in.',
  });

  const { user } = useCurrentUser();

  return (
    <Layout>
      <div className="container max-w-3xl py-12 md:py-16">
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">local-first</Pill>
            <Pill tone="opt">NIP-65</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Relay Settings</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Relays come and go — point this site at the ones you trust. Your list is stored in this browser,
            takes effect immediately on the <Link to="/dashboard" className="text-primary hover:underline">dashboard</Link>{' '}
            and <Link to="/explorer" className="text-primary hover:underline">explorer</Link>, and is published as
            a NIP-65 relay list (kind 10002) when you're logged in.
          </p>
        </header>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Radio className="size-4 text-primary" /> Your relays
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <RelayListManager />
              <div className="border-t border-border/60 pt-5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Sync with Nostr
                </div>
                {user ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Logged in — every change above is also published as your NIP-65 relay list, so your other
                    Nostr apps see the same relays.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <LoginArea className="max-w-48" />
                    <p className="text-sm text-muted-foreground">
                      optional — log in to sync this list to your other Nostr apps
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Server className="size-4 text-primary" /> Always-on ecosystem reads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Independently of your list, the dashboard and explorer always read the union of the known
                crawler publish pools (Crawlstr + indexstr) and the NIP-50 search relays — kind 39697 lives on
                any relay, and this set is where the ecosystem publishes today. Your relays are merged on top as
                the <span className="font-mono text-xs">your relay pool</span> row in the dashboard's coverage
                panel. If one of these dies, it gets updated with the site.
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {OBSERVATION_RELAYS.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2.5 rounded-lg border border-border/70 px-3.5 py-2"
                  >
                    <span className="size-1.5 rounded-full bg-primary/70 shrink-0" aria-hidden />
                    <span className="font-mono text-xs truncate" title={url}>
                      {url.replace(/^wss:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Callout kind="info" title="This site never publishes to your relays">
            SIP-01's documentation site is read-only: no observations, no heartbeats, nothing signed by you is
            ever broadcast. The read/write switches only matter if you publish the list (NIP-65) for your other
            apps — and for engines or crawlers you run yourself against the same account.
          </Callout>
        </div>
      </div>
    </Layout>
  );
}
