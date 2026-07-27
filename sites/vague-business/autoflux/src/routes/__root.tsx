import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs tracking-widest text-accent">ERR/404</div>
        <h1 className="mt-2 text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">Cette page n'existe pas.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rechargez la page ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AutoFlux — Packs d'automatisation clé en main pour PME" },
      { name: "description", content: "5 automatisations qui font gagner 5h/semaine. Packs Make & Zapier livrés clé en main pour PME suisses et françaises. Dès 790 €." },
      { property: "og:title", content: "AutoFlux — Automatisations clé en main pour PME" },
      { property: "og:description", content: "Audit + 5 scénarios Make/Zapier livrés en 10 jours. Dès 790 €." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="inline-block h-3 w-3 rotate-45 bg-accent" />
          AutoFlux
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link to="/packs" className="hover:text-accent-foreground/80" activeProps={{ className: "text-accent" }}>Packs</Link>
          <Link to="/cas" activeProps={{ className: "text-accent" }}>Cas clients</Link>
          <Link to="/audit" activeProps={{ className: "text-accent" }}>Audit gratuit</Link>
        </nav>
        <Link
          to="/audit"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Démarrer
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-ink text-bone">
      <div className="container-x grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="inline-block h-3 w-3 rotate-45 bg-accent" />
            AutoFlux
          </div>
          <p className="mt-3 text-sm text-bone/60">
            Packs d'automatisation clé en main. Make, Zapier & compagnie.
          </p>
        </div>
        <div>
          <div className="font-mono text-xs tracking-widest text-bone/50">PRODUIT</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/packs" className="hover:text-accent">Packs</Link></li>
            <li><Link to="/cas" className="hover:text-accent">Cas clients</Link></li>
            <li><Link to="/audit" className="hover:text-accent">Audit gratuit</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-xs tracking-widest text-bone/50">CONTACT</div>
          <ul className="mt-3 space-y-2 text-sm text-bone/70">
            <li>hello@autoflux.io</li>
            <li>Lausanne · Paris</li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-xs tracking-widest text-bone/50">LÉGAL</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/mentions" className="hover:text-accent">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bone/10">
        <div className="container-x flex items-center justify-between py-4 text-xs text-bone/50">
          <span>© {new Date().getFullYear()} AutoFlux</span>
          <span className="font-mono">v1.0 · CH/FR</span>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
