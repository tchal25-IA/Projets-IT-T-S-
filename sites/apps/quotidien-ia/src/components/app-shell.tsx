import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Sparkles, Sun, Moon, Monitor, Menu, X, LogOut, LogIn, LayoutDashboard, Wallet, ListChecks, Settings, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { TOP_NAV } from "@/lib/modules";
import { cn } from "@/lib/utils";

// 5 onglets principaux affichés dans la bottom nav mobile
const BOTTOM_NAV = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/productivite", label: "Tâches", icon: ListChecks },
  { to: "/paperasse", label: "Experts", icon: FileText },
  { to: "/parametres", label: "Réglages", icon: Settings },
] as const;
import { useTheme, type Theme } from "@/components/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { supabase } from "@/integrations/supabase/client";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const opts: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Clair" },
    { value: "system", icon: Monitor, label: "Auto" },
    { value: "dark", icon: Moon, label: "Sombre" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-md border bg-background p-1">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-label={`Thème ${o.label}`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-hero text-primary-foreground shadow-card">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-base font-bold tracking-tight">Quotidien IA</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Hub vie active
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {TOP_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 text-[11px] text-muted-foreground">
        <p>v0.2 · Cloud</p>
        <p className="mt-1">Compte & abonnement synchronisés.</p>
      </div>
    </div>
  );
}

// Routes accessibles sans compte
const PUBLIC_ROUTES = new Set<string>(["/", "/login"]);
const PUBLIC_PREFIXES = ["/outils", "/mentions-legales", "/confidentialite", "/cgu", "/cookies", "/sso"];

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setSessionLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const publicPage = isPublicPath(pathname);

  // Redirection vers /login pour toute page protégée
  useEffect(() => {
    if (sessionLoading) return;
    if (session) return;
    if (publicPage) return;
    navigate({ to: "/login", search: { next: pathname } });
  }, [sessionLoading, session, publicPage, pathname, navigate]);

  // Redirige vers l'onboarding au 1er accès après connexion (vérifie côté Cloud)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/onboarding" || pathname === "/login") return;
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!data) navigate({ to: "/onboarding" });
    })();
  }, [pathname, navigate, session]);

  // Utilisateur connecté sur la landing publique → envoie vers son hub
  useEffect(() => {
    if (sessionLoading) return;
    if (session && pathname === "/") navigate({ to: "/app" });
  }, [sessionLoading, session, pathname, navigate]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Écran de chargement pour éviter le flash de contenu protégé
  const blockingProtected = !sessionLoading && !session && !publicPage;
  if (sessionLoading || blockingProtected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const userEmail = session?.user.email ?? null;


  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-elev">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md border md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          {userEmail ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm sm:flex">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="max-w-[160px] truncate text-muted-foreground">{userEmail}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Se déconnecter"
                className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <LogIn className="h-4 w-4" /> Connexion
            </button>
          )}
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-4 md:px-8 md:py-10">{children}</div>
        </main>

        <footer className="border-t bg-card/30 px-4 py-5 text-xs text-muted-foreground md:px-8 md:py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="leading-relaxed">© {new Date().getFullYear()} Quotidien IA — Plateforme indicative, non un cabinet de conseil.</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <a href="https://www.impots.gouv.fr/" target="_blank" rel="noreferrer" className="hover:text-foreground">Impôts FR</a>
                <a href="https://www.service-public.fr/" target="_blank" rel="noreferrer" className="hover:text-foreground">Service Public</a>
                <a href="https://swisstaxcalculator.estv.admin.ch/#/home/" target="_blank" rel="noreferrer" className="hover:text-foreground">AFC (CH)</a>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t pt-3">
              <Link to="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
              <Link to="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
              <Link to="/cgu" className="hover:text-foreground">CGU</Link>
              <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Bottom nav mobile — 5 raccourcis principaux */}
      {session && (
        <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-stretch border-t bg-background/95 backdrop-blur md:hidden">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Espace pour la bottom nav sur mobile */}
      {session && <div className="h-16 md:hidden" />}

      <CookieConsent />
    </div>
  );
}
