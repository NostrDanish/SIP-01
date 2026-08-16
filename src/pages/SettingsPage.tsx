import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { AppRelayManager } from '@/components/AppRelayManager';
import { Callout, Pill } from '@/components/doc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_RELAYS } from '@/lib/appRelays';
import { useSeoMeta } from '@/lib/seo';

export default function SettingsPage() {
  useSeoMeta({
    title: 'SIP-01 Settings — app relay list',
    description: 'Choose which relays this site reads the SIP-01 index from. One app relay list: fully editable, stored in your browser, resettable to the ecosystem defaults. Never published to Nostr.',
  });

  return (
    <Layout>
      <div className="container max-w-3xl py-12 md:py-16">
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">local-first</Pill>
            <Pill tone="opt">stored in this browser</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Relay Settings</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Relays come and go — this is <strong className="text-foreground">the app relay list</strong>, every
            relay the <Link to="/dashboard" className="text-primary hover:underline">dashboard</Link> and{' '}
            <Link to="/explorer" className="text-primary hover:underline">explorer</Link> read the SIP-01 index
            from. Add, remove, or disable any of them; changes take effect immediately. If it stops feeling
            right, one click restores the defaults.
          </p>
        </header>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Radio className="size-4 text-primary" /> App relay list
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AppRelayManager />
            </CardContent>
          </Card>

          <Callout kind="info" title="What the defaults cover">
            The default {APP_RELAYS.relays.length}-relay list is the union of the known crawler publish pools
            (Crawlstr + indexstr) and the NIP-50 search relays — everywhere the ecosystem is known to write
            kind 39697 today, plus a general fallback. Any relay can host observations, so adding your own
            sources only widens the net. Each relay's contribution shows up in the dashboard's{' '}
            <Link to="/dashboard" className="text-primary hover:underline">coverage panel</Link>.
          </Callout>

          <Callout kind="info" title="Local only — nothing is published">
            This list lives in your browser's storage and is never published to Nostr or tied to any account.
            It doesn't touch your NIP-65 relay list, and logging in (anywhere) won't overwrite it. Clearing
            browser data — or the reset button — returns you to the shipped defaults.
          </Callout>
        </div>
      </div>
    </Layout>
  );
}
