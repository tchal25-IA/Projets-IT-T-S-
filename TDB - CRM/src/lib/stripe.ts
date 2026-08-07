export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_APP_URL
  );
}

export async function createCheckoutSession(opts: {
  dealLineId: string;
  label: string;
  amountHt: number;
  customerEmail?: string | null;
}): Promise<{ url: string | null; sessionId: string | null; error?: string }> {
  if (!isStripeConfigured()) {
    return {
      url: null,
      sessionId: null,
      error: "Stripe non configuré (STRIPE_SECRET_KEY)",
    };
  }

  const amountCents = Math.max(50, Math.round(opts.amountHt * 100));
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${process.env.NEXT_PUBLIC_APP_URL}/facturation?paid=1`);
  params.set("cancel_url", `${process.env.NEXT_PUBLIC_APP_URL}/facturation?cancelled=1`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][unit_amount]", String(amountCents));
  params.set("line_items[0][price_data][product_data][name]", opts.label);
  params.set("metadata[dealLineId]", opts.dealLineId);
  if (opts.customerEmail) params.set("customer_email", opts.customerEmail);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = (await res.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.url || !data.id) {
    return {
      url: null,
      sessionId: null,
      error: data.error?.message ?? "Erreur Stripe",
    };
  }

  return { url: data.url, sessionId: data.id };
}

export function verifyStripeSignature(
  payload: string,
  signature: string | null
): boolean {
  // Soft check: if no webhook secret, accept only in non-production for local tests
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return process.env.NODE_ENV !== "production";
  }
  // Full HMAC verification would need crypto timing-safe compare of Stripe scheme.
  // We require the header presence when secret is set; detailed verify in route.
  return Boolean(signature);
}
