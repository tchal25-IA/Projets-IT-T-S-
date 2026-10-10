import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { useAthletes } from "@/hooks/use-messages";
import { useTrainingSlots } from "@/hooks/use-creneaux";
import { FF } from "@/lib/ff-colors";

type Traffic = "rouge" | "orange" | "vert" | "gris";

function trafficFromAthlete(a: {
  avg_energie: number | null;
  avg_humeur: number | null;
  checkins_7d?: number;
}): Traffic {
  if (a.avg_energie == null && a.avg_humeur == null) return "gris";
  const e = a.avg_energie ?? 3;
  const h = a.avg_humeur ?? 3;
  if (e <= 2 || h <= 2) return "rouge";
  if (e <= 3 || h <= 3) return "orange";
  return "vert";
}

const COLOR: Record<Traffic, string> = {
  rouge: FF.red,
  orange: FF.amber,
  vert: FF.green,
  gris: FF.textMuted,
};

const WHY: Record<Traffic, string> = {
  rouge: "Énergie ou humeur basse — contacter / adapter",
  orange: "Charge à surveiller cette semaine",
  vert: "OK pour s'entraîner",
  gris: "Données insuffisantes (pas de check-in récent)",
};

/** Dashboard Coach « test des 3 secondes » (CDC). */
export function CoachDashboard3s({ nbAbonnes }: { nbAbonnes: number }) {
  const { data: athletes = [] } = useAthletes();
  const { data: allSlots = [] } = useTrainingSlots();
  const [filter, setFilter] = useState<Traffic | "all">("all");

  const enriched = useMemo(
    () =>
      athletes.map((a) => ({
        ...a,
        traffic: trafficFromAthlete(a),
      })),
    [athletes],
  );

  const counts = useMemo(() => {
    const c = { rouge: 0, orange: 0, vert: 0, gris: 0 };
    for (const a of enriched) c[a.traffic]++;
    return c;
  }, [enriched]);

  const priority = useMemo(() => {
    const order: Traffic[] = ["rouge", "orange", "gris", "vert"];
    return [...enriched]
      .sort((a, b) => order.indexOf(a.traffic) - order.indexOf(b.traffic))
      .slice(0, 5);
  }, [enriched]);

  const filtered = filter === "all" ? enriched : enriched.filter((a) => a.traffic === filter);

  const now = Date.now();
  const in7d = now + 7 * 86400_000;
  const slots = allSlots.filter((s) => {
    const t = new Date(s.date_slot).getTime();
    return t >= now && t <= in7d;
  });

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: FF.surface, borderColor: FF.border }}
    >
      <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: FF.amber }}>
        Dashboard · Qui traiter aujourd'hui ?
      </p>

      {/* Bandeau 4 compteurs cliquables */}
      <div className="grid grid-cols-4 gap-1.5">
        {(["rouge", "orange", "vert", "gris"] as Traffic[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter((f) => (f === t ? "all" : t))}
            className="rounded-lg border p-2 text-center"
            style={{
              borderColor: filter === t ? COLOR[t] : FF.border,
              background: FF.surface2,
            }}
          >
            <p className="text-lg font-bold tabular-nums" style={{ color: COLOR[t] }}>{counts[t]}</p>
            <p className="text-[8px] font-mono uppercase" style={{ color: FF.textMuted }}>{t}</p>
          </button>
        ))}
      </div>

      {/* À traiter aujourd'hui */}
      <div>
        <p className="text-[10px] font-mono uppercase mb-1.5 flex items-center gap-1" style={{ color: FF.red }}>
          <AlertTriangle className="h-3 w-3" /> À traiter aujourd'hui
        </p>
        <div className="space-y-1">
          {priority.filter((a) => a.traffic !== "vert").slice(0, 5).map((a) => (
            <Link
              key={a.user_id}
              to="/fusionfit/escouade/$abonneId"
              params={{ abonneId: a.user_id }}
              className="flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs"
              style={{ borderColor: FF.border, background: FF.surface2 }}
            >
              <span className="font-semibold">{a.prenom}</span>
              <span className="text-[10px] truncate max-w-[55%] text-right" style={{ color: COLOR[a.traffic] }}>
                {WHY[a.traffic]}
              </span>
            </Link>
          ))}
          {priority.every((a) => a.traffic === "vert") && (
            <p className="text-[11px]" style={{ color: FF.textMuted }}>Rien d'urgent — portefeuille au vert.</p>
          )}
        </div>
      </div>

      {/* Grille athlètes */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase" style={{ color: FF.cyan }}>
            Escouade ({nbAbonnes})
          </p>
          {filter !== "all" && (
            <button type="button" onClick={() => setFilter("all")} className="text-[9px] underline" style={{ color: FF.textMuted }}>
              tout voir
            </button>
          )}
        </div>
        {filtered.map((a) => (
          <Link
            key={a.user_id}
            to="/fusionfit/escouade/$abonneId"
            params={{ abonneId: a.user_id }}
            className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
            style={{ borderColor: FF.border, background: FF.surface2 }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: COLOR[a.traffic] }}
              title={a.traffic}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{a.prenom}</p>
              <p className="text-[10px]" style={{ color: FF.textMuted }}>
                Énergie {a.avg_energie ?? "—"} · Humeur {a.avg_humeur ?? "—"}
              </p>
            </div>
            <span className="text-[9px] font-mono uppercase" style={{ color: COLOR[a.traffic] }}>
              {a.traffic}
            </span>
          </Link>
        ))}
      </div>

      {slots.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 mb-1.5" style={{ color: FF.cyan }}>
            <CalendarClock className="h-3 w-3" /> Agenda 7j
          </p>
          <div className="space-y-1">
            {slots.slice(0, 4).map((s) => {
              const d = new Date(s.date_slot);
              const prenom = athletes.find((a) => a.user_id === s.abonne_id)?.prenom ?? "Athlète";
              return (
                <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 rounded"
                  style={{ background: FF.surface2 }}>
                  <span>
                    {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })} ·{" "}
                    {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {prenom}
                  </span>
                  <span className="text-[10px] font-mono uppercase"
                    style={{ color: s.status === "valide" ? FF.green : FF.amber }}>
                    {s.status === "valide" ? "validé" : "attente"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
