import { Target, MessageCircle, CreditCard, Crown, ClipboardList } from "lucide-react";
import { ABONNEMENT_PLANS, ABONNEMENT_STATUTS } from "@/lib/ff-colors";
import { QuestionnaireSassCard } from "@/components/questionnaire-sass-card";
import type { SassAnswers } from "@/lib/questionnaire-sass";
import type { Profile } from "./types";

export function AbonneHeader({
  profile,
  prenom,
  onChat,
}: {
  profile: Profile | null;
  prenom: string;
  onChat: () => void;
}) {
  const p = ABONNEMENT_PLANS[profile?.abonnement_plan ?? "decouverte"] ?? ABONNEMENT_PLANS.decouverte;
  const st = ABONNEMENT_STATUTS[profile?.abonnement_statut ?? "essai"] ?? ABONNEMENT_STATUTS.essai;
  const sass = profile?.questionnaire_sass as SassAnswers | undefined;
  const secondaires = Array.isArray(profile?.objectifs_secondaires)
    ? profile!.objectifs_secondaires!.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            Abonné{profile ? ` · Niveau ${profile.niveau_agent}` : ""}
          </p>
          <h1 className="text-2xl font-bold mt-1">{prenom}</h1>
          <p className="text-xs mt-1" style={{ color: "var(--ff-text-muted)" }}>
            {profile?.email}
          </p>
        </div>
        <button
          onClick={onChat}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
        >
          <MessageCircle className="h-4 w-4" /> Chat
        </button>
      </header>

      <section
        className="rounded-2xl border p-4 space-y-1.5"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-amber)" }}>
          <Target className="h-3 w-3" /> Objectifs de l&apos;abonné
        </p>
        <p className="text-sm"><b>Principal :</b> {profile?.objectif_principal || "—"}</p>
        {secondaires.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>Secondaires</p>
            {secondaires.map((o) => (
              <p key={o} className="text-sm" style={{ color: "var(--ff-text-muted)" }}>· {o}</p>
            ))}
          </div>
        )}
        <p className="text-sm"><b>Moyen terme :</b> {profile?.objectif_moyen_terme || "—"}</p>
        <p className="text-sm"><b>Long terme :</b> {profile?.objectif_long_terme || "—"}</p>
        <p className="text-sm"><b>Discipline :</b> {profile?.discipline || "—"}</p>
      </section>

      <QuestionnaireSassCard
        answers={sass && Object.keys(sass).length > 0 ? (sass as SassAnswers) : null}
        compact
      />

      {(profile?.historique_sportif || profile?.antecedents_blessures || profile?.age || profile?.sexe) &&
        !(sass && Object.keys(sass).length > 0) && (
        <section
          className="rounded-2xl border p-4 space-y-2"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
        >
          <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
            <ClipboardList className="h-3 w-3" /> Questionnaire d&apos;accueil
          </p>
          {(profile?.sexe || profile?.age || profile?.taille_cm) && (
            <p className="text-sm" style={{ color: "var(--ff-text-muted)" }}>
              {[profile.sexe, profile.age ? `${profile.age} ans` : null, profile.taille_cm ? `${profile.taille_cm} cm` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {profile?.historique_sportif && (
            <div>
              <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>Parcours sportif</p>
              <p className="text-sm whitespace-pre-line">{profile.historique_sportif}</p>
            </div>
          )}
          {profile?.antecedents_blessures && (
            <div>
              <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>Santé & blessures</p>
              <p className="text-sm whitespace-pre-line">{profile.antecedents_blessures}</p>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border p-4 flex items-center justify-between gap-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg grid place-items-center border" style={{ borderColor: p.couleur, background: "var(--ff-surface-2)" }}>
            <Crown className="h-4 w-4" style={{ color: p.couleur }} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-text-muted)" }}>
              <CreditCard className="h-3 w-3" /> Abonnement
            </p>
            <p className="font-bold text-sm" style={{ color: p.couleur }}>{p.nom} <span className="text-[11px] font-normal" style={{ color: "var(--ff-text-muted)" }}>· {p.prix}</span></p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-full border" style={{ borderColor: st.couleur, color: st.couleur }}>
          {st.label}
        </span>
      </section>
    </>
  );
}
