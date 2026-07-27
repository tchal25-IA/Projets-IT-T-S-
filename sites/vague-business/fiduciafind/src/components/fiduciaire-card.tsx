import { Link } from "@tanstack/react-router";
import { Star, MapPin, Globe, Check } from "lucide-react";
import type { Fiduciaire } from "@/data/fiduciaires";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompare } from "@/lib/compare-store";
import { CANTONS } from "@/data/fiduciaires";

export function FiduciaireCard({ f }: { f: Fiduciaire }) {
  const { ids, toggle, max } = useCompare();
  const selected = ids.includes(f.id);
  const cantonLabel = CANTONS.find((c) => c.code === f.canton)?.label ?? f.canton;

  return (
    <article className="group relative rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      {f.featured && (
        <span className="absolute -top-2 left-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          Sponsorisé
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="brand-serif text-xl font-semibold leading-tight">
            <Link to="/f/$id" params={{ id: f.id }} className="hover:text-primary">
              {f.name}
            </Link>
            {f.verified && (
              <Check className="ml-1 inline h-4 w-4 rounded-full bg-primary p-0.5 text-primary-foreground" aria-label="Vérifié" />
            )}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {f.city}, {cantonLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" /> {f.languages.join(" · ")}
            </span>
            <span>{f.priceBand}</span>
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <div className="inline-flex items-center gap-1 text-sm font-semibold">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {f.rating.toFixed(1)}
          </div>
          <div className="text-[11px] text-muted-foreground">{f.reviewCount} avis</div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{f.shortBio}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {f.specialties.slice(0, 4).map((s) => (
          <Badge key={s} variant="secondary" className="font-normal">
            {s}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={selected}
            onCheckedChange={() => toggle(f.id)}
            disabled={!selected && ids.length >= max}
          />
          Comparer
        </label>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/f/$id" params={{ id: f.id }}>Voir le profil</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/f/$id" params={{ id: f.id }} hash="devis">Devis</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
