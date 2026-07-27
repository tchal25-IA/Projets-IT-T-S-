// Catalogue de templates de programmes hebdomadaires + protocoles unitaires
// pour que le coach les applique en un clic sur la fiche d'un abonné.

export type Bloc = { jour: string; titre: string; details: string };

export type ProgramTemplate = {
  id: string;
  titre: string;
  objectif: string;
  cible: string; // ex: "Hyrox", "Marathon", "Hybride"
  niveau: "Débutant" | "Intermédiaire" | "Avancé";
  duree: string; // ex: "4 semaines"
  blocs: Bloc[];
};

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: "tpl-hyrox-4w",
    titre: "Prépa Hyrox — Base 4 semaines",
    objectif: "Construire la capacité aérobie + force fonctionnelle pour les 8 stations Hyrox.",
    cible: "Hyrox",
    niveau: "Intermédiaire",
    duree: "4 semaines",
    blocs: [
      { jour: "Lundi", titre: "Force basse + push", details: "5x5 Back Squat @ 75% · 4x8 DB Press · 3x10 Walking Lunges 20kg" },
      { jour: "Mardi", titre: "Course Zone 2", details: "45 min footing nasal · cadence 170-180 spm · finir par 4x20s strides" },
      { jour: "Mercredi", titre: "AMRAP Hyrox Prep", details: "AMRAP 20 min : 5 Burpees · 10 KB Swings 20kg · 15 Wall Balls · 200m run" },
      { jour: "Jeudi", titre: "Repos actif / mobilité", details: "30 min vélo Z1 + 20 min mobilité hanches/épaules" },
      { jour: "Vendredi", titre: "Force tirage + core", details: "5x5 Deadlift @ 70% · 4x8 Pull-ups · 3x30s planche + side plank" },
      { jour: "Samedi", titre: "Simulation Hyrox réduite", details: "4 rounds : 500m row · 100m Farmer 2x24kg · 50m Sled Push · 50m Sled Pull" },
      { jour: "Dimanche", titre: "Repos complet", details: "Sommeil prioritaire · 10 min cohérence cardiaque 5-5" },
    ],
  },
  {
    id: "tpl-marathon-base",
    titre: "Marathon — Base aérobie 5j/sem",
    objectif: "Construire le kilométrage à intensité contrôlée avant la phase spécifique.",
    cible: "Marathon",
    niveau: "Intermédiaire",
    duree: "6 semaines",
    blocs: [
      { jour: "Lundi", titre: "Repos / mobilité", details: "30 min mobilité + foam roller mollets, ischios, fessiers" },
      { jour: "Mardi", titre: "Footing Z2", details: "10 km à 70% FCmax · cadence stable" },
      { jour: "Mercredi", titre: "Fractionné court", details: "Échauffement 15 min · 10x400m allure 10km / récup 200m trot · retour 10 min" },
      { jour: "Jeudi", titre: "Renfo course", details: "3x (10 fentes / 10 squats / 10 mountain climbers) · 4x30s gainage" },
      { jour: "Vendredi", titre: "Footing Z2", details: "8 km souples · respiration nasale" },
      { jour: "Samedi", titre: "Sortie longue progressive", details: "18 km : 12 km Z2 + 6 km à allure marathon" },
      { jour: "Dimanche", titre: "Repos", details: "Sieste · hydratation · nutrition 4 repas équilibrés" },
    ],
  },
  {
    id: "tpl-hybride-debutant",
    titre: "Hybride Débutant — 3 séances",
    objectif: "Reprendre l'activité de façon équilibrée : force, cardio, mobilité.",
    cible: "Hybride",
    niveau: "Débutant",
    duree: "4 semaines",
    blocs: [
      { jour: "Lundi", titre: "Full body machines", details: "3x12 Goblet Squat 12kg · 3x10 Push-ups (inclinés si besoin) · 3x10 Rowing assis · 3x30s planche" },
      { jour: "Mercredi", titre: "Cardio + mobilité", details: "20 min vélo Z2 · 15 min mobilité hanches/épaules · 5 min étirements" },
      { jour: "Vendredi", titre: "Circuit fonctionnel", details: "3 rounds : 10 Air Squats · 8 Push-ups · 10 Sit-ups · 200m marche rapide" },
    ],
  },
  {
    id: "tpl-force-pure",
    titre: "Force pure — 4 jours",
    objectif: "Augmenter les charges sur les 3 mouvements rois (squat, bench, deadlift).",
    cible: "Force",
    niveau: "Avancé",
    duree: "5 semaines",
    blocs: [
      { jour: "Lundi", titre: "Squat heavy", details: "5x3 Back Squat @ 85% · 3x6 Front Squat · 3x10 Bulgarian Split Squat" },
      { jour: "Mardi", titre: "Bench heavy", details: "5x3 Bench Press @ 85% · 3x8 DB Press · 3x12 Tricep Pushdown" },
      { jour: "Jeudi", titre: "Deadlift heavy", details: "5x3 Deadlift @ 85% · 3x6 Romanian DL · 3x10 Hip Thrust" },
      { jour: "Vendredi", titre: "Tirage + core", details: "5x5 Pull-ups lestés · 4x8 Barbell Row · 3x12 Pallof Press" },
    ],
  },
  {
    id: "tpl-recuperation",
    titre: "Semaine de décharge",
    objectif: "Récupération active après cycle intense — réduire volume et intensité.",
    cible: "Récupération",
    niveau: "Débutant",
    duree: "1 semaine",
    blocs: [
      { jour: "Lundi", titre: "Mobilité longue", details: "45 min flow mobilité globale + foam roller complet" },
      { jour: "Mercredi", titre: "Footing Z1 court", details: "30 min footing très lent, respiration nasale exclusive" },
      { jour: "Vendredi", titre: "Yoga / respiration", details: "30 min yoga doux · 10 min Wim Hof Round 1 · cohérence cardiaque 5 min" },
      { jour: "Dimanche", titre: "Marche nature", details: "60-90 min marche en extérieur, sans montre, hydratation" },
    ],
  },
];

