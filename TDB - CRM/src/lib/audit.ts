import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/tenant";

export async function recordFieldChanges(opts: {
  entity: string;
  entityId: string;
  userId?: string | null;
  changes: { field: string; oldValue?: string | null; newValue?: string | null }[];
}) {
  const rows = opts.changes.filter(
    (c) => String(c.oldValue ?? "") !== String(c.newValue ?? "")
  );
  if (rows.length === 0) return;

  const orgId = await requireOrg();
  await prisma.fieldHistory.createMany({
    data: rows.map((c) => ({
      organizationId: orgId,
      entity: opts.entity,
      entityId: opts.entityId,
      field: c.field,
      oldValue: c.oldValue ?? null,
      newValue: c.newValue ?? null,
      userId: opts.userId ?? null,
    })),
  });
}

export function diffScalar(
  field: string,
  oldVal: unknown,
  newVal: unknown
): { field: string; oldValue: string | null; newValue: string | null } | null {
  const o = oldVal == null || oldVal === "" ? null : String(oldVal);
  const n = newVal == null || newVal === "" ? null : String(newVal);
  if (o === n) return null;
  return { field, oldValue: o, newValue: n };
}
