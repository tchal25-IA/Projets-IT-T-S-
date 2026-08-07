"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Hit = {
  id: string;
  type: "lead" | "client";
  title: string;
  subtitle: string;
  href: string;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      start(async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) setHits(await res.json());
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 10);
        }}
        className="inline-flex max-w-full items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-500 hover:bg-white"
      >
        <Search size={14} />
        <span className="truncate">Rechercher…</span>
        <kbd className="hidden rounded border border-stone-200 bg-white px-1.5 text-[10px] text-stone-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[12vh] px-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-stone-200 bg-white shadow-none">
            <div className="flex items-center gap-2 border-b border-stone-200 px-3">
              <Search size={16} className="text-stone-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Leads, clients, email, téléphone…"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {pending ? (
                <p className="px-2 py-3 text-sm text-stone-500">Recherche…</p>
              ) : hits.length === 0 && q.trim().length >= 2 ? (
                <p className="px-2 py-3 text-sm text-stone-500">Aucun résultat</p>
              ) : (
                hits.map((h) => (
                  <button
                    key={`${h.type}-${h.id}`}
                    type="button"
                    className={cn(
                      "flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-stone-50"
                    )}
                    onClick={() => {
                      setOpen(false);
                      setQ("");
                      router.push(h.href);
                    }}
                  >
                    <span className="text-sm font-medium text-stone-900">{h.title}</span>
                    <span className="text-xs text-stone-500">
                      {h.type === "lead" ? "Lead" : "Client"} · {h.subtitle}
                    </span>
                  </button>
                ))
              )}
              {q.trim().length < 2 ? (
                <p className="px-2 py-3 text-sm text-stone-500">
                  Tapez au moins 2 caractères — ou ⌘K pour rouvrir.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
