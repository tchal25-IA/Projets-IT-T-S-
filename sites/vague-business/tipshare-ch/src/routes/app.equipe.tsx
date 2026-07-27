import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTipStore } from "@/lib/tipStore";
import { ROLE_LABELS, type Role } from "@/lib/tipEngine";
import { Trash2, UserPlus } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/app/equipe")({
  head: () => ({
    meta: [
      { title: "Équipe — TipShare" },
      { name: "description", content: "Gérer votre équipe et les poids par rôle." },
      { property: "og:title", content: "Équipe — TipShare" },
      { property: "og:description", content: "Ajouter, éditer et pondérer les rôles de votre équipe." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { staff, addStaff, updateStaff, removeStaff } = useTipStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("serveur");

  return (
    <AppShell>
      <Toaster richColors position="top-center" />
      <h1 className="brand-serif text-3xl text-primary">Équipe</h1>
      <p className="text-sm text-muted-foreground">
        Le poids rôle est utilisé par la méthode « heures × poids rôle ». Un serveur au bar peut
        peser 1.1, un runner 0.8, etc.
      </p>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="brand-serif text-lg text-primary">Ajouter un membre</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label>Prénom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Camille" />
          </div>
          <div>
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              addStaff(name.trim(), role);
              setName("");
              toast.success("Membre ajouté");
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </section>

      <section className="mt-6 space-y-2">
        {staff.map((s) => (
          <div key={s.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1.5fr_1fr_120px_auto_auto] sm:items-center">
            <Input value={s.name} onChange={(e) => updateStaff(s.id, { name: e.target.value })} />
            <Select value={s.role} onValueChange={(v) => updateStaff(s.id, { role: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Label className="text-xs text-muted-foreground">Poids</Label>
              <Input
                type="number"
                step="0.1"
                min={0}
                value={s.weight}
                onChange={(e) => updateStaff(s.id, { weight: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={s.active} onCheckedChange={(v) => updateStaff(s.id, { active: v })} />
              <span className="text-xs text-muted-foreground">{s.active ? "Actif" : "Inactif"}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm(`Supprimer ${s.name} ?`)) removeStaff(s.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun membre pour le moment.</p>
        )}
      </section>
    </AppShell>
  );
}
