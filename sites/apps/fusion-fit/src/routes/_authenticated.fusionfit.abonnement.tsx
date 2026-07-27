import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Sparkles, Shield, Crown, ArrowRight } from "lucide-react";
import { FF } from "@/lib/ff-colors";

export const Route = createFileRoute("/_authenticated/fusionfit/abonnement")({
  component: AbonnementPage,
});

type Plan = {
  id: string;
  nom: string;
  prix: string;
  periode: string;
  icon: typeof Shield;
  couleur: string;
  features: string[];
  populaire?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "decouverte",
    nom: "Découverte",
    prix: "Gratuit",
    periode: "essai 14 jours",
    icon: Sparkles,
    couleur: FF.cyan,
    features: ["Check-in & routine adaptative", "Suivi de progression", "Messagerie avec ton coach"],
  },
  {
    id: "initiative",
    nom: "Initiative",
    prix: "29€",
    periode: "/ mois",
    icon: Shield,
    couleur: FF.amber,
    populaire: true,
    features: [
      "Tout Découverte",
      "Programme personnalisé du coach",
      "Analyse IA de la fatigue",
      "Créneaux d'entraînement illimités",
    ],
  },
  {
    id: "elite",
    nom: "Élite",
    prix: "59€",
    periode: "/ mois",
    icon: Crown,
    couleur: "oklch(0.80 0.20 300)",
    features: ["Tout Initiative", "Suivi prioritaire", "Bilans vidéo hebdo", "Accès escouades premium"],
  },
];

function AbonnementPage() {
  const navigate = useNavigate();

  function choisir() {
    // Le paiement sera intégré ultérieurement. On continue vers le profil.
    navigate({ to: "/fusionfit/profil", replace: true });
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.cyan }}>
          // Activation Agent
        </p>
        <h1 className="mt-2 text-2xl font-bold">Choisis ton plan</h1>
        <p className="mt-1 text-sm" style={{ color: FF.textMuted }}>
          Commence gratuitement, change quand tu veux.
        </p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <button
              key={plan.id}
              onClick={choisir}
              className="w-full text-left rounded-2xl border p-4 transition-all relative overflow-hidden"
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
                <div className="h-10 w-10 rounded-lg grid place-items-center border"
                  style={{ borderColor: plan.couleur, background: FF.surface2 }}>
                  <Icon className="h-5 w-5" style={{ color: plan.couleur }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{plan.nom}</p>
                  <p className="text-xs" style={{ color: FF.textMuted }}>
                    <span className="text-base font-bold" style={{ color: plan.couleur }}>{plan.prix}</span>{" "}
                    {plan.periode}
                  </p>
                </div>
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

      <button
        onClick={choisir}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold uppercase tracking-widest"
        style={{ background: FF.cyanBg20, borderColor: FF.cyan, color: FF.cyan, boxShadow: FF.glowCyan }}
      >
        Continuer
        <ArrowRight className="h-4 w-4" />
      </button>
      <p className="text-center text-[10px] font-mono" style={{ color: FF.textMuted }}>
        Le paiement sécurisé sera bientôt disponible · aucune carte requise pour l'essai
      </p>
    </div>
  );
}
