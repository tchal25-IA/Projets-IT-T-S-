"use client";

import { useTransition } from "react";
import { updateCommissionStatus } from "@/lib/actions";
import type { CommissionStatus } from "@/generated/prisma/client";
import { COMMISSION_STATUS_LABELS } from "@/lib/utils";
import { Select } from "@/components/ui";

export function CommissionStatusForm({
  id,
  status,
}: {
  id: string;
  status: CommissionStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-2 flex gap-2">
      <Select
        disabled={pending}
        defaultValue={status}
        onChange={(e) => {
          const next = e.target.value as CommissionStatus;
          start(async () => {
            await updateCommissionStatus(id, next);
          });
        }}
      >
        {Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
    </div>
  );
}
