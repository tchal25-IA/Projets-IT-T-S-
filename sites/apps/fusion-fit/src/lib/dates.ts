// Jours de la semaine en français, alignés sur l'ordre des éditeurs de programme.
export const JOURS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;
export type JourFr = (typeof JOURS_FR)[number];

/** Canonicalise « mer », « Mercredi », « mercredi. » → « Mercredi ». Évite Mar/Mer/Sam. */
export function normalizeJourFr(raw: string | null | undefined): JourFr | null {
  if (!raw) return null;
  const s = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!s) return null;

  const exact: Record<string, JourFr> = {
    lundi: "Lundi",
    lun: "Lundi",
    mardi: "Mardi",
    mar: "Mardi",
    mercredi: "Mercredi",
    mer: "Mercredi",
    jeudi: "Jeudi",
    jeu: "Jeudi",
    vendredi: "Vendredi",
    ven: "Vendredi",
    samedi: "Samedi",
    sam: "Samedi",
    dimanche: "Dimanche",
    dim: "Dimanche",
  };
  if (exact[s]) return exact[s];

  // Préfixe : l'entrée doit coller au début du nom du jour (ex. "mercr" → Mercredi).
  // On teste les jours complets pour ne jamais confondre Mar/Mer/Sam.
  for (const jour of JOURS_FR) {
    const canon = jour
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (s.length >= 3 && canon.startsWith(s)) return jour;
  }
  return null;
}

export function sameJourFr(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeJourFr(a);
  const nb = normalizeJourFr(b);
  return !!na && !!nb && na === nb;
}

/** Filtre les blocs du programme pour un jour donné (tolérant aux variantes). */
export function blocsForJour<T extends { jour: string }>(blocs: T[] | null | undefined, jour: string): T[] {
  return (blocs ?? []).filter((b) => sameJourFr(b.jour, jour));
}

// JS Date#getDay() renvoie 0=Dimanche..6=Samedi ; on réaligne sur JOURS_FR.
export function jourFrDe(date: Date): JourFr {
  const idx = (date.getDay() + 6) % 7; // 0=Lundi..6=Dimanche
  return JOURS_FR[idx];
}

export function todayJourFr(): JourFr {
  return jourFrDe(new Date());
}

/** Date locale YYYY-MM-DD (évite le décalage UTC de toISOString). */
export function todayISO(): string {
  return localISODate(new Date());
}

export function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
