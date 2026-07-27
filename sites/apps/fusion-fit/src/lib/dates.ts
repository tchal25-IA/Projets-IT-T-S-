// Jours de la semaine en français, alignés sur l'ordre utilisé par les
// éditeurs de programme (coach) : Lundi en premier.
export const JOURS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

// JS Date#getDay() renvoie 0=Dimanche..6=Samedi ; on réaligne sur JOURS_FR.
export function jourFrDe(date: Date): string {
  const idx = (date.getDay() + 6) % 7; // 0=Lundi..6=Dimanche
  return JOURS_FR[idx];
}

export function todayJourFr(): string {
  return jourFrDe(new Date());
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
