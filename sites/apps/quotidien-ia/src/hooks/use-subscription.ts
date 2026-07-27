import { autoConnectedTools, type CategoryId } from "@/lib/pricing";
import { useCloudSubscription } from "@/hooks/use-cloud-subscription";

/** Sélection courante (Cloud). */
export function useSelectedCategories(): CategoryId[] {
  const { sub } = useCloudSubscription();
  return sub?.selected ?? [];
}

export function useAutoConnectedTools(): string[] {
  return autoConnectedTools(useSelectedCategories());
}
