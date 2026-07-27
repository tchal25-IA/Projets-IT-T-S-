import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LS_KEYS, readLS, writeLS } from "@/lib/storage";

export type Theme = "system" | "light" | "dark";

type Ctx = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

function applyTheme(t: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = t === "system" ? (prefersDark ? "dark" : "light") : t;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = readLS<Theme>(LS_KEYS.theme, "system");
    setThemeState(saved);
    setResolved(applyTheme(saved));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readLS<Theme>(LS_KEYS.theme, "system") === "system") {
        setResolved(applyTheme("system"));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    writeLS(LS_KEYS.theme, t);
    setThemeState(t);
    setResolved(applyTheme(t));
  }, []);

  return <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
