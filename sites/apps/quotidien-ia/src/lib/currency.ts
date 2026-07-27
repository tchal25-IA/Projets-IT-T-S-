import type { WorkCountry } from "@/hooks/use-profile";

/** Taux indicatif CHF→EUR (mis à jour manuellement). */
export const CHF_TO_EUR = 1.06;

export function primaryCurrency(country?: WorkCountry): "EUR" | "CHF" {
  return country === "CH" ? "CHF" : "EUR";
}

export function formatMoney(amount: number, currency: "EUR" | "CHF"): string {
  const locale = currency === "CHF" ? "fr-CH" : "fr-FR";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Affiche le montant dans la devise principale du pays de travail,
 * + équivalent secondaire entre parenthèses (frontaliers CH).
 * `amount` est exprimé dans la devise principale.
 */
export function formatDual(amount: number, country?: WorkCountry): string {
  const primary = primaryCurrency(country);
  if (primary === "CHF") {
    return `${formatMoney(amount, "CHF")} (~${formatMoney(amount * CHF_TO_EUR, "EUR")})`;
  }
  return formatMoney(amount, "EUR");
}

export function currencySymbol(country?: WorkCountry): string {
  return primaryCurrency(country) === "CHF" ? "CHF" : "€";
}
