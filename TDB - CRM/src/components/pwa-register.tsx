"use client";

import { useEffect } from "react";

/** Enregistre le SW et purge les anciennes versions (cache-first v1). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          // Force update pour basculer vers sw v2 (network-first data)
          await reg.update();
        }
        if (cancelled) return;
        const reg = await navigator.serviceWorker.register("/sw.js");
        await reg.update();
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
