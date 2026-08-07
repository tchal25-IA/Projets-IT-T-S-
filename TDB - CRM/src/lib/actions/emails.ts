"use server";

import { requireUser, revalidateCrm } from "@/lib/actions/helpers";
import { assertLeadAccess } from "@/lib/access";
import {
  sendCrmEmail,
  templateDevis,
  templateRelance,
  templateCloseConfirm,
} from "@/lib/email";
import { formatEuro } from "@/lib/utils";
import { prisma } from "@/lib/db";

export async function sendLeadEmail(
  leadId: string,
  kind: "devis" | "relance" | "close"
) {
  const user = await requireUser();
  if (!["devis", "relance", "close"].includes(kind)) {
    throw new Error("Type d'email invalide");
  }

  const lead = await assertLeadAccess(user, leadId, { requireEdit: true });
  if (!lead.email) throw new Error("Lead sans email");

  const lines = await prisma.dealLine.findMany({ where: { leadId } });
  const total = lines.reduce((s, l) => s + l.amountHt, 0);
  const tpl =
    kind === "devis"
      ? templateDevis(lead.companyName, formatEuro(total))
      : kind === "relance"
        ? templateRelance(lead.companyName)
        : templateCloseConfirm(lead.companyName);

  await sendCrmEmail({
    to: lead.email,
    subject: tpl.subject,
    html: tpl.html,
    leadId,
    userId: user.id,
  });

  revalidateCrm({ leadId });
}
