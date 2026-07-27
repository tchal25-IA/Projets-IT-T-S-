import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Cloud, CloudOff, Check, Printer, Plus, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

/* ─── Constantes ─────────────────────────────────────────── */

const DEFAULT_GOAL = 20000;
const YEARS = [2026, 2027, 2028, 2029, 2030] as const;

type Group = "income" | "fixed" | "transp" | "health" | "life";

type Item = {
  id: string;
  group: Group;
  label: string;
  note: string;
  v26: number;
  v27: number;
  custom?: boolean;
};

const BASE_ITEMS: Item[] = [
  { id: "salaire", group: "income", label: "Salaire net", note: "CHF / mois", v26: 0, v27: 0 },
  { id: "autres", group: "income", label: "Autres revenus", note: "Primes, freelance…", v26: 0, v27: 0 },
  { id: "freelance", group: "income", label: "Revenu complémentaire", note: "Side-projects, IA…", v26: 0, v27: 0 },
  { id: "loyer", group: "fixed", label: "Loyer", note: "", v26: 0, v27: 0 },
  { id: "park2", group: "fixed", label: "Charges / parking", note: "", v26: 0, v27: 0 },
  { id: "credit", group: "transp", label: "Crédit / leasing", note: "", v26: 0, v27: 0 },
  { id: "ess", group: "transp", label: "Carburant", note: "", v26: 0, v27: 0 },
  { id: "peag", group: "transp", label: "Transports publics / péages", note: "", v26: 0, v27: 0 },
  { id: "lamal", group: "health", label: "Assurance maladie", note: "", v26: 0, v27: 0 },
  { id: "compl", group: "health", label: "Complémentaire", note: "", v26: 0, v27: 0 },
  { id: "assAuto", group: "health", label: "Assurance véhicule", note: "", v26: 0, v27: 0 },
  { id: "alim", group: "life", label: "Alimentation", note: "", v26: 0, v27: 0 },
  { id: "tel", group: "life", label: "Téléphone / internet", note: "", v26: 0, v27: 0 },
  { id: "ia", group: "life", label: "Abonnements", note: "", v26: 0, v27: 0 },
];

const GROUPS: { key: Group; lbl: string; ic: string; color: string }[] = [
  { key: "income", lbl: "Revenus", ic: "💵", color: "#1a6645" },
  { key: "fixed", lbl: "Logement & charges", ic: "🏠", color: "#1a4d8c" },
  { key: "transp", lbl: "Transports", ic: "🚗", color: "#a06010" },
  { key: "health", lbl: "Assurances & santé", ic: "🏥", color: "#a32828" },
  { key: "life", lbl: "Vie courante", ic: "🛒", color: "#6a3a9a" },
];

/* ─── Allocation épargne modulable ───────────────────────── */

type BucketKind = "pilier3" | "liquid" | "risky";
type AllocMode = "amount" | "percent";

type Bucket = {
  id: string;
  label: string;
  icon: string;
  rate: string;
  rateNum: number;
  kind: BucketKind;
  color: string;
  mode: AllocMode;
  value: number;
};

const DEFAULT_BUCKETS: Bucket[] = [
  { id: "epargne", label: "Compte épargne", icon: "💰", rate: "~1.5%/an · sécurisé", rateNum: 0.015, kind: "liquid", color: "#2a8050", mode: "amount", value: 0 },
  { id: "titres", label: "Compte-titres (ETF)", icon: "📊", rate: "~6%/an · diversifié", rateNum: 0.06, kind: "liquid", color: "#6a3a9a", mode: "amount", value: 0 },
  { id: "pilier", label: "3e pilier", icon: "🏦", rate: "~3%/an · bloqué retraite", rateNum: 0.03, kind: "pilier3", color: "#1a4d8c", mode: "amount", value: 0 },
  { id: "assvie", label: "Assurance vie", icon: "🛡️", rate: "~3.5%/an", rateNum: 0.035, kind: "liquid", color: "#1a6645", mode: "amount", value: 0 },
  { id: "crypto", label: "Crypto / actifs risqués", icon: "₿", rate: "~12%/an · volatil", rateNum: 0.12, kind: "risky", color: "#c07020", mode: "amount", value: 0 },
];

