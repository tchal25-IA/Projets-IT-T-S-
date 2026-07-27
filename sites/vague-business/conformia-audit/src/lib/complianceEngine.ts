export type Answer = "oui" | "partiel" | "non" | "na";

export type CategoryId =
  | "inventaire"
  | "bases_legales"
  | "information"
  | "securite"
  | "sous_traitants"
  | "droits"
  | "suisse_nlpd"
  | "site_marketing";

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  description: string;
}

export interface Question {
  id: string;
  category: CategoryId;
  text: string;
  help: string;
  weight: 1 | 2 | 3;
  actionIfNon: string;
}

export const categories: Category[] = [
  {
    id: "inventaire",
    label: "Inventaire des données",
    short: "Inventaire",
    description: "Cartographier les données personnelles traitées.",
  },
  {
    id: "bases_legales",
    label: "Bases légales & consentement",
    short: "Bases légales",
    description: "Justifier chaque traitement par une base légale valide.",
  },
  {
    id: "information",
    label: "Information des personnes",
    short: "Information",
    description: "Mentions d'information, politique de confidentialité, cookies.",
  },
  {
    id: "securite",
    label: "Sécurité & accès",
    short: "Sécurité",
    description: "Mesures techniques et organisationnelles.",
  },
  {
    id: "sous_traitants",
    label: "Sous-traitants / hébergeurs",
    short: "Sous-traitants",
    description: "Contrats, DPA, hébergement, transferts hors UE.",
  },
  {
    id: "droits",
    label: "Droits des personnes",
    short: "Droits",
    description: "Accès, rectification, effacement, portabilité.",
  },
  {
    id: "suisse_nlpd",
    label: "Spécificités Suisse (nLPD)",
    short: "nLPD",
    description: "Registre, DPD facultatif, transferts internationaux.",
  },
  {
    id: "site_marketing",
    label: "Site web & marketing",
    short: "Site & marketing",
    description: "Formulaires, newsletters, prospection.",
  },
];

