"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions";
import type { LeadStatus } from "@/generated/prisma/client";
import { PIPELINE_STATUSES, STATUS_LABELS, cn } from "@/lib/utils";
import { Select } from "@/components/ui";

export function StatusSelect({
  leadId,
  value,
  disabled,
  labels,
}: {
  leadId: string;
  value: LeadStatus;
  disabled?: boolean;
  labels?: Partial<Record<LeadStatus, string>>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(value);
  const [flash, setFlash] = useState(false);
  const labelMap = { ...STATUS_LABELS, ...labels };

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <Select
        disabled={disabled || pending}
        value={local}
        onChange={(e) => {
          const status = e.target.value as LeadStatus;
          const prev = local;
          setLocal(status);
          start(async () => {
            try {
              await updateLeadStatus(leadId, status);
              setFlash(true);
              setTimeout(() => setFlash(false), 2000);
              router.refresh();
            } catch {
              setLocal(prev);
            }
          });
        }}
      >
        {PIPELINE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {labelMap[s]}
          </option>
        ))}
      </Select>
      {flash ? (
        <span
          className={cn(
            "absolute -bottom-5 left-0 text-[11px] font-medium text-teal-700"
          )}
        >
          Statut mis à jour
        </span>
      ) : null}
    </div>
  );
}
