import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/hooks/use-notifications";
import type { Bloc } from "@/data/program-templates";

/** Enregistre le lien template → programme abonné (pour sync auto ultérieure). */
export async function recordProgramAssignment(opts: {
  coachId: string;
  templateId: string;
  abonneId: string;
  programId: string;
}) {
  const sb = supabase as unknown as { from: (t: string) => any };
  // Une seule assignation active par couple template/abonné : on upsert soft via delete+insert
  await sb
    .from("program_assignments")
    .delete()
    .eq("template_id", opts.templateId)
    .eq("abonne_id", opts.abonneId)
    .eq("coach_id", opts.coachId);
  await sb.from("program_assignments").insert({
    coach_id: opts.coachId,
    template_id: opts.templateId,
    abonne_id: opts.abonneId,
    program_id: opts.programId,
  });
}

/**
 * Quand un template biblio est modifié : pousse titre/objectif/blocs
 * vers tous les programmes déjà attribués via program_assignments.
 */
export async function syncAssignedProgramsFromTemplate(opts: {
  coachId: string;
  templateId: string;
  titre: string;
  objectif: string | null;
  blocs: Bloc[];
}): Promise<number> {
  const sb = supabase as unknown as { from: (t: string) => any };
  const { data: assigns } = await sb
    .from("program_assignments")
    .select("id, abonne_id, program_id")
    .eq("coach_id", opts.coachId)
    .eq("template_id", opts.templateId);

  const rows = (assigns ?? []) as Array<{
    id: string;
    abonne_id: string | null;
    program_id: string | null;
  }>;
  if (!rows.length) return 0;

  const payload = {
    titre: opts.titre,
    objectif: opts.objectif,
    blocs: opts.blocs as unknown as any,
    updated_at: new Date().toISOString(),
  };

  let updated = 0;
  const notified = new Set<string>();

  for (const a of rows) {
    if (!a.abonne_id) continue;
    let programId = a.program_id;

    if (programId) {
      const { error } = await sb.from("programs").update(payload).eq("id", programId);
      if (error) continue;
    } else {
      // Fallback : dernier programme de cet abonné pour ce coach
      const { data: existing } = await sb
        .from("programs")
        .select("id")
        .eq("abonne_id", a.abonne_id)
        .eq("coach_id", opts.coachId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        programId = existing.id;
        await sb.from("programs").update(payload).eq("id", programId);
        await sb.from("program_assignments").update({ program_id: programId }).eq("id", a.id);
      } else {
        const { data: created } = await sb
          .from("programs")
          .insert({
            abonne_id: a.abonne_id,
            coach_id: opts.coachId,
            ...payload,
          })
          .select("id")
          .single();
        programId = created?.id ?? null;
        if (programId) {
          await sb.from("program_assignments").update({ program_id: programId }).eq("id", a.id);
        }
      }
    }

    if (programId) updated += 1;
    if (!notified.has(a.abonne_id)) {
      notified.add(a.abonne_id);
      await notify(
        a.abonne_id,
        "programme",
        "Programme synchronisé",
        `Ton coach a mis à jour le programme « ${opts.titre} » (bibliothèque).`,
        "/fusionfit/routine",
      );
    }
  }

  return updated;
}
