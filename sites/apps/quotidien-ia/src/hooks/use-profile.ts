import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export type WorkCountry = "FR" | "CH" | "OTHER" | "";

export type Profile = {
  name: string;
  email: string;
  workCountry?: WorkCountry;
};

/** Lit le profil depuis Cloud (avec fallback session si non connecté). */
export function useProfile(): Profile {
  const { session } = useSession();
  const [p, setP] = useState<Profile>({ name: "", email: "", workCountry: "" });

  useEffect(() => {
    if (!session) {
      setP({ name: "", email: "", workCountry: "" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email, work_country")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setP({
        name: data?.display_name ?? "",
        email: data?.email ?? session.user.email ?? "",
        workCountry: (data?.work_country as WorkCountry) ?? "",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return p;
}
