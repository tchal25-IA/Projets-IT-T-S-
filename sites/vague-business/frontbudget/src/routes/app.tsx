import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Mon budget — FrontBudget" },
      { name: "description", content: "Tableau de bord de votre budget frontalier CHF + EUR." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

const NAV: { to: string; label: string; exact?: boolean }[] = [
  { to: "/app", label: "Tableau de bord", exact: true },
  { to: "/app/transactions", label: "Transactions" },
  { to: "/app/comptes", label: "Comptes" },
  { to: "/app/budgets", label: "Budgets" },
  { to: "/app/parametres", label: "Paramètres" },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="font-brand text-xl font-semibold tracking-tight">
            Front<span className="text-primary">Budget</span>
          </Link>
          <div className="text-xs text-muted-foreground">Free · 1 mois</div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2 sm:px-4">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
