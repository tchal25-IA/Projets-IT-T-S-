import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FIDUCIAIRES, CANTONS } from "@/data/fiduciaires";
import { useCompare } from "@/lib/compare-store";

export const Route = createFileRoute("/comparer")({
  head: () => ({
    meta: [
      { title: "Comparer des fiduciaires — FiduciaFind" },
      { name: "description", content: "Comparez jusqu'à 3 fiduciaires côte à côte : spécialités, langues, budget, notation." },
      { property: "og:title", content: "Comparer des fiduciaires — FiduciaFind" },
      { property: "og:description", content: "Comparez jusqu'à 3 fiduciaires côte à côte." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const items = FIDUCIAIRES.filter((f) => ids.includes(f.id));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="brand-serif text-3xl">Comparateur vide</h1>
        <p className="mt-2 text-muted-foreground">
          Sélectionnez jusqu'à 3 fiduciaires depuis l'annuaire pour les comparer côte à côte.
        </p>
        <Button asChild className="mt-6"><Link to="/recherche">Aller à l'annuaire</Link></Button>
      </div>
    );
  }

  const rows: { label: string; render: (f: typeof items[number]) => React.ReactNode }[] = [
    { label: "Ville", render: (f) => `${f.city}, ${CANTONS.find((c) => c.code === f.canton)?.label ?? f.canton}` },
    { label: "Note", render: (f) => `★ ${f.rating.toFixed(1)} (${f.reviewCount})` },
    { label: "Budget", render: (f) => f.priceBand },
    { label: "Langues", render: (f) => f.languages.join(" · ") },
    { label: "Spécialités", render: (f) => f.specialties.join(", ") },
    { label: "À distance", render: (f) => f.remote ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" /> },
    { label: "Sur site", render: (f) => f.onsite ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" /> },
    { label: "Vérifié", render: (f) => f.verified ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="brand-serif text-3xl">Comparaison</h1>
          <p className="text-sm text-muted-foreground">{items.length} fiduciaire{items.length > 1 ? "s" : ""} sélectionnée{items.length > 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" onClick={clear}>Tout retirer</Button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-40 border-b border-border bg-muted/50 p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critère</th>
              {items.map((f) => (
                <th key={f.id} className="border-b border-l border-border bg-card p-4 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to="/f/$id" params={{ id: f.id }} className="brand-serif text-lg font-semibold hover:text-primary">
                        {f.name}
                      </Link>
                    </div>
                    <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive" aria-label="Retirer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="odd:bg-muted/20">
                <td className="border-b border-border p-4 font-medium text-muted-foreground">{r.label}</td>
                {items.map((f) => (
                  <td key={f.id} className="border-b border-l border-border p-4 align-top">{r.render(f)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4"></td>
              {items.map((f) => (
                <td key={f.id} className="border-l border-border p-4">
                  <Button asChild size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to="/f/$id" params={{ id: f.id }} hash="devis">Demander un devis</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
