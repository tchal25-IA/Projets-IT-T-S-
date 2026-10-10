import { useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LibraryHit = {
  id: string;
  code: string;
  module: string;
  item_type: "exercise" | "wod" | "knowledge";
  nom_fr: string;
  nom_en: string | null;
  categorie: string | null;
  mots_cles: string[];
  materiel: string[];
  muscles_principaux: string[];
  media_thumbnail_url: string | null;
  media_diagram_url: string | null;
  media_video_url: string | null;
  has_video: boolean;
  has_diagram: boolean;
  rank: number;
};

/** Recherche instantanée catalogue FusionFit (RPC search_library_items). */
export function useLibrarySearch(
  q: string,
  opts?: { modules?: string[]; types?: Array<"exercise" | "wod" | "knowledge">; limit?: number; enabled?: boolean },
) {
  const deferred = useDeferredValue(q.trim());
  const modules = opts?.modules;
  const types = opts?.types ?? ["exercise", "wod"];
  const limit = opts?.limit ?? 24;

  return useQuery({
    queryKey: ["library-search", deferred, modules, types, limit],
    enabled: opts?.enabled !== false,
    staleTime: 15_000,
    queryFn: async (): Promise<LibraryHit[]> => {
      // Types générés : params optionnels non nullables ; la RPC SQL accepte null.
      const { data, error } = await supabase.rpc("search_library_items", {
        q: deferred,
        p_modules: (modules?.length ? modules : null) as string[] | undefined,
        p_types: (types?.length ? types : null) as string[] | undefined,
        p_limit: limit,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as LibraryHit[];
    },
  });
}
