import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Mise en page commune aux pages légales (mentions, confidentialité, CGU, cookies).
 * Les zones entre crochets [À COMPLÉTER : …] doivent être renseignées par l'éditeur
 * avant la mise en ligne publique.
 */
export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
      </Link>

      <header className="space-y-1 border-b pb-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
      </header>

      <div className="legal-prose space-y-6 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>

      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-xs text-muted-foreground">
        <Link to="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
        <Link to="/confidentialite" className="hover:text-foreground">Politique de confidentialité</Link>
        <Link to="/cgu" className="hover:text-foreground">CGU</Link>
        <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
      </nav>
    </div>
  );
}

/** Titre de section légale. */
export function LegalSection({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold text-foreground">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

/** Encart « à compléter » mis en évidence pour l'éditeur. */
export function ToFill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 py-0.5 font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      [À COMPLÉTER : {children}]
    </span>
  );
}
