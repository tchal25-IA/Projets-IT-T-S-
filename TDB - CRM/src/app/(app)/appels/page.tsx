import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { addActivity, updateLeadStatus } from "@/lib/actions";
import { leadVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Textarea,
  Select,
  Input,
} from "@/components/ui";
import { ScoreBadge } from "@/components/score-badge";
import {
  STATUS_LABELS,
  formatDateTime,
  isDirection,
  CALL_QUEUE_STATUSES,
} from "@/lib/utils";
import { computeLeadScore } from "@/lib/scoring";
import type { LeadStatus } from "@/generated/prisma/client";

export default async function AppelsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "COMMERCIAL" && !isDirection(session.user.role)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const focus = sp.mode === "focus";

  const productId = await getScopedProductId(session.user.role);
  const baseWhere = leadVisibilityWhere(session.user.id, session.user.role, {
    productId,
  });

  const where = {
    ...baseWhere,
    status: { in: CALL_QUEUE_STATUSES },
  };

  const rawLeads = await prisma.lead.findMany({
    where,
    include: { product: true, interests: true },
  });

  const leads = rawLeads
    .map((l) => ({ ...l, score: computeLeadScore(l) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.nextCallAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const tb = b.nextCallAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

  const todayCalls = await prisma.activity.count({
    where: {
      type: "APPEL",
      userId: session.user.role === "COMMERCIAL" ? session.user.id : undefined,
      lead: baseWhere,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const rdvPoses = await prisma.activity.count({
    where: {
      type: "RDV",
      userId: session.user.role === "COMMERCIAL" ? session.user.id : undefined,
      lead: baseWhere,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  return (
    <div className={focus ? "mx-auto max-w-xl" : undefined}>
      <PageHeader
        title={focus ? "Mode focus — Appels" : "File d'appels"}
        subtitle={`${leads.length} leads · triés par score · ${todayCalls} appels · ${rdvPoses} RDV`}
        actions={
          focus ? (
            <Link href="/appels">
              <Button variant="secondary">Quitter focus</Button>
            </Link>
          ) : (
            <Link href="/appels?mode=focus">
              <Button variant="secondary">Mode focus mobile</Button>
            </Link>
          )
        }
      />

      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} className={focus ? "border-teal-800/30" : undefined}>
            <div
              className={`flex flex-col gap-4 ${
                focus ? "" : "lg:flex-row lg:items-start lg:justify-between"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-lg font-semibold text-teal-900 hover:underline"
                  >
                    {lead.companyName}
                  </Link>
                  <ScoreBadge score={lead.score} />
                  <Badge>{STATUS_LABELS[lead.status]}</Badge>
                  <Badge tone="info">{lead.product.name}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {lead.contactName ?? "Sans contact"} ·{" "}
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-teal-800 underline">
                      {lead.phone}
                    </a>
                  ) : (
                    "Pas de téléphone"
                  )}{" "}
                  · {lead.email ?? "—"}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Prochain rappel : {formatDateTime(lead.nextCallAt)}
                </p>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  await addActivity(lead.id, formData);
                  const nextStatus = String(formData.get("nextStatus") || "");
                  if (nextStatus) {
                    await updateLeadStatus(lead.id, nextStatus as LeadStatus);
                  }
                }}
                className={`w-full space-y-2 ${focus ? "" : "max-w-md"}`}
              >
                <Select name="type" defaultValue="APPEL">
                  <option value="APPEL">Appel</option>
                  <option value="RDV">RDV</option>
                  <option value="NOTE">Note</option>
                </Select>
                <Textarea
                  name="note"
                  rows={focus ? 3 : 2}
                  placeholder="Compte-rendu d'appel…"
                  required
                />
                <div className={`grid gap-2 ${focus ? "grid-cols-1" : "grid-cols-2"}`}>
                  <Input name="nextCallAt" type="datetime-local" />
                  <Select name="nextStatus" defaultValue="">
                    <option value="">Garder le statut</option>
                    <option value="CONTACTE">→ Contacté</option>
                    <option value="QUALIFIE">→ Qualifié</option>
                    <option value="RDV_PLANIFIE">→ RDV planifié</option>
                    <option value="PROPOSITION">→ Proposition</option>
                    <option value="PERDU">→ Perdu</option>
                  </Select>
                </div>
                <Button type="submit" className={focus ? "w-full" : undefined}>
                  Enregistrer l&apos;appel
                </Button>
              </form>
            </div>
          </Card>
        ))}
        {leads.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-500">Aucun lead dans la file.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
