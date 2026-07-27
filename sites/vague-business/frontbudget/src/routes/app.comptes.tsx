import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/useApp";
import { fmt, convert } from "@/lib/budgetEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { AccountType, Currency } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/comptes")({
  component: Comptes,
});

function Comptes() {
  const { state, addAccount, removeAccount } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [type, setType] = useState<AccountType>("courant");
  const [balance, setBalance] = useState("");

  if (!state) return null;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold">Comptes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Nouveau</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nouveau compte</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-2"><Label>Nom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Épargne PostFinance" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Devise</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaire">Salaire</SelectItem>
                      <SelectItem value="courant">Courant</SelectItem>
                      <SelectItem value="épargne">Épargne</SelectItem>
                      <SelectItem value="espèces">Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2"><Label>Solde initial</Label>
                <Input inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => {
                if (!name) return toast.error("Nom requis");
                addAccount({ name, currency, type, balance: parseFloat(balance || "0") || 0 });
                toast.success("Compte ajouté");
                setName(""); setBalance(""); setOpen(false);
              }}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {state.accounts.map((a) => (
          <div key={a.id} className="paper-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{a.type}</div>
                <div className="mt-1 text-lg font-semibold">{a.name}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeAccount(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 text-3xl font-semibold tracking-tight">{fmt(a.balance, a.currency)}</div>
            {a.currency !== state.settings.displayCurrency && (
              <div className="mt-1 text-xs text-muted-foreground">
                ≈ {fmt(convert(a.balance, a.currency, state.settings.displayCurrency, state.settings.fxChfToEur), state.settings.displayCurrency)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
