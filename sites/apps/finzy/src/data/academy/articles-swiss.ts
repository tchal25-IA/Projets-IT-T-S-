import type { AcademyArticle } from './types';

export const articlesSwiss: AcademyArticle[] = [
  // NIVEAU 1 - SUISSE
  {
    id: 'ch-1-01',
    slug: 'systeme-trois-piliers',
    title: 'Le système des 3 piliers suisse',
    summary: 'Comprendre le système de prévoyance suisse unique au monde.',
    category: 'fondamentaux',
    level: 1,
    market: 'CH',
    readingTime: 10,
    xpReward: 30,
    sections: [
      {
        title: 'Vue d\'ensemble des 3 piliers',
        content: `La Suisse a un système de prévoyance basé sur **3 piliers complémentaires** :

**1er pilier - AVS/AI (obligatoire)**
• Assurance Vieillesse et Survivants
• Financé par les cotisations salariales
• Rente maximale : ~2 450 CHF/mois (couple : ~3 675 CHF)
• Objectif : couvrir les besoins vitaux

**2e pilier - LPP (obligatoire)**
• Prévoyance professionnelle
• Financé par employeur + employé
• Capital ou rente à la retraite
• Objectif : maintenir le niveau de vie

**3e pilier - Prévoyance privée (facultatif)**
• 3a : lié (déductible fiscalement)
• 3b : libre (assurance-vie, épargne)
• Objectif : combler les lacunes`,
        diagram: `┌─────────────────────────────────────────┐
│         SYSTÈME DES 3 PILIERS           │
├─────────────────────────────────────────┤
│  3e pilier │ Prévoyance privée (3a/3b) │
│            │ ~10-15% du revenu         │
├────────────┼────────────────────────────┤
│  2e pilier │ LPP - Caisse de pension   │
│            │ ~40-50% du revenu final   │
├────────────┼────────────────────────────┤
│  1er pilier│ AVS/AI - Rente de base    │
│            │ ~25-30% du revenu         │
└────────────┴────────────────────────────┘`
      },
      {
        title: 'Le 1er pilier : l\'AVS',
        content: `**Cotisations AVS :**
• Salariés : 10,6% du salaire (moitié employeur)
• Indépendants : 10,0% du revenu
• Sans activité : cotisation minimale obligatoire

**Conditions de la rente :**
• Âge de référence : 65 ans (hommes et femmes dès 2028)
• Rente complète : 44 ans de cotisations
• Lacunes = réduction de rente

**Montants 2024 :**
• Rente minimale : 1 225 CHF/mois
• Rente maximale : 2 450 CHF/mois
• Rente couple plafonnée : 3 675 CHF/mois

**Important :**
Les années sans cotisation (études, séjour à l'étranger) créent des lacunes. Vérifier son compte AVS sur www.ahv-iv.ch`
      },
      {
        title: 'Le 2e pilier : la LPP',
        content: `**Salaire assuré :**
• Seuil d'entrée : 22 050 CHF/an
• Salaire maximum assuré : 88 200 CHF
• Déduction de coordination : 25 725 CHF

**Cotisations (part employé, employeur au moins égal) :**
| Âge | Taux sur salaire assuré |
|-----|-------------------------|
| 25-34 | 7% |
| 35-44 | 10% |
| 45-54 | 15% |
| 55-65 | 18% |

**À la retraite :**
• Retrait en capital (imposé une fois)
• Conversion en rente (taux ~6,8%)
• Combinaison des deux

**Avantage fiscal :**
Les rachats d'années LPP sont **déductibles du revenu imposable** !`
      },
      {
        title: 'Le 3e pilier : prévoyance privée',
        content: `**Pilier 3a (lié) :**
• Versements déductibles du revenu imposable
• Plafond 2024 salarié : 7 056 CHF
• Plafond indépendant sans 2e pilier : 35 280 CHF (20% du revenu)
• Bloqué jusqu'à 5 ans avant la retraite
• Retrait : achat logement, départ de Suisse, activité indépendante

**Pilier 3b (libre) :**
• Aucune déduction fiscale
• Disponibilité totale
• Assurance-vie, épargne, placements

**Stratégie optimale :**
1. Maximiser le 3a chaque année (déduction fiscale)
2. Ouvrir plusieurs comptes 3a (retraits échelonnés)
3. Compléter par du 3b si capacité d'épargne`
      }
    ],
    definitions: [
      { term: 'AVS', definition: 'Assurance Vieillesse et Survivants - 1er pilier de la prévoyance suisse.' },
      { term: 'LPP', definition: 'Loi sur la Prévoyance Professionnelle - 2e pilier obligatoire.' },
      { term: 'Pilier 3a', definition: 'Prévoyance liée avec avantages fiscaux, bloquée jusqu\'à la retraite.' }
    ],
    keyPoints: [
      'Le système suisse repose sur 3 piliers complémentaires',
      'Le 1er pilier (AVS) couvre les besoins vitaux',
      'Le 2e pilier (LPP) maintient le niveau de vie',
      'Le 3e pilier (3a) offre des avantages fiscaux importants'
    ],
    quiz: {
      question: 'Quel est le plafond annuel de versement au pilier 3a pour un salarié en 2024 ?',
      options: ['5 000 CHF', '7 056 CHF', '10 000 CHF', '35 280 CHF'],
      correctIndex: 1,
      explanation: 'Le plafond du pilier 3a pour un salarié affilié à une caisse de pension est de 7 056 CHF en 2024.'
    }
  },
  {
    id: 'ch-1-02',
    slug: 'impots-suisse-bases',
    title: 'Les impôts en Suisse : les bases',
    summary: 'Comprendre le système fiscal suisse avec ses trois niveaux d\'imposition.',
    category: 'fiscalite',
    level: 1,
    market: 'CH',
    readingTime: 9,
    xpReward: 25,
    sections: [
      {
        title: 'Les trois niveaux d\'imposition',
        content: `En Suisse, vous payez des impôts à **trois niveaux** :

**1. Impôt fédéral direct (IFD)**
• Taux progressif jusqu'à 11,5%
• Identique dans tout le pays
• Sur le revenu uniquement

**2. Impôt cantonal**
• Taux variable selon le canton
• Sur le revenu ET la fortune
• Différences importantes (Zoug vs Genève)

**3. Impôt communal**
• Coefficient multiplicateur de l'impôt cantonal
• Varie d'une commune à l'autre

**Exemple (revenu 100 000 CHF, Zurich) :**
• IFD : ~3 500 CHF
• Canton + commune : ~12 000 CHF
• **Total : ~15 500 CHF** (15,5%)

**Même revenu à Zoug :** ~10 000 CHF (10%)
**Même revenu à Genève :** ~22 000 CHF (22%)`
      },
      {
        title: 'L\'impôt sur le revenu',
        content: `**Revenus imposables :**
• Salaire (après déduction AVS/LPP)
• Revenus indépendants
• Revenus locatifs
• Revenus mobiliers (intérêts, dividendes)
• Valeur locative (propriétaires)

**Déductions principales :**
• Cotisations 2e pilier (automatique)
• Versements pilier 3a
• Rachats LPP
• Frais professionnels (forfait ou effectifs)
• Intérêts hypothécaires
• Frais d'entretien immobilier
• Primes d'assurance maladie (plafond)

**Barème fédéral 2024 (célibataire) :**
| Revenu | Taux marginal |
|--------|---------------|
| 0 - 17 800 | 0% |
| 17 800 - 31 600 | 0,77% |
| 31 600 - 41 400 | 0,88% - 2,64% |
| 41 400 - 55 200 | 2,97% |
| > 895 900 | 11,5% |`
      },
      {
        title: 'L\'impôt sur la fortune',
        content: `La Suisse est l'un des rares pays à taxer la **fortune** (pas de revenu, la fortune elle-même).

**Assiette :**
• Immobilier (valeur fiscale, souvent < marché)
• Titres (valeur boursière au 31.12)
• Véhicules, objets de valeur
• Avoirs bancaires
• Moins : dettes (hypothèque, etc.)

**Taux (varie selon canton) :**
• Zoug : 0,1 - 0,3%
• Genève : 0,25 - 1%
• Vaud : 0,15 - 0,8%

**Exemple (fortune nette 500 000 CHF, Genève) :**
Impôt fortune : ~2 000-3 000 CHF/an

**Astuce :**
La valeur fiscale immobilière est souvent 30-50% inférieure à la valeur de marché. L'immobilier est donc relativement avantageux.`
      },
      {
        title: 'Déclaration et optimisation',
        content: `**Déclaration d'impôt :**
• Annuelle (année civile)
• Délai : février-mars (varie selon canton)
• Possibilité de prolongation
• Déclaration en ligne recommandée

**Erreurs à éviter :**
• Oublier de déduire le pilier 3a
• Ne pas déclarer les frais effectifs si > forfait
• Oublier les intérêts hypothécaires
• Ne pas déclarer les titres étrangers

**Optimisation fiscale de base :**
1. Maximiser le pilier 3a (économie immédiate)
2. Racheter des années LPP (si revenus élevés)
3. Déduire les frais d'entretien immobilier
4. Étaler les travaux sur plusieurs années
5. Choisir sa commune de résidence`
      }
    ],
    definitions: [
      { term: 'IFD', definition: 'Impôt Fédéral Direct - impôt prélevé par la Confédération.' },
      { term: 'Valeur locative', definition: 'Revenu fictif ajouté aux propriétaires occupants, correspondant au loyer qu\'ils auraient payé.' },
      { term: 'Fortune nette', definition: 'Total des actifs moins les dettes, base de l\'impôt sur la fortune.' }
    ],
    keyPoints: [
      'Trois niveaux d\'imposition : fédéral, cantonal, communal',
      'La charge fiscale varie fortement selon le canton',
      'La fortune est imposée en Suisse (rare)',
      'Le pilier 3a est la première optimisation fiscale'
    ],
    quiz: {
      question: 'Quel canton suisse a généralement la fiscalité la plus basse ?',
      options: ['Genève', 'Vaud', 'Zoug', 'Berne'],
      correctIndex: 2,
      explanation: 'Zoug est connu pour avoir l\'une des fiscalités les plus basses de Suisse, attirant de nombreuses entreprises et particuliers fortunés.'
    }
  },
  {
    id: 'ch-1-03',
    slug: 'epargne-suisse-livrets',
    title: 'L\'épargne en Suisse',
    summary: 'Les options d\'épargne disponibles en Suisse et leurs caractéristiques.',
    category: 'epargne',
    level: 1,
    market: 'CH',
    readingTime: 7,
    xpReward: 20,
    sections: [
      {
        title: 'Les comptes d\'épargne',
        content: `**Compte épargne classique :**
• Taux très bas (~0,5-1% en 2024)
• Disponibilité immédiate
• Pas de plafond
• Intérêts imposables

**Compte épargne jeunesse :**
• Taux légèrement bonifié
• Jusqu'à 25-30 ans selon banque
• Plafond souvent limité

**Compte épargne 3a :**
• Le plus avantageux fiscalement
• Déduction du revenu imposable
• Bloqué jusqu'à la retraite
• Taux ou fonds de placement

**Comparaison 2024 :**
| Type | Taux moyen |
|------|------------|
| Compte courant | 0% |
| Épargne classique | 0,5-1% |
| Épargne 3a compte | 1-1,5% |
| Épargne 3a titres | Variable |`
      },
      {
        title: 'L\'avantage fiscal du 3a',
        content: `Le pilier 3a offre une **triple économie fiscale** :

**1. À l'entrée (déduction) :**
Versement 7 056 CHF × TMI 30% = **~2 100 CHF économisés**

**2. Pendant la détention :**
Pas d'impôt sur la fortune (3a non taxé)
Pas d'impôt sur les gains

**3. À la sortie :**
Imposition réduite (barème séparé, ~5-10% selon canton)

**Exemple sur 30 ans :**
• Versement : 7 056 CHF/an
• Rendement : 3%/an
• Capital final : ~350 000 CHF
• Économie d'impôt cumulée à l'entrée : ~63 000 CHF
• Impôt à la sortie : ~25 000 CHF
• **Gain fiscal net : ~38 000 CHF**`
      },
      {
        title: 'Stratégie multi-comptes 3a',
        content: `**Pourquoi ouvrir plusieurs comptes 3a ?**

À la retraite, le retrait du 3a est imposé. Si vous retirez tout en une fois, vous payez plus d'impôt (progressivité).

**Solution : étaler les retraits**
• Ouvrir 5+ comptes 3a différents
• Fermer un compte par an
• Chaque retrait est imposé séparément

**Exemple (capital 3a total : 300 000 CHF) :**

| Stratégie | Retrait | Impôt |
|-----------|---------|-------|
| 1 retrait | 300 000 | ~25 000 CHF |
| 5 retraits | 60 000 × 5 | ~15 000 CHF |

**Économie : ~10 000 CHF** grâce aux multi-comptes !

**Où ouvrir un 3a ?**
• Banques : PostFinance, UBS, Raiffeisen
• Assurances : Swiss Life, AXA (attention aux frais)
• Fintechs : Finpension, VIAC, Frankly (frais bas, titres)`
      },
      {
        title: 'Comptes 3a en titres',
        content: `**Compte 3a classique vs titres :**

| Aspect | Compte | Titres |
|--------|--------|--------|
| Rendement | ~1,5% | ~5-7% (historique) |
| Risque | Nul | Marché |
| Frais | 0% | 0,2-1% |
| Horizon | Court terme | Long terme (10+ ans) |

**Recommandation par âge :**
• < 40 ans : 80-100% actions
• 40-50 ans : 60-80% actions
• > 50 ans : 40-60% actions

**Meilleurs 3a en titres 2024 :**
• **Finpension** : Frais 0,39%, jusqu'à 99% actions
• **VIAC** : Frais 0,52%, interface simple
• **Frankly** : Frais 0,45%, bonne diversification

**Attention aux assurances 3a :**
Frais élevés (1-2%), pénalités de sortie, rendement dilué. Privilégier les solutions bancaires ou fintechs.`
      }
    ],
    definitions: [
      { term: 'Pilier 3a', definition: 'Prévoyance individuelle liée avec avantages fiscaux, bloquée jusqu\'à la retraite.' },
      { term: 'TMI', definition: 'Taux Marginal d\'Imposition - taux applicable à la dernière tranche de revenu.' },
      { term: '3a titres', definition: 'Compte 3a investi en fonds/ETF plutôt qu\'en compte rémunéré.' }
    ],
    keyPoints: [
      'Le 3a est la meilleure option d\'épargne fiscalement',
      'Ouvrir plusieurs comptes 3a pour étaler les retraits',
      'Les 3a en titres surperforment sur le long terme',
      'Éviter les assurances 3a (frais élevés)'
    ],
    quiz: {
      question: 'Pourquoi est-il conseillé d\'ouvrir plusieurs comptes 3a ?',
      options: ['Pour avoir plusieurs banques', 'Pour étaler les retraits et payer moins d\'impôt', 'C\'est obligatoire', 'Pour diversifier le risque'],
      correctIndex: 1,
      explanation: 'En ouvrant plusieurs comptes 3a, on peut étaler les retraits à la retraite sur plusieurs années, réduisant ainsi l\'imposition grâce à la progressivité du barème.'
    }
  },
  // NIVEAU 2 - SUISSE
  {
    id: 'ch-2-01',
    slug: 'rachat-lpp',
    title: 'Les rachats LPP : optimisation fiscale',
    summary: 'Comprendre et optimiser les rachats d\'années de cotisation au 2e pilier.',
    category: 'enveloppes',
    level: 2,
    market: 'CH',
    readingTime: 10,
    xpReward: 35,
    sections: [
      {
        title: 'Qu\'est-ce qu\'un rachat LPP ?',
        content: `Un rachat LPP permet de **combler des lacunes** dans votre 2e pilier et de **déduire le montant** de votre revenu imposable.

**Situations créant des lacunes :**
• Début de carrière tardif
• Années à l'étranger
• Divorce (partage du 2e pilier)
• Augmentation de salaire
• Passage temps plein → temps partiel

**Avantage fiscal :**
Chaque franc racheté est déductible à 100% !

**Exemple (TMI 35%, rachat 50 000 CHF) :**
Économie d'impôt immédiate : 50 000 × 35% = **17 500 CHF**

C'est comme un "retour sur investissement" immédiat de 35% !`
      },
      {
        title: 'Comment calculer sa lacune ?',
        content: `**Demander à sa caisse de pension :**
Le certificat de prévoyance indique :
• Avoir de vieillesse actuel
• Avoir de vieillesse maximal possible
• **Lacune = écart entre les deux**

**Facteurs influençant la lacune :**
• Âge d'entrée dans le 2e pilier
• Évolution salariale
• Années non cotisées
• Plan de prévoyance (minimal vs surobligatoire)

**Attention :**
• Après un rachat, **interdiction de retirer en capital pendant 3 ans**
• Vérifier si la caisse permet le retrait en capital
• Certaines caisses ont des limitations spécifiques`
      },
      {
        title: 'Stratégie de rachat optimale',
        content: `**Timing des rachats :**

| Période | Intérêt du rachat |
|---------|-------------------|
| Revenus en hausse | ✅ TMI élevé = économie maximale |
| Avant 60 ans | ✅ Plus de temps pour la capitalisation |
| Revenus stables | ✅ Étaler sur plusieurs années |
| Revenus en baisse | ❌ Moins d'économie fiscale |

**Étaler les rachats :**
Plutôt que 100 000 CHF d'un coup, faire 20 000 CHF sur 5 ans :
• Optimise la progressivité fiscale
• Plus de flexibilité financière

**Combiner avec le 3a :**
1. D'abord maximiser le 3a (7 056 CHF)
2. Ensuite faire des rachats LPP
3. Double déduction fiscale possible !`
      },
      {
        title: 'Cas particuliers et risques',
        content: `**Frontaliers (G) :**
• Peuvent racheter en Suisse
• Déductible des impôts suisses ou français selon statut

**Indépendants :**
• Peuvent affilier volontairement une LPP
• Ou verser au pilier 3a (plafond plus élevé)

**Risques à considérer :**
• Faillite de la caisse : garantie légale limitée
• Rendement de la caisse : peut être faible
• Blocage 3 ans si retrait capital prévu
• Sortie en rente forcée si pas de capital

**Alternative au rachat LPP :**
Si vous souhaitez plus de contrôle et de flexibilité, le pilier 3a en titres peut être préférable au rachat LPP, malgré un plafond de déduction plus faible.`
      }
    ],
    definitions: [
      { term: 'Rachat LPP', definition: 'Versement volontaire pour combler des lacunes de cotisation au 2e pilier.' },
      { term: 'Lacune de prévoyance', definition: 'Écart entre l\'avoir actuel et l\'avoir maximal possible dans la caisse de pension.' },
      { term: 'Surobligatoire', definition: 'Partie du 2e pilier au-delà du minimum légal, avec conditions souvent plus favorables.' }
    ],
    keyPoints: [
      'Le rachat LPP est déductible à 100% du revenu',
      'Délai de 3 ans avant retrait en capital après rachat',
      'Étaler les rachats sur plusieurs années',
      'Vérifier les conditions de sa caisse de pension'
    ],
    quiz: {
      question: 'Quel est le délai minimum entre un rachat LPP et un retrait en capital ?',
      options: ['1 an', '2 ans', '3 ans', '5 ans'],
      correctIndex: 2,
      explanation: 'Après un rachat LPP, il faut attendre 3 ans minimum avant de pouvoir retirer son 2e pilier sous forme de capital.'
    }
  },
  {
    id: 'ch-2-02',
    slug: 'immobilier-suisse',
    title: 'L\'immobilier en Suisse',
    summary: 'Spécificités de l\'achat et de l\'investissement immobilier en Suisse.',
    category: 'immobilier',
    level: 2,
    market: 'CH',
    readingTime: 11,
    xpReward: 40,
    sections: [
      {
        title: 'Le marché immobilier suisse',
        content: `**Particularités du marché :**
• Prix très élevés (surtout arc lémanique, Zurich)
• Faible taux de propriétaires (~36% vs 65% en France)
• Marché locatif développé et régulé
• Restrictions pour les étrangers non-résidents

**Prix moyens 2024 (par m²) :**
| Région | Appartement | Maison |
|--------|-------------|--------|
| Genève | 15 000 CHF | 18 000 CHF |
| Zurich | 14 000 CHF | 16 000 CHF |
| Lausanne | 12 000 CHF | 14 000 CHF |
| Berne | 8 000 CHF | 10 000 CHF |
| Valais | 6 000 CHF | 7 000 CHF |

**Financement typique :**
• Apport minimum : 20% (dont 10% en "dur")
• Hypothèque 1er rang : jusqu'à 65% de la valeur
• Hypothèque 2e rang : jusqu'à 80%`
      },
      {
        title: 'Financement et apport',
        content: `**Composition de l\'apport (20% minimum) :**
• 10% minimum en fonds propres "durs" :
  - Épargne bancaire
  - Titres
  - Donation familiale
• 10% peuvent venir du 2e pilier ou 3a

**Retrait LPP/3a pour l\'immobilier :**
• Possible pour résidence principale uniquement
• Imposition réduite (taux séparé)
• Réduction des prestations de prévoyance
• Doit être remboursé en cas de vente

**Exemple (bien à 1 000 000 CHF) :**
• Apport requis : 200 000 CHF
• Minimum fonds durs : 100 000 CHF
• LPP/3a possible : 100 000 CHF
• Hypothèque : 800 000 CHF`
      },
      {
        title: 'Fiscalité immobilière',
        content: `**La valeur locative :**
En Suisse, les propriétaires sont imposés sur un **revenu fictif** appelé valeur locative (~60-70% du loyer de marché).

**Contrepartie - Déductions :**
• Intérêts hypothécaires (100%)
• Frais d'entretien (forfait ou effectifs)
• Rénovations (étalables sur 3 ans)

**Stratégie :**
Avec des taux bas, les intérêts déductibles sont faibles. Mieux vaut :
• Amortir l'hypothèque lentement
• Investir la différence ailleurs
• Maximiser les déductions travaux

**Impôt sur les gains immobiliers :**
• Plus-value imposée à la vente
• Taux dégressif selon la durée de détention
• Exonération si réemploi (achat d'un autre bien)

**Exemple Genève (détention 5 ans) :**
Plus-value 200 000 CHF → Impôt ~40% = 80 000 CHF`
      },
      {
        title: 'Investissement locatif',
        content: `**Rendements locatifs :**
| Ville | Rendement brut |
|-------|----------------|
| Genève | 2-3% |
| Zurich | 2-3% |
| Lausanne | 3-4% |
| Villes moyennes | 4-5% |

**Réglementation locative :**
• Loyers encadrés (référence au loyer précédent)
• Contrats à durée indéterminée par défaut
• Protection forte des locataires
• Hausse de loyer très encadrée

**Fiscalité des revenus locatifs :**
• Imposés comme revenus ordinaires
• Pas de régime micro-foncier
• Charges réelles déductibles
• Possibilité de créer un déficit

**Alternative : fonds immobiliers cotés**
• Suisse : UBS Swiss Sima, CS Real Estate
• Décote/prime sur la VNI
• Liquidité et diversification
• Rendement ~3-4%`
      }
    ],
    definitions: [
      { term: 'Valeur locative', definition: 'Revenu fictif imposé aux propriétaires occupants, basé sur le loyer théorique du bien.' },
      { term: 'Hypothèque 1er rang', definition: 'Crédit immobilier prioritaire en cas de défaut, généralement non amorti.' },
      { term: 'OEPL', definition: 'Ordonnance sur l\'Encouragement à la Propriété du Logement - régit l\'utilisation du 2e pilier pour l\'immobilier.' }
    ],
    keyPoints: [
      'Apport minimum de 20%, dont 10% en fonds propres',
      'Le 2e pilier et 3a peuvent être utilisés pour l\'achat',
      'La valeur locative impose les propriétaires sur un revenu fictif',
      'Les rendements locatifs sont faibles dans les grandes villes'
    ],
    quiz: {
      question: 'Quel pourcentage minimum de fonds propres "durs" est requis pour acheter en Suisse ?',
      options: ['5%', '10%', '15%', '20%'],
      correctIndex: 1,
      explanation: 'Sur les 20% d\'apport requis, au minimum 10% doivent provenir de fonds propres "durs" (épargne, titres), le reste pouvant venir du 2e pilier ou 3a.'
    }
  },
  {
    id: 'ch-2-03',
    slug: 'investir-bourse-suisse',
    title: 'Investir en bourse depuis la Suisse',
    summary: 'Les spécificités de l\'investissement boursier pour les résidents suisses.',
    category: 'investissement',
    level: 2,
    market: 'CH',
    readingTime: 9,
    xpReward: 30,
    sections: [
      {
        title: 'Fiscalité des placements',
        content: `**Gains en capital :**
Les plus-values sur titres sont **exonérées d\'impôt** pour les particuliers en Suisse !

**Conditions (gestion de fortune privée) :**
• Pas de trading professionnel (< 5 transactions/mois)
• Détention > 6 mois (critère indicatif)
• Gains < revenus du travail
• Pas d'utilisation de levier excessif

**Dividendes et intérêts :**
• Impôt anticipé de 35% retenu à la source
• Récupérable via la déclaration fiscale (si déclaré !)
• Imposés au revenu ordinaire

**Exemple :**
• Plus-value : 50 000 CHF → 0 CHF d'impôt
• Dividendes : 5 000 CHF → imposés au revenu (~35% TMI) = 1 750 CHF`
      },
      {
        title: 'Courtiers et frais',
        content: `**Courtiers suisses :**
| Courtier | Frais ordre | Garde |
|----------|-------------|-------|
| Swissquote | 9-190 CHF | 0,025-0,1%/trim |
| PostFinance | 15-250 CHF | Inclus |
| UBS/CS | 50-300 CHF | Variable |

**Courtiers étrangers accessibles :**
| Courtier | Frais ordre | Garde |
|----------|-------------|-------|
| Interactive Brokers | 1-5 CHF | 0% |
| DEGIRO | 1-3€ | 0% |
| Saxo | 3-10 CHF | 0% |

**Attention aux courtiers étrangers :**
• Déclaration obligatoire (impôt sur la fortune)
• Récupération de l'impôt anticipé plus complexe
• Formulaires de déclaration parfois incomplets`
      },
      {
        title: 'Stratégie d\'investissement',
        content: `**Avantages fiscaux suisses :**
• Plus-values exonérées → privilégier les actions de croissance
• Dividendes imposés → ETF capitalisants préférables

**Allocation recommandée :**
• ETF World : 60-70%
• ETF Suisse (pour la devise) : 10-20%
• Obligations/Cash : 10-30%

**ETF accessibles populaires :**
• iShares Core MSCI World (SWDA) : 0,20%
• Vanguard FTSE All-World (VWRD) : 0,22%
• UBS ETF SPI (SPICHA) : 0,10%

**Devise et couverture :**
• Revenus en CHF = exposition EUR/USD naturelle
• Pas besoin de couvrir si horizon long terme
• ETF CHF-hedged disponibles mais coûteux`
      },
      {
        title: 'Imposition de la fortune',
        content: `**N\'oubliez pas l\'impôt sur la fortune !**

Vos titres sont imposés sur leur valeur au 31 décembre.

**Impact sur la stratégie :**
• ETF capitalisants : valorisation visible = fortune imposée
• Mais : pas de revenu distribué = pas d'IR sur dividendes

**Calcul simplifié :**
• Portefeuille : 500 000 CHF
• Impôt fortune (Zurich) : ~0,3% = 1 500 CHF/an
• Rendement 7% : 35 000 CHF
• **Rendement net après impôt fortune : 6,7%**

**Optimisation :**
• Le pilier 3a n'est pas soumis à l'impôt sur la fortune
• Maximiser d'abord le 3a en titres
• Ensuite investir en compte libre

**Attention au statut de négociant :**
Si vous tradez trop activement, vous pouvez être requalifié en "négociant professionnel" → plus-values imposables !`
      }
    ],
    definitions: [
      { term: 'Impôt anticipé', definition: 'Retenue de 35% sur les dividendes suisses, récupérable si déclarée.' },
      { term: 'Négociant professionnel', definition: 'Statut fiscal où les gains en capital deviennent imposables en raison d\'une activité de trading trop importante.' },
      { term: 'ETF capitalisant', definition: 'ETF qui réinvestit les dividendes au lieu de les distribuer.' }
    ],
    keyPoints: [
      'Les plus-values sont exonérées pour les particuliers',
      'Les dividendes sont imposés au revenu ordinaire',
      'Privilégier les ETF capitalisants',
      'Attention à ne pas devenir "négociant professionnel"'
    ],
    quiz: {
      question: 'Les plus-values boursières sont-elles imposées pour un particulier en Suisse ?',
      options: ['Oui, à 30%', 'Oui, au taux du revenu', 'Non, elles sont exonérées', 'Seulement au-delà de 100 000 CHF'],
      correctIndex: 2,
      explanation: 'En Suisse, les plus-values sur titres sont exonérées d\'impôt pour les particuliers, à condition de ne pas être considéré comme négociant professionnel.'
    }
  },
  // NIVEAU 3 - SUISSE
  {
    id: 'ch-3-01',
    slug: 'optimisation-fiscale-avancee-ch',
    title: 'Optimisation fiscale avancée en Suisse',
    summary: 'Stratégies avancées pour optimiser sa fiscalité en Suisse.',
    category: 'fiscalite',
    level: 3,
    market: 'CH',
    readingTime: 12,
    xpReward: 50,
    sections: [
      {
        title: 'Le choix du canton et de la commune',
        content: `Le lieu de résidence est le **levier fiscal n°1** en Suisse.

**Comparaison charge fiscale (revenu 200 000 CHF, fortune 1M CHF) :**
| Lieu | Impôt revenu | Impôt fortune | Total |
|------|--------------|---------------|-------|
| Zoug (Baar) | 25 000 | 2 000 | 27 000 |
| Schwyz | 28 000 | 2 500 | 30 500 |
| Zurich (Zollikon) | 38 000 | 4 000 | 42 000 |
| Genève (Genève) | 50 000 | 7 000 | 57 000 |
| Neuchâtel | 55 000 | 8 000 | 63 000 |

**Économie Zoug vs Genève : 30 000 CHF/an** !

**Mais attention aux compromis :**
• Qualité de vie et services
• Emploi et déplacements
• École et famille
• Immobilier (parfois plus cher en zone fiscale avantageuse)`
      },
      {
        title: 'Timing des revenus et dépenses',
        content: `**Principe de l\'année fiscale :**
En Suisse, c'est le système "postnumerando" : vous déclarez les revenus de l'année N en année N+1.

**Optimisations possibles :**

**1. Étaler les rachats LPP :**
• Plutôt que 100k d'un coup, 20k × 5 ans
• Évite de "perdre" de la progressivité

**2. Regrouper les travaux immobiliers :**
• Année 1 : travaux importants → déficit
• Années suivantes : pas de travaux → revenus normaux

**3. Timing des bonus/gratifications :**
• Si possible, décaler entre années fiscales
• Utile avant déménagement dans un canton moins taxé

**4. Report de vente immobilière :**
• L'impôt sur les gains immobiliers diminue avec le temps
• Attendre peut économiser des dizaines de milliers de francs`
      },
      {
        title: 'Structures de détention',
        content: `**Société holding suisse :**
• Exonération des dividendes (participation qualifying)
• Imposition réduite des plus-values
• Intéressant pour les entrepreneurs

**Fondation de famille (Liechtenstein) :**
• Planification successorale
• Protection des actifs
• Complexité et coûts élevés

**Forfait fiscal (imposition d'après la dépense) :**
• Réservé aux étrangers sans activité lucrative en Suisse
• Base d'imposition = dépenses du train de vie
• Minimum ~400 000 CHF de base imposable
• En voie de disparition (aboli dans certains cantons)

**Trust :**
• Non reconnu fiscalement en Suisse
• Mais résidents peuvent être bénéficiaires de trusts étrangers
• Complexité juridique et fiscale`
      },
      {
        title: 'Planification de la retraite',
        content: `**Optimiser la sortie du 2e pilier :**

**Capital vs Rente ?**
| Critère | Capital | Rente |
|---------|---------|-------|
| Flexibilité | ✅ Totale | ❌ Fixe |
| Fiscalité sortie | ~5-10% | Revenu ordinaire |
| Transmission | ✅ Héritiers | ❌ Caisse |
| Risque longévité | Vous | Caisse |
| Rendement | À gérer | Garanti ~5% |

**Stratégie mixte souvent optimale :**
• Rente pour couvrir les besoins de base
• Capital pour la flexibilité et la transmission

**Échelonner les retraits :**
• 2e pilier : possibilité de retrait jusqu'à 5 ans avant l'AVS
• Pilier 3a : retrait 5 ans avant l'AVS possible
• Étaler sur plusieurs années fiscales = économie d'impôt

**Déménagement fiscal avant retraite :**
Certains déménagent dans un canton à faible imposition juste avant les retraits (Schwyz, Zoug, Appenzell).`
      }
    ],
    definitions: [
      { term: 'Postnumerando', definition: 'Système où les impôts sont déclarés et payés l\'année suivant celle des revenus.' },
      { term: 'Forfait fiscal', definition: 'Imposition basée sur les dépenses plutôt que sur le revenu, réservée aux étrangers fortunés.' },
      { term: 'Participation qualifying', definition: 'Participation d\'au moins 10% dans une société, donnant droit à des avantages fiscaux.' }
    ],
    keyPoints: [
      'Le canton/commune de résidence est le levier fiscal principal',
      'Étaler les revenus exceptionnels et rachats sur plusieurs années',
      'Planifier les retraits de prévoyance avec soin',
      'Le forfait fiscal n\'est plus accessible partout'
    ],
    quiz: {
      question: 'Quelle est l\'économie fiscale potentielle en habitant à Zoug plutôt qu\'à Genève pour un revenu de 200 000 CHF ?',
      options: ['5 000 CHF/an', '15 000 CHF/an', '30 000 CHF/an', '50 000 CHF/an'],
      correctIndex: 2,
      explanation: 'La différence de charge fiscale entre Zoug et Genève peut atteindre 30 000 CHF par an pour un revenu de 200 000 CHF, ce qui justifie pour certains un déménagement.'
    }
  },
  {
    id: 'ch-3-02',
    slug: 'frontaliers-fiscalite',
    title: 'La fiscalité des frontaliers',
    summary: 'Comprendre les règles fiscales applicables aux travailleurs frontaliers.',
    category: 'fiscalite',
    level: 3,
    market: 'CH',
    readingTime: 11,
    xpReward: 45,
    sections: [
      {
        title: 'Les différents statuts',
        content: `**Frontalier au sens strict :**
• Réside dans la zone frontalière (France, Allemagne, Italie)
• Rentre chez soi quotidiennement (ou quasi)
• Détient le permis G

**Régimes fiscaux selon le canton de travail :**

| Canton | Imposition | Particularités |
|--------|------------|----------------|
| Genève | France | Compensation de 3,5% à Genève |
| Vaud, Valais, Neuchâtel... | Suisse | Impôt à la source suisse |
| Bâle-Ville | Allemagne | Imposition en Allemagne |
| Tessin | Double | Règles complexes |

**Attention :**
• Les règles ont évolué (accord 2023 France-Suisse)
• La situation personnelle peut changer le régime
• Consulter un spécialiste en cas de doute`
      },
      {
        title: 'Frontaliers Genève → France',
        content: `**Principe :**
Vous êtes imposé en France sur vos revenus suisses.

**Démarches :**
• Attestation de résidence fiscale française
• Déclaration des revenus suisses en France
• Conversion CHF → EUR au cours de l'année

**Avantages :**
• Prévoyance suisse (LPP, 3a) déductible partiellement
• Convention fiscale évite la double imposition

**Points d'attention :**
• Change EUR/CHF impacte le revenu déclaré
• Cotisations sociales françaises (CMU) sur revenus suisses
• Déclaration des comptes suisses (3916)

**Exemple :**
• Salaire : 100 000 CHF → ~90 000 EUR
• Impôt français : ~18 000 EUR
• CMU (~8%) : ~7 200 EUR
• Charge totale : ~25 200 EUR (~28%)`
      },
      {
        title: 'Frontaliers autres cantons',
        content: `**Imposition à la source en Suisse :**
Pour Vaud, Valais, Neuchâtel, Berne, etc.

**Fonctionnement :**
• Prélèvement à la source par l'employeur
• Barème spécifique frontalier
• Déclaration France : revenus déjà imposés (crédit d'impôt)

**Barème source (exemple Vaud, célibataire) :**
| Revenu mensuel | Taux source |
|----------------|-------------|
| 5 000 CHF | 8% |
| 8 000 CHF | 13% |
| 12 000 CHF | 18% |
| 20 000 CHF | 23% |

**Récupération des déductions :**
• Possible de demander une taxation ordinaire ultérieure
• Si charges (3a, pension alimentaire...) > 50% du barème
• Ou si revenus mondiaux > 120 000 CHF`
      },
      {
        title: 'Optimisation pour frontaliers',
        content: `**Prévoyance :**
1. Cotiser au pilier 3a (déductible en Suisse)
2. Rachats LPP (si imposé à la source)
3. Attention : déductibilité en France limitée

**Immobilier :**
• Achat en France : crédit français classique
• Achat en Suisse : restrictions pour frontaliers
• LPP utilisable pour achat en France ? Complexe.

**Planification du retour/retraite :**
• Retrait LPP/3a : imposition à la source suisse
• Puis déclaration en France (crédit d'impôt)
• Timing important (année de retraite)

**Erreurs fréquentes :**
• Ne pas déclarer le 3a en France
• Oublier de déclarer les comptes suisses
• Mal calculer la conversion CHF/EUR
• Ne pas demander la taxation ordinaire si avantageuse`
      }
    ],
    definitions: [
      { term: 'Permis G', definition: 'Autorisation de travail pour les frontaliers résidant dans un pays voisin.' },
      { term: 'Impôt à la source', definition: 'Prélèvement fiscal directement sur le salaire par l\'employeur.' },
      { term: 'CMU frontalier', definition: 'Couverture Maladie Universelle pour les frontaliers travaillant en Suisse.' }
    ],
    keyPoints: [
      'Le régime fiscal dépend du canton de travail',
      'Genève : imposition en France avec compensation',
      'Autres cantons : impôt à la source suisse',
      'Toujours déclarer comptes et revenus suisses en France'
    ],
    quiz: {
      question: 'Où sont imposés les frontaliers travaillant à Genève ?',
      options: ['En Suisse uniquement', 'En France uniquement', 'Dans les deux pays', 'Au choix du contribuable'],
      correctIndex: 1,
      explanation: 'Les frontaliers travaillant à Genève sont imposés en France sur leurs revenus suisses. Genève verse une compensation de 3,5% des salaires aux départements français frontaliers.'
    }
  },
  {
    id: 'ch-3-03',
    slug: 'transmission-suisse',
    title: 'La transmission de patrimoine en Suisse',
    summary: 'Optimiser la transmission de son patrimoine avec les outils juridiques suisses.',
    category: 'avance',
    level: 3,
    market: 'CH',
    readingTime: 13,
    xpReward: 50,
    sections: [
      {
        title: 'Droits de succession en Suisse',
        content: `Les droits de succession varient **fortement selon le canton** et le lien de parenté.

**Ligne directe (enfants, parents) :**
• Majorité des cantons : **exonération totale**
• Exceptions : Vaud, Neuchâtel (taux réduits)
• Appenzell Rh.-Int., Soleure : taux modérés

**Conjoint/partenaire :**
• Plupart des cantons : exonéré
• Quelques cantons : taux réduit

**Frères et sœurs :**
• Taux variables : 5-25%
• Certains cantons exonèrent

**Tiers (non-famille) :**
• Taux jusqu'à 40%+ selon canton

**Comparaison (succession 1M CHF aux enfants) :**
| Canton | Droits |
|--------|--------|
| Zurich | 0 CHF |
| Genève | 0 CHF |
| Vaud | ~6 000 CHF |
| Schwyz | 0 CHF |`
      },
      {
        title: 'Réserves héréditaires',
        content: `Le droit suisse prévoit des **réserves héréditaires** protégeant certains héritiers.

**Héritiers réservataires et leurs réserves (dès 2023) :**
| Héritier | Réserve (part de la succession) |
|----------|--------------------------------|
| Descendants | 50% de leur part légale |
| Conjoint | 50% de sa part légale |
| Parents | Supprimée depuis 2023 |

**Exemple (défunt avec conjoint et 2 enfants) :**
• Part légale conjoint : 50%
• Part légale enfants : 50% (25% chacun)
• Réserve conjoint : 25%
• Réserve enfants : 25% (12,5% chacun)
• **Quotité disponible : 50%**

**Ce que vous pouvez faire avec la quotité disponible :**
• Avantager un héritier
• Léguer à un tiers (association, ami)
• Créer une fondation`
      },
      {
        title: 'Outils de planification',
        content: `**1. Testament :**
• Olographe (manuscrit) ou authentique (notaire)
• Permet d'utiliser la quotité disponible
• Révocable à tout moment

**2. Pacte successoral :**
• Contrat entre le défunt futur et les héritiers
• Permet des renonciations aux réserves
• Irrévocable sans accord de toutes les parties

**3. Donation :**
• Avancement d'hoirie : imputable sur la part successorale
• Donation préciputaire : hors part (quotité disponible)
• Attention aux délais de rappel (5 ans dans certains cantons)

**4. Assurance-vie :**
• Le bénéficiaire reçoit hors succession
• Mais : intégrée au calcul des réserves
• Fiscalité avantageuse dans certains cantons

**5. Usufruit :**
• Donner la nue-propriété, garder l'usufruit
• Transmission progressive et optimisée`
      },
      {
        title: 'Stratégies avancées',
        content: `**Déménagement stratégique :**
Certains s'établissent dans un canton sans droits de succession avant leur décès.
• Attention : résidence effective requise
• Contrôles fiscaux possibles

**Entreprise familiale :**
• Transmission avec maintien de l'exploitation
• Réductions possibles dans certains cantons
• Pacte successoral pour planifier

**Résidents étrangers / binationaux :**
• Le droit applicable dépend du domicile
• Convention de La Haye : choix du droit possible
• Planification internationale complexe

**Cas des frontaliers décédant en France :**
• Droits de succession français applicables
• Convention France-Suisse à vérifier
• Patrimoine suisse inclus dans la succession française

**Conseil :**
La planification successorale suisse est relativement simple pour les familles, mais se complexifie pour les situations internationales. Un notaire ou avocat spécialisé est recommandé.`
      }
    ],
    definitions: [
      { term: 'Réserve héréditaire', definition: 'Part minimale de la succession revenant obligatoirement à certains héritiers.' },
      { term: 'Quotité disponible', definition: 'Part de la succession dont le défunt peut disposer librement.' },
      { term: 'Pacte successoral', definition: 'Contrat entre le futur défunt et ses héritiers organisant la succession.' }
    ],
    keyPoints: [
      'La ligne directe est exonérée dans la majorité des cantons',
      'Les réserves héréditaires ont été réduites en 2023',
      'Le pacte successoral permet une planification sur mesure',
      'Les situations internationales nécessitent un conseil spécialisé'
    ],
    quiz: {
      question: 'Dans la plupart des cantons suisses, quelle est la fiscalité successorale pour les enfants ?',
      options: ['20%', '10%', '5%', 'Exonération totale'],
      correctIndex: 3,
      explanation: 'Dans la majorité des cantons suisses, les successions en ligne directe (enfants, parents) sont totalement exonérées de droits de succession.'
    }
  }
];
