import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/AppShell";
import { Check, Wine, Users, Printer, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TipShare — Répartissez les pourboires en 2 minutes" },
      {
        name: "description",
        content:
          "Fini l'Excel du dimanche soir. TipShare calcule et imprime la répartition des tips (cash + carte) pour restos, bars et salons. Suisse & France.",
      },
      { property: "og:title", content: "TipShare — Pourboires, répartis en 2 minutes" },
      { property: "og:description", content: "Tips du jour → parts équipe → PDF de répartition." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#comment" className="hover:text-primary">Comment ça marche</a>
          <a href="#tarifs" className="hover:text-primary">Tarifs</a>
          <a href="#faq" className="hover:text-primary">FAQ</a>
        </nav>
        <Link to="/app">
          <Button size="sm">Ouvrir l'app</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-1 text-xs uppercase tracking-wider text-primary">
              <Wine className="h-3.5 w-3.5" /> Restos · Bars · Salons — CH & FR
            </p>
            <h1 className="brand-serif text-5xl leading-[1.05] text-primary md:text-6xl">
              Les pourboires du service,<br />répartis en 2 minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-charcoal/80">
              Saisissez les tips du jour (cash + carte), l'équipe présente, ses heures.
              TipShare calcule la part de chacun et imprime une feuille de répartition claire.
              Fini le tableur du dimanche soir.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app">
                <Button size="lg" className="text-base">
                  Répartir les tips du jour
                </Button>
              </Link>
              <a href="#comment">
                <Button size="lg" variant="outline" className="text-base">
                  Voir comment
                </Button>
              </a>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-charcoal/70 sm:grid-cols-2">
              {[
                "Cash + carte + boîte à tips",
                "Équitable : égal, heures, ou pondéré",
                "Arrondis CHF 0.05 / EUR 0.01",
                "Impression PDF prête",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-2xl shadow-wine/10">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Service du 24 juillet</span>
                <span className="brand-serif text-3xl text-primary">CHF 205.50</span>
              </div>
              <div className="space-y-2">
                {[
                  { n: "Camille", r: "Serveuse", a: "46.10" },
                  { n: "Nadia", r: "Bar", a: "43.45" },
                  { n: "Yanis", r: "Cuisine", a: "42.15" },
                  { n: "Léa", r: "Accueil", a: "29.65" },
                  { n: "Marc", r: "Manager", a: "44.15" },
                ].map((row) => (
                  <div key={row.n} className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-3">
                    <div>
                      <div className="font-medium">{row.n}</div>
                      <div className="text-xs text-muted-foreground">{row.r}</div>
                    </div>
                    <div className="brand-serif text-xl">CHF {row.a}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Méthode : heures × poids rôle</span>
                <span className="inline-flex items-center gap-1"><Printer className="h-3 w-3" /> Prêt à imprimer</span>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow">
              ✱ Sans tableur
            </div>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="comment" className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="brand-serif text-3xl text-primary md:text-4xl">Comment ça marche</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { i: <Users className="h-5 w-5" />, t: "1. L'équipe", d: "Ajoutez serveurs, bar, cuisine, accueil. Réglez un poids rôle si besoin." },
              { i: <Wine className="h-5 w-5" />, t: "2. Les tips du jour", d: "Cash, carte, boîte à tips. Qui a bossé, combien d'heures." },
              { i: <Printer className="h-5 w-5" />, t: "3. La répartition", d: "TipShare calcule, arrondit correctement, et imprime la feuille." },
            ].map((s) => (
              <div key={s.t} className="rounded-xl border border-border bg-cream p-6">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {s.i}
                </div>
                <h3 className="brand-serif text-xl text-primary">{s.t}</h3>
                <p className="mt-1 text-sm text-charcoal/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="brand-serif text-3xl text-primary md:text-4xl">Tarifs simples</h2>
        <p className="mt-2 text-charcoal/70">Commencez gratuitement. Passez Pro quand vous ouvrez un 2ᵉ point de vente.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Gratuit</div>
            <div className="mt-2 brand-serif text-4xl text-primary">0 €<span className="text-base font-normal text-muted-foreground">/mois</span></div>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-accent" /> 1 point de vente</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-accent" /> Équipe illimitée</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-accent" /> Impression PDF</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-accent" /> Historique local</li>
            </ul>
            <Link to="/app" className="mt-8 block">
              <Button className="w-full" size="lg">Démarrer</Button>
            </Link>
          </div>
          <div className="relative rounded-2xl border border-primary bg-wine-deep p-8 text-cream">
            <div className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              Bientôt
            </div>
            <div className="text-xs uppercase tracking-wider text-cream/70">Pro</div>
            <div className="mt-2 brand-serif text-4xl">19 €<span className="text-base font-normal text-cream/70">/mois</span></div>
            <ul className="mt-6 space-y-2 text-sm text-cream/90">
              <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent" /> Multi-équipes / multi-sites</li>
              <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent" /> Export compta (CSV)</li>
              <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent" /> Comptes équipe & rôles</li>
              <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent" /> Support prioritaire</li>
            </ul>
            <Button variant="outline" size="lg" className="mt-8 w-full border-cream/40 bg-transparent text-cream hover:bg-cream hover:text-primary">
              Me prévenir
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="brand-serif text-3xl text-primary md:text-4xl">Questions fréquentes</h2>
          <div className="mt-8 space-y-4">
            {[
              {
                q: "Pourboires carte vs espèces, on gère comment ?",
                a: "Vous saisissez les deux séparément (cash, carte, autre). TipShare additionne le pool du jour puis répartit selon la méthode choisie.",
              },
              {
                q: "En Suisse, le service est inclus. TipShare sert quand même ?",
                a: "Oui — pour la boîte à tips, le tronc, ou les pourboires par carte qui arrivent en fin de mois. Vous gardez une trace claire.",
              },
              {
                q: "Qui voit quoi ?",
                a: "MVP : un appareil manager. La saisie et la répartition restent locales. Les comptes équipe arrivent dans la version Pro.",
              },
              {
                q: "Les arrondis ?",
                a: "0.05 CHF en Suisse, 0.01 € en France. L'écart de centimes est absorbé par la plus grosse part pour tomber juste.",
              },
            ].map((f) => (
              <details key={f.q} className="group rounded-lg border border-border bg-cream p-5">
                <summary className="cursor-pointer list-none font-medium text-primary">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-charcoal/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="brand-serif text-3xl text-primary md:text-4xl">Ce soir, la répartition se fait au bar.</h2>
        <p className="mx-auto mt-3 max-w-xl text-charcoal/70">Sortez le téléphone, tapez le pool, imprimez. C'est tout.</p>
        <Link to="/app" className="mt-6 inline-block">
          <Button size="lg" className="text-base">Répartir les tips du jour</Button>
        </Link>
      </section>

      <footer className="border-t border-border bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} TipShare</span>
          <Link to="/mentions" className="hover:text-primary">Mentions légales</Link>
        </div>
      </footer>
    </div>
  );
}
