import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Star, MapPin, Globe, Mail, Check, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CANTONS, FIDUCIAIRES } from "@/data/fiduciaires";
import { saveLead, hasCapturedEmail, markEmailCaptured } from "@/lib/leads-store";

export const Route = createFileRoute("/f/$id")({
  loader: ({ params }) => {
    const f = FIDUCIAIRES.find((x) => x.id === params.id);
    if (!f) throw notFound();
    return { fiduciaire: f };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Fiduciaire introuvable" }, { name: "robots", content: "noindex" }] };
    const f = loaderData.fiduciaire;
    return {
      meta: [
        { title: `${f.name} — Fiduciaire à ${f.city} | FiduciaFind` },
        { name: "description", content: `${f.name}, fiduciaire à ${f.city}. ${f.shortBio}` },
        { property: "og:title", content: `${f.name} — Fiduciaire à ${f.city}` },
        { property: "og:description", content: f.shortBio },
        { property: "og:type", content: "profile" },
      ],
    };
  },
  component: ProfilePage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="brand-serif text-3xl">Fiduciaire introuvable</h1>
      <p className="mt-2 text-muted-foreground">Cette fiche n'existe pas ou a été retirée.</p>
      <Button asChild className="mt-6"><Link to="/recherche">Retour à l'annuaire</Link></Button>
    </div>
  );
}

const leadSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  besoin: z.string().trim().min(2, "Précisez votre besoin").max(120),
  message: z.string().trim().min(10, "Décrivez brièvement votre situation").max(1000),
});

function ProfilePage() {
  const { id } = useParams({ from: "/f/$id" });
  const f = FIDUCIAIRES.find((x) => x.id === id)!;
  const cantonLabel = CANTONS.find((c) => c.code === f.canton)?.label ?? f.canton;

  const [form, setForm] = useState({ name: "", email: "", phone: "", besoin: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#devis") {
      document.getElementById("devis")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveLead({ fiduciaireId: f.id, ...parsed.data, phone: parsed.data.phone || undefined });
    toast.success("Votre demande a bien été envoyée", {
      description: `${f.name} vous répondra sous 48h à ${parsed.data.email}.`,
    });
    setForm({ name: "", email: "", phone: "", besoin: "", message: "" });
    if (!hasCapturedEmail()) {
      markEmailCaptured(parsed.data.email);
      setShowGuide(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/recherche" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Retour aux résultats
      </Link>

      <header className="mt-4 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="brand-serif text-3xl md:text-4xl">{f.name}</h1>
              {f.verified && (
                <Badge className="bg-primary text-primary-foreground"><Check className="mr-1 h-3 w-3" />Vérifié</Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {f.city}, {cantonLabel}</span>
              <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {f.languages.join(" · ")}</span>
              <span>Budget {f.priceBand}</span>
              <span>{f.remote ? "À distance" : ""}{f.remote && f.onsite ? " · " : ""}{f.onsite ? "Sur site" : ""}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-2xl font-semibold">
              <Star className="h-5 w-5 fill-accent text-accent" />
              {f.rating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">{f.reviewCount} avis</div>
          </div>
        </div>
        <p className="mt-6 text-foreground/85">{f.shortBio}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {f.specialties.map((s) => (<Badge key={s} variant="secondary">{s}</Badge>))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm">
          <a href={`mailto:${f.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
            <Mail className="h-3 w-3" /> {f.email}
          </a>
          {f.website && (
            <a href={f.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> Site web
            </a>
          )}
        </div>
      </header>

      {/* Quote form */}
      <section id="devis" className="mt-8 rounded-2xl border border-border bg-card p-8">
        <h2 className="brand-serif text-2xl">Demander un devis</h2>
        <p className="text-sm text-muted-foreground">Réponse sous 48h. Sans engagement.</p>

        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" maxLength={100} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" maxLength={255} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" maxLength={30} />
          </div>
          <div>
            <Label htmlFor="besoin">Votre besoin *</Label>
            <Input id="besoin" value={form.besoin} onChange={(e) => setForm({ ...form, besoin: e.target.value })} className="mt-1" placeholder="Ex: création Sàrl, TVA, salaires…" maxLength={120} />
            {errors.besoin && <p className="mt-1 text-xs text-destructive">{errors.besoin}</p>}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1" maxLength={1000} />
            {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Envoyer la demande
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              En envoyant ce formulaire, vous acceptez que {f.name} vous contacte à propos de votre demande.
            </p>
          </div>
        </form>
      </section>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="brand-serif text-2xl">Merci !</DialogTitle>
            <DialogDescription>
              En cadeau : notre guide gratuit <strong>« 7 questions à poser à votre fiduciaire »</strong>.
              Nous vous l'envoyons par email dans quelques minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowGuide(false)} className="bg-primary text-primary-foreground">Parfait</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
