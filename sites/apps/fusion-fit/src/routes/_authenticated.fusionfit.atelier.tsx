import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, Trash2, Send, Dumbbell, Loader2, ChevronDown, ChevronUp, X, Check,
} from "lucide-react";
import { FF } from "@/lib/ff-colors";
import { useAuth } from "@/hooks/use-auth";
import { useEscouadeData } from "@/hooks/use-escouade";
import { LibraryInstantSearch } from "@/components/bibliotheque/library-instant-search";
import type { LibraryHit } from "@/hooks/use-library-search";
import {
  useAtelierTemplates,
  useAtelierSessionDetail,
  useAtelierMutations,
  type AtelierPhase,
  type AtelierItem,
  type AtelierBlock,
} from "@/hooks/use-atelier";

export const Route = createFileRoute("/_authenticated/fusionfit/atelier")({
  component: AtelierPage,
});

const PHASES: { id: AtelierPhase; label: string }[] = [
  { id: "warm_up", label: "Échauffement" },
  { id: "main", label: "Corps de séance" },
  { id: "cool_down", label: "Retour au calme" },
];

function AtelierPage() {
  const { role } = useAuth();
  const { data: templates = [], isLoading } = useAtelierTemplates();
  const mut = useAtelierMutations();
  const { data: escouade } = useEscouadeData();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [objectif, setObjectif] = useState("");
  const [targetPhase, setTargetPhase] = useState<AtelierPhase>("main");
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const detail = useAtelierSessionDetail(activeId);

  if (role !== "coach") {
    return (
      <p className="text-sm" style={{ color: FF.textMuted }}>
        Atelier réservé au coach.
      </p>
    );
  }

  async function handleCreate() {
    if (!title.trim()) return;
    const s = await mut.createTemplate.mutateAsync({ title, objectif });
    setCreating(false);
    setTitle("");
    setObjectif("");
    setActiveId(s.id);
  }

  async function handlePick(hit: LibraryHit) {
    if (!activeId) {
      setMsg("Ouvre ou crée un modèle avant d'ajouter un exercice.");
      return;
    }
    await mut.addItemFromLibrary.mutateAsync({
      sessionId: activeId,
      phase: targetPhase,
      hit,
    });
  }

  async function handleAssign() {
    if (!activeId || !selectedAthletes.length) return;
    const res = await mut.assignTemplate.mutateAsync({
      templateId: activeId,
      athleteIds: selectedAthletes,
      scheduledFor: scheduledFor || null,
    });
    setAssignOpen(false);
    setSelectedAthletes([]);
    setMsg(`Attribution : ${res.ok_count} instance(s) créée(s).`);
  }

  const blocksByPhase = useMemo(() => {
    const map: Record<AtelierPhase, { block: AtelierBlock; items: AtelierItem[] }[]> = {
      warm_up: [],
      main: [],
      cool_down: [],
    };
    if (!detail.data) return map;
    for (const b of detail.data.blocks) {
      map[b.phase].push({
        block: b,
        items: detail.data.items.filter((i) => i.block_id === b.id),
      });
    }
    return map;
  }, [detail.data]);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: FF.amber }}>
            Coach · Atelier
          </p>
          <h1 className="text-xl font-bold">Création de séances</h1>
          <p className="text-xs mt-0.5" style={{ color: FF.textMuted }}>
            Compose un modèle, attribue des instances indépendantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: FF.cyan, color: FF.cyan, background: FF.cyanBg }}
        >
          <Plus className="h-3.5 w-3.5" /> Modèle
        </button>
      </header>

      {msg && (
        <p className="text-xs rounded-lg border px-3 py-2" style={{ borderColor: FF.cyan, color: FF.cyan }}>
          {msg}
          <button type="button" className="ml-2 underline" onClick={() => setMsg(null)}>ok</button>
        </p>
      )}

      {creating && (
        <section className="rounded-2xl border p-4 space-y-2" style={{ background: FF.surface, borderColor: FF.border }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du modèle"
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
            style={{ borderColor: FF.border, color: FF.text }}
          />
          <input
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            placeholder="Objectif (optionnel)"
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
            style={{ borderColor: FF.border, color: FF.text }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={mut.createTemplate.isPending || !title.trim()}
              onClick={handleCreate}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"
              style={{ borderColor: FF.cyan, color: FF.cyan }}
            >
              {mut.createTemplate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Créer
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs" style={{ color: FF.textMuted }}>
              Annuler
            </button>
          </div>
        </section>
      )}

      {/* Liste modèles */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase" style={{ color: FF.textMuted }}>
          Mes modèles ({templates.length})
        </p>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" style={{ color: FF.cyan }} />}
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id === activeId ? null : t.id)}
            className="w-full text-left rounded-xl border p-3"
            style={{
              borderColor: t.id === activeId ? FF.amber : FF.border,
              background: t.id === activeId ? FF.amberBg : FF.surface,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">{t.title}</p>
              <span className="text-[9px] font-mono uppercase" style={{ color: FF.textMuted }}>{t.status}</span>
            </div>
            {t.objectif && (
              <p className="text-[11px] mt-0.5 truncate" style={{ color: FF.textMuted }}>{t.objectif}</p>
            )}
          </button>
        ))}
        {!isLoading && templates.length === 0 && (
          <p className="text-xs" style={{ color: FF.textMuted }}>Aucun modèle — crée le premier.</p>
        )}
      </section>

      {activeId && detail.data && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold"
              style={{ borderColor: FF.amber, color: FF.amber, background: FF.amberBg }}
            >
              <Send className="h-3.5 w-3.5" /> Attribuer
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Supprimer ce modèle ? Les instances déjà attribuées restent.")) return;
                await mut.deleteTemplate.mutateAsync(activeId);
                setActiveId(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs"
              style={{ borderColor: FF.border, color: FF.red }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
          </div>

          <div className="flex gap-1 flex-wrap">
            {PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTargetPhase(p.id)}
                className="text-[10px] font-mono uppercase px-2 py-1 rounded-full border"
                style={{
                  borderColor: targetPhase === p.id ? FF.cyan : FF.border,
                  color: targetPhase === p.id ? FF.cyan : FF.textMuted,
                  background: targetPhase === p.id ? FF.cyanBg : "transparent",
                }}
              >
                + {p.label}
              </button>
            ))}
          </div>

          <LibraryInstantSearch onPick={handlePick} types={["exercise", "wod"]} />

          {PHASES.map((p) => {
            const group = blocksByPhase[p.id];
            const items = group.flatMap((g) => g.items);
            return (
              <section
                key={p.id}
                className="rounded-2xl border p-3 space-y-2"
                style={{ background: FF.surface, borderColor: FF.border }}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: FF.cyan }}>
                  <Dumbbell className="h-3 w-3" /> {p.label}
                  <span className="ml-auto" style={{ color: FF.textMuted }}>{items.length}</span>
                </p>
                {items.length === 0 && (
                  <p className="text-[11px]" style={{ color: FF.textMuted }}>
                    Vide — sélectionne « + {p.label} » puis un exercice.
                  </p>
                )}
                {items.map((it) => {
                  const snap = it.exercise_snapshot as { nom_fr?: string; code?: string };
                  return (
                    <div
                      key={it.id}
                      className="rounded-lg border p-2.5 space-y-1.5"
                      style={{ borderColor: FF.border, background: FF.surface2 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{snap.nom_fr ?? "Exercice"}</p>
                          <p className="text-[9px] font-mono" style={{ color: FF.textMuted }}>{snap.code}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => mut.deleteItem.mutate({ sessionId: activeId, itemId: it.id })}
                          aria-label="Retirer"
                        >
                          <X className="h-3.5 w-3.5" style={{ color: FF.red }} />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            ["sets", it.sets],
                            ["reps", it.reps],
                            ["level", it.level],
                            ["rpe", it.rpe],
                          ] as const
                        ).map(([k, v]) => (
                          <label key={k} className="text-[9px] font-mono uppercase" style={{ color: FF.textMuted }}>
                            {k}
                            <input
                              type="number"
                              value={v ?? ""}
                              onChange={(e) => {
                                const n = e.target.value === "" ? null : Number(e.target.value);
                                mut.updateItem.mutate({
                                  sessionId: activeId,
                                  itemId: it.id,
                                  patch: { [k]: n },
                                });
                              }}
                              className="mt-0.5 w-full rounded border bg-transparent px-1 py-1 text-xs outline-none"
                              style={{ borderColor: FF.border, color: FF.text }}
                            />
                          </label>
                        ))}
                      </div>
                      <input
                        value={it.load ?? ""}
                        onChange={(e) =>
                          mut.updateItem.mutate({
                            sessionId: activeId,
                            itemId: it.id,
                            patch: { load: e.target.value || null },
                          })
                        }
                        placeholder="Charge (ex. 16 kg)"
                        className="w-full rounded border bg-transparent px-2 py-1 text-xs outline-none"
                        style={{ borderColor: FF.border, color: FF.text }}
                      />
                      <div className="flex gap-1">
                        {PHASES.filter((x) => x.id !== p.id).map((dest) => (
                          <button
                            key={dest.id}
                            type="button"
                            onClick={() =>
                              mut.moveItemPhase.mutate({
                                sessionId: activeId,
                                itemId: it.id,
                                fromBlockId: it.block_id,
                                toPhase: dest.id,
                              })
                            }
                            className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5"
                            style={{ borderColor: FF.border, color: FF.textMuted }}
                          >
                            {dest.id === "warm_up" ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                            {dest.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-4 space-y-3"
            style={{ background: FF.surface, borderColor: FF.border }}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Attribuer le modèle</p>
              <button type="button" onClick={() => setAssignOpen(false)}>
                <X className="h-4 w-4" style={{ color: FF.textMuted }} />
              </button>
            </div>
            <p className="text-[11px]" style={{ color: FF.textMuted }}>
              Chaque athlète reçoit une instance indépendante (copy-on-assign).
            </p>
            <input
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
              style={{ borderColor: FF.border, color: FF.text }}
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {(escouade?.abonnes ?? []).map((a) => {
                const on = selectedAthletes.includes(a.user_id);
                return (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() =>
                      setSelectedAthletes((prev) =>
                        on ? prev.filter((id) => id !== a.user_id) : [...prev, a.user_id],
                      )
                    }
                    className="w-full text-left rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: on ? FF.cyan : FF.border,
                      background: on ? FF.cyanBg : FF.surface2,
                    }}
                  >
                    {a.prenom}
                  </button>
                );
              })}
              {!escouade?.abonnes?.length && (
                <p className="text-xs" style={{ color: FF.textMuted }}>Aucun athlète dans ton escouade.</p>
              )}
            </div>
            <button
              type="button"
              disabled={!selectedAthletes.length || mut.assignTemplate.isPending}
              onClick={handleAssign}
              className="w-full rounded-xl border py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
              style={{ borderColor: FF.amber, color: FF.amber, background: FF.amberBg }}
            >
              {mut.assignTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Attribuer ({selectedAthletes.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
