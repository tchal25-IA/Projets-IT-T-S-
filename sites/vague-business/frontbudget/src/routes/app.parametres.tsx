import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/useApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Currency } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/parametres")({
  component: Parametres,
});

function Parametres() {
  const { state, setSettings, reset } = useApp();
  const [fx, setFx] = useState("");
  const [salaryDay, setSalaryDay] = useState("");
  const [display, setDisplay] = useState<Currency>("EUR");

  useEffect(() => {
    if (state) {
      setFx(String(state.settings.fxChfToEur));
      setSalaryDay(String(state.settings.salaryDay));
      setDisplay(state.settings.displayCurrency);
    }
  }, [state]);

  if (!state) return null;

  return (
    <>
      <h1 className="text-3xl font-semibold">Paramètres</h1>

      <div className="paper-card mt-6 space-y-5 p-6">
        <div className="grid gap-2">
          <Label>Taux de change (1 CHF = X EUR)</Label>
          <Input inputMode="decimal" value={fx} onChange={(e) => setFx(e.target.value)} />
          <p className="text-xs text-muted-foreground">Astuce : utilisez le taux réel de votre banque ou de Wise.</p>
        </div>
        <div className="grid gap-2">
          <Label>Jour de paie</Label>
          <Input type="number" min={1} max={31} value={salaryDay} onChange={(e) => setSalaryDay(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Devise d'affichage</Label>
          <Select value={display} onValueChange={(v) => setDisplay(v as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => {
          const fxN = parseFloat(fx.replace(",", "."));
          const sd = parseInt(salaryDay);
          if (!fxN || fxN <= 0) return toast.error("Taux invalide");
          setSettings({ fxChfToEur: fxN, salaryDay: sd || 25, displayCurrency: display });
          toast.success("Paramètres enregistrés");
        }}>Enregistrer</Button>
      </div>

      <div className="paper-card mt-6 p-6">
        <h2 className="text-lg font-semibold">Données de démonstration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Efface toutes vos données locales et recharge le jeu de démo.
        </p>
        <Button variant="destructive" className="mt-4" onClick={() => {
          reset();
          toast.success("Données réinitialisées");
        }}>Réinitialiser</Button>
      </div>
    </>
  );
}
