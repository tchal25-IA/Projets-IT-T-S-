import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");

  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

/**
 * Crée une session Stripe Embedded Checkout pour un ou plusieurs price IDs
 * (un par module sélectionné). Essai natif 30 jours, annulation en fin de période.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceIds: string[];
    billing: "monthly" | "annual";
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!Array.isArray(data.priceIds) || data.priceIds.length === 0) {
      throw new Error("Aucun module sélectionné");
    }
    for (const p of data.priceIds) {
      if (!/^[a-zA-Z0-9_-]+$/.test(p)) throw new Error("Invalid priceId");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const { userId, supabase } = context;
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email ?? undefined;

      const stripe = createStripeClient(data.environment);

      // Résolution des price IDs via lookup_keys (stables sandbox↔live)
      const prices = await stripe.prices.list({
        lookup_keys: data.priceIds,
        limit: data.priceIds.length,
      });
      if (prices.data.length !== data.priceIds.length) {
        throw new Error("Un ou plusieurs modules sont introuvables dans le catalogue.");
      }

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        line_items: prices.data.map((p) => ({ price: p.id, quantity: 1 })),
        subscription_data: {
          trial_period_days: 30,
          metadata: {
            userId,
            billing: data.billing,
            modules: data.priceIds.join(","),
          },
        },
        metadata: {
          userId,
          billing: data.billing,
          modules: data.priceIds.join(","),
        },
        allow_promotion_codes: true,
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Ouvre le portail Stripe pour gérer moyen de paiement, factures et annulation.
 */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .not("stripe_customer_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !sub?.stripe_customer_id) {
      return { error: "Aucun abonnement Stripe trouvé pour ce compte." };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
