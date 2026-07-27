import type { Lead, Quote, Reminder, Profile } from "./types";

const KEYS = {
  profile: "ap.profile",
  leads: "ap.leads",
  quotes: "ap.quotes",
  reminders: "ap.reminders",
  seeded: "ap.seeded.v1",
  emailGate: "ap.emailGate",
};

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("ap:store"));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

const defaultProfile: Profile = {
  businessName: "Atelier Dupont Plomberie",
  phone: "+41 79 123 45 67",
  email: "contact@dupont-plomberie.ch",
  address: "Rue du Chantier 12, 1204 Genève",
  tva: 8.1,
  currency: "CHF",
};

export function getProfile(): Profile {
  return read(KEYS.profile, defaultProfile);
}
export function setProfile(p: Profile) {
  write(KEYS.profile, p);
}

export function getLeads(): Lead[] {
  return read<Lead[]>(KEYS.leads, []);
}
export function setLeads(l: Lead[]) {
  write(KEYS.leads, l);
}

export function getQuotes(): Quote[] {
  return read<Quote[]>(KEYS.quotes, []);
}
export function setQuotes(q: Quote[]) {
  write(KEYS.quotes, q);
}

export function getReminders(): Reminder[] {
  return read<Reminder[]>(KEYS.reminders, []);
}
export function setReminders(r: Reminder[]) {
  write(KEYS.reminders, r);
}

export function getEmailGate(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEYS.emailGate);
}
export function setEmailGate(email: string) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.emailGate, email);
  window.dispatchEvent(new CustomEvent("ap:store"));
}

export function seedIfEmpty() {
  if (!isBrowser()) return;
  if (localStorage.getItem(KEYS.seeded)) return;

  const now = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
  };

  const leads: Lead[] = [
    {
      id: "l1",
      name: "Mme Rossi",
      phone: "+41 78 555 12 34",
      email: "rossi@exemple.ch",
      city: "Genève",
      source: "Bouche à oreille",
      status: "devis_envoyé",
      notes: "Fuite salle de bain — urgent.",
      createdAt: iso(-6),
    },
    {
      id: "l2",
      name: "M. Bernard",
      phone: "+41 76 222 88 90",
      email: "bernard@exemple.ch",
      city: "Lausanne",
      source: "Google",
      status: "contacté",
      notes: "Remplacement chauffe-eau 200L.",
      createdAt: iso(-3),
    },
    {
      id: "l3",
      name: "Café des Amis",
      phone: "+41 22 700 11 22",
      email: "cafe@exemple.ch",
      city: "Carouge",
      source: "Recommandation",
      status: "nouveau",
      notes: "Rénovation sanitaires du restaurant.",
      createdAt: iso(-1),
    },
    {
      id: "l4",
      name: "Régie Léman",
      phone: "+41 22 555 99 00",
      email: "regie@exemple.ch",
      city: "Nyon",
      source: "Site web",
      status: "gagné",
      notes: "Contrat entretien 4 immeubles.",
      createdAt: iso(-15),
    },
  ];

  const quotes: Quote[] = [
    {
      id: "q1",
      leadId: "l1",
      number: "AP-2026-0001",
      status: "envoyé",
      createdAt: iso(-6),
      validUntil: iso(24),
      notes: "Intervention sous 48h dès acceptation.",
      lines: [
        { id: uid(), desc: "Diagnostic + main d'œuvre", qty: 3, unitPrice: 95, tva: 8.1 },
        { id: uid(), desc: "Mitigeur thermostatique Grohe", qty: 1, unitPrice: 240, tva: 8.1 },
        { id: uid(), desc: "Petites fournitures", qty: 1, unitPrice: 45, tva: 8.1 },
      ],
    },
    {
      id: "q2",
      leadId: "l4",
      number: "AP-2026-0002",
      status: "accepté",
      createdAt: iso(-14),
      validUntil: iso(16),
      notes: "Contrat annuel — facturation trimestrielle.",
      lines: [
        { id: uid(), desc: "Contrat entretien annuel (4 immeubles)", qty: 1, unitPrice: 3800, tva: 8.1 },
      ],
    },
  ];

  const reminders: Reminder[] = [
    {
      id: "r1",
      quoteId: "q1",
      dueDate: iso(-2),
      done: false,
      channel: "appel",
      note: "Rappeler Mme Rossi pour validation devis.",
    },
  ];

  write(KEYS.leads, leads);
  write(KEYS.quotes, quotes);
  write(KEYS.reminders, reminders);
  localStorage.setItem(KEYS.seeded, "1");
}
