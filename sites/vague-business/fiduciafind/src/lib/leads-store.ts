export interface Lead {
  id: string;
  fiduciaireId: string;
  name: string;
  email: string;
  phone?: string;
  besoin: string;
  message: string;
  createdAt: string;
}

const KEY = "fiduciafind:leads";
const EMAIL_KEY = "fiduciafind:capturedEmail";

export function saveLead(lead: Omit<Lead, "id" | "createdAt">): Lead {
  const full: Lead = {
    ...lead,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return full;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: Lead[] = raw ? JSON.parse(raw) : [];
    list.push(full);
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return full;
}

export function hasCapturedEmail(): boolean {
  if (typeof window === "undefined") return true;
  return !!window.localStorage.getItem(EMAIL_KEY);
}

export function markEmailCaptured(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_KEY, email);
}
