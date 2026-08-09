"use client";

import { useMemo, useState, useTransition } from "react";
import {
  upsertProduct,
  toggleProductActive,
  upsertOffering,
  deleteOffering,
  toggleOfferingActive,
  saveProductFieldSchema,
} from "@/lib/actions";
import { FIELD_TYPES, type FieldDef } from "@/lib/fields";
import { Button, Input, Label, Select, Textarea, Badge } from "@/components/ui";
import { formatEuro } from "@/lib/utils";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  fieldSchema: FieldDef[];
  offerings: OfferingRow[];
};

type OfferingRow = {
  id: string;
  productId: string;
  name: string;
  code: string | null;
  kind: string;
  amountHt: number | null;
  billingPeriod: string;
  active: boolean;
  sortOrder: number;
};

const TABS = [
  { id: "produits", label: "Produits / Services" },
  { id: "prestations", label: "Prestations" },
  { id: "champs", label: "Champs" },
] as const;

const KIND_LABELS: Record<string, string> = {
  ONE_SHOT: "Ponctuel",
  SUBSCRIPTION: "Abonnement",
  MAINTENANCE: "Maintenance",
  OTHER: "Autre",
};

const PERIOD_LABELS: Record<string, string> = {
  NONE: "—",
  MONTHLY: "Mensuel",
  YEARLY: "Annuel",
};

export function SettingsAdmin({ products }: { products: ProductRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("produits");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [pending, start] = useTransition();

  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? products[0],
    [products, productId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-md bg-teal-800 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "produits" && products.length > 0 ? (
        <div className="max-w-sm">
          <Label>Produit concerné</Label>
          <Select
            value={selected?.id ?? ""}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.slug})
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {tab === "produits" ? (
        <ProductsTab products={products} pending={pending} start={start} />
      ) : null}
      {tab === "prestations" && selected ? (
        <OfferingsTab product={selected} pending={pending} start={start} />
      ) : null}
      {tab === "champs" && selected ? (
        <FieldsTab product={selected} pending={pending} start={start} />
      ) : null}
    </div>
  );
}

