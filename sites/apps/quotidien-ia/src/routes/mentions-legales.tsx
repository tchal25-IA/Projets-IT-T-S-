import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection, ToFill } from "@/components/legal-layout";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — Quotidien IA" },
      { name: "description", content: "Mentions légales de la plateforme Quotidien IA (éditeur, hébergeur, contact)." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="21 juin 2026">
      <p>
        Le site « Quotidien IA » est édité par une société suisse et proposé en France et en Suisse. Les présentes
        mentions identifient l'éditeur et l'hébergeur, dans un souci de transparence et conformément aux obligations
        applicables (RGPD pour les utilisateurs de l'Union européenne, nLPD pour la Suisse).
      </p>

      <LegalSection n="1" title="Éditeur du site">
        <ul className="list-disc space-y-1 pl-5">
          <li>Dénomination sociale : <ToFill>raison sociale de la société suisse</ToFill></li>
          <li>Forme juridique : <ToFill>Sàrl / SA / raison individuelle…</ToFill></li>
          <li>Capital social (le cas échéant) : <ToFill>montant en CHF</ToFill></li>
          <li>Siège social : <ToFill>adresse postale complète en Suisse</ToFill></li>
          <li>N° d'identification des entreprises (IDE/UID) : <ToFill>CHE-xxx.xxx.xxx</ToFill></li>
          <li>Inscription au registre du commerce : <ToFill>canton et n° d'inscription</ToFill></li>
          <li>N° TVA (le cas échéant) : <ToFill>CHE-xxx.xxx.xxx TVA</ToFill></li>
          <li>Adresse e-mail de contact : <ToFill>email de contact</ToFill></li>
          <li>Téléphone : <ToFill>numéro</ToFill></li>
          <li>Responsable de la publication : <ToFill>nom du responsable</ToFill></li>
        </ul>
      </LegalSection>

      <LegalSection n="1 bis" title="Représentant dans l'Union européenne (art. 27 RGPD)">
        <p>
          L'éditeur étant établi hors de l'Union européenne tout en proposant son service à des résidents de l'UE
          (notamment en France), il désigne un représentant dans l'UE au sens de l'article 27 du RGPD :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Représentant UE : <ToFill>nom / société du représentant dans l'UE</ToFill></li>
          <li>Adresse dans l'UE : <ToFill>adresse postale dans un État membre</ToFill></li>
          <li>Contact : <ToFill>email du représentant UE</ToFill></li>
        </ul>
      </LegalSection>

      <LegalSection n="2" title="Hébergement">
        <p>L'application et ses données sont hébergées par les prestataires suivants :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Hébergement applicatif</strong> — Cloudflare, Inc., 101 Townsend Street, San Francisco,
            CA 94107, États-Unis (réseau et exécution des fonctions serveur).
          </li>
          <li>
            <strong>Base de données et authentification</strong> — Supabase, Inc., 970 Toa Payoh North,
            Singapour / infrastructure cloud. Région d'hébergement des données :{" "}
            <ToFill>région Supabase, ex. eu-central-1 (UE) — à vérifier dans votre tableau de bord</ToFill>.
          </li>
          <li>
            <strong>Passerelle IA</strong> — Lovable (passerelle vers le modèle Google Gemini). Voir la{" "}
            politique de confidentialité pour le détail des transferts.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n="3" title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus du site (textes, interfaces, logo, charte graphique, code source) est protégé
          par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle,
          sans autorisation écrite de l'éditeur, est interdite. Les marques et logos de tiers cités (outils
          partenaires, sources officielles) demeurent la propriété de leurs détenteurs respectifs.
        </p>
      </LegalSection>

      <LegalSection n="4" title="Nature des services — avertissement">
        <p>
          Quotidien IA est une plateforme d'aide à l'organisation et de simulation à caractère{" "}
          <strong>indicatif</strong>. Elle ne constitue pas un cabinet de conseil fiscal, juridique, comptable ou
          financier, et ne délivre aucun conseil personnalisé au sens réglementaire. Les calculs, simulations et
          réponses générées par l'intelligence artificielle peuvent comporter des erreurs ou des simplifications.
          Pour toute décision engageant votre responsabilité, rapprochez-vous des sources officielles et, le cas
          échéant, d'un professionnel habilité.
        </p>
      </LegalSection>

      <LegalSection n="5" title="Responsabilité">
        <p>
          L'éditeur s'efforce d'assurer l'exactitude des informations diffusées mais ne saurait être tenu
          responsable des erreurs, omissions, ni des conséquences de l'utilisation des informations et outils mis
          à disposition. L'utilisateur reste seul responsable de l'usage qu'il fait des résultats fournis.
        </p>
      </LegalSection>

      <LegalSection n="6" title="Contact">
        <p>
          Pour toute question relative au site ou aux présentes mentions : <ToFill>email de contact</ToFill>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
