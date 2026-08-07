import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadVisibilityWhere, clientVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const productId = await getScopedProductId(session.user.role);
  const leadWhere = leadVisibilityWhere(session.user.id, session.user.role, {
    productId,
  });
  const clientWhere = clientVisibilityWhere(session.user.id, session.user.role, {
    productId,
  });

  const [leads, clients] = await Promise.all([
    prisma.lead.findMany({
      where: {
        AND: [
          leadWhere,
          {
            OR: [
              { companyName: { contains: q, mode: "insensitive" } },
              { contactName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { website: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      include: { product: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({
      where: {
        AND: [
          clientWhere,
          {
            OR: [
              { companyName: { contains: q, mode: "insensitive" } },
              { contactName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json([
    ...leads.map((l) => ({
      id: l.id,
      type: "lead" as const,
      title: l.companyName,
      subtitle: `${l.product.name} · ${l.email ?? l.phone ?? "—"}`,
      href: `/leads/${l.id}`,
    })),
    ...clients.map((c) => ({
      id: c.id,
      type: "client" as const,
      title: c.companyName,
      subtitle: c.email ?? c.phone ?? "Client",
      href: `/clients/${c.id}`,
    })),
  ]);
}
