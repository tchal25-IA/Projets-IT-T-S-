"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateDealLineStatus, startStripeCheckout } from "@/lib/actions";
import type { BillingStatus } from "@/generated/prisma/client";
import { BILLING_LABELS } from "@/lib/utils";
import { Select, Button } from "@/components/ui";

export function BillingActions({
  id,
  status,
  showPay,
}: {
  id: string;
  status: BillingStatus;
  showPay?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(status);

  useEffect(() => {
    setLocal(status);
  }, [status]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        disabled={pending}
        value={local}
        className="w-36"
        onChange={(e) => {
          const next = e.target.value as BillingStatus;
          const prev = local;
          setLocal(next);
          start(async () => {
            try {
              await updateDealLineStatus(id, next);
              router.refresh();
            } catch {
              setLocal(prev);
            }
          });
        }}
      >
        {Object.entries(BILLING_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      <Link
        href={`/api/deals/${id}/pdf`}
        className="rounded-md border border-stone-200 px-2 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
      >
        PDF
      </Link>
      {showPay && (local === "A_FACTURER" || local === "FACTURE") ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                await startStripeCheckout(id);
              } catch (e) {
                alert(e instanceof Error ? e.message : "Stripe indisponible");
              }
            })
          }
        >
          Payer (Stripe)
        </Button>
      ) : null}
    </div>
  );
}
