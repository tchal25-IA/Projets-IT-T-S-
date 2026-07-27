import type { AcademyArticle } from './types';

export const articlesLevel3FR: AcademyArticle[] = [
  {
    id: 'fr-3-01',
    slug: 'lmnp-amortissement',
    title: 'LMNP : l\'art de l\'amortissement',
    summary: 'Maîtriser le régime LMNP au réel pour optimiser fiscalement vos locations meublées.',
    category: 'immobilier',
    level: 3,
    market: 'FR',
    readingTime: 12,
    xpReward: 50,
    sections: [
      {
        title: 'LMNP vs LMP : les statuts',
        content: `**Loueur Meublé Non Professionnel (LMNP) :**
• Revenus locatifs meublés < 23 000€/an
• OU revenus locatifs < revenus du foyer
• Régime fiscal BIC (micro ou réel)

**Loueur Meublé Professionnel (LMP) :**
• Revenus > 23 000€ ET > autres revenus
• Plus-values professionnelles (exonération possible après 5 ans)
• Déficit imputable sur revenu global
• Cotisations sociales (22-45%)

**La plupart des investisseurs sont LMNP** car le seuil LMP est rarement atteint.`
      },
      {
        title: 'La puissance de l\'amortissement',
        content: `L'amortissement permet de **déduire virtuellement la valeur du bien** sans sortie de trésorerie.

**Durées d'amortissement :**
• Bâti (gros œuvre) : 25-40 ans
• Installations (plomberie, électricité) : 15 ans
• Agencements (cuisine, salle de bain) : 10 ans
• Mobilier : 5-10 ans

**Exemple (bien à 200 000€) :**
| Composant | Valeur | Durée | Amortissement/an |
|-----------|--------|-------|------------------|
| Terrain | 40 000€ | - | 0€ |
| Gros œuvre | 100 000€ | 30 ans | 3 333€ |
| Second œuvre | 40 000€ | 15 ans | 2 667€ |
| Mobilier | 20 000€ | 7 ans | 2 857€ |
| **Total** | | | **8 857€/an** |

Cet amortissement vient **réduire le résultat imposable**.`
      },
      {
        title: 'Calcul du résultat fiscal',
        content: `**Revenus locatifs :** 10 000€/an

**Charges déductibles :**
• Intérêts d'emprunt : 2 500€
• Taxe foncière : 800€
• Charges copro : 600€
• Assurance : 200€
• Comptable : 500€
• Total charges : **4 600€**

**Amortissements :** 8 857€

**Calcul :**
• Résultat avant amortissement : 10 000 - 4 600 = 5 400€
• Amortissement imputable : min(8 857€, 5 400€) = **5 400€**
• **Résultat fiscal : 0€**
• Amortissement reportable : 8 857 - 5 400 = **3 457€**

→ **0€ d'impôt** sur les loyers !

⚠️ L'amortissement ne peut pas créer de déficit, seulement ramener le résultat à 0.`
      },
      {
        title: 'Points d\'attention LMNP',
        content: `**Avantages :**
• Loyers quasi exonérés d'impôt pendant des années
• Amortissement reportable sans limite
• Charges réelles déductibles
• Plus-value des particuliers à la revente

**Inconvénients :**
• Comptabilité obligatoire (300-600€/an)
• Déclaration complexe (liasse 2031 + 2033)
• Réforme 2024 : obligation de réintégrer les amortissements dans le calcul de la plus-value

**Réforme 2024 (PLF) :**
À la revente, les amortissements déduits seront réintégrés dans le calcul de la plus-value. Impact important sur la stratégie long terme !

**Conseils :**
• Faire appel à un expert-comptable spécialisé
• Conserver tous les justificatifs
• Anticiper la revente dans la stratégie`
      }
    ],
    definitions: [
      { term: 'Amortissement', definition: 'Constatation comptable de la dépréciation d\'un bien, déductible fiscalement.' },
      { term: 'BIC', definition: 'Bénéfices Industriels et Commerciaux - régime fiscal de la location meublée.' },
      { term: 'Amortissement reportable', definition: 'Part d\'amortissement non utilisée, reportable sur les années suivantes.' }
    ],
    keyPoints: [
      'L\'amortissement permet d\'avoir 0€ d\'impôt sur les loyers',
      'Il ne crée pas de déficit, seulement ramène à 0',
      'Réforme 2024 : impact sur la plus-value à la revente',
      'Comptable spécialisé indispensable'
    ],
    quiz: {
      question: 'Que se passe-t-il si l\'amortissement dépasse le bénéfice en LMNP ?',
      options: ['Il crée un déficit imputable sur le revenu global', 'Il est perdu', 'L\'excédent est reportable', 'Il génère un crédit d\'impôt'],
      correctIndex: 2,
      explanation: 'En LMNP, l\'amortissement ne peut pas créer de déficit. L\'excédent est reporté sur les années suivantes sans limite de temps.'
    }
  },
  {
    id: 'fr-3-02',
    slug: 'sci-is-ir',
    title: 'SCI : IS ou IR, le bon choix',
    summary: 'Comprendre les implications fiscales du choix entre SCI à l\'IR et SCI à l\'IS.',
    category: 'avance',
    level: 3,
    market: 'FR',
    readingTime: 14,
    xpReward: 55,
    sections: [
      {
        title: 'SCI à l\'IR (Impôt sur le Revenu)',
        content: `**Transparence fiscale :**
Les associés sont imposés directement sur leur quote-part de bénéfices (revenus fonciers).

**Avantages :**
• Régime des plus-values des particuliers (abattements pour durée)
• Exonération totale après 22 ans (IR) / 30 ans (PS)
• Pas de double imposition
• Simple à gérer

**Inconvénients :**
• Loyers imposés à l'IR + PS (~47% pour TMI 30%)
• Pas d'amortissement
• Déficit foncier limité à 10 700€/an

**Idéal pour :**
• Patrimoine personnel / familial
• Détention longue (>22 ans)
• Transmission`
      },
      {
        title: 'SCI à l\'IS (Impôt sur les Sociétés)',
        content: `**Opacité fiscale :**
La société est imposée sur son bénéfice, pas les associés.

**Avantages :**
• IS à 15% jusqu'à 42 500€, 25% au-delà
• Amortissement du bien (comme en LMNP)
• Charges déductibles élargies
• Trésorerie conservée en société

**Inconvénients :**
• Plus-value sur prix amorti à la revente
• Double imposition si distribution aux associés
• Comptabilité obligatoire
• Pas d'abattement pour durée

**Idéal pour :**
• Investissement "société" (réinvestissement)
• Rentiers constituant un patrimoine
• Détention courte/moyenne avec réinvestissement`
      },
      {
        title: 'Comparaison chiffrée',
        content: `**Scénario : Bien 200k€, loyers 12k€/an, charges 4k€**

**SCI à l'IR (TMI 30%) :**
• Bénéfice foncier : 8 000€
• Impôt : 8 000 × 47,2% = **3 776€/an**
• Trésorerie nette : 8 000 - 3 776 = 4 224€

**SCI à l'IS :**
• Bénéfice avant amortissement : 8 000€
• Amortissement : 5 000€
• Bénéfice imposable : 3 000€
• IS 15% : **450€/an**
• Trésorerie société : 8 000 - 450 = 7 550€

**Mais à la revente (après 20 ans, valeur 300k€) :**

**SCI IR :** Exonération totale (>22 ans)
**SCI IS :** PV = 300k - (200k - 100k amortis) = 200k → IS 25% = **50 000€** !`
      },
      {
        title: 'Stratégies avancées',
        content: `**Optimisation SCI IS :**
1. **Ne jamais vendre** : transmettre les parts
2. **Apport-cession** : apporter la SCI à une holding
3. **Réinvestissement perpétuel** : acheter d'autres biens

**Le schéma holding + SCI IS :**
• Holding détient SCI IS
• Dividendes remontent avec régime mère-fille (quasi 0% d'impôt)
• Réinvestissement via la holding
• Transmission des parts de holding

**Changement de régime fiscal :**
• IR → IS : possible à tout moment
• IS → IR : **impossible** (irréversible !)

**Conseil :** Bien réfléchir avant d'opter pour l'IS, c'est définitif !`
      }
    ],
    definitions: [
      { term: 'SCI', definition: 'Société Civile Immobilière - structure pour détenir de l\'immobilier à plusieurs.' },
      { term: 'Transparence fiscale', definition: 'Les associés sont imposés directement, pas la société.' },
      { term: 'Régime mère-fille', definition: 'Exonération des dividendes remontant d\'une filiale vers sa holding.' }
    ],
    keyPoints: [
      'SCI IR = plus-value des particuliers (abattements)',
      'SCI IS = amortissement mais plus-value sur valeur amortie',
      'IS avantageux pendant la détention, pénalisant à la revente',
      'Le passage à l\'IS est irréversible !'
    ],
    quiz: {
      question: 'Peut-on revenir à l\'IR après avoir opté pour l\'IS en SCI ?',
      options: ['Oui, à tout moment', 'Oui, après 5 ans', 'Oui, avec une pénalité', 'Non, c\'est irréversible'],
      correctIndex: 3,
      explanation: 'Le passage de l\'IR à l\'IS est irréversible. Une fois l\'option IS exercée, il est impossible de revenir à l\'IR.'
    }
  },
  {
    id: 'fr-3-03',
    slug: 'credit-lombard',
    title: 'Le crédit Lombard : emprunter sur ses actifs',
    summary: 'Utiliser son portefeuille comme garantie pour obtenir des liquidités sans vendre.',
    category: 'avance',
    level: 3,
    market: 'BOTH',
    readingTime: 10,
    xpReward: 45,
    sections: [
      {
        title: 'Qu\'est-ce que le crédit Lombard ?',
        content: `Le crédit Lombard est un **prêt garanti par des actifs financiers** (assurance-vie, PEA, compte-titres).

**Principe :**
• Vous possédez 500k€ en assurance-vie
• La banque vous prête 250k€ (50% de la valeur)
• Votre portefeuille reste investi
• Vous payez des intérêts (~2-4%)

**Avantages :**
• Pas de vente d'actifs (pas de fiscalité)
• Portefeuille continue de travailler
• Taux plus bas qu'un crédit conso
• Pas d'impact sur l'endettement immobilier
• Effet de levier sur son patrimoine`
      },
      {
        title: 'Les ratios d\'avance',
        content: `Le montant prêté dépend de la **qualité des actifs** en garantie :

| Type d'actif | Ratio d'avance |
|--------------|----------------|
| Fonds euros | 80-90% |
| Obligations IG | 70-80% |
| ETF World | 50-60% |
| Actions grandes caps | 50-60% |
| SCPI | 50-70% |
| Small caps | 30-40% |

**Exemple :**
• Assurance-vie : 200k€
• Composition : 50% fonds euros, 50% ETF
• Avance possible : (100k × 85%) + (100k × 55%) = **140 000€**

**Attention au margin call :**
Si les actifs baissent sous un seuil, vous devez rembourser ou apporter des garanties.`
      },
      {
        title: 'Utilisations du crédit Lombard',
        content: `**1. Achat immobilier sans toucher à ses placements**
• Utiliser le Lombard comme apport
• Garder son PEA/AV en croissance
• Rembourser progressivement

**2. Opportunité d'investissement**
• Marché baissier = occasion d'achat
• Emprunter pour investir plus
• Rembourser quand le marché remonte

**3. Gestion de trésorerie**
• Besoin ponctuel de liquidités
• Éviter de casser son PEA avant 5 ans
• Éviter la fiscalité d'un rachat AV

**4. Transmission**
• Créer une dette déductible de la succession
• Transmettre les actifs, pas la dette

**Exemple Buy Borrow Die :**
Stratégie américaine : acheter des actifs, emprunter dessus pour vivre, transmettre à la mort (pas d'imposition des plus-values latentes aux USA).`
      },
      {
        title: 'Risques et précautions',
        content: `**Risques :**
• **Margin call** : obligation de rembourser si baisse des actifs
• **Effet de levier inversé** : amplifie les pertes
• **Taux variable** : certains Lombards sont indexés
• **Blocage des actifs** : impossible de vendre pendant le prêt

**Précautions :**
1. Ne pas utiliser plus de 30-40% du ratio max
2. Conserver une marge de sécurité
3. Avoir des liquidités pour faire face à un appel de marge
4. Privilégier les actifs peu volatils en garantie

**Où souscrire :**
• Banques privées (à partir de 500k€)
• Certaines assurances-vie (Linxea, Boursorama)
• Lombard via courtiers (Interactive Brokers)

**Coût :** Euribor + 1-2% (soit ~4-5% en 2024)`
      }
    ],
    definitions: [
      { term: 'Crédit Lombard', definition: 'Prêt garanti par un portefeuille d\'actifs financiers.' },
      { term: 'Margin call', definition: 'Appel de marge - obligation d\'apporter des garanties supplémentaires si les actifs baissent.' },
      { term: 'Ratio d\'avance', definition: 'Pourcentage de la valeur des actifs que la banque accepte de prêter.' }
    ],
    keyPoints: [
      'Le Lombard permet d\'emprunter sans vendre ses actifs',
      'Ratio d\'avance : 50-90% selon le type d\'actif',
      'Attention au margin call si les marchés baissent',
      'Garder une marge de sécurité (30-40% du ratio max)'
    ],
    quiz: {
      question: 'Qu\'est-ce qu\'un margin call dans un crédit Lombard ?',
      options: ['Une demande de remboursement anticipé sans raison', 'Une obligation d\'apporter des garanties si les actifs baissent', 'Un bonus si les actifs montent', 'Un changement de taux'],
      correctIndex: 1,
      explanation: 'Le margin call survient quand la valeur des actifs en garantie baisse sous un seuil. L\'emprunteur doit alors rembourser partiellement ou apporter des garanties supplémentaires.'
    }
  },
  {
    id: 'fr-3-04',
    slug: 'holding-patrimoniale',
    title: 'La holding patrimoniale',
    summary: 'Structurer son patrimoine avec une holding pour optimiser fiscalité et transmission.',
    category: 'avance',
    level: 3,
    market: 'FR',
    readingTime: 15,
    xpReward: 60,
    sections: [
      {
        title: 'Qu\'est-ce qu\'une holding ?',
        content: `Une holding est une **société qui détient des participations** dans d'autres sociétés ou des actifs.

**Types de holding :**
• **Holding pure** : détient uniquement des participations
• **Holding animatrice** : participe à la gestion des filiales
• **Holding mixte** : activité propre + participations

**Formes juridiques :**
• SAS : souplesse, pas de capital minimum
• SARL : formalisme, protection du gérant
• SC (Société Civile) : pour l'immobilier

**Schéma classique :**
┌─────────────────────────┐
│    HOLDING (SAS)        │
│    Vous = associé       │
└────────────┬────────────┘
      │      │      │
┌─────▼─┐ ┌──▼──┐ ┌──▼──┐
│SCI 1  │ │SCI 2│ │ AV  │
└───────┘ └─────┘ └─────┘`
      },
      {
        title: 'Les avantages fiscaux',
        content: `**1. Régime mère-fille :**
Les dividendes remontant des filiales vers la holding sont exonérés à 95%.
• Filiale verse 100k€ de dividendes
• Holding imposée sur 5k€ seulement
• IS 15% = **750€** au lieu de 30 000€ (30% PFU)

**2. Intégration fiscale (si >95% détention) :**
Les bénéfices et pertes des filiales se compensent.

**3. Report d'imposition :**
La holding peut réinvestir sans distribuer aux associés (pas de PFU).

**4. Apport-cession :**
Apporter des titres à une holding permet de reporter l'imposition de la plus-value.

**5. Pacte Dutreil :**
Transmission des parts avec 75% d'abattement si engagement de conservation.`
      },
      {
        title: 'Cas pratique : apport-cession',
        content: `**Sans holding :**
• Vous vendez 1M€ d'actions (achetées 200k€)
• Plus-value : 800k€
• Impôt (PFU 30%) : **240 000€**
• Capital restant : 760 000€

**Avec holding (apport-cession 150-0 B ter) :**
1. Création d'une holding SAS
2. Apport de vos actions à la holding (report d'imposition)
3. La holding vend les actions : 1M€ sans impôt immédiat
4. Réinvestissement de 60% minimum dans une activité économique sous 2 ans
5. L'impôt est reporté (potentiellement jusqu'à la cession de la holding)

**Contraintes :**
• Réinvestir 60% (600k€) dans l'économique
• Conservation des parts holding 3 ans minimum
• Déclaration fiscale spécifique

**Résultat :** Vous gardez **1M€ à investir** au lieu de 760k€`
      },
      {
        title: 'Coûts et complexité',
        content: `**Coûts de création :**
• Avocat/juriste : 2 000-5 000€
• Apports initiaux : capital minimum (1€ en SAS)
• Formalités : 500-1 000€

**Coûts annuels :**
• Comptabilité : 1 500-3 000€
• Assemblées générales
• Déclarations fiscales spécifiques

**Seuil de rentabilité :**
La holding devient intéressante à partir de :
• Patrimoine > 500k€ en filiales
• Revenus passifs > 50k€/an
• Projet de transmission important

**Alternative pour les plus petits patrimoines :**
SC (Société Civile) familiale + démembrement

**Attention :** Une holding mal structurée peut coûter plus qu'elle ne rapporte. Toujours consulter un avocat fiscaliste avant de se lancer.`
      }
    ],
    definitions: [
      { term: 'Holding', definition: 'Société dont l\'objet est de détenir des participations dans d\'autres sociétés.' },
      { term: 'Régime mère-fille', definition: 'Exonération à 95% des dividendes remontant d\'une filiale vers sa holding.' },
      { term: 'Apport-cession', definition: 'Technique permettant de reporter l\'imposition d\'une plus-value en apportant les titres à une holding.' }
    ],
    keyPoints: [
      'La holding permet de réinvestir sans fiscalité immédiate',
      'Régime mère-fille : dividendes exonérés à 95%',
      'Apport-cession : report d\'impôt sous conditions',
      'Intéressant à partir de 500k€ de patrimoine'
    ],
    quiz: {
      question: 'Quel pourcentage des dividendes est exonéré dans le régime mère-fille ?',
      options: ['50%', '75%', '95%', '100%'],
      correctIndex: 2,
      explanation: 'Le régime mère-fille permet d\'exonérer 95% des dividendes remontant d\'une filiale (détenue à plus de 5%) vers la société mère.'
    }
  },
  {
    id: 'fr-3-05',
    slug: 'private-equity',
    title: 'Le Private Equity pour particuliers',
    summary: 'Investir dans des entreprises non cotées via les fonds de Private Equity.',
    category: 'avance',
    level: 3,
    market: 'BOTH',
    readingTime: 11,
    xpReward: 45,
    sections: [
      {
        title: 'Qu\'est-ce que le Private Equity ?',
        content: `Le Private Equity (capital-investissement) consiste à **investir dans des entreprises non cotées** pour les développer et les revendre avec plus-value.

**Les segments :**
• **Venture Capital** : Startups (risque très élevé)
• **Growth Equity** : Entreprises en croissance
• **Buyout (LBO)** : Rachat d'entreprises matures
• **Secondaire** : Rachat de parts existantes

**Performances historiques :**
• PE mondial : ~14% annualisé sur 20 ans
• Surperformance vs marchés actions : +3-5%/an
• Mais : illiquidité, dispersion des performances

**Accès historique :**
• Tickets élevés (100k€+)
• Réservé aux institutionnels
• Durée de blocage longue (7-10 ans)`
      },
      {
        title: 'Les véhicules accessibles',
        content: `**1. FCPR (Fonds Commun de Placement à Risques) :**
• 50% minimum en non coté
• Ticket : à partir de 1 000€
• Durée : 7-10 ans
• Fiscalité : exonération IR après 5 ans (hors PS)

**2. FCPI (Innovation) / FIP (Proximité) :**
• Réduction d'IR de 25% (plafonné)
• Investissement dans PME innovantes/régionales
• Ticket : 1 000€ minimum
• Blocage 5-7 ans

**3. Unités de compte en assurance-vie :**
• Altaroc, Eurazeo, Ardian via certains contrats
• Ticket : 10 000-50 000€
• Avantage : fiscalité AV

**4. Crowdfunding (Anaxago, Tudigo...) :**
• Ticket très faible (1 000€)
• Sélection de projets
• Risque élevé, illiquidité`
      },
      {
        title: 'Avantages et risques',
        content: `**Avantages :**
• Rendements potentiellement supérieurs aux marchés
• Décorrélation des marchés cotés
• Accès à des entreprises en croissance
• Diversification du portefeuille
• Avantages fiscaux (FCPI/FIP)

**Risques :**
• **Illiquidité totale** (5-10 ans de blocage)
• **Perte en capital** possible
• **Dispersion** : les bons fonds vs les mauvais
• **Frais élevés** (2% gestion + 20% performance)
• **Appels de fonds** progressifs
• **J-curve** : pertes initiales avant gains

**Règle de prudence :**
Maximum 5-10% du patrimoine financier en Private Equity.`
      },
      {
        title: 'Comment sélectionner un fonds ?',
        content: `**Critères de sélection :**

| Critère | Bon signe |
|---------|-----------|
| Track record | >3 fonds gérés, TRI >15% |
| Taille du fonds | 100M€ - 2Md€ (sweet spot) |
| Diversification | 10-15 entreprises minimum |
| Équipe | Stabilité, expérience sectorielle |
| Frais | Management <2%, carried <20% |

**Bonnes pratiques :**
1. Diversifier sur plusieurs fonds/millésimes
2. Prévoir la durée de blocage (10+ ans)
3. Ne pas compter sur ces fonds pour sa liquidité
4. Vérifier l'agrément AMF
5. Lire les rapports de due diligence

**Fonds accessibles réputés :**
• Altaroc Odyssey (via AV)
• Eurazeo Private Value Europe
• Ardian Secondaries

**Fonds fiscaux (FCPI/FIP) :**
• Verifier les frais totaux
• Performances très variables
• L'avantage fiscal ne doit pas être le seul critère`
      }
    ],
    definitions: [
      { term: 'Private Equity', definition: 'Investissement dans des entreprises non cotées en bourse.' },
      { term: 'TRI', definition: 'Taux de Rendement Interne - mesure la rentabilité d\'un investissement en tenant compte du timing des flux.' },
      { term: 'J-curve', definition: 'Courbe de rendement typique du PE : pertes initiales puis gains tardifs.' }
    ],
    keyPoints: [
      'PE = investissement en entreprises non cotées',
      'Rendements potentiellement >10% mais illiquidité totale',
      'Durée de blocage : 7-10 ans minimum',
      'Maximum 5-10% du portefeuille'
    ],
    quiz: {
      question: 'Qu\'est-ce que la J-curve en Private Equity ?',
      options: ['Une garantie de performance', 'Des pertes initiales suivies de gains tardifs', 'Un type de fonds spécifique', 'Une méthode de calcul des frais'],
      correctIndex: 1,
      explanation: 'La J-curve décrit le profil de rendement typique du PE : les premières années affichent des pertes (frais, investissements) avant que les plus-values ne se matérialisent.'
    }
  },
  {
    id: 'fr-3-06',
    slug: 'ifi-optimisation',
    title: 'L\'IFI et ses stratégies d\'optimisation',
    summary: 'Comprendre l\'Impôt sur la Fortune Immobilière et les moyens de l\'optimiser.',
    category: 'fiscalite',
    level: 3,
    market: 'FR',
    readingTime: 10,
    xpReward: 40,
    sections: [
      {
        title: 'Le fonctionnement de l\'IFI',
        content: `L'IFI (Impôt sur la Fortune Immobilière) taxe le **patrimoine immobilier net** > 1,3M€.

**Assiette taxable :**
• Résidence principale (abattement 30%)
• Résidences secondaires
• Biens locatifs
• Parts de SCI, SCPI, OPCI
• Immobilier via l'assurance-vie

**Non taxable :**
• Immobilier professionnel
• Bois et forêts (sous conditions)

**Barème 2024 :**
| Tranche | Taux |
|---------|------|
| 0 - 800 000€ | 0% |
| 800 000€ - 1,3M€ | 0,5% |
| 1,3M€ - 2,57M€ | 0,7% |
| 2,57M€ - 5M€ | 1% |
| 5M€ - 10M€ | 1,25% |
| > 10M€ | 1,5% |`
      },
      {
        title: 'Les dettes déductibles',
        content: `**Dettes déductibles à 100% :**
• Crédit immobilier (capital restant dû)
• Crédit travaux
• Dépôt de garantie locataires

**Dettes partiellement déductibles :**
• Crédit Lombard garanti par des titres : NON
• Prêt in fine : étalement sur la durée

**Exemple :**
• Patrimoine brut : 2M€
• Résidence principale : 800k€ → abattement 30% = 560k€
• Locatif : 1,2M€
• Total brut IFI : 1,76M€
• Crédit RP : -400k€
• Crédit locatif : -600k€
• **Net IFI : 760k€** → Pas d'IFI (seuil 1,3M€)

**Attention :** Les prêts familiaux sans intérêts sont scrutés par le fisc.`
      },
      {
        title: 'Stratégies d\'optimisation',
        content: `**1. Démembrement :**
• Nu-propriétaire : pas d'IFI
• Usufruitier : paie l'IFI
• Donation de la nue-propriété aux enfants

**2. Investir en immobilier professionnel :**
• Location meublée professionnelle (LMP)
• Locaux commerciaux exploités personnellement
• Exonération totale

**3. Arbitrage vers le financier :**
• Vendre de l'immobilier
• Investir en actions, ETF (hors IFI)
• Assurance-vie avec UC actions

**4. Crédit in fine :**
• Le capital reste dû jusqu'à l'échéance
• Déduit de l'IFI pendant toute la durée

**5. Donation avec charge :**
• Donner avec obligation de verser une rente
• Réduit la valeur taxable`
      },
      {
        title: 'Points d\'attention',
        content: `**Risques de redressement :**
• Sous-évaluation des biens
• Prêts familiaux fictifs
• Montages abusifs (donations temporaires)
• SCI sans activité réelle

**Évaluation des biens :**
• Valeur vénale au 1er janvier
• Décote pour occupation (20-30%)
• Décote pour indivision (10-20%)

**Plafonnement de l'IFI :**
L'IFI + IR ne peuvent dépasser 75% des revenus.
Si dépassement, réduction de l'IFI (mais pas en dessous d'un minimum).

**Déclaration :**
• Annexe à la déclaration de revenus
• Estimation des biens obligatoire
• Conservation des justificatifs 3 ans`
      }
    ],
    definitions: [
      { term: 'IFI', definition: 'Impôt sur la Fortune Immobilière - taxe le patrimoine immobilier net > 1,3M€.' },
      { term: 'Démembrement', definition: 'Séparation de la propriété entre nue-propriété et usufruit.' },
      { term: 'Prêt in fine', definition: 'Crédit où le capital est remboursé en une fois à l\'échéance.' }
    ],
    keyPoints: [
      'IFI sur patrimoine immobilier net > 1,3M€',
      'Abattement de 30% sur la résidence principale',
      'Les crédits immobiliers sont déductibles',
      'Le démembrement permet d\'optimiser l\'IFI'
    ],
    quiz: {
      question: 'Qui paie l\'IFI en cas de démembrement de propriété ?',
      options: ['Le nu-propriétaire', 'L\'usufruitier', 'Les deux à 50%', 'Aucun des deux'],
      correctIndex: 1,
      explanation: 'En cas de démembrement, c\'est l\'usufruitier qui est redevable de l\'IFI sur la valeur en pleine propriété du bien.'
    }
  },
  {
    id: 'fr-3-07',
    slug: 'transmission-patrimoine',
    title: 'Stratégies de transmission du patrimoine',
    summary: 'Optimiser la transmission de son patrimoine grâce aux outils juridiques et fiscaux.',
    category: 'avance',
    level: 3,
    market: 'FR',
    readingTime: 13,
    xpReward: 50,
    sections: [
      {
        title: 'Les abattements en vigueur',
        content: `**Donations et successions - Abattements :**

| Bénéficiaire | Abattement | Renouvellement |
|--------------|------------|----------------|
| Enfant | 100 000€ | Tous les 15 ans |
| Petit-enfant | 31 865€ | Tous les 15 ans |
| Conjoint/pacsé | Exonération totale | - |
| Frère/sœur | 15 932€ | Tous les 15 ans |

**Barème après abattement (ligne directe) :**
| Tranche | Taux |
|---------|------|
| 0 - 8 072€ | 5% |
| 8 072€ - 12 109€ | 10% |
| 12 109€ - 15 932€ | 15% |
| 15 932€ - 552 324€ | 20% |
| 552 324€ - 902 838€ | 30% |
| > 1 805 677€ | 45% |

**Exemple :** Donation de 300k€ à un enfant
Après abattement : 200k€
Droits : ~38 000€ (~13%)`
      },
      {
        title: 'Le démembrement de propriété',
        content: `**Principe :**
• **Nue-propriété** : droit de disposer du bien (à terme)
• **Usufruit** : droit d'utiliser le bien et d'en percevoir les revenus

**Valeur fiscale de la nue-propriété :**
| Âge de l'usufruitier | Valeur NP |
|----------------------|-----------|
| < 21 ans | 10% |
| 21-30 ans | 20% |
| 31-40 ans | 30% |
| 41-50 ans | 40% |
| 51-60 ans | 50% |
| 61-70 ans | 60% |
| 71-80 ans | 70% |
| 81-90 ans | 80% |
| > 90 ans | 90% |

**Exemple :**
• Bien de 500k€
• Parent de 55 ans donne la nue-propriété
• Valeur NP : 250k€ (50%)
• Dans l'abattement de 100k€ : reste 150k€ taxable
• Droits : ~27 000€
• Au décès : **reconstitution gratuite** de la pleine propriété !`
      },
      {
        title: 'L\'assurance-vie : l\'outil royal',
        content: `**Avantages successoraux :**
• Versements avant 70 ans : **152 500€** exonérés par bénéficiaire
• Au-delà : 20% jusqu'à 700k€, puis 31,25%
• Versements après 70 ans : **30 500€** exonérés (tous bénéficiaires confondus)
• Les plus-values sont exonérées !

**Exemple (versements avant 70 ans) :**
• Capital AV : 500k€ (dont 200k€ de plus-values)
• 2 enfants bénéficiaires
• Chacun reçoit 250k€
• Abattement : 152 500€ chacun
• Taxable : 97 500€ chacun
• Droits : 19 500€ chacun (20%)
• **Total succession AV : 39 000€** au lieu de ~100 000€ en ligne directe classique

**Stratégie :**
1. Maximiser les versements avant 70 ans
2. Désigner les bénéficiaires correctement
3. Réviser la clause bénéficiaire régulièrement`
      },
      {
        title: 'Outils avancés de transmission',
        content: `**1. Pacte Dutreil :**
Transmission d'entreprise avec 75% d'abattement
• Engagement de conservation 2 ans avant transmission
• Puis 4 ans par les héritiers
• Fonction de direction pendant 3 ans

**2. Donation-partage :**
• Fige la valeur des biens donnés
• Évite les rapports à la succession
• Égalité entre héritiers

**3. SCI familiale + démembrement :**
• Les parents gardent l'usufruit (loyers)
• Les enfants reçoivent la nue-propriété
• Transmission progressive et optimisée

**4. Donation avec réserve d'usufruit temporaire :**
• L'usufruit revient au donateur pendant X années
• Puis transmission complète
• Décote supplémentaire

**Conseil :** Faire appel à un notaire pour des montages sur mesure.`
      }
    ],
    definitions: [
      { term: 'Démembrement', definition: 'Division du droit de propriété entre nue-propriété et usufruit.' },
      { term: 'Donation-partage', definition: 'Donation répartissant les biens entre héritiers de manière définitive.' },
      { term: 'Pacte Dutreil', definition: 'Dispositif permettant une exonération de 75% sur la transmission d\'entreprise.' }
    ],
    keyPoints: [
      'Abattement de 100k€ par enfant tous les 15 ans',
      'Le démembrement permet une transmission à moindre coût',
      'L\'assurance-vie : 152 500€ exonérés par bénéficiaire',
      'Anticiper permet d\'économiser des milliers d\'euros'
    ],
    quiz: {
      question: 'Quelle est la fréquence de renouvellement de l\'abattement de 100 000€ par enfant ?',
      options: ['Tous les 5 ans', 'Tous les 10 ans', 'Tous les 15 ans', 'Une seule fois dans la vie'],
      correctIndex: 2,
      explanation: 'L\'abattement de 100 000€ pour les donations aux enfants se renouvelle tous les 15 ans. Il est donc possible de donner 100k€ à chaque enfant sans droits tous les 15 ans.'
    }
  },
  {
    id: 'fr-3-08',
    slug: 'macro-economie-investisseur',
    title: 'Macroéconomie pour investisseurs',
    summary: 'Comprendre les cycles économiques et leur impact sur vos investissements.',
    category: 'economie',
    level: 3,
    market: 'BOTH',
    readingTime: 12,
    xpReward: 45,
    sections: [
      {
        title: 'Les cycles économiques',
        content: `L'économie évolue par **cycles** d'expansion et de contraction :

**Les 4 phases du cycle :**
1. **Expansion** : PIB ↑, emploi ↑, confiance ↑
2. **Pic** : Surchauffe, inflation ↑, taux ↑
3. **Contraction** : PIB ↓, emploi ↓, récession
4. **Creux** : Reprise, opportunités d'achat

**Durée moyenne d'un cycle :** 7-10 ans

**Indicateurs à surveiller :**
• PIB (croissance économique)
• Taux de chômage
• Inflation (IPC)
• Indice PMI (industrie/services)
• Courbe des taux (normale vs inversée)`,
        diagram: `     Pic
     /\\
    /  \\
   /    \\     Expansion
  /      \\   /
 /        \\ /
Creux      Contraction`
      },
      {
        title: 'L\'inflation et les taux',
        content: `**Le rôle des banques centrales :**
• BCE (Europe) et Fed (USA) pilotent les taux
• Objectif : inflation ~2%
• Outils : taux directeurs, QE/QT

**Impact des taux sur les actifs :**

| Taux | Actions | Obligations | Immobilier |
|------|---------|-------------|------------|
| ↑ Hausse | ↓ | ↓ | ↓ |
| ↓ Baisse | ↑ | ↑ | ↑ |

**Pourquoi ?**
• Taux hauts = coût du crédit ↑ = investissement ↓
• Taux hauts = obligations plus attractives vs actions
• Taux hauts = valorisations actions ↓ (DCF)

**La courbe des taux :**
• Normale : taux longs > taux courts
• Inversée : taux courts > taux longs → **signal de récession**`
      },
      {
        title: 'Allocation tactique',
        content: `**Adapter son allocation au cycle :**

| Phase | Actions | Obligations | Cash | Or |
|-------|---------|-------------|------|-----|
| Expansion | Surpondérer | Sous-pondérer | Faible | Neutre |
| Pic | Réduire | Neutre | Augmenter | Augmenter |
| Contraction | Sous-pondérer | Surpondérer | Élevé | Surpondérer |
| Creux | Acheter fort | Réduire | Déployer | Neutre |

**Secteurs par cycle :**
• **Expansion** : Tech, consommation cyclique, industrie
• **Pic** : Énergie, matières premières
• **Contraction** : Défensif (santé, utilities, conso de base)
• **Creux** : Finance, immobilier, cycliques

**Attention :** Le timing est très difficile. La diversification long terme reste la meilleure stratégie pour la majorité.`
      },
      {
        title: 'Indicateurs avancés',
        content: `**Indicateurs leading (avancés) :**
• Courbe des taux (inversée = récession dans 12-18 mois)
• Permis de construire
• Commandes de biens durables
• Confiance des consommateurs
• PMI manufacturier

**Indicateurs coincident :**
• PIB
• Production industrielle
• Ventes au détail

**Indicateurs lagging (retardés) :**
• Taux de chômage
• Inflation
• Taux directeurs

**Où suivre ces données ?**
• Trading Economics
• FRED (Federal Reserve)
• Eurostat
• INSEE (France)

**Règle d'or :**
Ne pas essayer de "timer" le marché. Utiliser ces indicateurs pour ajuster marginalement son allocation, pas pour des paris concentrés.`
      }
    ],
    definitions: [
      { term: 'PIB', definition: 'Produit Intérieur Brut - mesure la richesse produite par un pays.' },
      { term: 'PMI', definition: 'Purchasing Managers Index - indicateur avancé de l\'activité économique.' },
      { term: 'QE', definition: 'Quantitative Easing - achat d\'actifs par une banque centrale pour stimuler l\'économie.' }
    ],
    keyPoints: [
      'L\'économie fonctionne par cycles de 7-10 ans',
      'Les taux impactent toutes les classes d\'actifs',
      'Une courbe des taux inversée prédit une récession',
      'Le market timing est très difficile'
    ],
    quiz: {
      question: 'Que signifie une courbe des taux inversée ?',
      options: ['L\'économie est en forte croissance', 'Une récession est probable dans 12-18 mois', 'L\'inflation va baisser', 'Les actions vont monter'],
      correctIndex: 1,
      explanation: 'Une courbe des taux inversée (taux courts > taux longs) est historiquement un des meilleurs prédicteurs de récession à 12-18 mois.'
    }
  },
  {
    id: 'fr-3-09',
    slug: 'decote-holding',
    title: 'Les décotes de holding cotées',
    summary: 'Investir dans des holdings cotées avec une décote sur leur ANR.',
    category: 'investissement',
    level: 3,
    market: 'BOTH',
    readingTime: 10,
    xpReward: 40,
    sections: [
      {
        title: 'Qu\'est-ce qu\'une décote de holding ?',
        content: `Une holding cotée possède des participations dans d'autres entreprises. Quand sa **capitalisation boursière < valeur de ses actifs**, on parle de décote.

**Exemple Groupe Bruxelles Lambert (GBL) :**
• Participations : Adidas, Pernod Ricard, SGS...
• ANR (Actif Net Réévalué) : 95€ par action
• Cours de bourse : 70€
• **Décote : 26%**

Acheter GBL à 70€, c'est acheter 95€ d'actifs !

**Holdings avec décotes significatives :**
• GBL (Belgique) : ~25%
• Eurazeo (France) : ~30%
• Exor (Italie) : ~35%
• Sofina (Belgique) : ~30%
• Berkshire Hathaway : ~0% (Warren Buffett = pas de décote)`
      },
      {
        title: 'Pourquoi ces décotes existent ?',
        content: `**Raisons de la décote :**
• **Frais de structure** : coûts de la holding
• **Double imposition** : fiscalité à la remontée des dividendes
• **Manque de liquidité** : vs détention directe
• **Gouvernance** : familles contrôlantes
• **Opacité** : difficile à analyser

**La décote varie selon :**
• La qualité du track record
• La transparence de la communication
• L'alignement avec les actionnaires minoritaires
• La liquidité des participations
• Le cycle de marché (décotes accrues en bear market)

**Une décote peut se résorber si :**
• La holding rachète ses propres actions
• Elle cède des actifs et distribue
• Un changement de gouvernance intervient`
      },
      {
        title: 'Comment analyser une holding ?',
        content: `**Calcul de l\'ANR (Actif Net Réévalué) :**

ANR = Valeur des participations cotées
    + Valeur estimée du non-coté
    - Dette nette
    - Provisions

**Exemple simplifié (holding fictive) :**
• Participation A (cotée) : 40M€
• Participation B (cotée) : 30M€
• Participation C (non cotée) : 20M€
• Trésorerie : 5M€
• Dette : -10M€
• **ANR = 85M€**
• Capitalisation : 60M€
• **Décote = 29%**

**Points d'attention :**
• Qualité de la valorisation du non-coté
• Track record des investissements
• Frais de gestion / rémunération dirigeants
• Dividendes et politique de retour à l'actionnaire`
      },
      {
        title: 'Stratégies d\'investissement',
        content: `**1. Acheter la décote et attendre :**
• Achat quand décote > moyenne historique
• Patience : la résorption peut prendre des années
• Dividendes en attendant

**2. Event-driven :**
• Changement de gouvernance
• Cession d'actifs
• Programme de rachat d'actions

**3. Diversification via holdings :**
• Une holding = accès à plusieurs entreprises
• Gestion professionnelle
• Frais indirects (vs fonds d'investissement)

**Risques :**
• La décote peut s'accroître
• Mauvais investissements de la holding
• Dilution par augmentation de capital
• Gouvernance défavorable aux minoritaires

**Holdings recommandées pour commencer :**
• GBL : transparente, historique solide
• Eurazeo : Private Equity accessible
• Christian Dior : décote sur LVMH`
      }
    ],
    definitions: [
      { term: 'ANR', definition: 'Actif Net Réévalué - valeur des participations moins les dettes.' },
      { term: 'Décote de holding', definition: 'Écart entre la capitalisation boursière et la valeur des actifs détenus.' },
      { term: 'NAV', definition: 'Net Asset Value - équivalent anglais de l\'ANR.' }
    ],
    keyPoints: [
      'Décote = capitalisation < valeur des actifs',
      'Décotes moyennes : 20-40% selon les holdings',
      'La décote peut mettre des années à se résorber',
      'Vérifier le track record et la gouvernance'
    ],
    quiz: {
      question: 'Une holding cote 80€ avec un ANR de 100€. Quelle est la décote ?',
      options: ['20€', '20%', '25%', '80%'],
      correctIndex: 1,
      explanation: 'Décote = (ANR - Cours) / ANR = (100 - 80) / 100 = 20%. Vous achetez 100€ d\'actifs pour 80€.'
    }
  },
  {
    id: 'fr-3-10',
    slug: 'diversification-internationale',
    title: 'Diversification et fiscalité internationale',
    summary: 'Optimiser son patrimoine avec des placements internationaux tout en respectant la législation.',
    category: 'avance',
    level: 3,
    market: 'FR',
    readingTime: 11,
    xpReward: 45,
    sections: [
      {
        title: 'Pourquoi diversifier géographiquement ?',
        content: `**Avantages de la diversification internationale :**
• Réduction du risque pays
• Accès à des marchés en croissance
• Décorrélation des cycles économiques
• Exposition aux devises

**Répartition mondiale des marchés actions :**
• USA : ~60%
• Europe : ~15%
• Japon : ~6%
• Émergents : ~12%
• Autres développés : ~7%

**Le "home bias" français :**
Les investisseurs français surpondèrent les actions françaises (40% du portefeuille moyen vs 3% du marché mondial).

**Recommandation :**
Suivre la capitalisation mondiale avec un ETF World, ou surpondérer légèrement l'Europe pour des raisons pratiques (PEA).`
      },
      {
        title: 'Fiscalité des revenus étrangers',
        content: `**Dividendes étrangers :**
• Retenue à la source du pays d'origine
• Puis impôt français (PFU ou barème)
• Conventions fiscales pour éviter la double imposition

**Exemple dividende US :**
1. Retenue US : 15% (convention)
2. Dividende net reçu : 85€ pour 100€
3. PFU France : 30% sur 100€ brut = 30€
4. Crédit d'impôt : 15€ (retenue US)
5. **Impôt net France : 15€**
6. **Total prélevé : 30€** (15 US + 15 FR)

**Optimisation via le PEA :**
Les dividendes sont encaissés sans retenue (traités fiscaux européens).

**ETF domiciliés en Irlande :**
Les ETF irlandais bénéficient de conventions fiscales favorables avec les USA (15% vs 30% de retenue).`
      },
      {
        title: 'Comptes et placements à l\'étranger',
        content: `**Obligations déclaratives françaises :**
• Déclaration annuelle des comptes à l'étranger (formulaire 3916)
• Déclaration des revenus étrangers
• Sanctions : 1 500€ par compte non déclaré + majorations

**Comptes étrangers courants :**
• Interactive Brokers (Irlande) → déclaration obligatoire
• Trade Republic (Allemagne) → déclaration obligatoire
• Revolut (Lituanie) → déclaration si compte d'investissement

**Assurance-vie luxembourgeoise :**
• Super-privilège du souscripteur (protection renforcée)
• Neutralité fiscale (fiscalité du pays de résidence)
• Accès à des UC spécifiques (Private Equity, immobilier)
• Ticket d'entrée : ~250 000€

**Attention aux montages "optimisés" :**
• L'évasion fiscale est illégale
• Les échanges automatiques (CRS) couvrent 100+ pays
• Le fisc français a accès aux données bancaires étrangères`
      },
      {
        title: 'Devises et couverture',
        content: `**Risque de change :**
Investir en USD, CHF ou GBP expose au risque de change :
• EUR/USD -10% = perte de 10% sur un placement US en euros

**Faut-il couvrir le risque de change ?**
• Court terme (< 5 ans) : la couverture peut être utile
• Long terme (> 10 ans) : les devises s'équilibrent généralement
• Coût de la couverture : 1-2% par an

**ETF hedgés vs non-hedgés :**
• ETF "EUR Hedged" : couverture intégrée
• ETF standard : exposition au change
• Conseil : préférer non-hedgé pour le long terme

**Diversification naturelle :**
• Revenus en EUR, patrimoine partiellement en USD
• Protège contre la dépréciation de l'euro
• Les entreprises mondiales sont déjà multi-devises`
      }
    ],
    definitions: [
      { term: 'Home bias', definition: 'Tendance des investisseurs à surpondérer les actifs de leur pays d\'origine.' },
      { term: 'Retenue à la source', definition: 'Impôt prélevé par le pays d\'origine sur les revenus (dividendes, intérêts).' },
      { term: 'ETF hedgé', definition: 'ETF avec couverture du risque de change intégrée.' }
    ],
    keyPoints: [
      'La diversification internationale réduit le risque',
      'Attention à la fiscalité des dividendes étrangers',
      'Déclarer obligatoirement les comptes étrangers',
      'Couverture de change : utile court terme, coûteuse long terme'
    ],
    quiz: {
      question: 'Que doit faire un résident fiscal français ayant un compte chez Interactive Brokers ?',
      options: ['Rien, c\'est automatique', 'Le déclarer sur le formulaire 3916', 'Payer un impôt forfaitaire de 30%', 'Fermer le compte'],
      correctIndex: 1,
      explanation: 'Tout compte détenu à l\'étranger par un résident fiscal français doit être déclaré annuellement via le formulaire 3916, sous peine d\'amende de 1 500€ par compte.'
    }
  }
];
