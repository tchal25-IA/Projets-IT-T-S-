import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getScopedProductId } from "@/lib/scope";
import { computeDashboardMetrics } from "@/lib/dashboard";
import { PageHeader, Stat, Card, Badge } from "@/components/ui";
import {
  formatEuro,
  formatDateTime,
  STATUS_LABELS,
  ROLE_LABELS,
  isDirection,
} from "@/lib/utils";
import { StatsCharts } from "@/components/stats-charts";
import { toggleTaskDone } from "@/lib/actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const { id, role, fullName } = session.user;
  const productId = await getScopedProductId(role);
  const m = await computeDashboardMetrics(id, role, productId);

  const yearMonth = new Date().toISOString().slice(0, 7);
  const startMonth = new Date(`${yearMonth}-01T00:00:00`);

  const [tasks, quota, closesMonth] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: id,
        doneAt: null,
      },
      include: { lead: true },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    role === "COMMERCIAL"
      ? prisma.quota.findUnique({
          where: { userId_yearMonth: { userId: id, yearMonth } },
        })
      : Promise.resolve(null),
    role === "COMMERCIAL"
      ? prisma.lead.findMany({
          where: {
            commercialId: id,
            status: "CLOSE",
            closedAt: { gte: startMonth },
          },
          include: { dealLines: true },
        })
      : Promise.resolve([]),
  ]);

  const closesCount = closesMonth.length;
  const caMonth = closesMonth.reduce(
    (s, l) => s + l.dealLines.reduce((a, d) => a + d.amountHt, 0),
    0
  );

  return (
    <div>
      <PageHeader
        title={`Home — ${ROLE_LABELS[role]}`}
        subtitle={`${fullName} · indicateurs synchronisés en temps réel`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Leads pipeline"
          value={String(m.leadsOpen)}
          hint={`${m.leadsTotal} au total`}
        />
        <Stat
          label="Taux de win"
          value={`${m.winRate}%`}
          hint={`${m.leadsClosed} closés / ${m.leadsLost} perdus`}
        />
        <Stat label="Pipeline estimé" value={formatEuro(m.pipelineValue)} />
        {role === "APPORTEUR" || role === "COMMERCIAL" ? (
          <Stat
            label="Commissions"
            value={formatEuro(m.commissionsTotal)}
            hint={`${formatEuro(m.commissionsAVerser)} à verser`}
          />
        ) : (
          <Stat label="CA suivi" value={formatEuro(m.closedCa)} />
        )}
      </div>

      {role === "COMMERCIAL" && quota ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Stat
            label="Objectif closes"
            value={`${closesCount} / ${quota.targetCloses}`}
            hint={yearMonth}
          />
          <Stat
            label="Objectif CA"
            value={`${formatEuro(caMonth)} / ${formatEuro(quota.targetCa)}`}
            hint={yearMonth}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {role === "COMMERCIAL" || isDirection(role) ? (
          <>
            <Stat label="Appels aujourd'hui" value={String(m.callsToday)} />
            <Stat label="RDV posés (jour)" value={String(m.rdvToday)} />
            <Stat
              label="Relances en retard"
              value={String(m.overdueCalls)}
              hint="nextCallAt dépassé"
            />
          </>
        ) : null}
        {role === "APPORTEUR" ? (
          <>
            <Stat label="Convertis" value={String(m.leadsClosed)} />
            <Stat label="En cours" value={String(m.leadsOpen)} />
            <Stat
              label="Commissions versées"
              value={formatEuro(m.commissionsVersees)}
            />
          </>
        ) : null}
        <Stat
          label="Clients"
          value={String(m.clientsTotal)}
          hint={`${m.clientsEnLivraison} en livraison · ${m.clientsActifs} actifs`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Mes tâches</h2>
            <Link href="/taches" className="text-xs text-teal-800 hover:underline">
              Agenda
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-stone-500">
                    {t.dueAt ? formatDateTime(t.dueAt) : "Sans échéance"}
                    {t.lead ? ` · ${t.lead.companyName}` : ""}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await toggleTaskDone(t.id, true);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-teal-800 hover:underline"
                  >
                    Fait
                  </button>
                </form>
              </div>
            ))}
            {tasks.length === 0 ? (
              <p className="py-3 text-sm text-stone-500">Aucune tâche ouverte.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Prochaines actions</h2>
            <Link href="/appels" className="text-xs text-teal-800 hover:underline">
              File d&apos;appels
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {m.nextActions.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div>
                  <Link
                    href={`/leads/${a.id}`}
                    className="font-medium text-teal-900 hover:underline"
                  >
                    {a.companyName}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {STATUS_LABELS[a.status as keyof typeof STATUS_LABELS] ??
                      a.status}
                  </p>
                </div>
                <span className="text-xs text-stone-500">
                  {a.nextCallAt ? formatDateTime(a.nextCallAt) : "Sans rappel"}
                </span>
              </div>
            ))}
            {m.nextActions.length === 0 ? (
              <p className="py-3 text-sm text-stone-500">Aucune action en attente.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Leads récents</h2>
          <Link href="/leads" className="text-xs text-teal-800 hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-500">
              <tr>
                <th className="pb-2 font-medium">Entreprise</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium">Produit</th>
              </tr>
            </thead>
            <tbody>
              {m.recentLeads.map((l) => (
                <tr key={l.id} className="border-t border-stone-100">
                  <td className="py-2">
                    <Link
                      href={`/leads/${l.id}`}
                      className="font-medium text-teal-900 hover:underline"
                    >
                      {l.companyName}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Badge
                      tone={
                        l.status === "CLOSE"
                          ? "success"
                          : l.status === "PERDU"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {STATUS_LABELS[l.status as keyof typeof STATUS_LABELS] ??
                        l.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-stone-600">{l.productName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isDirection(role) && (m.byStatus.length > 0 || m.byProduct.length > 0) ? (
        <div className="mt-6">
          <StatsCharts
            byStatus={m.byStatus.map((s) => ({
              name:
                STATUS_LABELS[s.name as keyof typeof STATUS_LABELS] ?? s.name,
              value: s.value,
            }))}
            byProduct={m.byProduct}
          />
        </div>
      ) : null}

      {(role === "COMMERCIAL" || role === "APPORTEUR") &&
      m.byProduct.length > 0 ? (
        <Card className="mt-6">
          <h2 className="mb-4 text-sm font-semibold">Répartition produits</h2>
          <div className="space-y-3">
            {m.byProduct.map((row) => {
              const pct = m.leadsTotal
                ? Math.round((row.value / m.leadsTotal) * 100)
                : 0;
              return (
                <div key={row.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{row.name}</span>
                    <span className="text-stone-500">
                      {row.value} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-stone-100">
                    <div
                      className="h-full bg-teal-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
