/**
 * Questionnaire Sass — 20 questions d'accueil (1ère connexion).
 * Source : Questionnaire Sass.docx
 */

export type SassFieldType = "text" | "textarea" | "single" | "multi" | "scale";

export type SassQuestion = {
  id: string;
  n: number;
  titre: string;
  /** Pourquoi on pose la question (coach / UX) */
  intention: string;
  type: SassFieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  scaleMin?: number;
  scaleMax?: number;
};

/** Catégories d'objectifs (Q1) — alimentent principal + secondaires. */
export const OBJECTIF_CATEGORIES = [
  "Perte de poids",
  "Force",
  "Santé / forme",
  "Performance",
  "Composition corporelle",
  "Mobilité / blessure",
  "Mental / stress",
  "Préparation compétition",
] as const;

export const SASS_QUESTIONS: SassQuestion[] = [
  {
    id: "q1_objectifs",
    n: 1,
    titre: "Quel est votre objectif principal avec un coach ?",
    intention: "Identifie la motivation et la cible.",
    type: "multi",
    options: [...OBJECTIF_CATEGORIES],
    required: true,
  },
  {
    id: "q1_precision",
    n: 1,
    titre: "Précisez votre objectif principal",
    intention: "Formulation libre de la cible.",
    type: "textarea",
    placeholder: "Ex : perdre 5 kg pour mon mariage, finir un Hyrox sous 1h30…",
    required: true,
  },
  {
    id: "q1_secondaires",
    n: 1,
    titre: "Quels objectifs secondaires voulez-vous aussi travailler ?",
    intention: "Objectifs secondaires pour le check-in quotidien.",
    type: "multi",
    options: [...OBJECTIF_CATEGORIES],
    required: false,
  },
  {
    id: "q2_pourquoi",
    n: 2,
    titre: "Pourquoi cet objectif est-il important pour vous maintenant ?",
    intention: "Révèle la valeur émotionnelle et l'engagement.",
    type: "textarea",
    placeholder: "Ce qui rend cet objectif important aujourd'hui…",
    required: true,
  },
  {
    id: "q3_motivation",
    n: 3,
    titre: "Sur une échelle de 1 à 10, quelle est votre motivation actuelle pour changer ?",
    intention: "Mesure quantitative de la motivation.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 10,
    required: true,
  },
  {
    id: "q4_experience_coach",
    n: 4,
    titre: "Avez-vous déjà travaillé avec un coach ?",
    intention: "Histoire relationnelle avec le coaching et attentes.",
    type: "textarea",
    placeholder: "Si oui, qu'avez-vous aimé / moins aimé ?",
    required: false,
  },
  {
    id: "q5_heures",
    n: 5,
    titre: "Combien d'heures par semaine êtes-vous prêt(e) à consacrer au sport ?",
    intention: "Contrainte temporelle et adhérence possible.",
    type: "single",
    options: ["Moins de 2 h", "2–3 h", "4–5 h", "6–8 h", "Plus de 8 h"],
    required: true,
  },
  {
    id: "q6_niveau",
    n: 6,
    titre: "Quel est votre niveau d'activité actuel ?",
    intention: "Point de départ physique.",
    type: "single",
    options: ["Aucun", "Occasionnel", "Régulier", "Compétiteur"],
    required: true,
  },
  {
    id: "q7_activites",
    n: 7,
    titre: "Quels types d'activité pratiquez-vous actuellement ?",
    intention: "Préférences et habitude d'entraînement.",
    type: "multi",
    options: ["Cardio", "Musculation", "Yoga / mobilité", "CrossFit / Hyrox", "Course", "Sports collectifs", "Rien pour le moment", "Autre"],
    required: true,
  },
  {
    id: "q8_sante",
    n: 8,
    titre: "Avez-vous des antécédents médicaux, blessures, ou contre-indications ?",
    intention: "Sécurité et adaptation du programme.",
    type: "textarea",
    placeholder: "Précisez (ou indiquez « aucun »).",
    required: true,
  },
  {
    id: "q9_traitements",
    n: 9,
    titre: "Suivez-vous des traitements ou prenez-vous des médicaments ?",
    intention: "Contre-indications et interactions.",
    type: "textarea",
    placeholder: "Précisez (ou indiquez « non »).",
    required: false,
  },
  {
    id: "q10_sommeil",
    n: 10,
    titre: "Comment décririez-vous votre sommeil ?",
    intention: "Recovery et facteur de performance.",
    type: "textarea",
    placeholder: "Durée, qualité, réveils…",
    required: true,
  },
  {
    id: "q11_stress",
    n: 11,
    titre: "Comment est votre niveau de stress au quotidien ?",
    intention: "Impact sur motivation et récupération.",
    type: "single",
    options: ["Faible", "Moyen", "Élevé"],
    required: true,
  },
  {
    id: "q12_alimentation",
    n: 12,
    titre: "Décrivez une journée type d'alimentation",
    intention: "Habitudes nutritionnelles influençant le plan d'entraînement.",
    type: "textarea",
    placeholder: "Repas & boissons sur une journée typique…",
    required: false,
  },
  {
    id: "q13_substances",
    n: 13,
    titre: "Consommez-vous alcool, tabac ou autres substances ?",
    intention: "Facteurs comportementaux importants.",
    type: "textarea",
    placeholder: "Fréquence et précisions (ou « non »).",
    required: false,
  },
  {
    id: "q14_confiance",
    n: 14,
    titre: "Quelle est votre confiance en vous concernant l'activité physique ?",
    intention: "Image de soi et probabilité d'adhérence.",
    type: "single",
    options: ["Faible", "Moyenne", "Forte"],
    required: true,
  },
  {
    id: "q15_barrieres",
    n: 15,
    titre: "Avez-vous des barrières ou peurs liées à l'exercice ?",
    intention: "Obstacles psychologiques à adresser.",
    type: "textarea",
    placeholder: "Peur des blessures, du jugement, manque de temps…",
    required: false,
  },
  {
    id: "q16_levier",
    n: 16,
    titre: "Qu'est-ce qui vous motive le plus ?",
    intention: "Style de motivation (intrinsèque / extrinsèque).",
    type: "multi",
    options: ["Résultats rapides", "Plaisir", "Routine", "Socialisation"],
    required: true,
  },
  {
    id: "q17_format",
    n: 17,
    titre: "Préférez-vous vous entraîner…",
    intention: "Format idéal pour fidélisation.",
    type: "single",
    options: ["Seul(e)", "En petit groupe", "Avec un coach en face-à-face", "Mixte"],
    required: true,
  },
  {
    id: "q18_energie",
    n: 18,
    titre: "À quel moment de la journée avez-vous le plus d'énergie pour vous entraîner ?",
    intention: "Optimisation des séances.",
    type: "single",
    options: ["Matin", "Midi", "Après-midi", "Soir", "Variable"],
    required: true,
  },
  {
    id: "q19_contraintes",
    n: 19,
    titre: "Avez-vous des contraintes logistiques ?",
    intention: "Réaliste et planifiable.",
    type: "textarea",
    placeholder: "Déplacement, garde d'enfants, horaires, matériel…",
    required: false,
  },
  {
    id: "q20_attente_coach",
    n: 20,
    titre: "Qu'attendez-vous de moi en tant que coach ?",
    intention: "Clarifie le rôle et évite les malentendus.",
    type: "multi",
    options: ["Technique", "Motivation", "Plan alimentaire", "Suivi / accountability", "Programmation", "Autre"],
    required: true,
  },
];

