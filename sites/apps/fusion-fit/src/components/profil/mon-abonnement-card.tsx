import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Crown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ABONNEMENT_PLANS, ABONNEMENT_STATUTS } from "@/lib/ff-colors";
import { Card } from "./profil-ui";

/** Carte « Mon abonnement » (abonné) — base à développer plus tard */
export function MonAbonnementCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<string>("decouverte");
  const [statut, setStatut] = useState<string>("essai");
  const [depuis, setDepuis] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("abonnement_plan, abonnement_statut, abonnement_depuis").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlan(data.abonnement_plan ?? "decouverte");
          setStatut(data.abonnement_statut ?? "essai");
          setDepuis(data.abonnement_depuis ?? null);
        }
      });
  }, [user]);

  const p = ABONNEMENT_PLANS[plan] ?? ABONNEMENT_PLANS.decouverte;
  const s = ABONNEMENT_STATUTS[statut] ?? ABONNEMENT_STATUTS.essai;

  return (
    <Card icon={<CreditCard className="h-4 w-4" />} title="Mon abonnement">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center border" style={{ borderColor: p.couleur, background: "var(--ff-surface-2)" }}>
            <Crown className="h-5 w-5" style={{ color: p.couleur }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: p.couleur }}>{p.nom}</p>
            <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
              {p.prix}{depuis ? ` · depuis ${new Date(depuis).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : ""}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-full border" style={{ borderColor: s.couleur, color: s.couleur }}>
          {s.label}
        </span>
      </div>
      <button
        onClick={() => navigate({ to: "/fusionfit/abonnement" })}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest"
        style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
      >
        Gérer mon abonnement <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <p className="text-center text-[10px] font-mono mt-2" style={{ color: "var(--ff-text-muted)" }}>
        Paiement sécurisé bientôt disponible
      </p>
    </Card>
  );
}
