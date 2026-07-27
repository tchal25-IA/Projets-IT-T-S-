import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────── */

type AmortizationRow = {
  month: number;
  year: number;
  monthOfYear: number;
  payment: number;
  principal: number;
  interest: number;
  insurance: number;
  totalPayment: number;
  remainingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
};

type YearlyRow = {
  year: number;
  avgPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalInsurance: number;
  endingBalance: number;
};

/* ─── Formatters ─────────────────────────────────────────── */

const fmtEur = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

const fmtEurDec = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const fmtPct = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v / 100);

/* ─── Calculs ────────────────────────────────────────────── */

function computeAmortization(
  loanAmount: number,
  annualRate: number,
  durationYears: number,
  annualInsuranceRate: number
): AmortizationRow[] {
  const n = durationYears * 12;
  const monthlyRate = annualRate / 100 / 12;
  const monthlyInsurance = (loanAmount * annualInsuranceRate) / 100 / 12;

  let payment: number;
  if (monthlyRate === 0) {
    payment = loanAmount / n;
  } else {
    payment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  }

  const rows: AmortizationRow[] = [];
  let balance = loanAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let i = 1; i <= n; i++) {
    const interestPart = balance * monthlyRate;
    const principalPart = payment - interestPart;
    balance = Math.max(0, balance - principalPart);
    cumulativePrincipal += principalPart;
    cumulativeInterest += interestPart;

    rows.push({
      month: i,
      year: Math.ceil(i / 12),
      monthOfYear: ((i - 1) % 12) + 1,
      payment,
      principal: principalPart,
      interest: interestPart,
      insurance: monthlyInsurance,
      totalPayment: payment + monthlyInsurance,
      remainingBalance: balance,
      cumulativePrincipal,
      cumulativeInterest,
    });
  }

  return rows;
}

function aggregateYearly(rows: AmortizationRow[]): YearlyRow[] {
  const map = new Map<number, AmortizationRow[]>();
  for (const r of rows) {
    if (!map.has(r.year)) map.set(r.year, []);
    map.get(r.year)!.push(r);
  }

  return Array.from(map.entries()).map(([year, months]) => ({
    year,
    avgPayment: months.reduce((s, m) => s + m.totalPayment, 0) / months.length,
    totalPrincipal: months.reduce((s, m) => s + m.principal, 0),
    totalInterest: months.reduce((s, m) => s + m.interest, 0),
    totalInsurance: months.reduce((s, m) => s + m.insurance, 0),
    endingBalance: months[months.length - 1].remainingBalance,
  }));
}

/* ─── Sub-components ─────────────────────────────────────── */

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border rounded-2xl shadow-card p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-display text-primary font-bold">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  unit?: string;
};