export const questions: Question[] = [
  // Inventaire
  {
    id: "inv_1",
    category: "inventaire",
    text: "Avez-vous un registre écrit des activités de traitement (clients, salariés, prospects…) ?",
    help: "Obligatoire dès qu'on traite des données personnelles de façon non-occasionnelle (RGPD art. 30, nLPD art. 12).",
    weight: 3,
    actionIfNon: "Créer un registre simple (tableur) : finalité, catégories de données, destinataires, durée de conservation.",
  },
  {
    id: "inv_2",
    category: "inventaire",
    text: "Avez-vous identifié les catégories de données sensibles (santé, opinions, données bancaires) ?",
    help: "Les données sensibles nécessitent des garanties renforcées.",
    weight: 2,
    actionIfNon: "Lister les traitements contenant des données sensibles et documenter les mesures spécifiques.",
  },
  {
    id: "inv_3",
    category: "inventaire",
    text: "Les durées de conservation sont-elles définies et documentées ?",
    help: "Chaque donnée doit avoir une durée de vie justifiée (ex: 3 ans après dernier contact prospect).",
    weight: 2,
    actionIfNon: "Fixer une durée par catégorie et automatiser la purge/archivage.",
  },
  {
    id: "inv_4",
    category: "inventaire",
    text: "Une personne référente (interne) est-elle nommée pour la protection des données ?",
    help: "DPO obligatoire dans certains cas, sinon un référent interne est vivement recommandé.",
    weight: 2,
    actionIfNon: "Désigner un référent interne et communiquer son contact.",
  },

  // Bases légales
  {
    id: "bl_1",
    category: "bases_legales",
    text: "Chaque traitement repose-t-il sur une base légale identifiée (contrat, consentement, obligation légale, intérêt légitime) ?",
    help: "Sans base légale, le traitement est illicite.",
    weight: 3,
    actionIfNon: "Associer une base légale à chaque ligne du registre.",
  },
  {
    id: "bl_2",
    category: "bases_legales",
    text: "Le consentement, quand il est utilisé, est-il libre, éclairé, spécifique et révocable ?",
    help: "Cases pré-cochées interdites. Le retrait doit être aussi simple que le consentement.",
    weight: 3,
    actionIfNon: "Refondre les formulaires : case décochée par défaut + mécanisme de retrait.",
  },
  {
    id: "bl_3",
    category: "bases_legales",
    text: "Conservez-vous une preuve horodatée du consentement des utilisateurs ?",
    help: "Il faut pouvoir démontrer le consentement (log, capture, ID).",
    weight: 2,
    actionIfNon: "Logger date, IP anonymisée et libellé exact du consentement recueilli.",
  },

  // Information
  {
    id: "inf_1",
    category: "information",
    text: "Votre site dispose-t-il d'une politique de confidentialité à jour et accessible ?",
    help: "Doit mentionner finalités, bases légales, durées, droits, contact.",
    weight: 3,
    actionIfNon: "Publier une politique de confidentialité conforme et la lier depuis le footer.",
  },
  {
    id: "inf_2",
    category: "information",
    text: "Les formulaires (contact, inscription) mentionnent-ils la finalité et les droits ?",
    help: "Mention courte + lien vers la politique complète.",
    weight: 2,
    actionIfNon: "Ajouter une phrase d'information sous chaque formulaire.",
  },
  {
    id: "inf_3",
    category: "information",
    text: "Un bandeau cookies permet-il un vrai refus (aussi simple qu'accepter) ?",
    help: "« Continuer sans accepter » ou bouton « Tout refuser » de même niveau visuel.",
    weight: 3,
    actionIfNon: "Installer une CMP conforme (Axeptio, Didomi, tarteaucitron) avec refus équivalent.",
  },
  {
    id: "inf_4",
    category: "information",
    text: "Les scripts tiers (analytics, pixels) sont-ils bloqués tant que le consentement n'est pas donné ?",
    help: "Google Analytics, Meta Pixel, etc. ne doivent pas charger avant consentement.",
    weight: 3,
    actionIfNon: "Conditionner le chargement des tags au consentement (via la CMP).",
  },

  // Sécurité
  {
    id: "sec_1",
    category: "securite",
    text: "Les mots de passe des comptes internes suivent-ils une politique robuste (12+ car., MFA) ?",
    help: "MFA fortement recommandé sur email, CRM, hébergeur.",
    weight: 3,
    actionIfNon: "Activer MFA partout où c'est possible et imposer un gestionnaire de mots de passe.",
  },
  {
    id: "sec_2",
    category: "securite",
    text: "Les accès aux données sont-ils limités selon le principe du besoin d'en connaître ?",
    help: "Un stagiaire n'a pas accès à toute la base clients.",
    weight: 2,
    actionIfNon: "Revoir les rôles et permissions dans chaque outil (CRM, drive, comptabilité).",
  },
  {
    id: "sec_3",
    category: "securite",
    text: "Les postes et sauvegardes sont-ils chiffrés (disque, cloud) ?",
    help: "FileVault/BitLocker + sauvegardes chiffrées.",
    weight: 2,
    actionIfNon: "Activer le chiffrement disque et vérifier le chiffrement des sauvegardes.",
  },
  {
    id: "sec_4",
    category: "securite",
    text: "Avez-vous une procédure écrite en cas de violation de données (fuite, piratage) ?",
    help: "Notification CNIL/PFPDT sous 72h le cas échéant.",
    weight: 3,
    actionIfNon: "Rédiger une procédure : détection → analyse → notification → communication.",
  },

  // Sous-traitants
  {
    id: "st_1",
    category: "sous_traitants",
    text: "Avez-vous listé tous vos sous-traitants traitant des données (hébergeur, CRM, emailing, comptable) ?",
    help: "Inclure les outils SaaS.",
    weight: 2,
    actionIfNon: "Établir la liste et l'annexer au registre.",
  },
  {
    id: "st_2",
    category: "sous_traitants",
    text: "Avez-vous signé un contrat / DPA (Data Processing Agreement) avec chacun ?",
    help: "La plupart des SaaS proposent un DPA en ligne.",
    weight: 3,
    actionIfNon: "Récupérer et signer les DPA manquants (souvent téléchargeables dans les paramètres).",
  },
  {
    id: "st_3",
    category: "sous_traitants",
    text: "Les transferts hors UE/Suisse sont-ils encadrés (clauses contractuelles types, décision d'adéquation) ?",
    help: "USA : Data Privacy Framework à vérifier au cas par cas.",
    weight: 3,
    actionIfNon: "Identifier les outils hébergés hors UE/CH et vérifier les CCT ou alternatives européennes.",
  },

  // Droits
  {
    id: "dr_1",
    category: "droits",
    text: "Existe-t-il un canal clair pour exercer ses droits (accès, rectification, effacement) ?",
    help: "Email dédié ou formulaire, réponse sous 1 mois.",
    weight: 3,
    actionIfNon: "Publier une adresse dédiée (ex: privacy@…) et documenter le processus interne.",
  },
  {
    id: "dr_2",
    category: "droits",
    text: "Savez-vous répondre à une demande d'effacement en moins d'un mois ?",
    help: "Nécessite de savoir où sont les données.",
    weight: 2,
    actionIfNon: "Cartographier les emplacements de stockage et prévoir un mode opératoire.",
  },
  {
    id: "dr_3",
    category: "droits",
    text: "Les demandes reçues sont-elles tracées (registre des demandes) ?",
    help: "Preuve de conformité en cas de contrôle.",
    weight: 1,
    actionIfNon: "Tenir un simple tableau : date, personne, nature, réponse.",
  },

  // Suisse nLPD
  {
    id: "ch_1",
    category: "suisse_nlpd",
    text: "Si vous êtes en Suisse : votre registre des activités est-il conforme à la nLPD (en vigueur depuis sept. 2023) ?",
    help: "Obligatoire hors PME <250 sauf traitements sensibles ou à risque.",
    weight: 3,
    actionIfNon: "Aligner le registre sur les exigences PFPDT.",
  },
  {
    id: "ch_2",
    category: "suisse_nlpd",
    text: "Avez-vous évalué si un conseiller à la protection des données (DPD) est nécessaire ou opportun ?",
    help: "Facultatif en Suisse mais recommandé pour bénéficier d'allègements.",
    weight: 1,
    actionIfNon: "Documenter l'analyse et, le cas échéant, désigner un DPD (interne ou externe).",
  },
  {
    id: "ch_3",
    category: "suisse_nlpd",
    text: "Les transferts internationaux hors États adéquats sont-ils encadrés (CCT, exceptions documentées) ?",
    help: "Liste des pays adéquats publiée par le Conseil fédéral.",
    weight: 2,
    actionIfNon: "Réévaluer chaque destination et mettre en place les garanties adéquates.",
  },
  {
    id: "ch_4",
    category: "suisse_nlpd",
    text: "Une annonce de violation au PFPDT est-elle prévue dans votre procédure incident ?",
    help: "Notification « dans les meilleurs délais » si risque élevé.",
    weight: 2,
    actionIfNon: "Ajouter le PFPDT comme destinataire dans la procédure de gestion d'incidents.",
  },

  // Site & marketing
  {
    id: "sm_1",
    category: "site_marketing",
    text: "Les mentions légales du site sont-elles complètes (éditeur, hébergeur, contact) ?",
    help: "Obligatoire même pour un site vitrine.",
    weight: 2,
    actionIfNon: "Publier une page « Mentions légales » à jour.",
  },
  {
    id: "sm_2",
    category: "site_marketing",
    text: "La prospection commerciale par email respecte-t-elle l'opt-in (BtoC) ou l'opt-out avec produit similaire (BtoB) ?",
    help: "BtoC : consentement préalable. BtoB : possible sans consentement si lien avec l'offre + opt-out.",
    weight: 2,
    actionIfNon: "Nettoyer les listes et documenter la base légale par segment.",
  },
  {
    id: "sm_3",
    category: "site_marketing",
    text: "Chaque email marketing contient-il un lien de désinscription fonctionnel ?",
    help: "Désinscription en un clic, traitée sans délai.",
    weight: 2,
    actionIfNon: "Ajouter/vérifier le lien de désinscription et automatiser la suppression.",
  },
];

