import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, store, type PaymentStatus } from "@/lib/adhezia-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Mail, MinusCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cotisations")({
  head: () => ({
    meta: [
      { title: "Cotisations — Adhezia" },
      { name: "description", content: "Suivez les cotisations de la saison, marquez payé, exonérez ou relancez." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DuesPage,
});

const statusLabel: Record<PaymentStatus, string> = {
  à_payer: "À payer",
  payé: "Payé",
  exonéré: "Exonéré",
};

function chf(n: number, currency: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency }).format(n);
}

function DuesPage() {
  const { members, payments, club } = useStore((s) => ({ members: s.members, payments: s.payments, club: s.club }));
  const rows = useMemo(
    () =>
      payments
        .filter((p) => p.period === club.seasonYear)
        .map((p) => ({ p, member: members.find((m) => m.id === p.memberId) }))
        .filter((r) => r.member),
    [payments, members, club.seasonYear],
  );

  const totals = useMemo(() => {
    const paid = rows.filter((r) => r.p.status === "payé").reduce((s, r) => s + r.p.amount, 0);
    const due = rows.filter((r) => r.p.status === "à_payer").reduce((s, r) => s + r.p.amount, 0);
    return { paid, due };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Saison {club.seasonYear}</p>
        <h1 className="text-3xl mt-1">Cotisations</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs uppercase text-muted-foreground">Encaissé</p><p className="text-2xl font-semibold mt-1">{chf(totals.paid, club.currency)}</p></Card>
        <Card className="p-5"><p className="text-xs uppercase text-muted-foreground">Reste à percevoir</p><p className="text-2xl font-semibold mt-1">{chf(totals.due, club.currency)}</p></Card>
        <Card className="p-5"><p className="text-xs uppercase text-muted-foreground">Nombre de cotisations</p><p className="text-2xl font-semibold mt-1">{rows.length}</p></Card>
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {rows.map(({ p, member }) => (
            <li key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member!.name}</p>
                <p className="text-xs text-muted-foreground">{member!.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{chf(p.amount, club.currency)}</span>
                <StatusPill status={p.status} />
              </div>
              <div className="flex gap-2">
                {p.status !== "payé" && (
                  <Button size="sm" onClick={() => { store.setPaymentStatus(p.id, "payé"); toast.success(`${member!.name} — marqué payé`); }}>
                    <Check className="mr-1 size-4" /> Marquer payé
                  </Button>
                )}
                {p.status === "à_payer" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => toast.info("Relances email — bientôt")}>
                      <Mail className="mr-1 size-4" /> Relancer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => store.setPaymentStatus(p.id, "exonéré")}>
                      <MinusCircle className="mr-1 size-4" /> Exonérer
                    </Button>
                  </>
                )}
                {p.status === "payé" && (
                  <Button size="sm" variant="ghost" onClick={() => store.setPaymentStatus(p.id, "à_payer")}>
                    Annuler
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, string> = {
    payé: "bg-[color:color-mix(in_oklab,var(--success)_15%,transparent)] text-[color:var(--success)]",
    à_payer: "bg-[color:color-mix(in_oklab,var(--warning)_18%,transparent)] text-[color:var(--warning)]",
    exonéré: "bg-secondary text-muted-foreground",
  };
  return <Badge variant="secondary" className={map[status] + " border-0"}>{statusLabel[status]}</Badge>;
}
