import { prisma } from "@/lib/db";
import type {
  BillingStatus,
  ClientStatus,
  LeadStatus,
  Prisma,
} from "@/generated/prisma/client";
import {
  BILLING_LABELS,
  CLIENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/utils";

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
  const row = await prisma.crmSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

export async function setSetting(key: string, value: unknown) {
  const json = value as Prisma.InputJsonValue;
  await prisma.crmSetting.upsert({
    where: { key },
    create: { key, value: json },
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

export async function getClientStatusLabels(): Promise<
  Record<ClientStatus, string>
> {
  const raw = await getSetting<Partial<Record<ClientStatus, string>>>(
    "labels.clientStatus",
    {}
  );
  return { ...CLIENT_STATUS_LABELS, ...raw };
}

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
  const company = await prisma.crmSetting.findUnique({
    where: { key: "company" },
  });
  if (!company) await setSetting("company", DEFAULT_COMPANY);

  const sources = await prisma.crmSetting.findUnique({
    where: { key: "lead.sources" },
  });
  if (!sources) await setSetting("lead.sources", DEFAULT_LEAD_SOURCES);

  const leadLabels = await prisma.crmSetting.findUnique({
    where: { key: "labels.leadStatus" },
  });
  if (!leadLabels) await setSetting("labels.leadStatus", STATUS_LABELS);

  const clientLabels = await prisma.crmSetting.findUnique({
    where: { key: "labels.clientStatus" },
  });
  if (!clientLabels) {
    await setSetting("labels.clientStatus", CLIENT_STATUS_LABELS);
  }

  const billingLabels = await prisma.crmSetting.findUnique({
    where: { key: "labels.billingStatus" },
  });
  if (!billingLabels) await setSetting("labels.billingStatus", BILLING_LABELS);
}
