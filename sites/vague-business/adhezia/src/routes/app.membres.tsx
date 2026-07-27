import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, store, type Member, type MemberStatus } from "@/lib/adhezia-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/membres")({
  head: () => ({
    meta: [
      { title: "Membres — Adhezia" },
      { name: "description", content: "Ajoutez, modifiez et exportez vos membres." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembersPage,
});

const statusLabel: Record<MemberStatus, string> = {
  actif: "Actif",
  en_retard: "En retard",
  inactif: "Inactif",
};

function MembersPage() {
  const members = useStore((s) => s.members);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const [emailGateOpen, setEmailGateOpen] = useState(false);

  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.email.toLowerCase().includes(q.toLowerCase()),
      ),
    [members, q],
  );

  function exportCsv() {
    const header = ["Nom", "Email", "Téléphone", "Statut", "Adhésion", "Code"].join(",");
    const rows = members.map((m) =>
      [m.name, m.email, m.phone, statusLabel[m.status], m.joinedAt, m.code]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adhezia-membres-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
    if (!store.get().emailGate) {
      setTimeout(() => setEmailGateOpen(true), 400);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Membres</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} inscrit(s) au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 size-4" /> Export CSV</Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 size-4" /> Nouveau membre
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher un membre…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState onCreate={() => { setEditing(null); setOpen(true); }} />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_120px_100px] gap-4 px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground bg-secondary/60 border-b border-border">
            <span>Nom</span>
            <span>Contact</span>
            <span>Adhésion</span>
            <span>Statut</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((m) => (
              <li key={m.id} className="grid md:grid-cols-[1.5fr_1.5fr_1fr_120px_100px] gap-2 md:gap-4 px-5 py-4 items-center">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground md:hidden">{m.email}</p>
                </div>
                <div className="hidden md:block text-sm">
                  <p>{m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.phone}</p>
                </div>
                <span className="text-sm text-muted-foreground">{m.joinedAt}</span>
                <StatusBadge status={m.status} />
                <div className="flex md:justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setOpen(true); }} aria-label="Modifier">
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Supprimer ${m.name} ?`)) { store.removeMember(m.id); toast.success("Membre supprimé"); } }} aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <MemberDialog open={open} onOpenChange={setOpen} member={editing} />
      <EmailGateDialog open={emailGateOpen} onOpenChange={setEmailGateOpen} />
    </div>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, string> = {
    actif: "bg-[color:color-mix(in_oklab,var(--success)_15%,transparent)] text-[color:var(--success)]",
    en_retard: "bg-[color:color-mix(in_oklab,var(--warning)_15%,transparent)] text-[color:var(--warning)]",
    inactif: "bg-secondary text-muted-foreground",
  };
  return <Badge variant="secondary" className={map[status] + " border-0"}>{statusLabel[status]}</Badge>;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="p-12 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-primary mb-4">
        <Users className="size-6" />
      </span>
      <h3 className="text-lg font-semibold">Aucun membre</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">Commencez par ajouter votre premier adhérent.</p>
      <Button onClick={onCreate}><Plus className="mr-2 size-4" /> Nouveau membre</Button>
    </Card>
  );
}

function MemberDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (b: boolean) => void; member: Member | null }) {
  const [form, setForm] = useState<Omit<Member, "id" | "code">>({
    name: "", email: "", phone: "", status: "actif", joinedAt: new Date().toISOString().slice(0, 10), notes: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nom requis");
    if (member) {
      store.updateMember(member.id, form);
      toast.success("Membre mis à jour");
    } else {
      store.addMember(form);
      toast.success("Membre ajouté");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) {
        setForm(
          member
            ? { name: member.name, email: member.email, phone: member.phone, status: member.status, joinedAt: member.joinedAt, notes: member.notes ?? "" }
            : { name: "", email: "", phone: "", status: "actif", joinedAt: new Date().toISOString().slice(0, 10), notes: "" },
        );
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? "Modifier le membre" : "Nouveau membre"}</DialogTitle>
          <DialogDescription>Les données restent sur cet appareil pour la version d'essai.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="joined">Date d'adhésion</Label>
              <Input id="joined" type="date" value={form.joinedAt} onChange={(e) => setForm({ ...form, joinedAt: e.target.value })} />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v: MemberStatus) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{member ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmailGateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const [email, setEmail] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relances auto de cotisations — bientôt</DialogTitle>
          <DialogDescription>
            Laissez votre email pour être prévenu·e dès que les relances automatiques par email et SMS arrivent.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@")) return toast.error("Email invalide");
            store.setEmailGate(email);
            toast.success("Merci — on vous tient au courant.");
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <Input type="email" placeholder="vous@club.ch" value={email} onChange={(e) => setEmail(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Plus tard</Button>
            <Button type="submit">Me prévenir</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
