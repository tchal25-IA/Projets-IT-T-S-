import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AssoPV — Documents d'AG pour associations suisses" },
      { name: "description", content: "Convocation, ordre du jour, liste de présence, procès-verbal. Le pack AG en quelques minutes, en français et en allemand." },
      { property: "og:title", content: "AssoPV — Documents d'AG pour associations suisses" },
      { property: "og:description", content: "Le pack AG en quelques minutes, en français et en allemand." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-28 md:pb-28">
          <p className="font-serif text-sm uppercase tracking-[0.22em] text-accent">
            Le pack AG des associations suisses
          </p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Votre assemblée générale, <em className="text-accent not-italic">prête à imprimer</em>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Convocation, ordre du jour, liste de présence et procès-verbal. Un assistant simple, bilingue FR/DE, pensé pour les comités de Vereine et clubs suisses. Sans usine à gaz.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link to="/ag">Préparer mon AG</Link>
            </Button>
            <a href="#comment" className="text-sm underline underline-offset-4 hover:text-accent">
              Comment ça marche →
            </a>
          </div>
        </section>

        <section id="comment" className="border-y border-border/60 bg-card">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-3">
            {[
              { n: "01", t: "Vous remplissez", d: "Nom de l'asso, date, lieu, ordre du jour, membres présents, votes." },
              { n: "02", t: "AssoPV rédige", d: "Convocation, OdJ, liste de présence et PV en français et/ou allemand." },
              { n: "03", t: "Vous imprimez", d: "Aperçu propre puis Enregistrer en PDF depuis votre navigateur." },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-serif text-3xl text-accent">{s.n}</div>
                <h3 className="mt-3 font-serif text-2xl">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-serif text-3xl md:text-4xl">Deux formules, aucune usine à gaz.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-8">
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Gratuit</p>
              <p className="mt-3 font-serif text-4xl">0 CHF</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>· 1 pack AG complet</li>
                <li>· Export imprimable (PDF via navigateur)</li>
                <li>· FR ou DE</li>
              </ul>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to="/ag">Commencer</Link>
              </Button>
            </div>
            <div className="rounded-lg border-2 border-accent bg-card p-8">
              <p className="text-sm uppercase tracking-wider text-accent">Club — bientôt</p>
              <p className="mt-3 font-serif text-4xl">29 CHF<span className="text-lg text-muted-foreground">/an</span></p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>· Packs AG illimités</li>
                <li>· Documents bilingues FR/DE côte à côte</li>
                <li>· Modèles sauvegardés d'une année à l'autre</li>
              </ul>
              <Button asChild className="mt-8 w-full">
                <a href="mailto:hello@assopv.ch?subject=Formule%20Club">M'avertir au lancement</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-card">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-serif text-3xl md:text-4xl">Questions fréquentes</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {[
                { q: "Quel délai pour convoquer une AG ?", a: "En Suisse, le délai dépend des statuts de votre association. On observe souvent 10 à 20 jours avant la date. Vérifiez toujours vos statuts." },
                { q: "Comment gérer le quorum ?", a: "Le quorum est défini par vos statuts. AssoPV vous laisse noter librement s'il est atteint et combien de voix sont représentées." },
                { q: "AG ordinaire ou extraordinaire ?", a: "L'AG ordinaire a lieu chaque année (comptes, élections, budget). L'AG extraordinaire est convoquée pour un objet précis en dehors du cycle annuel." },
                { q: "Pourquoi le bilingue FR/DE ?", a: "De nombreux Vereine suisses fonctionnent avec des membres francophones et alémaniques. AssoPV peut générer les documents dans les deux langues." },
              ].map((f) => (
                <div key={f.q}>
                  <h3 className="font-serif text-xl">{f.q}</h3>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-serif text-2xl font-semibold tracking-tight">
          Asso<span className="text-accent">PV</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/mentions" className="text-muted-foreground hover:text-foreground">Mentions</Link>
          <Button asChild size="sm">
            <Link to="/ag">Préparer mon AG</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground">
        <p className="font-serif">AssoPV — pour les associations suisses.</p>
        <div className="flex gap-6">
          <Link to="/mentions" className="hover:text-foreground">Mentions</Link>
          <a href="mailto:hello@assopv.ch" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
