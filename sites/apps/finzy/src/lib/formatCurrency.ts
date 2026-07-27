import type { Currency } from '@/types';

const formatters: Record<Currency, Intl.NumberFormat> = {
  EUR: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
  CHF: new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }),
  USD: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }),
};

export function formatAmount(value: number, currency: Currency): string {
  return formatters[currency].format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
}
