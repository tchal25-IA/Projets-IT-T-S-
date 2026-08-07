import { Edit2, Check, Star } from "lucide-react";

export function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: "var(--ff-text-muted)" }}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function EditableField({
  label,
  value,
  field,
  editing,
  tempValue,
  onEdit,
  onSave,
  onChange,
}: {
  label: string;
  value: string;
  field: string;
  editing: string | null;
  tempValue: string;
  onEdit: (f: string, v: string) => void;
  onSave: (f: string) => Promise<void>;
  onChange: (v: string) => void;
}) {
  const isEditing = editing === field;
  return (
    <div className="flex items-start justify-between gap-3 py-2 group">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
          {label}
        </p>
        {isEditing ? (
          <input
            autoFocus
            className="mt-1 w-full bg-transparent border-b text-sm font-semibold outline-none"
            style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-text)" }}
            value={tempValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave(field)}
          />
        ) : (
          <p className="mt-1 text-sm font-semibold">{value}</p>
        )}
      </div>
      <button
        onClick={() => (isEditing ? onSave(field) : onEdit(field, value))}
        className="mt-4 flex-shrink-0"
        style={{ color: "var(--ff-cyan)" }}
        aria-label="modifier"
      >
        {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function StarRating({ value, onChange, size = 22, readOnly = false }: {
  value: number; onChange?: (v: number) => void; size?: number; readOnly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={readOnly ? "" : "transition-transform hover:scale-110"}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            style={{
              width: size, height: size,
              color: n <= value ? "var(--ff-amber)" : "var(--ff-border)",
              fill: n <= value ? "var(--ff-amber)" : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}