function bucketAmount(b: Bucket, pool: number): number {
  return b.mode === "amount" ? Math.max(0, b.value) : Math.max(0, Math.round((pool * b.value) / 100));
}

function calc(items: Item[], buckets: Bucket[], yi: number) {
  const get = (it: Item) => (yi === 0 ? it.v26 : it.v27);
  const inc = items.filter((i) => i.group === "income");
  const exp = items.filter((i) => i.group !== "income");
  const sal = inc.reduce((a, i) => a + get(i), 0);
  const expMo = exp.reduce((a, i) => a + get(i), 0);
  const pool = Math.max(0, sal - expMo);
  const allocs = buckets.map((b) => ({ b, amt: bucketAmount(b, pool) }));
  const totSav = allocs.reduce((a, x) => a + x.amt, 0);
  const libre = sal - expMo - totSav;
  const byGroup: Record<Group, number> = { income: 0, fixed: 0, transp: 0, health: 0, life: 0 };
  items.forEach((it) => { byGroup[it.group] += get(it); });
  return { sal, expMo, pool, allocs, totSav, libre, byGroup };
}

type Currency = "CHF" | "EUR";
let CUR: Currency = "CHF";
const locale = () => (CUR === "CHF" ? "fr-CH" : "fr-FR");
const f = (n: number) => Math.round(n).toLocaleString(locale());
const fd = (n: number) => (n > 0 ? "+" : "") + Math.round(n).toLocaleString(locale());
const fc = (n: number) => `${f(n)} ${CUR}`;
const fdc = (n: number) => `${fd(n)} ${CUR}`;

/* ─── Composant principal exporté ────────────────────────── */

