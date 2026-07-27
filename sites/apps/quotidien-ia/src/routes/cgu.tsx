import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, ToFill } from "@/components/legal-layout";

export const Route = createFileRoute("/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions générales d'utilisation — Quotidien IA" },
      { name: "description", content: "Conditions générales d'utilisation et d'abonnement de Quotidien IA." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: Cgu,
});

function Cgu() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" updatedAt="21 juin 2026">
      <p>
        Les présentes conditions générales (les « CGU ») régissent l'accès et l'utilisation de la plateforme
        Quotidien IA. En créant un compte ou en utilisant le service, vous acceptez sans réserve les présentes CGU.
      </p>

      <LegalSection n="1" title="Objet du service">
        <p>
          Quotidien IA est une plateforme modulaire d'aide à l'organisation du quotidien (finances, productivité,
          événements, démarches, voyage, veille) intégrant des outils de simulation et un assistant fondé sur
          l'intelligence artificielle. Les contenus produits sont fournis à titre <strong>indicatif</strong> et ne
          constituent pas un conseil professionnel personnalisé.
        </p>
      </LegalSection>

      <LegalSection n="2" title="Compte utilisateur">
        <ul className="list-disc space-y-1 pl-5">
          <li>La création d'un compte requiert une adresse e-mail valide ou une connexion via un fournisseur tiers.</li>
          <li>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité sur votre compte.</li>
          <li>Vous vous engagez à fournir des informations exactes et à les tenir à jour.</li>
          <li>L'accès est réservé aux personnes majeures (18 ans et plus).</li>
        </ul>
      </LegalSection>

      <LegalSection n="3" title="Abonnement, prix et paiement">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Le service est proposé par modules, avec une tarification mensuelle ou annuelle détaillée lors de la
            souscription. Une période d'essai peut être proposée.
          </li>
          <li>
            Les modifications d'abonnement prennent effet au 1<sup>er</sup> du mois suivant la demande.
          </li>
          <li>
            Le moyen de paiement (Stripe) sera activé ultérieurement ; jusque-là, l'accès aux modules souscrits
            demeure gratuit. Les conditions de facturation seront précisées avant tout prélèvement.
          </li>
          <li>
            Droit de rétractation : conformément au Code de la consommation, vous disposez d'un délai de 14 jours,
            sauf renoncement exprès pour exécution immédiate du service numérique. <ToFill>modalités de
            rétractation et de remboursement</ToFill>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n="4" title="Programme de parrainage">
        <p>
          Le programme de parrainage permet d'obtenir des avantages en invitant de nouveaux utilisateurs. Vous vous
          engagez à n'inviter que des personnes ayant consenti à être contactées. Tout abus (création de faux
          comptes, parrainages frauduleux) entraîne l'annulation des avantages et, le cas échéant, la suspension du
          compte. <ToFill>détail des récompenses et conditions du parrainage</ToFill>.
        </p>
      </LegalSection>

      <LegalSection n="5" title="Utilisation de l'assistant IA">
        <ul className="list-disc space-y-1 pl-5">
          <li>Les réponses de l'IA sont générées automatiquement et peuvent être inexactes ou incomplètes.</li>
          <li>Vos saisies sont transmises à un modèle tiers (Google Gemini) — voir la{" "}
            <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
          </li>
          <li>Vous vous interdisez d'y inclure des données bancaires complètes ou des données sensibles de tiers.</li>
          <li>Vous ne devez pas utiliser le service à des fins illicites, trompeuses ou portant atteinte aux droits d'autrui.</li>
        </ul>
      </LegalSection>

      <LegalSection n="6" title="Limitation de responsabilité">
        <p>
          Le service est fourni « en l'état ». L'éditeur ne garantit pas l'absence d'erreurs ni l'adéquation des
          résultats à un usage particulier, et ne saurait être tenu responsable des décisions prises sur la base des
          informations fournies. La responsabilité de l'éditeur est, en tout état de cause, limitée au montant des
          sommes effectivement versées au titre de l'abonnement sur les 12 derniers mois.
        </p>
      </LegalSection>

      <LegalSection n="7" title="Disponibilité et évolution">
        <p>
          L'éditeur peut faire évoluer, suspendre ou interrompre tout ou partie du service, et modifier les présentes
          CGU. En cas de modification substantielle, les utilisateurs seront informés. La poursuite de l'utilisation
          vaut acceptation des CGU mises à jour.
        </p>
      </LegalSection>

      <LegalSection n="8" title="Résiliation">
        <p>
          Vous pouvez résilier à tout moment en supprimant votre compte depuis la page Paramètres. L'éditeur peut
          suspendre ou résilier un compte en cas de manquement aux présentes CGU.
        </p>
      </LegalSection>

      <LegalSection n="9" title="Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au <strong>droit suisse</strong>, lieu du siège de l'éditeur. À défaut de
          résolution amiable, compétence est attribuée aux tribunaux du siège de l'éditeur (<ToFill>for /
          canton compétent</ToFill>).
        </p>
        <p>
          Cette clause ne prive pas le consommateur résidant dans l'Union européenne des dispositions impératives
          plus protectrices de la loi de son pays de résidence. Les consommateurs français peuvent recourir
          gratuitement à un médiateur de la consommation et, le cas échéant, à la plateforme européenne de
          règlement en ligne des litiges (RLL).
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
