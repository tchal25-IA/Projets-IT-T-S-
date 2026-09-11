"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ActivityType,
  LeadStatus,
  Prisma,
} from "@/generated/prisma/client";
import { buildCustomDataPayload } from "@/lib/custom-data";
import { recordFieldChanges, diffScalar } from "@/lib/audit";
import { syncLeadInterests } from "@/lib/interests";
import {
  canCloseDeal,
  canEditLead,
  isDirection,
  PIPELINE_STATUSES,
} from "@/lib/utils";
import { requireUser, notify, revalidateCrm } from "@/lib/actions/helpers";
import { assertLeadAccess } from "@/lib/access";
import { getScopedProductId } from "@/lib/scope";
import {
  sendCrmEmail,
  templateCloseConfirm,
} from "@/lib/email";
import { formatEuro } from "@/lib/utils";
import {
  getCommissionRates,
  syncDealLinesFromQualification,
} from "@/lib/catalog";
import { requireOrg, orgWhere } from "@/lib/tenant";

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const orgId = await requireOrg();
  
  if (
    user.role === "APPORTEUR" ||
    (!isDirection(user.role) && user.role !== "COMMERCIAL")
  ) {
    throw new Error("Accès refusé");
  }

  const companyName = String(formData.get("companyName") || "").trim();
  let productId = String(formData.get("productId") || "");
  if (!companyName || !productId) throw new Error("Champs requis manquants");

  const scopedProductId = await getScopedProductId(user.role);
  if (scopedProductId && productId !== scopedProductId) {
    throw new Error("Produit hors périmètre");
  }
  if (scopedProductId) productId = scopedProductId;

  const product = await prisma.product.findFirst({ 
    where: orgWhere(orgId, { id: productId })
  });
  if (!product?.active) throw new Error("Produit invalide");

  const productSlugs = (
    await prisma.product.findMany({
      where: orgWhere(orgId, { active: true }),
      select: { slug: true },
      orderBy: { sortOrder: "asc" },
    })
  ).map((p) => p.slug);

  const customData = buildCustomDataPayload(
    formData,
    {},
    productSlugs
  ) as Record<string, unknown>;
  // Produit primaire toujours marqué intéressé
  customData[`interested_${product.slug}`] = true;

  const lead = await prisma.lead.create({
    data: {
      organizationId: orgId,
      companyName,
      contactName: String(formData.get("contactName") || "") || null,
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      source: String(formData.get("source") || "") || "Manuel",
      productId,
      customData: customData as Prisma.InputJsonValue,
      estimatedValue: formData.get("estimatedValue")
        ? Number(formData.get("estimatedValue"))
        : null,
      commercialId:
        user.role === "COMMERCIAL"
          ? user.id
          : isDirection(user.role)
            ? String(formData.get("commercialId") || "") || null
            : null,
      apporteurId: isDirection(user.role)
        ? String(formData.get("apporteurId") || "") || null
        : null,
    },
  });

  await syncLeadInterests(lead.id, customData, product.slug);
  await syncDealLinesFromQualification(lead.id, customData);
  await prisma.activity.create({
    data: {
      organizationId: orgId,
      leadId: lead.id,
      userId: user.id,
      type: "SYSTEM",
      note: `Lead créé par ${user.fullName}`,
    },
  });

  revalidateCrm();
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const user = await requireUser();
  const orgId = await requireOrg();
  
  if (!PIPELINE_STATUSES.includes(status)) throw new Error("Statut invalide");

  const lead = await assertLeadAccess(user, leadId, {
    requireEdit: true,
    requireClose: status === "CLOSE",
  });

  if (status === "CLOSE" && !canCloseDeal(user.role)) {
    throw new Error("Droit insuffisant pour closer");
  }

  const data: {
    status: LeadStatus;
    closedAt?: Date | null;
    accountId?: string;
    commercialId?: string | null;
  } = { status };

  if (status === "CLOSE") {
    data.closedAt = new Date();
    const commercialId =
      lead.commercialId ?? (user.role === "COMMERCIAL" ? user.id : null);
    if (!lead.commercialId && user.role === "COMMERCIAL") {
      data.commercialId = user.id;
    }

    const account = await prisma.account.create({
      data: {
        organizationId: orgId,
        companyName: lead.companyName,
        email: lead.email,
        phone: lead.phone,
        status: "EN_LIVRAISON",
        notes: `Account issu du lead closé le ${new Date().toLocaleDateString("fr-FR")}`,
        qualification: (lead.customData ?? {}) as Prisma.InputJsonValue,
      },
    });
    data.accountId = account.id;

    await prisma.opportunity.updateMany({
      where: orgWhere(orgId, { leadId }),
      data: { accountId: account.id, billingStatus: "A_FACTURER" },
    });

    const lines = await prisma.opportunity.findMany({ 
      where: orgWhere(orgId, { leadId })
    });
    const ca = lines.reduce((s, l) => s + l.amount, 0);
    const rates = await getCommissionRates();

    if (lead.apporteurId && ca > 0) {
      await prisma.commission.create({
        data: {
          organizationId: orgId,
          accountId: account.id,
          leadId,
          userId: lead.apporteurId,
          label: "Commission apporteur",
          roleLabel: "Apporteur d'affaires",
          ratePercent: rates.APPORTEUR,
          amountHt: Math.round((ca * rates.APPORTEUR) / 100),
          status: "A_VERSER",
        },
      });
      await notify(
        lead.apporteurId,
        "Lead converti",
        `${lead.companyName} est passé en account — commission calculée.`,
        `/accounts/${account.id}`
      );
    }

    if (commercialId && ca > 0) {
      await prisma.commission.create({
        data: {
          organizationId: orgId,
          accountId: account.id,
          leadId,
          userId: commercialId,
          label: "Commission commercial (close)",
          roleLabel: "Commercial",
          ratePercent: rates.COMMERCIAL,
          amountHt: Math.round((ca * rates.COMMERCIAL) / 100),
          status: "A_VERSER",
        },
      });
    }

    const directors = await prisma.user.findMany({
      where: orgWhere(orgId, {
        role: { in: ["ASSOCIE", "ADMIN", "DIRECTION_VF", "DIRECTION_BOOKFLOW"] as Array<"ASSOCIE" | "ADMIN" | "DIRECTION_VF" | "DIRECTION_BOOKFLOW"> },
        active: true,
      }),
    });
    for (const d of directors) {
      await notify(
        d.id,
        "Deal closé",
        `${lead.companyName} closé par ${user.fullName}`,
        `/accounts/${account.id}`
      );
    }

    if (lead.email) {
      const tpl = templateCloseConfirm(lead.companyName);
      await sendCrmEmail({
        to: lead.email,
        subject: tpl.subject,
        html: tpl.html,
        leadId,
        userId: user.id,
        logNote: `Confirmation close envoyée (${formatEuro(ca)})`,
      });
    }
  }

  await prisma.lead.update({ where: { id: leadId }, data });
  await recordFieldChanges({
    entity: "Lead",
    entityId: leadId,
    userId: user.id,
    changes: [
      {
        field: "status",
        oldValue: lead.status,
        newValue: status,
      },
    ],
  });
  await prisma.activity.create({
    data: {
      organizationId: orgId,
      leadId,
      userId: user.id,
      type: "STATUT",
      note: `Statut → ${status}`,
    },
  });

  revalidateCrm({
    leadId,
    accountId: status === "CLOSE" ? data.accountId : lead.accountId,
  });
}