export type SassAnswers = Record<string, string | string[] | number | null>;

export const EMPTY_SASS: SassAnswers = Object.fromEntries(
  SASS_QUESTIONS.map((q) => [q.id, q.type === "multi" ? [] : q.type === "scale" ? null : ""]),
);

/** Construit principal + secondaires + horizons à partir des réponses Sass. */
export function deriveObjectifsFromSass(sass: SassAnswers): {
  objectifPrincipal: string;
  objectifsSecondaires: string[];
  objectifMoyenTerme: string | null;
  objectifLongTerme: string | null;
} {
  const precision =
    typeof sass.q1_precision === "string" ? sass.q1_precision.trim() : "";
  const cats = Array.isArray(sass.q1_objectifs)
    ? sass.q1_objectifs.filter((x): x is string => typeof x === "string")
    : [];
  const secs = Array.isArray(sass.q1_secondaires)
    ? sass.q1_secondaires.filter((x): x is string => typeof x === "string")
    : [];
  const pourquoi =
    typeof sass.q2_pourquoi === "string" ? sass.q2_pourquoi.trim() : "";

  const principal =
    precision ||
    (cats[0] ? cats[0] : "") ||
    "Objectif à définir";

  // Secondaires = catégories secondaires + autres cats (pas les leviers motivation)
  const secondaires = [
    ...secs,
    ...cats.filter((c) => c !== cats[0] && !secs.includes(c)),
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.toLowerCase() !== principal.toLowerCase());

  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const s of secondaires) {
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(s);
  }

  const objectifMoyenTerme =
    uniq[0] && uniq[0].toLowerCase() !== principal.toLowerCase()
      ? uniq[0]
      : null;

  const objectifLongTerme =
    (pourquoi && pourquoi.toLowerCase() !== principal.toLowerCase()
      ? pourquoi
      : null) ||
    (uniq[1] && uniq[1].toLowerCase() !== (objectifMoyenTerme ?? "").toLowerCase()
      ? uniq[1]
      : null);

  return {
    objectifPrincipal: principal,
    objectifsSecondaires: uniq,
    objectifMoyenTerme,
    objectifLongTerme,
  };
}

export function formatSassValue(v: string | string[] | number | null | undefined): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}
