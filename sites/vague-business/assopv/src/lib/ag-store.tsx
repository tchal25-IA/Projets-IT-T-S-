import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "fr" | "de" | "bilingual";
export type AGType = "ordinaire" | "extraordinaire";

export interface AgendaItem {
  id: string;
  title: string;
  notes: string; // decisions/notes
  hasVote: boolean;
  vote: { pour: number; contre: number; abstention: number };
}

export interface Attendee {
  id: string;
  name: string;
  voix: number;
}

export interface AGData {
  // Step 1
  assoName: string;
  siege: string;
  canton: string;
  agDate: string;
  agTime: string;
  agLieu: string;
  agType: AGType;
  lang: Lang;
  // Step 2
  convocationDate: string;
  convocationIntro: string;
  signPresident: string;
  signSecretaire: string;
  // Step 3
  agenda: AgendaItem[];
  // Step 4
  attendees: Attendee[];
  quorumNote: string;
  // Step 5
  pvClosingLieu: string;
  pvClosingDate: string;
  // meta
  email?: string;
}

export const CANTONS = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];

const DEFAULT_AGENDA: AgendaItem[] = [
  { id: "a1", title: "Accueil et salutations", notes: "", hasVote: false, vote: { pour: 0, contre: 0, abstention: 0 } },
  { id: "a2", title: "Approbation du procès-verbal précédent", notes: "", hasVote: true, vote: { pour: 0, contre: 0, abstention: 0 } },
  { id: "a3", title: "Rapport du comité", notes: "", hasVote: false, vote: { pour: 0, contre: 0, abstention: 0 } },
  { id: "a4", title: "Comptes et rapport de la trésorerie", notes: "", hasVote: true, vote: { pour: 0, contre: 0, abstention: 0 } },
  { id: "a5", title: "Budget de l'exercice", notes: "", hasVote: true, vote: { pour: 0, contre: 0, abstention: 0 } },
  { id: "a6", title: "Élections du comité", notes: "", hasVote: true, vote: { pour: 0, contre: 0, abstention: 0 } },
  { id: "a7", title: "Divers", notes: "", hasVote: false, vote: { pour: 0, contre: 0, abstention: 0 } },
];

export const EMPTY_AG: AGData = {
  assoName: "",
  siege: "",
  canton: "VD",
  agDate: "",
  agTime: "20:00",
  agLieu: "",
  agType: "ordinaire",
  lang: "fr",
  convocationDate: "",
  convocationIntro: "Au nom du comité, nous avons le plaisir de vous convier à notre assemblée générale.",
  signPresident: "",
  signSecretaire: "",
  agenda: DEFAULT_AGENDA,
  attendees: [],
  quorumNote: "Quorum atteint : oui",
  pvClosingLieu: "",
  pvClosingDate: "",
};

const STORAGE_KEY = "assopv:ag:v1";

interface Ctx {
  data: AGData;
  update: (patch: Partial<AGData>) => void;
  reset: () => void;
}

const AGContext = createContext<Ctx | null>(null);

export function AGProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AGData>(EMPTY_AG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...EMPTY_AG, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data, hydrated]);

  return (
    <AGContext.Provider value={{ data, update: (p) => setData((d) => ({ ...d, ...p })), reset: () => setData(EMPTY_AG) }}>
      {children}
    </AGContext.Provider>
  );
}

export function useAG() {
  const ctx = useContext(AGContext);
  if (!ctx) throw new Error("useAG outside provider");
  return ctx;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
