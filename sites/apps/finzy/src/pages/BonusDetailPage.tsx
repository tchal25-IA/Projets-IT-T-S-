import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface PackContent {
  title: string;
  readingTime: string;
  sections: { heading: string; body: string }[];
}

const packData: Record<string, { emoji: string; name: string; desc: string; content: PackContent[] }> = {
  // ═══════════════════════ FR PACKS ═══════════════════════
  'info-plus': {
    emoji: '📚', name: 'Pack Info+', desc: 'Tout savoir sur les produits d\'épargne bancaires',
    content: [
      {
        title: 'Livret A & LDDS', readingTime: '4 min',
        sections: [
          { heading: 'Qu\'est-ce que le Livret A ?', body: 'Le Livret A est le produit d\'épargne réglementé le plus populaire en France. Il offre un taux garanti par l\'État (actuellement 2,4%), une disponibilité immédiate des fonds et une exonération totale d\'impôts et de prélèvements sociaux. Le plafond est fixé à 22 950 €.' },
          { heading: 'LDDS : le complément idéal', body: 'Le Livret de Développement Durable et Solidaire (LDDS) fonctionne comme le Livret A avec un plafond de 12 000 €. Il finance des projets liés à l\'économie sociale et solidaire. Même taux, même fiscalité avantageuse.' },
          { heading: 'Stratégie recommandée', body: 'Remplis d\'abord ton Livret A, puis le LDDS. Ces deux livrets constituent la base de ton épargne de précaution. Objectif : 3 à 6 mois de dépenses courantes en épargne de sécurité.' },
        ],
      },
      {
        title: 'LEP – Livret d\'Épargne Populaire', readingTime: '3 min',
        sections: [
          { heading: 'Le livret le mieux rémunéré', body: 'Le LEP offre un taux supérieur au Livret A (actuellement 3,5%) et est réservé aux foyers modestes. Plafond : 10 000 €. Condition : revenu fiscal de référence inférieur au seuil fixé annuellement.' },
          { heading: 'Comment en bénéficier ?', body: 'Présente ton avis d\'imposition à ta banque. Si tu es éligible, c\'est le premier livret à remplir avant le Livret A grâce à son taux plus élevé.' },
        ],
      },
      {
        title: 'Assurance Vie – Fonds euros', readingTime: '5 min',
        sections: [
          { heading: 'Le couteau suisse de l\'épargne', body: 'L\'assurance vie en fonds euros offre une garantie en capital et un rendement supérieur aux livrets (entre 2% et 4% selon les contrats). Après 8 ans, tu bénéficies d\'un abattement fiscal de 4 600 € (9 200 € en couple) sur les plus-values.' },
          { heading: 'Choisir le bon contrat', body: 'Privilégie les contrats en ligne avec des frais de gestion bas (< 0,6%), sans frais d\'entrée ni de versement. Compare les rendements des 3 dernières années et vérifie la solidité de l\'assureur.' },
          { heading: 'Fonds euros vs Unités de compte', body: 'Le fonds euros est garanti mais offre un rendement limité. Les unités de compte (UC) offrent un potentiel de rendement supérieur mais sans garantie en capital. Un mix des deux permet d\'optimiser le couple rendement/risque.' },
        ],
      },
      {
        title: 'Comptes à terme', readingTime: '3 min',
        sections: [
          { heading: 'Bloquer pour mieux gagner', body: 'Un compte à terme (CAT) offre un taux garanti en échange du blocage de tes fonds pendant une durée définie (3 mois à 5 ans). Plus la durée est longue, plus le taux est élevé. Idéal pour un projet à horizon fixe.' },
          { heading: 'Quand utiliser un CAT ?', body: 'Utilise-le quand tu as un excédent d\'épargne au-delà de ton matelas de sécurité et un projet à moyen terme (achat immo, voyage). Attention : retrait anticipé = pénalité sur le taux.' },
        ],
      },
      {
        title: 'PEL & CEL', readingTime: '4 min',
        sections: [
          { heading: 'PEL : épargne logement à long terme', body: 'Le Plan d\'Épargne Logement offre un taux fixé à l\'ouverture (actuellement 1,75% pour les nouveaux PEL). Durée min : 4 ans. Il ouvre droit à un prêt immobilier à taux préférentiel. Plafond : 61 200 €.' },
          { heading: 'CEL : plus souple mais moins rémunérateur', body: 'Le Compte Épargne Logement est plus flexible (retraits libres) mais offre un taux plus bas. Plafond : 15 300 €. Il peut être combiné avec un PEL pour maximiser les droits à prêt.' },
          { heading: 'Faut-il encore ouvrir un PEL ?', body: 'Avec les taux actuels, le PEL est surtout intéressant pour verrouiller un taux de prêt. Si tu n\'as pas de projet immo, privilégie l\'assurance vie ou le PEA.' },
        ],
      },
    ],
  },
  'immo': {
    emoji: '🏠', name: 'Pack Immo', desc: 'Investissement immobilier de A à Z',
    content: [
      {
        title: 'Capacité d\'emprunt', readingTime: '4 min',
        sections: [
          { heading: 'Calculer ta capacité', body: 'Ta capacité d\'emprunt dépend de tes revenus, charges et du taux d\'endettement maximal (35% en France). Formule simplifiée : (revenus nets × 0.35 - charges) × durée du prêt. Utilise notre simulateur crédit pour un calcul précis.' },
          { heading: 'Optimiser son dossier', body: 'Stabilité professionnelle (CDI, ancienneté), apport personnel (10-20%), absence de crédits conso en cours, et une gestion bancaire saine (pas de découverts) sont les clés d\'un bon dossier.' },
        ],
      },
      {
        title: 'Rendement locatif brut & net', readingTime: '5 min',
        sections: [
          { heading: 'Rendement brut', body: 'Rendement brut = (Loyer annuel / Prix d\'achat) × 100. C\'est un premier filtre rapide. En dessous de 5% brut dans une grande ville, la rentabilité nette sera souvent insuffisante.' },
          { heading: 'Rendement net de charges', body: 'Déduis les charges de copropriété, taxe foncière, assurance PNO, frais de gestion locative, vacance locative (1 mois/an en moyenne). Le rendement net est souvent 1,5 à 2 points en dessous du brut.' },
          { heading: 'Rendement net-net (après impôts)', body: 'Après imposition des revenus fonciers (TMI + prélèvements sociaux 17,2% au régime réel, ou micro-foncier avec abattement 30%), c\'est le vrai indicateur de performance.' },
        ],
      },
      {
        title: 'SCPI & Pierre-papier', readingTime: '5 min',
        sections: [
          { heading: 'Qu\'est-ce qu\'une SCPI ?', body: 'Une Société Civile de Placement Immobilier permet d\'investir dans l\'immobilier à partir de quelques centaines d\'euros. Tu perçois des revenus locatifs proportionnels à ton investissement, sans gérer de bien.' },
          { heading: 'Types de SCPI', body: 'SCPI de rendement (bureaux, commerces : 4-6%/an), SCPI fiscales (Pinel, Malraux : avantage fiscal), SCPI de plus-value (revalorisation du patrimoine). Diversifie entre plusieurs SCPI.' },
          { heading: 'Avantages et inconvénients', body: 'Avantages : diversification, pas de gestion, ticket d\'entrée bas. Inconvénients : frais d\'entrée élevés (8-12%), liquidité limitée, fiscalité des revenus fonciers.' },
        ],
      },
      {
        title: 'Pinel & Denormandie', readingTime: '4 min',
        sections: [
          { heading: 'Loi Pinel', body: 'Réduction d\'impôt de 9% à 14% du prix du bien neuf (plafond 300 000 €) en échange d\'un engagement de location de 6 à 12 ans. Attention : le dispositif se réduit progressivement et prend fin.' },
          { heading: 'Denormandie', body: 'Version "ancien avec travaux" du Pinel. Mêmes avantages fiscaux mais pour des biens anciens nécessitant des travaux représentant au moins 25% du coût total. Cible les centres-villes dégradés.' },
        ],
      },
      {
        title: 'Plus-value immobilière', readingTime: '3 min',
        sections: [
          { heading: 'Calcul de la plus-value', body: 'Plus-value = Prix de vente - Prix d\'achat (majoré des frais d\'acquisition et travaux). La résidence principale est totalement exonérée. Pour les autres biens : abattements progressifs à partir de la 6e année.' },
          { heading: 'Exonération totale', body: 'Exonération complète d\'impôt sur la plus-value après 22 ans de détention, et de prélèvements sociaux après 30 ans. Stratégie : conserver ses biens locatifs sur le long terme.' },
        ],
      },
    ],
  },
  'defiscalisation': {
    emoji: '🧾', name: 'Pack Défiscalisation', desc: 'Optimise ta fiscalité intelligemment',
    content: [
      {
        title: 'PER individuel', readingTime: '5 min',
        sections: [
          { heading: 'Le PER en bref', body: 'Le Plan d\'Épargne Retraite permet de déduire tes versements de ton revenu imposable. Idéal si ta TMI est élevée (30% ou plus). Les fonds sont bloqués jusqu\'à la retraite sauf cas de déblocage anticipé (achat résidence principale, accident de la vie).' },
          { heading: 'Combien verser ?', body: 'Plafond de déduction : 10% des revenus professionnels N-1 (min 4 399 €, max 35 194 € en 2024). Vérifie ton plafond disponible sur ton avis d\'imposition. Utilise notre simulateur FIRE pour projeter l\'impact.' },
          { heading: 'Sortie : capital ou rente ?', body: 'À la retraite, tu peux sortir en capital (imposition au barème, PFU sur les gains), en rente viagère (imposée comme pension), ou un mix des deux. Le capital est souvent plus avantageux si ta TMI baisse à la retraite.' },
        ],
      },
      {
        title: 'Girardin industriel', readingTime: '4 min',
        sections: [
          { heading: 'Réduction d\'impôt one-shot', body: 'Investis dans du matériel industriel en Outre-mer. Réduction d\'impôt supérieure à l\'investissement (110-120% du montant investi). Effet fiscal immédiat sur l\'impôt de l\'année suivante.' },
          { heading: 'Risques et précautions', body: 'Risque de requalification fiscale si l\'opération n\'est pas conforme. Choisis un opérateur agréé avec un historique solide et une garantie de bonne fin. Fais-toi accompagner par un conseiller.' },
        ],
      },
      {
        title: 'FCPI / FIP', readingTime: '4 min',
        sections: [
          { heading: 'Fonds d\'innovation et de proximité', body: 'Les FCPI investissent dans des PME innovantes, les FIP dans des PME régionales. Réduction d\'IR de 18-25% du montant investi (plafond 12 000 € solo, 24 000 € couple). Durée de blocage : 5-10 ans.' },
          { heading: 'Performance réelle', body: 'Attention : la performance des fonds est souvent décevante. La réduction d\'impôt compense rarement la perte en capital. À réserver aux TMI élevées et en diversification limitée.' },
        ],
      },
      {
        title: 'Dons & mécénat', readingTime: '3 min',
        sections: [
          { heading: 'Dons aux associations', body: 'Réduction d\'IR de 66% du montant donné (75% pour les organismes d\'aide aux personnes en difficulté, plafond 1 000 €). Plafond global : 20% du revenu imposable. Le surplus est reportable sur 5 ans.' },
          { heading: 'Optimisation', body: 'Regroupe tes dons en fin d\'année pour maximiser l\'impact fiscal. Certains dons ouvrent droit à la réduction IFI (75%, plafond 50 000 €). Conserve tous les reçus fiscaux.' },
        ],
      },
      {
        title: 'Stratégies combinées', readingTime: '5 min',
        sections: [
          { heading: 'Empiler les dispositifs', body: 'Le plafonnement global des niches fiscales est de 10 000 €/an (+ 8 000 € pour Girardin/SOFICA). PER, dons et déficit foncier sont hors plafond. Stratégie : PER + dons + un dispositif plafonné.' },
          { heading: 'Exemple concret', body: 'TMI 30%, revenu 60 000 €. PER : 6 000 € versés → 1 800 € d\'économie d\'impôt. Dons : 1 000 € → 750 € de réduction. FCPI : 4 000 € → 1 000 € de réduction. Total : 3 550 € d\'économie pour 11 000 € investis/donnés.' },
        ],
      },
    ],
  },

  // ═══════════════════════ CH PACKS ═══════════════════════
  'epargne-ch': {
    emoji: '🏦', name: 'Pack Épargne Suisse', desc: 'Produits d\'épargne et prévoyance en Suisse',
    content: [
      {
        title: 'Compte épargne & compte privé', readingTime: '4 min',
        sections: [
          { heading: 'Le compte épargne classique', body: 'En Suisse, le compte épargne offre un taux d\'intérêt variable (actuellement 0,5-1,5% selon les banques). Pas de plafond légal, mais les intérêts sont soumis à l\'impôt sur le revenu et à l\'impôt anticipé de 35% (récupérable via la déclaration fiscale).' },
          { heading: 'Compte privé vs compte épargne', body: 'Le compte privé sert aux transactions courantes (salaire, paiements). Le compte épargne offre un meilleur taux mais avec des retraits limités (souvent 3 à 6 par an sans pénalité). Garde 1-2 mois de dépenses sur le privé, le reste en épargne.' },
          { heading: 'Comparaison des banques', body: 'Les banques cantonales offrent souvent de meilleurs taux que les grandes banques (UBS, Credit Suisse). Les banques en ligne (Yuh, neon, Zak) sont compétitives sur les frais. Compare sur Moneyland.ch ou Comparis.ch.' },
        ],
      },
      {
        title: '3e pilier A – Prévoyance liée', readingTime: '5 min',
        sections: [
          { heading: 'Le meilleur outil fiscal suisse', body: 'Le 3e pilier A permet de déduire jusqu\'à 7 056 CHF/an (2024, salariés affiliés LPP) de ton revenu imposable. L\'économie d\'impôt dépend de ton taux marginal : de 20% à 40% selon le canton et le revenu.' },
          { heading: 'Banque ou assurance ?', body: 'Le 3a bancaire offre plus de flexibilité (pas de durée minimale, choix des fonds). Le 3a assurance inclut une couverture risque mais avec des frais plus élevés et moins de souplesse. Privilégie le 3a bancaire pour l\'investissement pur.' },
          { heading: 'Stratégie multi-comptes', body: 'Ouvre plusieurs comptes 3a (jusqu\'à 5 est courant) pour échelonner les retraits et lisser la fiscalité à la sortie. Retire un compte par an à l\'approche de la retraite pour éviter l\'imposition progressive.' },
        ],
      },
      {
        title: '3e pilier B – Prévoyance libre', readingTime: '3 min',
        sections: [
          { heading: 'Complémentaire au 3a', body: 'Le 3e pilier B n\'a pas de plafond de versement et est plus flexible. Pas de déduction fiscale au niveau fédéral, mais certains cantons (Genève, Fribourg) accordent une déduction partielle. Le capital est disponible à tout moment.' },
          { heading: 'Quand utiliser le 3b ?', body: 'Si tu as maximisé ton 3a et que tu veux épargner davantage en prévoyance. Utile aussi si tu n\'es pas affilié à une caisse de pension (indépendants sans LPP volontaire).' },
        ],
      },
      {
        title: 'Comptes à terme suisses', readingTime: '3 min',
        sections: [
          { heading: 'Taux fixes garantis', body: 'Les comptes à terme (Festgeld/dépôt à terme) offrent un taux fixe pour une durée de 3 mois à 5 ans. Les taux sont plus bas qu\'en zone euro mais la stabilité du CHF compense partiellement. Idéal pour un projet à horizon défini.' },
          { heading: 'Fiscalité', body: 'Les intérêts sont soumis à l\'impôt sur le revenu et à l\'impôt anticipé de 35%. L\'impôt anticipé est récupérable si tu déclares correctement tes avoirs dans ta déclaration fiscale.' },
        ],
      },
      {
        title: 'Épargne enfant', readingTime: '3 min',
        sections: [
          { heading: 'Compte jeunesse', body: 'Les banques suisses proposent des comptes épargne jeunesse avec des taux bonifiés (souvent 1-2% de plus que les comptes adultes). Idéal pour commencer à constituer un capital pour les études ou l\'apprentissage.' },
          { heading: 'Stratégie familiale', body: 'Combine un compte épargne jeunesse avec un 3a au nom de l\'enfant dès qu\'il commence à travailler (apprentissage, job étudiant). Les allocations familiales (200-300 CHF/mois) peuvent alimenter cette épargne.' },
        ],
      },
    ],
  },
  'immo-ch': {
    emoji: '🏠', name: 'Pack Immo Suisse', desc: 'Accession à la propriété et financement en Suisse',
    content: [
      {
        title: 'Hypothèque & taux', readingTime: '5 min',
        sections: [
          { heading: 'Le système hypothécaire suisse', body: 'En Suisse, on ne rembourse généralement pas la totalité de l\'hypothèque. Le 1er rang (jusqu\'à 65% de la valeur) peut être conservé indéfiniment. Le 2e rang (65-80%) doit être amorti en 15 ans ou avant la retraite. L\'apport minimum est de 20% dont au moins 10% en fonds propres "durs" (pas du 2e pilier).' },
          { heading: 'Types de taux', body: 'Hypothèque à taux fixe (2-10 ans, sécurité), hypothèque SARON (variable, indexée sur le SARON, plus risquée mais potentiellement moins chère), hypothèque à taux variable (rare, flexible). Le choix dépend de ta tolérance au risque et des prévisions de taux.' },
          { heading: 'Tenue des charges', body: 'La banque vérifie que tes charges hypothécaires (intérêts théoriques à 5% + amortissement + charges annexes) ne dépassent pas 33% de ton revenu brut. Avec un taux réel de 2%, tu paies moins mais l\'éligibilité est calculée à 5%.' },
        ],
      },
      {
        title: 'Amortissement direct vs indirect', readingTime: '4 min',
        sections: [
          { heading: 'Amortissement direct', body: 'Tu rembourses directement le capital de l\'hypothèque. La dette diminue, donc les intérêts aussi. Avantage : tu es propriétaire plus vite. Inconvénient : tu perds la déduction fiscale des intérêts hypothécaires.' },
          { heading: 'Amortissement indirect via 3a', body: 'Au lieu de rembourser l\'hypothèque, tu verses dans un 3e pilier A nanti en faveur de la banque. Double avantage fiscal : déduction des versements 3a ET des intérêts hypothécaires. À la fin, le capital 3a rembourse l\'hypothèque. C\'est la stratégie la plus utilisée en Suisse.' },
        ],
      },
      {
        title: 'Retrait EPL (2e pilier)', readingTime: '4 min',
        sections: [
          { heading: 'Encouragement à la propriété du logement', body: 'Tu peux retirer une partie de ton 2e pilier (LPP) pour financer l\'achat de ta résidence principale. Montant minimum : 20 000 CHF. Attention : cela réduit tes prestations de retraite et les rentes en cas d\'invalidité/décès.' },
          { heading: 'Conditions et fiscalité', body: 'Possible tous les 5 ans. Après 50 ans, le retrait est limité. Le montant retiré est imposé séparément à un taux réduit (varie par canton). En cas de revente du bien, tu dois rembourser le montant retiré à ta caisse de pension.' },
        ],
      },
      {
        title: 'Nantissement du 3a', readingTime: '3 min',
        sections: [
          { heading: 'Alternative au retrait', body: 'Au lieu de retirer ton 3a, tu peux le nantir (mettre en gage) auprès de la banque. Ton capital continue de travailler et tu conserves les avantages fiscaux. La banque accepte le 3a comme garantie supplémentaire pour augmenter l\'hypothèque.' },
          { heading: 'Avantages vs retrait', body: 'Le nantissement préserve ton épargne retraite et maintient la déduction fiscale annuelle. Le retrait donne un apport immédiat mais réduit ta prévoyance. Choisis le nantissement si ta situation financière le permet.' },
        ],
      },
      {
        title: 'Valeur locative & impôts', readingTime: '4 min',
        sections: [
          { heading: 'La valeur locative', body: 'En Suisse, les propriétaires doivent déclarer une « valeur locative » (le loyer fictif que tu te verses) comme revenu imposable. Cette valeur représente 60-70% du loyer de marché selon le canton. C\'est un impôt spécifique à la Suisse.' },
          { heading: 'Déductions possibles', body: 'En contrepartie, tu peux déduire les intérêts hypothécaires, les frais d\'entretien (forfait ou frais réels) et les primes d\'assurance bâtiment. La stratégie optimale est de maintenir une dette hypothécaire suffisante pour compenser la valeur locative.' },
        ],
      },
    ],
  },
  'prevoyance-ch': {
    emoji: '🛡️', name: 'Pack Prévoyance', desc: 'Les 3 piliers du système suisse de prévoyance',
    content: [
      {
        title: 'AVS – 1er pilier', readingTime: '5 min',
        sections: [
          { heading: 'Le socle de la prévoyance', body: 'L\'AVS (Assurance Vieillesse et Survivants) est le 1er pilier obligatoire. La rente maximale est de 2 450 CHF/mois (couple : 3 675 CHF). Elle couvre les besoins vitaux mais est insuffisante pour maintenir ton niveau de vie. Cotisation : 8,7% du salaire (partagé employeur/employé).' },
          { heading: 'Lacunes à combler', body: 'L\'AVS est financée par répartition (les actifs paient pour les retraités). Avec le vieillissement démographique, les rentes risquent de baisser. Le 2e et 3e pilier sont indispensables pour compléter ta retraite.' },
        ],
      },
      {
        title: 'LPP / Caisse de pension – 2e pilier', readingTime: '6 min',
        sections: [
          { heading: 'La prévoyance professionnelle', body: 'Le 2e pilier (LPP) est obligatoire pour les salariés gagnant plus de 22 050 CHF/an. Les cotisations augmentent avec l\'âge (7% à 25-34 ans, jusqu\'à 18% à 55-65 ans). L\'objectif : avec le 1er pilier, atteindre 60% du dernier salaire à la retraite.' },
          { heading: 'Part surobligatoire', body: 'Beaucoup de caisses de pension vont au-delà du minimum légal (surobligatoire). La part surobligatoire offre souvent un meilleur taux de conversion mais est soumise à des règles différentes. Vérifie ton certificat de prévoyance annuel.' },
          { heading: 'Rachat LPP', body: 'Tu peux effectuer des rachats volontaires dans ta caisse de pension pour combler des lacunes de cotisation. Ces rachats sont entièrement déductibles du revenu imposable. Stratégie puissante si ton taux marginal est élevé. Attention : blocage 3 ans avant un retrait en capital.' },
        ],
      },
      {
        title: '3e pilier A – Déduction fiscale', readingTime: '4 min',
        sections: [
          { heading: 'Plafond et déduction', body: 'Salariés affiliés LPP : max 7 056 CHF/an. Indépendants sans LPP : max 20% du revenu net, plafonné à 35 280 CHF/an. La totalité est déductible du revenu imposable. C\'est l\'un des rares outils de déduction fiscale "directe" en Suisse.' },
          { heading: 'Investissement en fonds', body: 'Les 3a en fonds (actions, obligations) offrent un meilleur rendement à long terme qu\'un 3a en compte épargne. Solutions populaires : VIAC, finpension, frankly (frais très bas : 0,39-0,48%). Choisis une allocation adaptée à ton horizon de retrait.' },
          { heading: 'Retrait et fiscalité', body: 'Retrait possible 5 ans avant l\'âge légal de la retraite, pour l\'achat d\'un logement, le départ définitif de Suisse, ou le passage en indépendant. Le capital est imposé séparément à un taux réduit qui varie selon le canton (ex : 3-8% à Zurich, 5-10% à Genève).' },
        ],
      },
      {
        title: 'Rachat LPP – Stratégie avancée', readingTime: '5 min',
        sections: [
          { heading: 'Identifier ses lacunes', body: 'Ton certificat de prévoyance indique le "rachat maximal possible". Les lacunes proviennent d\'années sans cotisation (études, séjour à l\'étranger) ou d\'augmentations de salaire. Plus la lacune est grande, plus le potentiel de rachat est important.' },
          { heading: 'Optimisation fiscale', body: 'Échelonne tes rachats sur plusieurs années pour bénéficier de la déduction chaque année. Un rachat de 30 000 CHF avec une TMI de 35% économise 10 500 CHF d\'impôts. Combine avec les versements 3a pour maximiser les déductions annuelles.' },
          { heading: 'Règle des 3 ans', body: 'Après un rachat, tu ne peux pas retirer le capital en prestation en capital pendant 3 ans (sauf départ de Suisse). Planifie tes rachats en conséquence si tu comptes prendre ta retraite ou retirer ton 2e pilier en capital.' },
        ],
      },
      {
        title: 'Coordination des piliers', readingTime: '4 min',
        sections: [
          { heading: 'Vision globale', body: 'Le système suisse vise 60% du dernier salaire avec les piliers 1+2. Le 3e pilier complète pour atteindre 80-90%. Calcule tes rentes projetées (AVS + LPP) et détermine le gap à combler avec le 3a et l\'épargne libre.' },
          { heading: 'Plan d\'action par âge', body: '25-35 ans : ouvre et maximise le 3a, choisis une allocation dynamique. 35-45 ans : commence les rachats LPP si lacunes, diversifie (immobilier, ETF). 45-55 ans : accélère les rachats LPP, échelonne les comptes 3a. 55-65 ans : planifie la sortie (capital vs rente), optimise la fiscalité du retrait.' },
        ],
      },
    ],
  },

  // ═══════════════════════ COMMON PACKS ═══════════════════════
  'bourse': {
    emoji: '📈', name: 'Pack Bourse', desc: 'Investir en bourse intelligemment',
    content: [
      {
        title: 'Choisir son enveloppe', readingTime: '5 min',
        sections: [
          { heading: '🇫🇷 PEA (France)', body: 'Le Plan d\'Épargne en Actions offre une fiscalité imbattable après 5 ans : seuls les prélèvements sociaux (17,2%) s\'appliquent sur les gains. Plafond de versements : 150 000 €. Limité aux actions européennes et fonds éligibles.' },
          { heading: '🇨🇭 Dépôt titres (Suisse)', body: 'En Suisse, pas d\'enveloppe fiscale type PEA. Les plus-values sur titres privés sont exonérées d\'impôt (avantage majeur !). Seuls les dividendes sont imposés comme revenu. Choisis un courtier avec des frais bas (Swissquote, Interactive Brokers, Yuh).' },
          { heading: 'CTO : liberté totale', body: 'Le Compte-Titres Ordinaire (ou dépôt titres) permet d\'investir dans le monde entier sans plafond. Indispensable pour les ETF monde, actions US, obligations. Fiscalité variable selon le pays.' },
        ],
      },
      {
        title: 'ETF & Trackers', readingTime: '5 min',
        sections: [
          { heading: 'Qu\'est-ce qu\'un ETF ?', body: 'Un ETF (Exchange-Traded Fund) réplique un indice boursier (CAC 40, S&P 500, MSCI World, SPI). Frais très bas (0,1-0,3%/an vs 1-2% pour un fonds actif). Diversification instantanée sur des centaines de titres.' },
          { heading: 'Les ETF incontournables', body: 'MSCI World (1 500 entreprises, 23 pays développés), S&P 500 (500 plus grandes entreprises US), MSCI Emerging Markets (marchés émergents), SPI (marché suisse complet). Un simple ETF MSCI World couvre 85% du marché mondial.' },
          { heading: 'Capitalisant vs Distribuant', body: 'ETF capitalisant : les dividendes sont réinvestis automatiquement (effet boule de neige, idéal en phase de constitution). ETF distribuant : les dividendes sont versés (idéal pour un complément de revenus). En Suisse, les ETF distribuants sont souvent préférés pour des raisons fiscales.' },
        ],
      },
      {
        title: 'DCA : investir sans timer le marché', readingTime: '4 min',
        sections: [
          { heading: 'Le principe du DCA', body: 'Le Dollar Cost Averaging (DCA) consiste à investir un montant fixe à intervalles réguliers (ex : 200 €/CHF par mois), quel que soit le cours. Tu achètes plus de parts quand c\'est bas, moins quand c\'est haut.' },
          { heading: 'Pourquoi ça marche', body: 'Le DCA élimine le stress du timing. Historiquement, les marchés montent sur le long terme (~8%/an en moyenne). Le DCA lisse ton prix d\'entrée et réduit le risque de mauvais timing.' },
          { heading: 'Mise en place', body: 'Configure un virement automatique mensuel vers ton courtier. Choisis 1 à 3 ETF. Programme les achats automatiques si ton courtier le permet. Oublie et laisse le temps faire.' },
        ],
      },
      {
        title: 'Dividendes & fiscalité', readingTime: '4 min',
        sections: [
          { heading: 'Comprendre les dividendes', body: 'Un dividende est une part des bénéfices redistribuée aux actionnaires. Rendement moyen du marché : ~2-3%/an. Les "Dividend Aristocrats" augmentent leur dividende chaque année depuis 25+ ans.' },
          { heading: '🇫🇷 Fiscalité FR', body: 'En CTO : flat tax 30% (12,8% IR + 17,2% PS) ou option barème progressif avec abattement 40%. En PEA après 5 ans : seuls 17,2% de PS. Le PEA est nettement plus avantageux.' },
          { heading: '🇨🇭 Fiscalité CH', body: 'Les dividendes sont imposés comme revenu ordinaire. L\'impôt anticipé de 35% est prélevé à la source mais récupérable via la déclaration fiscale. Les plus-values sur titres privés sont exonérées — c\'est l\'avantage majeur du système suisse.' },
        ],
      },
      {
        title: 'Construire un portefeuille', readingTime: '5 min',
        sections: [
          { heading: 'La règle 100 - âge', body: 'Règle simplifiée : (100 - ton âge) = % en actions. À 30 ans → 70% actions, 30% obligations/fonds. À adapter selon ton profil de risque et ton horizon.' },
          { heading: 'Portefeuille type "Lazy"', body: '80% ETF MSCI World + 20% obligations ou fonds sécurisés. Simple, diversifié, peu de frais. Rééquilibre 1 fois/an. Historiquement ~7%/an net de frais sur 15 ans.' },
          { heading: 'Rééquilibrage', body: 'Une fois par an, vérifie que ton allocation n\'a pas trop dérivé. Si les actions ont surperformé, vends un peu pour revenir à ton allocation cible. Cela force à "vendre haut, acheter bas".' },
        ],
      },
    ],
  },
  'non-cote': {
    emoji: '🔒', name: 'Pack Non côté', desc: 'Private equity et placements alternatifs',
    content: [
      {
        title: 'Private equity', readingTime: '5 min',
        sections: [
          { heading: 'Définition', body: 'Le private equity consiste à investir dans des entreprises non cotées en bourse, souvent en phase de croissance ou de transmission. Rendements historiques : 10-15%/an, mais illiquidité forte (5-10 ans de blocage).' },
          { heading: 'Comment investir ?', body: 'Via des fonds de PE (FCPR/FPCI en France, fonds de placement qualifiés en Suisse), des plateformes de crowdequity, ou des fonds de fonds. Ticket d\'entrée : de 1 000 € (crowdequity) à 100 000 € (fonds institutionnels).' },
        ],
      },
      {
        title: 'Dette privée', readingTime: '4 min',
        sections: [
          { heading: 'Le principe', body: 'Prêter directement à des entreprises via des plateformes spécialisées. Rendements : 5-10%/an. Durée : 1-5 ans. Risque de défaut à intégrer dans ta diversification.' },
          { heading: 'Plateformes de référence', body: 'France : October, Credit.fr. Suisse : Lend.ch, Cashare. Diversifie sur au moins 20-30 projets pour réduire le risque de défaut individuel.' },
        ],
      },
      {
        title: 'Crowdfunding immobilier', readingTime: '4 min',
        sections: [
          { heading: 'Fonctionnement', body: 'Finance des opérations immobilières (promotion, rénovation) via des plateformes en ligne. Rendements : 8-12%/an. Durée : 12-36 mois. Risque : retard de projet ou défaut du promoteur.' },
          { heading: 'Bonnes pratiques', body: 'Diversifie sur 10+ projets et plusieurs plateformes. Vérifie l\'expérience du promoteur, la pré-commercialisation, et les garanties (hypothèque, caution). Ne dépasse pas 10% de ton patrimoine.' },
        ],
      },
      {
        title: 'Crowdlending', readingTime: '3 min',
        sections: [
          { heading: 'Prêt aux entreprises', body: 'Prête à des PME via des plateformes. Rendements : 3-8%/an selon le risque. Remboursement mensuel du capital + intérêts. Risque de défaut réel (2-5% selon les plateformes).' },
        ],
      },
      {
        title: 'Risques & liquidité', readingTime: '4 min',
        sections: [
          { heading: 'Les risques spécifiques', body: 'Illiquidité (impossible de revendre facilement), risque de perte en capital, absence de garantie des dépôts, risque de plateforme (faillite de l\'intermédiaire). Ne jamais investir de l\'argent dont tu pourrais avoir besoin.' },
          { heading: 'Règle d\'or', body: 'Le non côté ne doit pas dépasser 10-15% de ton patrimoine financier. C\'est un complément de diversification, pas le cœur de ta stratégie.' },
        ],
      },
    ],
  },
  'premium': {
    emoji: '💎', name: 'Pack Premium', desc: 'Vision 360° de ton patrimoine',
    content: [
      {
        title: 'Allocation patrimoniale', readingTime: '6 min',
        sections: [
          { heading: 'Les piliers du patrimoine', body: '🇫🇷 France : Épargne de sécurité (livrets), Investissements financiers (PEA, AV, CTO), Immobilier (RP, locatif, SCPI), Retraite (PER). 🇨🇭 Suisse : Épargne bancaire, 3e pilier A/B, Dépôt titres, Immobilier, LPP (2e pilier). Chaque pilier a un rôle précis.' },
          { heading: 'Répartition par profil', body: 'Prudent : 40% sécurité, 30% obligations, 20% immo, 10% actions. Dynamique : 15% sécurité, 15% obligations, 40% actions, 20% immo, 10% alternatifs. Adapte selon ton âge, tes projets et ton marché.' },
        ],
      },
      {
        title: 'Optimisation fiscale globale', readingTime: '5 min',
        sections: [
          { heading: '🇫🇷 Enveloppes françaises', body: 'PEA (17,2% après 5 ans), AV (abattement après 8 ans), CTO (flat tax 30%), PER (déduction à l\'entrée). Ordre optimal : Livrets → PEA → AV → PER → CTO → Immobilier.' },
          { heading: '🇨🇭 Optimisation suisse', body: 'Plus-values privées exonérées (avantage majeur). Déductions : 3e pilier A (7 056 CHF), rachats LPP, intérêts hypothécaires, frais d\'entretien immobilier. Ordre optimal : 3a → Rachats LPP → Dépôt titres → Immobilier.' },
        ],
      },
      {
        title: 'Stratégie retraite', readingTime: '5 min',
        sections: [
          { heading: 'Estimer ses besoins', body: 'Règle des 70% : tu auras besoin d\'environ 70% de tes revenus d\'activité à la retraite. En France, la pension légale couvre 50-60%. En Suisse, AVS + LPP visent 60%. Le complément doit venir de ton épargne (3a, investissements, revenus locatifs).' },
          { heading: 'La règle des 4%', body: 'Pour vivre de ton capital, tu peux retirer 4% par an sans l\'épuiser (sur 30 ans historiquement). Besoin de 3 000 CHF/2 000 €/mois ? Il te faut ~900 000 CHF / 600 000 € de capital investi. Utilise notre simulateur FIRE.' },
        ],
      },
      {
        title: 'Transmission', readingTime: '5 min',
        sections: [
          { heading: '🇫🇷 Transmission en France', body: 'Chaque parent peut transmettre 100 000 € par enfant tous les 15 ans sans droits de succession. Assurance vie : abattement de 152 500 € par bénéficiaire pour les versements avant 70 ans.' },
          { heading: '🇨🇭 Transmission en Suisse', body: 'Les droits de succession varient par canton. En ligne directe, la plupart des cantons exonèrent totalement (Zurich, Berne, Vaud). Quelques cantons appliquent un impôt résiduel (Neuchâtel, Appenzell). Le conjoint survivant est généralement exonéré.' },
        ],
      },
      {
        title: 'Plan d\'action personnalisé', readingTime: '4 min',
        sections: [
          { heading: '🇫🇷 Check-list France', body: '✅ Épargne de précaution constituée ? ✅ PEA ouvert (même avec 100 €) ? ✅ Assurance vie ouverte depuis > 8 ans ? ✅ PER ouvert si TMI ≥ 30% ? ✅ Résidence principale financée ? ✅ Testament et clause bénéficiaire AV à jour ?' },
          { heading: '🇨🇭 Check-list Suisse', body: '✅ 3e pilier A maximisé chaque année ? ✅ Plusieurs comptes 3a ouverts ? ✅ Certificat LPP vérifié (lacunes) ? ✅ Rachats LPP planifiés ? ✅ Courtier titres avec frais bas ? ✅ Hypothèque et amortissement indirect optimisés ?' },
          { heading: 'Calendrier financier', body: 'Janvier : bilan patrimonial annuel. Mars-Avril : déclaration fiscale, vérifier plafonds 3a/PER. Juin : rééquilibrage du portefeuille. Septembre : planifier versements défiscalisants. Décembre : maximiser 3a/PER/rachats LPP, dons, bilan.' },
        ],
      },
    ],
  },
};

export default function BonusDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const pack = slug ? packData[slug] : undefined;

  if (!pack) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate('/bonus')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux bonus
        </Button>
        <p className="text-muted-foreground">Pack introuvable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => navigate('/bonus')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Tous les packs
      </Button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl">{pack.emoji}</span>
          {pack.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{pack.desc}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{pack.content.length} chapitres</Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {pack.content.reduce((acc, c) => acc + parseInt(c.readingTime), 0)} min de lecture
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {pack.content.map((chapter, idx) => (
          <Accordion key={idx} type="single" collapsible>
            <AccordionItem value={`chapter-${idx}`} className="rounded-xl border bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{chapter.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {chapter.readingTime}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-5 pb-2 pl-11">
                  {chapter.sections.map((section, sIdx) => (
                    <div key={sIdx}>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {section.heading}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
