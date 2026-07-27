import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={"brand-serif text-2xl font-bold text-primary " + className}>
      TipShare
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border/60 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Brand />
          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/app">Journée</NavLink>
            <NavLink to="/app/equipe">Équipe</NavLink>
            <NavLink to="/app/historique">Historique</NavLink>
            <NavLink to="/app/parametres">Réglages</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <footer className="no-print mx-auto max-w-5xl px-4 py-10 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} TipShare — Répartition équitable des pourboires</span>
          <Link to="/mentions" className="hover:text-primary">Mentions légales</Link>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/app" }}
      className="rounded-md px-3 py-2 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "bg-secondary text-primary font-semibold" }}
    >
      {children}
    </Link>
  );
}
