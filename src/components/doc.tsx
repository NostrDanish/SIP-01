import { useState } from 'react';
import { Check, Copy, Info, AlertTriangle, ShieldCheck, Hash } from 'lucide-react';

import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Code block with copy                                                */
/* ------------------------------------------------------------------ */

export function CodeBlock({ code, title, className }: { code: string; title?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn('rounded-lg border border-border bg-[hsl(24_14%_6.5%)] overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/70">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {title ?? 'json'}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-0.5"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto scrollbar-thin-x text-[13px] leading-relaxed font-mono text-[hsl(40_20%_88%)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Anchored spec section                                               */
/* ------------------------------------------------------------------ */

export function DocSection({
  id,
  number,
  title,
  children,
  className,
}: {
  id: string;
  number?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-24 group', className)}>
      <h2 className="text-2xl md:text-[28px] font-bold tracking-tight mb-4 flex items-baseline gap-3">
        {number && (
          <span className="font-mono text-primary text-lg md:text-xl font-semibold shrink-0">{number}</span>
        )}
        <span>{title}</span>
        <a
          href={`#${id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary focus-visible:opacity-100"
          aria-label={`Link to ${title}`}
        >
          <Hash className="size-4" />
        </a>
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Callouts                                                            */
/* ------------------------------------------------------------------ */

const CALLOUT_STYLES = {
  info: { icon: Info, cls: 'border-primary/40 bg-primary/[0.06]', iconCls: 'text-primary' },
  warn: { icon: AlertTriangle, cls: 'border-amber-500/40 bg-amber-500/[0.07]', iconCls: 'text-amber-500' },
  ok: { icon: ShieldCheck, cls: 'border-emerald-500/40 bg-emerald-500/[0.06]', iconCls: 'text-emerald-500' },
};

export function Callout({
  kind = 'info',
  title,
  children,
}: {
  kind?: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, cls, iconCls } = CALLOUT_STYLES[kind];
  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', cls)}>
      <Icon className={cn('size-5 shrink-0 mt-0.5', iconCls)} aria-hidden />
      <div className="text-sm leading-relaxed">
        {title && <div className="font-semibold text-foreground mb-1">{title}</div>}
        <div className="text-foreground/80">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline code                                                         */
/* ------------------------------------------------------------------ */

export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.85em] bg-accent text-accent-foreground rounded px-1.5 py-0.5 border border-border/60">
      {children}
    </code>
  );
}

/* ------------------------------------------------------------------ */
/* Spec table                                                          */
/* ------------------------------------------------------------------ */

export function SpecTable({
  head,
  rows,
  className,
}: {
  head: string[];
  rows: React.ReactNode[][];
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border scrollbar-thin-x', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60">
            {head.map((h) => (
              <th
                key={h}
                className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-2.5 border-b border-border whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-accent/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-foreground/85">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Requirement / status pills                                          */
/* ------------------------------------------------------------------ */

export function Pill({ tone, children }: { tone: 'req' | 'opt' | 'gold' | 'green' | 'red'; children: React.ReactNode }) {
  const tones = {
    req: 'bg-primary/15 text-primary border-primary/30',
    opt: 'bg-muted text-muted-foreground border-border',
    gold: 'bg-primary/15 text-primary border-primary/30',
    green: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/30',
    red: 'bg-red-500/12 text-red-500 border-red-500/30',
  };
  return (
    <span className={cn('inline-flex items-center font-mono text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 whitespace-nowrap', tones[tone])}>
      {children}
    </span>
  );
}
