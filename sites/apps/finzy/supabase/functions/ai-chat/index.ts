import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Verify user authentication before doing anything
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check plan and enforce daily quota for free users
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan, premium_type, premium_trial_ends_at")
    .eq("id", user.id)
    .single();

  const isPremiumPlan = profile?.plan === "premium" || profile?.plan === "beta";
  const trialExpired =
    profile?.plan === "premium" &&
    profile?.premium_type === "trial" &&
    profile?.premium_trial_ends_at != null &&
    new Date(profile.premium_trial_ends_at) < new Date();
  const isUnlimited = isPremiumPlan && !trialExpired;

  if (!isUnlimited) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await supabaseAdmin
      .from("ai_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();
    const currentCount = usage?.count ?? 0;
    if (currentCount >= 3) {
      return new Response(
        JSON.stringify({ error: "Quota journalier atteint (3 messages/jour en gratuit). Passe Premium pour un accès illimité.", quota_reached: true, limit: 3, used: currentCount }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (usage) {
      await supabaseAdmin.from("ai_usage").update({ count: currentCount + 1 }).eq("user_id", user.id).eq("date", today);
    } else {
      await supabaseAdmin.from("ai_usage").insert({ user_id: user.id, date: today, count: 1 });
    }
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const market = context?.market ?? "FR";
    const currency = context?.currency ?? "EUR";
    const profile_type = context?.profile_type ?? "curieux";
    const level = context?.level ?? 1;
    const username = context?.username ?? "Utilisateur";
    const budgetSummary = context?.budgetSummary ?? "";
    const patrimoineSummary = context?.patrimoineSummary ?? "";

    const systemPrompt = `Tu es FinzyBot, l'assistant financier de Finzy — une app de gestion financière personnelle gamifiée pour la France et la Suisse.

CONTEXTE UTILISATEUR :
- Pseudo : ${username}
- Marché : ${market === "CH" ? "Suisse 🇨🇭" : "France 🇫🇷"}
- Devise : ${currency}
- Profil : ${profile_type}
- Niveau : ${level}
${budgetSummary ? `- Budget résumé : ${budgetSummary}` : ""}
${patrimoineSummary ? `- Patrimoine résumé : ${patrimoineSummary}` : ""}

RÈGLES :
- Réponds TOUJOURS en français
- Adapte ton vocabulaire au marché : ${market === "CH" ? "3ème pilier, LPP, ICC, hypothèque, caisse de pension" : "PEA, Assurance Vie, IR, PFU, Livret A"}
- Sois pédagogue et bienveillant, adapte la complexité au profil (${profile_type})
- Si la question concerne un simulateur Finzy, mentionne-le et suggère de l'utiliser
- Formate tes réponses avec des listes et des émojis pour la lisibilité
- Sois concis (max 300 mots sauf demande explicite)
- NE DONNE JAMAIS de conseil financier personnalisé — reste informatif et éducatif
- Termine TOUJOURS par un rappel que tes réponses sont informatives et ne constituent pas un conseil financier réglementé`;

    const shouldStream = context?.stream !== false;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        stream: shouldStream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shouldStream) {
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