export type Answers = Record<string, Answer>;

const answerWeight: Record<Answer, number | null> = {
  oui: 1,
  partiel: 0.5,
  non: 0,
  na: null,
};

export interface CategoryScore {
  id: CategoryId;
  label: string;
  score: number; // 0-100
  answered: number;
  total: number;
}

export interface PriorityAction {
  questionId: string;
  category: CategoryId;
  categoryLabel: string;
  text: string;
  action: string;
  weight: number;
  status: Answer;
}

export interface AuditResult {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "E";
  categories: CategoryScore[];
  actions: PriorityAction[];
  answeredCount: number;
  totalQuestions: number;
}

export function gradeFromScore(score: number): AuditResult["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

export function computeResult(answers: Answers): AuditResult {
  const catMap = new Map<CategoryId, { num: number; den: number; answered: number; total: number }>();
  for (const c of categories) catMap.set(c.id, { num: 0, den: 0, answered: 0, total: 0 });

  let globalNum = 0;
  let globalDen = 0;
  let answeredCount = 0;

  for (const q of questions) {
    const bucket = catMap.get(q.category)!;
    bucket.total += 1;
    const a = answers[q.id];
    if (!a) continue;
    answeredCount += 1;
    const w = answerWeight[a];
    if (w === null) continue; // N/A excluded
    bucket.answered += 1;
    bucket.num += w * q.weight;
    bucket.den += q.weight;
    globalNum += w * q.weight;
    globalDen += q.weight;
  }

  const catScores: CategoryScore[] = categories.map((c) => {
    const b = catMap.get(c.id)!;
    return {
      id: c.id,
      label: c.label,
      score: b.den === 0 ? 0 : Math.round((b.num / b.den) * 100),
      answered: b.answered,
      total: b.total,
    };
  });

  const score = globalDen === 0 ? 0 : Math.round((globalNum / globalDen) * 100);

  // priority actions: non first, then partiel, sorted by weight desc
  const catLabels = new Map(categories.map((c) => [c.id, c.label]));
  const nonAndPartiel: PriorityAction[] = questions
    .filter((q) => {
      const a = answers[q.id];
      return a === "non" || a === "partiel";
    })
    .map((q) => ({
      questionId: q.id,
      category: q.category,
      categoryLabel: catLabels.get(q.category) ?? "",
      text: q.text,
      action: q.actionIfNon,
      weight: q.weight,
      status: answers[q.id],
    }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "non" ? -1 : 1;
      return b.weight - a.weight;
    });

  return {
    score,
    grade: gradeFromScore(score),
    categories: catScores,
    actions: nonAndPartiel,
    answeredCount,
    totalQuestions: questions.length,
  };
}

export function demoAnswers(): Answers {
  // Realistic average small business result
  const pattern: Answer[] = ["oui", "partiel", "non", "oui", "partiel", "non", "oui", "oui", "partiel"];
  const out: Answers = {};
  questions.forEach((q, i) => {
    out[q.id] = pattern[i % pattern.length];
  });
  return out;
}

export function questionsByCategory(): { category: Category; items: Question[] }[] {
  return categories.map((c) => ({
    category: c,
    items: questions.filter((q) => q.category === c.id),
  }));
}
