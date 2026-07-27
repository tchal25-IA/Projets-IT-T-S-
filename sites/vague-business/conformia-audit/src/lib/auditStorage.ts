import type { Answers } from "./complianceEngine";

const KEY = "conformia:audit:v1";

export interface StoredAudit {
  answers: Answers;
  updatedAt: string;
  currentStep: number;
}

export function loadAudit(): StoredAudit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAudit;
  } catch {
    return null;
  }
}

export function saveAudit(a: StoredAudit) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // ignore
  }
}

export function clearAudit() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

const DEMO_KEY = "conformia:demo:v1";
export function setDemoFlag(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.sessionStorage.setItem(DEMO_KEY, "1");
  else window.sessionStorage.removeItem(DEMO_KEY);
}
export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_KEY) === "1";
}

const EMAIL_KEY = "conformia:email:v1";
export function saveEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_KEY, email);
}
export function getEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(EMAIL_KEY);
}
