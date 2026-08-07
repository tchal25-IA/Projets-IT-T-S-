import { Video } from "lucide-react";
import { FF } from "@/lib/ff-colors";
import { FeatureGate } from "@/components/feature-gate";

/** Placeholder bilans vidéo — réservé plan Élite. */
export function BilansVideoCard() {
  return (
    <FeatureGate feature="bilans_video">
      <div
        className="rounded-2xl border p-4 space-y-2"
        style={{ background: FF.surface, borderColor: FF.border }}
      >
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4" style={{ color: "oklch(0.80 0.20 300)" }} />
          <p
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: "oklch(0.80 0.20 300)" }}
          >
            Bilans vidéo · Élite
          </p>
        </div>
        <p className="text-xs" style={{ color: FF.textMuted }}>
          Ton coach pourra déposer ici un bilan vidéo hebdomadaire. Bientôt disponible.
        </p>
      </div>
    </FeatureGate>
  );
}
