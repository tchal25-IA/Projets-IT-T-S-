// Générateur de routine "de base" (auto), partagé entre la page Routine
// (génération + cases à cocher) et le Suivi (reconstruction de l'historique
// pour afficher le détail complet des exercices d'une séance passée).
export type CheckInState = { temps: number | null; energie: number | null; humeur: number | null };
export type Pilier = "Bouger" | "Respirer" | "Nourrir";
export type RoutineBlock = {
  pilier: Pilier;
  titre: string;
  duree: string;
  exercises: string[];
  intensite: "Légère" | "Modérée" | "Intense";
};

// Courte explication pour les exercices connus.
export const EXERCISE_TIPS: Record<string, string> = {
  "Burpees": "Debout → accroupi → pompe → saut – cardio et full body",
  "KB Swings": "Balancé de kettlebell genou-épaules, propulsion par les hanches",
  "Wall Balls": "Squat profond + lancer de medball contre le mur – puissance",
  "Air Squats": "Squat au poids du corps – quadriceps, fessiers, mobilité",
  "Push-ups": "Pompes : pectoraux, triceps, épaules et gainage",
  "Sit-ups": "Abdominaux classiques – gainage ventral et fléchisseurs",
  "Rotation des hanches": "Cercles lents des hanches pour ouvrir l'articulation",
  "Foam roller": "Rouler sur un foam roller pour relâcher les fascias musculaires",
  "200m marche rapide": "Marche active pour maintenir le cardio entre les séries",
  "200m run": "Course légère pour garder le rythme cardiaque entre les rounds",
  "3 rounds": "Répète le circuit 3 fois de suite avec peu ou pas de repos",
  "AMRAP": "As Many Rounds As Possible – max de rounds dans le temps imparti",
  "Inspire 5s": "Respiration cohérence cardiaque – 6 cycles/min régulent le stress",
  "Inspire 4s": "Box breathing – technique des Navy SEALs pour la concentration",
  "Banane": "Shake récupération : glucides + protéines + oméga-3 anti-inflammatoires",
  "30g protéines": "Fenêtre anabolique de 30 min post-effort – recharge musculaire",
};

// Suggestion de "scaling" (variante adaptée) pour les mouvements les plus
// courants — utile en cas de douleur/limitation (épaule, hanche, genou…).
export const SCALING_ALTERNATIVES: Record<string, string> = {
  "Push-ups": "Épaule sensible ? Pompes surélevées (mains sur banc) ou pompes sur les genoux.",
  "Burpees": "Genou/épaule sensible ? Step-back burpee sans saut, ou squat + plank sans pompe.",
  "Air Squats": "Hanche/genou limité(e) ? Squat sur box (profondeur réduite) ou squat en appui (chaise).",
  "KB Swings": "Dos sensible ? Deadlift kettlebell léger, mouvement plus contrôlé, amplitude réduite.",
  "Wall Balls": "Épaule/genou limité(e) ? Squat au poids du corps + lancer de balle légère à hauteur réduite.",
  "Sit-ups": "Dos sensible ? Crunchs courts ou gainage (planche) à la place.",
  "200m run": "Limitation aux jambes ? Vélo ou rameur léger sur la même durée.",
  "Pull-ups": "Pas encore accessible ? Rowing horizontal ou tirage élastique.",
};

export function scalingFor(exercise: string): string | null {
  for (const [key, alt] of Object.entries(SCALING_ALTERNATIVES)) {
    if (exercise.toLowerCase().includes(key.toLowerCase())) return alt;
  }
  return null;
}

export function tipFor(exercise: string): string | null {
  for (const [key, tip] of Object.entries(EXERCISE_TIPS)) {
    if (exercise.toLowerCase().includes(key.toLowerCase())) return tip;
  }
  return null;
}

function parseExercises(description: string): string[] {
  return description.split(" · ").map((s) => s.trim()).filter(Boolean);
}

// Certains blocs commencent par un "format" (AMRAP, 3 rounds…) qui doit
// s'afficher à côté du titre plutôt que dans la liste d'exercices.
const FORMAT_PREFIXES = ["AMRAP", "3 rounds", "4 rounds", "5 rounds", "For Time", "For Quality", "EMOM"];

export function splitFormat(exercises: string[]): { format: string | null; exercises: string[] } {
  if (exercises.length && FORMAT_PREFIXES.some((p) => exercises[0].toLowerCase() === p.toLowerCase())) {
    return { format: exercises[0], exercises: exercises.slice(1) };
  }
  return { format: null, exercises };
}

export function generateRoutine(state: CheckInState): RoutineBlock[] {
  const e = state.energie ?? 3;
  const h = state.humeur  ?? 3;
  const t = state.temps   ?? 2;
  const score = (e + h) / 2;
  const intensite: RoutineBlock["intensite"] =
    score <= 2 ? "Légère" : score <= 3.5 ? "Modérée" : "Intense";

  const blocks: RoutineBlock[] = [];
  if (intensite === "Légère") {
    blocks.push({
      pilier: "Bouger", titre: "Mobilité articulaire",
      duree: t === 1 ? "10 min" : "20 min",
      exercises: parseExercises("Rotation des hanches · épaules · chevilles · Foam roller"),
      intensite,
    });
  } else if (intensite === "Modérée") {
    blocks.push({
      pilier: "Bouger", titre: "Circuit CrossFit modéré",
      duree: t === 1 ? "12 min" : t === 2 ? "25 min" : "40 min",
      exercises: parseExercises("3 rounds · 10 Air Squats · 10 Push-ups · 10 Sit-ups · 200m marche rapide"),
      intensite,
    });
  } else {
    blocks.push({
      pilier: "Bouger", titre: "AMRAP Hyrox Prep",
      duree: t === 1 ? "15 min" : t === 2 ? "30 min" : "55 min",
      exercises: parseExercises("AMRAP · 5 Burpees · 10 KB Swings · 15 Wall Balls · 200m run"),
      intensite,
    });
  }
  if (score < 3 || h <= 2) {
    blocks.push({
      pilier: "Respirer", titre: "Cohérence cardiaque 5-5",
      duree: "5 min",
      exercises: parseExercises("Inspire 5s — expire 5s · 6 cycles/min, main sur le cœur"),
      intensite: "Légère",
    });
  } else {
    blocks.push({
      pilier: "Respirer", titre: "Box breathing 4-4-4-4",
      duree: "4 min",
      exercises: parseExercises("Inspire 4s — retiens 4s — expire 4s — retiens 4s · Protocole Navy SEALs"),
      intensite: "Légère",
    });
  }
  if (t >= 2) {
    if (e <= 2) {
      blocks.push({
        pilier: "Nourrir", titre: "Smoothie récupération",
        duree: "5 min",
        exercises: parseExercises("Banane · épinards · whey · lait d'amande · graines de chia"),
        intensite: "Légère",
      });
    } else {
      blocks.push({
        pilier: "Nourrir", titre: "Protocole performance",
        duree: "5 min",
        exercises: parseExercises("30g protéines dans les 30 min · 500ml eau + électrolytes"),
        intensite: "Modérée",
      });
    }
  }
  return blocks;
}
