import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

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
  const sources = await getSetting<string[]>("lead.sources", DEFAULT_LEAD_SOURCES);
  return Array.isArray(sources) && sources.length ? sources : DEFAULT_LEAD_SOURCES;
}

export async function ensureDefaultBusinessSettings() {
  const company = await prisma.crmSetting.findUnique({ where: { key: "company" } });
  if (!company) {
    await setSetting("company", DEFAULT_COMPANY);
  }
  const sources = await prisma.crmSetting.findUnique({ where: { key: "lead.sources" } });
  if (!sources) {
    await setSetting("lead.sources", DEFAULT_LEAD_SOURCES);
  }
}
