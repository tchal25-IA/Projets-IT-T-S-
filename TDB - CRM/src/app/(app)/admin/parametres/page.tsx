import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isFullAccess } from "@/lib/roles";
import { parseFieldSchema } from "@/lib/fields";
import {
  upsertProduct,
  addProductField,
  removeProductField,
  upsertOffering,
  deleteOffering,
  updateProductFieldSchema,
  upsertCommissionRule,
  saveCompanySettings,
  saveLeadSources,
} from "@/lib/actions";
import { Button, Input, Label, Select, Card, Badge } from "@/components/ui";
import Link from "next/link";
import { ensureDefaultCommissionRules } from "@/lib/catalog";
import {
  ensureDefaultBusinessSettings,
  getCompanySettings,
  getLeadSources,
} from "@/lib/business-settings";

const TABS = [
  { id: "entreprise", label: "Entreprise" },
  { id: "sources", label: "Sources leads" },
  { id: "produits", label: "Produits / Services" },
  { id: "prestations", label: "Prestations" },
  { id: "champs", label: "Champs" },
  { id: "commissions", label: "Commissions" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; product?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isFullAccess(session.user.role)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const tab = (TABS.some((t) => t.id === sp.tab) ? sp.tab : "entreprise") as TabId;

  await Promise.all([
    ensureDefaultCommissionRules(),
    ensureDefaultBusinessSettings(),
  ]);

  const [products, commissionRules, company, leadSources] = await Promise.all([
    prisma.product.findMany({
      include: {
        offerings: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
        _count: { select: { leads: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.commissionRule.findMany({ orderBy: { sortOrder: "asc" } }),
    getCompanySettings(),
    getLeadSources(),
  ]);

  const selectedId =
    sp.product && products.some((p) => p.id === sp.product)
      ? sp.product
      : products[0]?.id;
  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-stone-900">Paramètres</h1>
        <p className="mt-1 text-sm text-stone-500">
          Configuration business du CRM : entreprise, sources, catalogue,
          champs de qualification et taux de commission.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/parametres?tab=${t.id}${selectedId ? `&product=${selectedId}` : ""}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-teal-800 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "entreprise" ? (
        <Card className="max-w-2xl space-y-4 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Identité de l&apos;entreprise
          </h2>
          <p className="text-xs text-stone-500">
            Ces informations alimentent les documents, devis et le contexte
            commercial du SaaS.
          </p>
          <form action={saveCompanySettings} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nom commercial</Label>
              <Input name="name" defaultValue={company.name} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Raison sociale</Label>
              <Input name="legalName" defaultValue={company.legalName} />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={company.email} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input name="phone" defaultValue={company.phone} />
            </div>
            <div>
              <Label>Site web</Label>
              <Input name="website" defaultValue={company.website} />
            </div>
            <div>
              <Label>Devise</Label>
              <Input name="currency" defaultValue={company.currency || "EUR"} />
            </div>
            <div className="sm:col-span-2">
              <Label>Adresse</Label>
              <Input name="address" defaultValue={company.address} />
            </div>
            <div>
              <Label>SIRET</Label>
              <Input name="siret" defaultValue={company.siret} />
            </div>
            <div>
              <Label>N° TVA</Label>
              <Input name="vatNumber" defaultValue={company.vatNumber} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Enregistrer l&apos;entreprise</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {tab === "sources" ? (
        <Card className="max-w-xl space-y-4 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Sources de leads
          </h2>
          <p className="text-xs text-stone-500">
            Une source par ligne. Utilisées à la création et à l&apos;édition
            d&apos;un lead.
          </p>
          <form action={saveLeadSources} className="space-y-3">
            <textarea
              name="sources"
              rows={10}
              defaultValue={leadSources.join("\n")}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <Button type="submit">Enregistrer les sources</Button>
          </form>
        </Card>
      ) : null}

      {tab === "produits" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Produits existants
            </h2>
            <ul className="divide-y divide-stone-100">
              {products.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-500">
                      slug: {p.slug} · {p._count.leads} lead(s) ·{" "}
                      {p.offerings.length} prestation(s)
                    </p>
                    {p.description ? (
                      <p className="mt-1 text-sm text-stone-600">{p.description}</p>
                    ) : null}
                  </div>
                  <Badge tone={p.active ? "success" : "neutral"}>
                    {p.active ? "Actif" : "Inactif"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-4 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Nouveau produit / service
            </h2>
            <form action={upsertProduct} className="space-y-3">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input id="name" name="name" required placeholder="Ex. Audit SEO" />
              </div>
              <div>
                <Label htmlFor="slug">Slug (optionnel)</Label>
                <Input id="slug" name="slug" placeholder="auditseo" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="sortOrder">Ordre</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked />
                Actif
              </label>
              <Button type="submit">Créer</Button>
            </form>

            {selected ? (
              <form action={upsertProduct} className="space-y-3 border-t border-stone-100 pt-4">
                <h3 className="text-sm font-semibold text-stone-800">
                  Modifier « {selected.name} »
                </h3>
                <input type="hidden" name="id" value={selected.id} />
                <input type="hidden" name="slug" value={selected.slug} />
                <div>
                  <Label>Nom</Label>
                  <Input name="name" defaultValue={selected.name} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input name="description" defaultValue={selected.description ?? ""} />
                </div>
                <div>
                  <Label>Ordre</Label>
                  <Input
                    name="sortOrder"
                    type="number"
                    defaultValue={selected.sortOrder}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={selected.active} />
                  Actif
                </label>
                <Button type="submit" variant="secondary">
                  Enregistrer
                </Button>
              </form>
            ) : null}
          </Card>
        </div>
      ) : null}

      {tab === "prestations" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/admin/parametres?tab=prestations&product=${p.id}`}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  selectedId === p.id
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-700"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>

          {selected ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-3 p-4">
                <h2 className="text-sm font-semibold text-stone-800">
                  Prestations — {selected.name}
                </h2>
                <ul className="space-y-4">
                  {selected.offerings.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-md border border-stone-100 p-3"
                    >
                      <form action={upsertOffering} className="space-y-2">
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="productId" value={selected.id} />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <Label>Nom</Label>
                            <Input name="name" defaultValue={o.name} required />
                          </div>
                          <div>
                            <Label>Code</Label>
                            <Input name="code" defaultValue={o.code ?? ""} />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select name="kind" defaultValue={o.kind}>
                              <option value="ONE_SHOT">One-shot</option>
                              <option value="SUBSCRIPTION">Abonnement</option>
                              <option value="MAINTENANCE">Maintenance</option>
                              <option value="OTHER">Autre</option>
                            </Select>
                          </div>
                          <div>
                            <Label>Période</Label>
                            <Select name="billingPeriod" defaultValue={o.billingPeriod}>
                              <option value="NONE">Aucune</option>
                              <option value="MONTHLY">Mensuel</option>
                              <option value="YEARLY">Annuel</option>
                            </Select>
                          </div>
                          <div>
                            <Label>Montant HT (€)</Label>
                            <Input
                              name="amountHt"
                              type="number"
                              step="0.01"
                              defaultValue={o.amountHt ?? ""}
                            />
                          </div>
                          <div>
                            <Label>Ordre</Label>
                            <Input
                              name="sortOrder"
                              type="number"
                              defaultValue={o.sortOrder}
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="active"
                            defaultChecked={o.active}
                          />
                          Actif
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" variant="secondary">
                            Enregistrer
                          </Button>
                        </div>
                      </form>
                      <form action={deleteOffering.bind(null, o.id)} className="mt-2">
                        <Button type="submit" variant="ghost" className="text-red-700">
                          Supprimer
                        </Button>
                      </form>
                    </li>
                  ))}
                  {selected.offerings.length === 0 ? (
                    <li className="py-4 text-sm text-stone-500">Aucune prestation</li>
                  ) : null}
                </ul>
              </Card>

              <Card className="space-y-3 p-4">
                <h2 className="text-sm font-semibold text-stone-800">Ajouter</h2>
                <form action={upsertOffering} className="space-y-3">
                  <input type="hidden" name="productId" value={selected.id} />
                  <div>
                    <Label>Nom</Label>
                    <Input name="name" required placeholder="Bookflow Pro" />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Input name="code" placeholder="BF-PRO" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select name="kind" defaultValue="SUBSCRIPTION">
                        <option value="ONE_SHOT">One-shot</option>
                        <option value="SUBSCRIPTION">Abonnement</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="OTHER">Autre</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Période</Label>
                      <Select name="billingPeriod" defaultValue="MONTHLY">
                        <option value="NONE">Aucune</option>
                        <option value="MONTHLY">Mensuel</option>
                        <option value="YEARLY">Annuel</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Montant HT (€)</Label>
                    <Input name="amountHt" type="number" step="0.01" />
                  </div>
                  <Button type="submit">Ajouter la prestation</Button>
                </form>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Créez d&apos;abord un produit.</p>
          )}
        </div>
      ) : null}

      {tab === "champs" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/admin/parametres?tab=champs&product=${p.id}`}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  selectedId === p.id
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-700"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>

          {selected ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-3 p-4">
                <h2 className="text-sm font-semibold text-stone-800">
                  Champs — {selected.name}
                </h2>
                <ul className="divide-y divide-stone-100 text-sm">
                  {parseFieldSchema(selected.fieldSchema).map((f) => (
                    <li key={f.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{f.label}</p>
                        <p className="text-xs text-stone-500">
                          {f.key} · {f.type}
                          {f.optionsFrom === "offerings"
                            ? " · options = prestations"
                            : f.options?.length
                              ? ` · ${f.options.length} options`
                              : ""}
                        </p>
                      </div>
                      <form action={removeProductField.bind(null, selected.id, f.key)}>
                        <Button type="submit" variant="ghost" className="text-red-700">
                          Retirer
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
                <form action={updateProductFieldSchema} className="space-y-2 border-t pt-3">
                  <input type="hidden" name="productId" value={selected.id} />
                  <Label>Édition JSON avancée</Label>
                  <textarea
                    name="fieldSchemaJson"
                    rows={10}
                    defaultValue={JSON.stringify(
                      parseFieldSchema(selected.fieldSchema),
                      null,
                      2
                    )}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-xs"
                  />
                  <Button type="submit" variant="secondary">
                    Sauver le JSON
                  </Button>
                </form>
              </Card>

              <Card className="space-y-3 p-4">
                <h2 className="text-sm font-semibold text-stone-800">Ajouter un champ</h2>
                <form action={addProductField} className="space-y-3">
                  <input type="hidden" name="productId" value={selected.id} />
                  <div>
                    <Label>Clé technique</Label>
                    <Input name="key" required placeholder="budget" />
                  </div>
                  <div>
                    <Label>Libellé</Label>
                    <Input name="label" required placeholder="Budget indicatif" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select name="type" defaultValue="text">
                      <option value="text">Texte</option>
                      <option value="textarea">Long texte</option>
                      <option value="number">Nombre</option>
                      <option value="date">Date</option>
                      <option value="boolean">Case à cocher</option>
                      <option value="select">Liste</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Options (séparées par |)</Label>
                    <Input name="options" placeholder="A|B|C" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="optionsFrom" value="offerings" />
                    Options = prestations du produit
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="required" />
                    Obligatoire
                  </label>
                  <Button type="submit">Ajouter</Button>
                </form>
              </Card>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "commissions" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-stone-800">
              Taux de commission (close)
            </h2>
            <p className="text-xs text-stone-500">
              Appliqués automatiquement au close sur le CA des prestations du
              lead.
            </p>
            <ul className="divide-y divide-stone-100">
              {commissionRules.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-stone-900">{r.label}</p>
                    <p className="text-xs text-stone-500">{r.roleKey}</p>
                  </div>
                  <Badge tone="info">{r.ratePercent} %</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-4 p-4">
            <h2 className="text-sm font-semibold text-stone-800">Modifier un taux</h2>
            {(["APPORTEUR", "COMMERCIAL"] as const).map((roleKey) => {
              const current = commissionRules.find((r) => r.roleKey === roleKey);
              return (
                <form
                  key={roleKey}
                  action={upsertCommissionRule}
                  className="space-y-2 rounded-md border border-stone-100 p-3"
                >
                  <input type="hidden" name="roleKey" value={roleKey} />
                  <p className="text-sm font-medium text-stone-800">{roleKey}</p>
                  <div>
                    <Label>Libellé</Label>
                    <Input
                      name="label"
                      defaultValue={
                        current?.label ??
                        (roleKey === "APPORTEUR"
                          ? "Apporteur d'affaires"
                          : "Commercial (close)")
                      }
                    />
                  </div>
                  <div>
                    <Label>Taux (%)</Label>
                    <Input
                      name="ratePercent"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      defaultValue={current?.ratePercent ?? (roleKey === "APPORTEUR" ? 10 : 15)}
                      required
                    />
                  </div>
                  <Button type="submit" variant="secondary">
                    Enregistrer {roleKey}
                  </Button>
                </form>
              );
            })}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
