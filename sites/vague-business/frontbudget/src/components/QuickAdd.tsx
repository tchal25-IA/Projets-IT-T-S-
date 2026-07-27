import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, type Account, type Currency, type TxType } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  accounts: Account[];
  onAdd: (t: {
    accountId: string; date: string; amount: number; currency: Currency;
    category: string; note?: string; type: TxType;
  }) => void;
}

export function QuickAdd({ accounts, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("dépense");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Courses");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const account = accounts.find((a) => a.id === accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount.replace(",", "."));
    if (!account || !val || val <= 0) {
      toast.error("Montant invalide");
      return;
    }
    onAdd({
      accountId, date, amount: val, currency: account.currency,
      category, note: note || undefined, type,
    });
    toast.success("Transaction ajoutée");
    setAmount(""); setNote("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-lg sm:h-12 sm:w-auto sm:px-5"
        >
          <Plus className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            {(["dépense", "revenu", "transfert"] as TxType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-full border px-3 py-1.5 text-sm capitalize ${
                  type === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <Label>Compte</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Montant ({account?.currency})</Label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel" />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