export async function updateLeadDetails(leadId: string, formData: FormData) {
  const user = await requireUser();
  const orgId = await requireOrg();
  const lead = await assertLeadAccess(user, leadId, { requireEdit: true });
  if (!canEditLead(user.role)) throw new Error("Accès refusé");

  // Recharge product for sync
  const leadFull = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { product: true },
  });
  if (!leadFull) throw new Error("Lead introuvable");

  const productSlugs = (
    await prisma.product.findMany({
      where: orgWhere(orgId, { active: true }),
      select: { slug: true },
      orderBy: { sortOrder: "asc" },
    })
  ).map((p) => p.slug);

  const nextCustom = buildCustomDataPayload(
    formData,
    (lead.customData ?? {}) as Record<string, unknown>,
    productSlugs.length ? productSlugs : []
  );

  const companyName = String(formData.get("companyName") || "");
  const contactName = String(formData.get("contactName") || "") || null;
  const email = String(formData.get("email") || "") || null;
  const phone = String(formData.get("phone") || "") || null;
  const website = String(formData.get("website") || "") || null;
  const source = String(formData.get("source") || "") || null;
  const estimatedValue = formData.get("estimatedValue")
    ? Number(formData.get("estimatedValue"))
    : null;
  const nextCallAt = formData.get("nextCallAt")
    ? new Date(String(formData.get("nextCallAt")))
    : null;
  const commercialId = isDirection(user.role)
    ? String(formData.get("commercialId") || "") || null
    : user.role === "COMMERCIAL"
      ? user.id
      : lead.commercialId;
  const apporteurId = isDirection(user.role)
    ? String(formData.get("apporteurId") || "") || null
    : lead.apporteurId;

  let productId = lead.productId;
  const nextProductId = String(formData.get("productId") || "");
  if (nextProductId && nextProductId !== lead.productId) {
    if (!isDirection(user.role)) throw new Error("Produit non modifiable");
    const scopedProductId = await getScopedProductId(user.role);
    if (scopedProductId && nextProductId !== scopedProductId) {
      throw new Error("Produit hors périmètre");
    }
    const product = await prisma.product.findFirst({
      where: orgWhere(orgId, { id: nextProductId, active: true }),
    });
    if (!product) throw new Error("Produit invalide");
    productId = product.id;
  }

  const changes = [
    diffScalar("companyName", lead.companyName, companyName),
    diffScalar("contactName", lead.contactName, contactName),
    diffScalar("email", lead.email, email),
    diffScalar("phone", lead.phone, phone),
    diffScalar("website", lead.website, website),
    diffScalar("source", lead.source, source),
    diffScalar("estimatedValue", lead.estimatedValue, estimatedValue),
    diffScalar("commercialId", lead.commercialId, commercialId),
    diffScalar("apporteurId", lead.apporteurId, apporteurId),
    diffScalar("productId", lead.productId, productId),
  ].filter(Boolean) as { field: string; oldValue: string | null; newValue: string | null }[];

  const updatedProduct =
    productId !== lead.productId
      ? await prisma.product.findFirst({ where: orgWhere(orgId, { id: productId }) })
      : leadFull.product;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      companyName,
      contactName,
      email,
      phone,
      website,
      source,
      estimatedValue,
      nextCallAt,
      commercialId,
      apporteurId,
      productId,
      customData: nextCustom,
    },
  });

  await syncLeadInterests(
    leadId,
    nextCustom as Record<string, unknown>,
    updatedProduct?.slug ?? leadFull.product.slug
  );
  await syncDealLinesFromQualification(
    leadId,
    nextCustom as Record<string, unknown>
  );
  await recordFieldChanges({
    entity: "Lead",
    entityId: leadId,
    userId: user.id,
    changes,
  });

  await prisma.activity.create({
    data: {
      organizationId: orgId,
      leadId,
      userId: user.id,
      type: "NOTE",
      note: `Fiche mise à jour par ${user.fullName}`,
    },
  });

  revalidateCrm({ leadId });
  redirect(`/leads/${leadId}?saved=1`);
}

