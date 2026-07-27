/**
 * Analytics / Monitoring placeholder.
 * Configure VITE_POSTHOG_KEY in .env to enable Posthog.
 * For Sentry: npm install @sentry/react and init in main.tsx
 */

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;

export function initAnalytics() {
  if (POSTHOG_KEY && typeof window !== 'undefined') {
    try {
      // Posthog loads via script in index.html if key is set
      (window as unknown as { posthog?: { capture: (event: string, props?: Record<string, unknown>) => void } }).posthog?.capture?.('app_loaded');
    } catch {
      // Silent fail
    }
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const ph = (window as unknown as { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog;
    ph?.capture?.(event, properties);
  } catch {
    // Silent fail
  }
}
