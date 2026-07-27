import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import type { CategoryId } from "@/lib/pricing";

export type CloudSubscription = {
  user_id: string;
  selected: CategoryId[];
  billing: "monthly" | "annual";
  referral_code_used: string | null;
  trial_ends_at: string | null;
  pending_selected: CategoryId[] | null;
  pending_billing: "monthly" | "annual" | null;
  pending_effective_at: string | null;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
};

/** Renvoie le 1er du mois suivant à 00:00 (ISO). */
export function nextFirstOfMonth(from: Date = new Date()): string {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1).toISOString();
}

/** Applique côté client une éventuelle modification programmée déjà échue. */
function applyDueLocally(sub: CloudSubscription): CloudSubscription {
  if (!sub.pending_effective_at) return sub;
  if (new Date(sub.pending_effective_at).getTime() > Date.now()) return sub;
  return {
    ...sub,
    selected: sub.pending_selected ?? sub.selected,
    billing: sub.pending_billing ?? sub.billing,
    pending_selected: null,
    pending_billing: null,
    pending_effective_at: null,
  };
}

export function useCloudSubscription() {
  const { session, loading: sessLoading } = useSession();
  const [sub, setSub] = useState<CloudSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setSub(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (data) {
      const fresh = applyDueLocally(data as CloudSubscription);
      // Persiste si on a appliqué un pending échu
      if (fresh !== data) {
        await supabase.from("subscriptions").update({
          selected: fresh.selected,
          billing: fresh.billing,
          pending_selected: null,
          pending_billing: null,
          pending_effective_at: null,
        }).eq("user_id", session.user.id);
      }
      setSub(fresh);
    } else {
      setSub(null);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (sessLoading) return;
    void refresh();
  }, [sessLoading, refresh]);

  return { sub, loading: loading || sessLoading, refresh, session };
}
