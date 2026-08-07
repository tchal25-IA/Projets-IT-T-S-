import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { upsertQuota } from "@/lib/actions";
import { canManageUsers } from "@/lib/utils";
import { PageHeader, Card, Button, Input } from "@/components/ui";
import { formatEuro } from "@/lib/utils";

export default async function QuotasPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canManageUsers(session.user.role)) redirect("/dashboard");

  const yearMonth = new Date().toISOString().slice(0, 7);
  const commercials = await prisma.user.findMany({
    where: { role: "COMMERCIAL", active: true },
    include: {
      quotas: { where: { yearMonth } },
      leadsCommerciaux: {
        where: {
          status: "CLOSE",
          closedAt: {
            gte: new Date(`${yearMonth}-01T00:00:00`),
          },
        },
        include: { dealLines: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Objectifs commerciaux"
        subtitle={`Quotas ${yearMonth} — closes & CA HT`}
      />

      <div className="space-y-4">
        {commercials.map((c) => {
          const q = c.quotas[0];
          const closes = c.leadsCommerciaux.length;
          const ca = c.leadsCommerciaux.reduce(
            (s, l) => s + l.dealLines.reduce((a, d) => a + d.amountHt, 0),
            0
          );
          return (
            <Card key={c.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.fullName}</p>
                  <p className="text-xs text-stone-500">
                    Réalisé : {closes} closes · {formatEuro(ca)}
                    {q
                      ? ` / objectif ${q.targetCloses} · ${formatEuro(q.targetCa)}`
                      : " — pas d'objectif"}
                  </p>
                </div>
              </div>
              <form action={upsertQuota} className="grid gap-2 sm:grid-cols-4">
                <input type="hidden" name="userId" value={c.id} />
                <Input name="yearMonth" defaultValue={yearMonth} />
                <Input
                  name="targetCloses"
                  type="number"
                  defaultValue={q?.targetCloses ?? 4}
                  placeholder="Closes"
                />
                <Input
                  name="targetCa"
                  type="number"
                  defaultValue={q?.targetCa ?? 8000}
                  placeholder="CA HT"
                />
                <Button type="submit">Enregistrer</Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
