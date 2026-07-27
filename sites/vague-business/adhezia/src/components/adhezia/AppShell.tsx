import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, CreditCard, QrCode, Settings, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/adhezia-store";

type NavItem = { to: "/app" | "/app/membres" | "/app/cotisations" | "/app/checkin" | "/app/parametres"; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };
const nav: NavItem[] = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/app/membres", label: "Membres", icon: Users },
  { to: "/app/cotisations", label: "Cotisations", icon: CreditCard },
  { to: "/app/checkin", label: "Check-in", icon: QrCode },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const club = useStore((s) => s.club);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 h-14">
        <Link to="/app" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-lg">Adhezia</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="size-5" />
        </Button>
      </header>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-shrink-0 border-r border-border bg-card",
            "lg:block",
            open ? "block" : "hidden",
          )}
        >
          <div className="hidden lg:flex items-center gap-2 px-5 h-16 border-b border-border">
            <Logo />
            <span className="font-display text-xl">Adhezia</span>
          </div>
          <nav className="p-3 space-y-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-secondary",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 mt-4 mx-3 rounded-lg bg-secondary/60">
            <p className="text-xs text-muted-foreground">Club actif</p>
            <p className="font-medium truncate">{club.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Saison {club.seasonYear} · {club.canton}</p>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground font-display font-semibold",
        className,
      )}
      aria-hidden
    >
      A
    </span>
  );
}
