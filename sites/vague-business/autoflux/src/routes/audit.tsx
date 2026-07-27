import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit gratuit — AutoFlux" },
      { name: "description", content: "Décrivez vos outils et vos frictions. Diagnostic écrit sous 48h avec 5 scénarios recommandés." },
      { property: "og:title", content: "Audit gratuit AutoFlux — réponse sous 48h" },
      { property: "og:description", content: "Diagnostic personnalisé et scénarios d'automatisation." },
    ],
  }),
  component: Audit,
});

const TOOLS = ["Google Workspace", "Microsoft 365", "Notion", "Airtable", "HubSpot", "Pipedrive", "Salesforce", "Stripe", "Shopify", "WooCommerce", "Calendly", "Slack", "WhatsApp Business", "Mailchimp", "Autre"];
const PAINS = ["Saisie manuelle répétée", "Relances clients / factures", "Suivi commercial", "Onboarding client", "Reporting mensuel", "Gestion RDV", "Avis / e-réputation", "Stock / commandes"];

const schema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(100),
  company: z.string().trim().min(2, "Entreprise requise").max(120),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(30).optional(),
  country: z.enum(["CH", "FR", "Autre"]),
  size: z.enum(["1", "2-10", "11-50", "50+"]),
  volume: z.enum(["<100", "100-500", "500-2000", "2000+"]),
  tools: z.array(z.string()).min(1, "Sélectionnez au moins un outil"),
  pains: z.array(z.string()).min(1, "Sélectionnez au moins une friction"),
  message: z.string().trim().max(1000).optional(),
});

function Audit() {
  const [tools, setTools] = useState<string[]>([]);
  const [pains, setPains] = useState<string[]>([]);
  const [country, setCountry] = useState<"CH" | "FR" | "Autre">("CH");
  const [size, setSize] = useState<"1" | "2-10" | "11-50" | "50+">("2-10");
  const [volume, setVolume] = useState<"<100" | "100-500" | "500-2000" | "2000+">("<100");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      country, size, volume, tools, pains,
      message: String(fd.get("message") ?? ""),
    };
    const r = schema.safeParse(data);
    if (!r.success) {
      toast.error(r.error.issues[0]?.message ?? "Formulaire incomplet");
      return;
    }
    try {
      const prev = JSON.parse(localStorage.getItem("autoflux_audits") ?? "[]");
      prev.push({ ...r.data, at: new Date().toISOString() });
      localStorage.setItem("autoflux_audits", JSON.stringify(prev));
    } catch {}
    toast.success("Audit reçu — réponse sous 48h.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="container-x flex min-h-[60vh] items-center py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
            <CheckCircle2 className="h-7 w-7 text-accent" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Brief reçu.</h1>
          <p className="mt-3 text-muted-foreground">
            On revient vers vous sous 48h avec un diagnostic écrit et 5 scénarios recommandés adaptés à votre stack.
          </p>
          <div className="mt-6 font-mono text-xs tracking-widest text-muted-foreground">RÉF · {Date.now().toString(36).toUpperCase()}</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-border/60">
        <div className="container-x py-16">
          <div className="font-mono text-xs tracking-widest text-muted-foreground">§ AUDIT GRATUIT</div>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Décrivez-nous votre stack.</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            5 minutes pour remplir. 48h pour recevoir un diagnostic écrit + 5 scénarios recommandés, gratuit et sans engagement.
          </p>
        </div>
      </section>

      <section className="bg-card">
        <div className="container-x py-16">
          <form onSubmit={onSubmit} className="mx-auto grid max-w-3xl gap-8">
            {/* Contact */}
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="font-mono text-xs tracking-widest text-accent">01 · CONTACT</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><Label htmlFor="name">Nom complet *</Label><Input id="name" name="name" className="mt-1.5" maxLength={100} required /></div>
                <div><Label htmlFor="company">Entreprise *</Label><Input id="company" name="company" className="mt-1.5" maxLength={120} required /></div>
                <div><Label htmlFor="email">Email pro *</Label><Input id="email" name="email" type="email" className="mt-1.5" maxLength={255} required /></div>
                <div><Label htmlFor="phone">Téléphone</Label><Input id="phone" name="phone" className="mt-1.5" maxLength={30} /></div>
              </div>
              <div className="mt-4">
                <Label>Pays</Label>
                <RadioGroup value={country} onValueChange={(v) => setCountry(v as any)} className="mt-2 flex gap-6">
                  {(["CH", "FR", "Autre"] as const).map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm"><RadioGroupItem value={c} /> {c === "CH" ? "Suisse" : c === "FR" ? "France" : "Autre"}</label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Entreprise */}
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="font-mono text-xs tracking-widest text-accent">02 · ENTREPRISE</div>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <Label>Effectif</Label>
                  <RadioGroup value={size} onValueChange={(v) => setSize(v as any)} className="mt-2 grid grid-cols-2 gap-2">
                    {(["1", "2-10", "11-50", "50+"] as const).map((s) => (
                      <label key={s} className="flex items-center gap-2 text-sm"><RadioGroupItem value={s} /> {s}</label>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label>Volume mensuel de leads/commandes</Label>
                  <RadioGroup value={volume} onValueChange={(v) => setVolume(v as any)} className="mt-2 grid grid-cols-2 gap-2">
                    {(["<100", "100-500", "500-2000", "2000+"] as const).map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm"><RadioGroupItem value={v} /> {v}</label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Outils */}
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="font-mono text-xs tracking-widest text-accent">03 · OUTILS UTILISÉS *</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {TOOLS.map((t) => {
                  const active = tools.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(tools, t, setTools)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frictions */}
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="font-mono text-xs tracking-widest text-accent">04 · FRICTIONS PRINCIPALES *</div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {PAINS.map((p) => (
                  <label key={p} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-3 text-sm hover:border-accent">
                    <Checkbox checked={pains.includes(p)} onCheckedChange={() => toggle(pains, p, setPains)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="font-mono text-xs tracking-widest text-accent">05 · CONTEXTE</div>
              <Label htmlFor="message" className="mt-4 block">Décrivez brièvement (facultatif)</Label>
              <Textarea id="message" name="message" className="mt-1.5" rows={4} maxLength={1000} placeholder="Ex : on perd 3h/semaine à recopier les leads du site dans HubSpot..." />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">Vos données restent chez nous. Aucun spam. Réponse sous 48h.</p>
              <button type="submit" className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Envoyer le brief
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
