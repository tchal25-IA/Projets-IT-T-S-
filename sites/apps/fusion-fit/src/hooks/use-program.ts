import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { ProgramLite } from "@/components/programme-jour-card";

type Bloc = { jour: string; titre: string; details: string };

// Dernier programme publié pour l'abonné courant (utilisé dans Routine + Stats).
export function useMyProgram() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-program", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<ProgramLite | null> => {
      const { data } = await supabase
        .from("programs")
        .select("id, coach_id, titre, objectif, blocs, updated_at")
        .eq("abonne_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        coach_id: data.coach_id,
        titre: data.titre,
        objectif: data.objectif ?? null,
        blocs: Array.isArray(data.blocs) ? (data.blocs as unknown as Bloc[]) : [],
      };
    },
  });
}
