import { Link } from "@tanstack/react-router";
import { useCompare } from "@/lib/compare-store";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { ids } = useCompare();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="brand-serif text-2xl font-semibold text-primary">FiduciaFind</span>
          <span className="text-xs text-muted-foreground">.ch</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/recherche" className="text-foreground/80 hover:text-foreground">
            Rechercher
          </Link>
          <Link to="/pour-fiduciaires" className="text-foreground/80 hover:text-foreground">
            Pour les fiduciaires
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {ids.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link to="/comparer">Comparer ({ids.length})</Link>
            </Button>
          )}
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/recherche">Trouver un fiduciaire</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="brand-serif text-2xl">FiduciaFind</div>
          <p className="mt-2 text-sm text-primary-foreground/70">
            Le comparateur suisse romand des fiduciaires pour indépendants et PME.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-medium">Navigation</div>
          <ul className="space-y-1 text-primary-foreground/80">
            <li><Link to="/recherche" className="hover:text-accent">Rechercher</Link></li>
            <li><Link to="/pour-fiduciaires" className="hover:text-accent">Pour les fiduciaires</Link></li>
            <li><Link to="/mentions" className="hover:text-accent">Mentions légales</Link></li>
          </ul>
        </div>
        <div className="text-sm text-primary-foreground/70">
          <div className="mb-2 font-medium text-primary-foreground">Note</div>
          Démo MVP. Les fiduciaires listées sont fictives et ne représentent pas de vraies entreprises.
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} FiduciaFind — Genève · Lausanne · Sion
      </div>
    </footer>
  );
}
