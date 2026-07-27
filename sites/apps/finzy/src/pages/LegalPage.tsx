import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Page légale unique regroupant Mentions légales, CGU/CGV,
 * Politique de confidentialité (RGPD + nLPD suisse) et Politique cookies.
 *
 * ⚠️ Les zones [À COMPLÉTER] doivent être renseignées par l'éditeur
 * (raison sociale, IDE/numéro RC suisse, adresse, hébergeur, DPO...).
 */
export default function LegalPage() {
  const [tab, setTab] = useState('mentions');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <SEO title="Informations légales" description="Mentions légales, conditions générales et politique de confidentialité de Finzy." path="/legal" />

      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/"><ArrowLeft className="h-4 w-4" /> Retour</Link>
      </Button>

      <h1 className="text-2xl font-bold">Informations légales</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="cgu">CGU/CGV</TabsTrigger>
          <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
          <TabsTrigger value="cookies">Cookies</TabsTrigger>
        </TabsList>

        {/* ─────────── MENTIONS LÉGALES ─────────── */}
        <TabsContent value="mentions" className="prose-sm space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">Mentions légales</h2>
          <p><strong>Éditeur :</strong> [À COMPLÉTER — raison sociale, ex. Finzy Sàrl]</p>
          <p><strong>Forme juridique :</strong> [À COMPLÉTER — ex. Société à responsabilité limitée de droit suisse]</p>
          <p><strong>Siège social :</strong> [À COMPLÉTER — adresse complète]</p>
          <p><strong>N° d'identification (IDE) :</strong> [À COMPLÉTER — ex. CHE-123.456.789]</p>
          <p><strong>Inscription au Registre du commerce :</strong> [À COMPLÉTER — canton et n° RC]</p>
          <p><strong>Représentant légal :</strong> [À COMPLÉTER]</p>
          <p><strong>Contact :</strong> [À COMPLÉTER — email et téléphone]</p>
          <p><strong>Hébergement & traitement des données :</strong> Supabase (infrastructure cloud).
            La région d'hébergement des données doit être documentée ci-après (voir Confidentialité).</p>
          <p className="text-muted-foreground">
            Finzy est un outil d'éducation et de simulation financière. Finzy n'est pas un établissement
            financier, ne fournit pas de conseil en investissement réglementé au sens de la LSFin (CH) ou
            du Code monétaire et financier (FR), et n'est pas soumis à la surveillance de la FINMA ou de l'AMF.
          </p>
        </TabsContent>

        {/* ─────────── CGU / CGV ─────────── */}
        <TabsContent value="cgu" className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">Conditions Générales d'Utilisation et de Vente</h2>
          <p><strong>1. Objet.</strong> Les présentes conditions régissent l'accès et l'utilisation de
            l'application Finzy, y compris ses fonctionnalités gratuites et l'abonnement Premium.</p>
          <p><strong>2. Compte.</strong> L'utilisateur s'engage à fournir des informations exactes et à
            préserver la confidentialité de ses identifiants. Âge minimum : 16 ans (ou âge de consentement
            numérique applicable dans le pays de résidence).</p>
          <p><strong>3. Abonnement Premium.</strong> L'abonnement (mensuel ou annuel) est facturé via
            Stripe. Il est reconduit tacitement et résiliable à tout moment ; la résiliation prend effet
            à la fin de la période en cours. Aucun remboursement au prorata sauf disposition légale impérative.</p>
          <p><strong>4. Droit de rétractation (clients FR/UE).</strong> Pour les contenus numériques,
            l'utilisateur reconnaît renoncer à son droit de rétractation de 14 jours dès l'accès immédiat
            au service, conformément à l'art. L221-28 du Code de la consommation.</p>
          <p><strong>5. Absence de conseil financier.</strong> Les simulations, scores et contenus sont
            fournis à titre informatif et pédagogique. Ils ne constituent pas un conseil personnalisé.
            L'utilisateur reste seul responsable de ses décisions.</p>
          <p><strong>6. Responsabilité.</strong> Finzy ne saurait être tenu responsable des pertes
            financières résultant de l'utilisation des outils. Les calculs reposent sur des barèmes
            indicatifs susceptibles d'évoluer.</p>
          <p><strong>7. Droit applicable.</strong> [À COMPLÉTER — droit suisse, for au siège de l'éditeur,
            sous réserve des dispositions impératives protégeant les consommateurs FR/UE].</p>
        </TabsContent>

        {/* ─────────── CONFIDENTIALITÉ ─────────── */}
        <TabsContent value="privacy" className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">Politique de confidentialité (RGPD &amp; nLPD)</h2>
          <p>Finzy traite des données à caractère personnel dans le respect du <strong>RGPD</strong>
            (Règlement UE 2016/679) pour les clients de l'Union européenne et de la <strong>nLPD</strong>
            (nouvelle Loi fédérale suisse sur la protection des données) pour les clients suisses.</p>
          <p><strong>Responsable du traitement :</strong> [À COMPLÉTER — éditeur]. <strong>Contact DPO/PrPD :</strong> [À COMPLÉTER].</p>
          <p><strong>Données collectées :</strong> identifiant (pseudo), email facultatif, données
            financières saisies (revenus, dépenses, patrimoine, projets), progression pédagogique,
            conversations avec FinzyBot, données de paiement (gérées par Stripe, non stockées par Finzy).</p>
          <p><strong>Finalités :</strong> fourniture du service, gamification, personnalisation,
            assistance IA, facturation de l'abonnement.</p>
          <p><strong>Base légale :</strong> exécution du contrat (CGU), consentement (FinzyBot, cookies
            non essentiels), intérêt légitime (sécurité).</p>
          <p><strong>Hébergement et transferts :</strong> les données sont hébergées chez Supabase.
            [À COMPLÉTER — préciser la région : idéalement UE (Francfort) ou Suisse. En cas de transfert
            hors UE/CH, mentionner les garanties : clauses contractuelles types, etc.]</p>
          <p><strong>Sous-traitants :</strong> Supabase (base de données et authentification),
            Stripe (paiement), Lovable AI Gateway / Google (FinzyBot). [À COMPLÉTER — DPA signés].</p>
          <p><strong>Durée de conservation :</strong> les données sont conservées tant que le compte est
            actif, puis supprimées dans un délai de [À COMPLÉTER, ex. 30 jours] après suppression du compte.</p>
          <p><strong>Vos droits :</strong> accès, rectification, effacement, portabilité, limitation,
            opposition. Un export complet de vos données est disponible dans Profil &gt; Sécurité.
            Réclamation possible auprès de la CNIL (FR) ou du PFPDT (CH).</p>
        </TabsContent>

        {/* ─────────── COOKIES ─────────── */}
        <TabsContent value="cookies" className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">Politique relative aux cookies</h2>
          <p>Finzy utilise des cookies et technologies de stockage local strictement nécessaires au
            fonctionnement du service :</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Session d'authentification</strong> (Supabase) — essentiel, conservation de la connexion.</li>
            <li><strong>Préférences</strong> (thème clair/sombre, marché) — confort d'utilisation.</li>
          </ul>
          <p>Aucun cookie publicitaire ou de pistage tiers n'est utilisé à ce jour. Si une solution
            d'analyse (ex. PostHog) est activée, elle nécessitera votre consentement préalable et sera
            documentée ici.</p>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground border-t pt-4">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}. Ce document est un modèle à faire
        valider par un conseil juridique avant mise en production.
      </p>
    </div>
  );
}
