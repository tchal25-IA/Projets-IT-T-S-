import { createFileRoute } from "@tanstack/react-router";
import { useId, useState, useMemo } from "react";
import { Plane, Car, Train, ExternalLink, Calculator } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/voyage")({
  head: () => ({
    meta: [
      { title: "Voyage & déplacements — Quotidien IA" },
      {
        name: "description",
        content: "Comparez le coût et le temps de vos déplacements : voiture, train ou avion.",
      },
      { property: "og:title", content: "Voyage & déplacements — Quotidien IA" },
      {
        property: "og:description",
        content: "Comparateur multimodal voiture / train / avion — temps et coût total.",
      },
    ],
  }),
  component: VoyagePage,
});

type Mode = "voiture" | "train" | "avion";

type ModeInputs = {
  enabled: boolean;
  duration: number;     // heures
  price: number;        // €/CHF
  extraTime: number;    // temps de trajet aéroport / gare (min)
};

type Inputs = {
  from: string;
  to: string;
  passengers: number;
  voiture: ModeInputs & { distanceKm: number; fuelL100: number; fuelPrice: number; toll: number; parking: number };
  train: ModeInputs;
  avion: ModeInputs & { bagage: number };
};

const DEFAULT: Inputs = {
  from: "",
  to: "",
  passengers: 1,
  voiture: { enabled: true, distanceKm: 550, fuelL100: 7, fuelPrice: 1.9, toll: 40, parking: 20, duration: 5.5, extraTime: 0, price: 0 },
  train: { enabled: true, price: 89, duration: 3.5, extraTime: 30 },
  avion: { enabled: true, price: 120, duration: 1.5, extraTime: 120, bagage: 30 },
};

type Result = {
  mode: Mode;
  label: string;
  icon: React.ReactNode;
  totalCost: number;
  totalTime: number;
  costPP: number;
  color: string;
  bg: string;
};

function calcVoiture(inp: Inputs): number {
  const fuel = (inp.voiture.distanceKm / 100) * inp.voiture.fuelL100 * inp.voiture.fuelPrice;
  return fuel + inp.voiture.toll + inp.voiture.parking;
}

function f(n: number) { return Math.round(n).toLocaleString("fr-CH"); }
function ft(h: number) {
  const total = Math.round(h * 60);
  const hr = Math.floor(total / 60);
  const mn = total % 60;
  return mn === 0 ? `${hr}h` : `${hr}h${String(mn).padStart(2, "0")}`;
}

