// Simple localStorage helpers — SSR-safe
export function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function clearLS(prefix = "qia:") {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
}

export const LS_KEYS = {
  theme: "qia:theme",
  profile: "qia:profile",
  tasks: "qia:tasks",
  events: "qia:events",
  favorites: "qia:favorites",
  agentThreads: "qia:agentThreads",
  tmProjects: "qia:tm:projects",
  tmTasks: "qia:tm:tasks",
  tmInit: "qia:tm:init:v2",
  business: "qia:business",
} as const;
