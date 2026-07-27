import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Scale, Plus, Trash2, X } from "lucide-react";
import { useMyWeightEntries, useSaveWeight, useDeleteWeight } from "@/hooks/use-weight";
import { FF } from "@/lib/ff-colors";
import { todayISO } from "@/lib/dates";

const STORAGE_KEY = "ff-weight-module-enabled";

// Module suivi du poids : activable/désactivable via toggle local (préférence
// stockée dans localStorage, aucun besoin de schéma côté BDD). Une entrée par
// date, upsert lors de la sauvegarde.
export function WeightTracker() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setEnabled(v === "1");
    } catch {
      setEnabled(false);
    }
  }, []);

  function toggle() {
    const next = !(enabled ?? false);
    setEnabled(next);
    try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
  }

  if (enabled === null) return null;

  return (
    <section className="rounded-2xl border p-4" style={{ background: FF.surface, borderColor: FF.border }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4" style={{ color: FF.cyan }} />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: FF.textMuted }}>
            Suivi du poids
          </span>
        </div>
        <button
          onClick={toggle}
          className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded border"
          style={{
            borderColor: enabled ? FF.cyan : FF.border,
            background: enabled ? FF.cyanBg20 : "transparent",
            color: enabled ? FF.cyan : FF.textMuted,
          }}
        >
          {enabled ? "Activé" : "Activer"}
        </button>
      </div>
      {!enabled ? (
        <p className="text-xs" style={{ color: FF.textMuted }}>
          Active ce module pour saisir ton poids chaque semaine et suivre son évolution.
        </p>
      ) : (
        <WeightPanel />
      )}
    </section>
  );
}

function WeightPanel() {
  const { data: entries = [], isLoading } = useMyWeightEntries();
  const { mutateAsync: save, isPending } = useSaveWeight();
  const { mutate: del } = useDeleteWeight();
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  async function submit() {
    const w = parseFloat(weight.replace(",", "."));
    if (!w || w <= 0 || w > 500) {
      alert("Poids invalide (kg)");
      return;
    }
    try {
      await save({ weightKg: w, date, note: note.trim() || null });
      setShowForm(false);
      setWeight("");
      setNote("");
      setDate(todayISO());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map((e) => ({
      date: format(parseISO(e.date), "dd/MM", { locale: fr }),
      Poids: e.weight_kg,
    }));

  const latest = entries[0];
  const previous = entries[1];
  const delta = latest && previous ? +(latest.weight_kg - previous.weight_kg).toFixed(1) : null;

  return (
    <div className="space-y-3">
      {latest ? (
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold tabular-nums" style={{ color: FF.cyan }}>
            {latest.weight_kg.toFixed(1)}
            <span className="text-sm font-mono ml-1" style={{ color: FF.textMuted }}>kg</span>
          </p>
          {delta !== null && (
            <span className="text-xs font-mono" style={{ color: delta > 0 ? FF.amber : delta < 0 ? FF.green : FF.textMuted }}>
              {delta > 0 ? "+" : ""}{delta} kg vs précédent
            </span>
          )}
        </div>
      ) : (
        !isLoading && (
          <p className="text-xs" style={{ color: FF.textMuted }}>
            Aucune saisie pour le moment.
          </p>
        )
      )}

      {chartData.length >= 2 && (
        <div className="rounded-lg border p-2" style={{ borderColor: FF.border, background: FF.surface2 }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.04 220 / 30%)" />
              <XAxis dataKey="date" tick={{ fill: FF.textMuted, fontSize: 10 }} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: FF.textMuted, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: FF.surface, border: `1px solid ${FF.border}`, borderRadius: "0.5rem", fontSize: 11 }} labelStyle={{ color: FF.text }} />
              <Line type="monotone" dataKey="Poids" stroke={FF.cyan} strokeWidth={2} dot={{ r: 3, fill: FF.cyan }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest"
          style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
        >
          <Plus className="h-3.5 w-3.5" /> Nouvelle saisie
        </button>
      ) : (
        <div className="space-y-2 pt-1 border-t" style={{ borderColor: FF.border }}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              placeholder="Poids (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: FF.border, color: FF.text }}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
              style={{ borderColor: FF.border, color: FF.text, colorScheme: "dark" }}
            />
          </div>
          <input
            placeholder="Note (optionnel)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
            style={{ borderColor: FF.border, color: FF.text }}
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
            >
              {isPending ? "…" : "Enregistrer"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{ borderColor: FF.border, color: FF.textMuted }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-mono uppercase tracking-widest" style={{ color: FF.textMuted }}>
            Historique ({entries.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {entries.slice(0, 12).map((e) => (
              <li key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded border"
                style={{ borderColor: FF.border, background: FF.surface2 }}>
                <span className="font-mono text-[11px]" style={{ color: FF.textMuted }}>
                  {format(parseISO(e.date), "dd MMM yy", { locale: fr })}
                </span>
                <span className="flex-1 font-bold tabular-nums" style={{ color: FF.text }}>
                  {e.weight_kg.toFixed(1)} kg
                </span>
                {e.note && <span className="text-[11px] truncate" style={{ color: FF.textMuted }}>{e.note}</span>}
                <button
                  onClick={() => { if (confirm("Supprimer cette saisie ?")) del(e.id); }}
                  className="opacity-60 hover:opacity-100"
                  style={{ color: FF.textMuted }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
