"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BillingStatus, AccountStatus } from "@/generated/prisma/client";
import { canSeeBilling, isDirection } from "@/lib/utils";
import { requireUser, revalidateCrm } from "@/lib/actions/helpers";
import { recordFieldChanges } from "@/lib/audit";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import {
  assertLeadAccess,
  assertAccountAccess,
  assertOpportunityAccess,
} from "@/lib/access";
import { requireOrg, orgWhere } from "@/lib/tenant";

const BILLING_STATUSES: BillingStatus[] = [
  "DEVIS",
  "A_FACTURER",
  "FACTURE",
  "PAYE",
];

const ACCOUNT_STATUSES: AccountStatus[] = [
  "EN_LIVRAISON",
  "ACTIF",
  "MAINTENANCE",
];

export async function addOpportunity(leadId: string, formData: FormData) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  await assertLeadAccess(user, leadId);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead introuvable");

  const offeringId = String(formData.get("offeringId") || "").trim() || null;
  let name = String(formData.get("label") || formData.get("name") || "").trim().slice(0, 200);
  let amount = Number(formData.get("amountHt") || formData.get("amount") || 0);
  let isRecurring = formData.get("isRecurring") === "on";

  if (offeringId) {
    const offering = await prisma.productOffering.findFirst({
      where: orgWhere(orgId, { id: offeringId, active: true }),
    });
    if (!offering) throw new Error("Prestation catalogue introuvable");
    name = offering.name;
    amount = offering.amountHt ?? amount;
    isRecurring =
      offering.kind === "SUBSCRIPTION" || offering.kind === "MAINTENANCE";
  }

  if (!name || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Ligne invalide");
  }

  const billingStatus = String(
    formData.get("billingStatus") || "DEVIS"
  ) as BillingStatus;
  if (!BILLING_STATUSES.includes(billingStatus)) {
    throw new Error("Statut facturation invalide");
  }

  await prisma.opportunity.create({
    data: {
      organizationId: orgId,
      leadId,
      accountId: lead.accountId,
      offeringId,
      name,
      amount,
      billingStatus,
      stage: "QUALIFICATION",
      isRecurring,
    },
  });

  revalidateCrm({ leadId });
}

// Legacy alias
export const addDealLine = addOpportunity;

export async function updateOpportunityStatus(
  id: string,
  billingStatus: BillingStatus
) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!BILLING_STATUSES.includes(billingStatus)) {
    throw new Error("Statut facturation invalide");
  }
  const prev = await assertOpportunityAccess(user, id);

  const opp = await prisma.opportunity.update({
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
    entity: "Opportunity",
    entityId: id,
    userId: user.id,
    changes: [
      {
        field: "billingStatus",
        oldValue: prev.billingStatus ?? "",
        newValue: billingStatus,
      },
    ],
  });

  revalidateCrm({ leadId: opp.leadId ?? undefined, accountId: opp.accountId ?? undefined });
}

// Legacy alias
export const updateDealLineStatus = updateOpportunityStatus;

export async function updateAccountStatus(accountId: string, status: AccountStatus) {
  const user = await requireUser();
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  if (!ACCOUNT_STATUSES.includes(status)) throw new Error("Statut invalide");
  const prev = await assertAccountAccess(user, accountId);

  await prisma.account.update({ where: { id: accountId }, data: { status } });
  await recordFieldChanges({
    entity: "Account",
    entityId: accountId,
    userId: user.id,
    changes: [{ field: "status", oldValue: prev.status, newValue: status }],
  });
  revalidateCrm({ accountId });
}

// Legacy alias
export const updateClientStatus = updateAccountStatus;

export async function updateCommissionStatus(
  id: string,
  status: "CALCULEE" | "A_VERSER" | "VERSEE"
) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  if (!["CALCULEE", "A_VERSER", "VERSEE"].includes(status)) {
    throw new Error("Statut commission invalide");
  }

  const existing = await prisma.commission.findFirst({ 
    where: orgWhere(orgId, { id })
  });
  if (!existing) throw new Error("Commission introuvable");
  await assertAccountAccess(user, existing.accountId);

  const commission = await prisma.commission.update({
    where: { id },
    data: { status },
  });
  revalidateCrm({ accountId: commission.accountId });
}

