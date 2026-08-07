import { Clock, Flame, Brain, Target, ChevronRight, Play, CalendarCheck, Sparkles } from "lucide-react";
import { ProgrammeJourCard } from "@/components/programme-jour-card";
import { useMyProgram } from "@/hooks/use-program";
import { useMyObjectifsProfile } from "@/hooks/use-checkins";
import { buildObjectifOptionsDetailed, OBJECTIF_LABEL_FR } from "@/lib/objectifs";
import { resolveSeanceDuJour } from "@/lib/seance-du-jour";
import { FF } from "@/lib/ff-colors";
import { TEMPS_OPTIONS, ENERGIE_LABELS, HUMEUR_LABELS } from "@/lib/routine-utils";
import { Section, ScaleSelector } from "./routine-ui";
import type { CheckInState } from "@/lib/routine-generator";
import type { CoachSession } from "@/hooks/use-coaching";

export function CheckinForm({
  checkIn,
  setCheckIn,
  canGenerate,
  coachSession,
  todayCheckin,
  onGenerate,
}: {
  checkIn: CheckInState;
  setCheckIn: React.Dispatch<React.SetStateAction<CheckInState>>;
  canGenerate: boolean;
  coachSession: CoachSession | null | undefined;
  todayCheckin: unknown;
  onGenerate: (chosen?: "base" | "coach") => void;
}) {
  const { data: program } = useMyProgram();
  const { data: objectifsProfile } = useMyObjectifsProfile();
  const objectifOptions = buildObjectifOptionsDetailed(objectifsProfile);
  const seance = resolveSeanceDuJour(coachSession, program ?? null);

  return (
    <div className="space-y-6">
      {/* Une seule carte : type résolu par priorité Perso > Hebdo > Base */}
      {seance.kind === "hebdo" && (
        <ProgrammeJourCard
          program={program ?? null}
          focusObjectif={checkIn.objectif_du_jour}
        />
      )}

      {seance.kind === "perso" && coachSession && (
        <section
          className="rounded-2xl border-2 p-4 space-y-3"
          style={{ background: FF.surface, borderColor: FF.cyan }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: FF.cyan }}>
              <Sparkles className="h-3.5 w-3.5" /> Séance du jour · Perso coach
            </p>
          </div>
          <p className="font-bold text-sm">{coachSession.titre}</p>
          {coachSession.objectif && (
            <p className="text-xs" style={{ color: FF.amber }}>Objectif · {coachSession.objectif}</p>
          )}
          <p className="text-xs" style={{ color: FF.textMuted }}>
            {coachSession.blocs?.length ?? 0} bloc(s) · prioritaire sur le programme hebdo
          </p>
          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => onGenerate("coach")}
            className="w-full py-2.5 rounded-xl border text-sm font-bold uppercase tracking-widest disabled:opacity-50"
            style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="h-4 w-4" /> Faire la séance perso
            </span>
          </button>
        </section>
      )}

      {seance.kind === "base" && (
        <section
          className="rounded-2xl border p-4"
          style={{ background: FF.surface, borderColor: FF.border }}
        >
          <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1 mb-2" style={{ color: FF.textMuted }}>
            Séance du jour · Routine de base
          </p>
          <p className="text-xs" style={{ color: FF.textMuted }}>
            Pas de séance perso ni de bloc hebdo aujourd&apos;hui. Complète le check-in pour générer ta routine.
          </p>
          {program && (
            <p className="text-[11px] mt-2 font-mono" style={{ color: FF.textMuted }}>
              Programme « {program.titre} » · repos / hors jour
            </p>
          )}
        </section>
      )}

      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.cyan }}>
          // Sujet Zéro · Calibration
        </p>
        <h1 className="mt-2 text-2xl font-bold">Comment tu te sens aujourd&apos;hui ?</h1>
        <p className="mt-1 text-sm" style={{ color: FF.textMuted }}>
          Quatre questions pour composer la séance qui te correspond.
        </p>
      </div>

      <Section icon={<Clock className="h-4 w-4" />} label="Temps disponible">
        <div className="grid grid-cols-3 gap-2">
          {TEMPS_OPTIONS.map((opt) => {
            const active = checkIn.temps === opt.value;
            return (
              <button key={opt.value} onClick={() => setCheckIn((s) => ({ ...s, temps: opt.value }))}
                className="flex flex-col items-center py-3 rounded-xl border text-center transition-all"
                style={{
                  background: active ? FF.cyanBg20 : FF.surface2,
                  borderColor: active ? FF.cyan : FF.border,
                  color: active ? FF.cyan : FF.textMuted,
                  boxShadow: active ? FF.glowCyan : "none",
                }}>
                <span className="font-bold text-sm">{opt.label}</span>
                <span className="text-[10px] font-mono uppercase mt-0.5">{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section icon={<Flame className="h-4 w-4" />} label="Niveau d'énergie">
        <ScaleSelector value={checkIn.energie} labels={ENERGIE_LABELS} color={FF.amber}
          onChange={(v) => setCheckIn((s) => ({ ...s, energie: v }))} />
      </Section>

      <Section icon={<Brain className="h-4 w-4" />} label="État mental">
        <ScaleSelector value={checkIn.humeur} labels={HUMEUR_LABELS} color={FF.green}
          onChange={(v) => setCheckIn((s) => ({ ...s, humeur: v }))} />
      </Section>

      <Section icon={<Target className="h-4 w-4" />} label="Quel objectif souhaites-tu travailler ?">
        {objectifOptions.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: FF.textMuted }}>
              Pas encore d&apos;objectifs enregistrés — saisis celui du jour.
            </p>
            <input
              type="text"
              value={checkIn.objectif_du_jour ?? ""}
              onChange={(e) => setCheckIn((s) => ({ ...s, objectif_du_jour: e.target.value || null }))}
              placeholder="Ex : mobilité, perf Hyrox, perte de poids…"
              className="w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm outline-none"
              style={{ borderColor: FF.border, color: FF.text }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {objectifOptions.map((opt) => {
              const active = checkIn.objectif_du_jour === opt.value;
              return (
                <button
                  key={`${opt.label}-${opt.value}`}
                  type="button"
                  onClick={() => setCheckIn((s) => ({ ...s, objectif_du_jour: opt.value }))}
                  className="text-left rounded-xl border px-3 py-2.5 transition-all"
                  style={{
                    background: active ? FF.cyanBg20 : FF.surface2,
                    borderColor: active ? FF.cyan : FF.border,
                    color: active ? FF.cyan : FF.text,
                    boxShadow: active ? FF.glowCyan : "none",
                  }}
                >
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider block mb-0.5"
                    style={{ color: active ? FF.cyan : FF.textMuted }}
                  >
                    {OBJECTIF_LABEL_FR[opt.label]}
                  </span>
                  <span className="text-sm font-semibold leading-snug">{opt.value}</span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* CTA base uniquement si pas de perso prioritaire (hebdo se gère via ProgrammeJourCard) */}
      {seance.kind !== "perso" && (
        <button disabled={!canGenerate} onClick={() => onGenerate("base")}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border transition-all"
          style={{
            background: canGenerate ? FF.cyanBg20 : FF.surface2,
            borderColor: canGenerate ? FF.cyan : FF.border,
            color: canGenerate ? FF.cyan : FF.textMuted,
            boxShadow: canGenerate ? FF.glowCyan : "none",
            cursor: canGenerate ? "pointer" : "not-allowed",
          }}>
          <Play className="h-4 w-4" />
          {seance.kind === "hebdo" ? "Ou générer une routine de base" : "Générer ma routine"}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {todayCheckin === null && (
        <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: FF.textMuted }}>
          <CalendarCheck className="h-3.5 w-3.5" />
          Aucun check-in aujourd&apos;hui — commencez !
        </p>
      )}
    </div>
  );
}
