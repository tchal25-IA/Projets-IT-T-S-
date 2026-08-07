import { Activity } from "lucide-react";
import { PILIER_COLORS } from "@/lib/ff-colors";
import type { Session } from "./types";

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border p-2.5 text-center" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
      <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--ff-text-muted)" }}>{label}</p>
    </div>
  );
}

/** Recap performance de l'abonné (agrégé sur ses séances) */
export function PerformanceRecap({ sessions }: { sessions: Session[] }) {
  const done = sessions.filter((s) => s.session_ended);
  const n = done.length;

  if (n === 0) {
    return (
      <section className="rounded-2xl border p-4" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1 mb-2" style={{ color: "var(--ff-cyan)" }}>
          <Activity className="h-3.5 w-3.5" /> Performance
        </p>
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucune séance terminée pour le moment. Les stats apparaîtront dès la première séance de l'abonné.
        </p>
      </section>
    );
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const sereniteMoy = Math.round(avg(done.map((s) => s.serenite)));
  const completion = Math.round(
    avg(done.map((s) => (s.nb_blocs > 0 ? ((s.blocs_completes?.length ?? 0) / s.nb_blocs) * 100 : 0)))
  );
  const ressentis = done.map((s) => s.ressenti_score).filter((v): v is number => v != null);
  const ressentiMoy = ressentis.length ? +(avg(ressentis)).toFixed(1) : null;
  const dureeMoy = Math.round(avg(done.map((s) => s.session_duration_sec ?? 0)) / 60);
  const nbCoach = done.filter((s) => s.session_source === "coach").length;
  const nbBase = n - nbCoach;

  // Complétion par activité (piliers) sur les séances "base" (ordre fixe Bouger/Respirer/Nourrir)
  const base = done.filter((s) => s.session_source !== "coach");
  const PIL = [{ idx: 0, key: "Bouger" as const }, { idx: 1, key: "Respirer" as const }, { idx: 2, key: "Nourrir" as const }];
  const parActivite = PIL.map(({ idx, key }) => {
    const presentes = base.filter((s) => s.nb_blocs > idx);
    const faites = presentes.filter((s) => (s.blocs_completes ?? []).includes(idx));
    return { key, total: presentes.length, fait: faites.length };
  }).filter((p) => p.total > 0);

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
      <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
        <Activity className="h-3.5 w-3.5" /> Performance · {n} séance{n > 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Complétion moy." value={`${completion}%`} color="var(--ff-cyan)" />
        <Stat label="Sérénité moy." value={`${sereniteMoy}%`} color="var(--ff-cyan)" />
        <Stat label="Ressenti moy." value={ressentiMoy != null ? `${ressentiMoy}/5` : "—"} color="var(--ff-green)" />
        <Stat label="Durée moy." value={`${dureeMoy} min`} color="var(--ff-amber)" />
      </div>

      <div className="flex gap-2 text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
        <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--ff-border)" }}>{nbBase} base</span>
        <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>{nbCoach} coach</span>
      </div>

      {parActivite.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            Complétion par activité (base)
          </p>
          {parActivite.map((p) => {
            const col = PILIER_COLORS[p.key];
            const pct = Math.round((p.fait / p.total) * 100);
            return (
              <div key={p.key}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span style={{ color: col.text }}>{p.key}</span>
                  <span style={{ color: "var(--ff-text-muted)" }}>{p.fait}/{p.total} · {pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ff-surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col.text }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
