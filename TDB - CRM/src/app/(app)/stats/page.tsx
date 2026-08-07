import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader, Card, Stat } from "@/components/ui";
import { formatEuro, STATUS_LABELS, isDirection } from "@/lib/utils";
import { StatsCharts } from "@/components/stats-charts";
import { getScopedProductId } from "@/lib/scope";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (!isDirection(session.user.role)) {
    redirect("/dashboard");
  }
  const scopedProductId = await getScopedProductId(session.user.role);

  const sp = await searchParams;
  const to = sp.to ? new Date(sp.to) : new Date();
  const from = sp.from
    ? new Date(sp.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(scopedProductId ? { productId: scopedProductId } : {}),
    },
    include: {
      product: true,
      commercial: true,
      apporteur: true,
      dealLines: true,
    },
  });

  const closed = leads.filter((l) => l.status === "CLOSE");
  const ca = closed.reduce(
    (s, l) => s + l.dealLines.reduce((a, d) => a + d.amountHt, 0),
    0
  );

  const byStatus = Object.keys(STATUS_LABELS).map((status) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    value: leads.filter((l) => l.status === status).length,
  }));

  const byProductMap = new Map<string, number>();
  for (const l of leads) {
    byProductMap.set(l.product.name, (byProductMap.get(l.product.name) ?? 0) + 1);
  }
  const byProduct = [...byProductMap.entries()].map(([name, value]) => ({
    name,
    value,
  }));

  const commercialMap = new Map<string, { closes: number; ca: number }>();
  for (const l of closed) {
    const name = l.commercial?.fullName ?? "Non assigné";
    const prev = commercialMap.get(name) ?? { closes: 0, ca: 0 };
    prev.closes += 1;
    prev.ca += l.dealLines.reduce((a, d) => a + d.amountHt, 0);
    commercialMap.set(name, prev);
  }
  const byCommercial = [...commercialMap.entries()].map(([name, v]) => ({
    name,
    closes: v.closes,
    ca: v.ca,
  }));

  const apporteurMap = new Map<string, { leads: number; closes: number }>();
  for (const l of leads) {
    if (!l.apporteur) continue;
    const prev = apporteurMap.get(l.apporteur.fullName) ?? { leads: 0, closes: 0 };
    prev.leads += 1;
    if (l.status === "CLOSE") prev.closes += 1;
    apporteurMap.set(l.apporteur.fullName, prev);
  }
  const byApporteur = [...apporteurMap.entries()].map(([name, v]) => ({
    name,
    leads: v.leads,
    closes: v.closes,
  }));

  const csv = [
    ["Entreprise", "Produit", "Statut", "Commercial", "Apporteur", "CA prestations"].join(","),
    ...leads.map((l) =>
      [
        `"${l.companyName}"`,
        `"${l.product.name}"`,
        STATUS_LABELS[l.status],
        `"${l.commercial?.fullName ?? ""}"`,
        `"${l.apporteur?.fullName ?? ""}"`,
        l.dealLines.reduce((a, d) => a + d.amountHt, 0),
      ].join(",")
    ),
  ].join("\n");

  return (
    <div>
      <PageHeader
        title="Statistiques avancées"
        subtitle="Pilotage par période, produit, commercial et apporteur"
        actions={
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download={`stats-leads-${from.toISOString().slice(0, 10)}.csv`}
            className="inline-flex items-center rounded-md border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Export CSV
          </a>
        }
      />

      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">Du</label>
            <input
              type="date"
              name="from"
              defaultValue={from.toISOString().slice(0, 10)}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Au</label>
            <input
              type="date"
              name="to"
              defaultValue={to.toISOString().slice(0, 10)}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-teal-800 px-3.5 py-2 text-sm font-medium text-white"
          >
            Appliquer
          </button>
        </form>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Leads période" value={String(leads.length)} />
        <Stat label="Closés" value={String(closed.length)} />
        <Stat
          label="Taux de close"
          value={`${leads.length ? Math.round((closed.length / leads.length) * 100) : 0}%`}
        />
        <Stat label="CA closé" value={formatEuro(ca)} />
      </div>

      <StatsCharts
        byStatus={byStatus}
        byProduct={byProduct}
        byCommercial={byCommercial}
        byApporteur={byApporteur}
      />
    </div>
  );
}
