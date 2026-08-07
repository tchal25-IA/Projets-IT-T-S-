import { Calendar, Check, Loader2, Smile } from "lucide-react";
import { useAbonneProgramCompletions } from "@/hooks/use-program-completions";
import { RESSENTI_LABELS } from "./types";

/** Historique des validations du programme par l'abonné (vu par le coach) */
export function ProgrammeHistorique({ abonneId }: { abonneId: string }) {
  const { data: completions = [], isLoading } = useAbonneProgramCompletions(abonneId);

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
      <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
        <Calendar className="h-3.5 w-3.5" /> Historique du programme
      </p>
      {isLoading ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>Chargement…</p>
      ) : completions.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucune séance de programme démarrée pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {completions.map((c) => {
            const validated = c.ressenti_score != null;
            const inProgress = !!c.session_started_at && !validated;
            return (
              <div key={c.id} className="rounded-lg border p-2.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {c.jour} · {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                  {validated ? (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border flex items-center gap-1"
                      style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)" }}>
                      <Check className="h-2.5 w-2.5" /> Validé
                    </span>
                  ) : inProgress ? (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border flex items-center gap-1"
                      style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)" }}>
                      <Loader2 className="h-2.5 w-2.5" /> En cours
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border"
                      style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
                      Démarré
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--ff-text-muted)" }}>{c.titre}</p>
                {c.ressenti_score != null && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
                    <Smile className="h-3 w-3" /> Ressenti : {RESSENTI_LABELS[c.ressenti_score]}
                  </p>
                )}
                {c.ressenti_note && (
                  <p className="text-xs italic mt-1" style={{ color: "var(--ff-text)" }}>« {c.ressenti_note} »</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
