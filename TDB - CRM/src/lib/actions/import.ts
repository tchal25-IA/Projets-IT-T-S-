"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { isFullAccess, normalizeEmail, normalizeWebsite } from "@/lib/utils";
import { requireUser, notify, revalidateCrm } from "@/lib/actions/helpers";
import { syncLeadInterests } from "@/lib/interests";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { requireOrg, orgWhere } from "@/lib/tenant";
import { 
  validateImportFile, 
  validateImportRow, 
  sanitizeObject 
} from "@/lib/import-helpers";

export async function importLeads(formData: FormData) {
  const user = await requireUser();
  if (!isFullAccess(user.role)) throw new Error("Accès refusé");

  const productId = String(formData.get("productId") || "");
  const file = formData.get("file") as File | null;
  if (!productId || !file) throw new Error("Fichier et produit requis");

  // Validate file before processing
  const fileValidation = validateImportFile(file);
  if (!fileValidation.ok) {
    throw new Error(fileValidation.error || "Fichier invalide");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Produit introuvable");

  const buffer = Buffer.from(await file.arrayBuffer());
  const MAX_ROWS = 2000;

  const name = file.name.toLowerCase();
  let rows: unknown[] = [];

  try {
    if (name.endsWith(".csv")) {
      const text = buffer.toString("utf-8");
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data;
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      // Parse Excel with safety options
      const wb = XLSX.read(buffer, { 
        type: "buffer",
        // Security: disable VBA macros and external links
        bookVBA: false,
        // Limit cells to prevent memory exhaustion
        sheetRows: MAX_ROWS + 1,
      });
      
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error("Aucune feuille trouvée dans le fichier Excel");
      }
      
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) {
        throw new Error("Impossible de lire la première feuille");
      }
      
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else {
      throw new Error("Format non supporté (CSV ou Excel)");
    }
  } catch (error) {
    // Log error for debugging but don't expose internal details to user
    console.error("Import parsing error:", error);
    throw new Error(
      "Erreur lors de la lecture du fichier. Vérifiez le format et réessayez."
    );
  }

  // Sanitize all rows to prevent prototype pollution
  rows = rows.map((row) => sanitizeObject(row));

  if (rows.length > MAX_ROWS) {
    throw new Error(`Trop de lignes (max. ${MAX_ROWS})`);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date();

  for (let i = 0; i < rows.length; i++) {
    const validatedRow = validateImportRow(rows[i]);
    if (!validatedRow) {
      skipped++;
      continue;
    }

    const { companyName, data: row } = validatedRow;

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
      String(row.phone || row.telephone || row.tel || "").trim().slice(0, 50) || null;
    const contactName =
      String(row.contactName || row.contact || row.prenom || "").trim().slice(0, 100) ||
      null;

    let existing = null as Awaited<ReturnType<typeof prisma.lead.findFirst>>;
    if (email) {
      existing = await prisma.lead.findFirst({
        where: orgWhere(orgId, {
          productId,
          email: { equals: email, mode: "insensitive" },
        }),
      });
    }
    if (!existing && website) {
      existing = await prisma.lead.findFirst({
        where: orgWhere(orgId, {
          productId,
          OR: [
            { website: { equals: website, mode: "insensitive" } },
            { website: { equals: `www.${website}`, mode: "insensitive" } },
            { website: { contains: website, mode: "insensitive" } },
          ],
        }),
      });
    }
    if (!existing) {
      existing = await prisma.lead.findFirst({
        where: orgWhere(orgId, {
          productId,
          companyName: {
            equals: companyName,
            mode: "insensitive",
          },
        }),
      });
    }

    const slug = product.slug;
    const importExtras: Record<string, unknown> = {};
    
    // Safely extract and limit import metadata
    if (row.pays) importExtras.pays = String(row.pays).slice(0, 100);
    if (row.score_opportunite || row.score) {
      const scoreValue = Number(row.score_opportunite || row.score);
      if (!isNaN(scoreValue) && isFinite(scoreValue)) {
        importExtras.score_opportunite = Math.max(0, Math.min(100, scoreValue));
      }
    }
    if (row.besoins) importExtras.besoins = String(row.besoins).slice(0, 500);
    if (row.calendly_detecte) {
      const calendlyValue = String(row.calendly_detecte).toLowerCase();
      importExtras.calendly_detecte = calendlyValue === "true" || calendlyValue === "oui";
    }

    if (existing) {
      const prevCustom = (existing.customData ?? {}) as Record<string, unknown>;
      const prevBlock =
        (prevCustom[slug] as Record<string, unknown> | undefined) ?? {};
      const nextCustom = {
        ...prevCustom,
        [slug]: { ...prevBlock, ...importExtras },
        lastImportFile: file.name.slice(0, 255),
      };

      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          companyName: companyName.slice(0, 200),
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
          organizationId: orgId,
          leadId: existing.id,
          userId: user.id,
          type: "IMPORT",
          note: `Réimport ${now.toISOString().slice(0, 10)} par ${user.fullName} depuis ${file.name.slice(0, 100)}`,
        },
      });
      updated++;
      continue;
    }

    const customData = {
      [slug]: importExtras,
      lastImportFile: file.name.slice(0, 255),
    };

    const lead = await prisma.lead.create({
      data: {
        organizationId: orgId,
        companyName: companyName.slice(0, 200),
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
        organizationId: orgId,
        leadId: lead.id,
        userId: user.id,
        type: "IMPORT",
        note: `Premier import ${now.toISOString().slice(0, 10)} par ${user.fullName} depuis ${file.name.slice(0, 100)}`,
      },
    });
    created++;
  }

  const commercials = await prisma.user.findMany({
    where: orgWhere(orgId, { role: "COMMERCIAL", active: true }),
  });
  for (const c of commercials) {
    await notify(
      c.id,
      "Import leads terminé",
      `${created} créé(s), ${updated} mis à jour, ${skipped} ignoré(s) — ${file.name.slice(0, 100)}`,
      "/leads"
    );
  }

  revalidateCrm();
  revalidatePath("/import");
  return { created, updated, skipped };
}
