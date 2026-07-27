import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mentions")({
  head: () => ({
    meta: [
      { title: "Mentions & disclaimer — Conformia" },
      {
        name: "description",
        content: "Mentions légales et disclaimer de Conformia, auto-diagnostic RGPD & nLPD.",
      },
      { property: "og:title", content: "Mentions & disclaimer — Conformia" },
      { property: "og:description", content: "Informations légales et limites d'usage de Conformia." },
    ],
  }),
  component: Mentions,
});

function Mentions() {
  return (
    <div className="container-tight py-16">
      <h1 className="brand text-4xl text-primary">Mentions & disclaimer</h1>

      <section className="prose mt-8 max-w-none text-foreground">
        <h2 className="brand mt-8 text-2xl text-primary">Nature du service</h2>
        <p className="mt-2 text-muted-foreground">
          Conformia est un outil d'<strong className="text-foreground">auto-évaluation</strong> destiné aux
          PME, indépendants et associations souhaitant estimer leur niveau de conformité au RGPD (règlement
          UE 2016/679) et à la nLPD suisse (en vigueur depuis le 1<sup>er</sup> septembre 2023).
        </p>

        <h2 className="brand mt-8 text-2xl text-primary">Pas de conseil juridique</h2>
        <p className="mt-2 text-muted-foreground">
          Les scores, recommandations et actions générés par Conformia sont fournis à titre pédagogique.
          Ils ne constituent en aucun cas un conseil juridique, un audit certifiant, ni une garantie de
          conformité. Pour toute situation à risque (DPIA, incident de sécurité, contrôle CNIL/PFPDT,
          contentieux), il est indispensable de consulter un avocat, un DPO/DPD ou un cabinet spécialisé.
        </p>

        <h2 className="brand mt-8 text-2xl text-primary">Données saisies</h2>
        <p className="mt-2 text-muted-foreground">
          Les réponses au questionnaire sont enregistrées <strong className="text-foreground">localement
          dans votre navigateur</strong> (localStorage). Elles ne sont pas transmises à Conformia. Vous
          pouvez les supprimer à tout moment en vidant le stockage du site.
        </p>

        <h2 className="brand mt-8 text-2xl text-primary">Limitation de responsabilité</h2>
        <p className="mt-2 text-muted-foreground">
          L'éditeur ne saurait être tenu responsable des décisions prises sur la seule base des résultats
          fournis par l'outil, ni des évolutions réglementaires postérieures à la version consultée.
        </p>

        <h2 className="brand mt-8 text-2xl text-primary">Sources</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
          <li>Règlement (UE) 2016/679 — RGPD</li>
          <li>Loi fédérale sur la protection des données (LPD révisée), Suisse</li>
          <li>Recommandations CNIL (France) et PFPDT (Suisse)</li>
        </ul>
      </section>
    </div>
  );
}
