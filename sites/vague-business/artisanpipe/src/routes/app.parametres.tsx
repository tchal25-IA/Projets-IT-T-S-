import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useProfile } from "@/lib/useStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TVA_PRESETS } from "@/lib/quoteEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parametres")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, save } = useProfile();
  const [form, setForm] = useState(profile);

  useEffect(() => setForm(profile), [profile]);

  const submit = () => {
    save(form);
    toast.success("Paramètres enregistrés.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Ces informations apparaissent en en-tête de vos devis PDF.
        </p>
      </div>
      <Card className="space-y-4 p-4">
        <div>
          <Label>Nom de l'entreprise</Label>
          <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Adresse</Label>
          <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>TVA par défaut</Label>
            <Select value={String(form.tva)} onValueChange={(v) => setForm({ ...form, tva: parseFloat(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TVA_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={String(p.value)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Devise</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v as "CHF" | "EUR" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CHF">CHF · Franc suisse</SelectItem>
                <SelectItem value="EUR">EUR · Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={submit}>Enregistrer</Button>
        </div>
      </Card>
    </div>
  );
}
