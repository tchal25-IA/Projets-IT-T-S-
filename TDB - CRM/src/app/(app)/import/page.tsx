import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { importLeads } from "@/lib/actions";
import { PageHeader, Card, Button, Label, Select } from "@/components/ui";
import { isFullAccess } from "@/lib/utils";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; skipped?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!isFullAccess(session.user.role)) {
    redirect("/dashboard");
  }

  const products = await prisma.product.findMany({ where: { active: true } });
  const sp = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const result = await importLeads(formData);
    redirect(
      `/import?created=${result.created}&updated=${result.updated}&skipped=${result.skipped}`
    );
  }

  return (
    <div>
      <PageHeader
        title="Import CSV / Excel"
        subtitle="Déduplication automatique : email → site web → nom d'entreprise (par produit). Les réimports mettent à jour la fiche et enregistrent la date."
      />

      {sp.created !== undefined ? (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          Import terminé : <strong>{sp.created}</strong> créé(s),{" "}
          <strong>{sp.updated ?? 0}</strong> mis à jour (doublons évités),{" "}
          <strong>{sp.skipped ?? 0}</strong> ligne(s) ignorée(s).
        </div>
      ) : null}

      <Card className="max-w-xl">
        <form action={action} className="space-y-4">
          <div>
            <Label>Produit cible (pipeline principal)</Label>
            <Select name="productId" required>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-stone-500">
              Sur la fiche lead, vous pourrez qualifier les autres produits du
              catalogue (intérêts multi-services).
            </p>
          </div>
          <div>
            <Label>Fichier (.csv, .xlsx)</Label>
            <input
              type="file"
              name="file"
              accept=".csv,.xlsx,.xls"
              required
              className="block w-full text-sm"
            />
          </div>
          <Button type="submit">Importer</Button>
        </form>
        <div className="mt-6 space-y-3 rounded-md bg-stone-50 p-4 text-xs text-stone-600">
          <div>
            <p className="font-medium text-stone-800">Colonnes reconnues</p>
            <p className="mt-1">
              entreprise / companyName, contact, email, telephone / phone, website /
              site_web, pays, score_opportunite, besoins, calendly_detecte
            </p>
          </div>
          <div>
            <p className="font-medium text-stone-800">Exemple CSV</p>
            <pre className="mt-2 overflow-x-auto">
{`entreprise,email,telephone,website
Dupont SAS,jean@dupont.fr,0612345678,dupont.fr
Studio Lumière,lea@studio.fr,0698765432,studio-lumiere.fr`}
            </pre>
          </div>
          <p>
            <strong>2ᵉ / 3ᵉ import :</strong> si le lead existe déjà (même email ou
            site ou nom + même produit), la fiche est mise à jour et{" "}
            <em>lastImportedAt</em> est renseigné — pas de doublon.
          </p>
        </div>
      </Card>
    </div>
  );
}
