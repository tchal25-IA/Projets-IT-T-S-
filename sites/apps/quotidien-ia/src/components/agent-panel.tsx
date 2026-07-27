import { useState } from "react";
import { Sparkles, Loader2, Wallet, CalendarCheck, ListTodo, Newspaper, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Disclaimer } from "@/components/disclaimer";
import { supabase } from "@/integrations/supabase/client";
export type WorkflowId = "W1" | "W2" | "W3" | "W4";

const WORKFLOWS: {
  id: WorkflowId;
  label: string;
  icon: typeof Wallet;
  prompt: string;
  hint: string;
}[] = [
  {
    id: "W1",
    label: "Diagnostic financier express",
    icon: Wallet,
    prompt:
      "Je veux un diagnostic financier express. Pose-moi des questions courtes (revenus mensuels nets, charges fixes principales, épargne actuelle) puis donne 3 leviers concrets et un lien vers Finzy.",
    hint: "Ex : revenus 3200€, loyer 950€, épargne 8 000€…",
  },
  {
    id: "W2",
    label: "Préparer une réunion / conférence",
    icon: CalendarCheck,
    prompt:
      "Aide-moi à préparer un événement. Demande-moi le titre, la date, le lieu, l'objectif. Génère ensuite une checklist de préparation (J-7, J-1, H-2) et un outline de présentation si pertinent.",
    hint: "Ex : conférence client, le 12/06, à Genève, objectif vendre…",
  },
  {
    id: "W3",
    label: "Plan de semaine",
    icon: ListTodo,
    prompt:
      "Aide-moi à organiser ma semaine. Demande mes 3 à 5 priorités, puis propose un plan jour par jour avec maximum 3 priorités quotidiennes. Termine par un lien vers TaskFlow.",
    hint: "Ex : finir devis client, sport 3x, lecture 30min/jour…",
  },
  {
    id: "W4",
    label: "Brief actualité (léger)",
    icon: Newspaper,
    prompt:
      "Génère un brief d'actualité indicatif sur les thèmes que je vais te donner. Reste prudent et rappelle de vérifier les sources officielles.",
    hint: "Ex : économie France, tech IA, marchés actions…",
  },
];

type AgentSection = {
  hypotheses?: string;
  synthese?: string;
  actions?: string;
  echeances?: string;
  sources?: string;
  avertissement?: string;
  raw?: string;
};

function parseSections(text: string): AgentSection {
  // Sections attendues, séparées par les titres en gras Markdown
  const map: Record<string, keyof AgentSection> = {
    hypothèses: "hypotheses",
    hypotheses: "hypotheses",
    synthèse: "synthese",
    synthese: "synthese",
    "actions recommandées": "actions",
    "actions recommandees": "actions",
    actions: "actions",
    échéances: "echeances",
    echeances: "echeances",
    sources: "sources",
    "sources & liens utiles": "sources",
    avertissement: "avertissement",
  };

  const out: AgentSection = { raw: text };
  // Capture "## Titre" ou "**Titre**" suivi du contenu jusqu'au prochain titre
  const regex = /(?:^|\n)\s*(?:#{1,4}\s*|\*\*)([^\n*#]+?)(?:\*\*)?\s*(?::)?\s*\n([\s\S]*?)(?=\n\s*(?:#{1,4}\s*|\*\*)[^\n*#]+|$)/gi;
  let match: RegExpExecArray | null;
  let found = false;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].trim().toLowerCase();
    const mapped = map[key];
    if (mapped) {
      out[mapped] = match[2].trim();
      found = true;
    }
  }
  if (!found) return { raw: text };
  return out;
}

function SectionBlock({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{title}</p>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{content}</div>
    </div>
  );
}

export function AgentPanel() {
  const [active, setActive] = useState<WorkflowId>("W1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AgentSection | null>(null);

  const wf = WORKFLOWS.find((w) => w.id === active)!;

  async function run() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error("Vous devez être connecté pour utiliser l'agent.");
      }
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workflowId: active, userInput: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Erreur de l'agent");
      }
      setResponse(parseSections(data.text ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-card md:p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">Agent Quotidien IA</h2>
          <p className="text-xs text-muted-foreground">
            Choisissez un workflow, ajoutez du contexte, recevez une réponse structurée.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {WORKFLOWS.map((w) => {
          const Icon = w.icon;
          const isActive = active === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setActive(w.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
                isActive
                  ? "border-primary bg-primary-soft shadow-card"
                  : "hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-semibold leading-tight">{w.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor="agent-input" className="text-xs font-medium text-muted-foreground">
          Contexte (optionnel) — {wf.hint}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            id="agent-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder={wf.hint}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-card transition-opacity hover:opacity-95 disabled:opacity-60 sm:self-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Lancer
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-3">
          <SectionBlock title="Hypothèses" content={response.hypotheses} />
          <SectionBlock title="Synthèse" content={response.synthese} />
          <SectionBlock title="Actions recommandées" content={response.actions} />
          <SectionBlock title="Échéances" content={response.echeances} />
          <SectionBlock title="Sources & liens utiles" content={response.sources} />
          <SectionBlock title="Avertissement" content={response.avertissement} />
          {!response.hypotheses && !response.synthese && response.raw && (
            <div className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm">
              {response.raw}
            </div>
          )}
        </div>
      )}

      <Disclaimer variant="ai" />
    </section>
  );
}
