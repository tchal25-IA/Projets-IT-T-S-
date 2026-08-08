"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions";
import { PIPELINE_STATUSES, STATUS_LABELS, formatEuro } from "@/lib/utils";
import type { LeadStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui";

export { CustomFieldsForm } from "@/components/custom-fields-form";

type KanbanLead = {
  id: string;
  companyName: string;
  status: LeadStatus;
  estimatedValue: number | null;
  product: { name: string; slug: string };
  commercial: { fullName: string } | null;
};

export function PipelineBoard({
  leads,
  labels,
}: {
  leads: KanbanLead[];
  labels?: Partial<Record<LeadStatus, string>>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [localLeads, setLocalLeads] = useState(leads);
  const labelMap = { ...STATUS_LABELS, ...labels };

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const columns = useMemo(() => {
    const map: Record<string, KanbanLead[]> = {};
    for (const s of PIPELINE_STATUSES) map[s] = [];
    for (const lead of localLeads) map[lead.status]?.push(lead);
    return map;
  }, [localLeads]);

  function onDrop(status: LeadStatus) {
    if (!dragging) return;
    const id = dragging;
    const prev = localLeads;
    setDragging(null);
    setLocalLeads((list) =>
      list.map((l) => (l.id === id ? { ...l, status } : l))
    );
    start(async () => {
      try {
        await updateLeadStatus(id, status);
        router.refresh();
      } catch {
        setLocalLeads(prev);
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STATUSES.map((status) => (
        <div
          key={status}
          className="w-64 shrink-0 rounded-lg border border-stone-200 bg-stone-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(status)}
        >
          <div className="flex items-center justify-between border-b border-stone-200 px-3 py-2">
            <p className="text-sm font-medium text-stone-800">{labelMap[status]}</p>
            <Badge>{columns[status]?.length ?? 0}</Badge>
          </div>
          <div className={`min-h-40 space-y-2 p-2 ${pending ? "opacity-70" : ""}`}>
            {(columns[status] ?? []).map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={() => setDragging(lead.id)}
                className="cursor-grab rounded-md border border-stone-200 bg-white p-3 active:cursor-grabbing"
              >
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium text-stone-900 hover:text-teal-800"
                >
                  {lead.companyName}
                </Link>
                <p className="mt-1 text-xs text-stone-500">{lead.product.name}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-stone-600">
                  <span>{lead.commercial?.fullName ?? "Non assigné"}</span>
                  <span>{formatEuro(lead.estimatedValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
