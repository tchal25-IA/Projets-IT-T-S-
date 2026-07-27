import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/adhezia-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Users, Wallet, Timer } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Adhezia" },
      { name: "description", content: "Aperçu des membres actifs, cotisations en retard et encaissements de la saison." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function chf(n: number, currency: string) {
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function Dashboard() {
  const members = useStore((s) => s.members);
  const payments = useStore((s) => s.payments);
  const club = useStore((s) => s.club);

  const stats = useMemo(() => {
    const active = members.filter((m) => m.status === "actif").length;
    const seasonPayments = payments.filter((p) => p.period === club.seasonYear);
    const late = seasonPayments.filter((p) => p.status === "à_payer").length;
    const collected = seasonPayments.filter((p) => p.status === "payé").reduce((s, p) => s + p.amount, 0);
    const expected = seasonPayments.filter((p) => p.status !== "exonéré").reduce((s, p) => s + p.amount, 0);
    return { active, late, collected, expected, pct: expected ? Math.round((collected / expected) * 100) : 0 };
  }, [members, payments, club]);

  const lateList = payments
    .filter((p) => p.period === club.seasonYear && p.status === "à_payer")
    .map((p) => ({ ...p, member: members.find((m) => m.id === p.memberId) }))
    .filter((p) => p.member);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Saison {club.seasonYear}</p>
        <h1 className="text-3xl mt-1">{club.name}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Membres actifs" value={stats.active.toString()} accent="teal" />
        <StatCard icon={Timer} label="Cotisations en retard" value={stats.late.toString()} accent="warning" />
        <StatCard icon={Wallet} label="Encaissé cette saison" value={chf(stats.collected, club.currency)} accent="success" hint={`${stats.pct}% de l'objectif`} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl">Cotisations à relancer</h2>
            <p className="text-sm text-muted-foreground">{lateList.length} membre(s) n'ont pas encore réglé.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/app/cotisations">Voir tout <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
        </div>
        {lateList.length === 0 ? (
          <div className="rounded-lg bg-secondary/60 p-6 text-center text-sm text-muted-foreground">
            Aucun retard. Bravo — la saison est sous contrôle.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {lateList.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="size-4 text-amber-600" />
                  <div>
                    <p className="font-medium">{p.member!.name}</p>
                    <p className="text-xs text-muted-foreground">{p.member!.email}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{chf(p.amount, club.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "teal" | "warning" | "success";
  hint?: string;
}) {
  const accentCls =
    accent === "teal"
      ? "bg-teal-100 text-teal-800"
      : accent === "warning"
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-800";
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={`inline-flex size-10 items-center justify-center rounded-lg ${accentCls}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-0.5">{value}</p>
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-3">{hint}</p>}
    </Card>
  );
}
