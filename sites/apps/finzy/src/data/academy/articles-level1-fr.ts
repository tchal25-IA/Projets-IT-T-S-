import type { AcademyArticle } from './types';

export const articlesLevel1FR: AcademyArticle[] = [
  {
    id: 'fr-1-01',
    slug: 'budget-bases',
    title: 'Les bases du budget personnel',
    summary: 'Apprenez à construire et gérer votre premier budget pour reprendre le contrôle de vos finances.',
    category: 'fondamentaux',
    level: 1,
    market: 'FR',
    readingTime: 8,
    xpReward: 25,
    sections: [
      {
        title: 'Pourquoi faire un budget ?',
        content: `Un budget est la pierre angulaire de toute gestion financière saine. Il vous permet de :
        
• **Visualiser** où va votre argent chaque mois
• **Identifier** les dépenses superflues
• **Planifier** vos objectifs d'épargne
• **Éviter** les découverts et les dettes

Sans budget, vous naviguez à l'aveugle. Avec un budget, vous prenez les commandes.`
      },
      {
        title: 'La règle 50/30/20',
        content: `Cette règle simple divise vos revenus nets en trois catégories :

**50% - Besoins essentiels**
Loyer, charges, alimentation, transports, assurances obligatoires

**30% - Envies et loisirs**
Sorties, shopping, abonnements, vacances

**20% - Épargne et remboursement de dettes**
Livret A, investissements, remboursement anticipé de crédits`,
        diagram: `┌─────────────────────────────────────┐
│           REVENUS NETS              │
│              100%                   │
└─────────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │  50%   │ │  30%   │ │  20%   │
    │Besoins │ │Envies  │ │Épargne │
    └────────┘ └────────┘ └────────┘`
      },
      {
        title: 'Comment construire son budget',
        content: `**Étape 1 : Listez vos revenus**
Salaire net, primes, aides (APL, allocations), revenus complémentaires

**Étape 2 : Listez vos charges fixes**
Loyer, électricité, téléphone, assurances, abonnements

**Étape 3 : Estimez vos charges variables**
Alimentation, transports, loisirs

**Étape 4 : Calculez le reste à vivre**
Revenus - Charges fixes - Charges variables = Capacité d'épargne

**Étape 5 : Suivez et ajustez**
Chaque mois, comparez le prévu au réel et ajustez.`
      }
    ],
    definitions: [
      { term: 'Revenus nets', definition: 'Montant que vous recevez après prélèvement des cotisations sociales et de l\'impôt à la source.' },
      { term: 'Charges fixes', definition: 'Dépenses récurrentes dont le montant est stable (loyer, abonnements).' },
      { term: 'Reste à vivre', definition: 'Somme disponible après paiement de toutes les charges obligatoires.' }
    ],
    examples: [
      {
        title: 'Budget de Marie, 2 200€ nets/mois',
        content: `• Loyer + charges : 750€ (34%)
• Alimentation : 300€ (14%)
• Transports : 80€ (4%)
• Assurances : 70€ (3%)
• Téléphone/Internet : 50€ (2%)
• Loisirs : 300€ (14%)
• Épargne : 500€ (23%)
• Reste : 150€ (7%)`
      }
    ],
    keyPoints: [
      'Un budget permet de reprendre le contrôle de ses finances',
      'La règle 50/30/20 est un bon point de départ',
      'Suivre son budget chaque mois est essentiel',
      'L\'épargne doit être une priorité, pas un reste'
    ],
    quiz: {
      question: 'Dans la règle 50/30/20, à quoi correspondent les 20% ?',
      options: ['Les besoins essentiels', 'Les loisirs', 'L\'épargne et remboursement de dettes', 'Les impôts'],
      correctIndex: 2,
      explanation: 'Les 20% sont dédiés à l\'épargne et au remboursement des dettes, c\'est la partie "se payer en premier".'
    }
  },
  {
    id: 'fr-1-02',
    slug: 'fonds-urgence',
    title: 'Constituer son fonds d\'urgence',
    summary: 'Découvrez pourquoi et comment créer une épargne de précaution pour faire face aux imprévus.',
    category: 'epargne',
    level: 1,
    market: 'FR',
    readingTime: 6,
    xpReward: 20,
    sections: [
      {
        title: 'Qu\'est-ce qu\'un fonds d\'urgence ?',
        content: `Le fonds d'urgence est une réserve d'argent facilement accessible pour faire face aux imprévus de la vie :

• Perte d'emploi
• Réparation voiture urgente
• Problème de santé
• Appareil électroménager en panne
• Dépense imprévue

C'est votre **filet de sécurité financier**. Sans lui, un imprévu peut vous pousser vers le crédit à la consommation ou le découvert.`
      },
      {
        title: 'Combien mettre de côté ?',
        content: `La recommandation standard est de **3 à 6 mois de dépenses** :

**3 mois** suffisent si :
• Vous êtes en CDI stable
• Vous vivez en couple avec deux revenus
• Vous avez peu de charges fixes

**6 mois** sont préférables si :
• Vous êtes indépendant ou en CDD
• Vous êtes seul(e) avec des enfants
• Vous avez un crédit immobilier

**Exemple concret :**
Dépenses mensuelles = 2 000€
Fonds d'urgence recommandé = 6 000€ à 12 000€`
      },
      {
        title: 'Où placer son fonds d\'urgence ?',
        content: `Le fonds d'urgence doit être :
✅ **Disponible immédiatement** (pas de blocage)
✅ **Sans risque** (capital garanti)
✅ **Séparé** de votre compte courant

**Placements recommandés en France :**

| Placement | Taux 2024 | Plafond |
|-----------|-----------|---------|
| Livret A | 3% | 22 950€ |
| LDDS | 3% | 12 000€ |
| LEP* | 5% | 10 000€ |

*LEP réservé aux revenus modestes`
      }
    ],
    definitions: [
      { term: 'Livret A', definition: 'Compte d\'épargne réglementé, défiscalisé, disponible dans toutes les banques françaises.' },
      { term: 'LDDS', definition: 'Livret de Développement Durable et Solidaire, même taux que le Livret A.' },
      { term: 'LEP', definition: 'Livret d\'Épargne Populaire, réservé aux revenus modestes avec un taux bonifié.' }
    ],
    keyPoints: [
      'Le fonds d\'urgence protège des imprévus sans recourir au crédit',
      'Viser 3 à 6 mois de dépenses selon votre situation',
      'Utiliser des livrets réglementés (Livret A, LDDS, LEP)',
      'Ne jamais toucher à ce fonds sauf vraie urgence'
    ],
    quiz: {
      question: 'Quel est le montant recommandé pour un fonds d\'urgence ?',
      options: ['1 mois de salaire', '3 à 6 mois de dépenses', '1 an de revenus', '10 000€ fixe'],
      correctIndex: 1,
      explanation: 'On recommande 3 à 6 mois de dépenses (pas de salaire) pour couvrir les imprévus.'
    }
  },
  {
    id: 'fr-1-03',
    slug: 'entree-vie-active',
    title: 'Bien démarrer sa vie active',
    summary: 'Les premières étapes financières quand on commence à travailler : salaire, impôts, épargne.',
    category: 'vie-quotidienne',
    level: 1,
    market: 'FR',
    readingTime: 10,
    xpReward: 30,
    sections: [
      {
        title: 'Comprendre sa fiche de paie',
        content: `Votre fiche de paie contient plusieurs informations essentielles :

**Salaire brut** → Ce que l'employeur verse
**Cotisations salariales** (~22%) → Retraite, chômage, santé
**Salaire net avant impôt** → Brut - Cotisations
**Prélèvement à la source** → Impôt sur le revenu
**Salaire net à payer** → Ce qui arrive sur votre compte

**Formule approximative :**
Net ≈ Brut × 0.78 (avant impôt)
Net après impôt ≈ Brut × 0.70 à 0.75 (selon votre TMI)`
      },
      {
        title: 'Les premières démarches',
        content: `**À faire dans les premiers mois :**

1️⃣ **Ouvrir un Livret A** si vous n'en avez pas
2️⃣ **Mettre en place un virement automatique** d'épargne
3️⃣ **Vérifier votre taux d'imposition** sur impots.gouv.fr
4️⃣ **Souscrire une complémentaire santé** (si pas fournie par l'employeur)
5️⃣ **Vérifier vos droits** : tickets restaurant, transport, CE

**Dans la première année :**
• Constituer votre fonds d'urgence (3 mois)
• Ouvrir un PEA (pour prendre date)
• Ouvrir une assurance-vie (pour prendre date)`
      },
      {
        title: 'Éviter les pièges du débutant',
        content: `**❌ Les erreurs classiques :**

• Dépenser tout son premier salaire
• S'endetter pour une voiture neuve
• Souscrire des crédits à la consommation
• Ne pas épargner "parce qu'on a le temps"
• Ignorer sa fiche de paie et ses droits

**✅ Les bons réflexes :**

• Épargner dès le 1er mois (même 50€)
• Vivre en dessous de ses moyens
• Éviter les achats impulsifs
• Se former à la finance personnelle
• Profiter des avantages employeur (PEE, intéressement)`
      }
    ],
    definitions: [
      { term: 'Salaire brut', definition: 'Rémunération totale avant déduction des cotisations sociales.' },
      { term: 'Cotisations sociales', definition: 'Prélèvements finançant la protection sociale (retraite, santé, chômage).' },
      { term: 'TMI', definition: 'Taux Marginal d\'Imposition - le taux appliqué à la dernière tranche de revenus.' },
      { term: 'PEE', definition: 'Plan d\'Épargne Entreprise - épargne salariale avec abondement employeur.' }
    ],
    keyPoints: [
      'Net ≈ 78% du brut avant impôt',
      'Épargner dès le premier salaire, même peu',
      'Ouvrir rapidement Livret A, PEA et assurance-vie',
      'Éviter les crédits à la consommation'
    ],
    quiz: {
      question: 'Quel pourcentage du salaire brut représente environ le salaire net avant impôt ?',
      options: ['90%', '78%', '65%', '50%'],
      correctIndex: 1,
      explanation: 'Les cotisations salariales représentent environ 22%, donc le net avant impôt ≈ 78% du brut.'
    }
  },
  {
    id: 'fr-1-04',
    slug: 'dette-credit',
    title: 'Comprendre la dette et le crédit',
    summary: 'Bonne dette vs mauvaise dette : apprenez à utiliser le crédit intelligemment.',
    category: 'fondamentaux',
    level: 1,
    market: 'FR',
    readingTime: 7,
    xpReward: 25,
    sections: [
      {
        title: 'Toutes les dettes ne se valent pas',
        content: `Il existe deux types de dettes :

**✅ La "bonne" dette**
• Finance un actif qui prend de la valeur ou génère des revenus
• Exemples : crédit immobilier (résidence principale ou locatif)
• Taux généralement bas, déductible fiscalement parfois

**❌ La "mauvaise" dette**
• Finance des biens qui perdent de la valeur
• Exemples : crédit auto, crédit conso, découvert
• Taux élevés, aucun avantage fiscal
• À éviter ou rembourser en priorité`
      },
      {
        title: 'Le coût réel du crédit',
        content: `Le **TAEG** (Taux Annuel Effectif Global) inclut tous les frais :
• Intérêts
• Frais de dossier
• Assurance emprunteur
• Frais de garantie

**Exemple - Crédit auto 15 000€ sur 5 ans à 7% :**
• Mensualité : 297€
• Total remboursé : 17 820€
• **Coût du crédit : 2 820€** (19% du montant emprunté !)

**Comparaison des taux moyens 2024 :**
| Type | TAEG moyen |
|------|------------|
| Immobilier | 3-4% |
| Auto | 5-8% |
| Conso | 6-15% |
| Revolving | 15-21% |
| Découvert | 16-20% |`
      },
      {
        title: 'La règle d\'or : le taux d\'endettement',
        content: `**Ne jamais dépasser 35% d'endettement**

Cette règle, imposée par le HCSF depuis 2022, protège les emprunteurs.

**Calcul :**
Taux d'endettement = (Mensualités crédits / Revenus nets) × 100

**Exemple :**
• Revenus nets : 3 000€
• Mensualité crédit immo : 800€
• Mensualité crédit auto : 200€
• Taux d'endettement = (1 000 / 3 000) × 100 = **33%** ✅

Au-delà de 35%, les banques refuseront généralement de vous prêter.`
      }
    ],
    definitions: [
      { term: 'TAEG', definition: 'Taux Annuel Effectif Global - coût total du crédit exprimé en pourcentage annuel.' },
      { term: 'Crédit revolving', definition: 'Réserve d\'argent renouvelable à taux très élevé, à éviter absolument.' },
      { term: 'HCSF', definition: 'Haut Conseil de Stabilité Financière - régulateur qui fixe les règles du crédit.' }
    ],
    keyPoints: [
      'Bonne dette = finance un actif productif',
      'Mauvaise dette = finance des biens qui se déprécient',
      'Le TAEG révèle le vrai coût du crédit',
      'Ne jamais dépasser 35% d\'endettement'
    ],
    quiz: {
      question: 'Quel est le taux d\'endettement maximum recommandé en France ?',
      options: ['25%', '35%', '50%', 'Il n\'y a pas de limite'],
      correctIndex: 1,
      explanation: 'Le HCSF impose un taux d\'endettement maximum de 35% pour les crédits immobiliers depuis 2022.'
    }
  },
  {
    id: 'fr-1-05',
    slug: 'livrets-epargne',
    title: 'Les livrets d\'épargne réglementés',
    summary: 'Livret A, LDDS, LEP : comprendre et optimiser l\'épargne sans risque.',
    category: 'epargne',
    level: 1,
    market: 'FR',
    readingTime: 6,
    xpReward: 20,
    sections: [
      {
        title: 'Panorama des livrets réglementés',
        content: `Les livrets réglementés sont des placements **sans risque, défiscalisés et disponibles** :

| Livret | Taux | Plafond | Conditions |
|--------|------|---------|------------|
| Livret A | 3% | 22 950€ | Aucune |
| LDDS | 3% | 12 000€ | Majeur |
| LEP | 5% | 10 000€ | Revenus modestes |
| Livret Jeune | ≥3% | 1 600€ | 12-25 ans |

**Avantages communs :**
• Capital garanti par l'État
• Intérêts exonérés d'impôt
• Disponibilité immédiate
• Pas de frais`
      },
      {
        title: 'Stratégie d\'utilisation optimale',
        content: `**Ordre de priorité pour remplir ses livrets :**

1️⃣ **LEP** (si éligible) → Meilleur taux (5%)
2️⃣ **Livret A** → Base de l'épargne de précaution
3️⃣ **LDDS** → Complément du Livret A
4️⃣ **Livret Jeune** → Si moins de 25 ans

**Une fois les livrets pleins :**
• Fonds euros en assurance-vie
• Comptes à terme
• Investissement long terme (PEA, etc.)

**Astuce :** Les intérêts sont calculés par quinzaine. Versez avant le 1er ou le 16 du mois !`
      },
      {
        title: 'Le LEP : le livret oublié',
        content: `Le Livret d'Épargne Populaire est souvent méconnu, pourtant c'est le **meilleur placement sans risque** !

**Conditions d'éligibilité (revenus 2023 pour 2024) :**
• 1 part fiscale : 22 419€
• 2 parts : 34 393€
• 3 parts : 43 755€

**Vérifiez votre éligibilité sur impots.gouv.fr**

Si vous êtes éligible, c'est **2% de plus** que le Livret A sur 10 000€, soit **200€/an de gains supplémentaires** !`
      }
    ],
    definitions: [
      { term: 'Livret réglementé', definition: 'Compte d\'épargne dont le taux et les conditions sont fixés par l\'État.' },
      { term: 'Défiscalisé', definition: 'Les intérêts ne sont pas soumis à l\'impôt sur le revenu ni aux prélèvements sociaux.' },
      { term: 'Quinzaine', definition: 'Période de 15 jours utilisée pour le calcul des intérêts des livrets.' }
    ],
    keyPoints: [
      'Les livrets réglementés sont sans risque et défiscalisés',
      'Prioriser le LEP si éligible (meilleur taux)',
      'Remplir dans l\'ordre : LEP > Livret A > LDDS',
      'Verser avant le 1er ou le 16 pour optimiser les intérêts'
    ],
    quiz: {
      question: 'Quel livret offre le meilleur taux en 2024 ?',
      options: ['Livret A', 'LDDS', 'LEP', 'Livret Jeune'],
      correctIndex: 2,
      explanation: 'Le LEP offre 5% contre 3% pour le Livret A et le LDDS, mais il est réservé aux revenus modestes.'
    }
  },
  {
    id: 'fr-1-06',
    slug: 'impot-revenu-bases',
    title: 'L\'impôt sur le revenu : les bases',
    summary: 'Comprendre le fonctionnement de l\'impôt sur le revenu et les tranches d\'imposition.',
    category: 'fiscalite',
    level: 1,
    market: 'FR',
    readingTime: 8,
    xpReward: 25,
    sections: [
      {
        title: 'Le barème progressif',
        content: `L'impôt sur le revenu est **progressif** : plus vous gagnez, plus le taux augmente.

**Barème 2024 (revenus 2023) :**

| Tranche | Taux |
|---------|------|
| 0€ à 11 294€ | 0% |
| 11 294€ à 28 797€ | 11% |
| 28 797€ à 82 341€ | 30% |
| 82 341€ à 177 106€ | 41% |
| Au-delà | 45% |

⚠️ **Attention** : seule la partie du revenu dans chaque tranche est imposée à ce taux, pas la totalité !`
      },
      {
        title: 'Exemple de calcul',
        content: `**Revenu net imposable : 40 000€**

| Tranche | Calcul | Impôt |
|---------|--------|-------|
| 0-11 294€ | 11 294 × 0% | 0€ |
| 11 294-28 797€ | 17 503 × 11% | 1 925€ |
| 28 797-40 000€ | 11 203 × 30% | 3 361€ |
| **Total** | | **5 286€** |

**Taux moyen** = 5 286 / 40 000 = **13,2%**
**TMI** (Taux Marginal) = **30%**

Le TMI s'applique à chaque euro supplémentaire gagné.`
      },
      {
        title: 'Le quotient familial',
        content: `Le quotient familial divise le revenu par le nombre de parts fiscales :

**Parts fiscales :**
• Célibataire : 1 part
• Couple marié/pacsé : 2 parts
• 1er et 2ème enfant : +0,5 part chacun
• 3ème enfant et suivants : +1 part chacun

**Exemple :**
Couple avec 2 enfants = 2 + 0,5 + 0,5 = **3 parts**

Revenu 60 000€ → Quotient = 60 000 / 3 = 20 000€
L'impôt est calculé sur 20 000€, puis multiplié par 3.

Le quotient familial est **plafonné** : l'avantage fiscal est limité à environ 1 750€ par demi-part.`
      }
    ],
    definitions: [
      { term: 'TMI', definition: 'Taux Marginal d\'Imposition - taux appliqué au dernier euro gagné.' },
      { term: 'Quotient familial', definition: 'Mécanisme qui divise le revenu par le nombre de parts pour réduire l\'impôt des familles.' },
      { term: 'Revenu net imposable', definition: 'Revenu après abattements et déductions, base de calcul de l\'impôt.' }
    ],
    keyPoints: [
      'L\'impôt est progressif par tranches',
      'Le TMI est le taux de la dernière tranche atteinte',
      'Le quotient familial réduit l\'impôt des familles',
      'Taux moyen ≠ TMI'
    ],
    quiz: {
      question: 'Si votre TMI est de 30%, combien payez-vous d\'impôt sur 100€ de revenus supplémentaires ?',
      options: ['0€', '11€', '30€', 'Cela dépend du revenu total'],
      correctIndex: 2,
      explanation: 'Le TMI (Taux Marginal d\'Imposition) s\'applique à chaque euro supplémentaire. À 30% de TMI, 100€ de plus = 30€ d\'impôt en plus.'
    }
  },
  {
    id: 'fr-1-07',
    slug: 'interets-composes',
    title: 'La magie des intérêts composés',
    summary: 'Comprendre comment le temps et les intérêts composés font fructifier votre épargne.',
    category: 'investissement',
    level: 1,
    market: 'BOTH',
    readingTime: 6,
    xpReward: 20,
    sections: [
      {
        title: 'Intérêts simples vs composés',
        content: `**Intérêts simples :**
Les intérêts sont calculés uniquement sur le capital initial.
1 000€ à 5% = 50€/an, toujours.

**Intérêts composés :**
Les intérêts sont réinvestis et produisent eux-mêmes des intérêts.
• Année 1 : 1 000€ → 1 050€ (+50€)
• Année 2 : 1 050€ → 1 102,50€ (+52,50€)
• Année 3 : 1 102,50€ → 1 157,63€ (+55,13€)

**L'effet boule de neige** : plus le temps passe, plus les gains accélèrent.`
      },
      {
        title: 'La règle des 72',
        content: `Cette règle simple permet d'estimer le temps pour doubler son capital :

**Années pour doubler = 72 / Taux de rendement**

| Rendement | Temps pour doubler |
|-----------|-------------------|
| 3% | 24 ans |
| 5% | 14,4 ans |
| 7% | 10,3 ans |
| 10% | 7,2 ans |

**Exemple concret :**
10 000€ investis à 7% doublent tous les ~10 ans :
• 10 ans : 20 000€
• 20 ans : 40 000€
• 30 ans : 80 000€
• 40 ans : 160 000€`
      },
      {
        title: 'L\'importance de commencer tôt',
        content: `**Alice vs Bob :**

**Alice** commence à 25 ans :
• Investit 200€/mois pendant 10 ans (24 000€)
• Puis arrête et laisse fructifier jusqu'à 65 ans
• Rendement 7%/an
• **À 65 ans : ~400 000€**

**Bob** commence à 35 ans :
• Investit 200€/mois pendant 30 ans (72 000€)
• Rendement 7%/an
• **À 65 ans : ~250 000€**

Alice investit 3x moins mais gagne 60% de plus grâce au temps !`
      }
    ],
    definitions: [
      { term: 'Intérêts composés', definition: 'Intérêts calculés sur le capital + les intérêts accumulés.' },
      { term: 'Effet boule de neige', definition: 'Accélération exponentielle des gains grâce aux intérêts composés.' }
    ],
    keyPoints: [
      'Les intérêts composés = intérêts sur les intérêts',
      'Règle des 72 : années pour doubler = 72 / taux',
      'Commencer tôt est plus important qu\'investir beaucoup',
      'Le temps est le meilleur allié de l\'investisseur'
    ],
    quiz: {
      question: 'Avec un rendement de 6%, combien de temps faut-il pour doubler son capital ?',
      options: ['6 ans', '12 ans', '18 ans', '24 ans'],
      correctIndex: 1,
      explanation: 'Règle des 72 : 72 / 6 = 12 ans pour doubler son capital à 6% de rendement.'
    }
  },
  {
    id: 'fr-1-08',
    slug: 'bourse-introduction',
    title: 'Introduction à la bourse',
    summary: 'Découvrez le fonctionnement de la bourse et les différents types d\'investissements.',
    category: 'investissement',
    level: 1,
    market: 'BOTH',
    readingTime: 8,
    xpReward: 25,
    sections: [
      {
        title: 'Qu\'est-ce que la bourse ?',
        content: `La bourse est un **marché organisé** où s'échangent des titres financiers :

**Actions** : Parts de propriété d'une entreprise
→ Vous devenez copropriétaire de LVMH, Apple, etc.

**Obligations** : Prêts aux entreprises ou États
→ Vous prêtez de l'argent et recevez des intérêts

**ETF (Trackers)** : Paniers d'actions ou obligations
→ Vous investissez dans des dizaines/centaines de titres d'un coup

**Indices** : Mesures de la performance d'un marché
• CAC 40 : 40 plus grandes entreprises françaises
• S&P 500 : 500 plus grandes entreprises américaines
• MSCI World : ~1 500 entreprises mondiales`
      },
      {
        title: 'Risque et rendement',
        content: `En bourse, **risque et rendement sont liés** :

| Placement | Rendement moyen | Volatilité |
|-----------|-----------------|------------|
| Livret A | 3% | Nulle |
| Obligations | 3-5% | Faible |
| Actions monde | 7-8% | Moyenne |
| Actions émergentes | 8-10% | Élevée |
| Crypto | Variable | Très élevée |

**La diversification** réduit le risque sans réduire proportionnellement le rendement.

**L'horizon de placement** est crucial :
• Court terme (< 3 ans) : Livrets, fonds euros
• Moyen terme (3-8 ans) : Mixte prudent
• Long terme (> 8 ans) : Actions, ETF`
      },
      {
        title: 'Les erreurs du débutant',
        content: `**❌ À éviter :**

• **Timing le marché** : personne ne prédit les hausses/baisses
• **Vendre en panique** lors des baisses
• **Mettre tout sur une action** "sûre"
• **Suivre les "conseils" des réseaux sociaux**
• **Investir de l'argent dont on a besoin**

**✅ Les bons réflexes :**

• **Investir régulièrement** (DCA - Dollar Cost Averaging)
• **Diversifier** via les ETF
• **Garder un horizon long terme**
• **Ne pas regarder son portefeuille tous les jours**
• **Investir seulement l'argent dont on n'a pas besoin**`
      }
    ],
    definitions: [
      { term: 'Action', definition: 'Titre de propriété représentant une fraction du capital d\'une entreprise.' },
      { term: 'ETF', definition: 'Exchange Traded Fund - fonds négocié en bourse qui réplique un indice.' },
      { term: 'DCA', definition: 'Dollar Cost Averaging - investissement régulier d\'un montant fixe, peu importe le cours.' },
      { term: 'Volatilité', definition: 'Mesure de l\'amplitude des variations de prix d\'un actif.' }
    ],
    keyPoints: [
      'La bourse permet d\'investir dans des entreprises',
      'Risque et rendement sont corrélés',
      'La diversification réduit le risque',
      'L\'horizon long terme lisse les fluctuations'
    ],
    quiz: {
      question: 'Quel est le rendement historique moyen des actions mondiales sur le long terme ?',
      options: ['3-4%', '5-6%', '7-8%', '12-15%'],
      correctIndex: 2,
      explanation: 'Historiquement, les actions mondiales ont rapporté en moyenne 7-8% par an sur le long terme (avant inflation).'
    }
  },
  {
    id: 'fr-1-09',
    slug: 'immobilier-introduction',
    title: 'Introduction à l\'immobilier',
    summary: 'Les bases de l\'investissement immobilier : achat, location, avantages et inconvénients.',
    category: 'immobilier',
    level: 1,
    market: 'FR',
    readingTime: 7,
    xpReward: 25,
    sections: [
      {
        title: 'Résidence principale ou investissement ?',
        content: `**Résidence principale :**
✅ Pas de loyer à payer
✅ Plus-value exonérée d'impôt
✅ Sécurité du logement
❌ Pas de revenus générés
❌ Frais d'entretien, taxes
❌ Moins de mobilité professionnelle

**Investissement locatif :**
✅ Revenus réguliers (loyers)
✅ Constitution de patrimoine
✅ Effet de levier du crédit
❌ Gestion locative
❌ Risques (vacance, impayés)
❌ Fiscalité des revenus fonciers`
      },
      {
        title: 'Les indicateurs clés',
        content: `**Rendement brut :**
(Loyer annuel / Prix d'achat) × 100

**Rendement net :**
(Loyer - Charges - Taxes) / Prix total × 100

**Cashflow :**
Loyer - Mensualité crédit - Charges - Impôts

**Exemple :**
• Prix : 150 000€ + 12 000€ frais
• Loyer : 700€/mois = 8 400€/an
• Rendement brut : 8 400 / 150 000 = **5,6%**
• Après charges et impôts : ~3-4% net

**Objectif :** Viser un **cashflow positif** ou au minimum neutre.`
      },
      {
        title: 'L\'effet de levier',
        content: `L'immobilier permet d'investir avec l'argent de la banque :

**Sans levier (100% apport) :**
• Investissement : 100 000€
• Rendement 5% = 5 000€/an
• Rentabilité sur vos fonds : 5%

**Avec levier (20% apport, 80% crédit) :**
• Apport : 20 000€
• Crédit : 80 000€
• Rendement 5% = 5 000€/an
• Rentabilité sur vos fonds : **25%** !

⚠️ L'effet de levier amplifie aussi les pertes en cas de baisse.`
      }
    ],
    definitions: [
      { term: 'Rendement brut', definition: 'Rapport entre le loyer annuel et le prix d\'achat, avant charges.' },
      { term: 'Cashflow', definition: 'Différence entre les revenus locatifs et toutes les charges (crédit, taxes, gestion).' },
      { term: 'Effet de levier', definition: 'Utilisation de l\'endettement pour amplifier la rentabilité d\'un investissement.' }
    ],
    keyPoints: [
      'RP = sécurité, Locatif = revenus',
      'Viser un cashflow positif ou neutre',
      'L\'effet de levier amplifie gains ET pertes',
      'Calculer le rendement net, pas brut'
    ],
    quiz: {
      question: 'Un appartement à 200 000€ loué 800€/mois a un rendement brut de :',
      options: ['3,2%', '4,8%', '6%', '8%'],
      correctIndex: 1,
      explanation: 'Rendement brut = (800 × 12) / 200 000 = 9 600 / 200 000 = 4,8%'
    }
  },
  {
    id: 'fr-1-10',
    slug: 'inflation-pouvoir-achat',
    title: 'L\'inflation et le pouvoir d\'achat',
    summary: 'Comprendre l\'inflation et son impact sur votre épargne et vos investissements.',
    category: 'economie',
    level: 1,
    market: 'BOTH',
    readingTime: 6,
    xpReward: 20,
    sections: [
      {
        title: 'Qu\'est-ce que l\'inflation ?',
        content: `L'inflation est la **hausse générale des prix** dans l'économie.

**Conséquences :**
• 100€ aujourd'hui achètent moins qu'il y a 10 ans
• Votre épargne "fond" si elle ne rapporte pas assez
• Les salaires doivent suivre pour maintenir le niveau de vie

**Inflation en France :**
• 2020 : 0,5%
• 2021 : 1,6%
• 2022 : 5,2%
• 2023 : 4,9%
• 2024 : ~2,5%

**Moyenne historique long terme :** ~2% par an`
      },
      {
        title: 'Impact sur l\'épargne',
        content: `**Rendement réel = Rendement nominal - Inflation**

| Placement | Taux | Inflation 3% | Rendement réel |
|-----------|------|--------------|----------------|
| Compte courant | 0% | 3% | **-3%** |
| Livret A | 3% | 3% | **0%** |
| Fonds euros | 2,5% | 3% | **-0,5%** |
| Actions | 7% | 3% | **+4%** |

**Règle importante :**
Si votre épargne rapporte moins que l'inflation, vous **perdez du pouvoir d'achat** même si le montant en euros augmente !`
      },
      {
        title: 'Se protéger de l\'inflation',
        content: `**Placements qui protègent :**
• Actions (les entreprises répercutent l'inflation)
• Immobilier (loyers indexés, valeur du bien)
• Matières premières (or, etc.)
• Obligations indexées sur l'inflation

**Placements vulnérables :**
• Liquidités sur compte courant
• Livrets à taux bas
• Obligations à taux fixe

**Stratégie recommandée :**
1. Garder le minimum en liquidités (fonds d'urgence)
2. Investir le reste en actifs "réels" (actions, immobilier)
3. Adapter sa stratégie selon son horizon de placement`
      }
    ],
    definitions: [
      { term: 'Inflation', definition: 'Hausse générale et durable du niveau des prix.' },
      { term: 'Pouvoir d\'achat', definition: 'Quantité de biens et services qu\'on peut acheter avec un revenu donné.' },
      { term: 'Rendement réel', definition: 'Rendement après déduction de l\'inflation.' }
    ],
    keyPoints: [
      'L\'inflation érode le pouvoir d\'achat',
      'Rendement réel = Rendement - Inflation',
      'L\'épargne sans rendement perd de la valeur',
      'Actions et immobilier protègent de l\'inflation'
    ],
    quiz: {
      question: 'Si le Livret A rapporte 3% et l\'inflation est de 4%, votre pouvoir d\'achat :',
      options: ['Augmente de 3%', 'Augmente de 1%', 'Reste stable', 'Diminue de 1%'],
      correctIndex: 3,
      explanation: 'Rendement réel = 3% - 4% = -1%. Votre pouvoir d\'achat diminue de 1% malgré les intérêts perçus.'
    }
  }
];
