import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function planFromPrice(price: any): string | null {
  return price?.lookup_key ?? price?.metadata?.lovable_external_id ?? null;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

type BillingKind = "monthly" | "annual";

/** Sépare les price IDs (ex. finance_monthly / vie_admin_plus_annual) en (modules, billing). */
function parseModules(priceIds: string[]): { modules: string[]; billing: BillingKind | null } {
  const modules = new Set<string>();
  let billing: BillingKind | null = null;
  for (const id of priceIds) {
    if (id.endsWith("_monthly")) {
      billing = "monthly";
      modules.add(id.slice(0, -"_monthly".length));
    } else if (id.endsWith("_annual")) {
      billing = "annual";
      modules.add(id.slice(0, -"_annual".length));
    } else {
      modules.add(id);
    }
  }
  return { modules: Array.from(modules), billing };
}

async function upsertFromSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Webhook: subscription sans metadata.userId", subscription.id);
    return;
  }

  const items = (subscription.items?.data ?? []) as any[];
  const firstItem = items[0];
  const periodStart = firstItem?.current_period_start ?? subscription.current_period_start;
  const periodEnd = firstItem?.current_period_end ?? subscription.current_period_end;

  const priceIds = items.map((i) => planFromPrice(i?.price)).filter(Boolean) as string[];
  const parsed = parseModules(priceIds);
  const billing: BillingKind = (subscription.metadata?.billing as BillingKind) || parsed.billing || "monthly";

  const admin = await getAdmin();
  await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        selected: parsed.modules,
        billing,
        stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: isoFromUnix(periodStart),
        current_period_end: isoFromUnix(periodEnd),
        cancel_at_period_end: !!subscription.cancel_at_period_end,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

async function markCanceled(subscription: any, env: StripeEnv) {
  const admin = await getAdmin();
  await admin
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handle(request: Request, env: StripeEnv) {
  const event = await verifyWebhook(request, env);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertFromSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await markCanceled(event.data.object, env);
      break;
    default:
      console.log("Stripe webhook event non géré:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook Stripe: env query invalide", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handle(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook Stripe erreur:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
