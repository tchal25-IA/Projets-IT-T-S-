import type { AppState } from "./types";
import { seedState } from "./seed";

const KEY = "frontbudget:v1";

export function loadState(): AppState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seedState();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return seedState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const s = seedState();
  saveState(s);
  return s;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
