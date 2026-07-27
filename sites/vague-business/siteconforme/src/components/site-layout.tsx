import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span>SiteConforme</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <Link to="/" hash="packages" className="hover:text-foreground">Packages</Link>
            <Link to="/checklist" className="hover:text-foreground">Checklist</Link>
            <Link to="/" hash="faq" className="hover:text-foreground">FAQ</Link>
            <Link to="/mentions" className="hover:text-foreground">Mentions</Link>
          </nav>
          <Link
            to="/demander"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Demander un audit
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/70 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-10 grid gap-6 md:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck className="h-4 w-4 text-accent" /> SiteConforme
            </div>
            <p className="mt-2 max-w-xs">
              Mise en conformité RGPD / nLPD pour sites vitrines et e-commerce PME (FR / CH).
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-foreground font-medium">Ressources</div>
            <Link to="/checklist" className="block hover:text-foreground">Checklist publique</Link>
            <a
              href="https://conformia-audit.lovable.app"
              target="_blank"
              rel="noreferrer"
              className="block hover:text-foreground"
            >
              Audit self-serve Conformia ↗
            </a>
            <Link to="/mentions" className="block hover:text-foreground">Mentions légales</Link>
          </div>
          <div className="space-y-2 md:text-right">
            <div className="text-foreground font-medium">Disclaimer</div>
            <p>
              SiteConforme n'est pas un cabinet d'avocats. Nos livrables ne constituent pas un conseil juridique.
            </p>
          </div>
        </div>
        <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SiteConforme
        </div>
      </footer>
    </div>
  );
}

export const CHECKLIST_ITEMS = [
  { title: "Bandeau cookies conforme", desc: "Consentement explicite, refus aussi simple qu'accepter, catégories dépliées." },
  { title: "Mentions légales à jour", desc: "Éditeur, hébergeur, contact, SIRET / IDE, directeur de publication." },
  { title: "Politique de confidentialité", desc: "Finalités, bases légales, durées, droits RGPD / nLPD, DPO." },
  { title: "Formulaires conformes", desc: "Case de consentement non pré-cochée, mention finalité, lien politique." },
  { title: "Trackers & scripts tiers", desc: "GA4, Meta Pixel, Hotjar : bloqués tant que consentement non donné." },
  { title: "Registre des traitements", desc: "Modèle prêt à compléter (art. 30 RGPD / art. 12 nLPD)." },
  { title: "Sous-traitants & DPA", desc: "Recensement Stripe, Mailchimp, hébergeur, avec clauses DPA." },
  { title: "Transferts hors UE / CH", desc: "Identification et clauses contractuelles types si applicable." },
  { title: "Sécurité de base", desc: "HTTPS forcé, headers sécurité, sauvegardes, comptes admin." },
  { title: "Droits des personnes", desc: "Procédure accès / effacement / opposition documentée." },
];

export const PACKAGES = [
  {
    name: "Flash",
    price: "390 €",
    tagline: "Audit express + rapport PDF",
    features: [
      "Audit checklist 10 points",
      "Rapport PDF prêt à partager",
      "Liste priorisée de correctifs",
      "Livraison sous 5 jours",
    ],
    cta: "Choisir Flash",
  },
  {
    name: "Fix",
    price: "690 €",
    tagline: "Le populaire — on corrige l'essentiel",
    features: [
      "Tout le pack Flash",
      "Bandeau cookies conforme installé",
      "Templates mentions légales rédigés",
      "Blocage scripts tiers avant consentement",
    ],
    cta: "Choisir Fix",
    highlight: true,
  },
  {
    name: "Full",
    price: "990 €",
    tagline: "Site remis à niveau de bout en bout",
    features: [
      "Tout le pack Fix",
      "Formulaires conformes (consent + finalité)",
      "Politique de confidentialité sur-mesure",
      "Revue de suivi à 30 jours",
    ],
    cta: "Choisir Full",
  },
];