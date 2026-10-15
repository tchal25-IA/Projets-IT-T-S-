import { prisma } from "@/lib/db";
import type {
  BillingStatus,
  AccountStatus,
  LeadStatus,
  Prisma,
} from "@/generated/prisma/client";
import {
  BILLING_LABELS,
  ACCOUNT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/utils";
import { requireOrg } from "@/lib/tenant";

export type CompanySettings = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  siret: string;
  vatNumber: string;
  currency: string;
};

export const DEFAULT_COMPANY: CompanySettings = {
  name: "T&S",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  siret: "",
  vatNumber: "",
  currency: "EUR",
};

export const DEFAULT_LEAD_SOURCES = [
  "Manuel",
  "Apporteur",
  "Import",
  "Site web",
  "Salon",
  "Reco",
  "LinkedIn",
  "Autre",
];

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const orgId = await requireOrg();
  const row = await prisma.crmSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key } },
  });
  if (!row) return fallback;
  return row.value as T;
}

export async function setSetting(key: string, value: unknown) {
  const orgId = await requireOrg();
  const json = value as Prisma.InputJsonValue;
  await prisma.crmSetting.upsert({
    where: { organizationId_key: { organizationId: orgId, key } },
    create: { organizationId: orgId, key, value: json },
    update: { value: json },
  });
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const raw = await getSetting<Partial<CompanySettings>>("company", {});
  return { ...DEFAULT_COMPANY, ...raw };
}

export async function getLeadSources(): Promise<string[]> {
  const sources = await getSetting<string[]>(
    "lead.sources",
    DEFAULT_LEAD_SOURCES
  );
  return Array.isArray(sources) && sources.length
    ? sources
    : DEFAULT_LEAD_SOURCES;
}

export async function getLeadStatusLabels(): Promise<
  Record<LeadStatus, string>
> {
  const raw = await getSetting<Partial<Record<LeadStatus, string>>>(
    "labels.leadStatus",
    {}
  );
  return { ...STATUS_LABELS, ...raw };
}

export async function getAccountStatusLabels(): Promise<
  Record<AccountStatus, string>
> {
  const raw = await getSetting<Partial<Record<AccountStatus, string>>>(
    "labels.accountStatus",
    {}
  );
  return { ...ACCOUNT_STATUS_LABELS, ...raw };
}

// Legacy alias for backward compatibility
export const getClientStatusLabels = getAccountStatusLabels;

export async function getBillingStatusLabels(): Promise<
  Record<BillingStatus, string>
> {
  const raw = await getSetting<Partial<Record<BillingStatus, string>>>(
    "labels.billingStatus",
    {}
  );
  return { ...BILLING_LABELS, ...raw };
}

export async function ensureDefaultBusinessSettings() {
  const orgId = await requireOrg();

  const company = await prisma.crmSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key: "company" } },
  });
  if (!company) await setSetting("company", DEFAULT_COMPANY);

  const sources = await prisma.crmSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key: "lead.sources" } },
  });
  if (!sources) await setSetting("lead.sources", DEFAULT_LEAD_SOURCES);

  const leadLabels = await prisma.crmSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key: "labels.leadStatus" } },
  });
  if (!leadLabels) await setSetting("labels.leadStatus", STATUS_LABELS);

  const accountLabels = await prisma.crmSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key: "labels.accountStatus" } },
  });
  if (!accountLabels) {
    await setSetting("labels.accountStatus", ACCOUNT_STATUS_LABELS);
  }

  const billingLabels = await prisma.crmSetting.findUnique({
    where: { organizationId_key: { organizationId: orgId, key: "labels.billingStatus" } },
  });
  if (!billingLabels) await setSetting("labels.billingStatus", BILLING_LABELS);
}
