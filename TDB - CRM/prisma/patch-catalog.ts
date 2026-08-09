/**
 * Mise à jour non destructive : schema push déjà fait.
 * - Met à jour fieldSchema des produits VF/BF (optionsFrom offerings)
 * - Crée les offerings manquants par code
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { VITRINEFLASH_FIELDS, BOOKFLOW_FIELDS } from "../src/lib/fields";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const vf = await prisma.product.findUnique({ where: { slug: "vitrineflash" } });
  const bf = await prisma.product.findUnique({ where: { slug: "bookflow" } });

  if (vf) {
    await prisma.product.update({
      where: { id: vf.id },
      data: {
        fieldSchema: VITRINEFLASH_FIELDS,
        sortOrder: 0,
      },
    });
    const existing = await prisma.productOffering.findMany({
      where: { productId: vf.id },
    });
    const codes = new Set(existing.map((o) => o.code).filter(Boolean));
    const toCreate = [
      {
        name: "Site vitrine — Création",
        code: "VF-CREATE",
        kind: "ONE_SHOT" as const,
        amountHt: 1490,
        billingPeriod: "NONE" as const,
        sortOrder: 0,
      },
      {
        name: "Site vitrine — Reprise",
        code: "VF-REPRISE",
        kind: "ONE_SHOT" as const,
        amountHt: 990,
        billingPeriod: "NONE" as const,
        sortOrder: 1,
      },
      {
        name: "Maintenance 12 mois",
        code: "VF-MAINT-12",
        kind: "MAINTENANCE" as const,
        amountHt: 348,
        billingPeriod: "YEARLY" as const,
        sortOrder: 2,
      },
      {
        name: "Maintenance mensuelle",
        code: "VF-MAINT-M",
        kind: "MAINTENANCE" as const,
        amountHt: 39,
        billingPeriod: "MONTHLY" as const,
        sortOrder: 3,
      },
    ].filter((o) => !codes.has(o.code));
    if (toCreate.length) {
      await prisma.productOffering.createMany({
        data: toCreate.map((o) => ({ ...o, productId: vf.id })),
      });
    }
  }

  if (bf) {
    await prisma.product.update({
      where: { id: bf.id },
      data: {
        fieldSchema: BOOKFLOW_FIELDS,
        sortOrder: 1,
      },
    });
    const existing = await prisma.productOffering.findMany({
      where: { productId: bf.id },
    });
    const codes = new Set(existing.map((o) => o.code).filter(Boolean));
    const toCreate = [
      {
        name: "Bookflow Starter",
        code: "BF-START",
        kind: "SUBSCRIPTION" as const,
        amountHt: 19,
        billingPeriod: "MONTHLY" as const,
        sortOrder: 0,
      },
      {
        name: "Bookflow Pro",
        code: "BF-PRO",
        kind: "SUBSCRIPTION" as const,
        amountHt: 348,
        billingPeriod: "YEARLY" as const,
        sortOrder: 1,
      },
      {
        name: "Bookflow Business",
        code: "BF-BIZ",
        kind: "SUBSCRIPTION" as const,
        amountHt: 59,
        billingPeriod: "MONTHLY" as const,
        sortOrder: 2,
      },
    ].filter((o) => !codes.has(o.code));
    if (toCreate.length) {
      await prisma.productOffering.createMany({
        data: toCreate.map((o) => ({ ...o, productId: bf.id })),
      });
    }
  }

  console.log("Catalog patch OK");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
