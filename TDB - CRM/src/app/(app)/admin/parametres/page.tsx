import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isFullAccess } from "@/lib/roles";
import { parseFieldSchema } from "@/lib/fields";
import { formatEuro } from "@/lib/utils";
import {
  upsertProduct,
  deleteProduct,
  addProductField,
  updateProductField,
  removeProductField,
  upsertOffering,
  deleteOffering,
  updateProductFieldSchema,
  upsertCommissionRule,
  saveCompanySettings,
  saveLeadSources,
} from "@/lib/actions";
import { Button, Input, Label, Select, Card, Badge, Textarea } from "@/components/ui";
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

const FIELD_TYPES = [
  { value: "text", label: "Texte" },
  { value: "textarea", label: "Long texte" },
  { value: "number", label: "Nombre" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Case à cocher" },
  { value: "select", label: "Liste" },
] as const;

export default async function ParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; product?: string; saved?: string }>;
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
          Tout est modifiable : entreprise, sources, produits, prestations,
          champs de qualification et taux de commission.
        </p>
      </div>

      {sp.saved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Modifications enregistrées.
        </div>
      ) : null}

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
          <form
            key={`company-${company.name}-${company.siret}`}
            action={saveCompanySettings}
            className="grid gap-3 sm:grid-cols-2"
          >
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
              <Button type="submit">Enregistrer</Button>
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
          <form
            key={`sources-${leadSources.join("|")}`}
            action={saveLeadSources}
            className="space-y-3"
          >
            <Textarea
              name="sources"
              rows={10}
              defaultValue={leadSources.join("\n")}
            />
            <Button type="submit">Enregistrer les sources</Button>
          </form>
        </Card>
      ) : null}

      {tab === "produits" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((p) => (
              <Card key={p.id} className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-stone-800">
                    Modifier le produit
                  </h2>
                  <Badge tone={p.active ? "success" : "neutral"}>
                    {p._count.leads} lead(s) · {p.offerings.length} prestation(s)
                  </Badge>
                </div>
                <form
                  key={`product-${p.id}-${p.updatedAt.toISOString()}`}
                  action={upsertProduct}
                  className="space-y-3"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <div>
                    <Label>Nom</Label>
                    <Input name="name" defaultValue={p.name} required />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input name="slug" defaultValue={p.slug} required />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input name="description" defaultValue={p.description ?? ""} />
                  </div>
                  <div>
                    <Label>Ordre d&apos;affichage</Label>
                    <Input
                      name="sortOrder"
                      type="number"
                      defaultValue={p.sortOrder}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={p.active}
                    />
                    Actif
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="secondary">
                      Enregistrer
                    </Button>
                  </div>
                </form>
                <form action={deleteProduct.bind(null, p.id)}>
                  <Button type="submit" variant="ghost" className="text-red-700">
                    Supprimer le produit
                  </Button>
                </form>
              </Card>
            ))}
          </div>

          <Card className="max-w-lg space-y-3 p-4">
            <h2 className="text-sm font-semibold text-stone-800">
              Nouveau produit / service
            </h2>
            <form action={upsertProduct} className="space-y-3">
              <div>
                <Label>Nom</Label>
                <Input name="name" required placeholder="Ex. Audit SEO" />
              </div>
              <div>
                <Label>Slug (optionnel)</Label>
                <Input name="slug" placeholder="auditseo" />
              </div>
              <div>
                <Label>Description</Label>
                <Input name="description" />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input name="sortOrder" type="number" defaultValue={0} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked />
                Actif
              </label>
              <Button type="submit">Créer le produit</Button>
            </form>
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
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-stone-800">
                Prestations — {selected.name}
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {selected.offerings.map((o) => (
                  <Card key={o.id} className="space-y-3 p-4">
                    <form
                      key={`offering-${o.id}-${o.updatedAt.toISOString()}`}
                      action={upsertOffering}
                      className="space-y-3"
                    >
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="productId" value={selected.id} />
                      <div>
                        <Label>Nom de la prestation</Label>
                        <Input name="name" defaultValue={o.name} required />
                      </div>
                      <div>
                        <Label>Code</Label>
                        <Input name="code" defaultValue={o.code ?? ""} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
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
                          <Select
                            name="billingPeriod"
                            defaultValue={o.billingPeriod}
                          >
                            <option value="NONE">Aucune</option>
                            <option value="MONTHLY">Mensuel</option>
                            <option value="YEARLY">Annuel</option>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
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
                        {o.amountHt != null ? (
                          <span className="text-stone-400">
                            · {formatEuro(o.amountHt)}
                          </span>
                        ) : null}
                      </label>
                      <Button type="submit" variant="secondary">
                        Enregistrer
                      </Button>
                    </form>
                    <form action={deleteOffering.bind(null, o.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        className="text-red-700"
                      >
                        Supprimer
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>

              {selected.offerings.length === 0 ? (
                <p className="text-sm text-stone-500">Aucune prestation.</p>
              ) : null}

              <Card className="max-w-lg space-y-3 p-4">
                <h3 className="text-sm font-semibold text-stone-800">
                  Ajouter une prestation
                </h3>
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
                  <div>
                    <Label>Ordre</Label>
                    <Input name="sortOrder" type="number" defaultValue={0} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked />
                    Actif
                  </label>
                  <Button type="submit">Ajouter</Button>
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
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-stone-800">
                Champs de qualification — {selected.name}
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {parseFieldSchema(selected.fieldSchema).map((f) => (
                  <Card key={f.key} className="space-y-3 p-4">
                    <form
                      key={`field-${selected.id}-${f.key}-${f.label}`}
                      action={updateProductField}
                      className="space-y-3"
                    >
                      <input type="hidden" name="productId" value={selected.id} />
                      <input type="hidden" name="originalKey" value={f.key} />
                      <div>
                        <Label>Libellé</Label>
                        <Input name="label" defaultValue={f.label} required />
                      </div>
                      <div>
                        <Label>Clé technique</Label>
                        <Input name="key" defaultValue={f.key} required />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select name="type" defaultValue={f.type}>
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Options (séparées par |)</Label>
                        <Input
                          name="options"
                          defaultValue={(f.options ?? []).join("|")}
                          placeholder="A|B|C"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="optionsFrom"
                          value="offerings"
                          defaultChecked={f.optionsFrom === "offerings"}
                        />
                        Options = prestations du produit
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="required"
                          defaultChecked={Boolean(f.required)}
                        />
                        Obligatoire
                      </label>
                      <Button type="submit" variant="secondary">
                        Enregistrer le champ
                      </Button>
                    </form>
                    <form
                      action={removeProductField.bind(null, selected.id, f.key)}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        className="text-red-700"
                      >
                        Supprimer
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-stone-800">
                    Ajouter un champ
                  </h3>
                  <form action={addProductField} className="space-y-3">
                    <input type="hidden" name="productId" value={selected.id} />
                    <div>
                      <Label>Clé technique</Label>
                      <Input name="key" required placeholder="budget" />
                    </div>
                    <div>
                      <Label>Libellé</Label>
                      <Input
                        name="label"
                        required
                        placeholder="Budget indicatif"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select name="type" defaultValue="text">
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Options (séparées par |)</Label>
                      <Input name="options" placeholder="A|B|C" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="optionsFrom"
                        value="offerings"
                      />
                      Options = prestations du produit
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="required" />
                      Obligatoire
                    </label>
                    <Button type="submit">Ajouter</Button>
                  </form>
                </Card>

                <Card className="space-y-3 p-4">
                  <h3 className="text-sm font-semibold text-stone-800">
                    Édition JSON avancée
                  </h3>
                  <form
                    action={updateProductFieldSchema}
                    className="space-y-2"
                  >
                    <input type="hidden" name="productId" value={selected.id} />
                    <Textarea
                      name="fieldSchemaJson"
                      rows={12}
                      className="font-mono text-xs"
                      defaultValue={JSON.stringify(
                        parseFieldSchema(selected.fieldSchema),
                        null,
                        2
                      )}
                    />
                    <Button type="submit" variant="secondary">
                      Sauver le JSON
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "commissions" ? (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Taux appliqués automatiquement au close sur le CA des prestations.
            Modifiez libellé, taux, ordre et statut actif.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {(["APPORTEUR", "COMMERCIAL"] as const).map((roleKey) => {
              const current = commissionRules.find((r) => r.roleKey === roleKey);
              return (
                <Card key={roleKey} className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-stone-800">
                      {roleKey}
                    </h2>
                    {current ? (
                      <Badge tone={current.active ? "success" : "neutral"}>
                        {current.ratePercent} %
                      </Badge>
                    ) : null}
                  </div>
                  <form
                    key={`comm-${roleKey}-${current?.updatedAt?.toISOString() ?? "new"}-${current?.ratePercent ?? 0}`}
                    action={upsertCommissionRule}
                    className="space-y-3"
                  >
                    <input type="hidden" name="roleKey" value={roleKey} />
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
                        required
                      />
                    </div>
                    <div>
                      <Label>Taux de commission (%)</Label>
                      <Input
                        name="ratePercent"
                        type="number"
                        step="0.1"
                        min={0}
                        max={100}
                        defaultValue={
                          current?.ratePercent ??
                          (roleKey === "APPORTEUR" ? 10 : 15)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Ordre</Label>
                      <Input
                        name="sortOrder"
                        type="number"
                        defaultValue={
                          current?.sortOrder ??
                          (roleKey === "APPORTEUR" ? 0 : 1)
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={current?.active ?? true}
                      />
                      Actif (utilisé au close)
                    </label>
                    <Button type="submit">Enregistrer {roleKey}</Button>
                  </form>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
