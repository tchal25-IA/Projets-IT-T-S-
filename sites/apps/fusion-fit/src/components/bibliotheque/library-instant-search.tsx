import { useMemo, useState } from "react";
import { Search, Film, Image as ImageIcon, BookOpen, X, Eye } from "lucide-react";
import { useLibrarySearch, type LibraryHit } from "@/hooks/use-library-search";
import { FF } from "@/lib/ff-colors";

const MODULES = [
  "module1", "module2", "module3_crossfit", "module3_wodtheque",
  "module4_hyrox", "module4B_hyrox_strategie", "module5_running",
  "module6A_natation", "module6B_cyclisme", "module8_yoga",
  "module9_reformer", "module10_fitboxing", "module11_postural",
];

/** Recherche instantanée catalogue FusionFit — facettes + aperçu. */
export function LibraryInstantSearch({
  onPick,
  types = ["exercise", "wod"],
}: {
  onPick?: (hit: LibraryHit) => void;
  types?: Array<"exercise" | "wod" | "knowledge">;
}) {
  const [q, setQ] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<Array<"exercise" | "wod" | "knowledge">>(types);
  const [preview, setPreview] = useState<LibraryHit | null>(null);

  const { data: hits = [], isFetching, isError, error } = useLibrarySearch(q, {
    types: typeFilter,
    modules: moduleFilter.length ? moduleFilter : undefined,
    limit: 24,
    enabled: q.trim().length >= 1 || moduleFilter.length > 0,
  });

  const facets = useMemo(() => {
    const mods: Record<string, number> = {};
    for (const h of hits) mods[h.module] = (mods[h.module] ?? 0) + 1;
    return mods;
  }, [hits]);

  function toggleModule(m: string) {
    setModuleFilter((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: FF.surface, borderColor: FF.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: FF.cyan }}>
          <BookOpen className="h-3.5 w-3.5" /> Recherche catalogue
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
          onKeyDown={(e) => { if (e.key === "Escape") setQ(""); }}
          placeholder="Mots-clés, FF-073, pompe, plank…"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border bg-transparent text-sm outline-none"
          style={{ borderColor: FF.border, color: FF.text, background: FF.surface2 }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Rechercher dans le catalogue"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Effacer"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
            <X className="h-3.5 w-3.5" style={{ color: FF.textMuted }} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {(["exercise", "wod", "knowledge"] as const).map((t) => {
          const on = typeFilter.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() =>
                setTypeFilter((prev) =>
                  on ? (prev.length === 1 ? prev : prev.filter((x) => x !== t)) : [...prev, t],
                )
              }
              className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border"
              style={{
                borderColor: on ? FF.cyan : FF.border,
                color: on ? FF.cyan : FF.textMuted,
                background: on ? FF.cyanBg : "transparent",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
        {MODULES.slice(0, 8).map((m) => {
          const on = moduleFilter.includes(m);
          const count = facets[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggleModule(m)}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
              style={{
                borderColor: on ? FF.amber : FF.border,
                color: on ? FF.amber : FF.textMuted,
              }}
            >
              {m.replace("module", "m")}{count != null ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {isError && (
        <p className="text-xs" style={{ color: FF.red }}>
          {error instanceof Error ? error.message : "Erreur de recherche"}
        </p>
      )}

      {!q.trim() && !moduleFilter.length && (
        <p className="text-[11px]" style={{ color: FF.textMuted }}>
          Tape un mot-clé (dès 1 caractère) ou filtre par module. Knowledge = consultation seule.
        </p>
      )}

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {hits.map((h) => (
          <div
            key={h.id}
            className="w-full text-left rounded-lg border p-2.5"
            style={{ borderColor: FF.border, background: FF.surface2 }}
          >
            <div className="flex items-start justify-between gap-2">
              <button type="button" className="min-w-0 text-left flex-1" onClick={() => onPick?.(h)}>
                <p className="text-sm font-semibold truncate">{h.nom_fr}</p>
                {h.nom_en && (
                  <p className="text-[11px] truncate" style={{ color: FF.textMuted }}>{h.nom_en}</p>
                )}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" aria-label="Aperçu" onClick={() => setPreview(h)}>
                  <Eye className="h-3.5 w-3.5" style={{ color: FF.textMuted }} />
                </button>
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
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border p-4 space-y-2 max-h-[80vh] overflow-y-auto"
            style={{ background: FF.surface, borderColor: FF.border }}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-semibold">{preview.nom_fr}</p>
                <p className="text-[10px] font-mono" style={{ color: FF.textMuted }}>{preview.code} · {preview.module}</p>
              </div>
              <button type="button" onClick={() => setPreview(null)}><X className="h-4 w-4" /></button>
            </div>
            {preview.nom_en && <p className="text-xs" style={{ color: FF.textMuted }}>{preview.nom_en}</p>}
            <p className="text-xs"><span style={{ color: FF.textMuted }}>Muscles : </span>{(preview.muscles_principaux ?? []).join(", ") || "—"}</p>
            <p className="text-xs"><span style={{ color: FF.textMuted }}>Matériel : </span>{(preview.materiel ?? []).join(", ") || "—"}</p>
            <p className="text-xs"><span style={{ color: FF.textMuted }}>Mots-clés : </span>{(preview.mots_cles ?? []).slice(0, 8).join(", ") || "—"}</p>
            {(preview.has_diagram || preview.has_video) && (
              <p className="text-[11px]" style={{ color: FF.cyan }}>
                Médias V2 prêts {preview.has_diagram ? "· schéma" : ""}{preview.has_video ? "· micro-vidéo" : ""}
              </p>
            )}
            {onPick && preview.item_type !== "knowledge" && (
              <button
                type="button"
                onClick={() => { onPick(preview); setPreview(null); }}
                className="w-full rounded-xl border py-2 text-sm font-semibold"
                style={{ borderColor: FF.cyan, color: FF.cyan, background: FF.cyanBg }}
              >
                Ajouter à la séance
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
