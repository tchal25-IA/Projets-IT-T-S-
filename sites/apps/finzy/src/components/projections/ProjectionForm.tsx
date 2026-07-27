import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectionInputs } from '@/lib/projectionCalculations';

const STEPS = ['Ton profil', 'Profil investisseur', 'Situation financière', 'Patrimoine actuel'];

interface Props {
  onSubmit: (data: ProjectionInputs) => void;
}

export function ProjectionForm({ onSubmit }: Props) {
  const { user, profile } = useAuth();
  const market = profile?.market ?? 'FR';
  const currency = market === 'CH' ? 'CHF' : '€';
  const [step, setStep] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasIncomeData, setHasIncomeData] = useState(false);
  const [hasExpenseData, setHasExpenseData] = useState(false);

  // Step 1
  const [birthYear, setBirthYear] = useState(1998);
  const [familyStatus, setFamilyStatus] = useState('celibataire');
  const [professionalStatus, setProfessionalStatus] = useState('jeune_actif');

  // Step 2
  const [knowledgeLevel, setKnowledgeLevel] = useState('debutant');
  const [pastInvestments, setPastInvestments] = useState<string[]>([]);
  const [investmentHorizon, setInvestmentHorizon] = useState('long');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [riskTolerance, setRiskTolerance] = useState('10');
  const [withdrawalPlan, setWithdrawalPlan] = useState('non');

  // Step 3
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [emergencyFund, setEmergencyFund] = useState('3-6mois');

  // Step 4
  const [livrets, setLivrets] = useState(0);
  const [assuranceVie, setAssuranceVie] = useState(0);
  const [bourse, setBourse] = useState(0);
  const [immoPapier, setImmoPapier] = useState(0);
  const [immoPhysique, setImmoPhysique] = useState(0);
  const [alternatifs, setAlternatifs] = useState(0);
  const [epargneRetraite, setEpargneRetraite] = useState(0);

  // Pre-fill from existing data
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Get recurring transactions (main source of monthly budget)
      const { data: recurring } = await supabase
        .from('recurring_transactions')
        .select('type, amount')
        .eq('user_id', user.id);

      // Get current month transactions as fallback
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      
      const { data: txns } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .gte('date', startOfMonth);

      let totalIncome = 0;
      let totalExpenses = 0;

      // Start with recurring transactions (main source of monthly budget)
      if (recurring && recurring.length > 0) {
        totalIncome = recurring.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        totalExpenses = recurring.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      }

      // If no recurring income, check current month transactions
      if (totalIncome === 0 && txns && txns.length > 0) {
        totalIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      }

      // If no recurring expenses, check current month transactions
      if (totalExpenses === 0 && txns && txns.length > 0) {
        totalExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      }

      if (totalIncome > 0) {
        setMonthlyIncome(Math.round(totalIncome));
        setHasIncomeData(true);
      }
      if (totalExpenses > 0) {
        setMonthlyExpenses(Math.round(totalExpenses));
        setHasExpenseData(true);
      }

      // Fetch patrimoine
      const { data: entries } = await supabase
        .from('patrimoine_entries')
        .select('envelope_type, amount')
        .eq('user_id', user.id);
      
      if (entries && entries.length > 0) {
        const byType: Record<string, number> = {};
        entries.forEach(e => {
          const key = e.envelope_type;
          byType[key] = (byType[key] || 0) + Number(e.amount);
        });

        // Mapping exact des types FR
        const frMapping: Record<string, (v: number) => void> = {
          'Épargne réglementée': setLivrets,
          'Assurance Vie': setAssuranceVie,
          'PEA': setBourse,
          'CTO': (v) => setBourse(prev => prev + v),
          'PER': setEpargneRetraite,
          'Crypto': setAlternatifs,
          'Immobilier': setImmoPhysique,
          'Liquidités': (v) => setLivrets(prev => prev + v),
          'Autres': () => {},
        };

        // Mapping exact des types CH
        const chMapping: Record<string, (v: number) => void> = {
          '3ème Pilier A': setAssuranceVie,
          '3ème Pilier B': (v) => setAssuranceVie(prev => prev + v),
          'CTO': setBourse,
          'Crypto': setAlternatifs,
          'Immobilier': setImmoPhysique,
          'Liquidités': setLivrets,
          'Autres': () => {},
        };

        const mapping = market === 'CH' ? chMapping : frMapping;

        Object.entries(byType).forEach(([type, amount]) => {
          const setter = mapping[type];
          if (setter) {
            setter(Math.round(amount));
          }
        });
      }

      setDataLoaded(true);
    };
    fetchData();
  }, [user, market]);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const handleFinish = () => {
    onSubmit({
      birthYear, familyStatus, professionalStatus,
      knowledgeLevel, pastInvestments, investmentHorizon, objectives, riskTolerance, withdrawalPlan,
      monthlyIncome, monthlyExpenses, recurringDebts: '', emergencyFund,
      market,
      patrimoine: { livrets, assuranceVie, bourse, immoPapier, immoPhysique, alternatifs, epargneRetraite },
    });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  // Market-specific options
  const pastInvestmentOptions = market === 'CH'
    ? ['Actions / ETF', '3e pilier A', 'LPP (2e pilier)', 'Immobilier', 'Cryptomonnaies', 'Obligations', 'Private Equity', 'Or / Métaux', 'Aucun']
    : ['Actions / ETF', 'Assurance-vie', 'Immobilier', 'Cryptomonnaies', 'Obligations', 'Private Equity', 'Or / Métaux', 'Aucun'];

  const objectiveOptions = market === 'CH'
    ? ['Constituer une épargne de précaution', 'Créer un apport immobilier', 'Diversifier mes placements', 'Optimiser ma prévoyance (LPP / 3a)', 'Préparer ma retraite', 'Financer un projet personnel']
    : ['Constituer une épargne de précaution', 'Créer un apport immobilier', 'Diversifier mes placements', 'Préparer ma retraite', 'Financer un projet personnel'];

  const patrimoineFields = market === 'CH'
    ? [
        ['Épargne bancaire (compte épargne, privé)', livrets, setLivrets],
        ['3e pilier A & B', assuranceVie, setAssuranceVie],
        ['Bourse (Actions, ETF, Dépôt titres)', bourse, setBourse],
        ['Immobilier papier (Fonds immo, Crowdfunding)', immoPapier, setImmoPapier],
        ['Immobilier physique', immoPhysique, setImmoPhysique],
        ['Alternatifs (PE, Crypto, Or)', alternatifs, setAlternatifs],
        ['LPP / Caisse de pension (2e pilier)', epargneRetraite, setEpargneRetraite],
      ]
    : [
        ['Livrets réglementés (Livret A, LDDS…)', livrets, setLivrets],
        ['Assurance vie', assuranceVie, setAssuranceVie],
        ['Bourse (Actions, ETF, PEA, CTO)', bourse, setBourse],
        ['Immobilier papier (SCPI, Crowdfunding)', immoPapier, setImmoPapier],
        ['Immobilier physique', immoPhysique, setImmoPhysique],
        ['Alternatifs (PE, Crypto, Or)', alternatifs, setAlternatifs],
        ['Épargne retraite (PER)', epargneRetraite, setEpargneRetraite],
      ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'text-primary font-medium' : ''}>{s}</span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-6">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold">👤 Ton profil</h2>
            <div className="space-y-4">
              <div>
                <Label>Année de naissance</Label>
                <Input type="number" value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} min={1940} max={2010} className="mt-1 max-w-xs" />
              </div>
              <div>
                <Label>Situation familiale</Label>
                <RadioGroup value={familyStatus} onValueChange={setFamilyStatus} className="mt-2 space-y-2">
                  {[['celibataire', 'Célibataire'], ['en_couple', 'En couple'], ['famille', 'Famille (enfants)']].map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`fam-${v}`} />
                      <Label htmlFor={`fam-${v}`} className="font-normal">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Statut professionnel</Label>
                <Select value={professionalStatus} onValueChange={setProfessionalStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="etudiant">Étudiant sans revenu</SelectItem>
                    <SelectItem value="etudiant_revenu">Étudiant avec revenu (alternance/stage)</SelectItem>
                    <SelectItem value="jeune_actif">Jeune actif (CDI/CDD/freelance)</SelectItem>
                    <SelectItem value="experimente">En poste depuis plusieurs années</SelectItem>
                    <SelectItem value="recherche">En recherche d'emploi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold">🎯 Profil investisseur</h2>
            <div className="space-y-5">
              <div>
                <Label>Niveau de connaissances en placement</Label>
                <RadioGroup value={knowledgeLevel} onValueChange={setKnowledgeLevel} className="mt-2 space-y-2">
                  {[['debutant', 'Débutant — Je découvre les marchés financiers'], ['intermediaire', 'Intermédiaire — Je connais les bases (actions, ETF, diversification)'], ['avance', 'Avancé — Je maîtrise les différents types de placements']].map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`know-${v}`} />
                      <Label htmlFor={`know-${v}`} className="font-normal text-sm">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Actifs déjà détenus</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {pastInvestmentOptions.map(a => (
                    <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={pastInvestments.includes(a)} onCheckedChange={() => setPastInvestments(toggleArray(pastInvestments, a))} />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Horizon de placement</Label>
                <RadioGroup value={investmentHorizon} onValueChange={setInvestmentHorizon} className="mt-2 space-y-2">
                  {[['court', 'Court terme (< 3 ans)'], ['moyen', 'Moyen terme (3-5 ans)'], ['long', 'Long terme (5-10 ans)'], ['tres_long', 'Très long terme (> 10 ans)']].map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`hor-${v}`} />
                      <Label htmlFor={`hor-${v}`} className="font-normal text-sm">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Objectifs financiers</Label>
                <div className="mt-2 space-y-2">
                  {objectiveOptions.map(o => (
                    <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={objectives.includes(o)} onCheckedChange={() => setObjectives(toggleArray(objectives, o))} />
                      {o}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tolérance au risque (perte max sur 3 ans)</Label>
                <RadioGroup value={riskTolerance} onValueChange={setRiskTolerance} className="mt-2 space-y-2">
                  {[['0', 'Aucune perte'], ['5', 'Perte de 5% max'], ['10', 'Perte de 10% max'], ['20', 'Perte de 20% max'], ['>20', 'Perte > 20% (forte volatilité acceptée)']].map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`risk-${v}`} />
                      <Label htmlFor={`risk-${v}`} className="font-normal text-sm">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Retrait prévu pour un projet ?</Label>
                <RadioGroup value={withdrawalPlan} onValueChange={setWithdrawalPlan} className="mt-2 space-y-2">
                  {[['<2ans', 'Oui, dans les 2 prochaines années'], ['3-5ans', 'Oui, dans 3-5 ans'], ['non', 'Non, épargne long terme']].map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`wd-${v}`} />
                      <Label htmlFor={`wd-${v}`} className="font-normal text-sm">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold">💰 Situation financière</h2>
            {dataLoaded && (hasIncomeData || hasExpenseData) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Pré-rempli depuis ton budget Finzy (transactions récurrentes). Ajuste si besoin.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <Label>Revenu mensuel net ({currency})</Label>
                <Input 
                  type="number" 
                  value={monthlyIncome || ''} 
                  onChange={e => setMonthlyIncome(Number(e.target.value))} 
                  placeholder={market === 'CH' ? 'Ex : 6000' : 'Ex : 2500'} 
                  className="mt-1 max-w-xs" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {market === 'CH' ? 'Revenus nets après déductions sociales' : 'Revenus nets après impôts'}
                </p>
              </div>
              <div>
                <Label>Dépenses mensuelles ({currency})</Label>
                <Input 
                  type="number" 
                  value={monthlyExpenses || ''} 
                  onChange={e => setMonthlyExpenses(Number(e.target.value))} 
                  placeholder={market === 'CH' ? 'Ex : 4000' : 'Ex : 1800'} 
                  className="mt-1 max-w-xs" 
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Capacité d'épargne estimée</span>
                  <span className="text-lg font-bold text-primary">
                    {Math.max(0, monthlyIncome - monthlyExpenses).toLocaleString('fr-FR')} {currency}/mois
                  </span>
                </div>
                {monthlyIncome > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Soit {Math.round((Math.max(0, monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)}% de taux d'épargne
                  </p>
                )}
              </div>
              <div>
                <Label>Épargne de précaution</Label>
                <RadioGroup value={emergencyFund} onValueChange={setEmergencyFund} className="mt-2 space-y-2">
                  {[['3-6mois', 'Oui, 3 à 6 mois de dépenses'], ['<3mois', 'Oui, mais insuffisant (< 3 mois)'], ['aucune', 'Non, pas encore'], ['nsp', 'Je ne sais pas']].map(([v, l]) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`ef-${v}`} />
                      <Label htmlFor={`ef-${v}`} className="font-normal text-sm">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold">🏦 Patrimoine actuel</h2>
            {dataLoaded && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Pré-rempli depuis ton patrimoine Finzy. Mets 0 si tu n'as pas cet actif.
              </div>
            )}
            <div className="space-y-4">
              {patrimoineFields.map(([label, val, setter]) => (
                <div key={label as string}>
                  <Label>{label as string}</Label>
                  <Input 
                    type="number" 
                    value={(val as number) || ''} 
                    onChange={e => (setter as (v: number) => void)(Number(e.target.value))} 
                    placeholder="0" 
                    className="mt-1 max-w-xs" 
                  />
                </div>
              ))}
              <div className="rounded-lg bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total patrimoine</span>
                  <span className="text-lg font-bold text-primary">
                    {(livrets + assuranceVie + bourse + immoPapier + immoPhysique + alternatifs + epargneRetraite).toLocaleString('fr-FR')} {currency}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Suivant <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="gap-2">
              <Sparkles className="h-4 w-4" /> Générer mes projections
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
