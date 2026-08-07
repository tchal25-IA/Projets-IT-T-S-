import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PlanId } from "@/lib/plan-gates";

function planFromPrice(priceId: string | undefined): PlanId {
  if (priceId && priceId === process.env.STRIPE_PRICE_ELITE) return "elite";
  if (priceId && priceId === process.env.STRIPE_PRICE_INITIATIVE) return "initiative";
  return "initiative";
}

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const signed = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signed, "utf8").digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function applyFromSubscription(sub: Record<string, unknown>, fallbackUserId?: string) {
  const meta = (sub.metadata ?? {}) as Record<string, string>;
  const userId = meta.user_id || fallbackUserId;
  if (!userId) return;

  const items = sub.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const priceId = items?.data?.[0]?.price?.id;
  const plan = (meta.plan as PlanId) || planFromPrice(priceId);
  const status = String(sub.status ?? "");
  const statut =
    status === "active" || status === "trialing"
      ? "actif"
      : status === "canceled"
        ? "annule"
        : "expire";

  await supabaseAdmin.rpc("apply_abonnement", {
    p_user_id: userId,
    p_plan: plan,
    p_statut: statut,
    p_stripe_customer_id: (sub.customer as string) ?? null,
    p_stripe_subscription_id: (sub.id as string) ?? null,
  });
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response("STRIPE_WEBHOOK_SECRET manquante", { status: 500 });
        }

        const payload = await request.text();
        const sig = request.headers.get("stripe-signature");
        if (!verifyStripeSignature(payload, sig, secret)) {
          return new Response("Signature invalide", { status: 400 });
        }

        const event = JSON.parse(payload) as {
          type: string;
          data: { object: Record<string, unknown> };
        };
        const obj = event.data.object;

        switch (event.type) {
          case "checkout.session.completed": {
            const userId =
              (obj.client_reference_id as string) ||
              (obj.metadata as { user_id?: string })?.user_id;
            const subId = obj.subscription as string | undefined;
            if (userId && subId) {
              const plan = ((obj.metadata as { plan?: PlanId })?.plan ?? "initiative") as PlanId;
              await supabaseAdmin.rpc("apply_abonnement", {
                p_user_id: userId,
                p_plan: plan,
                p_statut: "actif",
                p_stripe_customer_id: (obj.customer as string) ?? null,
                p_stripe_subscription_id: subId,
              });
            }
            break;
          }
          case "customer.subscription.updated":
          case "customer.subscription.created":
            await applyFromSubscription(obj);
            break;
          case "customer.subscription.deleted": {
            const meta = (obj.metadata ?? {}) as Record<string, string>;
            if (meta.user_id) {
              await supabaseAdmin.rpc("apply_abonnement", {
                p_user_id: meta.user_id,
                p_plan: "decouverte",
                p_statut: "annule",
                p_stripe_customer_id: (obj.customer as string) ?? null,
                p_stripe_subscription_id: null,
              });
            }
            break;
          }
          default:
            break;
        }

        return Response.json({ received: true });
      },
    },
  },
});