export function BudgetSimulator() {
  const [currency, setCurrency] = useState<Currency>("CHF");
  CUR = currency;
  const [items, setItems] = useState<Item[]>(BASE_ITEMS);
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS);
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [goalDate, setGoalDate] = useState<string>("2027-12");

  // ─── Persistance Supabase (par utilisateur) ─────────────────────
  const { session } = useSession();
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "offline">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement initial
  useEffect(() => {
    if (!session) { setHydrated(true); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_budgets")
        .select("data")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      const d = (data?.data ?? {}) as Partial<{
        currency: Currency; items: Item[]; buckets: Bucket[];
        goal: number; startDate: string; goalDate: string;
      }>;
      if (d.currency) setCurrency(d.currency);
      if (Array.isArray(d.items) && d.items.length) setItems(d.items);
      if (Array.isArray(d.buckets) && d.buckets.length) setBuckets(d.buckets);
      if (typeof d.goal === "number") setGoal(d.goal);
      if (d.startDate) setStartDate(d.startDate);
      if (d.goalDate) setGoalDate(d.goalDate);
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [session]);

  // Sauvegarde débatée (600 ms)
  useEffect(() => {
    if (!hydrated) return;
    if (!session) { setSaveState("offline"); return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      const payload = { currency, items, buckets, goal, startDate, goalDate };
      const { error } = await supabase
        .from("user_budgets")
        .upsert({ user_id: session.user.id, data: payload }, { onConflict: "user_id" });
      setSaveState(error ? "offline" : "saved");
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [hydrated, session, currency, items, buckets, goal, startDate, goalDate]);

  const r0 = useMemo(() => calc(items, buckets, 0), [items, buckets]);
  const r1 = useMemo(() => calc(items, buckets, 1), [items, buckets]);

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };
  const addItem = (group: Group) => {
    const id = `${group}-${Date.now()}`;
    setItems((s) => [...s, { id, group, label: "Nouveau poste", note: "", v26: 0, v27: 0, custom: true }]);
  };
  const removeItem = (id: string) => setItems((s) => s.filter((i) => i.id !== id));

  const updateBucket = (id: string, patch: Partial<Bucket>) => {
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };
  const addBucket = () => {
    const id = `autre-${Date.now()}`;
    setBuckets((bs) => [
      ...bs,
      { id, label: "Autre", icon: "✨", rate: "à définir", rateNum: 0.02, kind: "liquid", color: "#888888", mode: "amount", value: 0 },
    ]);
  };
  const removeBucket = (id: string) => setBuckets((bs) => bs.filter((b) => b.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Devise d'affichage</span>
          <SaveIndicator state={saveState} />
        </div>
        <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-0.5 text-xs">
          {(["CHF", "EUR"] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "rounded px-3 py-1 transition-colors",
                currency === c ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "CHF" ? "🇨🇭 CHF" : "🇪🇺 EUR"}
            </button>
          ))}
        </div>
      </div>

      <KpiGrid r0={r0} r1={r1} />

      <SectionTitle n="02">Revenus & dépenses — modifier les valeurs, intitulés et notes</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-[460px_1fr]">
        <Editor items={items} updateItem={updateItem} addItem={addItem} removeItem={removeItem} r0={r0} r1={r1} />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ChartCard title="Répartition · 2026" height="h-80"><ExpensePie r={r0} /></ChartCard>
            <ChartCard title="Répartition · 2027+" height="h-80"><ExpensePie r={r1} /></ChartCard>
          </div>
          <ChartCard title="Revenus / Dépenses / Épargne par année">
            <YearlyBar items={items} buckets={buckets} />
          </ChartCard>
        </div>
      </div>

      <SavingsSection
        buckets={buckets}
        r0={r0}
        r1={r1}
        updateBucket={updateBucket}
        addBucket={addBucket}
        removeBucket={removeBucket}
      />

      <GoalSection items={items} buckets={buckets} goal={goal} setGoal={setGoal} goalDate={goalDate} setGoalDate={setGoalDate} startDate={startDate} setStartDate={setStartDate} />

      <ForecastSection items={items} buckets={buckets} />
    </div>
  );
}

/* ─── Sous-composants ────────────────────────────────────── */

function ChartCard({ title, children, height = "h-64" }: { title: string; children: React.ReactNode; height?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className={cn("w-full", height)}>{children}</div>
    </div>
  );
}

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="rounded-sm bg-muted-foreground/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
        {n}
      </span>
      <h2 className="text-xs font-semibold uppercase tracking-widest">{children}</h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function KpiGrid({ r0, r1 }: { r0: ReturnType<typeof calc>; r1: ReturnType<typeof calc> }) {
  const rate = r0.sal > 0 ? Math.round((r0.totSav / r0.sal) * 100) : 0;
  const kpis = [
    { l: "Revenus 2026", v: f(r0.sal), s: `${CUR} / mois`, c: "text-emerald-600", b: "bg-emerald-500" },
    { l: "Dépenses 2026", v: f(r0.expMo), s: `${CUR} / mois`, c: "text-rose-600", b: "bg-rose-500" },
    { l: "Épargne totale 2026", v: f(r0.totSav), s: `${CUR} / mois · ${rate}% des revenus`, c: "text-blue-600", b: "bg-blue-500" },
    { l: "Loisirs 2026", v: f(r0.libre), s: `${CUR} / mois restants`, c: r0.libre < 0 ? "text-rose-600" : "text-amber-600", b: r0.libre < 0 ? "bg-rose-500" : "bg-amber-500" },
    { l: "Loisirs 2027+", v: f(r1.libre), s: "Après hausse loyer & LaMal", c: r1.libre < 0 ? "text-rose-600" : "text-emerald-600", b: r1.libre < 0 ? "bg-rose-500" : "bg-emerald-500" },
  ];
  return (
    <>
      <SectionTitle n="01">Situation mensuelle</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.l} className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-card">
            <div className={cn("absolute inset-x-0 top-0 h-[3px]", k.b)} />
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className={cn("mt-1 font-display text-2xl leading-none", k.c)}>{k.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.s}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Editor({
  items, updateItem, addItem, removeItem, r0, r1,
}: {
  items: Item[];
  updateItem: (id: string, patch: Partial<Item>) => void;
  addItem: (group: Group) => void;
  removeItem: (id: string) => void;
  r0: ReturnType<typeof calc>;
  r1: ReturnType<typeof calc>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-3">
        <h3 className="font-display text-base">Tableau de bord éditable</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Tous champs actifs
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-muted print:hidden"
          >
            <Printer className="h-3 w-3" /> Imprimer
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
        {GROUPS.map((g) => {
          const groupItems = items.filter((i) => i.group === g.key);
          return (
            <div key={g.key} className="mb-3">
              <div className="flex items-center gap-2 px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{g.ic}</span> <span>{g.lbl}</span>
                <span className="h-px flex-1 bg-border" />
                <button
                  type="button"
                  onClick={() => addItem(g.key)}
                  className="inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal hover:bg-muted"
                  aria-label={`Ajouter une ligne dans ${g.lbl}`}
                >
                  <Plus className="h-2.5 w-2.5" /> Ajouter
                </button>
              </div>
              <div className="grid grid-cols-[1fr_64px_64px_36px_20px] gap-1 px-3 pb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>Poste</span>
                <span className="text-right">2026</span>
                <span className="text-right">2027</span>
                <span className="text-right">Δ</span>
                <span />
              </div>
              {groupItems.map((it) => {
                const delta = it.v27 - it.v26;
                return (
                  <div key={it.id} className="grid grid-cols-[1fr_64px_64px_36px_20px] items-center gap-1 px-3 py-1 hover:bg-muted/40">
                    <div className="min-w-0 space-y-0.5">
                      <input
                        type="text"
                        value={it.label}
                        onChange={(e) => updateItem(it.id, { label: e.target.value })}
                        className="w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-[12px] leading-tight hover:border-border focus:border-primary focus:bg-background focus:outline-none"
                      />
                      <input
                        type="text"
                        value={it.note}
                        placeholder="note (facultatif)"
                        onChange={(e) => updateItem(it.id, { note: e.target.value })}
                        className="w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-[10px] text-muted-foreground hover:border-border focus:border-primary focus:bg-background focus:outline-none"
                      />
                    </div>
                    <NumberInput value={it.v26} onChange={(n) => updateItem(it.id, { v26: n })} />
                    <NumberInput value={it.v27} onChange={(n) => updateItem(it.id, { v27: n })} />
                    <div className={cn("text-right text-[11px] font-semibold", delta > 0 ? (g.key === "income" ? "text-emerald-600" : "text-rose-600") : delta < 0 ? (g.key === "income" ? "text-rose-600" : "text-emerald-600") : "text-muted-foreground")}>
                      {delta === 0 ? "—" : fd(delta)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="rounded p-0.5 text-muted-foreground/60 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      aria-label={`Supprimer ${it.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="space-y-1 border-t bg-muted/50 px-4 py-3 text-xs">
        <Row l="💵 Revenus" v={`${fc(r0.sal)}`} v2={`${fc(r1.sal)}`} />
        <Row l="🏠 Dépenses" v={`${fc(r0.expMo)}`} v2={`${fc(r1.expMo)}`} />
        <Row l="💰 Épargne allouée" v={`${fc(r0.totSav)}`} v2={`${fc(r1.totSav)}`} bold />
        <Row l="✦ Loisirs / buffer 2026" v={`${fc(r0.libre)}`} solo positive={r0.libre >= 0} />
        <Row l="✦ Loisirs / buffer 2027" v={`${fc(r1.libre)}`} solo positive={r1.libre >= 0} />
      </div>
    </div>
  );
}

function Row({ l, v, v2, bold, solo, positive }: { l: string; v: string; v2?: string; bold?: boolean; solo?: boolean; positive?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "border-t pt-2 font-semibold text-foreground", solo && (positive ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"))}>
      <span>{l}</span>
      {v2 ? <span className="flex gap-4"><span>{v}</span><span>{v2}</span></span> : <span>{v}</span>}
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number" min={0} step={1} value={Math.round(value)}
      onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
      className="w-full rounded-md border bg-background px-1.5 py-1 text-right text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  );
}

function ExpensePie({ r }: { r: ReturnType<typeof calc> }) {
  const data = GROUPS.filter((g) => g.key !== "income").map((g) => ({
    name: g.lbl,
    value: r.byGroup[g.key],
    color: g.color,
  }));
  data.push({ name: "Épargne", value: r.totSav, color: "#2a8050" });
  data.push({ name: "Loisirs", value: Math.max(0, r.libre), color: "#c07020" });
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={1} cx="50%" cy="40%">
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v: number) => `${fc(v)}`} />
        <Legend wrapperStyle={{ fontSize: 10 }} layout="horizontal" verticalAlign="bottom" align="center" />
      </PieChart>
    </ResponsiveContainer>
  );
}

function YearlyBar({ items, buckets }: { items: Item[]; buckets: Bucket[] }) {
  const data = YEARS.map((yr, i) => {
    const r = calc(items, buckets, i <= 1 ? i : 1);
    return { year: String(yr), Revenus: r.sal, Dépenses: r.expMo, Épargne: r.totSav };
  });
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="year" fontSize={11} />
        <YAxis fontSize={11} />
        <Tooltip formatter={(v: number) => `${fc(v)}`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Revenus" fill="#1a6645" radius={3} />
        <Bar dataKey="Dépenses" fill="#a32828" radius={3} />
        <Bar dataKey="Épargne" fill="#1a4d8c" radius={3} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SavingsSection({
  buckets, r0, r1, updateBucket, addBucket, removeBucket,
}: {
  buckets: Bucket[];
  r0: ReturnType<typeof calc>;
  r1: ReturnType<typeof calc>;
  updateBucket: (id: string, patch: Partial<Bucket>) => void;
  addBucket: () => void;
  removeBucket: (id: string) => void;
}) {
  const tot26 = r0.totSav || 1;
  const pieData = r0.allocs.map(({ b, amt }) => ({ name: b.label, value: amt, color: b.color }));
  const over26 = r0.libre < 0;

  return (
    <div className="space-y-4">
      <SectionTitle n="03">Allocation de l'épargne · modulable</SectionTitle>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-4 py-3">
          <div>
            <h3 className="font-display text-base">Buckets d'épargne</h3>
            <p className="text-[11px] text-muted-foreground">
              Pool disponible 2026 : <strong className="text-foreground">{fc(r0.pool)}</strong> · 2027+ :{" "}
              <strong className="text-foreground">{fc(r1.pool)}</strong> (revenus − dépenses).
            </p>
          </div>
          <button
            type="button"
            onClick={addBucket}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-card"
          >
            <Plus className="h-3 w-3" /> Ajouter un bucket
          </button>
        </div>

        <div className="divide-y">
          {buckets.map((b) => {
            const amt26 = bucketAmount(b, r0.pool);
            const amt27 = bucketAmount(b, r1.pool);
            const pct = Math.round((amt26 / tot26) * 100);
            return (
              <div key={b.id} className="grid items-center gap-2 px-4 py-3 sm:grid-cols-[28px_1fr_120px_110px_90px_90px_28px]">
                <div className="text-lg">{b.icon}</div>
                <div className="min-w-0">
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => updateBucket(b.id, { label: e.target.value })}
                    className="w-full truncate rounded-md border bg-background px-2 py-1 text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{b.rate} · {pct}% de l'épargne</div>
                </div>
                <select
                  value={b.kind}
                  onChange={(e) => updateBucket(b.id, { kind: e.target.value as BucketKind })}
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                  aria-label="Type de placement"
                >
                  <option value="liquid">Liquide</option>
                  <option value="pilier3">3e pilier (bloqué)</option>
                  <option value="risky">Risqué</option>
                </select>
                <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => updateBucket(b.id, { mode: "amount" })}
                    className={cn("flex-1 rounded px-2 py-0.5 transition-colors", b.mode === "amount" ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    {CUR}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateBucket(b.id, { mode: "percent" })}
                    className={cn("flex-1 rounded px-2 py-0.5 transition-colors", b.mode === "percent" ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  step={b.mode === "percent" ? 1 : 10}
                  max={b.mode === "percent" ? 100 : undefined}
                  value={b.value}
                  onChange={(e) => updateBucket(b.id, { value: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full rounded-md border bg-background px-2 py-1 text-right text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="text-right text-xs">
                  <div className="font-semibold" style={{ color: b.color }}>{fc(amt26)}</div>
                  <div className="text-[10px] text-muted-foreground">2027 : {f(amt27)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBucket(b.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                  aria-label={`Supprimer ${b.label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {buckets.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Aucun bucket. Cliquez sur « Ajouter un bucket » pour commencer.
            </div>
          )}
        </div>

        <div className={cn("flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs",
          over26 ? "bg-rose-50 dark:bg-rose-950/30" : "bg-muted/50")}>
          <span>
            Total alloué 2026 :{" "}
            <strong className="text-foreground">{fc(r0.totSav)}</strong> /{" "}
            <span className="text-muted-foreground">{fc(r0.pool)}</span>
          </span>
          <span className={cn("font-semibold", over26 ? "text-rose-600" : r0.libre > 0 ? "text-amber-600" : "text-emerald-600")}>
            {over26 ? `⚠ Dépassement de ${fc(-r0.libre)}` : `Loisirs / buffer : ${fc(r0.libre)}`}
          </span>
        </div>
      </div>

      <ChartCard title="Allocation épargne 2026 · camembert" height="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} cx="50%" cy="40%">
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `${fc(v)}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function GoalSection({
  items, buckets, goal, setGoal, goalDate, setGoalDate, startDate, setStartDate,
}: {
  items: Item[];
  buckets: Bucket[];
  goal: number;
  setGoal: (n: number) => void;
  goalDate: string;
  setGoalDate: (s: string) => void;
  startDate: string;
  setStartDate: (s: string) => void;
}) {
  const data = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const [sy, sm] = startDate.split("-").map(Number);
    const [gy, gm] = goalDate.split("-").map(Number);
    const start = new Date(sy, (sm || 1) - 1, 1);
    const end = new Date(gy, (gm || 1) - 1, 1);
    const totalMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
    const cap = Math.min(totalMonths, 120);
    const rows: { label: string; cap: number; goal: number }[] = [];
    let cum = 0;
    for (let i = 0; i < cap; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const yi = d.getFullYear() <= 2026 ? 0 : 1;
      const r = calc(items, buckets, yi);
      const liquidMo = r.allocs.filter((a) => a.b.kind !== "pilier3").reduce((s, a) => s + a.amt, 0);
      cum += liquidMo;
      rows.push({ label: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, cap: Math.round(cum), goal });
    }
    return rows;
  }, [items, buckets, goal, startDate, goalDate]);

  const final = data[data.length - 1]?.cap ?? 0;
  const pct = goal > 0 ? Math.min(100, Math.round((final / goal) * 100)) : 0;
  const gap = final - goal;
  const ok = gap >= 0;
  const goalLabel = useMemo(() => {
    const [gy, gm] = goalDate.split("-").map(Number);
    const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    return `${monthNames[(gm || 1) - 1]} ${gy}`;
  }, [goalDate]);

  return (
    <div className="space-y-4">
      <SectionTitle n="04">Objectif épargne · {fc(goal)} d'ici {goalLabel}</SectionTitle>
      <div className="rounded-2xl border-2 border-amber-500 bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-lg">Objectif · {fc(goal)} d'ici {goalLabel}</h3>
          <div className="font-display text-3xl text-amber-600">{pct}%</div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Montant objectif ({CUR})</label>
            <input
              type="number" min={0} step={1000} value={goal}
              onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Début de l'épargne</label>
            <input
              type="month" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Échéance objectif</label>
            <input
              type="month" value={goalDate} min={startDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Épargne liquide cumulée (hors 3e pilier bloqué) sur {data.length} mois.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
            {ok ? "✓ Objectif atteint !" : "✗ Objectif non atteint"}
          </span>
          <span className="text-xs text-muted-foreground">
            Capital : <strong className="text-foreground">{fc(final)}</strong> ·{" "}
            {ok ? "surplus" : "manque"} :{" "}
            <strong className={ok ? "text-emerald-600" : "text-rose-600"}>{fdc(gap)}</strong>
          </span>
        </div>
      </div>
      <ChartCard title="Montée en capital · mois par mois">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" fontSize={10} />
            <YAxis fontSize={10} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
            <Tooltip formatter={(v: number) => `${fc(v)}`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="cap" name="Capital cumulé" stroke="#a06010" strokeWidth={2} dot={{ r: 2 }} />
            <ReferenceLine y={goal} stroke="#1a6645" strokeDasharray="6 4" label={{ value: `Objectif ${f(goal)}`, fontSize: 10, fill: "#1a6645" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* ─── Projections sur 5 ans ──────────────────────────────── */

function dynamicNote(opts: { libre: number; sav: number; sal: number; deltaSav: number; deltaLibre: number; isFirst: boolean }): { txt: string; tone: "ok" | "warn" | "bad" | "info" } {
  const { libre, sav, sal, deltaSav, deltaLibre, isFirst } = opts;
  if (libre < 0) return { txt: `⚠ Déficit ${fc(-libre)}/mois`, tone: "bad" };
  const savPct = sal > 0 ? Math.round((sav / sal) * 100) : 0;
  if (isFirst) return { txt: `Année de référence · épargne ${savPct}%`, tone: "info" };
  const parts: string[] = [];
  if (deltaSav !== 0) parts.push(`épargne ${fd(deltaSav)}`);
  if (deltaLibre !== 0) parts.push(`loisirs ${fd(deltaLibre)}`);
  const tone: "ok" | "warn" | "info" = libre < 200 ? "warn" : libre > 800 ? "ok" : "info";
  const base = parts.length ? parts.join(" · ") : `stable · épargne ${savPct}%`;
  return { txt: base, tone };
}

function ForecastSection({ items, buckets }: { items: Item[]; buckets: Bucket[] }) {
  const rows = useMemo(() => {
    const pilier3Buckets = buckets.filter((b) => b.kind === "pilier3");
    const liquidBuckets = buckets.filter((b) => b.kind === "liquid");
    const riskyBuckets = buckets.filter((b) => b.kind === "risky");
    const weightedRate = (bs: Bucket[], pool: number): { mo: number; rate: number } => {
      let mo = 0;
      let rateSum = 0;
      bs.forEach((b) => {
        const a = bucketAmount(b, pool);
        mo += a;
        rateSum += a * b.rateNum;
      });
      return { mo, rate: mo > 0 ? rateSum / mo : 0 };
    };

    let c3p = 0, cLiq = 0, cRsk = 0;
    let prevSav = 0, prevLibre = 0;
    return YEARS.map((yr, i) => {
      const r = calc(items, buckets, i <= 1 ? i : 1);
      // 2026 supposée démarrer en mai → 8 mois; les années suivantes pleines
      const mo = i === 0 ? 8 : 12;
      const p = weightedRate(pilier3Buckets, r.pool);
      const l = weightedRate(liquidBuckets, r.pool);
      const k = weightedRate(riskyBuckets, r.pool);
      c3p = c3p * (1 + p.rate) + p.mo * mo;
      cLiq = cLiq * (1 + l.rate) + l.mo * mo;
      cRsk = cRsk * (1 + k.rate) + k.mo * mo;
      const tot = c3p + cLiq + cRsk;
      const note = dynamicNote({
        libre: r.libre, sav: r.totSav, sal: r.sal,
        deltaSav: r.totSav - prevSav, deltaLibre: r.libre - prevLibre,
        isFirst: i === 0,
      });
      prevSav = r.totSav; prevLibre = r.libre;
      return {
        yr, sal: r.sal, exp: r.expMo, sav: r.totSav, libre: r.libre,
        c3p: Math.round(c3p), cLiq: Math.round(cLiq), cRsk: Math.round(cRsk), tot: Math.round(tot),
        note, i, mo,
      };
    });
  }, [items, buckets]);

  return (
    <div className="space-y-4">
      <SectionTitle n="05">Projections sur 5 ans</SectionTitle>
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tableau prévisionnel annuel</div>
          <div className="text-[10px] text-muted-foreground">
            Hypothèses : 2026 = 8 mois (démarrage mai) · 2027+ = 12 mois · rendement annuel pondéré par bucket.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b-2 border-foreground">
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 text-left">Année</th>
                <th className="px-2 py-2 text-right">Mois</th>
                <th className="px-2 py-2 text-right">Revenus/mois</th>
                <th className="px-2 py-2 text-right">Dépenses</th>
                <th className="px-2 py-2 text-right">Épargne</th>
                <th className="px-2 py-2 text-right">Loisirs</th>
                <th className="px-2 py-2 text-right">3e pilier</th>
                <th className="px-2 py-2 text-right">Liquide</th>
                <th className="px-2 py-2 text-right">Risqué</th>
                <th className="px-2 py-2 text-right">Capital total</th>
                <th className="px-2 py-2 text-right">Indicateur</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.yr} className="border-b">
                  <td className="px-2 py-2 font-semibold">{r.yr}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{r.mo}</td>
                  <td className="px-2 py-2 text-right">{fc(r.sal)}</td>
                  <td className="px-2 py-2 text-right text-rose-600">{fc(r.exp)}</td>
                  <td className="px-2 py-2 text-right text-blue-600">{fc(r.sav)}</td>
                  <td className={cn("px-2 py-2 text-right", r.libre < 0 ? "text-rose-600" : r.libre < 400 ? "text-amber-600" : "text-emerald-600")}>{fc(r.libre)}</td>
                  <td className="px-2 py-2 text-right text-blue-600">{fc(r.c3p)}</td>
                  <td className="px-2 py-2 text-right text-emerald-600">{fc(r.cLiq)}</td>
                  <td className="px-2 py-2 text-right text-amber-600">{fc(r.cRsk)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{fc(r.tot)}</td>
                  <td className="px-2 py-2 text-right">
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      r.note.tone === "bad" && "bg-rose-100 text-rose-700",
                      r.note.tone === "warn" && "bg-amber-100 text-amber-700",
                      r.note.tone === "ok" && "bg-emerald-100 text-emerald-700",
                      r.note.tone === "info" && "bg-blue-100 text-blue-700",
                    )}>
                      {r.note.txt}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Note : les indicateurs sont calculés dynamiquement à partir de vos saisies (delta d'épargne, marge de loisirs, déficit éventuel). Aucun événement n'est codé en dur.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Capital cumulé par poche · 5 ans">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="yr" fontSize={11} />
              <YAxis fontSize={10} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
              <Tooltip formatter={(v: number) => `${fc(v)}`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="c3p" name="3e Pilier" stroke="#1a4d8c" strokeWidth={2} />
              <Line type="monotone" dataKey="cLiq" name="Liquide" stroke="#1a6645" strokeWidth={2} />
              <Line type="monotone" dataKey="cRsk" name="Risqué" stroke="#c07020" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Capital total fin d'année">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="yr" fontSize={11} />
              <YAxis fontSize={10} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
              <Tooltip formatter={(v: number) => `${fc(v)}`} />
              <Line type="monotone" dataKey="tot" name="Capital total" stroke="#a06010" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "offline" }) {
  if (state === "idle") return null;
  if (state === "offline") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <CloudOff className="h-3 w-3" /> Non connecté — non enregistré
      </span>
    );
  }
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <Cloud className="h-3 w-3 animate-pulse" /> Enregistrement…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
      <Check className="h-3 w-3" /> Enregistré
    </span>
  );
}
