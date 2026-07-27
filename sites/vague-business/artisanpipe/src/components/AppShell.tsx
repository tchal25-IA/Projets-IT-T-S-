import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Hammer, Users, FileText, BellRing, Settings, LayoutDashboard, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", label: "Pipeline", icon: LayoutDashboard, exact: true },
  { to: "/app/leads", label: "Prospects", icon: Users },
  { to: "/app/devis", label: "Devis", icon: FileText },
  { to: "/app/relances", label: "Relances", icon: BellRing },
  { to: "/app/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hammer className="h-5 w-5" />
            </div>
            <div className="font-display text-xl font-bold uppercase tracking-wide">
              ArtisanPipe
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={cn(
            "border-r border-border bg-card md:sticky md:top-[57px] md:block md:h-[calc(100vh-57px)] md:w-56 md:shrink-0",
            open ? "block" : "hidden",
          )}
        >
          <nav className="flex flex-col gap-1 p-3">
            {nav.map((item) => {
              const active = isActive(item.to, "exact" in item ? item.exact : false);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
