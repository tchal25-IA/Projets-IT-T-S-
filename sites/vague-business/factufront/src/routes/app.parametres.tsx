import { createFileRoute } from "@tanstack/react-router";
import { useFactuFront, useHydrated } from "@/lib/factufront-store";
import type { Country, Currency } from "@/lib/factufront-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VAT_PRESETS } from "@/lib/invoiceEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parametres")({
  component: SettingsPage,
});

function SettingsPage() {
  const hydrated = useHydrated();
  const { state, updateProfile } = useFactuFront();
  const p = state.profile;

  if (!hydrated) return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-brand text-3xl tracking-tight">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ces informations apparaissent en haut de chaque facture.
      </p>

      <Card className="mt-8 space-y-5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Vendeur
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom / Raison sociale">
            <Input value={p.companyName} onChange={(e) => updateProfile({ companyName: e.target.value })} />
          </Field>
          <Field label="Contact">
            <Input value={p.contactName} onChange={(e) => updateProfile({ contactName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={p.email} onChange={(e) => updateProfile({ email: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <Input value={p.phone} onChange={(e) => updateProfile({ phone: e.target.value })} />
          </Field>
          <Field label="Adresse">
            <Input value={p.address} onChange={(e) => updateProfile({ address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CP">
              <Input value={p.postalCode} onChange={(e) => updateProfile({ postalCode: e.target.value })} />
            </Field>
            <Field label="Ville">
              <Input value={p.city} onChange={(e) => updateProfile({ city: e.target.value })} />
            </Field>
          </div>
          <Field label="Pays">
            <Select
              value={p.country}
              onValueChange={(v: Country) =>
                updateProfile({
                  country: v,
                  defaultCurrency: v === "CH" ? "CHF" : "EUR",
                  defaultVatRate: v === "CH" ? 8.1 : 20,
                })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CH">Suisse</SelectItem>
                <SelectItem value="FR">France</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Devise par défaut">
            <Select value={p.defaultCurrency} onValueChange={(v: Currency) => updateProfile({ defaultCurrency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CHF">CHF</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mt-6 space-y-5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fiscal
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="N° TVA">
            <Input placeholder={p.country === "CH" ? "CHE-xxx.xxx.xxx TVA" : "FRxxxxxxxxxxx"} value={p.vatNumber} onChange={(e) => updateProfile({ vatNumber: e.target.value })} />
          </Field>
          {p.country === "CH" ? (
            <Field label="IDE (Suisse)">
              <Input value={p.ide} onChange={(e) => updateProfile({ ide: e.target.value })} />
            </Field>
          ) : (
            <Field label="SIRET (France)">
              <Input value={p.siret} onChange={(e) => updateProfile({ siret: e.target.value })} />
            </Field>
          )}
          <Field label="TVA par défaut">
            <Select value={String(p.defaultVatRate)} onValueChange={(v) => updateProfile({ defaultVatRate: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VAT_PRESETS[p.country].map((preset) => (
                  <SelectItem key={preset.rate} value={String(preset.rate)}>{preset.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mt-6 space-y-5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Paiement
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Banque">
            <Input value={p.bankName} onChange={(e) => updateProfile({ bankName: e.target.value })} />
          </Field>
          <Field label="BIC">
            <Input value={p.bic} onChange={(e) => updateProfile({ bic: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="IBAN">
              <Input value={p.iban} onChange={(e) => updateProfile({ iban: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Button onClick={() => toast.success("Paramètres enregistrés")}>Enregistrer</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
