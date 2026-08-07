"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateCommission,
  deleteCommission,
} from "@/lib/actions";
import type { CommissionStatus } from "@/generated/prisma/client";
import { COMMISSION_STATUS_LABELS, formatEuro } from "@/lib/utils";
import { Badge, Button, Input, Label, Select } from "@/components/ui";

type CommissionRow = {
  id: string;
  label: string;
  roleLabel: string;
  ratePercent: number;
  amountHt: number;
  status: CommissionStatus;
  userId: string;
  user: { fullName: string };
};

export function EditableCommissions({
  commissions,
  filterUserId,
  canEdit,
}: {
  commissions: CommissionRow[];
  filterUserId?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const rows = filterUserId
    ? commissions.filter((c) => c.userId === filterUserId)
    : commissions;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Les commissions apparaissent après le close (conversion lead → client).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((c) => (
        <div key={c.id} className="rounded-md border border-stone-200 p-3 text-sm">
          <div className="mb-2 flex justify-between gap-2">
            <div>
              <p className="font-medium">{c.user.fullName}</p>
              <p className="text-xs text-stone-500">
                {c.roleLabel} · {c.label}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatEuro(c.amountHt)}</p>
              <Badge tone={c.status === "VERSEE" ? "success" : "warning"}>
                {COMMISSION_STATUS_LABELS[c.status]}
              </Badge>
            </div>
          </div>

          {canEdit ? (
            <form
              className="mt-3 grid gap-3 sm:grid-cols-2"
              action={(fd) => {
                start(async () => {
                  await updateCommission(c.id, fd);
                  router.refresh();
                });
              }}
            >
              <div>
                <Label>Libellé</Label>
                <Input name="label" defaultValue={c.label} disabled={pending} />
              </div>
              <div>
                <Label>Taux (%)</Label>
                <Input
                  name="ratePercent"
                  type="number"
                  step="0.1"
                  defaultValue={c.ratePercent}
                  disabled={pending}
                />
              </div>
              <div>
                <Label>Montant HT (€)</Label>
                <Input
                  name="amountHt"
                  type="number"
                  step="0.01"
                  defaultValue={c.amountHt}
                  disabled={pending}
                />
              </div>
              <div>
                <Label>Statut</Label>
                <Select name="status" defaultValue={c.status} disabled={pending}>
                  {Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" variant="secondary" disabled={pending}>
                  Enregistrer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-700"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Supprimer cette commission ?")) return;
                    start(async () => {
                      await deleteCommission(c.id);
                      router.refresh();
                    });
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}
