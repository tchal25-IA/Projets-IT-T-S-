/**
 * Validate required environment variables at build/runtime
 * Throws clear errors for missing config
 */
export function validateEnv() {
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please check your .env file against .env.example`
    );
  }
}

/**
 * Check optional service configs and log warnings for missing ones
 */
export function checkOptionalServices() {
  const warnings: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    warnings.push("Email service disabled (RESEND_API_KEY not set)");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push("Stripe payments disabled (STRIPE_SECRET_KEY not set)");
  }

  if (!process.env.BOOKFLOW_WEBHOOK_SECRET) {
    warnings.push("Bookflow webhooks disabled (BOOKFLOW_WEBHOOK_SECRET not set)");
  }

  return warnings;
}

// Run validation on import
if (typeof window === "undefined") {
  // Only validate on server
  validateEnv();
}
