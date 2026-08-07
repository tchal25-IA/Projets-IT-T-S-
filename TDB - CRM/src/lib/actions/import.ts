"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { isFullAccess, normalizeEmail, normalizeWebsite } from "@/lib/utils";
import { requireUser, notify, revalidateCrm } from "@/lib/actions/helpers";
import { syncLeadInterests } from "@/lib/interests";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function importLeads(formData: FormData) {
  const user = await requireUser();
  if (!isFullAccess(user.role)) throw new Error("Accès refusé");

  const productId = String(formData.get("productId") || "");
  const file = formData.get("file") as File | null;
  if (!productId || !file) throw new Error("Fichier et produit requis");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Produit introuvable");

  const buffer = Buffer.from(await file.arrayBuffer());
  const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
  const MAX_ROWS = 2000;
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Fichier trop volumineux (max. 2 Mo)");
  }

  const name = file.name.toLowerCase();
  let rows: Record<string, string>[] = [];

  if (name.endsWith(".csv")) {
    const text = buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    rows = parsed.data;
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<
      string,
      string
    >[];
  } else {
    throw new Error("Format non supporté (CSV ou Excel)");
  }

  if (rows.length > MAX_ROWS) {
    throw new Error(`Trop de lignes (max. ${MAX_ROWS})`);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date();

  for (const row of rows) {
    const companyName =
      row.companyName ||
      row.entreprise ||
      row.societe ||
      row.company ||
      row.nom ||
      "";
    if (!String(companyName).trim()) {
      skipped++;
      continue;
    }

    const email = normalizeEmail(String(row.email || "")) || null;
    const website =
      normalizeWebsite(
        String(
          row.website ||
            row.site_web ||
            row.site ||
            row.url ||
            row.urlActuelle ||
            ""
        )
      ) || null;
    const phone =
      String(row.phone || row.telephone || row.tel || "").trim() || null;
    const contactName =
      String(row.contactName || row.contact || row.prenom || "").trim() ||
      null;

    let existing = null as Awaited<ReturnType<typeof prisma.lead.findFirst>>;
    if (email) {
      existing = await prisma.lead.findFirst({
        where: {
          productId,
          email: { equals: email, mode: "insensitive" },
        },
      });
    }
    if (!existing && website) {
      existing = await prisma.lead.findFirst({
        where: {
          productId,
          OR: [
            { website: { equals: website, mode: "insensitive" } },
            { website: { equals: `www.${website}`, mode: "insensitive" } },
            { website: { contains: website, mode: "insensitive" } },
          ],
        },
      });
    }
    if (!existing) {
      existing = await prisma.lead.findFirst({
        where: {
          productId,
          companyName: {
            equals: String(companyName).trim(),
            mode: "insensitive",
          },
        },
      });
    }

    const slug = product.slug as "vitrineflash" | "bookflow";
    const importExtras: Record<string, unknown> = {};
    if (row.pays) importExtras.pays = String(row.pays);
    if (row.score_opportunite || row.score)
      importExtras.score_opportunite = Number(
        row.score_opportunite || row.score
      );
    if (row.besoins) importExtras.besoins = String(row.besoins);
    if (row.calendly_detecte)
      importExtras.calendly_detecte =
        String(row.calendly_detecte).toLowerCase() === "true" ||
        String(row.calendly_detecte).toLowerCase() === "oui";

    if (existing) {
      const prevCustom = (existing.customData ?? {}) as Record<string, unknown>;
      const prevBlock =
        (prevCustom[slug] as Record<string, unknown> | undefined) ?? {};
      const nextCustom = {
        ...prevCustom,
        [slug]: { ...prevBlock, ...importExtras },
        lastImportFile: file.name,
      };

      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          companyName: String(companyName).trim(),
          contactName: contactName ?? existing.contactName,
          email: email ?? existing.email,
          phone: phone ?? existing.phone,
          website: website ?? existing.website,
          lastImportedAt: now,
          importedAt: existing.importedAt ?? existing.createdAt,
          customData: nextCustom as Prisma.InputJsonValue,
          source: existing.source || "Import CSV/Excel",
        },
      });
      await syncLeadInterests(existing.id, nextCustom, slug);
      await prisma.activity.create({
        data: {
          leadId: existing.id,
          userId: user.id,
          type: "IMPORT",
          note: `Réimport ${now.toISOString().slice(0, 10)} par ${user.fullName} depuis ${file.name}`,
        },
      });
      updated++;
      continue;
    }

    const customData = {
      [slug]: importExtras,
      lastImportFile: file.name,
    };

    const lead = await prisma.lead.create({
      data: {
        companyName: String(companyName).trim(),
        contactName,
        email,
        phone,
        website,
        source: "Import CSV/Excel",
        productId,
        status: "NOUVEAU",
        customData: customData as Prisma.InputJsonValue,
        importedAt: now,
        lastImportedAt: now,
      },
    });
    await syncLeadInterests(lead.id, customData, slug);
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: user.id,
        type: "IMPORT",
        note: `Premier import ${now.toISOString().slice(0, 10)} par ${user.fullName} depuis ${file.name}`,
      },
    });
    created++;
  }

  const commercials = await prisma.user.findMany({
    where: { role: "COMMERCIAL", active: true },
  });
  for (const c of commercials) {
    await notify(
      c.id,
      "Import leads terminé",
      `${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s) — ${file.name}`,
      "/leads"
    );
  }

  revalidateCrm();
  revalidatePath("/import");
  return { created, updated, skipped };
}
