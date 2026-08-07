import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLead } from "@/lib/actions";
import { getScopedProductId } from "@/lib/scope";
import { PageHeader, Card, Button, Input, Label, Select } from "@/components/ui";
import { CustomFieldsForm } from "@/components/custom-fields-form";
import { isDirection } from "@/lib/utils";
import {
  enrichFieldsWithOfferings,
  parseFieldSchema,
} from "@/lib/fields";
import {
  fieldsForProduct,
  formPrefixForSlug,
  interestFieldForSlug,
} from "@/lib/custom-data";
import { redirect } from "next/navigation";

export default async function NewLeadPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!isDirection(session.user.role) && session.user.role !== "COMMERCIAL") {
    redirect("/leads");
  }

  const scopedProductId = await getScopedProductId(session.user.role);
  const [allProducts, users] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        offerings: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.user.findMany({ where: { active: true }, orderBy: { fullName: "asc" } }),
  ]);

  const products = scopedProductId
    ? allProducts.filter((p) => p.id === scopedProductId)
    : allProducts;

  const defaultProduct = products[0];
  const catalogBlocks = products.map((p) => {
    const schema = fieldsForProduct(p.slug, p.fieldSchema);
    const fields = enrichFieldsWithOfferings(
      schema.length ? schema : parseFieldSchema(p.fieldSchema),
      p.offerings.map((o) => o.name)
    );
    return { ...p, fields };
  });

  return (
    <div>
      <PageHeader
        title="Nouveau lead"
        subtitle="Même logique que Qualification : intérêts multi-produits + formules catalogue"
      />
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
              <Label>Produit principal *</Label>
              <Select name="productId" required defaultValue={defaultProduct?.id}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-stone-500">
                Produit de rattachement du lead (pipeline / direction).
              </p>
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

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">
                Intérêts & qualification
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Cochez les produits concernés et renseignez les champs / formules.
                Les prestations choisies créent automatiquement des lignes devis.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
              {catalogBlocks.map((p) => {
                const interestName = interestFieldForSlug(p.slug);
                return (
                  <label key={p.id} className="flex items-center gap-2">
                    <input type="hidden" name={interestName} value="false" />
                    <input
                      type="checkbox"
                      name={interestName}
                      value="true"
                      defaultChecked={p.id === defaultProduct?.id}
                    />
                    Qualifié {p.name}
                  </label>
                );
              })}
            </div>

            {catalogBlocks.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-teal-700/30 bg-teal-50/40 p-4"
              >
                <h3 className="mb-3 text-sm font-semibold text-teal-900">
                  {p.name}
                </h3>
                {p.fields.length ? (
                  <CustomFieldsForm
                    fields={p.fields}
                    prefix={formPrefixForSlug(p.slug)}
                  />
                ) : (
                  <p className="text-sm text-stone-500">
                    Aucun champ configuré — ajoutez-en dans Paramètres.
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button type="submit">Créer le lead</Button>
        </form>
      </Card>
    </div>
  );
}