function SliderField({ label, value, min, max, step, onChange, format, unit }: SliderFieldProps) {
  const display = format ? format(value) : String(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <span className="text-sm font-bold text-primary">
          {display}
          {unit && <span className="text-muted-foreground font-normal ml-0.5">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-2 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{format ? format(min) : min}{unit}</span>
        <span>{format ? format(max) : max}{unit}</span>
      </div>
    </div>
  );
}

/* ─── Custom Tooltip ─────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-xl shadow-card p-3 text-xs space-y-1">
      <p className="font-semibold text-primary mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name} :</span>
          <span className="font-bold">{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export function MortgageSimulator() {
  const [prixBien, setPrixBien] = useState(350_000);
  const [apport, setApport] = useState(70_000);
  const [tauxNominal, setTauxNominal] = useState(3.5);
  const [duree, setDuree] = useState(20);
  const [tauxAssurance, setTauxAssurance] = useState(0.3);
  const [showMonthly, setShowMonthly] = useState(false);

  const apportMax = prixBien;

  const { rows, yearlyRows, kpi } = useMemo(() => {
    const loanAmount = Math.max(0, prixBien - apport);
    const n = duree * 12;

    const rows = loanAmount > 0 ? computeAmortization(loanAmount, tauxNominal, duree, tauxAssurance) : [];
    const yearlyRows = aggregateYearly(rows);

    const monthlyPayment = rows.length > 0 ? rows[0].payment : 0;
    const monthlyInsurance = (loanAmount * tauxAssurance) / 100 / 12;
    const monthlyTotal = monthlyPayment + monthlyInsurance;
    const totalInsurance = monthlyInsurance * n;
    const coutTotal = monthlyTotal * n;
    const totalInterets = coutTotal - loanAmount - totalInsurance;
    const pctApport = prixBien > 0 ? (apport / prixBien) * 100 : 0;

    return {
      rows,
      yearlyRows,
      kpi: {
        loanAmount,
        monthlyTotal,
        totalInterets: Math.max(0, totalInterets),
        coutTotal,
        pctApport,
      },
    };
  }, [prixBien, apport, tauxNominal, duree, tauxAssurance]);

  /* Chart data */
  const chartDataYearly = yearlyRows.map((y) => ({
    name: `Année ${y.year}`,
    "Capital restant": Math.round(y.endingBalance),
    "Capital remboursé": Math.round(rows.find((r) => r.year === y.year && r.monthOfYear === Math.min(12, rows.filter((rr) => rr.year === y.year).length))?.cumulativePrincipal ?? 0),
    "Intérêts payés": Math.round(rows.find((r) => r.year === y.year && r.monthOfYear === Math.min(12, rows.filter((rr) => rr.year === y.year).length))?.cumulativeInterest ?? 0),
  }));

  const first24 = rows.slice(0, 24);
  const monthlyChartData = first24.map((r) => ({
    name: `M${r.month}`,
    "Capital restant": Math.round(r.remainingBalance),
    "Capital remboursé": Math.round(r.cumulativePrincipal),
    "Intérêts payés": Math.round(r.cumulativeInterest),
  }));

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-primary">Simulateur de Crédit Immobilier</h2>
          <p className="text-muted-foreground text-sm mt-1">Calculez votre mensualité et visualisez l'amortissement de votre prêt.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted print:hidden"
        >
          <Printer className="h-4 w-4" /> Imprimer
        </button>
      </div>

      {/* Inputs */}
      <div className="bg-card border rounded-2xl shadow-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderField
          label="Prix du bien"
          value={prixBien}
          min={50_000}
          max={2_000_000}
          step={5_000}
          onChange={setPrixBien}
          format={fmtEur}
        />
        <SliderField
          label="Apport personnel"
          value={apport}
          min={0}
          max={apportMax}
          step={1_000}
          onChange={(v) => setApport(Math.min(v, apportMax))}
          format={fmtEur}
        />
        <SliderField
          label="Taux nominal annuel"
          value={tauxNominal}
          min={0.5}
          max={8}
          step={0.05}
          onChange={setTauxNominal}
          unit=" %"
          format={(v) => v.toFixed(2)}
        />
        <SliderField
          label="Durée"
          value={duree}
          min={5}
          max={30}
          step={1}
          onChange={setDuree}
          unit=" ans"
        />
        <SliderField
          label="Taux assurance annuel"
          value={tauxAssurance}
          min={0}
          max={1.5}
          step={0.01}
          onChange={setTauxAssurance}
          unit=" %"
          format={(v) => v.toFixed(2)}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Mensualité totale"
          value={fmtEurDec(kpi.monthlyTotal)}
          sub="assurance incluse"
        />
        <KpiCard
          label="Montant emprunté"
          value={fmtEur(kpi.loanAmount)}
        />
        <KpiCard
          label="Total intérêts"
          value={fmtEur(kpi.totalInterets)}
        />
        <KpiCard
          label="Coût total du crédit"
          value={fmtEur(kpi.coutTotal)}
          sub="capital + intérêts + assurance"
        />
        <KpiCard
          label="% d'apport"
          value={fmtPct(kpi.pctApport)}
          sub={`${fmtEur(apport)} / ${fmtEur(prixBien)}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capital restant dû */}
        <div className="bg-card border rounded-2xl shadow-card p-5">
          <h3 className="font-display font-semibold text-primary mb-4">Capital restant dû (année par année)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartDataYearly} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k€`} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="Capital restant"
                stroke="#1a4d8c"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Capital vs Intérêts cumulés */}
        <div className="bg-card border rounded-2xl shadow-card p-5">
          <h3 className="font-display font-semibold text-primary mb-4">Capital remboursé vs Intérêts cumulés</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartDataYearly} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k€`} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Capital remboursé"
                stackId="1"
                stroke="#1a6645"
                fill="#1a6645"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Intérêts payés"
                stackId="1"
                stroke="#a32828"
                fill="#a32828"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau d'amortissement */}
      <div className="bg-card border rounded-2xl shadow-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-semibold text-primary">Tableau d'amortissement</h3>
          <button
            onClick={() => setShowMonthly((p) => !p)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
              showMonthly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
            )}
          >
            {showMonthly ? "Vue annuelle" : "Voir mois par mois (24 premiers)"}
          </button>
        </div>

        <div className="overflow-x-auto">
          {showMonthly ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-medium">Mois</th>
                  <th className="text-right py-2 pr-4 font-medium">Mensualité</th>
                  <th className="text-right py-2 pr-4 font-medium">Capital</th>
                  <th className="text-right py-2 pr-4 font-medium">Intérêts</th>
                  <th className="text-right py-2 pr-4 font-medium">Assurance</th>
                  <th className="text-right py-2 font-medium">Capital restant</th>
                </tr>
              </thead>
              <tbody>
                {first24.map((r) => (
                  <tr key={r.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 text-muted-foreground">M{r.month}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">{fmtEurDec(r.totalPayment)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs" style={{ color: "#1a6645" }}>{fmtEurDec(r.principal)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs" style={{ color: "#a32828" }}>{fmtEurDec(r.interest)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs text-muted-foreground">{fmtEurDec(r.insurance)}</td>
                    <td className="py-2 text-right font-mono text-xs">{fmtEur(r.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-medium">Année</th>
                  <th className="text-right py-2 pr-4 font-medium">Mensualité moy.</th>
                  <th className="text-right py-2 pr-4 font-medium">Capital remb.</th>
                  <th className="text-right py-2 pr-4 font-medium">Intérêts payés</th>
                  <th className="text-right py-2 pr-4 font-medium">Assurance</th>
                  <th className="text-right py-2 font-medium">Capital restant</th>
                </tr>
              </thead>
              <tbody>
                {yearlyRows.map((y) => (
                  <tr key={y.year} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 pr-4 font-medium">Année {y.year}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">{fmtEurDec(y.avgPayment)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs" style={{ color: "#1a6645" }}>{fmtEur(y.totalPrincipal)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs" style={{ color: "#a32828" }}>{fmtEur(y.totalInterest)}</td>
                    <td className="py-2 pr-4 text-right font-mono text-xs text-muted-foreground">{fmtEur(y.totalInsurance)}</td>
                    <td className="py-2 text-right font-mono text-xs">{fmtEur(y.endingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
