import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { PipelineBoard } from "@/components/pipeline-board";
import { isDirection } from "@/lib/utils";

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "COMMERCIAL" && !isDirection(session.user.role)) {
    redirect("/dashboard");
  }

  const productId = await getScopedProductId(session.user.role);
  const leads = await prisma.lead.findMany({
    where: leadVisibilityWhere(session.user.id, session.user.role, { productId }),
    include: {
      product: { select: { name: true, slug: true } },
      commercial: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Glissez-déposez les cartes pour changer le statut"
      />
      <PipelineBoard leads={leads} />
    </div>
  );
}
