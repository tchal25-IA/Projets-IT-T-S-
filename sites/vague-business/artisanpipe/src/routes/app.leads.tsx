import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLeads, useQuotes } from "@/lib/useStore";
import { uid } from "@/lib/store";
import { nextQuoteNumber } from "@/lib/quoteEngine";
import type { Lead, LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Pencil } from "lucide-react";

export const Route = createFileRoute("/app/leads")({
  component: LeadsPage,
});

const STATUSES: LeadStatus[] = ["nouveau", "contacté", "devis_envoyé", "gagné", "perdu"];

const statusColor: Record<LeadStatus, string> = {
  nouveau: "bg-secondary text-secondary-foreground",
  contacté: "bg-accent text-accent-foreground",
  devis_envoyé: "bg-primary/15 text-primary",
  gagné: "bg-green-600/15 text-green-700 dark:text-green-400",
  perdu: "bg-muted text-muted-foreground",
};

const emptyLead = (): Lead => ({
  id: uid(),
  name: "",
  phone: "",
  email: "",
  city: "",
  source: "",
  status: "nouveau",
  notes: "",
  createdAt: new Date().toISOString(),
});

function LeadsPage() {
  const { leads, save } = useLeads();
  const { quotes, save: saveQuotes } = useQuotes();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const openNew = () => {
    setEditing(emptyLead());
    setOpen(true);
  };
  const openEdit = (l: Lead) => {
    setEditing({ ...l });
    setOpen(true);
  };

  const submit = () => {
    if (!editing) return;
    const exists = leads.some((l) => l.id === editing.id);
    const next = exists
      ? leads.map((l) => (l.id === editing.id ? editing : l))
      : [editing, ...leads];
    save(next);
    setOpen(false);
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce prospect ?")) return;
    save(leads.filter((l) => l.id !== id));
  };

  const createQuoteFromLead = (leadId: string) => {
    const number = nextQuoteNumber(quotes);
    const q = {
      id: uid(),
      leadId,
      number,
      status: "brouillon" as const,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400_000).toISOString(),
      notes: "",
      lines: [{ id: uid(), desc: "", qty: 1, unitPrice: 0, tva: 8.1 }],
    };
    saveQuotes([q, ...quotes]);
    // move lead to devis_envoyé stage
    save(leads.map((l) => (l.id === leadId ? { ...l, status: "devis_envoyé" as LeadStatus } : l)));
    navigate({ to: "/app/devis/$id", params: { id: q.id } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">Prospects</h1>
          <p className="text-sm text-muted-foreground">
            {leads.length} contact{leads.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Nouveau prospect
        </Button>
      </div>

      <div className="grid gap-3">
        {leads.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Aucun prospect. Cliquez sur « Nouveau prospect » pour commencer.
          </Card>
        )}
        {leads.map((l) => (
          <Card key={l.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-display text-lg font-bold">{l.name || "(sans nom)"}</div>
                  <Badge className={statusColor[l.status]}>{l.status}</Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {[l.city, l.phone, l.email].filter(Boolean).join(" · ")}
                </div>
                {l.source && (
                  <div className="mt-1 text-xs text-muted-foreground">Source : {l.source}</div>
                )}
                {l.notes && (
                  <p className="mt-2 text-sm text-foreground/80">{l.notes}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => createQuoteFromLead(l.id)}>
                  <FileText className="mr-1 h-4 w-4" /> Créer devis
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(l.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase">
              {editing && leads.some((l) => l.id === editing.id) ? "Modifier" : "Nouveau"} prospect
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <Label>Nom / Société</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="M. Dupont"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    placeholder="+41 79 …"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editing.email}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ville</Label>
                  <Input
                    value={editing.city}
                    onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Source</Label>
                  <Input
                    value={editing.source}
                    onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                    placeholder="Google, bouche à oreille…"
                  />
                </div>
              </div>
              <div>
                <Label>Statut</Label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as LeadStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
