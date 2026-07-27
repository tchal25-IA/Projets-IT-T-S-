import { EXTERNAL_TOOLS } from "@/lib/modules";
import type { CategoryId } from "@/lib/pricing";
import type { WorkCountry } from "@/hooks/use-profile";

/** Filtre les outils selon l'abonnement et le pays de travail déclaré. */
export function filterTools(
  selected: CategoryId[],
  workCountry: WorkCountry | undefined,
): typeof EXTERNAL_TOOLS {
  return EXTERNAL_TOOLS.filter((t) => {
    if (t.requiresCategory && !t.requiresCategory.some((c) => selected.includes(c as CategoryId))) {
      return false;
    }
    if (t.requiresCountry && t.requiresCountry !== workCountry) {
      return false;
    }
    return true;
  });
}
