import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  kind: ToastKind;
};

type ToastContextType = {
  toast: (message: string, kind?: ToastKind) => void;
};

/* ─── Context ────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = crypto.randomUUID();
    setToasts((ts) => [...ts.slice(-4), { id, message, kind }]);
    const timer = setTimeout(() => dismiss(id), 4000);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

  const ICON: Record<ToastKind, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  const BAR: Record<ToastKind, string> = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-blue-500",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border bg-card shadow-elev"
          >
            <div className={cn("w-1 shrink-0 self-stretch", BAR[t.kind])} />
            <div className="flex flex-1 items-start gap-2 py-3 pr-1">
              <span className="mt-0.5 shrink-0">{ICON[t.kind]}</span>
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="mr-2 mt-2.5 shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
