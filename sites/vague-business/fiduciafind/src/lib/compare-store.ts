import { useEffect, useState, useCallback } from "react";

const KEY = "fiduciafind:compare";
const MAX = 3;

type Listener = (ids: string[]) => void;
const listeners = new Set<Listener>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((l) => l(ids));
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const l: Listener = (next) => setIds(next);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    let next: string[];
    if (current.includes(id)) {
      next = current.filter((x) => x !== id);
    } else {
      if (current.length >= MAX) return;
      next = [...current, id];
    }
    write(next);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { ids, toggle, remove, clear, max: MAX };
}
