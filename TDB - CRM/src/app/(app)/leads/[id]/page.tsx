import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import { visibleTabsForRole } from "@/lib/visible-tabs";
import {
  addActivity,
  addDealLine,
  updateLeadDetails,
  updateClientStatus,
  deleteLead,
} from "@/lib/actions";
import {
  PageHeader,
  Button,
  Input,
  Label,
  Select,
  Badge,
  Stat,
} from "@/components/ui";
import { StatusSelect } from "@/components/status-select";
import { CustomFieldsForm, QualReadOnly } from "@/components/custom-fields-form";
import { RecordTabs, SalesPath } from "@/components/record-tabs";
import {
  ActivitiesTimeline,
  ActorsCards,
  BillingPanel,
  CommissionsPanel,
  DealLinesList,
  LivraisonPanel,
} from "@/components/record-panels";
import { AddDealLineForm } from "@/components/add-deal-line-form";
import { ActivityComposer } from "@/components/activity-composer";
import { RelatedRail } from "@/components/related-rail";
import { ScoreBadge } from "@/components/score-badge";
import { computeLeadScore } from "@/lib/scoring";
import { getLeadSources } from "@/lib/business-settings";
import { getLeadStatusLabels } from "@/lib/business-settings";
import {
  CLIENT_STATUS_LABELS,
  STATUS_LABELS,
  canSeeBilling,
  canSeeCommissions,
  canSeeMargins,
  formatDateTime,
  formatEuro,
  isDirection,
  isFullAccess,
  productSlugForRole,
} from "@/lib/utils";
import {
  enrichFieldsWithOfferings,
  parseFieldSchema,
} from "@/lib/fields";
import {
  fieldsForProduct,
  formPrefixForSlug,
  interestFieldForSlug,
  isProductInterested,
  productBlock,
} from "@/lib/custom-data";
import type { ClientStatus } from "@/generated/prisma/client";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const productId = await getScopedProductId(session.user.role);

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      ...leadVisibilityWhere(session.user.id, session.user.role, { productId }),
    },
    include: {
      product: true,
      commercial: true,
      apporteur: true,
      interests: true,
      client: {
        include: {
          dealLines: true,
          commissions: { include: { user: true } },
        },
      },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
      dealLines: { orderBy: { createdAt: "asc" } },
      commissions: { include: { user: true } },
      tasks: {
        where: { doneAt: null },
        orderBy: { dueAt: "asc" },
        take: 8,
      },
    },
  });
  if (!lead) notFound();

  const history = await prisma.fieldHistory.findMany({
    where: { entity: "Lead", entityId: lead.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["COMMERCIAL", "APPORTEUR"] } },
    orderBy: { fullName: "asc" },
    take: 50,
  });

  const leadSources = await getLeadSources();
  const statusLabels = await getLeadStatusLabels();
  const canManage = isDirection(session.user.role);

  const customData = (lead.customData ?? {}) as Record<string, unknown>;
  const roleSlug = productSlugForRole(session.user.role);
  const readOnly = session.user.role === "APPORTEUR";

  const catalogProducts = await prisma.product.findMany({
    where: { active: true },
    include: {
      offerings: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const qualProducts = catalogProducts
    .map((p) => {
      const schema = fieldsForProduct(p.slug, p.fieldSchema);
      const fields = enrichFieldsWithOfferings(
        schema.length ? schema : parseFieldSchema(p.fieldSchema),
        p.offerings.map((o) => o.name)
      );
      const values = productBlock(
        customData,
        p.slug,
        fields.map((f) => f.key)
      );
      const interested = isProductInterested(customData, p.slug, {
        primarySlug: lead.product.slug,
        interestSlugs: lead.interests.map((i) => i.productSlug),
        hasBlockValues: Object.keys(values).length > 0,
      });
      // Toujours afficher les blocs en édition (comme /leads/new)
      const show =
        !readOnly ||
        isFullAccess(session.user.role) ||
        roleSlug === p.slug ||
        interested;
      return { ...p, fields, values, interested, show };
    })
    .filter((p) => p.show);

  const hideMoney = readOnly;
  const hasClient = Boolean(lead.clientId);
  const dealLines = lead.client?.dealLines?.length
    ? lead.client.dealLines
    : lead.dealLines;
  const commissions = lead.client?.commissions?.length
    ? lead.client.commissions
    : lead.commissions;
  const upcoming =
    lead.nextCallAt && lead.nextCallAt.getTime() >= Date.now() - 60_000
      ? lead.nextCallAt
      : null;
  const score = computeLeadScore(lead);
  const interestLabels = lead.interests.map((i) => {
    const p = catalogProducts.find((x) => x.slug === i.productSlug);
    return p?.name ?? i.productSlug;
  });

  async function saveDetails(formData: FormData) {
    "use server";
    await updateLeadDetails(id, formData);
  }
  async function saveActivity(formData: FormData) {
    "use server";
    await addActivity(id, formData);
  }
  async function saveDeal(formData: FormData) {
    "use server";
    await addDealLine(id, formData);
  }
  async function removeLead() {
    "use server";
    await deleteLead(id);
  }

  const hiddenIdentity = (
    <>
      <input type="hidden" name="companyName" value={lead.companyName} />
      <input type="hidden" name="contactName" value={lead.contactName ?? ""} />
      <input type="hidden" name="email" value={lead.email ?? ""} />
      <input type="hidden" name="phone" value={lead.phone ?? ""} />
      <input type="hidden" name="website" value={lead.website ?? ""} />
      <input type="hidden" name="source" value={lead.source ?? ""} />
      <input type="hidden" name="productId" value={lead.productId} />
      <input
        type="hidden"
        name="estimatedValue"
        value={lead.estimatedValue ?? ""}
      />
      <input
        type="hidden"
        name="nextCallAt"
        value={
          lead.nextCallAt
            ? new Date(
                lead.nextCallAt.getTime() -
                  lead.nextCallAt.getTimezoneOffset() * 60000
              )
                .toISOString()
                .slice(0, 16)
            : ""
        }
      />
      <input type="hidden" name="commercialId" value={lead.commercialId ?? ""} />
      <input type="hidden" name="apporteurId" value={lead.apporteurId ?? ""} />
    </>
  );

  return (
    <div>
      <PageHeader
        title={lead.companyName}
        subtitle={`${lead.product.name} · fiche Lead → Client`}
        actions={
          <div className="flex flex-wrap gap-2">
            {lead.clientId ? (
              <Link href={`/clients/${lead.clientId}`}>
                <Button variant="secondary">Fiche client</Button>
              </Link>
            ) : null}
            {canManage ? (
              <form action={removeLead}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="text-red-700"
                >
                  Supprimer le lead
                </Button>
              </form>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <StatusSelect
            leadId={lead.id}
            value={lead.status}
            disabled={readOnly}
            labels={statusLabels}
          />
        </div>
        <ScoreBadge score={score} />
        <Badge tone="info">{lead.source ?? "Sans source"}</Badge>
        {interestLabels.length > 0 ? (
          <Badge tone="neutral">{interestLabels.join(" + ")}</Badge>
        ) : null}
        {lead.client ? (
          <Badge tone="success">
            Client · {CLIENT_STATUS_LABELS[lead.client.status]}
          </Badge>
        ) : null}
        {upcoming ? (
          <Badge tone="warning">Relance · {formatDateTime(upcoming)}</Badge>
        ) : null}
      </div>

      <div className="mb-4">
        <SalesPath status={lead.status} />
      </div>

      {!readOnly ? (
        <div className="mb-4">
          <ActivityComposer leadId={lead.id} hasEmail={Boolean(lead.email)} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <RecordTabs
          leadStatus={lead.status}
          hasClient={hasClient}
          visibleTabs={visibleTabsForRole(session.user.role)}
          panels={{
            resume: (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Statut" value={STATUS_LABELS[lead.status]} />
                  <Stat label="Produit" value={lead.product.name} />
                  <Stat
                    label="Valeur estimée"
                    value={hideMoney ? "—" : formatEuro(lead.estimatedValue)}
                  />
                </div>
                <ActorsCards
                  commercialName={lead.commercial?.fullName}
                  apporteurName={lead.apporteur?.fullName}
                />
                <p className="text-xs text-stone-500">
                  Les onglets se débloquent avec le parcours. Rail droit =
                  prestations, commissions, tâches.
                </p>
              </div>
            ),
            contact: (
              <form action={saveDetails} className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Entreprise</Label>
                  <Input
                    name="companyName"
                    defaultValue={lead.companyName}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Contact</Label>
                  <Input
                    name="contactName"
                    defaultValue={lead.contactName ?? ""}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    name="email"
                    defaultValue={lead.email ?? ""}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    name="phone"
                    defaultValue={lead.phone ?? ""}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Site web</Label>
                  <Input
                    name="website"
                    defaultValue={lead.website ?? ""}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label>Source</Label>
                  {readOnly ? (
                    <Input name="source" defaultValue={lead.source ?? ""} disabled />
                  ) : (
                    <Select name="source" defaultValue={lead.source ?? ""}>
                      <option value="">—</option>
                      {[
                        ...new Set([
                          ...leadSources,
                          ...(lead.source ? [lead.source] : []),
                        ]),
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                {canManage ? (
                  <div>
                    <Label>Produit principal</Label>
                    <Select name="productId" defaultValue={lead.productId}>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <input type="hidden" name="productId" value={lead.productId} />
                )}
                {!hideMoney ? (
                  <div>
                    <Label>Valeur estimée (€)</Label>
                    <Input
                      name="estimatedValue"
                      type="number"
                      defaultValue={lead.estimatedValue ?? ""}
                    />
                  </div>
                ) : null}
                <div>
                  <Label>Prochain rappel</Label>
                  <Input
                    name="nextCallAt"
                    type="datetime-local"
                    disabled={readOnly}
                    defaultValue={
                      lead.nextCallAt
                        ? new Date(
                            lead.nextCallAt.getTime() -
                              lead.nextCallAt.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                  />
                </div>
                <input
                  type="hidden"
                  name="commercialId"
                  value={lead.commercialId ?? ""}
                />
                <input
                  type="hidden"
                  name="apporteurId"
                  value={lead.apporteurId ?? ""}
                />
                {!readOnly ? (
                  <div className="sm:col-span-2">
                    <Button type="submit">Enregistrer</Button>
                  </div>
                ) : null}
              </form>
            ),
            qualification: (
              <form action={saveDetails} className="space-y-4">
                {hiddenIdentity}
                <div className="flex flex-wrap gap-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
                  {catalogProducts.map((p) => {
                    const interestName = interestFieldForSlug(p.slug);
                    const qp = qualProducts.find((q) => q.id === p.id);
                    const checked =
                      qp?.interested ||
                      Boolean(customData[`interested_${p.slug}`]) ||
                      lead.product.slug === p.slug ||
                      lead.interests.some((i) => i.productSlug === p.slug);
                    return (
                      <label key={p.id} className="flex items-center gap-2">
                        <input type="hidden" name={interestName} value="false" />
                        <input
                          type="checkbox"
                          name={interestName}
                          value="true"
                          defaultChecked={checked}
                          disabled={readOnly}
                        />
                        Qualifié {p.name}
                      </label>
                    );
                  })}
                </div>
                {qualProducts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-teal-700/30 bg-teal-50/40 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-teal-900">
                      {p.name}
                    </h3>
                    {readOnly ? (
                      <QualReadOnly fields={p.fields} values={p.values} />
                    ) : (
                      <CustomFieldsForm
                        fields={p.fields}
                        values={p.values}
                        prefix={formPrefixForSlug(p.slug)}
                      />
                    )}
                  </div>
                ))}
                {!readOnly ? (
                  <Button type="submit">Enregistrer la qualification</Button>
                ) : null}
              </form>
            ),
            acteurs: readOnly ? (
              <ActorsCards
                commercialName={lead.commercial?.fullName}
                apporteurName={lead.apporteur?.fullName}
              />
            ) : (
              <form action={saveDetails} className="space-y-4">
                {hiddenIdentity}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Commercial</Label>
                    <Select
                      name="commercialId"
                      defaultValue={lead.commercialId ?? ""}
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
                    <Select
                      name="apporteurId"
                      defaultValue={lead.apporteurId ?? ""}
                    >
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
                <Button type="submit">Enregistrer les acteurs</Button>
              </form>
            ),
            activites: (
              <ActivitiesTimeline
                activities={lead.activities}
                upcomingRelance={upcoming}
                addAction={readOnly ? undefined : saveActivity}
              />
            ),
            prestations:
              !hideMoney && canSeeBilling(session.user.role) ? (
                <div className="space-y-4">
                  <DealLinesList
                    lines={dealLines}
                    canEdit={canSeeBilling(session.user.role)}
                  />
                  <AddDealLineForm
                    action={saveDeal}
                    offerings={catalogProducts.flatMap((p) =>
                      p.offerings.map((o) => ({
                        id: o.id,
                        name: o.name,
                        amountHt: o.amountHt,
                        kind: o.kind,
                        productName: p.name,
                      }))
                    )}
                  />
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  Accès prestations restreint.
                </p>
              ),
            facturation: canSeeBilling(session.user.role) ? (
              <BillingPanel
                lines={dealLines}
                canEdit={canSeeBilling(session.user.role)}
              />
            ) : (
              <p className="text-sm text-stone-500">Accès restreint.</p>
            ),
            commissions: canSeeCommissions(session.user.role) ? (
              <CommissionsPanel
                commissions={commissions}
                filterUserId={
                  session.user.role === "APPORTEUR" ||
                  session.user.role === "COMMERCIAL"
                    ? session.user.id
                    : null
                }
                canEdit={canSeeMargins(session.user.role)}
              />
            ) : (
              <p className="text-sm text-stone-500">Accès restreint.</p>
            ),
            livraison: lead.client ? (
              <LivraisonPanel
                status={lead.client.status}
                notes={lead.client.notes}
                createdAt={lead.client.createdAt}
                canEdit={canSeeBilling(session.user.role)}
                onStatusAction={
                  canSeeBilling(session.user.role)
                    ? async (fd) => {
                        "use server";
                        await updateClientStatus(
                          lead.clientId!,
                          String(fd.get("status")) as ClientStatus
                        );
                      }
                    : undefined
                }
                leadLink={
                  <Link href={`/clients/${lead.client.id}`}>
                    <Button variant="secondary">Ouvrir la fiche client</Button>
                  </Link>
                }
              />
            ) : (
              <p className="text-sm text-stone-500">
                Passez le lead en <strong>Closé</strong> pour créer le client.
              </p>
            ),
            historique: (
              <div className="divide-y divide-stone-100">
                {history.map((h) => (
                  <div key={h.id} className="py-2 text-sm">
                    <p className="font-medium">
                      {h.field}{" "}
                      <span className="font-normal text-stone-500">
                        {h.oldValue ?? "∅"} → {h.newValue ?? "∅"}
                      </span>
                    </p>
                    <p className="text-xs text-stone-400">
                      {h.user?.fullName ?? "Système"} · {formatDateTime(h.createdAt)}
                    </p>
                  </div>
                ))}
                {history.length === 0 ? (
                  <p className="py-4 text-sm text-stone-500">
                    Aucune modification enregistrée.
                  </p>
                ) : null}
              </div>
            ),
          }}
        />

        <RelatedRail
          dealLines={dealLines}
          commissions={commissions}
          tasks={lead.tasks}
          nextCallAt={lead.nextCallAt}
          score={score}
          interests={interestLabels}
        />
      </div>
    </div>
  );
}
