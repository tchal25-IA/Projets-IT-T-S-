import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTipStore } from "@/lib/tipStore";
import { METHOD_LABELS, type Method, type Currency } from "@/lib/tipEngine";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/app/parametres")({
  head: () => ({
    meta: [
      { title: "Réglages — TipShare" },
      { name: "description", content: "Nom du point de vente, devise, méthode par défaut, arrondis." },
      { property: "og:title", content: "Réglages — TipShare" },
      { property: "og:description", content: "Configurer votre venue TipShare." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { venue, setVenue, resetAll } = useTipStore();

  return (
    <AppShell>
      <Toaster richColors position="top-center" />
      <h1 className="brand-serif text-3xl text-primary">Réglages</h1>

      <section className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <Label>Nom du point de vente</Label>
          <Input value={venue.name} onChange={(e) => setVenue({ name: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Pays</Label>
            <Select
              value={venue.country}
              onValueChange={(v) => {
                const country = v as "CH" | "FR";
                setVenue({ country, currency: country === "CH" ? "CHF" : "EUR" });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                <SelectItem value="FR">🇫🇷 France</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Devise</Label>
            <Select value={venue.currency} onValueChange={(v) => setVenue({ currency: v as Currency })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CHF">CHF — arrondi 0.05</SelectItem>
                <SelectItem value="EUR">EUR — arrondi 0.01</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Méthode par défaut</Label>
          <Select
            value={venue.defaultMethod}
            onValueChange={(v) => setVenue({ defaultMethod: v as Method })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(METHOD_LABELS) as Method[]).map((m) => (
                <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => toast.success("Réglages enregistrés")}>Enregistrer</Button>
      </section>

      <section className="mt-6 rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="brand-serif text-lg text-destructive">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Réinitialise toutes les données locales (équipe, journées, réglages).
        </p>
        <Button
          variant="destructive"
          className="mt-3"
          onClick={() => {
            if (confirm("Réinitialiser toutes les données ?")) {
              resetAll();
              toast.success("Données réinitialisées");
            }
          }}
        >
          Réinitialiser tout
        </Button>
      </section>
    </AppShell>
  );
}
