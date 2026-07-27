import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastProvider } from "@/components/toast";

function NotFoundComponent() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Erreur 404</p>
        <h1 className="mt-2 text-4xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Retour à l'accueil
        </Link>
      </div>
    </AppShell>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Quotidien IA — Assistant IA personnel pour vos finances, organisation et vie admin" },
      {
        name: "description",
        content:
          "Quotidien IA : gérez vos finances, fiscalité, tâches, événements et documents avec un assistant IA. Accès à Finzy et Paperasse inclus selon votre abonnement. Disponible en France et en Suisse.",
      },
      { name: "keywords", content: "assistant IA personnel, gestion budget, fiscalité particulier, organisation tâches, agenda intelligent, documents administratifs, Suisse, France, Finzy, Paperasse" },
      { name: "author", content: "Quotidien IA" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Quotidien IA — Assistant IA personnel" },
      {
        property: "og:description",
        content: "Gérez vos finances, votre organisation et votre vie admin avec l'IA. Modules à la carte, abonnement plafonné à 9,99 €/mois.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Quotidien IA — Assistant IA personnel" },
      { name: "twitter:description", content: "Finances, organisation, vie admin et veille — un assistant IA pour tout gérer au quotidien." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/deb0e964-3e64-46cd-8f99-e29df48529b5/id-preview-274d46c0--8ef7f97f-27f0-4a09-ac73-a7342b8b6d09.lovable.app-1779981674209.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/deb0e964-3e64-46cd-8f99-e29df48529b5/id-preview-274d46c0--8ef7f97f-27f0-4a09-ac73-a7342b8b6d09.lovable.app-1779981674209.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('qia:theme');var raw=t?JSON.parse(t):'system';var valid=['light','dark','system'];if(!valid.includes(raw))raw='system';var d=raw==='dark'||(raw==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </AppShell>
      </ToastProvider>
    </ThemeProvider>
  );
}
