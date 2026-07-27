import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuotes, useLeads, useReminders } from "@/lib/useStore";
import { uid } from "@/lib/store";
import { formatDate } from "@/lib/quoteEngine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, MessageSquare, Mail, Plus, Trash2 } from "lucide-react";
import type { Channel } from "@/lib/types";

export const Route = createFileRoute("/app/relances")({
  component: RelancesPage,
});

const channelIcon: Record<Channel, React.ReactNode> = {
  appel: <Phone className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
};

function RelancesPage() {
  const { reminders, save } = useReminders();
  const { quotes } = useQuotes();
  const { leads } = useLeads();

  const now = Date.now();

  const overdueQuotes = useMemo(() => {
    // Quotes sent > 7 days ago without an active reminder
    return quotes.filter((q) => {
      if (q.status !== "envoyé") return false;
      const age = (now - new Date(q.createdAt).getTime()) / 86400_000;
      if (age < 7) return false;
      const hasActive = reminders.some((r) => r.quoteId === q.id && !r.done);
      return !hasActive;
    });
  }, [quotes, reminders, now]);

  const sorted = [...reminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const due = sorted.filter((r) => !r.done && new Date(r.dueDate).getTime() <= now);
  const upcoming = sorted.filter((r) => !r.done && new Date(r.dueDate).getTime() > now);
  const done = sorted.filter((r) => r.done);

  const toggle = (id: string) => {
    save(reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
  };
  const remove = (id: string) => {
    save(reminders.filter((r) => r.id !== id));
  };
  const setChannel = (id: string, channel: Channel) => {
    save(reminders.map((r) => (r.id === id ? { ...r, channel } : r)));
  };
  const setDue = (id: string, isoDate: string) => {
    save(reminders.map((r) => (r.id === id ? { ...r, dueDate: new Date(isoDate).toISOString() } : r)));
  };

  const createFromQuote = (quoteId: string) => {
    save([
      {
        id: uid(),
        quoteId,
        dueDate: new Date().toISOString(),
        done: false,
        channel: "appel",
        note: "Relance créée depuis devis en retard",
      },
      ...reminders,
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">Relances</h1>
        <p className="text-sm text-muted-foreground">
          Ne perdez plus jamais un devis. Cochez, remettez à demain, recommencez.
        </p>
      </div>

      {overdueQuotes.length > 0 && (
        <Card className="border-primary/40 bg-primary/5 p-4">
          <h2 className="mb-3 font-display text-lg font-bold uppercase">
            Devis envoyés sans relance ({overdueQuotes.length})
          </h2>
          <div className="space-y-2">
            {overdueQuotes.map((q) => {
              const lead = leads.find((l) => l.id === q.leadId);
              return (
                <div key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-card p-3">
                  <div>
                    <div className="font-medium">{lead?.name} — {q.number}</div>
                    <div className="text-xs text-muted-foreground">Envoyé le {formatDate(q.createdAt)}</div>
                  </div>
                  <Button size="sm" onClick={() => createFromQuote(q.id)}>
                    <Plus className="mr-1 h-4 w-4" /> Créer relance
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Section
        title={`À faire maintenant (${due.length})`}
        emptyLabel="Rien en retard. Bien joué."
        items={due}
        highlight
        onToggle={toggle}
        onRemove={remove}
        onChannel={setChannel}
        onDue={setDue}
        quotes={quotes}
        leads={leads}
      />
      <Section
        title={`À venir (${upcoming.length})`}
        emptyLabel="Rien de prévu."
        items={upcoming}
        onToggle={toggle}
        onRemove={remove}
        onChannel={setChannel}
        onDue={setDue}
        quotes={quotes}
        leads={leads}
      />
      <Section
        title={`Terminées (${done.length})`}
        emptyLabel="Aucune relance terminée."
        items={done}
        muted
        onToggle={toggle}
        onRemove={remove}
        onChannel={setChannel}
        onDue={setDue}
        quotes={quotes}
        leads={leads}
      />
    </div>
  );
}

function Section({
  title,
  emptyLabel,
  items,
  highlight,
  muted,
  onToggle,
  onRemove,
  onChannel,
  onDue,
  quotes,
  leads,
}: {
  title: string;
  emptyLabel: string;
  items: ReturnType<typeof useReminders>["reminders"];
  highlight?: boolean;
  muted?: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onChannel: (id: string, c: Channel) => void;
  onDue: (id: string, iso: string) => void;
  quotes: ReturnType<typeof useQuotes>["quotes"];
  leads: ReturnType<typeof useLeads>["leads"];
}) {
  return (
    <div>
      <h2 className={`mb-2 font-display text-lg font-bold uppercase ${highlight ? "text-primary" : ""}`}>
        {title}
      </h2>
      <div className="space-y-2">
        {items.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">{emptyLabel}</Card>
        )}
        {items.map((r) => {
          const q = quotes.find((qq) => qq.id === r.quoteId);
          const lead = q ? leads.find((l) => l.id === q.leadId) : undefined;
          const isLate = !r.done && new Date(r.dueDate).getTime() < Date.now();
          return (
            <Card key={r.id} className={`p-3 ${muted ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-3">
                <Checkbox
                  checked={r.done}
                  onCheckedChange={() => onToggle(r.id)}
                  className="h-5 w-5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/app/devis/$id"
                      params={{ id: r.quoteId }}
                      className="font-medium hover:text-primary"
                    >
                      {lead?.name ?? "?"} — {q?.number ?? "devis supprimé"}
                    </Link>
                    {isLate && <Badge variant="destructive">Retard</Badge>}
                  </div>
                  {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                </div>
                <input
                  type="date"
                  className="rounded border border-input bg-background px-2 py-1 text-sm"
                  value={r.dueDate.slice(0, 10)}
                  onChange={(e) => onDue(r.id, e.target.value)}
                />
                <Select value={r.channel} onValueChange={(v) => onChannel(r.id, v as Channel)}>
                  <SelectTrigger className="w-32">
                    <div className="flex items-center gap-2">
                      {channelIcon[r.channel]}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appel">Appel</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => onRemove(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
