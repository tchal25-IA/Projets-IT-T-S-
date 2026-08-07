"use client";

import type { FieldDef } from "@/lib/fields";

export function CustomFieldsForm({
  fields,
  values,
  prefix = "custom_",
}: {
  fields: FieldDef[];
  values?: Record<string, unknown>;
  prefix?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const name = `${prefix}${field.key}`;
        const val = values?.[field.key];
        if (field.type === "textarea") {
          return (
            <div key={field.key} className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {field.label}
              </label>
              <textarea
                name={name}
                defaultValue={String(val ?? "")}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          );
        }
        if (field.type === "boolean") {
          return (
            <label
              key={field.key}
              className="flex items-center gap-2 text-sm text-stone-700"
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={Boolean(val)}
                className="rounded border-stone-300"
              />
              {field.label}
            </label>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {field.label}
              </label>
              <select
                name={name}
                defaultValue={String(val ?? "")}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {field.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div key={field.key}>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              {field.label}
            </label>
            <input
              name={name}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
              }
              defaultValue={val != null ? String(val) : ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}

export function QualReadOnly({
  fields,
  values,
}: {
  fields: FieldDef[];
  values: Record<string, unknown>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 text-sm">
      {fields.map((f) => (
        <div
          key={f.key}
          className="flex justify-between gap-2 border-b border-stone-100 py-1.5"
        >
          <span className="text-stone-500">{f.label}</span>
          <span className="font-medium text-right">
            {values[f.key] === true
              ? "Oui"
              : values[f.key] === false
                ? "Non"
                : String(values[f.key] ?? "—")}
          </span>
        </div>
      ))}
    </div>
  );
}
