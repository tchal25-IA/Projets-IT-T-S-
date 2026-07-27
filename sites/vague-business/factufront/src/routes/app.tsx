import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "App — FactuFront" },
      { name: "description", content: "Tableau de bord FactuFront" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { to: "/app/clients", label: "Clients", icon: Users, exact: false },
    { to: "/app/factures/nouvelle", label: "Nouvelle facture", icon: FileText, exact: false },
    { to: "/app/parametres", label: "Paramètres", icon: Settings, exact: false },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print hidden w-60 shrink-0 border-r border-border/60 bg-card/40 md:flex md:flex-col">
        <Link to="/" className="font-brand block px-6 py-6 text-2xl">
          FactuFront
        </Link>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-6 py-4 text-xs text-muted-foreground">
          <Link to="/mentions" className="hover:text-foreground">Mentions & disclaimer</Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="no-print fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/" className="font-brand text-lg">FactuFront</Link>
        <nav className="flex gap-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-md p-2 ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                aria-label={n.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 pt-16 md:pt-0">
        <Outlet />
        <Toaster />
      </main>
    </div>
  );
}
