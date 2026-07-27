import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTipStore, newDayId } from "@/lib/tipStore";
import {
  computeSettlement,
  formatMoney,
  METHOD_LABELS,
  ROLE_LABELS,
  type DayEntry,
  type Method,
} from "@/lib/tipEngine";
import { toast, Toaster } from "sonner";
import { Lock, Printer, Trash2, Users, Banknote, CreditCard, Gift } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Journée — TipShare" },
      { name: "description", content: "Saisir les tips du jour et répartir en direct entre l'équipe." },
      { property: "og:title", content: "Journée — TipShare" },
      { property: "og:description", content: "Tips du jour → parts équipe → impression." },
    ],
  }),
  component: TodayPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function TodayPage() {
  const store = useTipStore();
  const { venue, staff, days, upsertDay, setEmail, emailCaptured } = store;

  // Find/create "today" day
  const iso = todayISO();
  const existingToday = useMemo(
    () => days.find((d) => d.date === iso && !d.locked) ?? days.find((d) => d.date === iso),
    [days, iso],
  );

  const [draft, setDraft] = useState<DayEntry>(() =>
    existingToday ?? {
      id: newDayId(),
      date: iso,
      method: venue.defaultMethod,
      tipsCash: 0,
      tipsCard: 0,
      tipsOther: 0,
      presences: staff.filter((s) => s.active).map((s) => ({ staffId: s.id, hours: 0 })),
      notes: "",
      locked: false,
    },
  );

  // Keep draft in sync if store changes (rare — first load)
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const settlement = useMemo(
    () => computeSettlement(draft, staff, venue.currency),
    [draft, staff, venue.currency],
  );

  function setPresence(staffId: string, present: boolean) {
    setDraft((d) => ({
      ...d,
      presences: present
        ? d.presences.some((p) => p.staffId === staffId)
          ? d.presences
          : [...d.presences, { staffId, hours: 0 }]
        : d.presences.filter((p) => p.staffId !== staffId),
    }));
  }
  function setHours(staffId: string, hours: number) {
    setDraft((d) => ({
      ...d,
      presences: d.presences.map((p) => (p.staffId === staffId ? { ...p, hours } : p)),
    }));
  }

  function saveDraft() {
    upsertDay(draft);
    toast.success("Journée enregistrée");
  }

  function closeDay() {
    const locked = { ...draft, locked: true };
    upsertDay(locked);
    setDraft(locked);
    toast.success("Journée clôturée");
    if (!emailCaptured) setEmailOpen(true);
    setTimeout(() => window.print(), 400);
  }

  const total = draft.tipsCash + draft.tipsCard + draft.tipsOther;
  const roundNote = venue.currency === "CHF" ? "Arrondi à 0.05 CHF" : "Arrondi à 0.01 €";

  return (
    <AppShell>
      <Toaster richColors position="top-center" />

      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-serif text-3xl text-primary">Journée du {formatDateFR(draft.date)}</h1>
          <p className="text-sm text-muted-foreground">{venue.name} · {venue.country} · {venue.currency}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={draft.locked}>Enregistrer</Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
          {!draft.locked && (
            <Button onClick={closeDay} disabled={total <= 0 || settlement.shares.length === 0}>
              <Lock className="mr-2 h-4 w-4" /> Clôturer la journée
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: inputs */}
        <div className="no-print space-y-6 lg:col-span-3">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="brand-serif text-xl text-primary">Tips du jour</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TipInput
                icon={<Banknote className="h-4 w-4" />}
                label="Espèces"
                value={draft.tipsCash}
                onChange={(v) => setDraft((d) => ({ ...d, tipsCash: v }))}
                disabled={draft.locked}
              />
              <TipInput
                icon={<CreditCard className="h-4 w-4" />}
                label="Carte"
                value={draft.tipsCard}
                onChange={(v) => setDraft((d) => ({ ...d, tipsCard: v }))}
                disabled={draft.locked}
              />
              <TipInput
                icon={<Gift className="h-4 w-4" />}
                label="Autre / boîte"
                value={draft.tipsOther}
                onChange={(v) => setDraft((d) => ({ ...d, tipsOther: v }))}
                disabled={draft.locked}
              />
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total du pool</span>
              <span className="brand-serif text-3xl text-primary">{formatMoney(total, venue.currency)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="brand-serif text-xl text-primary">Méthode</h2>
              <Select
                value={draft.method}
                onValueChange={(v) => setDraft((d) => ({ ...d, method: v as Method }))}
                disabled={draft.locked}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABELS) as Method[]).map((m) => (
                    <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.method === "equal" && "Chaque personne présente reçoit la même part."}
              {draft.method === "hours" && "Réparti au prorata des heures travaillées."}
              {draft.method === "role_weight" && "Heures × poids rôle (édité dans Équipe)."}
              {" · "}{roundNote}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="brand-serif text-xl text-primary">
              <Users className="mr-2 -mt-1 inline h-5 w-5" />
              Qui a bossé ?
            </h2>
            <div className="mt-4 space-y-2">
              {staff.filter((s) => s.active).map((s) => {
                const p = draft.presences.find((x) => x.staffId === s.id);
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <Checkbox
                      checked={!!p}
                      onCheckedChange={(v) => setPresence(s.id, !!v)}
                      disabled={draft.locked}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_LABELS[s.role]} · poids {s.weight.toFixed(2)}
                      </div>
                    </div>
                    {p && draft.method !== "equal" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.25"
                          min={0}
                          className="w-24"
                          value={p.hours}
                          onChange={(e) => setHours(s.id, parseFloat(e.target.value) || 0)}
                          disabled={draft.locked}
                        />
                        <span className="text-xs text-muted-foreground">h</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {staff.filter((s) => s.active).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun membre actif. Ajoutez l'équipe dans Équipe.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              className="mt-2"
              value={draft.notes ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              disabled={draft.locked}
              placeholder="Service festif, gros pourboire d'un client, etc."
            />
          </section>
        </div>

        {/* Right: settlement */}
        <aside className="lg:col-span-2">
          <div className="print-card sticky top-20 rounded-xl border border-border bg-card p-5 shadow-lg shadow-wine/10">
            <div className="flex items-baseline justify-between">
              <h2 className="brand-serif text-xl text-primary">Répartition</h2>
              {draft.locked && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  Clôturée
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {venue.name} · {formatDateFR(draft.date)} · {METHOD_LABELS[draft.method]}
            </p>

            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total réparti</span>
              <span className="brand-serif text-3xl text-primary">
                {formatMoney(settlement.total, venue.currency)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {settlement.shares.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ajoutez des tips et cochez au moins une personne présente.
                </p>
              )}
              {settlement.shares.map((s) => (
                <div key={s.staffId} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_LABELS[s.role]} · {s.percent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="brand-serif text-xl text-primary">
                    {formatMoney(s.amount, venue.currency)}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">
              {roundNote} · calculé par TipShare
            </p>
          </div>
        </aside>
      </div>

      {/* Email soft gate */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="brand-serif text-2xl text-primary">Bravo, journée clôturée</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Voulez-vous être prévenu·e quand l'export compta et le multi-sites sortent ?
            (aucun spam, promis)
          </p>
          <Input
            type="email"
            placeholder="vous@restaurant.fr"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>Plus tard</Button>
            <Button
              onClick={() => {
                if (emailValue) {
                  setEmail(emailValue);
                  toast.success("Merci !");
                }
                setEmailOpen(false);
              }}
            >
              M'inscrire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function TipInput({
  icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </Label>
      <Input
        className="mt-1.5 h-14 text-2xl brand-serif"
        type="number"
        inputMode="decimal"
        step="0.05"
        min={0}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
      />
    </div>
  );
}

function formatDateFR(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Removed-unused helper placeholder guard
void Trash2;
