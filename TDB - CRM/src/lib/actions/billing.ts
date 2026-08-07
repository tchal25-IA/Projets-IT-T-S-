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

  const label = String(formData.get("label") || "").trim().slice(0, 200);
  const amountHt = Number(formData.get("amountHt") || 0);
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
      label,
      amountHt,
      billingStatus,
      isRecurring: formData.get("isRecurring") === "on",
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
