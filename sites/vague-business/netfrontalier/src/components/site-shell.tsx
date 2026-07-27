import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="no-print border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="brand-name text-2xl text-primary">NetFrontalier</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4 text-sm">
          <Link
            to="/calcul"
            className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            activeProps={{ className: "px-3 py-1.5 rounded-md bg-accent text-accent-foreground" }}
          >
            Calculateur
          </Link>
          <Link
            to="/mentions"
            className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
          >
            Mentions
          </Link>
          <Link
            to="/calcul"
            className="ml-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Calculer
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-border/60 mt-24 py-10 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4 md:px-6 grid gap-6 md:grid-cols-3">
        <div>
          <div className="brand-name text-xl text-primary">NetFrontalier</div>
          <p className="mt-2 max-w-xs">
            Calculateur transparent de salaire net pour frontaliers travaillant en Suisse.
            Estimation indicative, pas un conseil fiscal.
          </p>
        </div>
        <div>
          <div className="font-medium text-foreground mb-2">Ressources</div>
          <ul className="space-y-1">
            <li><Link to="/calcul" className="hover:text-foreground">Calculateur</Link></li>
            <li><Link to="/mentions" className="hover:text-foreground">Mentions légales</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-foreground mb-2">Pour les pros</div>
          <p>
            <a
              href="mailto:contact@netfrontalier.example?subject=White-label%20fiduciaire"
              className="hover:text-foreground underline underline-offset-2"
            >
              White-label pour RH / fiduciaires — bientôt
            </a>
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 md:px-6 mt-8 text-xs">
        © {new Date().getFullYear()} NetFrontalier — Estimations à titre indicatif.
      </div>
    </footer>
  );
}
