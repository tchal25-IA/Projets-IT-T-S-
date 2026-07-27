import { createFileRoute, Link } from "@tanstack/react-router";
import { questions, categories } from "@/lib/complianceEngine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conformia — Audit RGPD & nLPD en 15 minutes pour PME" },
      {
        name: "description",
        content:
          "Évaluez votre conformité RGPD (France) et nLPD (Suisse) en 15 minutes. Score, plan d'actions prioritaires et export PDF. Sans consultant.",
      },
      { property: "og:title", content: "Conformia — Audit RGPD & nLPD en 15 minutes" },
      {
        property: "og:description",
        content: "Questionnaire guidé, score, plan d'actions et PDF. Pensé pour les PME françaises et suisses.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/50 to-background">
        <div className="container-tight grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div>
            <p className="mb-4 inline-block rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              France · Suisse · PME
            </p>
            <h1 className="text-5xl leading-tight text-primary md:text-6xl">
              Audit RGPD &amp; nLPD
              <br />
              <span className="text-accent">en 15 minutes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Répondez à {questions.length} questions guidées. Recevez un score de conformité, un plan
              d'actions prioritaires et un rapport PDF prêt à partager en interne.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/audit"
                className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Lancer mon audit gratuit
              </Link>
              <Link
                to="/resultat"
                search={{ demo: 1 }}
                className="inline-flex items-center rounded-md border border-border bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Voir un exemple de résultat
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Sans compte · Vos réponses restent dans votre navigateur.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="brand text-xl text-primary">Ce que vous obtenez</h3>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                Un score global de 0 à 100 et une note A–E
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                Un détail par catégorie ({categories.length} domaines couverts)
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                Un top 5 des actions prioritaires, concrètes
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                Un rapport PDF imprimable
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-tight py-20">
        <h2 className="brand text-3xl text-primary md:text-4xl">Un audit structuré, sans jargon.</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Les questions sont regroupées en {categories.length} catégories couvrant les obligations essentielles du
          RGPD (UE/France) et de la nLPD (Suisse, en vigueur depuis septembre 2023).
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-accent">
                0{i + 1}
              </div>
              <div className="mt-2 brand text-lg text-primary">{c.short}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container-tight py-20">
          <h2 className="brand text-3xl text-primary md:text-4xl">Tarifs</h2>
          <p className="mt-3 text-muted-foreground">
            Un consultant facture entre 390 et 990 € pour un premier diagnostic. Conformia démarre à zéro.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <PricingCard
              name="Gratuit"
              price="0 €"
              tag="Score de base"
              features={["Questionnaire complet", "Score global A–E", "Top 5 actions prioritaires"]}
              cta="Commencer"
              highlight={false}
            />
            <PricingCard
              name="Pack"
              price="29 €"
              tag="One-shot"
              features={[
                "Tout du gratuit",
                "Rapport PDF détaillé",
                "Plan d'actions complet",
                "Modèles (registre, mentions)",
              ]}
              cta="Bientôt"
              highlight
            />
            <PricingCard
              name="Abonnement"
              price="19 €/mois"
              tag="Suivi continu"
              features={[
                "Tout du pack",
                "Réévaluations trimestrielles",
                "Alertes réglementaires",
                "Support par email",
              ]}
              cta="Bientôt"
              highlight={false}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-tight py-20">
        <h2 className="brand text-3xl text-primary md:text-4xl">Questions fréquentes</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Faq
            q="Quelle différence entre RGPD et nLPD ?"
            a="Le RGPD s'applique dans l'Union européenne (dont la France). La nLPD est la loi suisse révisée, entrée en vigueur le 1er septembre 2023. Les principes sont proches (registre, information, sécurité, droits), avec des spécificités : autorité (CNIL vs PFPDT), régime des sanctions et transferts internationaux."
          />
          <Faq
            q="Est-ce un conseil juridique ?"
            a="Non. Conformia est un outil d'auto-évaluation pédagogique. Pour un dossier sensible (DPIA, contentieux, sanction), consultez un avocat ou un DPO/DPD certifié."
          />
          <Faq
            q="Combien de temps faut-il ?"
            a="Environ 15 minutes pour la première passe. Vous pouvez reprendre plus tard : vos réponses sont sauvegardées dans votre navigateur."
          />
          <Faq
            q="Pour qui est-ce fait ?"
            a="PME, indépendants, e-commerces, cabinets, associations. Particulièrement utile pour les sites vitrines, les boutiques en ligne et toute structure qui gère une base clients ou prospects."
          />
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  name, price, tag, features, cta, highlight,
}: { name: string; price: string; tag: string; features: string[]; cta: string; highlight: boolean }) {
  return (
    <div
      className={
        "rounded-xl border p-6 " +
        (highlight
          ? "border-primary bg-card shadow-md ring-1 ring-primary/20"
          : "border-border bg-card")
      }
    >
      <div className="flex items-baseline justify-between">
        <div className="brand text-xl text-primary">{name}</div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{tag}</span>
      </div>
      <div className="mt-4 text-4xl brand text-foreground">{price}</div>
      <ul className="mt-6 space-y-2 text-sm text-foreground">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        {highlight ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-md border border-dashed border-border bg-secondary px-4 py-2 text-sm text-muted-foreground"
          >
            {cta}
          </button>
        ) : (
          <Link
            to="/audit"
            className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {cta}
          </Link>
        )}
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="brand text-xl text-primary">{q}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
    </div>
  );
}
