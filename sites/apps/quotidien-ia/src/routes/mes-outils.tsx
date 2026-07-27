import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Wrench, ExternalLink, Link2, Lock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EXTERNAL_TOOLS } from "@/lib/modules";
import { filterTools } from "@/lib/tools-filter";
import { useSelectedCategories, useAutoConnectedTools } from "@/hooks/use-subscription";
import { useProfile } from "@/hooks/use-profile";
import { RequireAuth } from "@/components/require-auth";
import { ConnectedAppButton } from "@/components/connected-app-button";
import { CONNECTED_APPS, type ConnectedAppKey } from "@/lib/connected-apps";

// Map "nom d'outil affiché" → clé SSO. Ces outils s'ouvrent via /api/sso (jeton signé) au lieu d'un lien externe brut.
const SSO_TOOLS: Record<string, ConnectedAppKey> = Object.fromEntries(
  CONNECTED_APPS.map((a) => [a.label, a.key]),
);

export const Route = createFileRoute("/mes-outils")({
  head: () => ({
    meta: [
      { title: "Mes outils — Quotidien IA" },
      {
        name: "description",
        content: "Accédez à toutes vos applications Lovable connectées : Finzy, Investlocatif, Paperasse, etc.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ToolsPage />
    </RequireAuth>
  ),
});

// Outils "vitrine" toujours visibles (même si l'abonnement n'y donne pas encore accès).
const TEASER_TOOL_NAMES = new Set(["Finzy"]);

// Teaser interne pour un outil verrouillé.
const TEASER_LINKS: Record<string, string> = {
  Finzy: "/outils/finzy",
};

function ToolsPage() {
  const selected = useSelectedCategories();
  const profile = useProfile();
  const visibleTools = useMemo(() => {
    const allowed = filterTools(selected, profile.workCountry);
    const allowedNames = new Set(allowed.map((t) => t.name));
    // On ajoute les teasers manquants
    const teasers = EXTERNAL_TOOLS.filter(
      (t) => TEASER_TOOL_NAMES.has(t.name) && !allowedNames.has(t.name),
    ).map((t) => ({ ...t, locked: true as const }));
    return [
      ...allowed.map((t) => ({ ...t, locked: false as const })),
      ...teasers,
    ];
  }, [selected, profile.workCountry]);
  const autoTools = useAutoConnectedTools();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        eyebrow="Espace"
        title="Mes outils"
        description="Vos applications spécialisées, accessibles en un clic. Les outils s'affichent en fonction de votre abonnement et de votre profil."
      />

      {autoTools.length > 0 && (
        <div className="rounded-2xl border border-primary/40 bg-primary-soft/30 p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Link2 className="h-4 w-4" /> Connexions automatiques : {autoTools.join(", ")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ces outils sont liés automatiquement à votre compte via votre abonnement. Aucun paramétrage manuel requis.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTools.map((t) => {
          const auto = autoTools.includes(t.name);
          if (t.locked) {
            const teaserHref = TEASER_LINKS[t.name] ?? "/parametres";
            const requiresLabel = (t.requiresCategory ?? []).join(", ");
            return (
              <div
                key={t.name}
                className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-card/60 p-5 shadow-card"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/70 via-background/40 to-transparent" />
                <div className="relative flex items-start justify-between gap-2 opacity-70">
                  <h2 className="font-display text-lg font-bold">{t.name}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t.tag}
                  </span>
                </div>
                <p className="relative text-sm text-muted-foreground opacity-80">{t.description}</p>
                <div className="relative mt-auto flex flex-col gap-3">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    <Lock className="h-3 w-3" /> Réservé à l'option {requiresLabel || "premium"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={teaserHref}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Découvrir {t.name}
                    </Link>
                    <Link
                      to="/parametres"
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      Débloquer
                    </Link>
                  </div>
                </div>
              </div>
            );
          }
          const ssoKey = SSO_TOOLS[t.name];
          return (
            <div
              key={t.name}
              className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elev"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-bold">{t.name}</h2>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {t.tag}
                  </span>
                  {auto && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      <Link2 className="h-2.5 w-2.5" /> Auto-connecté
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              {ssoKey ? (
                <div className="mt-auto">
                  <ConnectedAppButton app={ssoKey} label={t.name} />
                </div>
              ) : (
                <a
                  href={t.url}
                  target={t.internal ? undefined : "_blank"}
                  rel={t.internal ? undefined : "noreferrer"}
                  className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Ouvrir <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
