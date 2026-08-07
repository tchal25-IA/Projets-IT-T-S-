import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k.trim(), rest.join("=")];
    })
  ) as Record<string, string>;
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  // Rejet si timestamp trop vieux (> 5 min)
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

  if (!stripeEnabled) {
    return NextResponse.json({
      received: true,
      mode: "disabled",
      hint: "STRIPE_SECRET_KEY non défini",
    });
  }

  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET requis" },
      { status: 500 }
    );
  }

  if (!verifyStripeSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    type?: string;
    data?: { object?: { metadata?: { dealLineId?: string }; id?: string } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const dealLineId = event.data?.object?.metadata?.dealLineId;
    const sessionId = event.data?.object?.id;
    if (dealLineId) {
      const line = await prisma.dealLine.update({
        where: { id: dealLineId },
        data: {
          billingStatus: "PAYE",
          paidAt: new Date(),
          stripeSessionId: sessionId ?? undefined,
        },
      });
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/facturation");
      revalidatePath("/dashboard");
      if (line.leadId) revalidatePath(`/leads/${line.leadId}`);
      if (line.clientId) revalidatePath(`/clients/${line.clientId}`);
    }
  }

  return NextResponse.json({ received: true });
}
