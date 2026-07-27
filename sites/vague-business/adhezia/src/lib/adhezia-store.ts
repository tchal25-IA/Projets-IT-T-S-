import { useRef, useSyncExternalStore } from "react";

export type MemberStatus = "actif" | "en_retard" | "inactif";
export type PaymentStatus = "à_payer" | "payé" | "exonéré";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: MemberStatus;
  joinedAt: string; // ISO
  notes?: string;
  code: string; // check-in code
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  period: string; // "2026"
  status: PaymentStatus;
  paidAt?: string;
}

export interface ClubProfile {
  name: string;
  canton: string;
  seasonYear: string;
  defaultDues: number;
  currency: string;
}

export interface Attendance {
  memberId: string;
  at: string; // ISO
}

interface State {
  club: ClubProfile;
  members: Member[];
  payments: Payment[];
  attendance: Attendance[];
  emailGate?: string;
}

const KEY = "adhezia:v1";

const defaultClub: ClubProfile = {
  name: "FC Aurore Lausanne",
  canton: "VD",
  seasonYear: "2026",
  defaultDues: 120,
  currency: "CHF",
};

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function seed(): State {
  const season = defaultClub.seasonYear;
  const dues = defaultClub.defaultDues;
  const members: Member[] = [
    { id: "m1", name: "Camille Rochat", email: "camille@aurore.ch", phone: "+41 78 111 22 33", status: "actif", joinedAt: "2024-09-01", code: makeCode() },
    { id: "m2", name: "Noah Bühler", email: "noah@aurore.ch", phone: "+41 79 222 33 44", status: "en_retard", joinedAt: "2023-09-01", code: makeCode() },
    { id: "m3", name: "Léa Fontanet", email: "lea@aurore.ch", phone: "+41 76 333 44 55", status: "actif", joinedAt: "2025-01-15", code: makeCode() },
    { id: "m4", name: "Yannick Diallo", email: "yannick@aurore.ch", phone: "+41 78 444 55 66", status: "actif", joinedAt: "2022-09-01", code: makeCode() },
    { id: "m5", name: "Elise Marmier", email: "elise@aurore.ch", phone: "+41 79 555 66 77", status: "inactif", joinedAt: "2021-09-01", code: makeCode() },
  ];
  const payments: Payment[] = [
    { id: "p1", memberId: "m1", amount: dues, period: season, status: "payé", paidAt: "2025-09-10" },
    { id: "p2", memberId: "m2", amount: dues, period: season, status: "à_payer" },
    { id: "p3", memberId: "m3", amount: dues, period: season, status: "payé", paidAt: "2025-09-22" },
    { id: "p4", memberId: "m4", amount: dues, period: season, status: "à_payer" },
    { id: "p5", memberId: "m5", amount: dues, period: season, status: "exonéré" },
  ];
  return { club: defaultClub, members, payments, attendance: [] };
}

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as State;
  } catch {
    return seed();
  }
}

function save() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function set(mut: (s: State) => void) {
  const next = structuredClone(state);
  mut(next);
  state = next;
  save();
}

export const store = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  addMember: (m: Omit<Member, "id" | "code">) => {
    set((s) => {
      const id = "m_" + Date.now();
      s.members.push({ ...m, id, code: makeCode() });
      s.payments.push({
        id: "p_" + Date.now(),
        memberId: id,
        amount: s.club.defaultDues,
        period: s.club.seasonYear,
        status: "à_payer",
      });
    });
  },
  updateMember: (id: string, patch: Partial<Member>) => {
    set((s) => {
      const i = s.members.findIndex((x) => x.id === id);
      if (i >= 0) s.members[i] = { ...s.members[i], ...patch };
    });
  },
  removeMember: (id: string) => {
    set((s) => {
      s.members = s.members.filter((m) => m.id !== id);
      s.payments = s.payments.filter((p) => p.memberId !== id);
    });
  },
  setPaymentStatus: (id: string, status: PaymentStatus) => {
    set((s) => {
      const p = s.payments.find((x) => x.id === id);
      if (p) {
        p.status = status;
        p.paidAt = status === "payé" ? new Date().toISOString() : undefined;
      }
    });
  },
  markPresent: (memberId: string) => {
    set((s) => {
      s.attendance.push({ memberId, at: new Date().toISOString() });
    });
  },
  clearAttendance: () => set((s) => { s.attendance = []; }),
  updateClub: (patch: Partial<ClubProfile>) => set((s) => { s.club = { ...s.club, ...patch }; }),
  setEmailGate: (email: string) => set((s) => { s.emailGate = email; }),
  reset: () => { state = seed(); save(); },
};

export function useStore<T>(selector: (s: State) => T): T {
  const cacheRef = useRef<{ snap: State; value: T } | null>(null);

  const getSnapshot = () => {
    const cached = cacheRef.current;
    if (cached && cached.snap === state) return cached.value;
    const value = selector(state);
    cacheRef.current = { snap: state, value };
    return value;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
