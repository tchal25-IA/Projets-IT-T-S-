import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import { visibleTabsForRole } from "@/lib/visible-tabs";
import { productBlock, fieldsForProduct } from "@/lib/custom-data";
import { enrichFieldsWithOfferings, parseFieldSchema } from "@/lib/fields";
import {
  updateClientStatus,
  updateClientDetails,
  deleteClient,
  addDealLine,
} from "@/lib/actions";
import { PageHeader, Button, Badge, Stat, Input, Label, Textarea } from "@/components/ui";
import { RecordTabs, SalesPath } from "@/components/record-tabs";
import { QualReadOnly } from "@/components/custom-fields-form";
import { AddDealLineForm } from "@/components/add-deal-line-form";
import {
  ActivitiesTimeline,
  ActorsCards,
  BillingPanel,
  CommissionsPanel,
  DealLinesList,
  LivraisonPanel,
} from "@/components/record-panels";
import {
  CLIENT_STATUS_LABELS,
  STATUS_LABELS,
  canSeeBilling,
  canSeeCommissions,
  canSeeMargins,
  formatDate,
  formatEuro,
  isDirection,
} from "@/lib/utils";
import type { ClientStatus } from "@/generated/prisma/client";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const productId = await getScopedProductId(session.user.role);
  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: {
      id,
      ...clientVisibilityWhere(session.user.id, session.user.role, { productId }),
    },
    include: {
      leads: {
        include: {
          product: true,
          commercial: true,
          apporteur: true,
          activities: {
            orderBy: { createdAt: "desc" },
            include: { user: true },
          },
        },
      },
      dealLines: { orderBy: { createdAt: "asc" } },
      commissions: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!client) notFound();

  const lead = client.leads[0];
  const customData = (lead?.customData ?? {}) as Record<string, unknown>;
  const qualification = (client.qualification ?? {}) as Record<string, unknown>;
  const canEditClient = canSeeBilling(session.user.role);
  const canDelete = isDirection(session.user.role);

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

  const qualBlocks = catalogProducts
    .map((p) => {
      const schema = fieldsForProduct(p.slug, p.fieldSchema);
      const fields = enrichFieldsWithOfferings(
        schema.length ? schema : parseFieldSchema(p.fieldSchema),
        p.offerings.map((o) => o.name)
      );
      const values = {
        ...productBlock(customData, p.slug, fields.map((f) => f.key)),
        ...productBlock(qualification, p.slug, fields.map((f) => f.key)),
      };
      const hasValues = Object.values(values).some(
        (v) => v !== undefined && v !== null && v !== ""
      );
      const interested =
        Boolean(customData[`interested_${p.slug}`]) ||
        Boolean(qualification[`interested_${p.slug}`]) ||
        lead?.product.slug === p.slug ||
        hasValues;
      return { id: p.id, name: p.name, fields, values, interested };
    })
    .filter((p) => p.interested);

  const ca = client.dealLines.reduce((s, d) => s + d.amountHt, 0);
  const commissionsTotal = client.commissions.reduce((s, c) => s + c.amountHt, 0);

  async function saveClient(formData: FormData) {
    "use server";
    await updateClientDetails(id, formData);
  }
  async function removeClient() {
    "use server";
    await deleteClient(id);
  }
  async function saveDeal(formData: FormData) {
    "use server";
    if (!lead) throw new Error("Lead d'origine requis pour ajouter une prestation");
    await addDealLine(lead.id, formData);
  }

  return (
    <div>
      <PageHeader
        title={client.companyName}
        subtitle="Fiche client — même format que le lead, onglets post-conversion ouverts"
        actions={
          <div className="flex flex-wrap gap-2">
            {lead ? (
              <Link href={`/leads/${lead.id}`}>
                <Button variant="secondary">Lead d&apos;origine</Button>
              </Link>
            ) : null}
            {canDelete ? (
              <form action={removeClient}>
                <Button type="submit" variant="ghost" className="text-red-700">
                  Supprimer le client
                </Button>
              </form>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="warning">{CLIENT_STATUS_LABELS[client.status]}</Badge>
        {lead ? <Badge tone="info">{lead.product.name}</Badge> : null}
        {lead ? (
          <Badge tone="success">Issu lead · {STATUS_LABELS[lead.status]}</Badge>
        ) : null}
      </div>

      {lead ? (
        <div className="mb-4">
          <SalesPath status={lead.status} />
        </div>
      ) : null}

      <RecordTabs
        leadStatus={lead?.status ?? "CLOSE"}
        hasClient
        defaultTab="livraison"
        visibleTabs={visibleTabsForRole(session.user.role)}
        panels={{
          resume: (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="CA prestations" value={formatEuro(ca)} />
              <Stat label="Commissions" value={formatEuro(commissionsTotal)} />
              <Stat label="Statut" value={CLIENT_STATUS_LABELS[client.status]} />
              <p className="sm:col-span-3 text-xs text-stone-500">
                Créé le {formatDate(client.createdAt)}
              </p>
            </div>
          ),
          contact: canEditClient ? (
            <form action={saveClient} className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Entreprise</Label>
                <Input name="companyName" defaultValue={client.companyName} required />
              </div>
              <div>
                <Label>Contact</Label>
                <Input name="contactName" defaultValue={client.contactName ?? ""} />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" defaultValue={client.email ?? ""} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input name="phone" defaultValue={client.phone ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea name="notes" rows={3} defaultValue={client.notes ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Enregistrer le contact</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-stone-500">Contact :</span>{" "}
                {client.contactName ?? "—"}
              </p>
              <p>
                <span className="text-stone-500">Email :</span> {client.email ?? "—"}
              </p>
              <p>
                <span className="text-stone-500">Téléphone :</span> {client.phone ?? "—"}
              </p>
            </div>
          ),
          qualification: (
            <div className="space-y-4">
              {qualBlocks.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-teal-700/30 bg-teal-50/40 p-4"
                >
                  <h3 className="mb-3 text-sm font-semibold text-teal-900">
                    {p.name}
                  </h3>
                  <QualReadOnly fields={p.fields} values={p.values} />
                </div>
              ))}
            </div>
          ),
          acteurs: (
            <ActorsCards
              commercialName={lead?.commercial?.fullName}
              apporteurName={lead?.apporteur?.fullName}
            />
          ),
          activites: (
            <ActivitiesTimeline activities={lead?.activities ?? []} />
          ),
          prestations: canSeeBilling(session.user.role) ? (
            <div className="space-y-4">
              <DealLinesList
                lines={client.dealLines}
                canEdit={canSeeBilling(session.user.role)}
              />
              {lead ? (
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
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Accès restreint</p>
          ),
          facturation: canSeeBilling(session.user.role) ? (
            <BillingPanel
              lines={client.dealLines}
              canEdit={canSeeBilling(session.user.role)}
            />
          ) : (
            <p className="text-sm text-stone-500">Accès restreint</p>
          ),
          commissions: canSeeCommissions(session.user.role) ? (
            <CommissionsPanel
              commissions={client.commissions}
              filterUserId={
                session.user.role === "APPORTEUR" ||
                session.user.role === "COMMERCIAL"
                  ? session.user.id
                  : null
              }
              canEdit={canSeeMargins(session.user.role)}
            />
          ) : (
            <p className="text-sm text-stone-500">Accès restreint</p>
          ),
          livraison: (
            <LivraisonPanel
              status={client.status}
              notes={client.notes}
              createdAt={client.createdAt}
              canEdit={canSeeBilling(session.user.role)}
              onStatusAction={
                canSeeBilling(session.user.role)
                  ? async (fd) => {
                      "use server";
                      await updateClientStatus(
                        id,
                        String(fd.get("status")) as ClientStatus
                      );
                    }
                  : undefined
              }
            />
          ),
        }}
      />
    </div>
  );
}
