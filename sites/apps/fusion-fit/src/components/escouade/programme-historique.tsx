import { Activity, Calendar, Check, Loader2, Smile, Target } from "lucide-react";
import { useAbonneProgramCompletions } from "@/hooks/use-program-completions";
import { RESSENTI_LABELS } from "./types";

const FATIGUE_LABELS = ["", "Épuisé", "Fatigué", "OK", "Frais", "En pleine forme"];

/** Historique + assiduité des validations programme (vu par le coach). */
export function ProgrammeHistorique({ abonneId }: { abonneId: string }) {
  const { data: completions = [], isLoading } = useAbonneProgramCompletions(abonneId, 60);

  const validated = completions.filter((c) => c.ressenti_score != null);
  const last14 = (() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 13);
    const iso = cutoff.toISOString().slice(0, 10);
    return completions.filter((c) => c.date >= iso);
  })();
  const validated14 = last14.filter((c) => c.ressenti_score != null).length;
  // Assiduité = séances validées / jours avec activité démarrée (14j)
  const started14 = last14.length;
  const assiduite = started14 > 0 ? Math.round((validated14 / Math.max(started14, 1)) * 100) : null;
  // Sur 14 jours calendaires (objectif souple)
  const assiduiteCal = Math.round((validated14 / 14) * 100);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const rpeMoy = avg(validated.map((c) => c.ressenti_score!).filter(Boolean));
  const fatigueMoy = avg(
    validated.map((c) => c.fatigue_score).filter((v): v is number => v != null),
  );

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
      <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
        <Calendar className="h-3.5 w-3.5" /> Historique du programme
      </p>

      {!isLoading && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border p-2 text-center" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--ff-cyan)" }}>{validated.length}</p>
            <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>validées</p>
          </div>
          <div className="rounded-lg border p-2 text-center" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--ff-amber)" }}>
              {assiduite != null ? `${assiduite}%` : `${assiduiteCal}%`}
            </p>
            <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>assiduité</p>
          </div>
          <div className="rounded-lg border p-2 text-center" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--ff-green)" }}>
              {rpeMoy != null ? rpeMoy.toFixed(1) : "—"}
            </p>
            <p className="text-[9px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>RPE moy.</p>
          </div>
        </div>
      )}

      {fatigueMoy != null && (
        <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--ff-text-muted)" }}>
          <Target className="h-3 w-3" /> Fatigue moyenne : {fatigueMoy.toFixed(1)}/5
          {assiduite != null && started14 > 0 && (
            <span> · {validated14}/{started14} démarrées validées (14 j)</span>
          )}
        </p>
      )}

      {isLoading ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>Chargement…</p>
      ) : completions.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucune séance de programme démarrée. Dès que l&apos;athlète clique « Valider la séance », tu verras ici le RPE, la fatigue et les remarques.
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {completions.map((c) => {
            const isValidated = c.ressenti_score != null;
            const inProgress = !!c.session_started_at && !isValidated;
            return (
              <div key={c.id} className="rounded-lg border p-2.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {c.jour} · {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                  {isValidated ? (
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
                  <p className="text-[11px] mt-1 flex items-center gap-1 flex-wrap" style={{ color: "var(--ff-cyan)" }}>
                    <Smile className="h-3 w-3" />
                    RPE {c.ressenti_score}/5 ({RESSENTI_LABELS[c.ressenti_score]})
                    {c.fatigue_score != null && (
                      <span style={{ color: "var(--ff-amber)" }}>
                        · Fatigue {c.fatigue_score}/5 ({FATIGUE_LABELS[c.fatigue_score]})
                      </span>
                    )}
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

/** Petit bandeau stats programme pour le recap coach (réexport utile). */
export function ProgrammeAssiduiteStrip({ abonneId }: { abonneId: string }) {
  const { data: completions = [] } = useAbonneProgramCompletions(abonneId, 40);
  const validated = completions.filter((c) => c.ressenti_score != null).length;
  if (validated === 0) return null;
  return (
    <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--ff-text-muted)" }}>
      <Activity className="h-3 w-3" /> {validated} séance(s) de programme validée(s)
    </p>
  );
}
