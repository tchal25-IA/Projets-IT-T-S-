import { useState } from "react";
import { Search, Film, Image as ImageIcon, BookOpen } from "lucide-react";
import { useLibrarySearch, type LibraryHit } from "@/hooks/use-library-search";
import { FF } from "@/lib/ff-colors";

/** Recherche instantanée sur le catalogue FusionFit (11 modules). */
export function LibraryInstantSearch({
  onPick,
  types = ["exercise", "wod"],
}: {
  onPick?: (hit: LibraryHit) => void;
  types?: Array<"exercise" | "wod" | "knowledge">;
}) {
  const [q, setQ] = useState("");
  const { data: hits = [], isFetching, isError, error } = useLibrarySearch(q, { types, limit: 20 });

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: FF.surface, borderColor: FF.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: FF.cyan }}>
          <BookOpen className="h-3.5 w-3.5" /> Catalogue FusionFit · recherche
        </p>
        <span className="text-[10px] font-mono" style={{ color: FF.textMuted }}>
          {isFetching ? "…" : `${hits.length} résultat${hits.length > 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: FF.textMuted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Mots-clés, FF-073, pompe, plank…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-transparent text-sm outline-none"
          style={{ borderColor: FF.border, color: FF.text, background: FF.surface2 }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {isError && (
        <p className="text-xs" style={{ color: FF.red }}>
          {error instanceof Error ? error.message : "Erreur de recherche"}
        </p>
      )}

      {!q.trim() && (
        <p className="text-[11px]" style={{ color: FF.textMuted }}>
          Tape un mot-clé pour filtrer le référentiel (exercices + WOD). Les fiches knowledge sont consultables via le filtre dédié plus tard.
        </p>
      )}

      {q.trim() && hits.length === 0 && !isFetching && (
        <p className="text-xs" style={{ color: FF.textMuted }}>Aucun résultat pour « {q} ».</p>
      )}

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {hits.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onPick?.(h)}
            className="w-full text-left rounded-lg border p-2.5 transition-colors hover:opacity-95"
            style={{ borderColor: FF.border, background: FF.surface2 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{h.nom_fr}</p>
                {h.nom_en && (
                  <p className="text-[11px] truncate" style={{ color: FF.textMuted }}>{h.nom_en}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {h.has_diagram && <ImageIcon className="h-3.5 w-3.5" style={{ color: FF.amber }} />}
                {h.has_video && <Film className="h-3.5 w-3.5" style={{ color: FF.cyan }} />}
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border"
                  style={{ borderColor: FF.border, color: FF.textMuted }}>
                  {h.code}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {h.categorie && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                  style={{ borderColor: FF.cyan, color: FF.cyan }}>{h.categorie}</span>
              )}
              {(h.materiel ?? []).slice(0, 3).map((m) => (
                <span key={m} className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                  style={{ borderColor: FF.border, color: FF.textMuted }}>{m}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
