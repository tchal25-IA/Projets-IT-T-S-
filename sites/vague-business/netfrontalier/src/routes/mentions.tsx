import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions & disclaimer — NetFrontalier" },
      {
        name: "description",
        content:
          "Mentions légales, méthodologie et disclaimer de l'estimateur NetFrontalier pour frontaliers CH → FR.",
      },
      { property: "og:title", content: "Mentions — NetFrontalier" },
      { property: "og:description", content: "Disclaimer et méthodologie NetFrontalier." },
      { property: "og:url", content: "/mentions" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/mentions" }],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 md:px-6 py-12 prose-invert">
        <h1 className="text-4xl font-serif text-primary">Mentions &amp; disclaimer</h1>

        <h2 className="mt-8 text-2xl font-serif">Nature du service</h2>
        <p className="mt-2 text-muted-foreground">
          NetFrontalier est un outil d'<strong className="text-foreground">estimation
          indicative</strong> du salaire net pour les travailleurs frontaliers employés en
          Suisse (cantons GE, VD, VS) et résidant en France. Il ne constitue pas un conseil
          fiscal, social ou juridique.
        </p>

        <h2 className="mt-8 text-2xl font-serif">Méthodologie</h2>
        <ul className="mt-2 text-muted-foreground list-disc pl-5 space-y-1">
          <li>Cotisations salariales : AVS/AI/APG (5,3 %), AC (1,1 % plafonné), AANP (~1,4 %), LPP part salariée (~7 % moyenne).</li>
          <li>Impôt à la source : barèmes cantonaux frontalier simplifiés, progressifs par tranches, avec réduction approximative par enfant à charge.</li>
          <li>Conversion CHF → EUR : taux paramétrable par l'utilisateur (défaut 0,95).</li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Les barèmes utilisés sont des approximations MVP à calibrer avec les sources
          officielles (AFC, administrations cantonales, AVS/AI). Ils peuvent différer de
          votre bulletin de salaire réel.
        </p>

        <h2 className="mt-8 text-2xl font-serif">Ce que NetFrontalier ne fait pas</h2>
        <ul className="mt-2 text-muted-foreground list-disc pl-5 space-y-1">
          <li>Ne remplace pas l'analyse d'un fiduciaire, d'un expert-comptable ou d'un conseiller fiscal.</li>
          <li>Ne prend pas en compte les cas particuliers (double activité, revenus locatifs, dividendes, situations mixtes).</li>
          <li>N'archive pas vos données&nbsp;: le calcul se fait localement dans votre navigateur.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-serif">Limitation de responsabilité</h2>
        <p className="mt-2 text-muted-foreground">
          Toute décision prise sur la base des résultats affichés relève de la seule
          responsabilité de l'utilisateur. NetFrontalier décline toute responsabilité en cas
          d'écart entre l'estimation et le salaire net réellement perçu.
        </p>

        <h2 className="mt-8 text-2xl font-serif">Contact</h2>
        <p className="mt-2 text-muted-foreground">
          Retours, corrections, propositions de calibration :{" "}
          <a className="underline underline-offset-2" href="mailto:contact@netfrontalier.example">
            contact@netfrontalier.example
          </a>
        </p>
      </section>
    </SiteShell>
  );
}
