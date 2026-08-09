import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { isFullAccess } from "@/lib/utils";
import { parseFieldSchema } from "@/lib/fields";
import { SettingsAdmin } from "@/components/settings-admin";

export default async function AdminParametresPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!isFullAccess(session.user.role)) {
    redirect("/dashboard");
  }

  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      offerings: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Catalogue produits, prestations / formules et champs de qualification (Associé / Admin)"
      />
      <SettingsAdmin
        products={products.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          active: p.active,
          sortOrder: p.sortOrder,
          fieldSchema: parseFieldSchema(p.fieldSchema),
          offerings: p.offerings.map((o) => ({
            id: o.id,
            productId: o.productId,
            name: o.name,
            code: o.code,
            kind: o.kind,
            amountHt: o.amountHt,
            billingPeriod: o.billingPeriod,
            active: o.active,
            sortOrder: o.sortOrder,
          })),
        }))}
      />
    </div>
  );
}
