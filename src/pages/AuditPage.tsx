import { AlertTriangle, Bug, CheckCircle2, Info } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { C, Callout, CodeBlock, DocSection, Pill } from '@/components/doc';
import { AUDIT_FINDINGS, AUDIT_VERIFIED, REPOS } from '@/lib/sip01';
import { useSeoMeta } from '@/lib/seo';
import { cn } from '@/lib/utils';

const SEVERITY = {
  bug: { icon: Bug, label: 'bug', cls: 'text-red-500 bg-red-500/10 border-red-500/30' },
  warning: { icon: AlertTriangle, label: 'warning', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  note: { icon: Info, label: 'note', cls: 'text-sky-500 bg-sky-500/10 border-sky-500/30' },
};

export default function AuditPage() {
  useSeoMeta({
    title: 'SIP-01 Audit — cross-implementation fact-check & bug report',
    description: 'The SIP-01 audit: every claim in the spec verified against the four shipping implementations and the official NIP registry, with all bugs found and how v1.1 resolves them.',
  });

  const bugs = AUDIT_FINDINGS.filter((f) => f.severity === 'bug').length;
  const warnings = AUDIT_FINDINGS.filter((f) => f.severity === 'warning').length;
  const notes = AUDIT_FINDINGS.filter((f) => f.severity === 'note').length;

  return (
    <Layout>
      <div className="container max-w-5xl py-12 md:py-16">
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Pill tone="gold">audit</Pill>
            <Pill tone="opt">2026-08 · v1 → v1.1</Pill>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Fact-Check &amp; Audit</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Every normative claim in SIP-01 v1 was verified against the four shipping implementations and the
            official NIP registry. Ten claims held. Nine findings resulted — two genuine bugs — and each is
            resolved or explicitly documented in v1.1.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 text-xs font-mono">
              <CheckCircle2 className="size-3.5" /> {AUDIT_VERIFIED.length} verified
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-500 px-3 py-1.5 text-xs font-mono">
              <Bug className="size-3.5" /> {bugs} bugs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 px-3 py-1.5 text-xs font-mono">
              <AlertTriangle className="size-3.5" /> {warnings} warnings
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-500 px-3 py-1.5 text-xs font-mono">
              <Info className="size-3.5" /> {notes} notes
            </span>
          </div>
        </header>

        <div className="space-y-14">
          <DocSection id="method" number="1" title="Method">
            <p>Five repositories were cloned and read end-to-end:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              {REPOS.map((r) => (
                <li key={r.name}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="font-mono text-sm text-primary hover:underline">
                    {r.name}
                  </a>{' '}
                  <span className="text-muted-foreground">— {r.role}</span>
                </li>
              ))}
            </ul>
            <p>
              The v1 specification (<C>docs/SEARCH_INDEX_PROTOCOL.md</C>) was diffed across repos, its claims
              cross-checked against the official NIPs index and kind registry, and the reference implementations
              (<C>webIndex.ts</C> ×3, <C>web-document.ts</C> in the relay) compared line by line for behavioral
              drift. All test-vector hashes were recomputed independently.
            </p>
          </DocSection>

          <DocSection id="verified" number="2" title="Verified claims">
            <div className="rounded-xl border border-border overflow-hidden">
              {AUDIT_VERIFIED.map((v, i) => (
                <div
                  key={v.claim}
                  className={cn(
                    'flex gap-3.5 p-4 bg-card',
                    i !== AUDIT_VERIFIED.length - 1 && 'border-b border-border/60',
                  )}
                >
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <div className="font-medium text-sm">{v.claim}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{v.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="findings" number="3" title="Findings & resolutions">
            <div className="space-y-5">
              {AUDIT_FINDINGS.map((f) => {
                const sev = SEVERITY[f.severity];
                return (
                  <div key={f.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border/60 bg-muted/40">
                      <span className={cn('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider', sev.cls)}>
                        <sev.icon className="size-3.5" /> {sev.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{f.id} · {f.area}</span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold mb-2">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{f.detail}</p>
                      <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/25 px-4 py-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-emerald-500 block mb-1">Resolution in v1.1</span>
                        <p className="text-sm text-foreground/85 leading-relaxed">{f.resolution}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DocSection>

          <DocSection id="headline-bug" number="4" title="The headline bug, reproduced">
            <p>
              The v1 spec’s own example event would be <strong className="text-foreground">rejected by the
              ecosystem’s relay</strong>. Its <C>d</C> tag was <C>widx:9f86d081884c7d659a2feaa0c55ad015</C> —
              recognizable as the SHA-256 of the string <C>"test"</C> — and its <C>x</C> tag was{' '}
              <C>e3b0c442…</C>, the SHA-256 of the empty string. Placeholders masquerading as a valid event.
            </p>
            <CodeBlock
              title="relay's verdict on the v1 example"
              code={`OK <id> false invalid: d tag does not match the normalized u tag (widx: + sha256(u)[0:32])`}
            />
            <Callout kind="ok" title="Fixed">
              v1.1 replaces every placeholder with real, reproducible values (spec §13) and adds a test-vector
              table so any implementer can byte-check their normalization and hashing against the reference
              without running anyone’s code.
            </Callout>
          </DocSection>

          <DocSection id="submission" number="5" title="NIP submission readiness">
            <p>
              The NIPs repo bar is: implemented in at least two clients and one relay, makes sense, optional and
              backwards-compatible, one way of doing each thing. SIP-01 v1.1’s position:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong className="text-foreground">Implementations:</strong> two engines (0xSearchstr,
                0xPresearchstr), one template (UNCAGED-ENGINE), one crawler (Crwalstr), one relay
                (UNCAGED-Index-Relay) — exceeds the bar.
              </li>
              <li>
                <strong className="text-foreground">Backwards-compatible:</strong> pure additive kind; unaware
                relays/clients simply store or ignore it.
              </li>
              <li>
                <strong className="text-foreground">One way per thing:</strong> one kind, one identity formula,
                one content hash — the registry channels variation into documented extension tags.
              </li>
              <li>
                <strong className="text-foreground">Reviewer risks, pre-answered:</strong> the <C>x</C>/NIP-94
                semantic difference, the <C>published</C>/<C>published_at</C> naming, and the required{' '}
                <C>alt</C> tag vs. NIP-31’s unrecommended status are each addressed in §12 before they can be
                raised.
              </li>
            </ul>
          </DocSection>
        </div>
      </div>
    </Layout>
  );
}
