import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useLeads, useQuotes, useProfile, useReminders } from "@/lib/useStore";
import { uid, getEmailGate, setEmailGate } from "@/lib/store";
import { computeTotals, formatMoney, formatDate, TVA_PRESETS } from "@/lib/quoteEngine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, Printer, Send, ArrowLeft, BellPlus } from "lucide-react";
import type { QuoteStatus, QuoteLine } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/devis/$id")({
  component: DevisDetail,
});

const STATUSES: QuoteStatus[] = ["brouillon", "envoyé", "accepté", "refusé"];

const statusColor: Record<QuoteStatus, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoyé: "bg-primary/15 text-primary",
  accepté: "bg-green-600/15 text-green-700 dark:text-green-400",
  refusé: "bg-destructive/15 text-destructive",
};

function DevisDetail() {
  const { id } = Route.useParams();
  const { quotes, save } = useQuotes();
  const { leads } = useLeads();
  const { profile } = useProfile();
  const { reminders, save: saveReminders } = useReminders();
  const navigate = useNavigate();
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const quote = quotes.find((q) => q.id === id);
  const lead = quote ? leads.find((l) => l.id === quote.leadId) : undefined;
  const totals = useMemo(() => computeTotals(quote?.lines ?? []), [quote?.lines]);

  if (!quote) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Devis introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/app/devis">Retour aux devis</Link>
        </Button>
      </div>
    );
  }

  const update = (patch: Partial<typeof quote>) => {
    save(quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const updateLine = (lineId: string, patch: Partial<QuoteLine>) => {
    update({
      lines: quote.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)),
    });
  };

  const addLine = () => {
    update({
      lines: [
        ...quote.lines,
        { id: uid(), desc: "", qty: 1, unitPrice: 0, tva: profile.tva },
      ],
    });
  };

  const removeLine = (lineId: string) => {
    update({ lines: quote.lines.filter((l) => l.id !== lineId) });
  };

  const remove = () => {
    if (!confirm("Supprimer ce devis ?")) return;
    save(quotes.filter((q) => q.id !== id));
    saveReminders(reminders.filter((r) => r.quoteId !== id));
    navigate({ to: "/app/devis" });
  };

  const doPrint = () => {
    if (!getEmailGate()) {
      setEmailGateOpen(true);
      return;
    }
    window.print();
  };

  const confirmEmailGate = () => {
    if (emailInput) setEmailGate(emailInput);
    setEmailGateOpen(false);
    setTimeout(() => window.print(), 100);
  };

  const markSent = () => {
    update({ status: "envoyé" });
    // Auto reminder 7 days from now
    const existing = reminders.find((r) => r.quoteId === id && !r.done);
    if (!existing) {
      saveReminders([
        {
          id: uid(),
          quoteId: id,
          dueDate: new Date(Date.now() + 7 * 86400_000).toISOString(),
          done: false,
          channel: "appel",
          note: "Relance automatique après envoi",
        },
        ...reminders,
      ]);
      toast.success("Devis marqué envoyé — relance créée dans 7 jours.");
    } else {
      toast.success("Devis marqué envoyé.");
    }
  };

  const addReminder = () => {
    saveReminders([
      {
        id: uid(),
        quoteId: id,
        dueDate: new Date(Date.now() + 3 * 86400_000).toISOString(),
        done: false,
        channel: "appel",
      },
      ...reminders,
    ]);
    toast.success("Relance ajoutée dans 3 jours.");
  };

  return (
    <div className="space-y-6">
      {/* Actions (non-print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/devis">
              <ArrowLeft className="mr-1 h-4 w-4" /> Retour
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={addReminder}>
              <BellPlus className="mr-1 h-4 w-4" /> Ajouter relance
            </Button>
            <Button variant="outline" size="sm" onClick={markSent}>
              <Send className="mr-1 h-4 w-4" /> Marquer envoyé
            </Button>
            <Button size="sm" onClick={doPrint}>
              <Printer className="mr-1 h-4 w-4" /> Imprimer / PDF
            </Button>
            <Button size="sm" variant="outline" onClick={remove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Statut</Label>
              <Select
                value={quote.status}
                onValueChange={(v) => update({ status: v as QuoteStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client</Label>
              <Select
                value={quote.leadId}
                onValueChange={(v) => update({ leadId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Numéro</Label>
              <Input value={quote.number} onChange={(e) => update({ number: e.target.value })} />
            </div>
            <div>
              <Label>Valide jusqu'au</Label>
              <Input
                type="date"
                value={quote.validUntil.slice(0, 10)}
                onChange={(e) =>
                  update({ validUntil: new Date(e.target.value).toISOString() })
                }
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase">Lignes</h2>
            <Button size="sm" variant="outline" onClick={addLine}>
              <Plus className="mr-1 h-4 w-4" /> Ligne
            </Button>
          </div>
          <div className="space-y-2">
            {quote.lines.map((l) => (
              <div key={l.id} className="grid gap-2 rounded border border-border p-2 md:grid-cols-[1fr_80px_120px_140px_40px] md:items-end">
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={l.desc}
                    onChange={(e) => updateLine(l.id, { desc: e.target.value })}
                    placeholder="Prestation, fourniture…"
                  />
                </div>
                <div>
                  <Label className="text-xs">Qté</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={l.qty}
                    onChange={(e) => updateLine(l.id, { qty: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Prix unitaire</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(l.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">TVA</Label>
                  <Select
                    value={String(l.tva)}
                    onValueChange={(v) => updateLine(l.id, { tva: parseFloat(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TVA_PRESETS.map((p) => (
                        <SelectItem key={p.label} value={String(p.value)}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeLine(l.id)}
                  disabled={quote.lines.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <Label>Notes / conditions</Label>
          <Textarea
            value={quote.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={3}
            placeholder="Conditions de paiement, délais, garantie…"
          />
        </Card>
      </div>

      {/* Printable preview */}
      <Card className="print-page mx-auto max-w-[210mm] p-8 shadow-md">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <div className="font-display text-3xl font-bold uppercase">{profile.businessName}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {profile.address}<br />
              {profile.phone} · {profile.email}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold uppercase text-primary">Devis</div>
            <div className="mt-1 text-sm">{quote.number}</div>
            <Badge className={`${statusColor[quote.status]} mt-2`}>{quote.status}</Badge>
          </div>
        </div>

        <div className="grid gap-4 py-6 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">Client</div>
            <div className="mt-1 font-medium">{lead?.name ?? "—"}</div>
            {lead && (
              <div className="text-sm text-muted-foreground">
                {[lead.city, lead.phone, lead.email].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div className="md:text-right">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Émis le</div>
            <div className="mt-1 text-sm">{formatDate(quote.createdAt)}</div>
            <div className="mt-2 text-xs font-semibold uppercase text-muted-foreground">Valable jusqu'au</div>
            <div className="text-sm">{formatDate(quote.validUntil)}</div>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground text-left">
              <th className="py-2 font-display uppercase">Description</th>
              <th className="py-2 text-right font-display uppercase">Qté</th>
              <th className="py-2 text-right font-display uppercase">P.U. HT</th>
              <th className="py-2 text-right font-display uppercase">TVA</th>
              <th className="py-2 text-right font-display uppercase">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l) => (
              <tr key={l.id} className="border-b border-border">
                <td className="py-2">{l.desc || "—"}</td>
                <td className="py-2 text-right">{l.qty}</td>
                <td className="py-2 text-right">{formatMoney(l.unitPrice, profile.currency)}</td>
                <td className="py-2 text-right">{l.tva}%</td>
                <td className="py-2 text-right">
                  {formatMoney((l.qty || 0) * (l.unitPrice || 0), profile.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total HT</span>
              <span>{formatMoney(totals.ht, profile.currency)}</span>
            </div>
            {Object.entries(totals.byTva).map(([tva, v]) => (
              <div key={tva} className="flex justify-between">
                <span>TVA {tva}%</span>
                <span>{formatMoney(v.tva, profile.currency)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t-2 border-foreground pt-2 font-display text-lg font-bold uppercase">
              <span>Total TTC</span>
              <span>{formatMoney(totals.ttc, profile.currency)}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-8 border-t border-border pt-4 text-sm">
            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Notes</div>
            <p className="whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Devis établi par {profile.businessName} — Merci de votre confiance.
        </div>
      </Card>

      <Dialog open={emailGateOpen} onOpenChange={setEmailGateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">
              Votre email pour continuer
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            On vous prévient dès que les <strong>relances WhatsApp</strong> sont disponibles.
            Aucun spam.
          </p>
          <Input
            type="email"
            placeholder="vous@exemple.ch"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEmailGate("skipped"); setEmailGateOpen(false); setTimeout(() => window.print(), 100); }}>
              Plus tard
            </Button>
            <Button onClick={confirmEmailGate}>Continuer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
