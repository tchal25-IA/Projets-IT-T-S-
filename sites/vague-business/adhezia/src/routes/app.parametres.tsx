import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, store } from "@/lib/adhezia-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Adhezia" },
      { name: "description", content: "Profil du club, saison et cotisation par défaut." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const cantons = ["GE", "VD", "VS", "FR", "NE", "JU", "BE", "ZH", "BS", "BL", "TI", "LU", "SG", "AG", "SO", "SH", "TG", "GR", "OW", "NW", "SZ", "UR", "GL", "ZG", "AR", "AI"];

function SettingsPage() {
  const club = useStore((s) => s.club);
  const [form, setForm] = useState(club);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Nom du club requis");
    store.updateClub(form);
    toast.success("Paramètres enregistrés");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Profil du club et cotisation par défaut.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du club</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Canton</Label>
              <Select value={form.canton} onValueChange={(v) => setForm({ ...form, canton: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cantons.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="season">Saison</Label>
              <Input id="season" value={form.seasonYear} onChange={(e) => setForm({ ...form, seasonYear: e.target.value })} maxLength={9} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dues">Cotisation par défaut</Label>
              <Input id="dues" type="number" value={form.defaultDues} onChange={(e) => setForm({ ...form, defaultDues: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Devise</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={() => { if (confirm("Réinitialiser toutes les données de démonstration ?")) { store.reset(); toast.success("Données réinitialisées"); } }}>
              Réinitialiser la démo
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
