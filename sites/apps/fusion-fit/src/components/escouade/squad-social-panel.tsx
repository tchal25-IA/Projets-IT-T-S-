import { useState } from "react";
import { Flag, Plus, Trophy } from "lucide-react";
import { FF } from "@/lib/ff-colors";
import { useSquadChallenges, useSquadLeaderboard } from "@/hooks/use-escouade";
import { ListSkeleton } from "@/components/ui-skeleton";
import { FeatureGate } from "@/components/feature-gate";

export function SquadSocialPanel({
  squadId,
  squadNom,
  isCoach,
}: {
  squadId: string;
  squadNom: string;
  isCoach: boolean;
}) {
  const content = <SquadSocialInner squadId={squadId} squadNom={squadNom} isCoach={isCoach} />;
  // Coach gère toujours ; athlète = plan Élite
  if (isCoach) return content;
  return <FeatureGate feature="escouades_premium">{content}</FeatureGate>;
}

function SquadSocialInner({
  squadId,
  squadNom,
  isCoach,
}: {
  squadId: string;
  squadNom: string;
  isCoach: boolean;
}) {
  const { list, create } = useSquadChallenges(squadId);
  const { data: board = [], isLoading: boardLoading } = useSquadLeaderboard(squadId);
  const [titre, setTitre] = useState("");
  const [showForm, setShowForm] = useState(false);

  return (
      <div className="space-y-3 pt-2 border-t" style={{ borderColor: FF.border }}>
        <p
          className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1"
          style={{ color: FF.amber }}
        >
          <Trophy className="h-3 w-3" /> Social · {squadNom}
        </p>

        <div>
          <p className="text-[10px] font-mono uppercase mb-1.5" style={{ color: FF.textMuted }}>
            Classement 7 jours
          </p>
          {boardLoading ? (
            <ListSkeleton count={2} />
          ) : board.length === 0 ? (
            <p className="text-[11px]" style={{ color: FF.textMuted }}>
              Pas encore de données.
            </p>
          ) : (
            <div className="space-y-1">
              {board.slice(0, 5).map((row, i) => (
                <div
                  key={row.abonne_id}
                  className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg"
                  style={{ background: FF.surface }}
                >
                  <span>
                    <span className="font-mono mr-2" style={{ color: FF.cyan }}>
                      #{i + 1}
                    </span>
                    {row.prenom}
                  </span>
                  <span className="font-mono" style={{ color: FF.textMuted }}>
                    {row.checkins_7j} check-ins · {row.completions_7j} séances
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-mono uppercase" style={{ color: FF.textMuted }}>
              Défis
            </p>
            {isCoach && (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="text-[10px] flex items-center gap-1"
                style={{ color: FF.green }}
              >
                <Plus className="h-3 w-3" /> Défi
              </button>
            )}
          </div>

          {showForm && isCoach && (
            <div className="flex gap-2 mb-2">
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: 5 check-ins cette semaine"
                className="flex-1 px-2 py-1.5 rounded-lg border bg-transparent text-xs outline-none"
                style={{ borderColor: FF.border, color: FF.text }}
              />
              <button
                disabled={!titre.trim() || create.isPending}
                onClick={async () => {
                  await create.mutateAsync({ titre: titre.trim(), target_value: 5 });
                  setTitre("");
                  setShowForm(false);
                }}
                className="px-2 py-1.5 rounded-lg border text-xs font-bold"
                style={{ borderColor: FF.green, color: FF.green }}
              >
                OK
              </button>
            </div>
          )}

          {list.isLoading ? (
            <ListSkeleton count={1} />
          ) : (list.data?.length ?? 0) === 0 ? (
            <p className="text-[11px]" style={{ color: FF.textMuted }}>
              Aucun défi actif.
            </p>
          ) : (
            <div className="space-y-1">
              {list.data!.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border px-2 py-1.5 text-xs"
                  style={{ borderColor: FF.border, background: FF.surface }}
                >
                  <p className="font-semibold flex items-center gap-1">
                    <Flag className="h-3 w-3" style={{ color: FF.amber }} />
                    {c.titre}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: FF.textMuted }}>
                    Objectif {c.target_value} · jusqu’au {c.ends_at}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
