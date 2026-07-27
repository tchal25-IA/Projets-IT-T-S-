import { useEffect, useState, useCallback } from "react";
import {
  getLeads,
  setLeads,
  getQuotes,
  setQuotes,
  getReminders,
  setReminders,
  getProfile,
  setProfile,
  seedIfEmpty,
} from "./store";
import type { Lead, Quote, Reminder, Profile } from "./types";

function useStore<T>(getter: () => T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(getter);
  useEffect(() => {
    seedIfEmpty();
    setValue(getter());
    const handler = () => setValue(getter());
    window.addEventListener("ap:store", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("ap:store", handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [value, setValue];
}

export function useLeads() {
  const [leads] = useStore<Lead[]>(getLeads);
  const save = useCallback((next: Lead[]) => setLeads(next), []);
  return { leads, save };
}

export function useQuotes() {
  const [quotes] = useStore<Quote[]>(getQuotes);
  const save = useCallback((next: Quote[]) => setQuotes(next), []);
  return { quotes, save };
}

export function useReminders() {
  const [reminders] = useStore<Reminder[]>(getReminders);
  const save = useCallback((next: Reminder[]) => setReminders(next), []);
  return { reminders, save };
}

export function useProfile() {
  const [profile] = useStore<Profile>(getProfile);
  const save = useCallback((next: Profile) => setProfile(next), []);
  return { profile, save };
}