export async function startStripeCheckout(opportunityId: string) {
  const user = await requireUser();
  if (!isStripeConfigured()) {
    throw new Error("Stripe non configuré — définissez STRIPE_SECRET_KEY");
  }

  const opp = await assertOpportunityAccess(user, opportunityId);

  const email = opp.account?.email ?? opp.lead?.email;
  const result = await createCheckoutSession({
    dealLineId: opp.id,
    label: opp.name,
    amountHt: opp.amount,
    customerEmail: email,
  });
  if (!result.url || !result.sessionId) {
    throw new Error(result.error ?? "Impossible de créer la session Stripe");
  }

  await prisma.opportunity.update({
    where: { id: opp.id },
    data: {
      stripeSessionId: result.sessionId,
      billingStatus: "FACTURE",
      invoiceNumber:
        opp.invoiceNumber ??
        `FAC-${new Date().getFullYear()}-${opp.id.slice(-6).toUpperCase()}`,
    },
  });

  revalidateCrm({ leadId: opp.leadId ?? undefined, accountId: opp.accountId ?? undefined });
  redirect(result.url);
}

export async function updateOpportunity(id: string, formData: FormData) {
  const user = await requireUser();
  const opp = await assertOpportunityAccess(user, id);

  const name = String(formData.get("label") || formData.get("name") || "").trim().slice(0, 200);
  const amount = Number(formData.get("amountHt") || formData.get("amount") || 0);
  if (!name || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Ligne invalide");
  }
  const billingStatus = String(
    formData.get("billingStatus") || opp.billingStatus
  ) as BillingStatus;
  if (!BILLING_STATUSES.includes(billingStatus)) {
    throw new Error("Statut facturation invalide");
  }

  await prisma.opportunity.update({
    where: { id },
    data: {
      name,
      amount,
      billingStatus,
      isRecurring: formData.get("isRecurring") === "on",
      description: String(formData.get("notes") || formData.get("description") || "") || null,
    },
  });

  revalidateCrm({ leadId: opp.leadId ?? undefined, accountId: opp.accountId ?? undefined });
}

// Legacy alias
export const updateDealLine = updateOpportunity;

export async function deleteOpportunity(id: string) {
  const user = await requireUser();
  const opp = await assertOpportunityAccess(user, id);
  await prisma.opportunity.delete({ where: { id } });
  revalidateCrm({ leadId: opp.leadId ?? undefined, accountId: opp.accountId ?? undefined });
}

// Legacy alias
export const deleteDealLine = deleteOpportunity;

export async function updateCommission(id: string, formData: FormData) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!isDirection(user.role)) throw new Error("Accès refusé");

  const existing = await prisma.commission.findFirst({ 
    where: orgWhere(orgId, { id })
  });
  if (!existing) throw new Error("Commission introuvable");
  await assertAccountAccess(user, existing.accountId);

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
  revalidateCrm({ accountId: existing.accountId, leadId: existing.leadId ?? undefined });
}

export async function deleteCommission(id: string) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  const existing = await prisma.commission.findFirst({ 
    where: orgWhere(orgId, { id })
  });
  if (!existing) return;
  await assertAccountAccess(user, existing.accountId);
  await prisma.commission.delete({ where: { id } });
  revalidateCrm({ accountId: existing.accountId, leadId: existing.leadId ?? undefined });
}

export async function updateAccountDetails(accountId: string, formData: FormData) {
  const user = await requireUser();
  if (!canSeeBilling(user.role) && user.role !== "APPORTEUR") {
    // apporteur read-only typically
  }
  if (!canSeeBilling(user.role)) throw new Error("Accès refusé");
  await assertAccountAccess(user, accountId);

  await prisma.account.update({
    where: { id: accountId },
    data: {
      companyName: String(formData.get("companyName") || "").trim() || undefined,
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidateCrm({ accountId });
}

// Legacy alias
export const updateClientDetails = updateAccountDetails;

export async function deleteAccount(accountId: string) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  await assertAccountAccess(user, accountId);

  // Détache les leads, purge dépendances
  await prisma.commission.deleteMany({ where: orgWhere(orgId, { accountId }) });
  await prisma.opportunity.deleteMany({ where: orgWhere(orgId, { accountId }) });
  await prisma.task.deleteMany({ where: orgWhere(orgId, { accountId }) });
  await prisma.contact.deleteMany({ where: orgWhere(orgId, { accountId }) });
  await prisma.lead.updateMany({
    where: orgWhere(orgId, { accountId }),
    data: { accountId: null },
  });
  await prisma.account.delete({ where: { id: accountId } });
  revalidateCrm({ accountId });
  redirect("/clients");
}

// Legacy alias
export const deleteClient = deleteAccount;
