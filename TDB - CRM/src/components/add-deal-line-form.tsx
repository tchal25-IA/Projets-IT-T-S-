"use client";

import { useMemo, useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { BILLING_LABELS } from "@/lib/utils";

export type OfferingOption = {
  id: string;
  name: string;
  amountHt: number | null;
  kind: string;
  productName: string;
};

export function AddDealLineForm({
  action,
  offerings = [],
}: {
  action: (formData: FormData) => Promise<void>;
  offerings?: OfferingOption[];
}) {
  const [offeringId, setOfferingId] = useState("");
  const selected = useMemo(
    () => offerings.find((o) => o.id === offeringId) ?? null,
    [offerings, offeringId]
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      {offerings.length > 0 ? (
        <div className="sm:col-span-4">
          <Label>Prestation catalogue</Label>
          <Select
            name="offeringId"
            value={offeringId}
            onChange={(e) => setOfferingId(e.target.value)}
          >
            <option value="">— Saisie libre —</option>
            {offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.productName} · {o.name}
                {o.amountHt != null ? ` (${o.amountHt} € HT)` : ""}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <Input
        name="label"
        placeholder="Libellé"
        required={!offeringId}
        className="sm:col-span-2"
        defaultValue={selected?.name ?? ""}
        key={`label-${offeringId}`}
        disabled={Boolean(offeringId)}
      />
      {offeringId ? (
        <input type="hidden" name="label" value={selected?.name ?? ""} />
      ) : null}
      <Input
        name="amountHt"
        type="number"
        placeholder="Montant HT"
        required={!offeringId}
        defaultValue={selected?.amountHt ?? ""}
        key={`amt-${offeringId}`}
        disabled={Boolean(offeringId)}
      />
      {offeringId ? (
        <input
          type="hidden"
          name="amountHt"
          value={String(selected?.amountHt ?? 0)}
        />
      ) : null}
      <Select name="billingStatus" defaultValue="DEVIS">
        {Object.entries(BILLING_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="isRecurring"
          defaultChecked={
            selected?.kind === "SUBSCRIPTION" || selected?.kind === "MAINTENANCE"
          }
          key={`rec-${offeringId}`}
        />{" "}
        Récurrent
      </label>
      <Button type="submit" className="sm:col-span-2 sm:w-fit">
        Ajouter
      </Button>
    </form>
  );
}
