import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Dumbbell, Repeat, Calendar } from "lucide-react";
import {
  useCoachSessionFor, useSaveCoachSession, type CoachBloc,
} from "@/hooks/use-coaching";
import { notify } from "@/hooks/use-notifications";
import { PILIER_COLORS } from "@/lib/ff-colors";

const PILIERS: Array<CoachBloc["pilier"]> = ["Bouger", "Respirer", "Nourrir"];

/** Éditeur de la séance personnalisée du jour (coach) */
export function SeancePersoEditor({ abonneId, prenom }: { abonneId: string; prenom: string }) {
  const { data: existing, isLoading } = useCoachSessionFor(abonneId);
  const { mutateAsync: save, isPending } = useSaveCoachSession();
  const [titre, setTitre] = useState("");
  const [objectif, setObjectif] = useState("");
  const [frequence, setFrequence] = useState(3);
  const [mode, setMode] = useState<"recurrent" | "jour">("recurrent");
  const [dateSeance, setDateSeance] = useState("");
  const [actif, setActif] = useState(true);
  const [blocs, setBlocs] = useState<CoachBloc[]>([{ pilier: "Bouger", titre: "", exercices: [] }]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isLoading || hydrated) return;
    if (existing) {
      setTitre(existing.titre);
      setObjectif(existing.objectif ?? "");
      setFrequence(existing.frequence_jours);
      setActif(existing.actif);
      if (existing.date_seance) { setMode("jour"); setDateSeance(existing.date_seance); }
      setBlocs(existing.blocs.length ? existing.blocs : [{ pilier: "Bouger", titre: "", exercices: [] }]);
    }
    setHydrated(true);
  }, [existing, isLoading, hydrated]);

  function updBloc(i: number, patch: Partial<CoachBloc>) {
    setBlocs((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }
  function addBlocPerso() {
    setBlocs((bs) => [...bs, { pilier: "Bouger", titre: "", exercices: [] }]);
  }
  function delBlocPerso(i: number) {
    setBlocs((bs) => bs.filter((_, j) => j !== i));
  }

  async function enregistrer() {
    if (!titre.trim()) { alert("Donne un titre à la séance."); return; }
    if (mode === "jour" && !dateSeance) { alert("Choisis une date pour la séance."); return; }
    const clean = blocs
      .map((b) => ({ ...b, exercices: b.exercices.filter((e) => e.trim()) }))
      .filter((b) => b.titre.trim() || b.exercices.length);
    try {
      await save({
        abonne_id: abonneId,
        titre: titre.trim(),
        objectif: objectif.trim() || null,
        blocs: clean,
        frequence_jours: frequence,
        date_seance: mode === "jour" ? dateSeance : null,
        actif,
      });
      setSavedMsg("Séance enregistrée · disponible pour l'abonné ✓");
      setTimeout(() => setSavedMsg(null), 2500);
      await notify(abonneId, "seance", "Nouvelle séance de ton coach",
        `« ${titre.trim()} » t'attend dans ta Routine.`, "/fusionfit/routine");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-cyan)" }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
          <Dumbbell className="h-3.5 w-3.5" /> Séance perso de {prenom}
        </p>
        <button onClick={enregistrer} disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
          style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)", background: "oklch(0.65 0.18 145 / 12%)" }}>
          <Save className="h-3.5 w-3.5" /> {isPending ? "…" : "Enregistrer"}
        </button>
      </div>
      <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
        L'abonné pourra choisir cette séance à la place du programme de base, selon la fréquence définie.
      </p>
      {savedMsg && <p className="text-[10px]" style={{ color: "var(--ff-green)" }}>{savedMsg}</p>}

      <input
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Titre (ex: Force + Hyrox du jour)"
        className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
      />
      <input
        value={objectif}
        onChange={(e) => setObjectif(e.target.value)}
        placeholder="Objectif de la séance (optionnel)"
        className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
      />

      {/* Choix : récurrent ou jour précis */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("recurrent")}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold"
          style={{
            borderColor: mode === "recurrent" ? "var(--ff-cyan)" : "var(--ff-border)",
            background: mode === "recurrent" ? "oklch(0.78 0.16 198 / 15%)" : "transparent",
            color: mode === "recurrent" ? "var(--ff-cyan)" : "var(--ff-text-muted)",
          }}
        >
          <Repeat className="h-3.5 w-3.5" /> Récurrente
        </button>
        <button
          type="button"
          onClick={() => setMode("jour")}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold"
          style={{
            borderColor: mode === "jour" ? "var(--ff-cyan)" : "var(--ff-border)",
            background: mode === "jour" ? "oklch(0.78 0.16 198 / 15%)" : "transparent",
            color: mode === "jour" ? "var(--ff-cyan)" : "var(--ff-text-muted)",
          }}
        >
          <Calendar className="h-3.5 w-3.5" /> Jour précis
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {mode === "recurrent" ? (
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--ff-text-muted)" }}>
            <Repeat className="h-3.5 w-3.5" /> Tous les
            <input
              type="number" min={1} max={30} value={frequence}
              onChange={(e) => setFrequence(Math.max(1, Math.min(30, +e.target.value || 1)))}
              className="w-14 px-2 py-1 rounded border bg-transparent text-sm outline-none text-center"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
            />
            jour(s)
          </label>
        ) : (
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--ff-text-muted)" }}>
            <Calendar className="h-3.5 w-3.5" /> Le
            <input
              type="date" value={dateSeance}
              onChange={(e) => setDateSeance(e.target.value)}
              className="px-2 py-1 rounded border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }}
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: actif ? "var(--ff-green)" : "var(--ff-text-muted)" }}>
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
          {actif ? "Active" : "Désactivée"}
        </label>
      </div>

      <div className="space-y-2">
        {blocs.map((b, i) => {
          const col = PILIER_COLORS[b.pilier];
          return (
            <div key={i} className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: col.border, background: "var(--ff-surface-2)" }}>
              <div className="flex gap-2">
                <select
                  value={b.pilier}
                  onChange={(e) => updBloc(i, { pilier: e.target.value as CoachBloc["pilier"] })}
                  className="px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: col.text }}
                >
                  {PILIERS.map((p) => (
                    <option key={p} value={p} style={{ background: "var(--ff-bg)" }}>{p}</option>
                  ))}
                </select>
                <input
                  value={b.titre}
                  onChange={(e) => updBloc(i, { titre: e.target.value })}
                  placeholder="Titre du bloc (ex: AMRAP 20 min)"
                  className="flex-1 px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                />
                <button onClick={() => delBlocPerso(i)} className="p-1" style={{ color: "var(--ff-text-muted)" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={b.exercices.join("\n")}
                onChange={(e) => updBloc(i, { exercices: e.target.value.split("\n") })}
                placeholder="Un exercice par ligne (ex: 5 Burpees)"
                rows={3}
                className="w-full px-2 py-1 rounded border bg-transparent text-xs outline-none resize-y min-h-[5rem]"
                style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
              />
            </div>
          );
        })}
      </div>
      <button
        onClick={addBlocPerso}
        className="w-full py-2 rounded-lg border border-dashed text-xs flex items-center justify-center gap-1"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
      </button>
    </section>
  );
}
