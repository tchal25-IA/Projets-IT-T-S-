#!/usr/bin/env tsx
/**
 * Upsert catalogue (produits + prestations) sans vider la base.
 * Usage: npx tsx scripts/ensure-catalog.ts
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { VITRINEFLASH_FIELDS, BOOKFLOW_FIELDS } from "../src/lib/fields";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const vf = await prisma.product.upsert({
    where: { slug: "vitrineflash" },
    create: {
      slug: "vitrineflash",
      name: "VitrineFlash",
      description: "Création / reprise / modification de sites web",
      fieldSchema: VITRINEFLASH_FIELDS,
      sortOrder: 0,
    },
    update: {
      fieldSchema: VITRINEFLASH_FIELDS,
      sortOrder: 0,
      active: true,
    },
  });

  const bf = await prisma.product.upsert({
    where: { slug: "bookflow" },
    create: {
      slug: "bookflow",
      name: "Bookflow",
      description: "Prise de RDV",
      fieldSchema: BOOKFLOW_FIELDS,
      sortOrder: 1,
    },
    update: {
      fieldSchema: BOOKFLOW_FIELDS,
      sortOrder: 1,
      active: true,
    },
  });

  const offerings = [
    {
      productId: vf.id,
      name: "Site vitrine one-shot",
      code: "VF-SITE",
      kind: "ONE_SHOT" as const,
      amountHt: 1500,
      billingPeriod: "NONE" as const,
      sortOrder: 0,
    },
    {
      productId: vf.id,
      name: "Maintenance Essentiel",
      code: "VF-MAINT-E",
      kind: "MAINTENANCE" as const,
      amountHt: 49,
      billingPeriod: "MONTHLY" as const,
      sortOrder: 1,
    },
    {
      productId: vf.id,
      name: "Maintenance Pro",
      code: "VF-MAINT-P",
      kind: "MAINTENANCE" as const,
      amountHt: 99,
      billingPeriod: "MONTHLY" as const,
      sortOrder: 2,
    },
    {
      productId: bf.id,
      name: "Bookflow Starter",
      code: "BF-START",
      kind: "SUBSCRIPTION" as const,
      amountHt: 29,
      billingPeriod: "MONTHLY" as const,
      sortOrder: 0,
    },
    {
      productId: bf.id,
      name: "Bookflow Pro",
      code: "BF-PRO",
      kind: "SUBSCRIPTION" as const,
      amountHt: 79,
      billingPeriod: "MONTHLY" as const,
      sortOrder: 1,
    },
    {
      productId: bf.id,
      name: "Bookflow Business",
      code: "BF-BIZ",
      kind: "SUBSCRIPTION" as const,
      amountHt: 149,
      billingPeriod: "MONTHLY" as const,
      sortOrder: 2,
    },
  ];

  for (const o of offerings) {
    const existing = await prisma.productOffering.findFirst({
      where: { productId: o.productId, code: o.code },
    });
    if (existing) {
      await prisma.productOffering.update({
        where: { id: existing.id },
        data: {
          name: o.name,
          kind: o.kind,
          amountHt: o.amountHt,
          billingPeriod: o.billingPeriod,
          sortOrder: o.sortOrder,
          active: true,
        },
      });
    } else {
      await prisma.productOffering.create({ data: o });
    }
  }

  console.log("Catalogue synchronisé (VF + Bookflow + prestations)");

  await prisma.commissionRule.upsert({
    where: { roleKey: "APPORTEUR" },
    create: {
      roleKey: "APPORTEUR",
      label: "Apporteur d'affaires",
      ratePercent: 10,
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.commissionRule.upsert({
    where: { roleKey: "COMMERCIAL" },
    create: {
      roleKey: "COMMERCIAL",
      label: "Commercial (close)",
      ratePercent: 15,
      sortOrder: 1,
    },
    update: {},
  });
  console.log("Règles de commission OK");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
