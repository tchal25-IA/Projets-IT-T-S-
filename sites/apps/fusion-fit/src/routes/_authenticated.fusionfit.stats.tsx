import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart3, Flame, Brain, Zap, CalendarCheck, TrendingUp, ClipboardList, Target, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useCheckins, type CheckinRow } from "@/hooks/use-checkins";
import { useMyProgramCompletions } from "@/hooks/use-program-completions";
import { useMyProgram } from "@/hooks/use-program";
import { FatigueAnalysisCard } from "@/components/fatigue-analysis-card";
import { WeightTracker } from "@/components/weight-tracker";
import { FF, PILIER_COLORS } from "@/lib/ff-colors";
import { JOURS_FR, todayJourFr } from "@/lib/dates";
import { generateRoutine, splitFormat } from "@/lib/routine-generator";

export const Route = createFileRoute("/_authenticated/fusionfit/stats")({
  component: SuiviPage,
});

type Bloc = { jour: string; titre: string; details: string };
type Program = { id: string; coach_id: string; titre: string; objectif: string | null; blocs: Bloc[]; updated_at: string } | null;

const NIVEAUX = [
  { min: 0,  max: 2,  label: "Recrue",       couleur: FF.textMuted },
  { min: 3,  max: 9,  label: "Agent",         couleur: FF.amber     },
  { min: 10, max: 24, label: "Opérateur",     couleur: FF.cyan      },
  { min: 25, max: 49, label: "Spécialiste",   couleur: FF.green     },
  { min: 50, max: Infinity, label: "Élite",   couleur: "oklch(0.80 0.20 300)" },
];

function getNiveau(total: number) {
  return NIVEAUX.find((n) => total >= n.min && total <= n.max) ?? NIVEAUX[0];
}

function SuiviPage() {
  const { data: checkins = [], isLoading } = useCheckins(30);
  const { data: program, isLoading: loadingProg } = useMyProgram();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: FF.cyan }}>
          // Suivi · Programme · IA
        </p>
        <h1 className="mt-2 text-2xl font-bold">Mon suivi</h1>
      </div>

      {/* Programme du coach — semaine uniquement (la séance du jour est dans Routine) */}
      {loadingProg ? (
        <section className="rounded-2xl border p-4" style={{ background: FF.surface, borderColor: FF.border }}>
          <p className="text-xs" style={{ color: FF.textMuted }}>Chargement…</p>
        </section>
      ) : !program ? (
        <section className="rounded-2xl border p-4" style={{ background: FF.surface, borderColor: FF.border }}>
          <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1 mb-2" style={{ color: FF.cyan }}>
            <ClipboardList className="h-3.5 w-3.5" /> Programme de mon coach
          </p>
          <p className="text-xs" style={{ color: FF.textMuted }}>
            Ton coach n'a pas encore publié de programme.
          </p>
        </section>
      ) : (
        <ProgrammeSemaine program={program} />
      )}

      {/* Analyse IA fatigue */}
      <FatigueAnalysisCard audience="abonne" />

      {/* Historique check-ins + sessions */}
      <HistoriqueCheckins checkins={checkins} isLoading={isLoading} />

      {/* Module poids (activable) */}
      <WeightTracker />
    </div>
  );
}

// Programme du coach — vue semaine repliable. La séance du jour est désormais
// présentée dans l'onglet Routine pour éviter la duplication.
function ProgrammeSemaine({ program }: { program: { id: string; titre: string; blocs: Array<{ jour: string; titre: string; details: string }> } }) {
  const today = todayJourFr();
  const { data: completions = [] } = useMyProgramCompletions(program.id);
  const [weekOpen, setWeekOpen] = useState(false);
  const completedDates = new Set(completions.map((c) => c.date));

  return (
    <section className="rounded-2xl border p-4 space-y-2" style={{ background: FF.surface, borderColor: FF.border }}>
      <button onClick={() => setWeekOpen((o) => !o)} className="w-full flex items-center justify-between">
        <div className="text-left">
          <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: FF.cyan }}>
            <ClipboardList className="h-3.5 w-3.5" /> Programme · semaine
          </p>
          <p className="font-bold text-sm mt-1">{program.titre}</p>
        </div>
        {weekOpen ? <ChevronUp className="h-4 w-4" style={{ color: FF.textMuted }} /> : <ChevronDown className="h-4 w-4" style={{ color: FF.textMuted }} />}
      </button>
      {weekOpen && (
        <div className="space-y-1.5 pt-2">
          {JOURS_FR.map((jour) => {
            const blocs = program.blocs.filter((b) => b.jour === jour);
            const isToday = jour === today;
            return (
              <div key={jour} className="rounded-lg border p-2"
                style={{ borderColor: isToday ? FF.cyan : FF.border, background: FF.surface2 }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border"
                    style={{ borderColor: isToday ? FF.cyan : FF.border, color: isToday ? FF.cyan : FF.textMuted }}>
                    {jour}
                  </span>
                  {blocs.length === 0 ? (
                    <span className="text-xs" style={{ color: FF.textMuted }}>Repos</span>
                  ) : (
                    <span className="text-xs font-semibold">{blocs.map((b) => b.titre).join(" · ")}</span>
                  )}
                </div>
              </div>
            );
          })}
          {completedDates.size > 0 && (
            <p className="text-[10px] font-mono pt-1" style={{ color: FF.textMuted }}>
              {completedDates.size} jour(s) validé(s) récemment
            </p>
          )}
        </div>
      )}
    </section>
  );
}


