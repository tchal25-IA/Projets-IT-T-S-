// Dark/light/system theme provider with localStorage persistence
import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "fusionfit-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  // Initial load from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial: ThemeMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setModeState(initial);
  }, []);

  // Apply theme whenever mode or system pref changes
  useEffect(() => {
    const next = mode === "system" ? getSystemTheme() : mode;
    setResolved(next);
    applyTheme(next);

    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const sys = mq.matches ? "light" : "dark";
      setResolved(sys);
      applyTheme(sys);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, m);
  };

  const toggle = () => setMode(resolved === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
