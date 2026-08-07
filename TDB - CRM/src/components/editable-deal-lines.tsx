"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDealLine, deleteDealLine } from "@/lib/actions";
import type { BillingStatus } from "@/generated/prisma/client";
import { BILLING_LABELS, formatEuro } from "@/lib/utils";
import { Button, Input, Label, Select } from "@/components/ui";

type DealLineRow = {
  id: string;
  label: string;
  amountHt: number;
  billingStatus: BillingStatus;
  isRecurring: boolean;
  notes?: string | null;
};

export function EditableDealLines({
  lines,
  canEdit,
}: {
  lines: DealLineRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (lines.length === 0) {
    return <p className="text-sm text-stone-500">Aucune prestation.</p>;
  }

  if (!canEdit) {
    return (
      <div className="space-y-2">
        {lines.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between border-b border-stone-100 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{d.label}</p>
              <p className="text-xs text-stone-500">
                {BILLING_LABELS[d.billingStatus]}
                {d.isRecurring ? " · récurrent" : ""}
              </p>
            </div>
            <p>{formatEuro(d.amountHt)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lines.map((d) => (
        <form
          key={d.id}
          className="space-y-3 rounded-md border border-stone-200 p-3"
          action={(fd) => {
            start(async () => {
              await updateDealLine(d.id, fd);
              router.refresh();
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Libellé</Label>
              <Input name="label" defaultValue={d.label} required disabled={pending} />
            </div>
            <div>
              <Label>Montant HT (€)</Label>
              <Input
                name="amountHt"
                type="number"
                step="0.01"
                defaultValue={d.amountHt}
                required
                disabled={pending}
              />
            </div>
            <div>
              <Label>Statut facturation</Label>
              <Select
                name="billingStatus"
                defaultValue={d.billingStatus}
                disabled={pending}
              >
                {Object.entries(BILLING_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input name="notes" defaultValue={d.notes ?? ""} disabled={pending} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isRecurring"
              defaultChecked={d.isRecurring}
              disabled={pending}
            />
            Récurrent
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={pending}>
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-red-700"
              disabled={pending}
              onClick={() => {
                if (!confirm("Supprimer cette prestation ?")) return;
                start(async () => {
                  await deleteDealLine(d.id);
                  router.refresh();
                });
              }}
            >
              Supprimer
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}
