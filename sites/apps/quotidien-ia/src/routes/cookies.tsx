import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Politique de cookies — Quotidien IA" },
      { name: "description", content: "Cookies et stockage local utilisés par Quotidien IA et gestion du consentement." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: Cookies,
});

function Cookies() {
  return (
    <LegalLayout title="Politique de cookies & stockage local" updatedAt="21 juin 2026">
      <p>
        Quotidien IA limite l'usage des traceurs au strict nécessaire au fonctionnement du service. Nous n'utilisons
        <strong> aucun cookie publicitaire ni outil de suivi marketing</strong> (pas de Google Analytics, pas de pixel
        tiers).
      </p>

      <LegalSection n="1" title="Cookies strictement nécessaires">
        <p>
          Ces traceurs sont indispensables au fonctionnement et ne requièrent pas de consentement (art. 82 loi
          Informatique et Libertés) :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Authentification (Supabase)</strong> — maintient votre session connectée. Déposé uniquement après
            connexion.
          </li>
          <li>
            <strong>Connexion via Google</strong> — si vous choisissez ce mode, Google peut déposer ses propres
            cookies lors de la phase d'authentification.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n="2" title="Stockage local (localStorage)">
        <p>
          L'application enregistre certaines informations directement dans votre navigateur, sans cookie ni
          transmission à un serveur tiers :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>qia:theme</code> — préférence de thème clair/sombre (essentiel).</li>
          <li><code>qia:consent</code> — mémorise votre choix de consentement.</li>
          <li><code>qia:profile</code>, <code>qia:tasks</code>, <code>qia:events</code>, <code>qia:business</code>,{" "}
            <code>qia:tm:*</code> — vos contenus de travail, stockés localement.</li>
          <li><code>qia:agentThreads</code> — historique local de vos échanges avec l'assistant.</li>
        </ul>
        <p>
          Ces données restent sur votre appareil. Vous pouvez les effacer à tout moment depuis la page{" "}
          <Link to="/parametres" className="text-primary hover:underline">Paramètres</Link> ou en vidant le stockage
          de votre navigateur.
        </p>
      </LegalSection>

      <LegalSection n="3" title="Gestion du consentement">
        <p>
          Lors de votre première visite, un bandeau vous informe de l'utilisation du stockage local et des transferts
          liés à l'assistant IA. Votre choix est enregistré dans <code>qia:consent</code>. Vous pouvez le modifier en
          effaçant ce stockage depuis la page Paramètres.
        </p>
      </LegalSection>

      <LegalSection n="4" title="En savoir plus">
        <p>
          Pour le détail des traitements de données, consultez notre{" "}
          <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
