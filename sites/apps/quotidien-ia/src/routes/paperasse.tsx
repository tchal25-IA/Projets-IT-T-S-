import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Send, Loader2, ArrowLeft, Sparkles, Plus, MessageSquare, Trash2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { NATIVE_AGENTS, PAPERASSE_ONLY_AGENTS, getAgent, type Agent } from "@/lib/agents";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { ConnectedAppButton } from "@/components/connected-app-button";
import { readLS, writeLS, LS_KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/paperasse")({
  head: () => ({
    meta: [
      { title: "Conseillers IA — Quotidien IA" },
      {
        name: "description",
        content:
          "Trois conseillers IA experts intégrés : fiscaliste, notaire et banquier privé. Suite complète disponible dans Paperasse.",
      },
    ],
  }),
  component: PaperassePage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };
type Conversation = {
  id: string;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

function loadConversations(): Conversation[] {
  return readLS<Conversation[]>(LS_KEYS.agentThreads, []);
}
function saveConversations(list: Conversation[]) {
  writeLS(LS_KEYS.agentThreads, list);
}

function PaperassePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const profile = useProfile();

  const selected = selectedId ? getAgent(selectedId) : null;

  function openAgent(agentId: string, conversationId?: string) {
    setSelectedId(agentId);
    setActiveConversationId(conversationId ?? null);
  }

  if (selected) {
    return (
      <AgentChat
        agent={selected}
        conversationId={activeConversationId}
        onBack={() => {
          setSelectedId(null);
          setActiveConversationId(null);
        }}
        workCountry={profile.workCountry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        eyebrow="Conseillers IA"
        title="Vos experts IA"
        description="Trois conseillers spécialisés intégrés à Quotidien IA : fiscalité du particulier, droit notarial et gestion de patrimoine."
      />

      <Disclaimer variant="finance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NATIVE_AGENTS.map((a) => {
          const muted = a.country === "FR" && profile.workCountry === "CH";
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => openAgent(a.id)}
              className={cn(
                "group flex flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elev",
                muted && "opacity-75",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-2xl" aria-hidden>
                    {a.emoji}
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold leading-tight">{a.label}</h2>
                    <p className="text-xs text-muted-foreground">{a.tagline}</p>
                  </div>
                </div>
                {a.country && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {a.country}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{a.description}</p>
              <div className="flex flex-wrap gap-1">
                {a.topics.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Démarrer une consultation
              </span>
            </button>
          );
        })}
      </div>

      {/* Renvoi vers Paperasse pour la suite complète d'experts */}
      <section className="rounded-2xl border border-dashed bg-muted/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <ExternalLink className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold">Besoin d'un expert d'entreprise ?</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Expert-comptable, syndic, contrôleur fiscal, commissaire aux comptes, banquier d'affaires
                et private equity sont disponibles dans <strong>Paperasse</strong>.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {PAPERASSE_ONLY_AGENTS.map((a) => (
                  <span key={a.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {a.emoji} {a.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <ConnectedAppButton app="paperasse" label="Paperasse" />
          </div>
        </div>
      </section>
    </div>
  );
}

function AgentChat({
  agent,
  conversationId,
  onBack,
  workCountry,
}: {
  agent: Agent;
  conversationId: string | null;
  onBack: () => void;
  workCountry?: string;
}) {
  const [convId, setConvId] = useState<string | null>(conversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  // Conversations de cet agent, les plus récentes d'abord.
  const conversations = useMemo(
    () => loadConversations().filter((c) => c.agentId === agent.id).sort((a, b) => b.updatedAt - a.updatedAt),
    [agent.id, historyTick],
  );

  // Charge la conversation demandée à l'ouverture.
  useEffect(() => {
    if (conversationId) {
      const conv = loadConversations().find((c) => c.id === conversationId);
      if (conv) {
        setConvId(conv.id);
        setMessages(conv.messages);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function persist(next: ChatMessage[]) {
    const all = loadConversations();
    const id = convId ?? crypto.randomUUID();
    const firstUser = next.find((m) => m.role === "user");
    const title = (firstUser?.content ?? "Consultation").slice(0, 60);
    const existing = all.findIndex((c) => c.id === id);
    const conv: Conversation = { id, agentId: agent.id, title, messages: next, updatedAt: Date.now() };
    if (existing >= 0) all[existing] = conv;
    else all.push(conv);
    saveConversations(all);
    if (!convId) setConvId(id);
    setHistoryTick((t) => t + 1);
  }

  function newConversation() {
    setConvId(null);
    setMessages([]);
    setError(null);
    setShowHistory(false);
  }

  function openConversation(c: Conversation) {
    setConvId(c.id);
    setMessages(c.messages);
    setError(null);
    setShowHistory(false);
  }

  function deleteConversation(id: string) {
    const all = loadConversations().filter((c) => c.id !== id);
    saveConversations(all);
    if (id === convId) newConversation();
    setHistoryTick((t) => t + 1);
  }

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const withUser = [...messages, { role: "user" as const, content: text }];
    setMessages(withUser);
    setInput("");
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Vous devez être connecté.");
      const res = await fetch("/api/skill", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId: agent.id, userInput: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Erreur du service. Réessayez.");
      const next = [...withUser, { role: "assistant" as const, content: (data as { text: string }).text }];
      setMessages(next);
      persist(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const ctxNote = agent.country === "FR" && workCountry === "CH";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux conseillers
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted",
              showHistory && "bg-muted",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Historique
            {conversations.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {conversations.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={newConversation}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Nouvelle
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="rounded-xl border bg-card p-3 shadow-card">
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vos consultations — {agent.label}
          </h3>
          {conversations.length === 0 ? (
            <p className="px-1 py-2 text-sm text-muted-foreground">Aucune consultation enregistrée pour le moment.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openConversation(c)}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      c.id === convId && "bg-muted",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{c.title}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteConversation(c.id)}
                    aria-label="Supprimer la consultation"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-3xl" aria-hidden>
            {agent.emoji}
          </span>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold">{agent.label}</h1>
            <p className="text-sm text-muted-foreground">{agent.tagline}</p>
          </div>
          {agent.country && (
            <span className="rounded-full border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
              Périmètre {agent.country}
            </span>
          )}
        </div>
        {ctxNote ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <span aria-hidden className="text-base leading-none">⚠️</span>
            <div>
              <strong className="font-semibold">Périmètre FR — vous travaillez en CH.</strong>{" "}
              Cet agent est calibré pour la fiscalité, les seuils et la réglementation françaises.
              Les barèmes, déductions, organismes (URSSAF, impôts.gouv.fr) et plafonds cités ne s'appliquent
              pas tels quels en Suisse (cantons, AFC, LPP, LAMal, IFD). Vérifiez systématiquement auprès
              de votre administration cantonale ou d'un fiduciaire suisse avant toute décision.
            </div>
          </div>
        ) : (
          agent.country && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Cet agent est calibré pour la réglementation <strong>{agent.country === "FR" ? "française" : "suisse"}</strong>.
              Hors de ce périmètre, ses réponses sont indicatives.
            </p>
          )
        )}
      </div>

      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Posez votre première question. Plus vous donnez de contexte (chiffres, statut, situation), plus la réponse sera utile.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border p-4 text-sm",
              m.role === "user" ? "ml-8 bg-primary-soft/40 border-primary/30" : "mr-8 bg-card shadow-card",
            )}
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {m.role === "user" ? "Vous" : agent.label}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="mr-8 inline-flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow-card">
            <Loader2 className="h-4 w-4 animate-spin" /> {agent.label} réfléchit…
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-4 rounded-xl border bg-card p-3 shadow-elev">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Décrivez votre situation, vos chiffres, votre question…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={loading}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">⌘/Ctrl + Entrée pour envoyer · sauvegarde automatique</span>
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-card disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
