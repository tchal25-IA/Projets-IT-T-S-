import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/toast";
import type { ConnectedAppKey } from "@/lib/connected-apps";

/**
 * Bouton « Ouvrir » qui ouvre une application connectée (Finzy / Paperasse) en SSO :
 * récupère le jeton Supabase, demande une URL signée à /api/sso, puis redirige.
 */
export function ConnectedAppButton({
  app,
  label,
  className,
}: {
  app: ConnectedAppKey;
  label: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Veuillez vous connecter d'abord.");
      const res = await fetch(`/api/sso?app=${app}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Ouverture impossible.");
      window.location.href = (body as { url: string }).url;
    } catch (e) {
      toast((e as Error).message, "error");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      Ouvrir {label}
    </button>
  );
}
