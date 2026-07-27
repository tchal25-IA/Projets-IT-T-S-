import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";

/**
 * Bloque le rendu tant que la session n'est pas connue.
 * Redirige vers /login?next=<current> si non authentifié.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login", search: { next: pathname } });
    }
  }, [loading, session, navigate, pathname]);

  if (loading || !session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