function ProductsTab({
  products,
  pending,
  start,
}: {
  products: ProductRow[];
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-stone-900">Nouveau produit</h3>
        <form
          className="mt-3 space-y-3"
          action={(fd) => start(() => upsertProduct(fd))}
        >
          <div>
            <Label>Nom</Label>
            <Input name="name" required placeholder="Ex. VitrineFlash" />
          </div>
          <div>
            <Label>Slug (optionnel)</Label>
            <Input name="slug" placeholder="vitrineflash" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" rows={2} />
          </div>
          <div>
            <Label>Ordre</Label>
            <Input name="sortOrder" type="number" defaultValue={products.length} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="true" defaultChecked />
            Actif
          </label>
          <Button type="submit" disabled={pending}>
            Créer
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-stone-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">{p.name}</p>
                <p className="text-xs text-stone-500">
                  {p.slug} · {p.offerings.length} prestation(s) ·{" "}
                  {p.fieldSchema.length} champ(s)
                </p>
                {p.description ? (
                  <p className="mt-1 text-sm text-stone-600">{p.description}</p>
                ) : null}
              </div>
              <Badge>{p.active ? "Actif" : "Inactif"}</Badge>
            </div>
            <form
              className="mt-3 grid gap-2 sm:grid-cols-2"
              action={(fd) => start(() => upsertProduct(fd))}
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
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  rows={2}
                  defaultValue={p.description ?? ""}
                />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input name="sortOrder" type="number" defaultValue={p.sortOrder} />
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <input
                  type="checkbox"
                  name="active"
                  value="true"
                  defaultChecked={p.active}
                />
                Actif
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    start(() => toggleProductActive(p.id, !p.active))
                  }
                >
                  {p.active ? "Désactiver" : "Réactiver"}
                </Button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

function OfferingsTab({
  product,
  pending,
  start,
}: {
  product: ProductRow;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-stone-900">
          Nouvelle prestation — {product.name}
        </h3>
        <form
          className="mt-3 space-y-3"
          action={(fd) => start(() => upsertOffering(fd))}
        >
          <input type="hidden" name="productId" value={product.id} />
          <div>
            <Label>Nom</Label>
            <Input name="name" required placeholder="Bookflow Pro" />
          </div>
          <div>
            <Label>Code</Label>
            <Input name="code" placeholder="BF-PRO" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <Select name="kind" defaultValue="ONE_SHOT">
                {Object.entries(KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Période</Label>
              <Select name="billingPeriod" defaultValue="NONE">
                {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Montant HT (€)</Label>
              <Input name="amountHt" type="number" step="0.01" />
            </div>
            <div>
              <Label>Ordre</Label>
              <Input
                name="sortOrder"
                type="number"
                defaultValue={product.offerings.length}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="true" defaultChecked />
            Actif
          </label>
          <Button type="submit" disabled={pending}>
            Ajouter
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {product.offerings.length === 0 ? (
          <p className="text-sm text-stone-500">Aucune prestation pour ce produit.</p>
        ) : null}
        {product.offerings.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-stone-200 bg-white p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-medium text-stone-900">{o.name}</p>
              <Badge>{o.active ? "Actif" : "Inactif"}</Badge>
            </div>
            <p className="mb-3 text-xs text-stone-500">
              {KIND_LABELS[o.kind] ?? o.kind} · {PERIOD_LABELS[o.billingPeriod]} ·{" "}
              {formatEuro(o.amountHt)}
              {o.code ? ` · ${o.code}` : ""}
            </p>
            <form
              className="grid gap-2 sm:grid-cols-2"
              action={(fd) => start(() => upsertOffering(fd))}
            >
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="productId" value={product.id} />
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
                  {Object.entries(KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Période</Label>
                <Select name="billingPeriod" defaultValue={o.billingPeriod}>
                  {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Montant HT</Label>
                <Input
                  name="amountHt"
                  type="number"
                  step="0.01"
                  defaultValue={o.amountHt ?? ""}
                />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input name="sortOrder" type="number" defaultValue={o.sortOrder} />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="active"
                  value="true"
                  defaultChecked={o.active}
                />
                Actif
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    start(() => toggleOfferingActive(o.id, !o.active))
                  }
                >
                  {o.active ? "Désactiver" : "Réactiver"}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Supprimer cette prestation ?")) {
                      start(() => deleteOffering(o.id));
                    }
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldsTab({
  product,
  pending,
  start,
}: {
  product: ProductRow;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [rows, setRows] = useState<FieldDef[]>(
    product.fieldSchema.length
      ? product.fieldSchema
      : [{ key: "", label: "", type: "text" }]
  );

  // Remount state when switching product
  const [productKey, setProductKey] = useState(product.id);
  if (product.id !== productKey) {
    setProductKey(product.id);
    setRows(
      product.fieldSchema.length
        ? product.fieldSchema
        : [{ key: "", label: "", type: "text" }]
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-stone-900">
        Champs de qualification — {product.name}
      </h3>
      <p className="mt-1 text-sm text-stone-500">
        Ces champs apparaissent dans la création de lead et l&apos;onglet
        Qualification. Pour une formule/abonnement, choisissez type « select »
        + source « Prestations ».
      </p>

      <form
        className="mt-4 space-y-3"
        action={(fd) => start(() => saveProductFieldSchema(fd))}
      >
        <input type="hidden" name="productId" value={product.id} />
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid gap-2 rounded-lg border border-stone-100 bg-stone-50 p-3 sm:grid-cols-6"
          >
            <div className="sm:col-span-1">
              <Label>Clé</Label>
              <Input
                name="fieldKey"
                value={row.key}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...row, key: e.target.value };
                  setRows(next);
                }}
                placeholder="planCible"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Libellé</Label>
              <Input
                name="fieldLabel"
                value={row.label}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = { ...row, label: e.target.value };
                  setRows(next);
                }}
                placeholder="Offre / plan cible"
                required
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                name="fieldType"
                value={row.type}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = {
                    ...row,
                    type: e.target.value as FieldDef["type"],
                  };
                  setRows(next);
                }}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Source options</Label>
              <Select
                name="fieldOptionsFrom"
                value={row.optionsFrom === "offerings" ? "offerings" : ""}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = {
                    ...row,
                    optionsFrom:
                      e.target.value === "offerings" ? "offerings" : undefined,
                    type:
                      e.target.value === "offerings" ? "select" : row.type,
                  };
                  setRows(next);
                }}
              >
                <option value="">Manuel</option>
                <option value="offerings">Prestations</option>
              </Select>
            </div>
            <div>
              <Label>Options (|)</Label>
              <Input
                name="fieldOptions"
                value={(row.options ?? []).join("|")}
                disabled={row.optionsFrom === "offerings"}
                onChange={(e) => {
                  const next = [...rows];
                  next[idx] = {
                    ...row,
                    options: e.target.value
                      .split("|")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  };
                  setRows(next);
                }}
                placeholder="A|B|C"
              />
              <input
                type="hidden"
                name="fieldRequired"
                value={row.required ? "true" : "false"}
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(row.required)}
                  onChange={(e) => {
                    const next = [...rows];
                    next[idx] = { ...row, required: e.target.checked };
                    setRows(next);
                  }}
                />
                Requis
              </label>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRows(rows.filter((_, i) => i !== idx))}
              >
                Retirer
              </Button>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setRows([...rows, { key: "", label: "", type: "text" }])
            }
          >
            Ajouter un champ
          </Button>
          <Button type="submit" disabled={pending}>
            Enregistrer le schéma
          </Button>
        </div>
      </form>
    </div>
  );
}
