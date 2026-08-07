import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader, Card, Badge, Stat } from "@/components/ui";
import { BILLING_LABELS, formatEuro, canSeeBilling } from "@/lib/utils";
import { BillingActions } from "@/components/billing-actions";
import { getScopedProductId } from "@/lib/scope";

export default async function FacturationPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canSeeBilling(session.user.role)) {
    redirect("/dashboard");
  }
  const productId = await getScopedProductId(session.user.role);

  const where =
    session.user.role === "COMMERCIAL"
      ? { lead: { commercialId: session.user.id } }
      : productId
        ? { lead: { productId } }
        : {};

  const lines = await prisma.dealLine.findMany({
    where,
    include: {
      lead: { select: { companyName: true, id: true } },
      client: { select: { companyName: true, id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const totals = {
    devis: lines.filter((l) => l.billingStatus === "DEVIS").reduce((s, l) => s + l.amountHt, 0),
    aFacturer: lines.filter((l) => l.billingStatus === "A_FACTURER").reduce((s, l) => s + l.amountHt, 0),
    facture: lines.filter((l) => l.billingStatus === "FACTURE").reduce((s, l) => s + l.amountHt, 0),
    paye: lines.filter((l) => l.billingStatus === "PAYE").reduce((s, l) => s + l.amountHt, 0),
  };

  return (
    <div>
      <PageHeader
        title="Facturation"
        subtitle="Devis → facture → paiement (PDF + Stripe si configuré)"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Devis" value={formatEuro(totals.devis)} />
        <Stat label="À facturer" value={formatEuro(totals.aFacturer)} />
        <Stat label="Facturé" value={formatEuro(totals.facture)} />
        <Stat label="Payé" value={formatEuro(totals.paye)} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Prestation</th>
              <th className="px-4 py-3 font-medium">Lead / Client</th>
              <th className="px-4 py-3 font-medium">Montant HT</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-stone-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{l.label}</p>
                  {l.isRecurring ? (
                    <Badge tone="info">Récurrent</Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {l.client?.companyName ?? l.lead?.companyName ?? "—"}
                </td>
                <td className="px-4 py-3">{formatEuro(l.amountHt)}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      l.billingStatus === "PAYE"
                        ? "success"
                        : l.billingStatus === "A_FACTURER"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {BILLING_LABELS[l.billingStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <BillingActions id={l.id} status={l.billingStatus} showPay />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
