import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteLayout, PACKAGES } from "@/components/site-layout";
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

type Search = { pkg?: string };

export const Route = createFileRoute("/demander")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    pkg: typeof s.pkg === "string" ? s.pkg : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Demander un audit — SiteConforme" },
      {
        name: "description",
        content: "Envoyez-nous l'URL de votre site et recevez un premier diagnostic RGPD / nLPD sous 24 h.",
      },
      { property: "og:title", content: "Demander un audit — SiteConforme" },
      { property: "og:description", content: "Formulaire de demande d'audit et correctifs RGPD / nLPD." },
    ],
  }),
  component: DemanderPage,
});

const schema = z.object({
  url: z.string().trim().url({ message: "URL invalide (ex: https://monsite.fr)" }).max(300),
  country: z.enum(["FR", "CH"]),
  siteType: z.enum(["vitrine", "ecommerce", "saas", "autre"]),
  pkg: z.enum(["flash", "fix", "full"]),
  name: z.string().trim().min(2, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(200),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
});

function DemanderPage() {
  const { pkg: initialPkg } = Route.useSearch();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    url: "",
    country: "FR" as "FR" | "CH",
    siteType: "vitrine" as "vitrine" | "ecommerce" | "saas" | "autre",
    pkg: (initialPkg === "flash" || initialPkg === "fix" || initialPkg === "full"
      ? initialPkg
      : "fix") as "flash" | "fix" | "full",
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const iss of parsed.error.issues) errs[iss.path[0] as string] = iss.message;
      setErrors(errs);
      toast.error("Merci de corriger les champs indiqués");
      return;
    }
    setErrors({});
    try {
      const key = "siteconforme.requests";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push({ ...parsed.data, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* ignore storage errors */
    }
    toast.success("Demande envoyée — on vous rappelle sous 24 h");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Demande bien reçue</h1>
          <p className="mt-3 text-muted-foreground">
            Un consultant SiteConforme vous répond sous 24 h ouvrées avec un premier diagnostic
            et les prochaines étapes.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Demander un audit</h1>
          <p className="mt-3 text-muted-foreground">
            Décrivez votre site en 1 minute. On revient vers vous sous 24 h.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6"
        >
          <Field label="URL du site" error={errors.url}>
            <Input
              type="url"
              placeholder="https://monsite.fr"
              value={form.url}
              onChange={(e) => upd("url", e.target.value)}
              required
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Pays" error={errors.country}>
              <Select value={form.country} onValueChange={(v) => upd("country", v as "FR" | "CH")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">🇫🇷 France (RGPD)</SelectItem>
                  <SelectItem value="CH">🇨🇭 Suisse (nLPD)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Type de site" error={errors.siteType}>
              <Select
                value={form.siteType}
                onValueChange={(v) => upd("siteType", v as typeof form.siteType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vitrine">Vitrine</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="saas">SaaS / application</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Package souhaité" error={errors.pkg}>
            <div className="grid gap-3 md:grid-cols-3">
              {PACKAGES.map((p) => {
                const val = p.name.toLowerCase() as "flash" | "fix" | "full";
                const active = form.pkg === val;
                return (
                  <button
                    type="button"
                    key={val}
                    onClick={() => upd("pkg", val)}
                    className={
                      "text-left rounded-xl border p-4 transition " +
                      (active
                        ? "border-accent bg-accent/5 ring-2 ring-accent/40"
                        : "border-border hover:border-foreground/30")
                    }
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-lg mt-1">{p.price}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.tagline}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nom complet" error={errors.name}>
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} required />
            </Field>
            <Field label="Email professionnel" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => upd("email", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Entreprise (optionnel)" error={errors.company}>
            <Input value={form.company} onChange={(e) => upd("company", e.target.value)} />
          </Field>

          <Field label="Message (optionnel)" error={errors.message}>
            <Textarea
              rows={4}
              placeholder="Contexte, urgence, contraintes…"
              value={form.message}
              onChange={(e) => upd("message", e.target.value)}
            />
          </Field>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between pt-2">
            <p className="text-xs text-muted-foreground max-w-xs">
              En envoyant, vous acceptez d'être recontacté. Aucune donnée transmise à des tiers.
            </p>
            <Button type="submit" size="lg">Envoyer la demande</Button>
          </div>
        </form>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}