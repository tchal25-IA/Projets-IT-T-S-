import { BillingActions } from "@/components/billing-actions";
import { CommissionStatusForm } from "@/components/commission-status-form";
import { Badge, Button, Input, Label, Select, Stat, Textarea } from "@/components/ui";
import {
  BILLING_LABELS,
  CLIENT_STATUS_LABELS,
  COMMISSION_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatEuro,
} from "@/lib/utils";
import type {
  ActivityType,
  BillingStatus,
  ClientStatus,
  CommissionStatus,
} from "@/generated/prisma/client";

type DealLineRow = {
  id: string;
  label: string;
  amountHt: number;
  billingStatus: BillingStatus;
  isRecurring: boolean;
};

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

type ActivityRow = {
  id: string;
  type: ActivityType | string;
  note: string;
  createdAt: Date;
  user: { fullName: string } | null;
};

export function DealLinesList({ lines }: { lines: DealLineRow[] }) {
  if (lines.length === 0) {
    return <p className="text-sm text-stone-500">Aucune prestation.</p>;
  }
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

export function BillingPanel({
  lines,
  canEdit,
}: {
  lines: DealLineRow[];
  canEdit: boolean;
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-stone-500">Aucune ligne de facturation.</p>;
  }
  return (
    <div className="space-y-3">
      {lines.map((d) => (
        <div key={d.id} className="rounded-md border border-stone-200 p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{d.label}</p>
              <Badge
                tone={
                  d.billingStatus === "PAYE"
                    ? "success"
                    : d.billingStatus === "A_FACTURER"
                      ? "warning"
                      : "neutral"
                }
              >
                {BILLING_LABELS[d.billingStatus]}
              </Badge>
            </div>
            <p className="font-semibold">{formatEuro(d.amountHt)}</p>
          </div>
          {canEdit ? (
            <div className="mt-2">
              <BillingActions id={d.id} status={d.billingStatus} showPay />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CommissionsPanel({
  commissions,
  filterUserId,
  canEdit,
}: {
  commissions: CommissionRow[];
  filterUserId?: string | null;
  canEdit: boolean;
}) {
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
    <div className="space-y-3">
      {rows.map((c) => (
        <div key={c.id} className="rounded-md border border-stone-200 p-3 text-sm">
          <div className="flex justify-between gap-2">
            <div>
              <p className="font-medium">{c.user.fullName}</p>
              <p className="text-xs text-stone-500">
                {c.roleLabel} · {c.ratePercent}% · {c.label}
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
            <CommissionStatusForm id={c.id} status={c.status} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ActivitiesTimeline({
  activities,
  upcomingRelance,
  addAction,
}: {
  activities: ActivityRow[];
  upcomingRelance?: Date | null;
  addAction?: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {upcomingRelance ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Prochaine relance : <strong>{formatDateTime(upcomingRelance)}</strong>
        </div>
      ) : (
        <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
          Aucune relance planifiée.
        </div>
      )}
      <div className="max-h-80 space-y-3 overflow-y-auto">
        {activities.map((a) => (
          <div key={a.id} className="border-l-2 border-teal-700/30 pl-3">
            <p className="text-xs text-stone-500">
              {formatDateTime(a.createdAt)} · {a.user?.fullName ?? "Système"} · {a.type}
            </p>
            <p className="text-sm text-stone-800">{a.note}</p>
          </div>
        ))}
        {activities.length === 0 ? (
          <p className="text-sm text-stone-500">Aucune activité.</p>
        ) : null}
      </div>
      {addAction ? (
        <form action={addAction} className="space-y-3 border-t border-stone-100 pt-4">
          <Select name="type" defaultValue="NOTE">
            <option value="NOTE">Note</option>
            <option value="APPEL">Appel</option>
            <option value="EMAIL">Email</option>
            <option value="RDV">RDV</option>
          </Select>
          <Textarea name="note" rows={3} placeholder="Ajouter une activité…" required />
          <div>
            <Label>Planifier une relance</Label>
            <Input name="nextCallAt" type="datetime-local" />
          </div>
          <Button type="submit" variant="secondary">
            Ajouter à la timeline
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function ActorsCards({
  commercialName,
  apporteurName,
}: {
  commercialName?: string | null;
  apporteurName?: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 text-sm">
      <div className="rounded-md bg-stone-50 p-3">
        <p className="text-xs text-stone-500">Apporteur d&apos;affaires</p>
        <p className="font-medium">{apporteurName ?? "—"}</p>
      </div>
      <div className="rounded-md bg-stone-50 p-3">
        <p className="text-xs text-stone-500">Commercial (owner / closer)</p>
        <p className="font-medium">{commercialName ?? "—"}</p>
      </div>
    </div>
  );
}

export function LivraisonPanel({
  status,
  notes,
  createdAt,
  canEdit,
  onStatusAction,
  leadLink,
}: {
  status: ClientStatus;
  notes?: string | null;
  createdAt?: Date | null;
  canEdit: boolean;
  onStatusAction?: (formData: FormData) => Promise<void>;
  leadLink?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Statut client" value={CLIENT_STATUS_LABELS[status]} />
        {createdAt ? (
          <Stat label="Client depuis" value={formatDate(createdAt)} />
        ) : null}
      </div>
      {notes ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-950">{notes}</p>
      ) : null}
      {canEdit && onStatusAction ? (
        <form action={onStatusAction} className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label>Statut livraison</Label>
            <Select name="status" defaultValue={status}>
              {Object.entries(CLIENT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Mettre à jour
          </Button>
        </form>
      ) : null}
      {leadLink}
    </div>
  );
}

export function AddDealLineForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      <Input name="label" placeholder="Libellé" required className="sm:col-span-2" />
      <Input name="amountHt" type="number" placeholder="Montant HT" required />
      <Select name="billingStatus" defaultValue="DEVIS">
        {Object.entries(BILLING_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="isRecurring" /> Récurrent
      </label>
      <Button type="submit" className="sm:col-span-2 sm:w-fit">
        Ajouter
      </Button>
    </form>
  );
}
