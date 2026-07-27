import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { callAgent } from "@/lib/api";
import { useToast } from "@/components/toast";

export const Route = createFileRoute("/contenu")({
  head: () => ({
    meta: [
      { title: "Contenu & connaissance — Quotidien IA" },
      {
        name: "description",
        content: "Résumez un texte ou un lien, traduisez vers la langue de votre choix avec l'IA.",
      },
      { property: "og:title", content: "Contenu & connaissance — Quotidien IA" },
      {
        property: "og:description",
        content: "Résumé et traduction assistés par IA. Vérifiez toujours les sources originales.",
      },
    ],
  }),
  component: ContenuPage,
});

const LANGS = ["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais"];

function ContenuPage() {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [lang, setLang] = useState("Anglais");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(mode: "summary" | "translate") {
    if (!text.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const userInput =
        mode === "summary"
          ? `Résume ce texte en français, en 5 à 8 puces claires :\n\n${text}`
          : `Traduis ce texte en ${lang} en gardant le style :\n\n${text}`;
      const result = await callAgent("W4", userInput);
      setOutput(result);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        eyebrow="Module"
        title="Contenu & connaissance"
        description="Collez un article, un email ou un texte long. L'IA résume ou traduit pour vous."
      />

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Collez ici un texte ou une URL à analyser…"
          className="w-full resize-y rounded-md border bg-background p-3 text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => run("summary")}
            disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Résumer
          </button>
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => run("translate")}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Traduire
            </button>
          </div>
        </div>
      </div>

      {output && (
        <pre className="whitespace-pre-wrap rounded-2xl border bg-card p-5 text-sm leading-relaxed shadow-card">
          {output}
        </pre>
      )}

      <Disclaimer variant="ai" />
    </div>
  );
}
