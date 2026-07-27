import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/pour-fiduciaires")({
  head: () => ({
    meta: [
      { title: "Pour les fiduciaires — Recevez des demandes qualifiées | FiduciaFind" },
      { name: "description", content: "Rejoignez FiduciaFind et recevez des demandes de devis d'indépendants et PME de Suisse romande. Fiche gratuite, options Pro dès 49 CHF/mois." },
      { property: "og:title", content: "Rejoignez FiduciaFind — Pour les fiduciaires" },
      { property: "og:description", content: "Recevez des demandes qualifiées d'indépendants et PME." },
    ],
  }),
  component: Pros,
});

const schema = z.object({
  cabinet: z.string().trim().min(2, "Nom requis").max(150),
  contact: z.string().trim().min(2, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  canton: z.string().trim().min(2).max(50),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function Pros() {
  const [form, setForm] = useState({ cabinet: "", contact: "", email: "", canton: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) {
      const fe: Record<string, string> = {};
      p.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    toast.success("Demande reçue", { description: "Notre équipe vous recontacte sous 24h ouvrées." });
    setForm({ cabinet: "", contact: "", email: "", canton: "", message: "" });
  };

  const plans = [
    { name: "Standard", price: "0", features: ["Fiche annuaire", "Coordonnées visibles", "3 spécialités"] },
    { name: "Pro", price: "49", highlight: true, features: ["Badge vérifié", "Contact direct", "Statistiques", "Spécialités illimitées"] },
    { name: "Premium", price: "99", features: ["Tout Pro", "Sponsorisation cantonale", "Mise en avant homepage", "Support prioritaire"] },
  ];

  return (
    <div>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Badge className="bg-accent text-accent-foreground">Pour les fiduciaires</Badge>
          <h1 className="brand-serif mt-4 text-4xl md:text-5xl">
            Recevez des demandes de devis <span className="text-accent">qualifiées</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            FiduciaFind connecte les indépendants et PME romandes avec les fiduciaires près de chez eux.
            Concentrez-vous sur les demandes qui correspondent à votre expertise.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="brand-serif text-center text-3xl">Nos formules</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-6 ${p.highlight ? "border-accent bg-accent/5 shadow-lg" : "border-border bg-card"}`}>
              {p.highlight && <Badge className="bg-accent text-accent-foreground">Populaire</Badge>}
              <div className="brand-serif mt-2 text-2xl">{p.name}</div>
              <div className="mt-1"><span className="brand-serif text-4xl">{p.price}</span> <span className="text-sm text-muted-foreground">CHF/mois</span></div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-20">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="brand-serif text-2xl">Créer votre fiche</h2>
          <p className="text-sm text-muted-foreground">Nous vous recontactons pour valider votre profil.</p>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="cabinet">Nom du cabinet *</Label>
              <Input id="cabinet" value={form.cabinet} onChange={(e) => setForm({ ...form, cabinet: e.target.value })} className="mt-1" maxLength={150} />
              {errors.cabinet && <p className="mt-1 text-xs text-destructive">{errors.cabinet}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="contact">Personne de contact *</Label>
                <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="mt-1" maxLength={100} />
                {errors.contact && <p className="mt-1 text-xs text-destructive">{errors.contact}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email pro *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" maxLength={255} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="canton">Canton principal *</Label>
              <Input id="canton" value={form.canton} onChange={(e) => setForm({ ...form, canton: e.target.value })} className="mt-1" placeholder="Ex : Genève" maxLength={50} />
              {errors.canton && <p className="mt-1 text-xs text-destructive">{errors.canton}</p>}
            </div>
            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea id="message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1" maxLength={1000} />
            </div>
            <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Envoyer ma candidature
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
