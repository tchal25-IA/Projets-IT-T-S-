import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLead } from "@/lib/actions";
import { getScopedProductId } from "@/lib/scope";
import { PageHeader, Card, Button, Input, Label, Select } from "@/components/ui";
import { CustomFieldsForm } from "@/components/pipeline-board";
import { isDirection, type FieldDef } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function NewLeadPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!isDirection(session.user.role) && session.user.role !== "COMMERCIAL") {
    redirect("/leads");
  }

  const scopedProductId = await getScopedProductId(session.user.role);
  const [allProducts, users] = await Promise.all([
    prisma.product.findMany({ where: { active: true } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { fullName: "asc" } }),
  ]);

  const products = scopedProductId
    ? allProducts.filter((p) => p.id === scopedProductId)
    : allProducts;

  const defaultProduct = products[0];
  const fields = (defaultProduct?.fieldSchema as FieldDef[]) ?? [];

  return (
    <div>
      <PageHeader title="Nouveau lead" subtitle="Création manuelle" />
      <Card>
        <form action={createLead} className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Entreprise *</Label>
              <Input name="companyName" required />
            </div>
            <div>
              <Label>Contact</Label>
              <Input name="contactName" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input name="phone" />
            </div>
            <div>
              <Label>Produit *</Label>
              <Select name="productId" required defaultValue={defaultProduct?.id}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Valeur estimée (€)</Label>
              <Input name="estimatedValue" type="number" step="1" />
            </div>
            <div>
              <Label>Source</Label>
              <Input name="source" defaultValue="Manuel" />
            </div>
            <div>
              <Label>Commercial</Label>
              <Select
                name="commercialId"
                defaultValue={
                  session.user.role === "COMMERCIAL" ? session.user.id : ""
                }
              >
                <option value="">—</option>
                {users
                  .filter((u) => u.role === "COMMERCIAL")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label>Apporteur</Label>
              <Select name="apporteurId">
                <option value="">—</option>
                {users
                  .filter((u) => u.role === "APPORTEUR")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Champs produit</h3>
            <p className="mb-3 text-xs text-stone-500">
              Valeurs initiales pour {defaultProduct?.name}.
            </p>
            <CustomFieldsForm fields={fields} />
          </div>

          <Button type="submit">Créer le lead</Button>
        </form>
      </Card>
    </div>
  );
}
