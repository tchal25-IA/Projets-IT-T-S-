"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BillingStatus, ClientStatus } from "@/generated/prisma/client";
import { canSeeBilling, isDirection } from "@/lib/utils";
import { requireUser, revalidateCrm } from "@/lib/actions/helpers";
import { recordFieldChanges } from "@/lib/audit";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import {
  assertLeadAccess,
  assertClientAccess,
  assertDealLineAccess,
} from "@/lib/access";

const BILLING_STATUSES: BillingStatus[] = [
  "DEVIS",
  "A_FACTURER",
  "FACTURE",
  "PAYE",
];

const CLIENT_STATUSES: ClientStatus[] = [
  "EN_LIVRAISON",
  "ACTIF",
  "MAINTENANCE",
];

export async function addDealLine(leadId: string, formData: FormData) {
  const user = await requireUser();
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  await assertLeadAccess(user, leadId);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead introuvable");

  const offeringId = String(formData.get("offeringId") || "").trim() || null;
  let label = String(formData.get("label") || "").trim().slice(0, 200);
  let amountHt = Number(formData.get("amountHt") || 0);
  let isRecurring = formData.get("isRecurring") === "on";

  if (offeringId) {
    const offering = await prisma.productOffering.findFirst({
      where: { id: offeringId, active: true },
    });
    if (!offering) throw new Error("Prestation catalogue introuvable");
    label = offering.name;
    amountHt = offering.amountHt ?? amountHt;
    isRecurring =
      offering.kind === "SUBSCRIPTION" || offering.kind === "MAINTENANCE";
  }

  if (!label || !Number.isFinite(amountHt) || amountHt < 0) {
    throw new Error("Ligne invalide");
  }

  const billingStatus = String(
    formData.get("billingStatus") || "DEVIS"
  ) as BillingStatus;
  if (!BILLING_STATUSES.includes(billingStatus)) {
    throw new Error("Statut facturation invalide");
  }

  await prisma.dealLine.create({
    data: {
      leadId,
      clientId: lead.clientId,
      offeringId,
      label,
      amountHt,
      billingStatus,
      isRecurring,
    },
  });

  revalidateCrm({ leadId });
}

export async function updateDealLineStatus(
  id: string,
  billingStatus: BillingStatus
) {
  const user = await requireUser();
  if (!BILLING_STATUSES.includes(billingStatus)) {
    throw new Error("Statut facturation invalide");
  }
  const prev = await assertDealLineAccess(user, id);

  const line = await prisma.dealLine.update({
    where: { id },
    data: {
      billingStatus,
      ...(billingStatus === "PAYE" ? { paidAt: new Date() } : {}),
      ...(billingStatus === "FACTURE" && !prev.invoiceNumber
        ? {
            invoiceNumber: `FAC-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`,
          }
        : {}),
    },
  });

  await recordFieldChanges({
    entity: "DealLine",
    entityId: id,
    userId: user.id,
    changes: [
      {
        field: "billingStatus",
        oldValue: prev.billingStatus,
        newValue: billingStatus,
      },
    ],
  });

  revalidateCrm({ leadId: line.leadId, clientId: line.clientId });
}

export async function updateClientStatus(clientId: string, status: ClientStatus) {
  const user = await requireUser();
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  if (!CLIENT_STATUSES.includes(status)) throw new Error("Statut invalide");
  const prev = await assertClientAccess(user, clientId);

  await prisma.client.update({ where: { id: clientId }, data: { status } });
  await recordFieldChanges({
    entity: "Client",
    entityId: clientId,
    userId: user.id,
    changes: [{ field: "status", oldValue: prev.status, newValue: status }],
  });
  revalidateCrm({ clientId });
}

export async function updateCommissionStatus(
  id: string,
  status: "CALCULEE" | "A_VERSER" | "VERSEE"
) {
  const user = await requireUser();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  if (!["CALCULEE", "A_VERSER", "VERSEE"].includes(status)) {
    throw new Error("Statut commission invalide");
  }

  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw new Error("Commission introuvable");
  await assertClientAccess(user, existing.clientId);

  const commission = await prisma.commission.update({
    where: { id },
    data: { status },
  });
  revalidateCrm({ clientId: commission.clientId });
}

