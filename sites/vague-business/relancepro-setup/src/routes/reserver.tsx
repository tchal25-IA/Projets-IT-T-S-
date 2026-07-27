import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reserver")({
  head: () => ({
    meta: [
      { title: "Réserver ma session — RelancePro" },
      { name: "description", content: "Réservez votre session setup facturation + relances. Réponse sous 24h." },
      { property: "og:title", content: "Réserver — RelancePro" },
      { property: "og:description", content: "Setup facturation + relances en 90 min. 390 €." },
    ],
  }),
  component: Reserver,
});

const schema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  businessType: z.string().min(1, "Sélectionnez un type"),
  volume: z.string().min(1, "Sélectionnez un volume"),
  currentTool: z.string().min(1, "Sélectionnez un outil"),
  slot: z.string().min(1, "Créneau requis"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

function Reserver() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    businessType: "", volume: "", currentTool: "",
    slot: "", notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      toast.error("Merci de corriger les champs indiqués.");
      return;
    }
    setErrors({});
    try {
      const key = "relancepro:bookings";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({ ...result.data, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {}
    toast.success("Demande envoyée — on vous recontacte sous 24h.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-display text-4xl font-semibold">Demande bien reçue</h1>
        <p className="mt-4 text-muted-foreground">
          On revient vers vous par email sous 24h ouvrées avec un créneau confirmé et le lien visio.
        </p>
        <Link to="/" className="mt-8 inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Réserver ma session</h1>
        <p className="mt-3 text-muted-foreground">
          Quelques infos pour préparer la session à votre contexte. Aucun paiement à cette étape.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-5 rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Nom / Prénom" error={errors.name}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Marie Dupont" maxLength={80} />
          </Field>
          <Field label="Email pro" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="vous@exemple.fr" maxLength={200} />
          </Field>
        </div>

        <Field label="Téléphone (optionnel)" error={errors.phone}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="06 xx xx xx xx" maxLength={30} />
        </Field>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Type d'activité" error={errors.businessType}>
            <Select value={form.businessType} onValueChange={(v) => set("businessType", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="artisan">Artisan / BTP</SelectItem>
                <SelectItem value="coach">Coach / Consultant</SelectItem>
                <SelectItem value="freelance">Freelance / Prestataire</SelectItem>
                <SelectItem value="commerce">Commerce / TPE</SelectItem>
                <SelectItem value="sante">Profession santé / libérale</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Volume de factures / mois" error={errors.volume}>
            <Select value={form.volume} onValueChange={(v) => set("volume", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5">0 à 5</SelectItem>
                <SelectItem value="5-20">5 à 20</SelectItem>
                <SelectItem value="20-50">20 à 50</SelectItem>
                <SelectItem value="50+">50 et plus</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Outil actuel" error={errors.currentTool}>
            <Select value={form.currentTool} onValueChange={(v) => set("currentTool", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">Aucun</SelectItem>
                <SelectItem value="excel">Excel / Word</SelectItem>
                <SelectItem value="factufront">FactuFront</SelectItem>
                <SelectItem value="pennylane">Pennylane</SelectItem>
                <SelectItem value="indy">Indy</SelectItem>
                <SelectItem value="qonto">Qonto Facturation</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Créneau préféré" error={errors.slot}>
            <Select value={form.slot} onValueChange={(v) => set("slot", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lun-mat">Lundi matin</SelectItem>
                <SelectItem value="lun-aprem">Lundi après-midi</SelectItem>
                <SelectItem value="mar-mat">Mardi matin</SelectItem>
                <SelectItem value="mar-aprem">Mardi après-midi</SelectItem>
                <SelectItem value="mer-mat">Mercredi matin</SelectItem>
                <SelectItem value="jeu-mat">Jeudi matin</SelectItem>
                <SelectItem value="jeu-aprem">Jeudi après-midi</SelectItem>
                <SelectItem value="ven-mat">Vendredi matin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Contexte / questions (optionnel)" error={errors.notes}>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Points de blocage, spécificités TVA, migration..." rows={4} maxLength={500} />
        </Field>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">En envoyant, vous acceptez d'être recontacté par email sous 24h.</p>
          <Button type="submit" size="lg" className="w-full sm:w-auto">Envoyer ma demande</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