function HistoriqueCheckins({ checkins, isLoading }: { checkins: CheckinRow[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 rounded-full border-2 animate-spin" style={{ borderColor: FF.cyan, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-2xl border"
        style={{ background: FF.surface, borderColor: FF.border }}>
        <BarChart3 className="h-10 w-10" style={{ color: FF.textMuted }} />
        <p className="text-sm" style={{ color: FF.textMuted }}>
          Fais ton premier check-in dans Routine pour voir tes stats !
        </p>
      </div>
    );
  }

  const nbSessions = checkins.length;
  // Niveau & progression basés sur les JOURS actifs (1 jour peut contenir plusieurs sessions).
  const uniqueDays = Array.from(new Set(checkins.map((c) => c.date)));
  const total = uniqueDays.length;
  const niveau = getNiveau(total);
  const avgEnergie = +(checkins.reduce((s, c) => s + c.energie, 0) / nbSessions).toFixed(1);
  const avgHumeur = +(checkins.reduce((s, c) => s + c.humeur, 0) / nbSessions).toFixed(1);
  const avgSeren = +(checkins.reduce((s, c) => s + c.serenite, 0) / nbSessions).toFixed(0);

  const dates = [...uniqueDays].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cursor = new Date().toISOString().slice(0, 10);
  for (const d of dates) {
    if (d === cursor) { streak++; cursor = prevDay(cursor); }
    else if (d < cursor) break;
  }

  // 1 point par jour (meilleure sérénité du jour) pour éviter les doublons sur le graphe.
  const byDay = new Map<string, CheckinRow>();
  for (const c of checkins) {
    const prev = byDay.get(c.date);
    if (!prev || c.serenite > prev.serenite) byDay.set(c.date, c);
  }
  const chartData = [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((c) => ({
      date: format(parseISO(c.date), "dd/MM", { locale: fr }),
      Énergie: c.energie,
      Humeur: c.humeur,
      Sérénité: Math.round(c.serenite / 20),
    }));

  const nextMilestone = NIVEAUX.find((n) => n.min > total);
  const progressToNext = nextMilestone
    ? Math.round(((total - getNiveau(total).min) / (nextMilestone.min - getNiveau(total).min)) * 100)
    : 100;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 border" style={{ background: FF.surface, borderColor: FF.border }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: FF.textMuted }}>Niveau Agent</p>
            <p className="mt-1 text-lg font-bold" style={{ color: niveau.couleur }}>{niveau.label}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums" style={{ color: niveau.couleur }}>{total}</p>
            <p className="text-[10px] font-mono" style={{ color: FF.textMuted }}>
              jour{total > 1 ? "s" : ""} actif{total > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: FF.surface2 }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progressToNext}%`, background: niveau.couleur }} />
        </div>
        {nextMilestone ? (
          <p className="mt-2 text-[11px] font-mono" style={{ color: FF.textMuted }}>
            {nextMilestone.min - total} jour(s) actif(s) pour atteindre {nextMilestone.label} · {nbSessions} session{nbSessions > 1 ? "s" : ""} au total
          </p>
        ) : (
          <p className="mt-2 text-[11px] font-mono" style={{ color: FF.textMuted }}>
            {nbSessions} session{nbSessions > 1 ? "s" : ""} au total
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard icon={<Flame className="h-4 w-4" />} label="Énergie moy." value={`${avgEnergie}/5`} color={FF.amber} />
        <MetricCard icon={<Brain className="h-4 w-4" />} label="Humeur moy." value={`${avgHumeur}/5`} color={FF.green} />
        <MetricCard icon={<CalendarCheck className="h-4 w-4" />} label="Streak" value={`${streak}j`} color={FF.cyan} />
      </div>

      <MetricCard icon={<Zap className="h-4 w-4" />} label="Sérénité moyenne" value={`${avgSeren}%`} color={FF.cyan} wide />

      <div className="rounded-2xl p-4 border" style={{ background: FF.surface, borderColor: FF.border }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4" style={{ color: FF.textMuted }} />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: FF.textMuted }}>Évolution · 14 jours</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.04 220 / 30%)" />
            <XAxis dataKey="date" tick={{ fill: FF.textMuted, fontSize: 10 }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: FF.textMuted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: FF.surface, border: `1px solid ${FF.border}`, borderRadius: "0.75rem", fontSize: 11 }} labelStyle={{ color: FF.text }} />
            <ReferenceLine y={3} stroke={FF.border} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Énergie" stroke={FF.amber} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="Humeur" stroke={FF.green} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="Sérénité" stroke={FF.cyan} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-5 mt-3">
          {[
            { label: "Énergie", color: FF.amber },
            { label: "Humeur", color: FF.green },
            { label: "Sérénité", color: FF.cyan },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="h-2 w-4 rounded-full inline-block" style={{ background: l.color }} />
              <span style={{ color: FF.textMuted }}>{l.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Historique détaillé des sessions */}
      <HistoriqueRoutines checkins={checkins} />
    </div>
  );
}

// Labels pour reconstituer les blocs à partir du check-in
const BLOC_TITRES: Record<string, { Bouger: string; Respirer: string; Nourrir?: string }> = {
  Légère:  { Bouger: "Mobilité articulaire", Respirer: "Cohérence cardiaque 5-5", Nourrir: undefined },
  Modérée: { Bouger: "Circuit CrossFit modéré", Respirer: "Box breathing 4-4-4-4", Nourrir: "Smoothie récupération" },
  Intense: { Bouger: "AMRAP Hyrox Prep", Respirer: "Box breathing 4-4-4-4", Nourrir: "Protocole performance" },
};

function getIntensiteLabel(c: CheckinRow): "Légère" | "Modérée" | "Intense" {
  const score = (c.energie + c.humeur) / 2;
  return score <= 2 ? "Légère" : score <= 3.5 ? "Modérée" : "Intense";
}

const PILIERS: Array<"Bouger" | "Respirer" | "Nourrir"> = ["Bouger", "Respirer", "Nourrir"];

function HistoriqueRoutines({ checkins }: { checkins: CheckinRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (checkins.length === 0) return null;

  const sessions = [...checkins].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2" style={{ color: FF.textMuted }}>
        <CalendarCheck className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-widest">Historique des séances</span>
      </div>

      {sessions.map((c) => {
        const intensite = getIntensiteLabel(c);
        const titres = BLOC_TITRES[intensite];
        const isOpen = expanded === c.id;
        const completedSet = new Set(c.blocs_completes ?? []);
        const score = (c.energie + c.humeur) / 2;

        // Map index → pilier (matches generateRoutine order: 0=Bouger, 1=Respirer, 2=Nourrir if t>=2)
        const blocksInSession: Array<{ index: number; pilier: "Bouger" | "Respirer" | "Nourrir"; titre: string }> = [
          { index: 0, pilier: "Bouger", titre: titres.Bouger },
          { index: 1, pilier: "Respirer", titre: titres.Respirer },
          ...(c.nb_blocs >= 3 && titres.Nourrir
            ? [{ index: 2, pilier: "Nourrir" as const, titre: titres.Nourrir }]
            : []),
        ];

        const sereniteColor = c.serenite >= 80 ? FF.green : c.serenite >= 40 ? FF.amber : FF.textMuted;

        return (
          <div
            key={c.id}
            className="rounded-2xl border overflow-hidden"
            style={{ background: FF.surface, borderColor: c.serenite === 100 ? FF.green : FF.border }}
          >
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-left"
              onClick={() => setExpanded(isOpen ? null : c.id)}
            >
              {/* Date */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">
                  {format(parseISO(c.date), "EEEE d MMM", { locale: fr }).replace(/^\w/, (l) => l.toUpperCase())}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider mt-0.5" style={{ color: FF.textMuted }}>
                  {intensite} · {c.nb_blocs} bloc(s)
                </p>
              </div>

              {/* Sérénité */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-base font-bold tabular-nums" style={{ color: sereniteColor }}>
                    {c.serenite}%
                  </p>
                  <p className="text-[9px] font-mono" style={{ color: FF.textMuted }}>sérénité</p>
                </div>
                {/* Piliers complétés */}
                <div className="flex gap-0.5">
                  {blocksInSession.map((b) => {
                    const done = completedSet.has(b.index);
                    const col = PILIER_COLORS[b.pilier];
                    return (
                      <span
                        key={b.index}
                        className="h-2 w-2 rounded-full"
                        style={{ background: done ? col.text : FF.border }}
                        title={b.pilier}
                      />
                    );
                  })}
                </div>
                {isOpen
                  ? <ChevronUp className="h-4 w-4" style={{ color: FF.textMuted }} />
                  : <ChevronDown className="h-4 w-4" style={{ color: FF.textMuted }} />}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: FF.border }}>
                {/* Métriques du jour */}
                <div className="flex gap-3 pt-3 pb-1">
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: FF.amber }}>
                    <Flame className="h-3 w-3" /> Énergie {c.energie}/5
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: FF.green }}>
                    <Brain className="h-3 w-3" /> Humeur {c.humeur}/5
                  </span>
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: FF.cyan }}>
                    <Zap className="h-3 w-3" /> {c.temps === 1 ? "15 min" : c.temps === 2 ? "30 min" : "60 min+"}
                  </span>
                </div>

                {/* Blocs — détail complet des exercices reconstruit depuis le check-in */}
                {(() => {
                  const rebuilt = generateRoutine({ temps: c.temps, energie: c.energie, humeur: c.humeur });
                  return blocksInSession.map((b) => {
                    const done = completedSet.has(b.index);
                    const col = PILIER_COLORS[b.pilier];
                    const detail = rebuilt[b.index];
                    const { format, exercises } = detail
                      ? splitFormat(detail.exercises)
                      : { format: null, exercises: [] as string[] };
                    return (
                      <div key={b.index}
                        className="px-3 py-2 rounded-lg border space-y-1"
                        style={{
                          background: done ? col.bg : FF.surface2,
                          borderColor: done ? col.border : FF.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border flex-shrink-0"
                            style={{ background: col.bg, color: col.text, borderColor: col.border }}
                          >
                            {b.pilier}
                          </span>
                          <p className="text-xs font-semibold flex-1">{b.titre}</p>
                          {format && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border"
                              style={{ borderColor: col.border, color: col.text }}>
                              {format}
                            </span>
                          )}
                          <span className="text-[10px] font-mono" style={{ color: done ? col.text : FF.textMuted }}>
                            {done ? "✓ Fait" : "Non fait"}
                          </span>
                        </div>
                        {exercises.length > 0 && (
                          <ul className="pl-1 space-y-0.5">
                            {exercises.map((ex, k) => (
                              <li key={k} className="text-[11px] flex items-center gap-1.5" style={{ color: FF.textMuted }}>
                                <span className="h-1 w-1 rounded-full inline-block flex-shrink-0" style={{ background: col.text }} />
                                {ex}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* Commentaire du coach */}
                {c.coach_comment && (
                  <div className="rounded-lg border p-2.5 mt-1" style={{ borderColor: FF.cyan, background: FF.cyanBg }}>
                    <p className="text-[10px] font-mono uppercase mb-0.5 flex items-center gap-1" style={{ color: FF.cyan }}>
                      <MessageSquare className="h-3 w-3" /> Mot de ton coach
                    </p>
                    <p className="text-xs" style={{ color: FF.text }}>{c.coach_comment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ icon, label, value, color, wide = false }: {
  icon: React.ReactNode; label: string; value: string; color: string; wide?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 border ${wide ? "col-span-3 flex items-center justify-between" : "flex flex-col items-center text-center"}`}
      style={{ background: FF.surface, borderColor: FF.border }}>
      <div className={`flex items-center gap-1.5 ${wide ? "" : "mb-2"}`} style={{ color: FF.textMuted }}>
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
      </div>
      <p className={`font-bold ${wide ? "text-2xl" : "text-xl"}`} style={{ color }}>{value}</p>
    </div>
  );
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
