import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Sparkles, AlertTriangle, TrendingUp, Minus } from "lucide-react";
import { analyzeFatigue } from "@/lib/fatigue.functions";
import { FeatureGate } from "@/components/feature-gate";

type Analysis = {
  tendance: "amelioration" | "stable" | "fatigue" | "surmenage";
  score_fatigue: number;
  resume: string;
  recommandation_coach: string;
  recommandation_abonne: string;
};

const TENDANCES = {
  amelioration: { label: "En progression", color: "var(--ff-green)", icon: TrendingUp },
  stable: { label: "Stable", color: "var(--ff-cyan)", icon: Minus },
  fatigue: { label: "Signes de fatigue", color: "var(--ff-amber)", icon: AlertTriangle },
  surmenage: { label: "Surmenage", color: "oklch(0.65 0.22 25)", icon: AlertTriangle },
} as const;

export function FatigueAnalysisCard(props: {
  targetUserId?: string;
  audience: "coach" | "abonne";
}) {
  if (props.audience === "coach") {
    return <FatigueAnalysisInner {...props} />;
  }
  return (
    <FeatureGate feature="ia_fatigue">
      <FatigueAnalysisInner {...props} />
    </FeatureGate>
  );
}

function FatigueAnalysisInner({
  targetUserId,
  audience,
}: {
  targetUserId?: string;
  audience: "coach" | "abonne";
}) {
  const run = useServerFn(analyzeFatigue);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lancer() {
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: targetUserId ? { targetUserId } : {} });
      setAnalysis(res as Analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur IA");
    } finally {
      setLoading(false);
    }
  }

  const t = analysis ? TENDANCES[analysis.tendance] : null;
  const Icon = t?.icon ?? Brain;

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        background: "var(--ff-surface)",
        borderColor: t ? t.color : "var(--ff-border)",
        boxShadow: t ? `0 0 16px ${t.color}33` : "none",
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: "var(--ff-amber)" }} />
        <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ff-amber)" }}>
          Analyse IA · Fatigue
        </p>
      </div>

      {!analysis && !loading && (
        <>
          <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
            L'IA analyse les derniers check-ins pour détecter fatigue ou surmenage.
          </p>
          <button
            onClick={lancer}
            className="w-full py-2 rounded-lg border text-sm font-bold"
            style={{
              borderColor: "var(--ff-amber)",
              background: "oklch(0.78 0.18 55 / 15%)",
              color: "var(--ff-amber)",
            }}
          >
            Lancer l'analyse
          </button>
        </>
      )}

      {loading && (
        <p className="text-xs text-center py-3 font-mono" style={{ color: "var(--ff-cyan)" }}>
          L'IA analyse les check-ins…
        </p>
      )}

      {error && (
        <p className="text-xs" style={{ color: "oklch(0.65 0.22 25)" }}>
          {error}
        </p>
      )}

      {analysis && t && (
        <>
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6" style={{ color: t.color }} />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: t.color }}>
                {t.label}
              </p>
              <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: "var(--ff-surface-2)" }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${analysis.score_fatigue}%`, background: t.color }}
                />
              </div>
              <p className="text-[10px] font-mono mt-1" style={{ color: "var(--ff-text-muted)" }}>
                Indice fatigue : {analysis.score_fatigue}/100
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--ff-text)" }}>
            {analysis.resume}
          </p>
          <div
            className="rounded-lg border p-3 text-xs leading-relaxed"
            style={{
              borderColor: "var(--ff-border)",
              background: "var(--ff-surface-2)",
              color: "var(--ff-text)",
            }}
          >
            <p className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--ff-amber)" }}>
              {audience === "coach" ? "Conseil tactique" : "Pour toi"}
            </p>
            {audience === "coach" ? analysis.recommandation_coach : analysis.recommandation_abonne}
          </div>
          <button
            onClick={lancer}
            className="w-full py-1.5 rounded-lg border text-[11px] font-mono uppercase"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
          >
            Relancer l'analyse
          </button>
        </>
      )}
    </div>
  );
}
