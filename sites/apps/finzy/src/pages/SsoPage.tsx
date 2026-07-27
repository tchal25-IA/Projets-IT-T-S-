import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function SsoPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("Lien SSO invalide.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sso-verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Échec SSO.");

        const { error: sessErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (sessErr) throw sessErr;

        navigate("/dashboard", { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec SSO.");
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-xl font-semibold text-destructive">Lien expiré</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Retournez sur Quotidien IA et cliquez à nouveau sur « Ouvrir Finzy ».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Connexion en cours…</span>
      </div>
    </div>
  );
}