import { type LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  eyebrow,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="mb-8 space-y-2">
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
      )}
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
    </header>
  );
}
