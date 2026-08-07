import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { safeEqualString } from "@/lib/access";

/**
 * Webhook Bookflow — payload :
 * { leadId?, email?, startsAt?, title? }
 * Header obligatoire : x-bookflow-secret
 */
export async function POST(req: Request) {
  const secret = process.env.BOOKFLOW_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "BOOKFLOW_WEBHOOK_SECRET non configuré" },
      { status: 503 }
    );
  }

  const headerSecret = req.headers.get("x-bookflow-secret") ?? "";
  if (!headerSecret || !safeEqualString(headerSecret, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    leadId?: string;
    email?: string;
    startsAt?: string;
    title?: string;
  };

  let lead = null;
  if (body.leadId && typeof body.leadId === "string") {
    lead = await prisma.lead.findUnique({ where: { id: body.leadId } });
  } else if (body.email && typeof body.email === "string") {
    lead = await prisma.lead.findFirst({
      where: { email: { equals: body.email.trim(), mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const when = body.startsAt ? new Date(body.startsAt) : new Date();
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "startsAt invalide" }, { status: 400 });
  }
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : "RDV Bookflow";

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "RDV",
      note: `${title} — ${when.toLocaleString("fr-FR")} (webhook Bookflow)`,
    },
  });

  const patch: { nextCallAt: Date; status?: "RDV_PLANIFIE" } = {
    nextCallAt: when,
  };
  if (["NOUVEAU", "CONTACTE", "QUALIFIE"].includes(lead.status)) {
    patch.status = "RDV_PLANIFIE";
  }
  await prisma.lead.update({ where: { id: lead.id }, data: patch });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
