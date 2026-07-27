import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";
import type { CategoryId } from "@/lib/pricing";

interface Props {
  modules: CategoryId[];
  billing: "monthly" | "annual";
  returnUrl?: string;
}

/** Convertit (module, billing) → lookup_key Stripe (ex. `finance_monthly`). */
export function moduleToPriceId(module: CategoryId, billing: "monthly" | "annual"): string {
  return `${module}_${billing}`;
}

export function StripeEmbeddedCheckout({ modules, billing, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const priceIds = modules.map((m) => moduleToPriceId(m, billing));
    const result = await createCheckoutSession({
      data: {
        priceIds,
        billing,
        returnUrl: returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe n'a pas renvoyé de client_secret.");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="min-h-[500px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
