import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState, useMemo } from "react";
import { Wallet, ExternalLink, Link2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { OFFICIAL_SOURCES } from "@/lib/modules";
import { filterTools } from "@/lib/tools-filter";
import { useSelectedCategories, useAutoConnectedTools } from "@/hooks/use-subscription";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const BudgetSimulator = lazy(() =>
  import("@/components/budget-simulator").then((m) => ({ default: m.BudgetSimulator }))
);
const MortgageSimulator = lazy(() =>
  import("@/components/mortgage-simulator").then((m) => ({ default: m.MortgageSimulator }))
);




const SimulatorFallback = () => (
  <div className="py-12 text-center text-sm text-muted-foreground">Chargement…</div>
);

export const Route = createFileRoute("/finance/")({
  head: () => ({
    meta: [
      { title: "Finance & fiscalité — Quotidien IA" },
      {
        name: "description",
        content:
          "Budget, crédits, immobilier, épargne, PER et fiscalité FR/CH. Accédez aux outils Finzy, Investlocatif, Impôt CH et plus.",
      },
      { property: "og:title", content: "Finance & fiscalité — Quotidien IA" },
      {
        property: "og:description",
        content: "Vos simulations financières et fiscales, indicatives, avec liens vers les outils dédiés.",
      },
    ],
  }),
  component: FinancePage,
});

type TabId = "budget" | "credits" | "epargne" | "fiscalite-fr" | "fiscalite-ch" | "scenarios";
type TabDef = { id: TabId; label: string; country?: "FR" | "CH" };

const ALL_TABS: TabDef[] = [
  { id: "budget", label: "Quotidien & budget" },
  { id: "credits", label: "Crédits & immobilier" },
  { id: "epargne", label: "Épargne & PER" },
  { id: "fiscalite-fr", label: "Fiscalité FR", country: "FR" },
  { id: "fiscalite-ch", label: "Fiscalité CH", country: "CH" },
  { id: "scenarios", label: "Scénarios" },
];

const TAB_CONTENT: Record<TabId, { title: string; body: string; tool?: string }> = {
  budget: {
    title: "Suivez vos revenus et charges",
    body: "Catégorisez vos dépenses, identifiez vos postes principaux et fixez un objectif d'épargne mensuel. Pour un suivi complet automatisé, ouvrez Finzy.",
    tool: "Finzy",
  },
  credits: {
    title: "Crédits, immobilier et investissement locatif",
    body: "Simulez le coût total d'un crédit, comparez plusieurs scénarios d'achat, calculez la rentabilité d'un bien locatif. Outils dédiés : Finzy (crédit), Investlocatif (locatif).",
    tool: "Investlocatif",
  },
  epargne: {
    title: "Épargne, PER, retraite",
    body: "Estimez votre capital à terme selon vos versements mensuels, votre horizon et un rendement supposé.",
    tool: "Finzy",
  },
  "fiscalite-fr": {
    title: "Fiscalité française — déclarations, frais réels",
    body: "Estimez vos heures supplémentaires défiscalisées et frais réels. Pour toute déclaration officielle, rendez-vous sur impots.gouv.fr. Pour des conseils détaillés, consultez l'agent Fiscaliste dans Paperasse.",
  },
  "fiscalite-ch": {
    title: "Fiscalité suisse / Genève",
    body: "Impôt CH propose une estimation indicative en CHF. Le simulateur officiel AFC reste la référence pour le calcul fédéral, et ge.ch pour l'impôt à la source genevois.",
    tool: "Impôt CH",
  },
  scenarios: {
    title: "Scénarios optimiste / médian / stress",
    body: "C'est l'outil Finzy qui permet de modéliser plusieurs trajectoires (revenus, marchés, charges) à partir des hypothèses de votre profil — optimiste, médian, stress. Ouvrez Finzy pour comparer les scénarios sur 5 ans.",
    tool: "Finzy",
  },
};

function FinancePage() {
  const selected = useSelectedCategories();
  const profile = useProfile();
  const tools = useMemo(() => filterTools(selected, profile.workCountry), [selected, profile.workCountry]);
  const autoTools = useAutoConnectedTools();

  // Onglets filtrés selon pays de travail
  const TABS = useMemo(() => {
    return ALL_TABS.filter((t) => {
      if (!t.country) return true;
      if (profile.workCountry === "CH") return t.country === "CH";
      if (profile.workCountry === "FR") return t.country === "FR";
      return true; // si non renseigné, on montre les deux
    });
  }, [profile.workCountry]);

  const defaultTab: TabId = profile.workCountry === "CH" ? "fiscalite-ch" : "budget";
  const [tab, setTab] = useState<TabId>(defaultTab);
  const activeTab = TABS.find((t) => t.id === tab) ? tab : TABS[0]?.id ?? "budget";
  const content = TAB_CONTENT[activeTab];
  const tool = tools.find((t) => t.name === content.tool);
  const currency = profile.workCountry === "CH" ? "CHF" : "€";


  return (
    <div className="space-y-8">
      <PageHeader
        icon={Wallet}
        eyebrow="Module"
        title="Finance & fiscalité"
        description={`Budget, crédits, immobilier, épargne, fiscalité ${profile.workCountry === "CH" ? "suisse (CHF, équivalent EUR indicatif)" : profile.workCountry === "FR" ? "française" : "FR et CH"}. Simulations indicatives.`}
      />

      <Disclaimer variant="finance" />

      {/* Onglets */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeTab === t.id
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "border bg-card hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-auto rounded-full border bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Devise · {currency}
          </span>
        </div>

        {activeTab === "budget" ? (
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <Suspense fallback={<SimulatorFallback />}>
              <BudgetSimulator />
            </Suspense>
          </div>
        ) : activeTab === "credits" ? (
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <Suspense fallback={<SimulatorFallback />}>
              <MortgageSimulator />
            </Suspense>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">{content.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content.body}</p>
            {tool && (
              <a
                href={tool.url}
                target={tool.internal ? undefined : "_blank"}
                rel={tool.internal ? undefined : "noreferrer"}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card"
              >
                Ouvrir {tool.name} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </section>

      {/* Connexions automatiques */}
      {autoTools.length > 0 && (
        <section className="rounded-2xl border border-primary/40 bg-primary-soft/30 p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Link2 className="h-4 w-4" /> Connexions automatiques actives
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Grâce à votre abonnement, les outils suivants sont déjà liés à votre compte : {autoTools.join(", ")}.
          </p>
        </section>
      )}

      {/* Mes outils */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Mes outils</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (

            <a
              key={t.name}
              href={t.url}
              target={t.internal ? undefined : "_blank"}
              rel={t.internal ? undefined : "noreferrer"}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.name}</span>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                  {t.tag}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Ouvrir <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Sources officielles */}
      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Sources officielles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour toute décision engageant votre responsabilité, consultez ces sources de référence.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {OFFICIAL_SOURCES.filter(
            (s) => !s.country || !profile.workCountry || s.country === profile.workCountry,
          ).map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