export async function startStripeCheckout(dealLineId: string) {
  const user = await requireUser();
  if (!isStripeConfigured()) {
    throw new Error("Stripe non configuré — définissez STRIPE_SECRET_KEY");
  }

  const line = await assertDealLineAccess(user, dealLineId);

  const email = line.client?.email ?? line.lead?.email;
  const result = await createCheckoutSession({
    dealLineId: line.id,
    label: line.label,
    amountHt: line.amountHt,
    customerEmail: email,
  });
  if (!result.url || !result.sessionId) {
    throw new Error(result.error ?? "Impossible de créer la session Stripe");
  }

  await prisma.dealLine.update({
    where: { id: line.id },
    data: {
      stripeSessionId: result.sessionId,
      billingStatus: "FACTURE",
      invoiceNumber:
        line.invoiceNumber ??
        `FAC-${new Date().getFullYear()}-${line.id.slice(-6).toUpperCase()}`,
    },
  });

  revalidateCrm({ leadId: line.leadId, clientId: line.clientId });
  redirect(result.url);
}

export async function updateDealLine(id: string, formData: FormData) {
  const user = await requireUser();
  const line = await assertDealLineAccess(user, id);

  const label = String(formData.get("label") || "").trim().slice(0, 200);
  const amountHt = Number(formData.get("amountHt") || 0);
  if (!label || !Number.isFinite(amountHt) || amountHt < 0) {
    throw new Error("Ligne invalide");
  }
  const billingStatus = String(
    formData.get("billingStatus") || line.billingStatus
  ) as BillingStatus;
  if (!BILLING_STATUSES.includes(billingStatus)) {
    throw new Error("Statut facturation invalide");
  }

  await prisma.dealLine.update({
    where: { id },
    data: {
      label,
      amountHt,
      billingStatus,
      isRecurring: formData.get("isRecurring") === "on",
      notes: String(formData.get("notes") || "") || null,
    },
  });

  revalidateCrm({ leadId: line.leadId, clientId: line.clientId });
}

export async function deleteDealLine(id: string) {
  const user = await requireUser();
  const line = await assertDealLineAccess(user, id);
  await prisma.dealLine.delete({ where: { id } });
  revalidateCrm({ leadId: line.leadId, clientId: line.clientId });
}

export async function updateCommission(id: string, formData: FormData) {
  const user = await requireUser();
  if (!isDirection(user.role)) throw new Error("Accès refusé");

  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) throw new Error("Commission introuvable");
  await assertClientAccess(user, existing.clientId);

  const ratePercent = Number(formData.get("ratePercent") || existing.ratePercent);
  const amountHt = Number(formData.get("amountHt") || existing.amountHt);
  const status = String(formData.get("status") || existing.status) as
    | "CALCULEE"
    | "A_VERSER"
    | "VERSEE";
  const label = String(formData.get("label") || existing.label).trim();

  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new Error("Taux invalide");
  }
  if (!Number.isFinite(amountHt) || amountHt < 0) {
    throw new Error("Montant invalide");
  }
  if (!["CALCULEE", "A_VERSER", "VERSEE"].includes(status)) {
    throw new Error("Statut invalide");
  }

  await prisma.commission.update({
    where: { id },
    data: { ratePercent, amountHt, status, label: label || existing.label },
  });
  revalidateCrm({ clientId: existing.clientId, leadId: existing.leadId });
}

export async function deleteCommission(id: string) {
  const user = await requireUser();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) return;
  await assertClientAccess(user, existing.clientId);
  await prisma.commission.delete({ where: { id } });
  revalidateCrm({ clientId: existing.clientId, leadId: existing.leadId });
}

export async function updateClientDetails(clientId: string, formData: FormData) {
  const user = await requireUser();
  if (!canSeeBilling(user.role) && user.role !== "APPORTEUR") {
    // apporteur read-only typically
  }
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  await assertClientAccess(user, clientId);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      companyName: String(formData.get("companyName") || "").trim() || undefined,
      contactName: String(formData.get("contactName") || "") || null,
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidateCrm({ clientId });
}

export async function deleteClient(clientId: string) {
  const user = await requireUser();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  await assertClientAccess(user, clientId);

  // Détache les leads, purge dépendances
  await prisma.commission.deleteMany({ where: { clientId } });
  await prisma.dealLine.deleteMany({ where: { clientId } });
  await prisma.task.deleteMany({ where: { clientId } });
  await prisma.lead.updateMany({
    where: { clientId },
    data: { clientId: null },
  });
  await prisma.client.delete({ where: { id: clientId } });
  revalidateCrm({ clientId });
  redirect("/clients");
}
