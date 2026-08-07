import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { leadVisibilityWhere } from "@/lib/permissions";
import { getScopedProductId } from "@/lib/scope";
import { saveLeadView } from "@/lib/actions";
import { PageHeader, Badge, Button, Card, Input } from "@/components/ui";
import { ScoreBadge } from "@/components/score-badge";
import {
  STATUS_LABELS,
  formatEuro,
  formatDate,
  isDirection,
} from "@/lib/utils";
import { computeLeadScore } from "@/lib/scoring";
import {
  SYSTEM_VIEWS,
  systemViewWhere,
  parseSavedFilters,
  type SystemViewId,
} from "@/lib/list-views";
import type { Prisma } from "@/generated/prisma/client";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    product?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = await searchParams;
  const productId = await getScopedProductId(session.user.role);
  const view = (sp.view ?? "all") as string;

  const savedViews = await prisma.savedView.findMany({
    where: {
      entity: "LEAD",
      OR: [{ userId: session.user.id }, { isShared: true }],
    },
    orderBy: { name: "asc" },
  });

  const saved = savedViews.find((v) => v.id === view);
  const systemId = SYSTEM_VIEWS.some((v) => v.id === view)
    ? (view as SystemViewId)
    : "all";

  const andParts: Prisma.LeadWhereInput[] = [
    leadVisibilityWhere(session.user.id, session.user.role, { productId }),
  ];

  if (saved) {
    andParts.push(parseSavedFilters(saved.filters));
  } else {
    andParts.push(systemViewWhere(systemId, session.user.id));
  }

  if (sp.q) {
    andParts.push({
      OR: [
        { companyName: { contains: sp.q, mode: "insensitive" } },
        { contactName: { contains: sp.q, mode: "insensitive" } },
        { email: { contains: sp.q, mode: "insensitive" } },
      ],
    });
  }
  if (sp.product) andParts.push({ productId: sp.product });
  if (sp.status) andParts.push({ status: sp.status as never });

  const [leads, products] = await Promise.all([
    prisma.lead.findMany({
      where: { AND: andParts },
      include: {
        product: true,
        commercial: true,
        apporteur: true,
        interests: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({ where: { active: true } }),
  ]);

  const scopedProducts = productId
    ? products.filter((p) => p.id === productId)
    : products;

  const scored = leads
    .map((l) => ({ lead: l, score: computeLeadScore(l) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} lead(s) · vues listes type Salesforce`}
        actions={
          <>
            {(isDirection(session.user.role) ||
              session.user.role === "COMMERCIAL") && (
              <Link href="/leads/new">
                <Button>Nouveau lead</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {SYSTEM_VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/leads?view=${v.id}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              !saved && systemId === v.id
                ? "bg-teal-800 text-white"
                : "border border-stone-200 bg-white text-stone-700"
            }`}
            title={v.description}
          >
            {v.label}
          </Link>
        ))}
        {savedViews.map((v) => (
          <Link
            key={v.id}
            href={`/leads?view=${v.id}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              saved?.id === v.id
                ? "bg-teal-800 text-white"
                : "border border-stone-200 bg-white text-stone-700"
            }`}
          >
            {v.name}
            {v.isShared ? " ·" : ""}
          </Link>
        ))}
      </div>

      <Card className="mb-4">
        <form className="grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="view" value={view} />
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Rechercher…"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            name="product"
            defaultValue={sp.product ?? ""}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Tous produits</option>
            {scopedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Tous statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" className="sm:w-fit">
            Filtrer
          </Button>
        </form>
        <form action={saveLeadView} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
          <Input name="name" placeholder="Nom de la vue" className="max-w-xs" />
          <input type="hidden" name="status" value={sp.status ?? ""} />
          <input type="hidden" name="productId" value={sp.product ?? ""} />
          <input type="hidden" name="q" value={sp.q ?? ""} />
          <label className="flex items-center gap-2 text-xs text-stone-600">
            <input type="checkbox" name="isShared" /> Partagée
          </label>
          <Button type="submit" variant="ghost">
            Enregistrer la vue
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Entreprise</th>
              <th className="px-4 py-3 font-medium">Produit</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Acteurs</th>
              <th className="px-4 py-3 font-medium">Valeur</th>
              <th className="px-4 py-3 font-medium">MAJ</th>
            </tr>
          </thead>
          <tbody>
            {scored.map(({ lead: l, score }) => (
              <tr
                key={l.id}
                className="border-b border-stone-100 hover:bg-stone-50/80"
              >
                <td className="px-4 py-3">
                  <ScoreBadge score={score} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${l.id}`}
                    className="font-medium text-teal-900 hover:underline"
                  >
                    {l.companyName}
                  </Link>
                  <p className="text-xs text-stone-500">{l.contactName}</p>
                  {l.interests.length > 1 ? (
                    <p className="text-[11px] text-teal-700">
                      Multi · {l.interests.map((i) => i.productSlug).join(" + ")}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-stone-600">{l.product.name}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      l.status === "CLOSE"
                        ? "success"
                        : l.status === "PERDU"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {STATUS_LABELS[l.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-stone-600">
                  <div>C: {l.commercial?.fullName ?? "—"}</div>
                  <div>A: {l.apporteur?.fullName ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  {session.user.role === "APPORTEUR"
                    ? "—"
                    : formatEuro(l.estimatedValue)}
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {formatDate(l.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">Aucun lead trouvé.</p>
        ) : null}
      </Card>
    </div>
  );
}
