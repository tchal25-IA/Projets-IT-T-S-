import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Loader2, Sparkles, Save, Trash2, ChevronDown, ChevronRight, TrendingUp, ExternalLink, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LS_KEYS, readLS, writeLS } from "@/lib/storage";
import { callAgent } from "@/lib/api";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business & création — Quotidien IA" },
      {
        name: "description",
        content: "Générez une proposition d'offre et un outline de pitch 10 slides assistés par IA.",
      },
      { property: "og:title", content: "Business & création — Quotidien IA" },
      {
        property: "og:description",
        content: "Offre, pricing et pitch : assistance IA pour structurer rapidement.",
      },
    ],
  }),
  component: BusinessPage,
});

const LS_BUSINESS = LS_KEYS.business;

type DocMode = "offre" | "pitch" | "etude" | "persona" | "naming";

type SavedDoc = {
  id: string;
  title: string;
  mode: DocMode;
  content: string;
  createdAt: string;
};

const MODE_PROMPTS: Record<DocMode, string> = {
  offre: "Génère une proposition d'offre claire et structurée : positionnement, promesse client, livrables détaillés, pricing recommandé et arguments de vente.",
  pitch: "Génère un outline de pitch deck en 10 slides (titre + 2 puces par slide) : problème, solution, marché, produit, traction, business model, concurrence, équipe, financier, ask.",
  etude: "Réalise une étude de marché synthétique : taille du marché, segments cibles, tendances clés, concurrents directs et indirects, opportunités et risques.",
  persona: "Génère 2 personas détaillés (nom, âge, profession, contexte, besoins, frustrations, parcours d'achat, canaux préférés).",
  naming: "Propose 10 noms de marque originaux et disponibles (.com idéalement), avec pour chacun une explication d'1 ligne et la tonalité véhiculée.",
};


function BusinessPage() {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [price, setPrice] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedDoc[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const [currentMode, setCurrentMode] = useState<DocMode>("offre");
  const [trendTopic, setTrendTopic] = useState("");

  useEffect(() => {
    setSaved(readLS<SavedDoc[]>(LS_BUSINESS, []));
  }, []);

  async function run(mode: DocMode) {
    if (!idea.trim()) return;
    setLoading(true);
    setOutput("");
    setCurrentMode(mode);
    const ctx = `Idée : ${idea}\nAudience : ${audience}\nPrix envisagé : ${price}\n\n${MODE_PROMPTS[mode]}`;
    try {
      const text = await callAgent("W2", ctx);
      setOutput(text);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  function saveOutput(mode: DocMode) {
    if (!output) return;
    const doc: SavedDoc = {
      id: crypto.randomUUID(),
      title: idea.slice(0, 60) || "Sans titre",
      mode,
      content: output,
      createdAt: new Date().toISOString(),
    };
    const next = [doc, ...saved];
    setSaved(next);
    writeLS(LS_BUSINESS, next);
  }

  function deleteDoc(id: string) {
    const next = saved.filter((d) => d.id !== id);
    setSaved(next);
    writeLS(LS_BUSINESS, next);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        eyebrow="Module"
        title="Business & création"
        description="Décrivez votre idée, l'IA propose une offre ou un outline de pitch."
      />

      {/* Formulaire */}
      <div className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Idée / produit *</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={3}
            placeholder="Ex : application mobile de suivi nutritionnel pour sportifs amateurs"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Audience cible</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex : 25–40 ans, actifs sportifs"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Prix envisagé</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex : 9 €/mois"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { mode: "offre" as DocMode, label: "Proposition d'offre", primary: true },
            { mode: "pitch" as DocMode, label: "Pitch 10 slides" },
            { mode: "etude" as DocMode, label: "Étude de marché" },
            { mode: "persona" as DocMode, label: "Personas" },
            { mode: "naming" as DocMode, label: "Idées de naming" },
          ]).map((b) => (
            <button
              key={b.mode}
              type="button"
              onClick={() => run(b.mode)}
              disabled={loading || !idea.trim()}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50",
                b.primary
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted",
              )}
            >
              {loading && currentMode === b.mode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tendances marché — Google Trends */}
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <TrendingUp className="h-4 w-4 text-primary" /> Tendances marché
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Vérifiez l'intérêt pour un sujet ou un mot-clé via Google Trends avant de vous lancer.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={trendTopic}
              onChange={(e) => setTrendTopic(e.target.value)}
              placeholder="Ex : nutrition sportive, IA générative…"
              className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && trendTopic.trim()) {
                  window.open(`https://trends.google.com/trends/explore?q=${encodeURIComponent(trendTopic.trim())}&geo=FR`, "_blank", "noopener");
                }
              }}
            />
          </div>
          <a
            href={trendTopic.trim()
              ? `https://trends.google.com/trends/explore?q=${encodeURIComponent(trendTopic.trim())}&geo=FR`
              : "https://trends.google.com/"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Voir les tendances <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          S'ouvre sur Google Trends (FR). Données indicatives, à croiser avec d'autres sources.
        </p>
      </section>

      {/* Résultat en cours */}
      {output && (
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="text-sm font-semibold">Résultat généré · {currentMode}</span>
            <div className="flex gap-2">
              <button
                onClick={() => saveOutput(currentMode)}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Save className="h-3.5 w-3.5" /> Sauvegarder
              </button>
              <button
                onClick={() => setOutput("")}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap p-5 text-sm leading-relaxed">{output}</pre>
        </div>
      )}

      {/* Documents sauvegardés */}
      {saved.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-bold">Documents sauvegardés</h2>
          <div className="space-y-2">
            {saved.map((doc) => (
              <div key={doc.id} className="overflow-hidden rounded-xl border bg-card shadow-card">
                <button
                  onClick={() => setOpenId(openId === doc.id ? null : doc.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                >
                  {openId === doc.id ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", doc.mode === "offre" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>
                    {doc.mode}
                  </span>
                  <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    className="ml-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
                {openId === doc.id && (
                  <pre className="whitespace-pre-wrap border-t px-5 py-4 text-sm leading-relaxed">{doc.content}</pre>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
