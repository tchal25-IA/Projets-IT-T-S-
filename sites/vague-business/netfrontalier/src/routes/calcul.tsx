import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import {
  CANTON_LABEL,
  COMMUNES,
  calculer,
  formatCHF,
  formatEUR,
  formatPct,
  type Canton,
  type CalcInput,
  type Situation,
} from "@/lib/taxEngine";
import { AlertTriangle, Printer, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/calcul")({
  head: () => ({
    meta: [
      { title: "Calculateur — NetFrontalier" },
      {
        name: "description",
        content:
          "Renseignez votre brut, votre canton et votre situation. NetFrontalier estime instantanément votre net frontalier en CHF et EUR.",
      },
      { property: "og:title", content: "Calculateur salaire net frontalier — NetFrontalier" },
      {
        property: "og:description",
        content: "Estimez votre net frontalier CH → FR en moins d'une minute.",
      },
      { property: "og:url", content: "/calcul" },
    ],
    links: [{ rel: "canonical", href: "/calcul" }],
  }),
  component: CalcPage,
});

function CalcPage() {
  const [input, setInput] = useState<CalcInput>({
    brutMensuelCHF: 7500,
    canton: "GE",
    commune: "Genève (ville)",
    situation: "celibataire",
    enfants: 0,
    tempsPartielPct: 100,
    tauxChange: 0.95,
  });
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const result = useMemo(() => calculer(input), [input]);
  const alt = useMemo(
    () =>
      calculer({
        ...input,
        situation: input.situation === "celibataire" ? "marie" : "celibataire",
      }),
    [input],
  );

  const update = <K extends keyof CalcInput>(k: K, v: CalcInput[K]) => {
    setInput((prev) => ({ ...prev, [k]: v }));
  };

  const communesForCanton = COMMUNES[input.canton];

  const onRequestUnlock = () => {
    if (!hasCalculated) setHasCalculated(true);
    if (!emailUnlocked) setEmailOpen(true);
    else window.print();
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-primary">Calculateur</h1>
          <p className="text-muted-foreground mt-1">
            Estimation transparente de votre net frontalier. Les résultats se mettent à jour en direct.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Form */}
          <Card className="lg:col-span-2 border-border/60 no-print">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Vos paramètres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="brut">Salaire brut mensuel (CHF)</Label>
                <Input
                  id="brut"
                  type="number"
                  min={0}
                  step={100}
                  value={input.brutMensuelCHF}
                  onChange={(e) => update("brutMensuelCHF", Number(e.target.value))}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Montant sur 12 mois (hors 13e).</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Canton</Label>
                  <Select
                    value={input.canton}
                    onValueChange={(v) => {
                      const c = v as Canton;
                      update("canton", c);
                      update("commune", COMMUNES[c][0]);
                    }}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CANTON_LABEL) as Canton[]).map((c) => (
                        <SelectItem key={c} value={c}>{CANTON_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Commune</Label>
                  <Select value={input.commune} onValueChange={(v) => update("commune", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {communesForCanton.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Statut</Label>
                <div className="mt-1.5 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
                  Permis G — Frontalier
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Situation</Label>
                  <Select
                    value={input.situation}
                    onValueChange={(v) => update("situation", v as Situation)}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celibataire">Célibataire</SelectItem>
                      <SelectItem value="marie">Marié·e</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Enfants à charge</Label>
                  <Select
                    value={String(input.enfants)}
                    onValueChange={(v) => update("enfants", Number(v))}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <Label>Temps de travail</Label>
                  <span className="text-sm text-muted-foreground">{input.tempsPartielPct}%</span>
                </div>
                <Slider
                  min={50}
                  max={100}
                  step={5}
                  value={[input.tempsPartielPct]}
                  onValueChange={([v]) => update("tempsPartielPct", v)}
                  className="mt-3"
                />
              </div>

              <div>
                <Label htmlFor="taux">Taux de change CHF → EUR</Label>
                <Input
                  id="taux"
                  type="number"
                  step={0.01}
                  min={0.5}
                  max={1.5}
                  value={input.tauxChange}
                  onChange={(e) => update("tauxChange", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="border-primary/40 bg-card">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Votre net estimé (mensuel)
                    </div>
                    <div className="mt-2 font-serif text-4xl md:text-5xl text-primary">
                      {formatCHF(result.netCHFMensuel)}
                    </div>
                    <div className="text-lg text-muted-foreground mt-1">
                      ≈ {formatEUR(result.netEURMensuel)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground md:text-right">
                    <div>Net annuel : <span className="text-foreground font-medium">{formatCHF(result.netCHFAnnuel)}</span></div>
                    <div>≈ {formatEUR(result.netEURAnnuel)}</div>
                    <div className="mt-1">Prélèvements totaux : {formatPct(result.tauxPrelevementTotal)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <BreakdownRow label="Brut mensuel" value={formatCHF(result.brutMensuel)} tone="neutral" />
              <BreakdownRow
                label="Cotisations sociales"
                value={"− " + formatCHF(result.cotisations.total)}
                tone="minus"
                sub={
                  <>
                    AVS/AI/APG {formatCHF(result.cotisations.avs)} · AC {formatCHF(result.cotisations.ac)} ·
                    AANP {formatCHF(result.cotisations.aanp)} · LPP {formatCHF(result.cotisations.lpp)}
                  </>
                }
              />
              <BreakdownRow
                label="Impôt à la source"
                value={"− " + formatCHF(result.impotSourceMensuel)}
                tone="minus"
                sub={<>Taux effectif : {formatPct(result.tauxImposition)}</>}
              />
              <BreakdownRow
                label="Net en poche"
                value={formatCHF(result.netCHFMensuel)}
                tone="plus"
                sub={<>≈ {formatEUR(result.netEURMensuel)} au taux {input.tauxChange}</>}
              />
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif">
                  Comparaison : {input.situation === "celibataire" ? "si marié·e" : "si célibataire"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-muted-foreground">Net mensuel scénario alternatif</div>
                    <div className="font-serif text-2xl mt-1">{formatCHF(alt.netCHFMensuel)}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">Différence</div>
                    <div className={
                      alt.netCHFMensuel - result.netCHFMensuel >= 0
                        ? "text-primary font-medium"
                        : "text-destructive font-medium"
                    }>
                      {alt.netCHFMensuel - result.netCHFMensuel >= 0 ? "+" : ""}
                      {formatCHF(alt.netCHFMensuel - result.netCHFMensuel)} / mois
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Estimation indicative.</strong> Ne remplace pas
                un fiduciaire, une caisse de compensation ou l'administration fiscale. Barèmes
                simplifiés MVP — à calibrer.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 no-print">
              <Button onClick={onRequestUnlock} className="gap-2">
                {emailUnlocked ? <Printer className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {emailUnlocked ? "Imprimer / PDF" : "Recevoir le PDF détaillé"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> Imprimer maintenant
              </Button>
            </div>
          </div>
        </div>
      </section>

      <EmailModal
        open={emailOpen}
        onOpenChange={setEmailOpen}
        onSuccess={() => {
          setEmailUnlocked(true);
          setEmailOpen(false);
          toast.success("Merci ! Un récapitulatif vous sera envoyé sous peu.");
        }}
      />
    </SiteShell>
  );
}

function BreakdownRow({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone: "neutral" | "plus" | "minus";
}) {
  const toneClass =
    tone === "plus"
      ? "text-primary"
      : tone === "minus"
        ? "text-charcoal"
        : "text-foreground";
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="pt-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`font-serif text-2xl mt-1 ${toneClass}`}>{value}</div>
        {sub ? <div className="text-xs text-muted-foreground mt-1">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

function EmailModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      toast.error("Email invalide");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 600);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">PDF détaillé + sauvegarde scénarios</DialogTitle>
          <DialogDescription>
            Laissez votre email pour recevoir un récapitulatif imprimable et débloquer la
            sauvegarde de vos scénarios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Label htmlFor="mail">Votre email</Label>
          <Input
            id="mail"
            type="email"
            placeholder="prenom@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground">
            Aucun spam. Vous pouvez vous désinscrire en un clic.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Recevoir le PDF"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
