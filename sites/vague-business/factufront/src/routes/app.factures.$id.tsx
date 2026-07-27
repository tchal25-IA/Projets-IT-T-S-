import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { cryptoId, useFactuFront, useHydrated } from "@/lib/factufront-store";
import type { Client, Currency, Invoice, InvoiceLine, InvoiceStatus, SellerProfile } from "@/lib/factufront-types";
import { computeTotals, formatCurrency, formatDate, VAT_PRESETS } from "@/lib/invoiceEngine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Printer, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/factures/$id")({
  component: InvoiceEditor,
});

function InvoiceEditor() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { state, updateInvoice, deleteInvoice, addClient } = useFactuFront();

  const invoice = state.invoices.find((i) => i.id === id);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [captureEmail, setCaptureEmail] = useState("");
  const [hasPromptedEmail, setHasPromptedEmail] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasPromptedEmail(localStorage.getItem("factufront:emailPrompted") === "1");
    }
  }, []);

  if (!hydrated) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  if (!invoice) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Facture introuvable.</p>
        <Link to="/app" className="mt-4 inline-block text-sm underline">Retour au tableau de bord</Link>
      </div>
    );
  }

  const client = state.clients.find((c) => c.id === invoice.clientId) ?? null;

  function patch(p: Partial<Invoice>) {
    updateInvoice(invoice!.id, p);
  }
  function updateLine(lineId: string, p: Partial<InvoiceLine>) {
    patch({ lines: invoice!.lines.map((l) => (l.id === lineId ? { ...l, ...p } : l)) });
  }
  function addLine() {
    patch({
      lines: [
        ...invoice!.lines,
        {
          id: cryptoId(),
          description: "",
          quantity: 1,
          unitPrice: 0,
          vatRate: state.profile.defaultVatRate,
        },
      ],
    });
  }
  function removeLine(lineId: string) {
    patch({ lines: invoice!.lines.filter((l) => l.id !== lineId) });
  }

  function handlePrint() {
    if (invoice!.lines.some((l) => !l.description.trim())) {
      toast.error("Chaque ligne doit avoir une description");
      return;
    }
    if (!client) {
      toast.error("Sélectionnez un client");
      return;
    }
    // fire print
    setTimeout(() => window.print(), 50);
    // Show email capture on first print
    if (!hasPromptedEmail) {
      setTimeout(() => {
        setEmailModalOpen(true);
        localStorage.setItem("factufront:emailPrompted", "1");
        setHasPromptedEmail(true);
      }, 800);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-brand text-2xl tracking-tight">{invoice.number}</h1>
          <StatusSelect
            value={invoice.status}
            onChange={(s) => patch({ status: s })}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Supprimer cette facture ?")) {
                deleteInvoice(invoice.id);
                navigate({ to: "/app" });
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
          </Button>
          <Button variant="outline" onClick={() => toast.success("Modifications enregistrées automatiquement")}>
            <Save className="mr-2 h-4 w-4" /> Enregistré
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer / PDF
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Editor */}
        <div className="no-print space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Informations
            </h2>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-1.5">
                <Label>Client</Label>
                <ClientPicker
                  clients={state.clients}
                  value={invoice.clientId}
                  onChange={(clientId) => {
                    const c = state.clients.find((cl) => cl.id === clientId);
                    patch({ clientId, currency: c?.currency ?? invoice.currency });
                  }}
                  onCreate={(name) => {
                    const c = addClient({
                      name,
                      email: "",
                      address: "",
                      postalCode: "",
                      city: "",
                      country: "FR",
                      currency: "EUR",
                      vatNumber: "",
                    });
                    patch({ clientId: c.id, currency: c.currency });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Date d'émission</Label>
                  <Input type="date" value={invoice.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Échéance</Label>
                  <Input type="date" value={invoice.dueDate} onChange={(e) => patch({ dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Devise</Label>
                <Select value={invoice.currency} onValueChange={(v: Currency) => patch({ currency: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="CHF">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Lignes
              </h2>
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="mr-1 h-4 w-4" /> Ligne
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {invoice.lines.map((l, idx) => (
                <div key={l.id} className="grid grid-cols-[1fr_60px_100px_120px_36px] gap-2 items-start">
                  <Input
                    placeholder={`Description #${idx + 1}`}
                    value={l.description}
                    onChange={(e) => updateLine(l.id, { description: e.target.value })}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={l.quantity}
                    onChange={(e) => updateLine(l.id, { quantity: Number(e.target.value) })}
                    aria-label="Quantité"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(l.id, { unitPrice: Number(e.target.value) })}
                    aria-label="Prix unitaire"
                  />
                  <Select
                    value={String(l.vatRate)}
                    onValueChange={(v) => updateLine(l.id, { vatRate: Number(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VAT_PRESETS[state.profile.country].map((p) => (
                        <SelectItem key={p.rate} value={String(p.rate)}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => removeLine(l.id)} aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <Label>Notes / mentions</Label>
            <Textarea
              className="mt-2"
              rows={3}
              value={invoice.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Conditions de paiement, remerciement…"
            />
          </Card>
        </div>

        {/* Preview / print area */}
        <InvoicePreview invoice={invoice} client={client} profile={state.profile} />
      </div>

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recevoir le modèle pro + relances auto</DialogTitle>
            <DialogDescription>
              Laissez votre email — on vous envoie un modèle de facture propre et les
              prochaines relances automatiques quand elles seront prêtes.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="vous@exemple.fr"
            value={captureEmail}
            onChange={(e) => setCaptureEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>Plus tard</Button>
            <Button
              onClick={() => {
                if (!captureEmail.includes("@")) {
                  toast.error("Email invalide");
                  return;
                }
                if (typeof window !== "undefined") {
                  localStorage.setItem("factufront:capturedEmail", captureEmail);
                }
                toast.success("Merci — on vous tient au courant.");
                setEmailModalOpen(false);
              }}
            >
              Je m'inscris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: InvoiceStatus; onChange: (v: InvoiceStatus) => void }) {
  return (
    <Select value={value} onValueChange={(v: InvoiceStatus) => onChange(v)}>
      <SelectTrigger className="h-8 w-36 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="brouillon">Brouillon</SelectItem>
        <SelectItem value="envoyée">Envoyée</SelectItem>
        <SelectItem value="payée">Payée</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ClientPicker({
  clients,
  value,
  onChange,
  onCreate,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  if (creating) {
    return (
      <div className="flex gap-2">
        <Input placeholder="Nom du client" value={name} onChange={(e) => setName(e.target.value)} />
        <Button
          onClick={() => {
            if (!name.trim()) return;
            onCreate(name.trim());
            setName("");
            setCreating(false);
          }}
        >
          Créer
        </Button>
        <Button variant="ghost" onClick={() => setCreating(false)}>Annuler</Button>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Choisir un client" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={() => setCreating(true)}>
        <Plus className="mr-1 h-4 w-4" /> Nouveau
      </Button>
    </div>
  );
}

function InvoicePreview({
  invoice,
  client,
  profile,
}: {
  invoice: Invoice;
  client: Client | null;
  profile: SellerProfile;
}) {
  const totals = useMemo(() => computeTotals(invoice.lines), [invoice.lines]);
  const isCH = profile.country === "CH";

  return (
    <div className="print-area">
      <Card className="p-10 shadow-sm">
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="font-brand text-2xl leading-tight">{profile.companyName || "Votre entreprise"}</div>
            <div className="mt-1 text-xs text-muted-foreground leading-snug whitespace-pre-line">
              {profile.contactName && <>{profile.contactName}<br /></>}
              {profile.address}<br />
              {profile.postalCode} {profile.city}<br />
              {profile.country === "CH" ? "Suisse" : "France"}
              {profile.vatNumber && <><br />{profile.vatNumber}</>}
              {profile.siret && <><br />SIRET {profile.siret}</>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-brand text-3xl tracking-tight">Facture</div>
            <div className="mt-1 text-sm text-muted-foreground">{invoice.number}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Facturé à</div>
            <div className="mt-2 text-sm leading-snug">
              {client ? (
                <>
                  <div className="font-semibold text-foreground">{client.name}</div>
                  <div className="text-muted-foreground whitespace-pre-line">
                    {client.address}<br />
                    {client.postalCode} {client.city}<br />
                    {client.country === "CH" ? "Suisse" : "France"}
                    {client.vatNumber && <><br />{client.vatNumber}</>}
                  </div>
                </>
              ) : (
                <span className="text-muted-foreground">Aucun client sélectionné</span>
              )}
            </div>
          </div>
          <div className="text-sm">
            <Row label="Date d'émission" value={formatDate(invoice.issueDate, profile.country)} />
            <Row label="Échéance" value={formatDate(invoice.dueDate, profile.country)} />
            <Row label="Devise" value={invoice.currency} />
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="py-2 text-left font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qté</th>
              <th className="py-2 text-right font-medium">P.U. HT</th>
              <th className="py-2 text-right font-medium">TVA</th>
              <th className="py-2 text-right font-medium">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => {
              const ht = (l.quantity || 0) * (l.unitPrice || 0);
              return (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-3 pr-2">{l.description || <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(l.unitPrice || 0, invoice.currency)}</td>
                  <td className="py-3 text-right tabular-nums">{l.vatRate}%</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(ht, invoice.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total HT</span>
              <span className="tabular-nums">{formatCurrency(totals.subtotalHT, invoice.currency)}</span>
            </div>
            {totals.vatByRate.map((v) => (
              <div key={v.rate} className="flex justify-between text-muted-foreground">
                <span>TVA {v.rate}%</span>
                <span className="tabular-nums">{formatCurrency(v.amount, invoice.currency)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total TTC</span>
              <span className="tabular-nums">{formatCurrency(totals.totalTTC, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 rounded-md border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-line">
            {invoice.notes}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-border/60 p-4 text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Paiement</div>
            <div className="font-medium">{profile.bankName || "Banque"}</div>
            <div className="mt-1 text-muted-foreground">
              IBAN&nbsp;: <span className="font-mono text-foreground">{profile.iban || "—"}</span>
            </div>
            {profile.bic && (
              <div className="text-muted-foreground">BIC&nbsp;: <span className="font-mono text-foreground">{profile.bic}</span></div>
            )}
            <div className="mt-1 text-muted-foreground">Communication&nbsp;: {invoice.number}</div>
          </div>
          {isCH ? (
            <div className="rounded-md border border-dashed border-sage/60 bg-sage/5 p-4 text-xs">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-sage-foreground">
                QR-facture Suisse
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-sage/40 bg-background text-[9px] text-muted-foreground">
                  QR
                </div>
                <div className="text-muted-foreground">
                  Emplacement réservé.<br />
                  À brancher sur la norme SIX (non scannable dans cette version).
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border/60 p-4 text-xs text-muted-foreground">
              <div className="mb-1 text-[10px] uppercase tracking-wide">Mentions légales</div>
              TVA acquittée sur les débits. Pénalités de retard&nbsp;: taux BCE + 10 pts.
              Indemnité forfaitaire pour frais de recouvrement&nbsp;: 40 €.
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-[10px] text-muted-foreground">
          Facture générée avec FactuFront · {formatDate(invoice.issueDate, profile.country)}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