export async function addActivity(leadId: string, formData: FormData) {
  const user = await requireUser();
  const orgId = await requireOrg();
  const lead = await assertLeadAccess(user, leadId, { requireEdit: true });
  const type = String(formData.get("type") || "NOTE") as ActivityType;
  const allowed: ActivityType[] = [
    "NOTE",
    "APPEL",
    "EMAIL",
    "RDV",
    "STATUT",
    "SYSTEM",
  ];
  if (!allowed.includes(type)) throw new Error("Type d'activité invalide");
  const note = String(formData.get("note") || "").trim().slice(0, 4000);
  if (!note) throw new Error("Note requise");

  await prisma.activity.create({
    data: { organizationId: orgId, leadId, userId: user.id, type, note },
  });

  const nextCallAt = formData.get("nextCallAt");
  const patch: { nextCallAt?: Date; status?: LeadStatus } = {};
  if (nextCallAt) patch.nextCallAt = new Date(String(nextCallAt));
  if (type === "RDV") {
    if (["NOUVEAU", "CONTACTE", "QUALIFIE"].includes(lead.status)) {
      patch.status = "RDV_PLANIFIE";
    }
  } else if (type === "APPEL") {
    if (lead.status === "NOUVEAU") patch.status = "CONTACTE";
  }

  if (Object.keys(patch).length) {
    await prisma.lead.update({ where: { id: leadId }, data: patch });
  }

  revalidateCrm({ leadId });
}

export async function deleteLead(leadId: string) {
  const user = await requireUser();
  const orgId = await requireOrg();
  if (!isDirection(user.role)) throw new Error("Accès refusé");
  await assertLeadAccess(user, leadId, { requireEdit: true });

  await prisma.activity.deleteMany({ where: orgWhere(orgId, { leadId }) });
  await prisma.leadInterest.deleteMany({ where: orgWhere(orgId, { leadId }) });
  await prisma.opportunity.deleteMany({ where: orgWhere(orgId, { leadId }) });
  await prisma.commission.updateMany({
    where: orgWhere(orgId, { leadId }),
    data: { leadId: null },
  });
  await prisma.task.deleteMany({ where: orgWhere(orgId, { leadId }) });
  await prisma.lead.delete({ where: { id: leadId } });
  revalidateCrm({ leadId });
  redirect("/leads");
}
