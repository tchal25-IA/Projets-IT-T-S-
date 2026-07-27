import { useState } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatAmount } from '@/lib/formatCurrency';
import { checkEligibility, calculateRangs, compareNantissementVsRetrait, calculateEPL } from '@/lib/hypothecaireCalculations';
import { CANTONAL_RATES } from '@/lib/taxCalculations';
import { FinancialDisclaimer } from '@/components/FinancialDisclaimer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const cantonNames: Record<string, string> = {
  ZG: 'Zoug', SZ: 'Schwyz', NW: 'Nidwald', UR: 'Uri', OW: 'Obwald', GL: 'Glaris', AI: 'Appenzell RI',
  TG: 'Thurgovie', LU: 'Lucerne', SO: 'Soleure', AG: 'Argovie', SG: 'St-Gall', AR: 'Appenzell RE',
  SH: 'Schaffhouse', GR: 'Grisons', BL: 'Bâle-Campagne', FR: 'Fribourg', BE: 'Berne', NE: 'Neuchâtel',
  VS: 'Valais', TI: 'Tessin', JU: 'Jura', BS: 'Bâle-Ville', VD: 'Vaud', ZH: 'Zurich', GE: 'Genève',
};

export default function SimulateurHypothequeCHPage() {
  useSimulatorTrack('hypotheque-suisse');
  const [prix, setPrix] = useState(800000);
  const [fondsPropres, setFondsPropres] = useState(200000);
  const [revenu, setRevenu] = useState(150000);
  const [canton, setCanton] = useState('ZH');
  const [capital3a, setCapital3a] = useState(50000);
  const [avoirLPP, setAvoirLPP] = useState(200000);
  const [montantEPL, setMontantEPL] = useState(50000);
  const [age, setAge] = useState(35);

  const elig = checkEligibility(prix, fondsPropres, revenu);
  const rangs = calculateRangs(prix, elig.montantHypotheque);
  const nantissement = compareNantissementVsRetrait(capital3a, canton, revenu);
  const epl = calculateEPL(avoirLPP, montantEPL, age, revenu);

  const rangChartData = [
    { name: '1er rang', montant: rangs.premierRang },
    { name: '2ème rang', montant: rangs.deuxiemeRang },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/simulateurs"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Hypothèque Suisse 🇨🇭</h1>
      </div>

      <Tabs defaultValue="eligibility">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="eligibility">Éligibilité</TabsTrigger>
          <TabsTrigger value="rangs">Rangs</TabsTrigger>
          <TabsTrigger value="nantissement">Nantissement</TabsTrigger>
          <TabsTrigger value="epl">EPL</TabsTrigger>
        </TabsList>

        <TabsContent value="eligibility" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-xl border bg-card p-6">
              <div>
                <Label>Prix du bien : {formatAmount(prix, 'CHF')}</Label>
                <Slider value={[prix]} onValueChange={v => setPrix(v[0])} min={200000} max={2000000} step={10000} className="mt-2" />
              </div>
              <div>
                <Label>Fonds propres : {formatAmount(fondsPropres, 'CHF')}</Label>
                <Slider value={[fondsPropres]} onValueChange={v => setFondsPropres(v[0])} min={0} max={prix} step={5000} className="mt-2" />
              </div>
              <div>
                <Label>Revenu brut annuel : {formatAmount(revenu, 'CHF')}</Label>
                <Slider value={[revenu]} onValueChange={v => setRevenu(v[0])} min={50000} max={500000} step={5000} className="mt-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl border p-5 text-center ${elig.eligible ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                {elig.eligible ? <CheckCircle className="mx-auto h-8 w-8 text-success" /> : <XCircle className="mx-auto h-8 w-8 text-destructive" />}
                <p className="mt-2 font-bold text-lg">{elig.eligible ? 'Éligible ✅' : 'Non éligible ❌'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">Fonds propres min (20%)</p>
                  <p className="text-lg font-semibold">{formatAmount(prix * 0.20, 'CHF')}</p>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">Hypothèque</p>
                  <p className="text-lg font-semibold">{formatAmount(elig.montantHypotheque, 'CHF')}</p>
                </div>
              </div>
              {elig.manque > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  <p className="text-sm">Il te manque <strong>{formatAmount(elig.manque, 'CHF')}</strong> de fonds propres</p>
                </div>
              )}
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Charges théoriques (règle du tiers)</p>
                <p className="font-semibold">{formatAmount(elig.chargesTheoriques, 'CHF')}/an vs max {formatAmount(revenu / 3, 'CHF')}/an</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rangs" className="space-y-6 mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <span className="text-lg font-bold text-primary">1er</span>
                <div>
                  <p className="font-semibold">1er rang : {formatAmount(rangs.premierRang, 'CHF')}</p>
                  <p className="text-xs text-muted-foreground">Jusqu'à 65% du bien. Taux plus bas, pas d'amortissement obligatoire.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <span className="text-lg font-bold text-warning">2e</span>
                <div>
                  <p className="font-semibold">2ème rang : {formatAmount(rangs.deuxiemeRang, 'CHF')}</p>
                  <p className="text-xs text-muted-foreground">65–80% du bien. Amortissement obligatoire en 15 ans.</p>
                  {rangs.amortissementAnnuel > 0 && (
                    <p className="text-xs font-medium mt-1">Amortissement : {formatAmount(rangs.amortissementAnnuel, 'CHF')}/an</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rangChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(v: number) => formatAmount(v, 'CHF')} />
                <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="nantissement" className="space-y-6 mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Le <strong>nantissement</strong> permet de mettre son 3ème pilier en garantie sans le retirer. Tu conserves tes déductions fiscales et ton capital continue de fructifier.</p>
            </div>
            <div>
              <Label>Capital 3ème pilier : {formatAmount(capital3a, 'CHF')}</Label>
              <Slider value={[capital3a]} onValueChange={v => setCapital3a(v[0])} min={0} max={200000} step={5000} className="mt-2" />
            </div>
            <div>
              <Label>Canton</Label>
              <Select value={canton} onValueChange={setCanton}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(cantonNames).sort((a, b) => a[1].localeCompare(b[1])).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Option A : Retrait</p>
              <p className="text-lg font-bold">{formatAmount(nantissement.retraitNet, 'CHF')}</p>
              <p className="text-xs text-muted-foreground">Net après impôt (~8%)</p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
              <p className="text-xs text-muted-foreground mb-1">Option B : Nantissement (10 ans)</p>
              <p className="text-lg font-bold">{formatAmount(nantissement.gainNantissement10ans, 'CHF')}</p>
              <p className="text-xs text-muted-foreground">Économies fiscales conservées</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="epl" className="space-y-6 mt-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong>EPL</strong> (Encouragement à la Propriété du Logement) : retrait anticipé du 2ème pilier pour financer ta résidence principale.</p>
            </div>
            <div>
              <Label>Avoir LPP : {formatAmount(avoirLPP, 'CHF')}</Label>
              <Slider value={[avoirLPP]} onValueChange={v => setAvoirLPP(v[0])} min={20000} max={500000} step={10000} className="mt-2" />
            </div>
            <div>
              <Label>Montant EPL : {formatAmount(montantEPL, 'CHF')}</Label>
              <Slider value={[montantEPL]} onValueChange={v => setMontantEPL(v[0])} min={20000} max={avoirLPP} step={5000} className="mt-2" />
            </div>
            <div>
              <Label>Âge : {age} ans</Label>
              <Slider value={[age]} onValueChange={v => setAge(v[0])} min={25} max={64} step={1} className="mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Montant net</p>
              <p className="text-lg font-semibold">{formatAmount(epl.montantNet, 'CHF')}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Perte rente annuelle</p>
              <p className="text-lg font-semibold text-destructive">{formatAmount(epl.perteRenteEstimee, 'CHF')}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground">Années restantes</p>
              <p className="text-lg font-semibold">{epl.yearsToRetirement} ans</p>
            </div>
          </div>

          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">Ce retrait réduit ta rente de retraite. Pense à rembourser avant tes 65 ans.</p>
          </div>
        </TabsContent>
      </Tabs>

      <FinancialDisclaimer />
    </div>
  );
}
