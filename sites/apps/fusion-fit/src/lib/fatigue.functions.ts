import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  // Si fourni, on analyse cet abonné (coach). Sinon, on analyse soi-même.
  targetUserId: z.string().uuid().optional(),
});

const OutputSchema = z.object({
  tendance: z.enum(["amelioration", "stable", "fatigue", "surmenage"]),
  score_fatigue: z.number().min(0).max(100),
  resume: z.string(),
  recommandation_coach: z.string(),
  recommandation_abonne: z.string(),
});

export const analyzeFatigue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.targetUserId ?? userId;

    // Si on analyse quelqu'un d'autre, vérifier qu'on est son coach
    if (target !== userId) {
      const { data: link } = await supabase
        .from("coach_assignments")
        .select("coach_id")
        .eq("abonne_id", target)
        .eq("coach_id", userId)
        .maybeSingle();
      if (!link) throw new Error("Non autorisé");
    }

    const { data: checkins } = await supabase
      .from("check_ins")
      .select("created_at, temps, energie, humeur")
      .eq("user_id", target)
      .order("created_at", { ascending: false })
      .limit(14);

    if (!checkins || checkins.length < 3) {
      return {
        tendance: "stable" as const,
        score_fatigue: 0,
        resume: `Pas encore assez de données (${checkins?.length ?? 0} check-in${(checkins?.length ?? 0) > 1 ? "s" : ""}). Il faut au moins 3 check-ins pour activer l'analyse IA.`,
        recommandation_coach: "Encourage l'abonné à faire son check-in quotidien.",
        recommandation_abonne: "Continue ton check-in chaque jour pour activer l'analyse adaptative.",
      };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY manquante");
    const gateway = createLovableAiGatewayProvider(key);

    const historique = checkins
      .reverse()
      .map((c, i) => `J${i + 1} · énergie ${c.energie}/5 · humeur ${c.humeur}/5 · temps ${c.temps}`)
      .join("\n");

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: OutputSchema }),
      system:
        "Tu es l'IA de FusionFit, app de coaching adaptative. Tu analyses les check-ins quotidiens (énergie 1-5, humeur 1-5, temps disponible 1-3) pour détecter fatigue, surmenage ou bonne forme. Tu réponds en français, ton bienveillant et concret, jamais culpabilisant.",
      prompt: `Historique des derniers check-ins (du plus ancien au plus récent) :\n${historique}\n\nAnalyse la tendance et donne ton verdict :\n- "tendance" : amelioration / stable / fatigue / surmenage\n- "score_fatigue" : 0 = en pleine forme, 100 = surmenage critique\n- "resume" : 1-2 phrases sur la tendance observée\n- "recommandation_coach" : conseil tactique au coach (1 phrase)\n- "recommandation_abonne" : message bienveillant à l'abonné (1 phrase)`,
    });

    return output;
  });
