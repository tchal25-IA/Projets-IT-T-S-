import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck, Zap, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CANTONS, ALL_SPECIALTIES, FIDUCIAIRES } from "@/data/fiduciaires";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FiduciaFind — Trouvez la fiduciaire idéale en Suisse romande" },
      { name: "description", content: "Comparez les fiduciaires près de chez vous par canton, langues, spécialité et budget. Devis en 1 clic pour indépendants et PME." },
      { property: "og:title", content: "FiduciaFind — Comparez les fiduciaires suisses" },
      { property: "og:description", content: "Comparez les fiduciaires près de chez vous — devis en 1 clic." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [canton, setCanton] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/recherche",
      search: { canton: canton || undefined, specialty: specialty || undefined },
    });
  };

  const featured = FIDUCIAIRES.filter((f) => f.featured).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[oklch(0.24_0.05_255)] to-[oklch(0.18_0.05_255)] text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <Badge className="mb-5 bg-accent/20 text-accent hover:bg-accent/20">
            <ShieldCheck className="mr-1 h-3 w-3" /> 100% gratuit pour les indépendants
          </Badge>
          <h1 className="brand-serif max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Comparez les fiduciaires <span className="text-accent">près de chez vous</span> — devis en 1 clic.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/80">
            Un annuaire indépendant pour freelances, Sàrl et PME de Suisse romande.
            Filtrez par canton, langues, spécialité et budget. Demandez 3 devis en moins d'une minute.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 grid gap-3 rounded-xl bg-background/95 p-3 text-foreground shadow-2xl backdrop-blur md:grid-cols-[1fr_1fr_auto]"
          >
            <Select value={canton} onValueChange={setCanton}>
              <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 md:border-r md:border-border md:rounded-none">
                <SelectValue placeholder="Canton" />
              </SelectTrigger>
              <SelectContent>
                {CANTONS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Spécialité (ex : indépendants, TVA, frontalier)" />
              </SelectTrigger>
              <SelectContent>
                {ALL_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Search className="mr-2 h-4 w-4" /> Rechercher
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 text-sm text-primary-foreground/70">
            <span>Populaire :</span>
            {["indépendants", "frontalier", "Sàrl", "TVA", "startup"].map((s) => (
              <Link
                key={s}
                to="/recherche"
                search={{ specialty: s }}
                className="rounded-full border border-primary-foreground/20 px-3 py-0.5 hover:border-accent hover:text-accent"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="brand-serif text-center text-3xl md:text-4xl">Comment ça marche</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          Trois étapes, une décision éclairée.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "1. Filtrez", body: "Canton, langues, spécialité, budget, remote… votre annuaire sur mesure." },
            { icon: Users, title: "2. Comparez 3 profils", body: "Ajoutez jusqu'à trois fiduciaires à votre comparatif côte à côte." },
            { icon: Zap, title: "3. Demandez un devis", body: "Un formulaire, une réponse. Sans engagement." },
          ].map((s) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="brand-serif text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-[color:var(--stone-warm)] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="brand-serif text-3xl md:text-4xl">Sélection du moment</h2>
              <p className="mt-2 text-muted-foreground">Fiduciaires vérifiées et actives sur la plateforme.</p>
            </div>
            <Button asChild variant="link" className="text-primary">
              <Link to="/recherche">Voir tout l'annuaire <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featured.map((f) => (
              <Link
                key={f.id}
                to="/f/$id"
                params={{ id: f.id }}
                className="group rounded-xl border border-border bg-card p-6 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-accent text-accent-foreground">Sponsorisé</Badge>
                  <span className="text-sm font-semibold text-primary">★ {f.rating.toFixed(1)}</span>
                </div>
                <h3 className="brand-serif mt-3 text-xl group-hover:text-primary">{f.name}</h3>
                <p className="text-sm text-muted-foreground">{f.city} · {f.priceBand}</p>
                <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{f.shortBio}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser for pros */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="rounded-2xl bg-primary p-10 text-primary-foreground md:p-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <Badge className="bg-accent text-accent-foreground">Pour les fiduciaires</Badge>
              <h2 className="brand-serif mt-4 text-3xl md:text-4xl">
                Recevez des demandes de devis qualifiées.
              </h2>
              <p className="mt-3 text-primary-foreground/80">
                Listing standard gratuit. Listing Pro dès <span className="text-accent font-semibold">49 CHF/mois</span> :
                mise en avant, badge vérifié, priorité dans les résultats.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/pour-fiduciaires">Devenir partenaire</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 rounded-xl bg-primary-foreground/5 p-6">
              {[
                { name: "Gratuit", price: "0", desc: "Fiche standard, coordonnées, spécialités." },
                { name: "Pro", price: "49", desc: "Badge vérifié, contact direct, statistiques.", highlight: true },
                { name: "Premium", price: "99", desc: "Mise en avant, sponsorisation cantonale." },
              ].map((p) => (
                <div key={p.name} className={`flex items-center justify-between rounded-lg border p-4 ${p.highlight ? "border-accent bg-accent/10" : "border-primary-foreground/10"}`}>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-primary-foreground/70">{p.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="brand-serif text-2xl">{p.price}</div>
                    <div className="text-xs text-primary-foreground/60">CHF/mois</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="brand-serif text-center text-3xl md:text-4xl">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-8">
          <AccordionItem value="q1">
            <AccordionTrigger>Quelle différence entre fiduciaire et expert-comptable français ?</AccordionTrigger>
            <AccordionContent>
              En Suisse, la « fiduciaire » regroupe comptabilité, fiscalité, salaires, révision et conseil.
              C'est l'équivalent élargi de l'expert-comptable français, souvent avec un rôle de conseil de gestion.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>Comment les profils sont-ils sélectionnés ?</AccordionTrigger>
            <AccordionContent>
              Cette version MVP présente des profils de démonstration. À terme, chaque fiduciaire sera vérifiée
              (registre du commerce, numéro IDE, attestations).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Est-ce gratuit pour les indépendants ?</AccordionTrigger>
            <AccordionContent>
              Oui, 100% gratuit et sans engagement pour les indépendants et PME qui recherchent une fiduciaire.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>Comment apparaître en tant que fiduciaire ?</AccordionTrigger>
            <AccordionContent>
              Rendez-vous sur <Link to="/pour-fiduciaires" className="text-primary underline">Pour les fiduciaires</Link>
              {" "}pour créer votre fiche. Fiche standard gratuite, options Pro dès 49 CHF/mois.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </>
  );
}