// Protocoles unitaires assignables à un jour précis du programme
export type Protocole = {
  id: string;
  pilier: "Bouger" | "Respirer" | "Nourrir";
  titre: string;
  contenu: string;
};

export const PROTOCOLES: Protocole[] = [
  { id: "p-amrap-hyrox", pilier: "Bouger", titre: "AMRAP Hyrox Prep (30 min)", contenu: "Échauffement 5 min · AMRAP 20 min : 5 Burpees · 10 KB Swings 20kg · 15 Wall Balls · 200m run · Retour calme 5 min" },
  { id: "p-circuit-3x3", pilier: "Bouger", titre: "Circuit Hybride 3x3 (25 min)", contenu: "3 rounds : 12 Goblet Squats · 10 Push-ups · 8 Inverted Rows · 200m marche · repos 90s entre rounds · finisher 2 min planche" },
  { id: "p-run-progressif", pilier: "Bouger", titre: "Run Progressif 5K (35 min)", contenu: "5 min marche · 5 min Z1 · 10 min Z2 · 10 min Z3 · 5 min retour marche" },
  { id: "p-coherence", pilier: "Respirer", titre: "Cohérence Cardiaque 5-5 (5 min)", contenu: "Assis dos droit, yeux fermés. Inspire 5s nez · expire 5s bouche · 6 cycles/min pendant 5 min" },
  { id: "p-wimhof", pilier: "Respirer", titre: "Wim Hof Round 1 (10 min)", contenu: "Allongé. 30-40 respirations profondes · expire rétention vide · inspire rétention 15s · 3 rounds" },
  { id: "p-box-breathing", pilier: "Respirer", titre: "Box breathing 4-4-4-4 (4 min)", contenu: "Inspire 4s · retiens 4s · expire 4s · retiens 4s. Protocole Navy SEALs, focus mental" },
  { id: "p-nutri-post", pilier: "Nourrir", titre: "Protocole post-effort", contenu: "30 min post-séance : 30g protéines + glucides rapides (whey + banane). 500ml eau + sel + citron. Repas complet 2h après" },
  { id: "p-nutri-marathon", pilier: "Nourrir", titre: "Timing endurance marathon", contenu: "J-2 charge glucidique · matin course : petit-déj 3h avant (oatmeal + banane) · pendant : gel toutes les 45 min après 60 min · post : protéines + glucides en 30 min" },
];
