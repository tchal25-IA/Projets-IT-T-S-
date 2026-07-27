import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, LegalSection, ToFill } from "@/components/legal-layout";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Quotidien IA" },
      { name: "description", content: "Comment Quotidien IA collecte, utilise et protège vos données personnelles (RGPD)." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="21 juin 2026">
      <p>
        Quotidien IA est édité par une société suisse et proposé en France et en Suisse. La présente politique décrit
        le traitement de vos données personnelles au regard de la <strong>nouvelle Loi fédérale suisse sur la
        protection des données (nLPD)</strong> et, pour les utilisateurs de l'Union européenne, du{" "}
        <strong>Règlement (UE) 2016/679 (RGPD)</strong> et de la loi française « Informatique et Libertés ».
      </p>

      <LegalSection n="1" title="Responsable du traitement et représentant UE">
        <p>
          Le responsable du traitement est <ToFill>raison sociale de la société suisse</ToFill> (siège en Suisse),
          joignable à l'adresse <ToFill>email de contact / délégué à la protection des données</ToFill>.
        </p>
        <p>
          Conformément à l'article 27 du RGPD, l'éditeur (établi hors UE) a désigné un représentant dans l'Union
          européenne : <ToFill>nom et adresse UE du représentant</ToFill>. Voir aussi nos{" "}
          <Link to="/mentions-legales" className="text-primary hover:underline">mentions légales</Link>.
        </p>
      </LegalSection>

      <LegalSection n="2" title="Données que nous collectons">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b text-left text-foreground">
              <th className="py-2 pr-3">Donnée</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2">Finalité</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-b">
              <td className="py-2 pr-3">E-mail, mot de passe (ou identité Google)</td>
              <td className="py-2 pr-3">Inscription / connexion</td>
              <td className="py-2">Création et sécurisation du compte</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-3">Nom affiché, pays de travail</td>
              <td className="py-2 pr-3">Profil</td>
              <td className="py-2">Personnalisation des outils (ex. fiscalité FR/CH)</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-3">Tâches, événements, documents, entrées budget/finance</td>
              <td className="py-2 pr-3">Saisie utilisateur</td>
              <td className="py-2">Fourniture des fonctionnalités</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-3">Abonnement, parrainage</td>
              <td className="py-2 pr-3">Souscription</td>
              <td className="py-2">Gestion du service et facturation</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-3">Texte saisi adressé à l'assistant IA</td>
              <td className="py-2 pr-3">Modules IA</td>
              <td className="py-2">Génération de réponses (voir section 5)</td>
            </tr>
          </tbody>
        </table>
        <p>
          Nous vous recommandons de <strong>ne jamais saisir de données bancaires complètes</strong> (numéro de
          carte, identifiants bancaires) ni de données sensibles non nécessaires.
        </p>
      </LegalSection>

      <LegalSection n="3" title="Bases légales (art. 6 RGPD)">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Exécution du contrat</strong> : gestion du compte, des abonnements et des fonctionnalités.</li>
          <li><strong>Consentement</strong> : envoi de vos saisies à l'assistant IA, dépôt de traceurs non essentiels.</li>
          <li><strong>Intérêt légitime</strong> : sécurité, prévention de la fraude, amélioration du service.</li>
          <li><strong>Obligation légale</strong> : conservation des pièces de facturation.</li>
        </ul>
      </LegalSection>

      <LegalSection n="4" title="Stockage et hébergement">
        <p>
          Vos données de compte sont stockées chez <strong>Supabase</strong> (base PostgreSQL et stockage de
          fichiers), région <ToFill>région Supabase — privilégiez une région UE ou Suisse</ToFill>. La Suisse
          bénéficie d'une décision d'adéquation de la Commission européenne : les transferts de données entre l'UE
          et la Suisse sont donc encadrés et reconnus comme offrant un niveau de protection adéquat. Certaines
          données (préférences, et temporairement certaines tâches/événements en cours de migration) sont stockées{" "}
          <strong>localement dans votre navigateur</strong> (localStorage) et ne sont pas transmises à nos serveurs
          tant que la migration Cloud n'est pas effectuée.
        </p>
      </LegalSection>

      <LegalSection n="5" title="Assistant IA et transferts hors UE">
        <p>
          Lorsque vous utilisez un module d'assistance IA, le texte que vous saisissez est transmis, via la
          passerelle <strong>Lovable</strong>, au modèle <strong>Google Gemini</strong> afin de générer une
          réponse. Ce traitement peut impliquer un <strong>transfert de données hors de l'Union européenne</strong>{" "}
          (notamment vers les États-Unis), encadré par les clauses contractuelles types de la Commission
          européenne.
        </p>
        <p>
          Ce transfert n'a lieu qu'avec votre <strong>consentement</strong>, recueilli avant le premier envoi.
          Nous vous invitons à ne pas inclure d'informations directement identifiantes ou confidentielles dans vos
          requêtes IA.
        </p>
      </LegalSection>

      <LegalSection n="6" title="Durée de conservation">
        <p>
          Vos données sont conservées tant que votre compte est actif. À la suppression du compte, elles sont
          effacées (suppression en cascade des tâches, événements, finances, documents, abonnement et parrainage),
          sous réserve des durées légales de conservation des documents comptables et de facturation
          (généralement 10 ans). Les comptes inactifs depuis <ToFill>durée, ex. 24 mois</ToFill> peuvent faire
          l'objet d'une suppression après information.
        </p>
      </LegalSection>

      <LegalSection n="7" title="Vos droits (art. 15 à 22 RGPD)">
        <p>Vous disposez des droits suivants :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Accès et portabilité</strong> : exporter vos données depuis la page Paramètres.</li>
          <li><strong>Rectification</strong> : modifier votre profil à tout moment.</li>
          <li><strong>Effacement</strong> : supprimer votre compte et vos données depuis la page Paramètres.</li>
          <li><strong>Opposition et limitation</strong> : nous écrire pour restreindre certains traitements.</li>
          <li><strong>Retrait du consentement</strong> : à tout moment, sans effet rétroactif.</li>
        </ul>
        <p>
          Pour exercer ces droits : <ToFill>email de contact / DPO</ToFill>. Vous pouvez également introduire une
          réclamation auprès de l'autorité de contrôle compétente :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            En Suisse : le Préposé fédéral à la protection des données et à la transparence (PFPDT —{" "}
            <a href="https://www.edoeb.admin.ch" target="_blank" rel="noreferrer" className="text-primary hover:underline">edoeb.admin.ch</a>
            ).
          </li>
          <li>
            Dans l'Union européenne / en France : la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-primary hover:underline">cnil.fr</a>
            ) ou l'autorité de votre pays de résidence.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n="8" title="Sécurité">
        <p>
          L'accès à vos données est protégé par authentification et par des règles de sécurité au niveau des lignes
          de la base (Row Level Security) garantissant que chaque utilisateur n'accède qu'à ses propres données.
          Les échanges sont chiffrés (HTTPS).
        </p>
      </LegalSection>

      <LegalSection n="9" title="Cookies et traceurs">
        <p>
          Voir notre <Link to="/cookies" className="text-primary hover:underline">politique de cookies</Link>{" "}
          pour le détail des traceurs utilisés et la gestion de votre consentement.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
