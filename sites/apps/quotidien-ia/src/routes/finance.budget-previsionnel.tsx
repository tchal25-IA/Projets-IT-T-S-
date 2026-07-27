import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { BudgetSimulator } from "@/components/budget-simulator";

export const Route = createFileRoute("/finance/budget-previsionnel")({
  head: () => ({
    meta: [
      { title: "Budget Prévisionnel 2026–2030 — Quotidien IA" },
      {
        name: "description",
        content:
          "Simulateur de budget mensuel et projection 5 ans : salaire net, charges, 3e pilier, objectif immobilier 20k.",
      },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  return (
    <div className="space-y-6">
      <Link
        to="/finance"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à Finance
      </Link>

      <PageHeader
        icon={Wallet}
        eyebrow="Simulateur"
        title="Budget Prévisionnel · 2026–2030"
        description="Saisissez vos revenus, charges et allocations d'épargne pour piloter votre budget et atteindre vos objectifs."
      />

      <Disclaimer variant="finance" />

      <BudgetSimulator />
    </div>
  );
}
