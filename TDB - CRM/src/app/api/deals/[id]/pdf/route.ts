import { auth } from "@/lib/auth";
import { assertDealLineAccess } from "@/lib/access";
import { buildSimplePdf, dealLinesToPdfLines } from "@/lib/pdf";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const line = await assertDealLineAccess(session.user, id);
    const company =
      line.client?.companyName ?? line.lead?.companyName ?? "Client";
    const pdf = buildSimplePdf(
      dealLinesToPdfLines({
        title: line.billingStatus === "DEVIS" ? "DEVIS" : "FACTURE",
        company,
        invoiceNumber: line.invoiceNumber,
        lines: [
          {
            label: line.label,
            amountHt: line.amountHt,
            billingStatus: line.billingStatus,
          },
        ],
      })
    );

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ts-${line.id.slice(-8)}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
