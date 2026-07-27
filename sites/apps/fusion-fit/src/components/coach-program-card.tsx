import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Bloc = { jour: string; titre: string; details: string };

export function CoachProgramCard() {
  const { user, role } = useAuth();
  const [prog, setProg] = useState<{ titre: string; objectif: string; blocs: Bloc[] } | null>(null);

  useEffect(() => {
    if (!user || role !== "abonne") return;
    (async () => {
      const { data } = await supabase
        .from("programs")
        .select("titre, objectif, blocs")
        .eq("abonne_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setProg({
          titre: data.titre,
          objectif: data.objectif ?? "",
          blocs: Array.isArray(data.blocs) ? (data.blocs as unknown as Bloc[]) : [],
        });
      }
    })();
  }, [user, role]);

  if (!prog || !prog.blocs.length) return null;

  return (
    <section
      className="rounded-2xl border p-4 mb-4 space-y-2"
      style={{ background: "var(--ff-surface)", borderColor: "var(--ff-amber)" }}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1" style={{ color: "var(--ff-amber)" }}>
        <Target className="h-3 w-3" /> Programme du coach
      </p>
      <p className="font-bold text-sm">{prog.titre}</p>
      {prog.objectif && (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          {prog.objectif}
        </p>
      )}
      <div className="space-y-1.5 pt-1">
        {prog.blocs.map((b, i) => (
          <div
            key={i}
            className="rounded-lg border p-2"
            style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
          >
            <p className="text-xs font-bold">
              <span style={{ color: "var(--ff-cyan)" }}>{b.jour}</span> · {b.titre}
            </p>
            {b.details && (
              <p className="text-[11px] mt-0.5 whitespace-pre-wrap" style={{ color: "var(--ff-text-muted)" }}>
                {b.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
