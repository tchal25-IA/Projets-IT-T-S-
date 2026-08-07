import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PlanId } from "@/lib/plan-gates";

const CheckoutInput = z.object({
  plan: z.enum(["initiative", "elite"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

function stripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante — configure Stripe dans les variables d'environnement.");
  return key;
}

function priceIdForPlan(plan: PlanId): string {
  const map: Record<string, string | undefined> = {
    initiative: process.env.STRIPE_PRICE_INITIATIVE,
    elite: process.env.STRIPE_PRICE_ELITE,
  };
  const id = map[plan];
  if (!id) throw new Error(`Prix Stripe non configuré pour le plan ${plan}.`);
  return id;
}

async function stripeRequest(path: string, body: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? "Erreur Stripe";
    throw new Error(msg);
  }
  return json;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, user } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("prenom, email, stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id as string | null | undefined;

    if (!customerId) {
      const customer = await stripeRequest("/customers", {
        email: (profile?.email as string) || user.email || "",
        name: (profile?.prenom as string) || "",
        "metadata[user_id]": userId,
      });
      customerId = customer.id as string;
      await supabaseAdmin.rpc("apply_abonnement", {
        p_user_id: userId,
        p_plan: "decouverte",
        p_statut: "essai",
        p_stripe_customer_id: customerId,
        p_stripe_subscription_id: null,
      });
    }

    const session = await stripeRequest("/checkout/sessions", {
      mode: "subscription",
      customer: customerId!,
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      client_reference_id: userId,
      "line_items[0][price]": priceIdForPlan(data.plan),
      "line_items[0][quantity]": "1",
      "metadata[user_id]": userId,
      "metadata[plan]": data.plan,
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][plan]": data.plan,
    });

    return {
      url: session.url as string,
      sessionId: session.id as string,
      configured: true,
    };
  });

export const activateEssaiDecouverte = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("activate_essai_decouverte");
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getStripeConfigStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    return {
      configured: Boolean(
        process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_PRICE_INITIATIVE &&
          process.env.STRIPE_PRICE_ELITE,
      ),
    };
  });
