import { useEffect, useState, useCallback } from "react";
import type { Staff, DayEntry, Method, Currency, Role } from "./tipEngine";

export interface Venue {
  name: string;
  country: "CH" | "FR";
  currency: Currency;
  defaultMethod: Method;
}

interface State {
  venue: Venue;
  staff: Staff[];
  days: DayEntry[];
  emailCaptured?: string;
}

const KEY = "tipshare:v1";

function seed(): State {
  const today = new Date().toISOString().slice(0, 10);
  const staff: Staff[] = [
    { id: "s1", name: "Camille", role: "serveur", weight: 1, active: true },
    { id: "s2", name: "Nadia", role: "bar", weight: 1.1, active: true },
    { id: "s3", name: "Yanis", role: "cuisine", weight: 0.8, active: true },
    { id: "s4", name: "Léa", role: "accueil", weight: 0.9, active: true },
    { id: "s5", name: "Marc", role: "manager", weight: 1.2, active: true },
  ];
  const days: DayEntry[] = [
    {
      id: "d1",
      date: today,
      method: "role_weight",
      tipsCash: 120,
      tipsCard: 85.5,
      tipsOther: 0,
      presences: [
        { staffId: "s1", hours: 7 },
        { staffId: "s2", hours: 6 },
        { staffId: "s3", hours: 8 },
        { staffId: "s4", hours: 5 },
        { staffId: "s5", hours: 4 },
      ],
      notes: "Service complet",
      locked: false,
    },
  ];
  return {
    venue: {
      name: "Ma Brasserie",
      country: "CH",
      currency: "CHF",
      defaultMethod: "role_weight",
    },
    staff,
    days,
  };
}

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as State;
  } catch {
    return seed();
  }
}

function save(state: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

let listeners: Array<() => void> = [];
let current: State | null = null;

function ensure(): State {
  if (!current) current = load();
  return current;
}

function update(mutator: (s: State) => State) {
  current = mutator(ensure());
  save(current);
  listeners.forEach((l) => l());
}

export function useTipStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    // Trigger initial load on client
    ensure();
    setTick((t) => t + 1);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const state = ensure();

  const setVenue = useCallback((v: Partial<Venue>) => {
    update((s) => ({ ...s, venue: { ...s.venue, ...v } }));
  }, []);

  const addStaff = useCallback((name: string, role: Role) => {
    const id = "s_" + Math.random().toString(36).slice(2, 9);
    update((s) => ({
      ...s,
      staff: [...s.staff, { id, name, role, weight: 1, active: true }],
    }));
  }, []);

  const updateStaff = useCallback((id: string, patch: Partial<Staff>) => {
    update((s) => ({
      ...s,
      staff: s.staff.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }, []);

  const removeStaff = useCallback((id: string) => {
    update((s) => ({ ...s, staff: s.staff.filter((x) => x.id !== id) }));
  }, []);

  const upsertDay = useCallback((day: DayEntry) => {
    update((s) => {
      const exists = s.days.some((d) => d.id === day.id);
      return {
        ...s,
        days: exists ? s.days.map((d) => (d.id === day.id ? day : d)) : [day, ...s.days],
      };
    });
  }, []);

  const removeDay = useCallback((id: string) => {
    update((s) => ({ ...s, days: s.days.filter((d) => d.id !== id) }));
  }, []);

  const setEmail = useCallback((email: string) => {
    update((s) => ({ ...s, emailCaptured: email }));
  }, []);

  const resetAll = useCallback(() => {
    current = seed();
    save(current);
    listeners.forEach((l) => l());
  }, []);

  return {
    ...state,
    setVenue,
    addStaff,
    updateStaff,
    removeStaff,
    upsertDay,
    removeDay,
    setEmail,
    resetAll,
  };
}

export function newDayId() {
  return "d_" + Math.random().toString(36).slice(2, 9);
}
