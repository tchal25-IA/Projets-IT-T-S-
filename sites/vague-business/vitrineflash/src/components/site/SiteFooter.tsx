import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-brand text-2xl font-black">VitrineFlash</div>
            <p className="mt-2 text-sm text-primary-foreground/70">
              Refonte de site vitrine en 48h pour les commerces et TPE en Suisse et en France.
            </p>
          </div>
          <div className="text-sm">
            <div className="mb-3 font-semibold text-accent">Navigation</div>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/" className="hover:text-accent">Accueil</Link></li>
              <li><Link to="/tarifs" className="hover:text-accent">Tarifs</Link></li>
              <li><Link to="/brief" className="hover:text-accent">Demander ma refonte</Link></li>
              <li><Link to="/mentions" className="hover:text-accent">Mentions légales</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="mb-3 font-semibold text-accent">Contact</div>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>hello@vitrineflash.ch</li>
              <li>Suisse Romande + France</li>
              <li>Rép. sous 24h</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} VitrineFlash. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
