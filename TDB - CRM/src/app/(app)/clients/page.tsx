import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { accountVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import { PageHeader, Card, Badge } from "@/components/ui";
import { ACCOUNT_STATUS_LABELS, formatDate, canSeeBilling } from "@/lib/utils";
import { requireOrg } from "@/lib/tenant";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orgId = await requireOrg();
  const productId = await getScopedProductId(session.user.role);
  const where = accountVisibilityWhere(session.user.id, session.user.role, {
    productId,
    organizationId: orgId,
  });

  const accounts = await prisma.account.findMany({
    where,
    include: {
      leads: { include: { commercial: true, product: true, apporteur: true } },
      opportunities: true,
      commissions: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Fiches créées au close — cliquez pour ouvrir le suivi complet"
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Produit</th>
              <th className="px-4 py-3 font-medium">Commercial</th>
              <th className="px-4 py-3 font-medium">Apporteur</th>
              <th className="px-4 py-3 font-medium">Prestations</th>
              <th className="px-4 py-3 font-medium">Créé</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((c) => (
              <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${c.id}`}
                    className="font-medium text-teal-900 hover:underline"
                  >
                    {c.companyName}
                  </Link>
                  <p className="text-xs text-stone-500">{c.contactName}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={c.status === "ACTIF" ? "success" : "warning"}>
                    {ACCOUNT_STATUS_LABELS[c.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {c.leads[0]?.product.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {c.leads[0]?.commercial?.fullName ?? "—"}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {c.leads[0]?.apporteur?.fullName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {canSeeBilling(session.user.role) || session.user.role === "APPORTEUR"
                    ? c.opportunities.length
                    : "—"}
                </td>
                <td className="px-4 py-3 text-stone-500">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">Aucun client pour le moment.</p>
        ) : null}
      </Card>
    </div>
  );
}
