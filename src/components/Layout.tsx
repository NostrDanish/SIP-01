import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun, Code2, Menu, X } from 'lucide-react';
import { useState } from 'react';

import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { SIP01 } from '@/lib/sip01';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/spec', label: 'Specification' },
  { to: '/registry', label: 'Tag Registry' },
  { to: '/query', label: 'Query Reference' },
  { to: '/explorer', label: 'Explorer' },
  { to: '/audit', label: 'Audit' },
  { to: '/implementations', label: 'Implementations' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/icon.webp" alt="SIP-01 logo" className="size-9 rounded-md ring-1 ring-border" />
            <div className="leading-tight">
              <div className="font-mono font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                SIP-01
              </div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">
                Search Index Protocol
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline-flex font-mono text-xs text-muted-foreground border border-border rounded-md px-2 py-1">
              kind <span className="text-primary font-semibold ml-1">{SIP01.kind}</span>
            </span>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/NostrDanish/0xSearchstr/blob/main/docs/SEARCH_INDEX_PROTOCOL.md"
                target="_blank"
                rel="noreferrer"
                aria-label="SIP-01 on GitHub"
              >
                <Code2 className="size-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden border-t border-border/70" aria-label="Mobile">
            <div className="container py-2 flex flex-col">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 mt-24">
        <div className="container py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/icon.webp" alt="" className="size-7 rounded ring-1 ring-border" />
              <span className="font-mono font-bold text-sm">SIP-01</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {SIP01.tagline}
            </p>
          </div>
          <div className="text-sm">
            <div className="font-semibold mb-3 text-foreground">Protocol</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link className="hover:text-primary transition-colors" to="/spec">Specification (v{SIP01.version})</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/registry">Tag registry</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/query">Query reference</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/audit">Audit report</Link></li>
              <li><a className="hover:text-primary transition-colors" href="/spec/SIP-01.md" target="_blank" rel="noreferrer">Raw markdown</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-semibold mb-3 text-foreground">Ecosystem</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><a className="hover:text-primary transition-colors" href="https://github.com/NostrDanish/UNCAGED-Index-Relay" target="_blank" rel="noreferrer">UNCAGED Index Relay</a></li>
              <li><a className="hover:text-primary transition-colors" href="https://github.com/NostrDanish/Crwalstr" target="_blank" rel="noreferrer">Crwalstr crawler</a></li>
              <li><a className="hover:text-primary transition-colors" href="https://github.com/NostrDanish/UNCAGED-ENGINE" target="_blank" rel="noreferrer">UNCAGED-ENGINE</a></li>
              <li><a className="hover:text-primary transition-colors" href="https://github.com/NostrDanish/0xSearchstr" target="_blank" rel="noreferrer">0xSearchstr</a></li>
              <li><a className="hover:text-primary transition-colors" href="https://github.com/NostrDanish/0xPresearchstr" target="_blank" rel="noreferrer">0xPresearchstr</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/70">
          <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="font-mono">kind {SIP01.kind} · v{SIP01.version} · draft</span>
            <a
              href="https://shakespeare.diy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              Vibed with Shakespeare
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
