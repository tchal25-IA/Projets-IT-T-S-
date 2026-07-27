import type { AcademyArticle } from './types';

export const articlesLevel2FR: AcademyArticle[] = [
  {
    id: 'fr-2-01',
    slug: 'pea-guide-complet',
    title: 'Le PEA : guide complet',
    summary: 'Maîtrisez le Plan d\'Épargne en Actions, l\'enveloppe fiscale idéale pour investir en bourse.',
    category: 'enveloppes',
    level: 2,
    market: 'FR',
    readingTime: 10,
    xpReward: 35,
    sections: [
      {
        title: 'Qu\'est-ce que le PEA ?',
        content: `Le Plan d'Épargne en Actions est une **enveloppe fiscale** permettant d'investir en bourse avec une fiscalité avantageuse après 5 ans.

**Caractéristiques :**
• Plafond de versement : **150 000€**
• Actions européennes + ETF éligibles
• Disponible dans toutes les banques
• Un seul PEA par personne

**Les 3 types de PEA :**
1. **PEA bancaire** : le plus courant
2. **PEA assurance** : adossé à une assurance-vie
3. **PEA-PME** : dédié aux PME (+75 000€ de plafond)`
      },
      {
        title: 'L\'avantage fiscal du PEA',
        content: `**Avant 5 ans :**
• Retrait = clôture du PEA
• Gains imposés au PFU (30%) ou barème IR + PS (17,2%)

**Après 5 ans :**
• Retraits partiels possibles (sans clôture depuis 2019)
• Plus-values exonérées d'impôt sur le revenu
• **Seuls les prélèvements sociaux (17,2%) sont dus**

**Exemple :**
• Capital investi : 50 000€
• Plus-value : 30 000€
• Après 5 ans : impôt = 30 000 × 17,2% = **5 160€**
• Sans PEA (PFU) : impôt = 30 000 × 30% = **9 000€**
• **Économie : 3 840€**`,
        diagram: `┌─────────────────────────────────────────┐
│              FISCALITÉ PEA              │
├───────────────┬─────────────────────────┤
│   < 5 ANS     │      ≥ 5 ANS            │
├───────────────┼─────────────────────────┤
│  PFU 30%      │  PS seuls : 17,2%       │
│  ou           │  (IR exonéré)           │
│  Barème + PS  │                         │
└───────────────┴─────────────────────────┘`
      },
      {
        title: 'Stratégie d\'utilisation',
        content: `**1. Ouvrir tôt pour prendre date**
Même avec 10€, l'horloge des 5 ans démarre.

**2. Investir régulièrement (DCA)**
Un virement mensuel vers des ETF diversifiés.

**3. Privilégier les ETF éligibles PEA**
• ETF World (CW8 d'Amundi, EWLD de Lyxor)
• ETF S&P 500 (PE500, ESE)
• ETF Europe (CEU, MEU)
• ETF Émergents (PAEEM)

**4. Ne pas retirer avant 5 ans**
Patience ! Les retraits anticipés clôturent le PEA.

**5. Continuer après 5 ans**
Le PEA reste actif, vous pouvez continuer à investir et faire des retraits partiels.`
      },
      {
        title: 'PEA vs CTO : le match',
        content: `| Critère | PEA | CTO |
|---------|-----|-----|
| Plafond | 150 000€ | Illimité |
| Univers | Europe + ETF | Monde entier |
| Fiscalité 5 ans+ | 17,2% | 30% (PFU) |
| Retrait anticipé | Clôture | Libre |
| Transmission | Non optimisée | PFU sur PV |

**Conclusion :**
1. **Remplir le PEA en priorité** avec des ETF diversifiés
2. Passer au CTO ensuite pour plus de flexibilité
3. Garder le CTO pour les actions hors Europe (US, Asie...)`
      }
    ],
    definitions: [
      { term: 'PEA', definition: 'Plan d\'Épargne en Actions - enveloppe fiscale pour investir en actions européennes.' },
      { term: 'PFU', definition: 'Prélèvement Forfaitaire Unique de 30% (12,8% IR + 17,2% PS).' },
      { term: 'Prendre date', definition: 'Ouvrir un compte pour faire démarrer le délai de détention fiscale.' }
    ],
    keyPoints: [
      'Le PEA offre une exonération d\'IR après 5 ans',
      'Plafond de 150 000€ de versements',
      'Ouvrir tôt pour prendre date',
      'Privilégier les ETF World ou Europe éligibles'
    ],
    quiz: {
      question: 'Quelle est la fiscalité des plus-values PEA après 5 ans ?',
      options: ['0%', '17,2% (PS seuls)', '30% (PFU)', '45%'],
      correctIndex: 1,
      explanation: 'Après 5 ans, les plus-values PEA sont exonérées d\'impôt sur le revenu. Seuls les prélèvements sociaux de 17,2% sont dus.'
    }
  },
  {
    id: 'fr-2-02',
    slug: 'assurance-vie-guide',
    title: 'L\'assurance-vie : l\'enveloppe couteau-suisse',
    summary: 'Découvrez les multiples usages de l\'assurance-vie : épargne, investissement et transmission.',
    category: 'enveloppes',
    level: 2,
    market: 'FR',
    readingTime: 12,
    xpReward: 40,
    sections: [
      {
        title: 'Les 3 fonctions de l\'assurance-vie',
        content: `L'assurance-vie est l'enveloppe la plus polyvalente :

**1. Épargne sécurisée (Fonds euros)**
• Capital garanti
• Rendement ~2-3% en 2024
• Disponibilité permanente

**2. Investissement diversifié (Unités de compte)**
• Actions, obligations, immobilier (SCPI)
• Pas de garantie en capital
• Potentiel de rendement supérieur

**3. Transmission optimisée**
• Abattement de 152 500€ par bénéficiaire
• Hors succession pour les versements avant 70 ans
• Clause bénéficiaire personnalisable`
      },
      {
        title: 'La fiscalité de l\'assurance-vie',
        content: `**En cas de rachat (retrait) :**

| Ancienneté | Fiscalité des gains |
|------------|---------------------|
| < 8 ans | PFU 30% ou barème |
| ≥ 8 ans | PFU 24,7% ou barème + abattement |

**Abattement annuel après 8 ans :**
• 4 600€ pour une personne seule
• 9 200€ pour un couple

**Exemple après 8 ans :**
• Rachat partiel avec 5 000€ de gains
• Abattement 4 600€ → Base imposable : 400€
• Impôt : 400 × 24,7% = **99€**

**En cas de décès :**
• Versements avant 70 ans : 152 500€ par bénéficiaire exonérés
• Au-delà : 20% jusqu'à 700 000€, 31,25% au-delà`
      },
      {
        title: 'Fonds euros vs Unités de compte',
        content: `**Fonds euros :**
✅ Capital garanti
✅ Effet cliquet (gains acquis)
❌ Rendement limité (~2-3%)
❌ Certains contrats imposent 20-30% d'UC

**Unités de compte (UC) :**
✅ Large choix (actions, SCPI, ETF...)
✅ Potentiel de rendement élevé
❌ Risque de perte en capital
❌ Frais de gestion variables

**Stratégie selon l'âge :**
• 25-40 ans : 70-80% UC, 20-30% fonds euros
• 40-55 ans : 50% UC, 50% fonds euros
• 55+ ans : 30% UC, 70% fonds euros`,
        diagram: `┌─────────────────────────────────────────┐
│      ALLOCATION SELON L'ÂGE            │
├──────────┬──────────────────────────────┤
│ 25-40ans │ ████████████████░░░░░ 80% UC │
│ 40-55ans │ ██████████░░░░░░░░░░░ 50% UC │
│ 55+ ans  │ ██████░░░░░░░░░░░░░░░ 30% UC │
└──────────┴──────────────────────────────┘`
      },
      {
        title: 'Bien choisir son contrat',
        content: `**Critères essentiels :**

• **Frais sur versement** : 0% (courtiers en ligne) vs 2-5% (banques)
• **Frais de gestion UC** : < 0,8%
• **Choix d'UC** : ETF disponibles ? SCPI ?
• **Performance fonds euros** : > 2%

**Meilleurs contrats 2024 :**
• Linxea Spirit 2 / Avenir 2
• Lucya Cardif
• Boursorama Vie
• Placement-direct Vie

**À éviter :**
• Contrats bancaires traditionnels (frais élevés)
• Assurances-vie vendues en agence
• Contrats sans ETF`
      }
    ],
    definitions: [
      { term: 'Fonds euros', definition: 'Support sécurisé à capital garanti, investi principalement en obligations.' },
      { term: 'Unités de compte', definition: 'Supports d\'investissement sans garantie (actions, SCPI, ETF...).' },
      { term: 'Clause bénéficiaire', definition: 'Désignation des personnes qui recevront le capital en cas de décès.' }
    ],
    keyPoints: [
      'L\'AV combine épargne, investissement et transmission',
      'Fiscalité avantageuse après 8 ans (abattement 4 600€)',
      'Choisir un contrat en ligne à frais réduits',
      'Mixer fonds euros et UC selon son profil'
    ],
    quiz: {
      question: 'Quel est l\'abattement fiscal annuel sur les gains d\'une AV de plus de 8 ans (personne seule) ?',
      options: ['1 000€', '4 600€', '9 200€', '152 500€'],
      correctIndex: 1,
      explanation: 'Après 8 ans, les gains sont exonérés jusqu\'à 4 600€ pour une personne seule (9 200€ pour un couple).'
    }
  },
  {
    id: 'fr-2-03',
    slug: 'etf-investissement-passif',
    title: 'Les ETF et l\'investissement passif',
    summary: 'Comprendre les ETF et construire un portefeuille diversifié à faibles frais.',
    category: 'investissement',
    level: 2,
    market: 'BOTH',
    readingTime: 10,
    xpReward: 35,
    sections: [
      {
        title: 'Qu\'est-ce qu\'un ETF ?',
        content: `Un ETF (Exchange Traded Fund) est un **fonds coté en bourse** qui réplique un indice.

**Avantages :**
• **Diversification instantanée** : 1 ETF = des centaines d'actions
• **Frais très bas** : 0,03% à 0,50% par an
• **Liquidité** : achetable/vendable en temps réel
• **Transparence** : composition connue

**Types d'ETF :**
• **Géographiques** : USA, Europe, Émergents, Monde
• **Sectoriels** : Tech, Santé, Finance
• **Obligataires** : États, Entreprises
• **Thématiques** : ESG, Dividendes, Small caps`
      },
      {
        title: 'ETF capitalisant vs distribuant',
        content: `**ETF Capitalisant (Acc) :**
• Les dividendes sont réinvestis automatiquement
• Pas de fiscalité tant que vous ne vendez pas
• Idéal pour la croissance long terme
• ✅ Recommandé en PEA

**ETF Distribuant (Dist) :**
• Les dividendes sont versés sur votre compte
• Imposés à chaque distribution
• Utile pour générer des revenus réguliers
• Moins efficace fiscalement

**Exemple avec un ETF S&P 500 :**
• Capitalisant : la valeur de la part augmente
• Distribuant : vous recevez ~1,5% de dividendes/an`
      },
      {
        title: 'Construire un portefeuille simple',
        content: `**Le portefeuille "1 ETF" :**
• 100% ETF MSCI World (CW8, EWLD)
• ~1 500 entreprises mondiales
• Diversification maximale
• Frais : ~0,20%

**Le portefeuille "3 ETF" :**
• 70% ETF World développés
• 20% ETF Émergents
• 10% ETF Obligations
• Plus fin, légèrement plus de frais

**Allocation recommandée par horizon :**

| Horizon | Actions | Obligations |
|---------|---------|-------------|
| > 15 ans | 100% | 0% |
| 10-15 ans | 80% | 20% |
| 5-10 ans | 60% | 40% |
| < 5 ans | 30% | 70% |`
      },
      {
        title: 'ETF éligibles PEA',
        content: `Les ETF "monde" sur PEA utilisent une **réplication synthétique** :

**ETF World :**
• Amundi MSCI World UCITS (CW8) : 0,38%
• Lyxor MSCI World (EWLD) : 0,45%

**ETF S&P 500 :**
• Amundi S&P 500 (PE500) : 0,15%
• BNP Easy S&P 500 (ESE) : 0,15%

**ETF Europe :**
• Amundi Euro Stoxx 50 (C50) : 0,09%
• Lyxor CAC 40 (CAC) : 0,25%

**ETF Émergents :**
• Amundi MSCI Emerging Markets (PAEEM) : 0,20%

**Astuce :** Vérifier la liquidité et les frais avant d'acheter.`
      }
    ],
    definitions: [
      { term: 'ETF', definition: 'Fonds indiciel coté en bourse qui réplique la performance d\'un indice.' },
      { term: 'TER', definition: 'Total Expense Ratio - frais totaux annuels de l\'ETF.' },
      { term: 'Réplication synthétique', definition: 'L\'ETF utilise des produits dérivés plutôt que d\'acheter les actions sous-jacentes.' }
    ],
    keyPoints: [
      'Un ETF = diversification instantanée à faibles frais',
      'Privilégier les ETF capitalisants en PEA',
      'Un simple ETF World suffit pour débuter',
      'Vérifier les frais (TER) et la liquidité'
    ],
    quiz: {
      question: 'Pourquoi privilégier un ETF capitalisant plutôt que distribuant sur PEA ?',
      options: ['Il est moins cher', 'Les dividendes sont réinvestis sans fiscalité', 'Il est plus diversifié', 'Il est garanti en capital'],
      correctIndex: 1,
      explanation: 'L\'ETF capitalisant réinvestit les dividendes sans générer de fiscalité, contrairement au distribuant qui déclenche l\'imposition à chaque versement.'
    }
  },
  {
    id: 'fr-2-04',
    slug: 'per-retraite',
    title: 'Le PER : préparer sa retraite',
    summary: 'Tout savoir sur le Plan d\'Épargne Retraite et son avantage fiscal à l\'entrée.',
    category: 'enveloppes',
    level: 2,
    market: 'FR',
    readingTime: 9,
    xpReward: 30,
    sections: [
      {
        title: 'Le fonctionnement du PER',
        content: `Le Plan d'Épargne Retraite est une **enveloppe bloquée jusqu'à la retraite** avec un avantage fiscal à l'entrée.

**Les 3 compartiments :**
• PER individuel (ex-PERP, Madelin)
• PER entreprise collectif (ex-PERCO)
• PER entreprise obligatoire (ex-Article 83)

**Avantage fiscal :**
Les versements sont **déductibles du revenu imposable** dans la limite de 10% des revenus (plafond ~35 000€/an).

**Sortie :**
• En capital (100% ou fractionnée)
• En rente viagère
• Mix des deux`
      },
      {
        title: 'L\'intérêt du PER selon votre TMI',
        content: `Le PER est d'autant plus intéressant que votre TMI est élevé :

**Exemple : versement de 5 000€**

| TMI | Économie d'impôt | Coût réel |
|-----|------------------|-----------|
| 11% | 550€ | 4 450€ |
| 30% | 1 500€ | 3 500€ |
| 41% | 2 050€ | 2 950€ |
| 45% | 2 250€ | 2 750€ |

**Attention** : à la sortie, le capital est imposé au barème (hors plus-values sur les PV qui subissent le PFU).

**Stratégie optimale :**
• TMI élevé pendant la vie active → verser
• TMI faible à la retraite → sortir
• Si TMI stable → PEA/AV plus intéressants`
      },
      {
        title: 'Cas de déblocage anticipé',
        content: `Le PER est normalement bloqué jusqu'à la retraite, **sauf cas exceptionnels** :

**Déblocage en capital (imposable) :**
• Acquisition de la résidence principale
• Décès du conjoint
• Invalidité (vous, conjoint, enfants)
• Surendettement
• Expiration des droits au chômage
• Cessation d'activité non salariée

**Important :**
Le déblocage pour achat de RP est une nouveauté du PER vs PERP. C'est un atout pour les plus jeunes !`
      },
      {
        title: 'PER vs Assurance-vie : le comparatif',
        content: `| Critère | PER | Assurance-vie |
|---------|-----|---------------|
| Avantage entrée | Déduction IR | Non |
| Avantage sortie | Imposable | Abattement 8 ans |
| Liquidité | Bloqué | Disponible |
| Transmission | Bof | Excellente |
| Plafond | ~35k€/an | Illimité |

**Recommandation :**
• **TMI ≥ 30%** : PER intéressant
• **TMI < 30%** : Privilégier PEA puis AV
• **Indécis** : Mixer les deux

**Attention aux frais :**
Beaucoup de PER ont des frais élevés. Privilégier les PER en ligne (Linxea, Boursorama).`
      }
    ],
    definitions: [
      { term: 'PER', definition: 'Plan d\'Épargne Retraite - produit d\'épargne bloqué jusqu\'à la retraite avec avantage fiscal à l\'entrée.' },
      { term: 'Rente viagère', definition: 'Revenu versé jusqu\'au décès en échange d\'un capital.' },
      { term: 'Déductibilité', definition: 'Possibilité de soustraire les versements du revenu imposable.' }
    ],
    keyPoints: [
      'Le PER offre une déduction fiscale à l\'entrée',
      'Plus intéressant si TMI ≥ 30%',
      'Bloqué jusqu\'à la retraite (sauf cas exceptionnels)',
      'Déblocable pour l\'achat de la résidence principale'
    ],
    quiz: {
      question: 'À partir de quel TMI le PER devient-il généralement intéressant ?',
      options: ['0%', '11%', '30%', '41%'],
      correctIndex: 2,
      explanation: 'Le PER est rentable à partir d\'un TMI de 30%, car l\'économie d\'impôt à l\'entrée compense l\'imposition à la sortie si le TMI baisse à la retraite.'
    }
  },
  {
    id: 'fr-2-05',
    slug: 'locatif-cashflow',
    title: 'L\'investissement locatif rentable',
    summary: 'Calculer la rentabilité réelle et viser le cashflow positif.',
    category: 'immobilier',
    level: 2,
    market: 'FR',
    readingTime: 11,
    xpReward: 40,
    sections: [
      {
        title: 'Les indicateurs de rentabilité',
        content: `**Rendement brut :**
(Loyers annuels / Prix d'achat) × 100
→ Premier filtre, ne reflète pas la réalité

**Rendement net de charges :**
((Loyers - Charges) / Prix total) × 100
→ Plus réaliste, avant fiscalité

**Rendement net-net :**
((Loyers - Charges - Impôts) / Prix total) × 100
→ Ce qui reste vraiment dans votre poche

**Cashflow mensuel :**
Loyers - Mensualité crédit - Charges - Impôts
→ **L'indicateur clé !**

**Objectif :** Cashflow ≥ 0 (autofinancement)`
      },
      {
        title: 'Détail des charges à prévoir',
        content: `**Charges récurrentes :**
• Taxe foncière : 1-2 mois de loyer
• Charges de copropriété non récupérables : ~15%
• Assurance PNO : ~150€/an
• Gestion locative (si agence) : 7-10% des loyers
• Provision vacance locative : ~5%
• Provision travaux : ~5%

**Exemple concret :**
Loyer : 700€/mois = 8 400€/an

| Charge | Montant |
|--------|---------|
| Taxe foncière | 900€ |
| Copro non récup. | 600€ |
| PNO | 150€ |
| Vacance 5% | 420€ |
| Travaux 5% | 420€ |
| **Total charges** | **2 490€** |
| **Loyer net** | **5 910€** |`
      },
      {
        title: 'L\'effet levier optimisé',
        content: `**Règle d'or : emprunter au maximum**

Plus vous empruntez, plus l'effet levier est puissant :

**Scénario 1 : 0% apport (financement 110%)**
• Bien : 100 000€ + Frais : 10 000€
• Mensualité : 520€ (20 ans, 3,5%)
• Loyer net : 600€
• **Cashflow : +80€/mois**

**Scénario 2 : 20% apport**
• Apport : 22 000€
• Mensualité : 415€
• Loyer net : 600€
• **Cashflow : +185€/mois**

**Mais :** vos 22 000€ d'apport auraient pu être investis ailleurs à 7%...

**Conclusion :** Minimiser l'apport pour maximiser l'effet levier.`
      },
      {
        title: 'Zones et stratégies',
        content: `**La carte des rendements :**

| Zone | Rendement brut | Prix/m² |
|------|----------------|---------|
| Paris | 3-4% | 10 000€+ |
| Lyon, Bordeaux | 4-5% | 4-6 000€ |
| Villes moyennes | 6-8% | 1-3 000€ |
| Zones tendues | 4-5% | Variable |

**Stratégies selon objectif :**

• **Cashflow** : Villes moyennes, petites surfaces
• **Patrimoine** : Grandes villes, évolution long terme
• **Mixte** : Villes intermédiaires (Nantes, Montpellier...)

**Red flags à éviter :**
• Rendement brut < 5% (sauf patrimonial)
• Vacance locative > 10%
• Copropriété dégradée
• Zone en déclin démographique`
      }
    ],
    definitions: [
      { term: 'Cashflow', definition: 'Flux de trésorerie net mensuel après toutes les charges et le crédit.' },
      { term: 'PNO', definition: 'Assurance Propriétaire Non Occupant - couvre les risques locatifs.' },
      { term: 'Autofinancement', definition: 'L\'investissement se rembourse seul grâce aux loyers.' }
    ],
    keyPoints: [
      'Le cashflow est l\'indicateur clé',
      'Compter TOUTES les charges (vacance, travaux...)',
      'Minimiser l\'apport pour maximiser l\'effet levier',
      'Villes moyennes = meilleur rendement'
    ],
    quiz: {
      question: 'Que signifie un cashflow positif ?',
      options: ['Le bien prend de la valeur', 'Les loyers couvrent toutes les dépenses', 'Le rendement brut dépasse 10%', 'L\'emprunt est remboursé'],
      correctIndex: 1,
      explanation: 'Un cashflow positif signifie que les loyers couvrent crédit + charges + impôts, et qu\'il reste de l\'argent chaque mois.'
    }
  },
  {
    id: 'fr-2-06',
    slug: 'scpi-pierre-papier',
    title: 'Les SCPI : l\'immobilier sans contraintes',
    summary: 'Investir dans l\'immobilier via les SCPI : fonctionnement, fiscalité et sélection.',
    category: 'immobilier',
    level: 2,
    market: 'FR',
    readingTime: 9,
    xpReward: 30,
    sections: [
      {
        title: 'Qu\'est-ce qu\'une SCPI ?',
        content: `Une SCPI (Société Civile de Placement Immobilier) permet d'investir dans l'immobilier **sans gérer de biens**.

**Fonctionnement :**
• Vous achetez des parts (~200€ minimum)
• La société achète et gère des immeubles
• Vous recevez des loyers proportionnels
• Rendement moyen : 4-6%/an

**Types de SCPI :**
• **Bureaux** : Rendement stable, locataires entreprises
• **Commerces** : Plus cyclique, baux longs
• **Résidentiel** : Rendement plus faible, plus stable
• **Diversifiée** : Mix de plusieurs types
• **Européenne** : Avantage fiscal (pas de PS sur loyers étrangers)`
      },
      {
        title: 'Avantages et inconvénients',
        content: `**✅ Avantages :**
• Diversification (des dizaines d'immeubles)
• Ticket d'entrée faible (~200€)
• Aucune gestion
• Revenus réguliers (trimestriels)
• Mutualisation du risque

**❌ Inconvénients :**
• Frais d'entrée élevés (8-12%)
• Liquidité limitée (revente parfois longue)
• Fiscalité lourde (IR + PS sur les loyers)
• Pas d'effet levier direct
• Délai de jouissance (3-6 mois)`
      },
      {
        title: 'Fiscalité des SCPI',
        content: `**Revenus fonciers (loyers perçus) :**
• Imposés au barème IR + 17,2% PS
• TMI 30% → Fiscalité totale ~47%

**Astuce SCPI européennes :**
Les loyers de pays européens bénéficient d'un crédit d'impôt, **pas de PS français !**
• Fiscalité effective : ~30% au lieu de ~47%

**Solutions pour réduire la fiscalité :**
1. SCPI en assurance-vie (seuls les retraits sont taxés)
2. SCPI européennes (crédit d'impôt)
3. SCPI en démembrement (pas de revenus pendant la période)
4. SCPI en SCI à l'IS (imposition société)`
      },
      {
        title: 'Comment choisir une SCPI ?',
        content: `**Critères de sélection :**

| Critère | Bon | Moyen | Mauvais |
|---------|-----|-------|---------|
| TDVM (rendement) | > 5% | 4-5% | < 4% |
| TOF (occupation) | > 95% | 90-95% | < 90% |
| Capitalisation | > 1Md€ | 500M-1Md | < 500M |
| Report à nouveau | > 10% | 5-10% | < 5% |

**SCPI recommandées 2024 :**
• Corum Origin (6,06%)
• Epargne Pierre (5,28%)
• Activimmo (5,50%)
• PFO2 (5,10%)
• Novaxia Neo (6,10%)

**Où acheter :**
Louve Invest, France SCPI, ou en assurance-vie (Linxea Spirit).`
      }
    ],
    definitions: [
      { term: 'SCPI', definition: 'Société Civile de Placement Immobilier - permet d\'investir collectivement dans l\'immobilier.' },
      { term: 'TDVM', definition: 'Taux de Distribution sur Valeur de Marché - rendement annuel de la SCPI.' },
      { term: 'TOF', definition: 'Taux d\'Occupation Financier - pourcentage des loyers effectivement perçus.' }
    ],
    keyPoints: [
      'SCPI = immobilier diversifié sans gestion',
      'Rendement 4-6% mais fiscalité lourde',
      'Privilégier les SCPI européennes ou en AV',
      'Vérifier TDVM, TOF et capitalisation'
    ],
    quiz: {
      question: 'Quel est l\'avantage fiscal des SCPI européennes ?',
      options: ['Pas d\'impôt du tout', 'Pas de prélèvements sociaux sur les loyers étrangers', 'Déduction des frais d\'entrée', 'Exonération après 8 ans'],
      correctIndex: 1,
      explanation: 'Les loyers de SCPI investies en Europe bénéficient d\'un crédit d\'impôt et ne sont pas soumis aux prélèvements sociaux français (17,2%).'
    }
  },
  {
    id: 'fr-2-07',
    slug: 'mariage-pacs-finances',
    title: 'Mariage, PACS et finances',
    summary: 'Les impacts financiers et fiscaux du mariage ou du PACS.',
    category: 'vie-quotidienne',
    level: 2,
    market: 'FR',
    readingTime: 8,
    xpReward: 25,
    sections: [
      {
        title: 'Mariage vs PACS : les différences',
        content: `**Points communs :**
• Imposition commune (dès l'année du mariage/PACS)
• Parts fiscales communes
• Solidarité des dettes ménagères

**Différences clés :**

| Aspect | Mariage | PACS |
|--------|---------|------|
| Régime par défaut | Communauté réduite | Séparation de biens |
| Succession | Héritier réservataire | Pas héritier (testament nécessaire) |
| Pension réversion | Oui | Non |
| Rupture | Divorce (procédure) | Déclaration simple |

**Conseil :** Le PACS est plus simple à rompre mais offre moins de protection au conjoint survivant.`
      },
      {
        title: 'L\'impact fiscal de l\'union',
        content: `**Imposition commune :**
Vos revenus sont additionnés et divisés par le nombre de parts.

**Cas où c'est avantageux :**
• Écart de revenus important entre conjoints
• Un conjoint ne travaille pas

**Cas où c'est neutre ou défavorable :**
• Revenus similaires
• Hauts revenus (effet de tranche)

**Exemple :**
• A gagne 50 000€, B gagne 20 000€
• Séparés : A paie ~7 000€, B paie ~1 500€ = **8 500€**
• Ensemble : (70 000 / 2) × 2 = **~7 200€**
• **Économie : 1 300€/an**`
      },
      {
        title: 'Les régimes matrimoniaux',
        content: `**Communauté réduite aux acquêts (défaut mariage) :**
• Biens acquis pendant le mariage = communs
• Biens possédés avant ou hérités = propres

**Séparation de biens :**
• Chacun garde ses biens
• Protection en cas de dettes professionnelles
• Nécessite un contrat de mariage

**Communauté universelle :**
• Tous les biens sont communs
• Risqué si dettes ou divorce
• Parfois utilisé pour la succession

**Participation aux acquêts :**
• Séparation pendant le mariage
• Partage des gains à la dissolution

**Conseil :** Consulter un notaire si patrimoine important ou profession à risque.`
      },
      {
        title: 'Succession et protection du conjoint',
        content: `**Sans testament :**
• Marié : 1/4 en pleine propriété ou 100% en usufruit (choix)
• Pacsé : **Rien !** (les enfants héritent de tout)

**Avec testament :**
• On peut léguer au pacsé la quotité disponible
• Mais jamais la réserve héréditaire des enfants

**Clause de donation au dernier vivant :**
Permet au conjoint marié de choisir entre :
• 100% en usufruit
• 1/4 propriété + 3/4 usufruit
• Quotité disponible en propriété

**Assurance-vie :**
Hors succession ! Pensez à mettre votre conjoint bénéficiaire.`
      }
    ],
    definitions: [
      { term: 'PACS', definition: 'Pacte Civil de Solidarité - union civile avec effets juridiques et fiscaux.' },
      { term: 'Communauté réduite aux acquêts', definition: 'Régime matrimonial où les biens acquis pendant le mariage sont communs.' },
      { term: 'Usufruit', definition: 'Droit d\'utiliser un bien et d\'en percevoir les revenus sans en être propriétaire.' }
    ],
    keyPoints: [
      'PACS = moins de protection que le mariage',
      'L\'imposition commune avantage les couples à revenus inégaux',
      'Le pacsé n\'hérite pas sans testament !',
      'Prévoir donation et assurance-vie pour protéger le conjoint'
    ],
    quiz: {
      question: 'Que reçoit un partenaire de PACS si son conjoint décède sans testament ?',
      options: ['100% du patrimoine', '50% du patrimoine', '25% du patrimoine', 'Rien'],
      correctIndex: 3,
      explanation: 'Sans testament, le partenaire de PACS n\'hérite de rien. Seuls les enfants ou la famille héritent. Il faut rédiger un testament !'
    }
  },
  {
    id: 'fr-2-08',
    slug: 'crypto-bases',
    title: 'Les crypto-actifs : comprendre les bases',
    summary: 'Bitcoin, Ethereum, stablecoins : fonctionnement et risques des crypto-monnaies.',
    category: 'crypto',
    level: 2,
    market: 'BOTH',
    readingTime: 10,
    xpReward: 35,
    sections: [
      {
        title: 'Qu\'est-ce que la crypto ?',
        content: `Les crypto-actifs sont des **actifs numériques décentralisés** reposant sur la blockchain.

**Bitcoin (BTC) :**
• Première crypto (2009)
• "Or numérique", réserve de valeur
• Offre limitée à 21 millions
• Plus grosse capitalisation

**Ethereum (ETH) :**
• Plateforme de smart contracts
• Permet les applications décentralisées (DeFi, NFT)
• Deuxième capitalisation

**Stablecoins :**
• Indexés sur le dollar (USDT, USDC)
• Utilisés pour trader ou générer des rendements
• Risque de dé-indexation`
      },
      {
        title: 'Risques et volatilité',
        content: `**Volatilité extrême :**
• Bitcoin : -80% en 2022, +150% en 2023
• Altcoins : variations de +1000% ou -99%

**Risques spécifiques :**
• **Perte de clés** : pas de récupération possible
• **Hacking** : exchanges piratés régulièrement
• **Régulation** : interdictions possibles
• **Projets frauduleux** : arnaques fréquentes
• **Liquidité** : certains tokens illiquides

**Règles de prudence :**
• Ne jamais investir plus qu'on peut perdre
• Maximum 5-10% du portefeuille
• Éviter les altcoins obscurs
• Utiliser un cold wallet pour les montants importants`
      },
      {
        title: 'Fiscalité des cryptos en France',
        content: `**Régime fiscal :**
• Flat tax de **30%** sur les plus-values
• Imposable uniquement lors de la conversion en euros
• Échanges crypto/crypto non imposables

**Calcul de la plus-value :**
PV = Prix de vente - (Prix d'achat global × (Montant vendu / Valeur totale portefeuille))

**Exemple :**
• Vous avez acheté 1 BTC à 10 000€ et 1 ETH à 2 000€
• Valeur totale : 50 000€ (BTC à 40 000€, ETH à 10 000€)
• Vous vendez 0,5 BTC pour 20 000€
• Coût d'acquisition proportionnel : 12 000 × (20 000 / 50 000) = 4 800€
• **Plus-value imposable : 20 000 - 4 800 = 15 200€**
• **Impôt : 15 200 × 30% = 4 560€**`
      },
      {
        title: 'Comment investir en crypto ?',
        content: `**Plateformes régulées (PSAN) :**
• Coinbase, Kraken, Bitvavo
• Binance (attention régulation EU)

**Méthodes d'investissement :**
1. **DCA** : Achats réguliers (mensuel)
2. **Lump sum** : Investissement unique
3. **Trading** : Très risqué, déconseillé aux débutants

**Sécurité :**
• Hot wallet (app) : petits montants
• Cold wallet (Ledger, Trezor) : gros montants
• Ne jamais partager sa seed phrase

**Allocation suggérée :**
• 70-80% Bitcoin
• 15-20% Ethereum
• 0-10% Altcoins (optionnel, très risqué)`
      }
    ],
    definitions: [
      { term: 'Blockchain', definition: 'Registre décentralisé et immuable qui enregistre toutes les transactions.' },
      { term: 'Cold wallet', definition: 'Portefeuille physique déconnecté d\'internet pour sécuriser ses cryptos.' },
      { term: 'DeFi', definition: 'Finance Décentralisée - services financiers sans intermédiaire sur blockchain.' }
    ],
    keyPoints: [
      'Les cryptos sont très volatiles',
      'Limiter l\'exposition à 5-10% du portefeuille',
      'Flat tax de 30% sur les plus-values en France',
      'Utiliser un cold wallet pour les gros montants'
    ],
    quiz: {
      question: 'Quel événement déclenche l\'imposition sur les cryptos en France ?',
      options: ['Acheter des cryptos', 'Échanger des cryptos entre elles', 'Convertir en euros ou acheter un bien', 'Transférer vers un autre wallet'],
      correctIndex: 2,
      explanation: 'En France, seule la conversion en monnaie fiat (euros) ou l\'achat d\'un bien/service déclenche l\'imposition. Les échanges crypto/crypto ne sont pas imposables.'
    }
  },
  {
    id: 'fr-2-09',
    slug: 'revenus-fonciers-fiscalite',
    title: 'La fiscalité des revenus fonciers',
    summary: 'Régime micro-foncier vs réel : optimiser l\'imposition de vos loyers.',
    category: 'fiscalite',
    level: 2,
    market: 'FR',
    readingTime: 9,
    xpReward: 30,
    sections: [
      {
        title: 'Les deux régimes fiscaux',
        content: `**Micro-foncier :**
• Revenus bruts < 15 000€/an
• Abattement forfaitaire de 30%
• Déclaration simplifiée
• Pas de déduction de charges réelles

**Régime réel :**
• Obligatoire si > 15 000€ ou sur option
• Déduction des charges réelles
• Création possible de déficit foncier
• Déclaration 2044 détaillée

**Exemple comparatif (loyers 12 000€/an) :**

| Régime | Calcul | Base imposable |
|--------|--------|----------------|
| Micro | 12 000 - 30% | 8 400€ |
| Réel | 12 000 - 7 000€ charges | 5 000€ |

→ **Réel plus avantageux si charges > 30% des loyers**`
      },
      {
        title: 'Les charges déductibles au réel',
        content: `**Charges déductibles :**
• Intérêts d'emprunt (pas le capital !)
• Taxe foncière (hors ordures ménagères)
• Charges de copropriété non récupérables
• Travaux d'entretien et réparation
• Frais de gestion (agence, comptable)
• Primes d'assurance (PNO, GLI)
• Frais de procédure

**Non déductibles :**
• Capital du crédit
• Travaux d'agrandissement
• Mobilier et équipements
• Taxe d'habitation

**Astuce :** Concentrer les travaux sur une année pour créer un déficit.`
      },
      {
        title: 'Le déficit foncier',
        content: `Le déficit foncier permet de **réduire son impôt** :

**Fonctionnement :**
• Charges > Loyers = Déficit
• Déficit imputable sur le revenu global (max 10 700€/an)
• Excédent reportable sur revenus fonciers 10 ans

**Exemple :**
• Loyers : 8 000€
• Intérêts : 3 000€
• Travaux : 15 000€
• Total charges : 18 000€

**Calcul :**
1. Déficit total : 8 000 - 18 000 = **-10 000€**
2. Déficit hors intérêts : 8 000 - 15 000 = **-7 000€** (imputable sur revenu global)
3. Déficit intérêts : -3 000€ (reportable sur revenus fonciers)

**Avec un TMI de 30%**, économie immédiate : 7 000 × 30% = **2 100€**`
      },
      {
        title: 'Optimisation fiscale',
        content: `**Stratégies d'optimisation :**

1. **Passer au réel** si charges > 30%
2. **Grouper les travaux** pour créer un déficit
3. **Emprunter au maximum** (intérêts déductibles)
4. **Choisir le bon timing** des travaux

**Location meublée vs nue :**

| Critère | Nu (foncier) | Meublé (BIC) |
|---------|--------------|--------------|
| Abattement micro | 30% | 50% |
| Déficit | Sur revenu global | Sur BIC seuls |
| Amortissement | Non | Oui (LMNP réel) |
| Charges sociales | PS 17,2% | PS 17,2% |

**Le meublé est souvent plus avantageux**, surtout en LMNP au réel avec amortissement.`
      }
    ],
    definitions: [
      { term: 'Déficit foncier', definition: 'Quand les charges dépassent les loyers, créant une perte déductible.' },
      { term: 'Micro-foncier', definition: 'Régime simplifié avec abattement de 30% pour revenus fonciers < 15 000€.' },
      { term: 'BIC', definition: 'Bénéfices Industriels et Commerciaux - régime fiscal de la location meublée.' }
    ],
    keyPoints: [
      'Micro-foncier si charges < 30% des loyers',
      'Réel si charges > 30% ou pour créer du déficit',
      'Déficit foncier déductible jusqu\'à 10 700€/an',
      'La location meublée offre plus d\'optimisation'
    ],
    quiz: {
      question: 'Quel est le montant maximum de déficit foncier imputable sur le revenu global ?',
      options: ['5 000€', '10 700€', '15 000€', 'Illimité'],
      correctIndex: 1,
      explanation: 'Le déficit foncier (hors intérêts d\'emprunt) est imputable sur le revenu global dans la limite de 10 700€ par an.'
    }
  },
  {
    id: 'fr-2-10',
    slug: 'analyse-fondamentale',
    title: 'L\'analyse fondamentale des actions',
    summary: 'Évaluer une entreprise avec les ratios financiers clés.',
    category: 'investissement',
    level: 2,
    market: 'BOTH',
    readingTime: 11,
    xpReward: 40,
    sections: [
      {
        title: 'Les ratios de valorisation',
        content: `**PER (Price Earning Ratio) :**
Prix / Bénéfice par action
• < 10 : Sous-évalué ou en difficulté
• 10-20 : Valorisation normale
• > 20 : Croissance anticipée ou surévalué

**P/B (Price to Book) :**
Prix / Valeur comptable
• < 1 : Sous-évalué ou problèmes
• 1-3 : Normal
• > 3 : Actifs immatériels importants

**EV/EBITDA :**
Valeur d'entreprise / EBITDA
• < 8 : Bon marché
• 8-12 : Normal
• > 12 : Premium

**Exemple LVMH :**
• PER : ~25 (croissance de luxe)
• P/B : ~6 (marques = actifs immatériels)
• EV/EBITDA : ~15`
      },
      {
        title: 'Les ratios de rentabilité',
        content: `**ROE (Return on Equity) :**
Bénéfice net / Capitaux propres
→ Rentabilité pour l'actionnaire
• > 15% : Excellent
• 10-15% : Bon
• < 10% : Médiocre

**ROA (Return on Assets) :**
Bénéfice net / Total actifs
→ Efficacité de l'utilisation des actifs
• > 10% : Très bon
• 5-10% : Correct
• < 5% : Faible

**Marge nette :**
Bénéfice net / Chiffre d'affaires
→ Profitabilité du business
• Tech : 15-30%
• Distribution : 2-5%
• Luxe : 15-20%`
      },
      {
        title: 'Les ratios d\'endettement',
        content: `**Dette nette / EBITDA :**
• < 2 : Endettement sain
• 2-3 : Modéré
• > 3 : Attention

**Gearing (Dette nette / Capitaux propres) :**
• < 50% : Peu endetté
• 50-100% : Modéré
• > 100% : Fortement endetté

**Couverture des intérêts :**
EBITDA / Charges d'intérêts
• > 5 : Confortable
• 3-5 : Correct
• < 3 : Risqué

**Attention aux secteurs :**
L'immobilier et les utilities sont naturellement plus endettés. Comparer au sein d'un même secteur.`
      },
      {
        title: 'Analyser une entreprise en pratique',
        content: `**Checklist d'analyse :**

1. **Business model** : L'entreprise fait-elle sens ?
2. **Croissance** : CA et bénéfices en hausse ?
3. **Rentabilité** : ROE > 15%, marges stables ?
4. **Endettement** : Dette/EBITDA < 3 ?
5. **Valorisation** : PER raisonnable vs croissance ?
6. **Dividende** : Payout ratio < 70% ?
7. **Management** : Dirigeants alignés (actions) ?

**Sources d'information :**
• Rapports annuels (site entreprise)
• Boursorama, Zonebourse, Yahoo Finance
• Morningstar, Seeking Alpha

**Red flags :**
• Comptabilité créative
• Endettement qui explose
• Dirigeants qui vendent
• Dividende non couvert par les bénéfices`
      }
    ],
    definitions: [
      { term: 'PER', definition: 'Ratio cours / bénéfice par action - indique combien d\'années de bénéfices le marché est prêt à payer.' },
      { term: 'ROE', definition: 'Return on Equity - rentabilité des capitaux propres pour l\'actionnaire.' },
      { term: 'EBITDA', definition: 'Bénéfice avant intérêts, impôts, dépréciation et amortissement - mesure la rentabilité opérationnelle.' }
    ],
    keyPoints: [
      'Le PER seul ne suffit pas',
      'Comparer les ratios au sein d\'un même secteur',
      'ROE > 15% = bonne rentabilité',
      'Dette/EBITDA < 3 = endettement maîtrisé'
    ],
    quiz: {
      question: 'Un ROE de 20% signifie que :',
      options: ['Le cours a augmenté de 20%', 'L\'entreprise génère 20€ de bénéfice pour 100€ de capitaux propres', 'L\'endettement est de 20%', 'Les dividendes représentent 20% du bénéfice'],
      correctIndex: 1,
      explanation: 'Le ROE (Return on Equity) mesure le bénéfice généré par rapport aux capitaux propres. Un ROE de 20% signifie 20€ de bénéfice pour 100€ investis par les actionnaires.'
    }
  }
];
