import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, cloudConfigured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ background: "var(--ff-bg)", color: "var(--ff-text)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl grid place-items-center ff-glow-cyan animate-pulse"
            style={{ background: "oklch(0.78 0.16 198 / 20%)", border: "1px solid var(--ff-cyan)" }}
          >
            <Sparkles className="h-6 w-6" style={{ color: "var(--ff-cyan)" }} />
          </div>
          <p
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: "var(--ff-text-muted)" }}
          >
            {cloudConfigured ? "Initialisation Initiative…" : "Préparation de l'interface…"}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ background: "var(--ff-bg)", color: "var(--ff-text)" }}
      >
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
          Redirection connexion…
        </p>
      </div>
    );
  }

  return <Outlet />;
}
