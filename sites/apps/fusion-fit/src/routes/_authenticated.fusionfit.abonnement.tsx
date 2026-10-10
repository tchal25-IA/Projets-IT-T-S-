import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sparkles, Shield, Crown, ArrowRight, Loader2 } from "lucide-react";
import { FF } from "@/lib/ff-colors";
import {
  activateEssaiDecouverte,
  createCheckoutSession,
  getStripeConfigStatus,
} from "@/lib/stripe.functions";
import { useMyAbonnement } from "@/hooks/use-creneaux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageSkeleton } from "@/components/ui-skeleton";

export const Route = createFileRoute("/_authenticated/fusionfit/abonnement")({
  component: AbonnementPage,
});

type Plan = {
  id: "decouverte" | "initiative" | "elite";
  nom: string;
  prix: string;
  periode: string;
  icon: typeof Shield;
  couleur: string;
  features: string[];
  populaire?: boolean;
};

/** Grille Word Launch / Pro / Studio — IDs Stripe inchangés (decouverte / initiative / elite). */
const PLANS: Plan[] = [
  {
    id: "decouverte",
    nom: "Essai · Launch",
    prix: "0 €",
    periode: "14 jours sans CB",
    icon: Sparkles,
    couleur: FF.cyan,
    features: [
      "Essai Launch (puis 29 € / 29 CHF)",
      "10 athlètes actifs (plafond essai)",
      "Modules 1, 2 et 11",
      "Atelier · modèles limités",
    ],
  },
  {
    id: "initiative",
    nom: "Launch",
    prix: "29 €",
    periode: "/ mois · 29 CHF",
    icon: Shield,
    couleur: FF.amber,
    features: [
      "10 athlètes actifs",
      "Modules 1, 2 et 11",
      "Atelier · 10 modèles",
      "Agenda + messagerie",
    ],
  },
  {
    id: "elite",
    nom: "Pro",
    prix: "59 €",
    periode: "/ mois · 65 CHF",
    icon: Crown,
    couleur: "oklch(0.80 0.20 300)",
    populaire: true,
    features: [
      "25 athlètes actifs",
      "11 modules + WOD + Hyrox",
      "Atelier illimité + Dashboard 3s",
      "IA fatigue · suivi prioritaire",
    ],
  },
];

function AbonnementPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: abo, isLoading: aboLoading } = useMyAbonnement();
  const checkout = useServerFn(createCheckoutSession);
  const activateEssai = useServerFn(activateEssaiDecouverte);
  const stripeStatusFn = useServerFn(getStripeConfigStatus);
  const { data: stripeStatus } = useQuery({
    queryKey: ["stripe-config"],
    queryFn: () => stripeStatusFn(),
    staleTime: 60_000,
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choisir(planId: Plan["id"]) {
    setError(null);
    setBusy(planId);
    try {
      if (planId === "decouverte") {
        await activateEssai();
        await qc.invalidateQueries({ queryKey: ["my-abonnement"] });
        navigate({ to: "/fusionfit/profil", replace: true });
        return;
      }

      if (!stripeStatus?.configured) {
        setError(
          "Paiement Stripe non configuré (STRIPE_SECRET_KEY / price IDs). Contacte ton coach ou réessaie plus tard.",
        );
        return;
      }

      const origin = window.location.origin;
      const res = await checkout({
        data: {
          plan: planId,
          successUrl: `${origin}/fusionfit/profil?checkout=success`,
          cancelUrl: `${origin}/fusionfit/abonnement?checkout=cancel`,
        },
      });
      if (res.url) {
        window.location.assign(res.url);
        return;
      }
      setError("Impossible de démarrer le paiement.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur paiement");
    } finally {
      setBusy(null);
    }
  }

  if (aboLoading) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.cyan }}>
          // Activation Agent
        </p>
        <h1 className="mt-2 text-2xl font-bold">Choisis ton plan</h1>
        <p className="mt-1 text-sm" style={{ color: FF.textMuted }}>
          Plan actuel :{" "}
          <span style={{ color: FF.amber }}>
            {abo?.plan ?? "decouverte"} · {abo?.statut ?? "essai"}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = abo?.plan === plan.id && (abo?.statut === "actif" || abo?.statut === "essai");
          return (
            <button
              key={plan.id}
              onClick={() => choisir(plan.id)}
              disabled={!!busy || isCurrent}
              className="w-full text-left rounded-2xl border p-4 transition-all relative overflow-hidden disabled:opacity-70"
              style={{
                background: FF.surface,
                borderColor: plan.populaire ? plan.couleur : FF.border,
                boxShadow: plan.populaire ? `0 0 16px ${plan.couleur}33` : "none",
              }}
            >
              {plan.populaire && (
                <span
                  className="absolute top-0 right-0 text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-bl-lg"
                  style={{ background: plan.couleur, color: FF.bg }}
                >
                  Populaire
                </span>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg grid place-items-center border"
                  style={{ borderColor: plan.couleur, background: FF.surface2 }}
                >
                  {busy === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: plan.couleur }} />
                  ) : (
                    <Icon className="h-5 w-5" style={{ color: plan.couleur }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    {plan.nom}
                    {isCurrent ? " · actuel" : ""}
                  </p>
                  <p className="text-xs" style={{ color: FF.textMuted }}>
                    <span className="text-base font-bold" style={{ color: plan.couleur }}>
                      {plan.prix}
                    </span>{" "}
                    {plan.periode}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4" style={{ color: FF.textMuted }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs" style={{ color: FF.text }}>
                    <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.couleur }} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          className="text-xs px-3 py-2 rounded-lg border"
          style={{ background: FF.redBg, borderColor: FF.red, color: FF.red }}
        >
          {error}
        </p>
      )}

      <p className="text-center text-[10px] font-mono" style={{ color: FF.textMuted }}>
        {stripeStatus?.configured
          ? "Paiement sécurisé via Stripe · annulation possible à tout moment"
          : "Stripe à configurer côté serveur · l'essai Découverte reste disponible"}
      </p>
    </div>
  );
}
