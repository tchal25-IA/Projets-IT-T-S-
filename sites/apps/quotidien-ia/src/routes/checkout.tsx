import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { StripeEmbeddedCheckout } from "@/components/stripe-embedded-checkout";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import {
  CATEGORIES,
  computeMonthly,
  computeAnnualMonthly,
  formatEUR,
  type CategoryId,
} from "@/lib/pricing";

type Search = { modules?: string; billing?: "monthly" | "annual" };

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    modules: typeof s.modules === "string" ? s.modules : undefined,
    billing: s.billing === "annual" ? "annual" : s.billing === "monthly" ? "monthly" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Quotidien IA" },
      { name: "description", content: "Finalisez votre abonnement Quotidien IA en toute sécurité." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const PAID_CATEGORIES = new Set<CategoryId>(
  CATEGORIES.filter((c) => c.priceMonthly > 0).map((c) => c.id),
);

function CheckoutPage() {
  const { modules: modulesParam, billing: billingParam } = Route.useSearch();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);

  const modules = useMemo<CategoryId[]>(() => {
    const list = (modulesParam ?? "")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string): s is CategoryId => PAID_CATEGORIES.has(s as CategoryId));
    return Array.from(new Set(list));
  }, [modulesParam]);

  const billing: "monthly" | "annual" = billingParam ?? "monthly";

  const monthly = computeMonthly(modules);
  const monthlyBilled = billing === "annual" ? computeAnnualMonthly(modules) : monthly;
  const annualTotal = monthlyBilled * 12;

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/login", search: { redirect: window.location.pathname + window.location.search } as any });
    }
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  }

  if (modules.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <PaymentTestModeBanner />
        <h1 className="mt-6 text-2xl font-bold">Aucun module payant sélectionné</h1>
        <p className="mt-2 text-muted-foreground">
          Sélectionnez au moins un module payant depuis vos paramètres pour continuer.
        </p>
        <Button asChild className="mt-6">
          <Link to="/parametres">Retour aux paramètres</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="mx-auto grid max-w-5xl gap-8 p-6 md:grid-cols-[1fr_1.4fr]">
        <aside className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Récapitulatif</h2>
          <ul className="mt-4 space-y-2">
            {modules.map((id) => {
              const cat = CATEGORIES.find((c) => c.id === id);
              if (!cat) return null;
              return (
                <li key={id} className="flex justify-between text-sm">
                  <span>{cat.label}</span>
                  <span className="text-muted-foreground">{formatEUR(cat.priceMonthly)}/mois</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span>Facturation</span>
              <span className="font-medium">{billing === "annual" ? "Annuelle (−10 %)" : "Mensuelle"}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Total mensuel</span>
              <span className="font-semibold">{formatEUR(monthlyBilled)}</span>
            </div>
            {billing === "annual" && (
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Facturé annuellement</span>
                <span>{formatEUR(annualTotal)}</span>
              </div>
            )}
            <p className="mt-3 rounded-md bg-muted p-2 text-xs text-muted-foreground">
              🎁 30 jours d'essai gratuit — sans engagement, annulable à tout moment.
            </p>
          </div>
        </aside>

        <section className="rounded-xl border bg-card p-2 md:p-6">
          {showCheckout ? (
            <StripeEmbeddedCheckout modules={modules} billing={billing} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <h1 className="text-2xl font-bold">Prêt à démarrer ?</h1>
              <p className="text-sm text-muted-foreground">
                Vous ne serez débité qu'à l'issue de la période d'essai de 30 jours.
              </p>
              <Button size="lg" onClick={() => setShowCheckout(true)}>
                Démarrer mon essai gratuit
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/parametres">Annuler</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
