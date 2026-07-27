import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FiduciaireCard } from "@/components/fiduciaire-card";
import { CANTONS, ALL_SPECIALTIES, LANGUAGES, FIDUCIAIRES } from "@/data/fiduciaires";

const searchSchema = z.object({
  canton: fallback(z.string(), "").default(""),
  specialty: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/recherche")({
  head: () => ({
    meta: [
      { title: "Rechercher une fiduciaire — FiduciaFind" },
      { name: "description", content: "Filtrez par canton, langue, spécialité, budget et remote pour trouver la fiduciaire adaptée à votre activité." },
      { property: "og:title", content: "Annuaire des fiduciaires suisses — FiduciaFind" },
      { property: "og:description", content: "Filtrez par canton, langue et spécialité. Comparez jusqu'à 3 profils." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: SearchPage,
});

type Sort = "rating" | "price" | "name";

function SearchPage() {
  const initial = Route.useSearch();

  const [canton, setCanton] = useState(initial.canton);
  const [specialty, setSpecialty] = useState(initial.specialty);
  const [q, setQ] = useState(initial.q);
  const [languages, setLanguages] = useState<string[]>([]);
  const [priceBands, setPriceBands] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("rating");

  const results = useMemo(() => {
    const filtered = FIDUCIAIRES.filter((f) => {
      if (canton && f.canton !== canton) return false;
      if (specialty && !f.specialties.includes(specialty)) return false;
      if (languages.length && !languages.some((l) => f.languages.includes(l as any))) return false;
      if (priceBands.length && !priceBands.includes(f.priceBand)) return false;
      if (remoteOnly && !f.remote) return false;
      if (verifiedOnly && !f.verified) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !f.name.toLowerCase().includes(s) &&
          !f.city.toLowerCase().includes(s) &&
          !f.shortBio.toLowerCase().includes(s) &&
          !f.specialties.some((sp) => sp.toLowerCase().includes(s))
        )
          return false;
      }
      return true;
    });

    const priceRank: Record<string, number> = { "€": 1, "€€": 2, "€€€": 3 };
    filtered.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "price") return priceRank[a.priceBand] - priceRank[b.priceBand];
      return a.name.localeCompare(b.name);
    });
    // featured first within equal sort
    filtered.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return filtered;
  }, [canton, specialty, languages, priceBands, remoteOnly, verifiedOnly, q, sort]);

  const reset = () => {
    setCanton(""); setSpecialty(""); setQ(""); setLanguages([]);
    setPriceBands([]); setRemoteOnly(false); setVerifiedOnly(false);
  };

  const toggle = (list: string[], setter: (v: string[]) => void, val: string) => {
    setter(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="brand-serif text-3xl">Annuaire des fiduciaires</h1>
        <p className="text-muted-foreground">{results.length} fiduciaire{results.length > 1 ? "s" : ""} trouvée{results.length > 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <Label htmlFor="q">Recherche libre</Label>
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, ville, spécialité…" className="mt-1" />
          </div>

          <div>
            <Label>Canton</Label>
            <Select value={canton || "all"} onValueChange={(v) => setCanton(v === "all" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {CANTONS.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Spécialité</Label>
            <Select value={specialty || "all"} onValueChange={(v) => setSpecialty(v === "all" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {ALL_SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Langues</Label>
            <div className="space-y-1.5">
              {LANGUAGES.map((l) => (
                <label key={l} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={languages.includes(l)} onCheckedChange={() => toggle(languages, setLanguages, l)} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Budget</Label>
            <div className="flex gap-2">
              {["€", "€€", "€€€"].map((p) => (
                <button
                  key={p}
                  onClick={() => toggle(priceBands, setPriceBands, p)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${priceBands.includes(p) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={remoteOnly} onCheckedChange={(v) => setRemoteOnly(!!v)} />
              Uniquement à distance
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
              Uniquement vérifiées
            </label>
          </div>

          <Button variant="outline" size="sm" onClick={reset} className="w-full">
            <X className="mr-1 h-3 w-3" /> Réinitialiser
          </Button>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Trier par</div>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Meilleures notes</SelectItem>
                <SelectItem value="price">Prix (croissant)</SelectItem>
                <SelectItem value="name">Nom (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <h3 className="brand-serif text-xl">Aucun résultat</h3>
              <p className="mt-2 text-sm text-muted-foreground">Essayez d'élargir vos critères.</p>
              <Button onClick={reset} variant="outline" className="mt-4">Réinitialiser les filtres</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((f) => <FiduciaireCard key={f.id} f={f} />)}
            </div>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Vous êtes fiduciaire ? <Link to="/pour-fiduciaires" className="text-primary underline">Ajoutez votre fiche</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
