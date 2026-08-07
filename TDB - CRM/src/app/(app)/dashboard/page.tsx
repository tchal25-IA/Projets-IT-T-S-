import Link from "next/link";
import { auth } from "@/lib/auth";
import { getScopedProductId } from "@/lib/scope";
import { computeDashboardMetrics } from "@/lib/dashboard";
import { PageHeader, Stat, Card, Badge } from "@/components/ui";
import {
  formatEuro,
  formatDateTime,
  STATUS_LABELS,
  ROLE_LABELS,
  COMMISSION_STATUS_LABELS,
  isDirection,
  canSeeCommissions,
} from "@/lib/utils";
import { StatsCharts } from "@/components/stats-charts";
import { toggleTaskDone } from "@/lib/actions";
import type { CommissionStatus } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const { id, role, fullName } = session.user;
  const productId = await getScopedProductId(role);
  const m = await computeDashboardMetrics(id, role, productId);

  return (
    <div>
      <PageHeader
        title={`Home — ${ROLE_LABELS[role]}`}
        subtitle={`${fullName} · indicateurs synchronisés selon votre profil`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Leads pipeline"
          value={String(m.leadsOpen)}
          hint={`${m.leadsTotal} au total`}
        />
        <Stat
          label="Signatures (mois)"
          value={String(m.signaturesMonth)}
          hint={`${m.leadsClosed} closés au total · win ${m.winRate}%`}
        />
        <Stat
          label="CA réalisé (mois)"
          value={formatEuro(m.caMonth)}
          hint={`CA closé cumulé ${formatEuro(m.closedCa)}`}
        />
        {canSeeCommissions(role) ? (
          <Stat
            label="Commissions à verser"
            value={formatEuro(m.commissionsAVerser)}
            hint={`Total ${formatEuro(m.commissionsTotal)} · versé ${formatEuro(m.commissionsVersees)}`}
          />
        ) : (
          <Stat label="Pipeline estimé" value={formatEuro(m.pipelineValue)} />
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(role === "COMMERCIAL" || isDirection(role)) && (
          <>
            <Stat label="Appels aujourd'hui" value={String(m.callsToday)} />
            <Stat label="RDV posés (jour)" value={String(m.rdvToday)} />
            <Stat
              label="Relances en retard"
              value={String(m.overdueCalls)}
              hint="nextCallAt dépassé"
            />
          </>
        )}
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
        <Stat label="Pipeline estimé" value={formatEuro(m.pipelineValue)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Tâches à effectuer</h2>
            <Link href="/taches" className="text-xs text-teal-800 hover:underline">
              Agenda
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {m.openTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-stone-500">
                    {t.dueAt ? formatDateTime(t.dueAt) : "Sans échéance"}
                    {t.companyName ? ` · ${t.companyName}` : ""}
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
            {m.openTasks.length === 0 ? (
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Timeline récente</h2>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {m.timeline.map((a) => (
              <div key={a.id} className="border-l-2 border-teal-700/30 pl-3">
                <p className="text-xs text-stone-500">
                  {formatDateTime(a.createdAt)} · {a.userName ?? "Système"} ·{" "}
                  {a.type}
                </p>
                <Link
                  href={`/leads/${a.leadId}`}
                  className="text-sm font-medium text-teal-900 hover:underline"
                >
                  {a.companyName}
                </Link>
                <p className="text-sm text-stone-700">{a.note}</p>
              </div>
            ))}
            {m.timeline.length === 0 ? (
              <p className="py-3 text-sm text-stone-500">Aucune activité récente.</p>
            ) : null}
          </div>
        </Card>

        {canSeeCommissions(role) ? (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Paiements commissions</h2>
              <Link
                href="/clients"
                className="text-xs text-teal-800 hover:underline"
              >
                Clients
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {m.pendingCommissions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{c.companyName}</p>
                    <p className="text-xs text-stone-500">
                      {c.userName} · {c.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatEuro(c.amountHt)}</p>
                    <Badge tone="warning">
                      {COMMISSION_STATUS_LABELS[
                        c.status as CommissionStatus
                      ] ?? c.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {m.pendingCommissions.length === 0 ? (
                <p className="py-3 text-sm text-stone-500">
                  Aucune commission en attente.
                </p>
              ) : null}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Leads récents</h2>
              <Link href="/leads" className="text-xs text-teal-800 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {m.recentLeads.map((l) => (
                <div key={l.id} className="flex justify-between py-2 text-sm">
                  <Link
                    href={`/leads/${l.id}`}
                    className="font-medium text-teal-900 hover:underline"
                  >
                    {l.companyName}
                  </Link>
                  <Badge tone="neutral">
                    {STATUS_LABELS[l.status as keyof typeof STATUS_LABELS] ??
                      l.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
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
