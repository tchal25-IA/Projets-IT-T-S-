import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type BriefSearch = { pkg?: string };

export const Route = createFileRoute("/brief")({
  validateSearch: (search: Record<string, unknown>): BriefSearch => ({
    pkg: typeof search.pkg === "string" ? search.pkg : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Brief — VitrineFlash | 5 min pour lancer votre refonte" },
      { name: "description", content: "Envoyez votre brief en 5 minutes. Réponse sous 24h, livraison en 48h ouvrées." },
      { property: "og:title", content: "Brief VitrineFlash" },
      { property: "og:description", content: "Décrivez votre projet en 5 minutes. On revient sous 24h." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BriefPage,
});

const briefSchema = z.object({
  business: z.string().trim().min(2, "Nom trop court").max(120),
  sector: z.string().trim().min(2, "Précisez votre secteur").max(80),
  city: z.string().trim().min(2, "Ville / canton requis").max(80),
  currentUrl: z.string().trim().max(200).optional().or(z.literal("")),
  goals: z.array(z.string()).min(1, "Choisissez au moins un objectif"),
  colors: z.string().trim().max(200).optional().or(z.literal("")),
  pages: z.array(z.string()).min(1, "Sélectionnez au moins une page"),
  pkg: z.enum(["essentiel", "pro", "premium"]),
  name: z.string().trim().min(2, "Votre nom").max(80),
  email: z.string().trim().email("Email invalide").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type BriefData = z.infer<typeof briefSchema>;

const GOALS = ["Attirer plus de clients locaux", "Prendre des RDV en ligne", "Vendre / commander", "Présenter mon activité proprement", "Améliorer mon SEO"];
const PAGES = ["Accueil", "À propos", "Services / Prestations", "Menu / Produits", "Portfolio / Galerie", "Contact", "Blog / Actualités"];
const STEPS = ["Activité", "Projet", "Package", "Contact"] as const;

const STORAGE_KEY = "vitrineflash:brief:v1";

function BriefPage() {
  const { pkg: pkgFromUrl } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<Partial<BriefData>>({
    goals: [],
    pages: ["Accueil", "Contact"],
    pkg: (pkgFromUrl as BriefData["pkg"]) ?? "pro",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pkgFromUrl && ["essentiel", "pro", "premium"].includes(pkgFromUrl)) {
      setData((d) => ({ ...d, pkg: pkgFromUrl as BriefData["pkg"] }));
    }
  }, [pkgFromUrl]);

  const set = <K extends keyof BriefData>(k: K, v: BriefData[K]) => setData((d) => ({ ...d, [k]: v }));

  const toggleArr = (k: "goals" | "pages", val: string) => {
    setData((d) => {
      const cur = (d[k] as string[] | undefined) ?? [];
      return { ...d, [k]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] };
    });
  };

  const stepFields: Array<Array<keyof BriefData>> = [
    ["business", "sector", "city", "currentUrl"],
    ["goals", "pages", "colors"],
    ["pkg"],
    ["name", "email", "phone", "notes"],
  ];

  const validateStep = () => {
    const partial = briefSchema.safeParse(data);
    if (partial.success) return true;
    const errs: Record<string, string> = {};
    const fields = stepFields[step];
    for (const issue of partial.error.issues) {
      const f = issue.path[0] as keyof BriefData;
      if (fields.includes(f) && !errs[f as string]) errs[f as string] = issue.message;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    const parsed = briefSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const f = issue.path[0] as string;
        if (!errs[f]) errs[f] = issue.message;
      }
      setErrors(errs);
      toast.error("Vérifiez le formulaire", { description: "Certains champs sont incomplets." });
      return;
    }
    try {
      const record = { ...parsed.data, submittedAt: new Date().toISOString() };
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      existing.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch {}
    toast.success("Brief reçu — on revient sous 24h", {
      description: "Un email de confirmation partira sous quelques minutes.",
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-brand text-4xl font-black tracking-tight md:text-5xl">Merci !</h1>
        <p className="mt-4 text-muted-foreground">
          Votre brief est bien reçu. On revient sous 24h avec un créneau de livraison sous 48h.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate({ to: "/" })} className="btn-amber rounded-md px-5 py-2.5 text-sm">
            Retour à l'accueil
          </button>
          <button
            onClick={() => { setSubmitted(false); setStep(0); setData({ goals: [], pages: ["Accueil", "Contact"], pkg: "pro" }); }}
            className="rounded-md border border-primary px-5 py-2.5 text-sm hover:bg-primary hover:text-primary-foreground"
          >
            Envoyer un autre brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground/80">Brief · 5 minutes</div>
        <h1 className="mt-2 font-brand text-4xl font-black tracking-tight md:text-5xl">
          Parlez-nous de votre projet.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Réponse sous 24h. Livraison en 48h ouvrées après validation.
        </p>
      </div>

      <Stepper current={step} />

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Nom du commerce / entreprise" error={errors.business}>
              <input className="input" value={data.business ?? ""} onChange={(e) => set("business", e.target.value)} placeholder="Boulangerie Marot" />
            </Field>
            <Field label="Secteur d'activité" error={errors.sector}>
              <input className="input" value={data.sector ?? ""} onChange={(e) => set("sector", e.target.value)} placeholder="Restauration, artisanat, santé..." />
            </Field>
            <Field label="Ville / canton" error={errors.city}>
              <input className="input" value={data.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Lausanne, VD" />
            </Field>
            <Field label="Site actuel (optionnel)" hint="URL de votre site s'il en existe un" error={errors.currentUrl}>
              <input className="input" value={data.currentUrl ?? ""} onChange={(e) => set("currentUrl", e.target.value)} placeholder="https://..." />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Field label="Objectifs principaux" hint="Un ou plusieurs" error={errors.goals}>
              <div className="grid gap-2 md:grid-cols-2">
                {GOALS.map((g) => (
                  <ChipToggle key={g} active={(data.goals ?? []).includes(g)} onClick={() => toggleArr("goals", g)}>
                    {g}
                  </ChipToggle>
                ))}
              </div>
            </Field>
            <Field label="Pages souhaitées" error={errors.pages}>
              <div className="grid gap-2 md:grid-cols-2">
                {PAGES.map((p) => (
                  <ChipToggle key={p} active={(data.pages ?? []).includes(p)} onClick={() => toggleArr("pages", p)}>
                    {p}
                  </ChipToggle>
                ))}
              </div>
            </Field>
            <Field label="Couleurs / style préféré" hint="Optionnel — ex : chaleureux, moderne, terracotta, noir & or..." error={errors.colors}>
              <input className="input" value={data.colors ?? ""} onChange={(e) => set("colors", e.target.value)} placeholder="Chaleureux, tons bois et amber" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Choisissez le package qui correspond au projet.</div>
            {[
              { id: "essentiel", name: "Essentiel", price: "490", desc: "1 page + mobile + formulaire" },
              { id: "pro", name: "Pro", price: "990", desc: "5 pages + SEO de base + Google Business" },
              { id: "premium", name: "Premium", price: "1490", desc: "Pro + blog + tracking + 1 révision" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set("pkg", p.id as BriefData["pkg"])}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                  data.pkg === p.id ? "border-accent bg-accent/10" : "border-border hover:border-primary"
                }`}
              >
                <div className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${data.pkg === p.id ? "border-accent bg-accent" : "border-border"}`}>
                  {data.pkg === p.id && <Check className="h-3 w-3 text-accent-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="font-brand text-lg font-bold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <div className="font-brand text-xl font-black">{p.price}<span className="ml-1 text-xs opacity-70">CHF/€</span></div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Field label="Votre nom" error={errors.name}>
              <input className="input" value={data.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Prénom Nom" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" value={data.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="vous@exemple.ch" />
            </Field>
            <Field label="Téléphone (optionnel)" error={errors.phone}>
              <input className="input" value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+41 ..." />
            </Field>
            <Field label="Précisions (optionnel)" error={errors.notes}>
              <textarea className="input min-h-[100px]" value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Contexte, contraintes, deadline..." />
            </Field>
            <p className="text-xs text-muted-foreground">
              En envoyant ce brief, vous acceptez d'être recontacté sous 24h. Aucune donnée n'est revendue.
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-amber inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm">
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} className="btn-amber inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm">
              Envoyer le brief <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          padding: 0.6rem 0.75rem;
          font-size: 0.95rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: var(--color-ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent);
        }
      `}</style>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${
                done ? "bg-primary text-primary-foreground" : active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <div className={`whitespace-nowrap text-xs font-semibold uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-xs font-medium text-destructive">{error}</div>}
    </label>
  );
}

function ChipToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
        active ? "border-accent bg-accent/15 text-foreground" : "border-border hover:border-primary"
      }`}
    >
      <span className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${active ? "border-accent bg-accent" : "border-border"}`}>
        {active && <Check className="h-3 w-3 text-accent-foreground" />}
      </span>
      {children}
    </button>
  );
}