function VoyagePage() {
  const [inp, setInp] = useState<Inputs>(DEFAULT);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [showCalc, setShowCalc] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const flights = `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(to)}%20from%20${encodeURIComponent(from)}`;
  const maps = `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
  const mapsEmbed = from && to
    ? `https://www.google.com/maps?output=embed&q=${encodeURIComponent(from + " to " + to)}`
    : "";
  const trip = `https://www.trip.com/flights/showfarefirst?dcity=${encodeURIComponent(from)}&acity=${encodeURIComponent(to)}${date ? `&ddate=${date}` : ""}`;

  function prefillComparator() {
    setInp((s) => ({ ...s, from, to }));
    setShowCalc(true);
    setTimeout(() => {
      document.getElementById("comparator")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }


  const results = useMemo<Result[]>(() => {
    const list: Result[] = [];

    if (inp.voiture.enabled) {
      const cost = calcVoiture(inp);
      const totalTime = inp.voiture.duration + inp.voiture.extraTime / 60;
      list.push({
        mode: "voiture",
        label: "Voiture",
        icon: <Car className="h-5 w-5" />,
        totalCost: cost,
        totalTime,
        costPP: cost / inp.passengers,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
      });
    }

    if (inp.train.enabled) {
      const cost = inp.train.price * inp.passengers;
      const totalTime = inp.train.duration + inp.train.extraTime / 60;
      list.push({
        mode: "train",
        label: "Train",
        icon: <Train className="h-5 w-5" />,
        totalCost: cost,
        totalTime,
        costPP: inp.train.price,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
      });
    }

    if (inp.avion.enabled) {
      const cost = (inp.avion.price + inp.avion.bagage) * inp.passengers;
      const totalTime = inp.avion.duration + inp.avion.extraTime / 60;
      list.push({
        mode: "avion",
        label: "Avion",
        icon: <Plane className="h-5 w-5" />,
        totalCost: cost,
        totalTime,
        costPP: inp.avion.price + inp.avion.bagage,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800",
      });
    }

    return list.sort((a, b) => a.totalCost - b.totalCost);
  }, [inp]);

  const cheapest = results[0];
  const fastest = [...results].sort((a, b) => a.totalTime - b.totalTime)[0];

  const setV = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setInp((s) => ({ ...s, [k]: v }));
  const setVoiture = (patch: Partial<Inputs["voiture"]>) => setInp((s) => ({ ...s, voiture: { ...s.voiture, ...patch } }));
  const setTrain = (patch: Partial<Inputs["train"]>) => setInp((s) => ({ ...s, train: { ...s.train, ...patch } }));
  const setAvion = (patch: Partial<Inputs["avion"]>) => setInp((s) => ({ ...s, avion: { ...s.avion, ...patch } }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Plane}
        eyebrow="Module"
        title="Voyage & déplacements"
        description="Préparez vos déplacements : recherche rapide vers Google Maps, Google Flights et Trip.com, prévisualisation directe de l'itinéraire, et comparateur multimodal voiture / train / avion (coût total et temps de porte-à-porte)."
      />

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="font-display text-base font-bold">Comment ça fonctionne</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Saisissez votre départ et votre destination ci-dessous.</li>
          <li>• Ouvrez Google Maps, Google Flights ou Trip.com pré-remplis en un clic, ou visualisez l'itinéraire directement dans l'application.</li>
          <li>• Cliquez sur <em>Pré-remplir le comparateur</em> pour copier ces informations dans le comparateur coût/temps.</li>
        </ul>
      </div>

      {/* Recherche rapide */}
      <div className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card sm:grid-cols-3">
        <div>
          <label htmlFor="trip-from" className="text-xs font-medium text-muted-foreground">De</label>
          <input id="trip-from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Paris" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="trip-to" className="text-xs font-medium text-muted-foreground">Vers</label>
          <input id="trip-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Genève" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="trip-date" className="text-xs font-medium text-muted-foreground">Date</label>
          <input id="trip-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-3">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            disabled={!from || !to}
            className={cn("inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50", showMap && "bg-primary text-primary-foreground border-primary")}
          >
            <ExternalLink className="h-4 w-4" /> {showMap ? "Masquer la carte" : "Afficher la carte"}
          </button>
          <a href={flights} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            <ExternalLink className="h-4 w-4" /> Google Flights
          </a>
          <a href={maps} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            <ExternalLink className="h-4 w-4" /> Ouvrir dans Google Maps
          </a>
          <a href={trip} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            <ExternalLink className="h-4 w-4" /> Trip.com
          </a>
          <button
            type="button"
            onClick={prefillComparator}
            disabled={!from || !to}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Calculator className="h-4 w-4" /> Pré-remplir le comparateur
          </button>
        </div>

        {showMap && mapsEmbed && (
          <div className="sm:col-span-3">
            <div className="overflow-hidden rounded-xl border">
              <iframe
                title="Carte Google Maps"
                src={mapsEmbed}
                className="h-[360px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Google Flights et Trip.com ne permettent pas l'intégration directe dans l'app ; les boutons ci-dessus ouvrent leur recherche pré-remplie dans un nouvel onglet.
            </p>
          </div>
        )}
      </div>

      {/* Comparateur */}
      {showCalc && (
        <div id="comparator" className="space-y-4">

          {/* Paramètres communs */}
          <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-card sm:grid-cols-2">
            <div>
              <label htmlFor="cmp-from" className="text-xs font-medium text-muted-foreground">Origine</label>
              <input id="cmp-from" value={inp.from} onChange={(e) => setV("from", e.target.value)} placeholder="Paris" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="cmp-to" className="text-xs font-medium text-muted-foreground">Destination</label>
              <input id="cmp-to" value={inp.to} onChange={(e) => setV("to", e.target.value)} placeholder="Genève" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="cmp-pax" className="text-xs font-medium text-muted-foreground">Nombre de passagers</label>
              <input id="cmp-pax" type="number" min={1} max={9} value={inp.passengers} onChange={(e) => setV("passengers", Math.max(1, Number(e.target.value)))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Modes */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Voiture */}
            <div className={cn("rounded-2xl border p-5 shadow-card", inp.voiture.enabled ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800" : "bg-card opacity-60")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                  <Car className="h-5 w-5" /> Voiture
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={inp.voiture.enabled} onChange={(e) => setVoiture({ enabled: e.target.checked })} className="accent-amber-600" />
                  Inclure
                </label>
              </div>
              <div className="mt-3 space-y-2">
                <Field label="Distance (km)" value={inp.voiture.distanceKm} onChange={(v) => setVoiture({ distanceKm: v })} />
                <Field label="Consommation (L/100)" value={inp.voiture.fuelL100} onChange={(v) => setVoiture({ fuelL100: v })} step={0.1} />
                <Field label="Prix carburant (€/L)" value={inp.voiture.fuelPrice} onChange={(v) => setVoiture({ fuelPrice: v })} step={0.05} />
                <Field label="Péages (€)" value={inp.voiture.toll} onChange={(v) => setVoiture({ toll: v })} />
                <Field label="Parking (€)" value={inp.voiture.parking} onChange={(v) => setVoiture({ parking: v })} />
                <Field label="Durée trajet (h)" value={inp.voiture.duration} onChange={(v) => setVoiture({ duration: v })} step={0.25} />
              </div>
            </div>

            {/* Train */}
            <div className={cn("rounded-2xl border p-5 shadow-card", inp.train.enabled ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800" : "bg-card opacity-60")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">
                  <Train className="h-5 w-5" /> Train
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={inp.train.enabled} onChange={(e) => setTrain({ enabled: e.target.checked })} className="accent-blue-600" />
                  Inclure
                </label>
              </div>
              <div className="mt-3 space-y-2">
                <Field label="Prix billet / personne (€)" value={inp.train.price} onChange={(v) => setTrain({ price: v })} />
                <Field label="Durée trajet (h)" value={inp.train.duration} onChange={(v) => setTrain({ duration: v })} step={0.25} />
                <Field label="Trajet gare aller+retour (min)" value={inp.train.extraTime} onChange={(v) => setTrain({ extraTime: v })} />
              </div>
            </div>

            {/* Avion */}
            <div className={cn("rounded-2xl border p-5 shadow-card", inp.avion.enabled ? "bg-violet-50/50 dark:bg-violet-950/10 border-violet-200 dark:border-violet-800" : "bg-card opacity-60")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-violet-700 dark:text-violet-400">
                  <Plane className="h-5 w-5" /> Avion
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={inp.avion.enabled} onChange={(e) => setAvion({ enabled: e.target.checked })} className="accent-violet-600" />
                  Inclure
                </label>
              </div>
              <div className="mt-3 space-y-2">
                <Field label="Prix billet / personne (€)" value={inp.avion.price} onChange={(v) => setAvion({ price: v })} />
                <Field label="Bagages / personne (€)" value={inp.avion.bagage} onChange={(v) => setAvion({ bagage: v })} />
                <Field label="Durée vol (h)" value={inp.avion.duration} onChange={(v) => setAvion({ duration: v })} step={0.25} />
                <Field label="Aéroport aller+retour (min)" value={inp.avion.extraTime} onChange={(v) => setAvion({ extraTime: v })} />
              </div>
            </div>
          </div>

          {/* Résultats */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-base font-bold">Comparaison</h2>
              {cheapest && fastest && cheapest.mode !== fastest.mode && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    💰 Moins cher : {cheapest.label}
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    ⚡ Plus rapide : {fastest.label}
                  </span>
                </div>
              )}
              {cheapest && fastest && cheapest.mode === fastest.mode && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  ✓ Meilleur choix global : {cheapest.label}
                </span>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {results.map((r) => (
                  <div key={r.mode} className={cn("rounded-2xl border p-5 shadow-card", r.bg)}>
                    <div className={cn("flex items-center gap-2 font-semibold", r.color)}>
                      {r.icon} {r.label}
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coût total</span>
                        <span className="font-semibold">{f(r.totalCost)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Par personne</span>
                        <span className="font-semibold">{f(r.costPP)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temps total</span>
                        <span className="font-semibold">{ft(r.totalTime)}</span>
                      </div>
                    </div>
                    {(r.mode === cheapest?.mode || r.mode === fastest?.mode) && (
                      <div className="mt-3 flex gap-1">
                        {r.mode === cheapest?.mode && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Le moins cher</span>}
                        {r.mode === fastest?.mode && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Le plus rapide</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs text-muted-foreground">{label}</label>
      <input
        id={id}
        type="number" min={0} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-24 rounded-md border bg-background px-2 py-1 text-right text-xs"
      />
    </div>
  );
}
