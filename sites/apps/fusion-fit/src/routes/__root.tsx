import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { PHOENIX_FAVICON_DATA_URI } from "@/components/phoenix-logo";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 ff-scanline"
      style={{ background: "var(--ff-bg)", color: "var(--ff-text)" }}
    >
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold" style={{ color: "var(--ff-cyan)" }}>404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page introuvable</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--ff-text-muted)" }}>
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-widest border transition-all"
            style={{ background: "oklch(0.78 0.16 198 / 20%)", borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 ff-scanline"
      style={{ background: "var(--ff-bg)", color: "var(--ff-text)" }}
    >
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Cette page n'a pas pu charger
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ff-text-muted)" }}>
          Une erreur s'est produite. Vous pouvez réessayer ou retourner à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-widest border transition-all"
            style={{ background: "oklch(0.78 0.16 198 / 20%)", borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)", background: "var(--ff-surface)" }}
          >
            Accueil
          </a>
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
      { title: "FusionFit Initiative" },
      { name: "description", content: "Votre coach de routine hybride — Bouger · Respirer · Nourrir" },
      { name: "author", content: "FusionFit" },
      { property: "og:title", content: "FusionFit Initiative" },
      { property: "og:description", content: "Votre coach de routine hybride — Bouger · Respirer · Nourrir" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@FusionFit" },
      { name: "theme-color", content: "#070816" },
      { name: "twitter:title", content: "FusionFit Initiative" },
      { name: "twitter:description", content: "Votre coach de routine hybride — Bouger · Respirer · Nourrir" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/85353931-4938-4739-8bc6-7e2f2276b055/id-preview-9c6b2914--e705317f-4f99-4c11-a9fe-27c38e9abc82.lovable.app-1782395933555.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/85353931-4938-4739-8bc6-7e2f2276b055/id-preview-9c6b2914--e705317f-4f99-4c11-a9fe-27c38e9abc82.lovable.app-1782395933555.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/svg+xml", href: PHOENIX_FAVICON_DATA_URI },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
