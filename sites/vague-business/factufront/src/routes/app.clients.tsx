import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFactuFront, useHydrated } from "@/lib/factufront-store";
import type { Client, Country, Currency } from "@/lib/factufront-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clients")({
  component: ClientsPage,
});

const empty: Omit<Client, "id" | "createdAt"> = {
  name: "",
  email: "",
  address: "",
  postalCode: "",
  city: "",
  country: "FR",
  currency: "EUR",
  vatNumber: "",
};

function ClientsPage() {
  const hydrated = useHydrated();
  const { state, addClient, updateClient, deleteClient } = useFactuFront();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id" | "createdAt">>(empty);

  if (!hydrated) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    const { id, createdAt, ...rest } = c;
    void id;
    void createdAt;
    setForm(rest);
    setOpen(true);
  }
  function submit() {
    if (!form.name.trim()) {
      toast.error("Nom du client requis");
      return;
    }
    if (editing) {
      updateClient(editing.id, form);
      toast.success("Client mis à jour");
    } else {
      addClient(form);
      toast.success("Client ajouté");
    }
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-brand text-3xl tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Votre carnet d'adresses de facturation.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <Field label="Nom / Raison sociale">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Adresse">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="CP">
                  <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                </Field>
                <Field label="Ville">
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </Field>
                <Field label="Pays">
                  <Select value={form.country} onValueChange={(v: Country) => setForm({ ...form, country: v, currency: v === "CH" ? "CHF" : "EUR" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="CH">Suisse</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Devise">
                  <Select value={form.currency} onValueChange={(v: Currency) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="N° TVA (optionnel)">
                  <Input value={form.vatNumber ?? ""} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit}>{editing ? "Enregistrer" : "Ajouter"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {state.clients.length === 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <div className="rounded-full bg-accent p-3"><UserRound className="h-6 w-6 text-sage" /></div>
          <div className="font-brand text-xl">Aucun client</div>
          <p className="text-sm text-muted-foreground">Ajoutez votre premier client pour commencer à facturer.</p>
          <Button className="mt-2" onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nouveau client</Button>
        </Card>
      ) : (
        <Card className="mt-8 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Ville</th>
                <th className="px-4 py-3 text-left">Pays</th>
                <th className="px-4 py-3 text-left">Devise</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {state.clients.map((c) => (
                <tr key={c.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.country === "CH" ? "Suisse" : "France"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.currency}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Supprimer ${c.name} ?`)) {
                          deleteClient(c.id);
                          toast.success("Client supprimé");
                        }
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
