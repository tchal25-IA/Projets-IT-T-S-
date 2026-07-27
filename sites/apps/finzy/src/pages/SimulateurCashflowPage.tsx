import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { useState, useMemo } from 'react';
import { useSimulatorTrack } from '@/hooks/useSimulatorTrack';
import { ArrowLeft, Home, Banknote, Calculator, Building2, FileText, HelpCircle, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatAmount } from '@/lib/formatCurrency';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { Currency } from '@/types';

const PIE_COLORS = ['#3B82F6', '#EF4444', '#F97316', '#10B981', '#8B5CF6', '#EC4899'];

type TaxRegime = 'meuble_forfait' | 'lmnp_reel' | 'nu_sci_ir' | 'sci_is';

const TAX_REGIME_INFO: Record<TaxRegime, { label: string; description: string }> = {
  meuble_forfait: { label: 'Meublé forfait (micro-BIC)', description: 'Abattement forfaitaire de 50% sur les revenus' },
  lmnp_reel: { label: 'LMNP réel', description: 'Déduction des charges réelles + amortissements' },
  nu_sci_ir: { label: 'Location nue / SCI à l\'IR', description: 'Revenus fonciers, TMI du foyer' },
  sci_is: { label: 'SCI à l\'IS', description: 'Imposition à l\'IS (15% puis 25%) + amortissements' },
};

export default function SimulateurCashflowPage() {
  useSimulatorTrack('cashflow');
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Simulateur Cashflow Immobilier" />;
  const { profile } = useAuth();
  const location = useLocation();
  const fromInvestissements = location.pathname.includes('/investissements/');
  const currency = (profile?.currency ?? 'EUR') as Currency;
  const isCH = profile?.market === 'CH';

  // Bien immobilier
  const [prix, setPrix] = useState(isCH ? 600000 : 200000);
  const [apport, setApport] = useState(isCH ? 120000 : 40000);
  const [fraisNotaire, setFraisNotaire] = useState(isCH ? 5 : 8);
  const [travaux, setTravaux] = useState(10000);
  const [loyerMensuel, setLoyerMensuel] = useState(isCH ? 1800 : 900);
  const [vacanceLocative, setVacanceLocative] = useState(isCH ? 5 : 8);

  // Charges courantes
  const [chargesCopro, setChargesCopro] = useState(isCH ? 250 : 150);
  const [chargesEauElec, setChargesEauElec] = useState(0);
  
  // Taxes
  const [taxeFonciere, setTaxeFonciere] = useState(isCH ? 0 : 1200);
  
  // Crédit / Hypothèque
  const [tauxCredit, setTauxCredit] = useState(isCH ? 1.8 : 3.5);
  const [dureeCredit, setDureeCredit] = useState(isCH ? 25 : 20);
  
  // Autres charges
  const [assurancePNO, setAssurancePNO] = useState(isCH ? 400 : 200);
  const [fraisGestion, setFraisGestion] = useState(7);
  const [comptabilite, setComptabilite] = useState(isCH ? 0 : 500);
  const [gli, setGli] = useState(0);
  const [autresCharges, setAutresCharges] = useState(200);

  // CH-specific
  const [entretienProvision, setEntretienProvision] = useState(isCH ? 1 : 0); // % du prix/an

  // Simulation fiscale (FR only)
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('meuble_forfait');
  const [tmi, setTmi] = useState(30);
  const [dureeAmortissement, setDureeAmortissement] = useState(25);

  // Calculs de base
  const montantFraisNotaire = prix * (fraisNotaire / 100);
  const investTotal = prix + montantFraisNotaire + travaux;
  const emprunt = prix - apport;
  const monthlyRate = tauxCredit / 100 / 12;
  const months = dureeCredit * 12;
  const mensualiteCredit = monthlyRate > 0 ? (emprunt * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)) : emprunt / months;
  const interetsAnnuels = useMemo(() => {
    let remaining = emprunt;
    let totalInterest = 0;
    for (let m = 0; m < 12; m++) {
      const interestPart = remaining * monthlyRate;
      totalInterest += interestPart;
      remaining -= (mensualiteCredit - interestPart);
    }
    return totalInterest;
  }, [emprunt, monthlyRate, mensualiteCredit]);

  const loyerAnnuel = loyerMensuel * 12;
  const loyerNet = loyerAnnuel * (1 - vacanceLocative / 100);
  const fraisGestionMontant = loyerNet * (fraisGestion / 100);
  
  // Charges détaillées
  const entretienAnnuel = isCH ? prix * (entretienProvision / 100) : 0;
  const chargesCourantesAnnuelles = chargesCopro * 12 + chargesEauElec * 12 + entretienAnnuel;
  const taxesAnnuelles = taxeFonciere;
  const autresChargesAnnuelles = assurancePNO + fraisGestionMontant + comptabilite + gli + autresCharges;
  const chargesAnnuelles = chargesCourantesAnnuelles + taxesAnnuelles + autresChargesAnnuelles;
  
  const creditAnnuel = mensualiteCredit * 12;
  const cashflowAvantImpot = loyerNet - chargesAnnuelles - creditAnnuel;

  // Calcul de l'impôt selon le régime (FR only)
  const impotCalcul = useMemo(() => {
    if (isCH) return { baseImposable: 0, ir: 0, ps: 0, total: 0, detail: 'Fiscalité suisse non simulée — consulte un fiduciaire' };
    const amortissementAnnuel = (prix + travaux) / dureeAmortissement;
    
    switch (taxRegime) {
      case 'meuble_forfait': {
        const baseImposable = loyerNet * 0.5;
        const ir = baseImposable * (tmi / 100);
        const ps = baseImposable * 0.172;
        return { baseImposable, ir, ps, total: ir + ps, detail: `Revenu imposable: ${formatAmount(baseImposable, currency)} (50% de ${formatAmount(loyerNet, currency)})` };
      }
      case 'lmnp_reel': {
        const chargesDeductibles = chargesAnnuelles + interetsAnnuels;
        const baseAvantAmort = loyerNet - chargesDeductibles;
        const amortUtilise = Math.min(amortissementAnnuel, Math.max(0, baseAvantAmort));
        const baseImposable = Math.max(0, baseAvantAmort - amortUtilise);
        const ir = baseImposable * (tmi / 100);
        const ps = baseImposable * 0.172;
        return { baseImposable, ir, ps, total: ir + ps, detail: `Charges déductibles: ${formatAmount(chargesDeductibles, currency)} • Amortissement: ${formatAmount(amortUtilise, currency)}` };
      }
      case 'nu_sci_ir': {
        const chargesDeductibles = chargesAnnuelles + interetsAnnuels;
        const baseImposable = Math.max(0, loyerNet - chargesDeductibles);
        const ir = baseImposable * (tmi / 100);
        const ps = baseImposable * 0.172;
        return { baseImposable, ir, ps, total: ir + ps, detail: `Charges déductibles: ${formatAmount(chargesDeductibles, currency)} (intérêts: ${formatAmount(interetsAnnuels, currency)})` };
      }
      case 'sci_is': {
        const chargesDeductibles = chargesAnnuelles + interetsAnnuels + amortissementAnnuel;
        const baseImposable = Math.max(0, loyerNet - chargesDeductibles);
        let is = 0;
        if (baseImposable <= 42500) { is = baseImposable * 0.15; } else { is = 42500 * 0.15 + (baseImposable - 42500) * 0.25; }
        return { baseImposable, ir: is, ps: 0, total: is, detail: `Amortissement: ${formatAmount(amortissementAnnuel, currency)} • Base IS: ${formatAmount(baseImposable, currency)}` };
      }
    }
  }, [taxRegime, loyerNet, chargesAnnuelles, interetsAnnuels, prix, travaux, dureeAmortissement, tmi, currency, isCH]);

  const cashflowApresImpot = cashflowAvantImpot - impotCalcul.total;
  const cashflowMensuelApresImpot = cashflowApresImpot / 12;
  // For CH, display cashflow before tax as the main metric
  const cashflowMensuelDisplay = isCH ? cashflowAvantImpot / 12 : cashflowMensuelApresImpot;

  const rendementBrut = (loyerAnnuel / prix) * 100;
  const rendementNet = ((loyerNet - chargesAnnuelles) / investTotal) * 100;
  const rendementNetNet = isCH ? rendementNet : (cashflowApresImpot / investTotal) * 100;

  const chargesDetail = [
    { name: isCH ? 'Hypothèque' : 'Crédit', value: Math.round(creditAnnuel) },
    { name: isCH ? 'Charges/PPE' : 'Copro/charges', value: Math.round(chargesCourantesAnnuelles) },
    ...(isCH ? [] : [{ name: 'Taxe foncière', value: taxeFonciere }]),
    { name: 'Assurance/Gestion', value: Math.round(assurancePNO + fraisGestionMontant) },
    { name: 'Autres', value: Math.round(comptabilite + gli + autresCharges) },
    ...(isCH ? [] : [{ name: 'Impôts', value: Math.round(impotCalcul.total) }]),
  ];

  const creditLabel = isCH ? 'Hypothèque' : 'Crédit';

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <Link to={fromInvestissements ? "/investissements/immobilier" : "/simulateurs"}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Cashflow locatif {isCH ? '🇨🇭' : ''}</h1>
          <p className="text-sm text-muted-foreground">{isCH ? 'Simulation complète (hors fiscalité)' : 'Simulation complète avec fiscalité'}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-2 gap-3 ${isCH ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        <div className={`rounded-2xl border p-4 ${cashflowMensuelDisplay >= 0 ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' : 'bg-gradient-to-br from-red-500/10 to-red-500/5'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Banknote className={`h-4 w-4 ${cashflowMensuelDisplay >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isCH ? 'Cashflow/mois' : 'Cashflow net/mois'}</p>
          </div>
          <p className={`text-2xl font-bold ${cashflowMensuelDisplay >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatAmount(cashflowMensuelDisplay, currency)}
          </p>
          {isCH && <p className="text-[9px] text-muted-foreground">avant impôt</p>}
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rendement brut</p>
          <p className="text-2xl font-bold text-blue-600">{rendementBrut.toFixed(1)}%</p>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 to-violet-500/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rendement net</p>
          <p className="text-2xl font-bold text-violet-600">{rendementNet.toFixed(1)}%</p>
        </div>

        {!isCH && (
          <div className="rounded-2xl border bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rendement net-net</p>
            <p className={`text-2xl font-bold ${rendementNetNet >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{rendementNetNet.toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">après impôts</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="bien" className="space-y-4">
        <TabsList className={`grid w-full ${isCH ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="bien" className="gap-1"><Home className="h-3.5 w-3.5" /> Bien & charges</TabsTrigger>
          {!isCH && <TabsTrigger value="fiscalite" className="gap-1"><Calculator className="h-3.5 w-3.5" /> Fiscalité</TabsTrigger>}
          <TabsTrigger value="resultats" className="gap-1"><FileText className="h-3.5 w-3.5" /> Résultats</TabsTrigger>
        </TabsList>

        {/* ONGLET BIEN & CHARGES */}
        <TabsContent value="bien" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bien immobilier */}
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <h3 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Bien immobilier</h3>
              <div>
                <Label>Prix d'achat : {formatAmount(prix, currency)}</Label>
                <Slider value={[prix]} onValueChange={v => setPrix(v[0])} min={50000} max={isCH ? 3000000 : 1000000} step={isCH ? 10000 : 5000} className="mt-2" />
              </div>
              <div>
                <Label>{isCH ? 'Fonds propres' : 'Apport'} : {formatAmount(apport, currency)}</Label>
                <Slider value={[apport]} onValueChange={v => setApport(v[0])} min={0} max={prix} step={1000} className="mt-2" />
                {isCH && apport < prix * 0.20 && (
                  <p className="text-[10px] text-destructive mt-1">⚠ Minimum 20% de fonds propres requis en Suisse</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isCH ? 'Frais acte/registre (%)' : 'Frais notaire (%)'}</Label><Input type="number" value={fraisNotaire} onChange={e => setFraisNotaire(Number(e.target.value))} className="mt-1" /></div>
                <div><Label>Travaux ({currency})</Label><Input type="number" value={travaux} onChange={e => setTravaux(Number(e.target.value))} className="mt-1" /></div>
              </div>
              <div>
                <Label>Loyer mensuel : {formatAmount(loyerMensuel, currency)}</Label>
                <Slider value={[loyerMensuel]} onValueChange={v => setLoyerMensuel(v[0])} min={200} max={isCH ? 8000 : 5000} step={50} className="mt-2" />
              </div>
              <div>
                <Label>Vacance locative : {vacanceLocative}%</Label>
                <Slider value={[vacanceLocative]} onValueChange={v => setVacanceLocative(v[0])} min={0} max={20} step={1} className="mt-2" />
              </div>
            </div>

            {/* Crédit / Hypothèque */}
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" /> {creditLabel}</h3>
                {!isCH && (
                  <Link to="/simulateurs/amortissement">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" /> Tableau d'amortissement
                    </Button>
                  </Link>
                )}
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{isCH ? 'Montant hypothécaire' : 'Montant emprunté'}</p>
                <p className="text-xl font-bold text-primary">{formatAmount(emprunt, currency)}</p>
                {isCH && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Ratio hypothécaire : {((emprunt / prix) * 100).toFixed(0)}% {emprunt / prix > 0.80 ? '⚠ max 80%' : ''}
                  </p>
                )}
              </div>
              <div>
                <Label>{isCH ? 'Taux hypothécaire' : 'Taux'} : {tauxCredit}%</Label>
                <Slider value={[tauxCredit * 100]} onValueChange={v => setTauxCredit(v[0] / 100)} min={isCH ? 50 : 100} max={700} step={5} className="mt-2" />
              </div>
              <div>
                <Label>Durée : {dureeCredit} ans</Label>
                <Slider value={[dureeCredit]} onValueChange={v => setDureeCredit(v[0])} min={5} max={30} step={1} className="mt-2" />
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex justify-between">
                  <span className="text-sm">{isCH ? 'Mensualité hypothécaire' : 'Mensualité crédit'}</span>
                  <span className="font-bold">{formatAmount(mensualiteCredit, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Intérêts 1ère année</span>
                  <span>{formatAmount(interetsAnnuels, currency)}</span>
                </div>
              </div>
              {isCH && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-amber-700 mb-1">💡 Info Suisse</p>
                  <p>En Suisse, l'hypothèque de 1er rang (65%) n'est pas amortie. Seul le 2ème rang (65–80%) doit être amorti en 15 ans. Ce simulateur simplifie avec un amortissement linéaire complet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Charges détaillées */}
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <h3 className="font-semibold">Charges détaillées</h3>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* Charges courantes */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  {isCH ? 'Charges PPE / copropriété' : 'Charges courantes'}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>{isCH ? 'Charges PPE mensuelles (entretien commun, conciergerie, etc.)' : 'Charges récupérables ou non sur le locataire'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h4>
                <div><Label className="text-xs">{isCH ? 'Charges PPE/mois' : 'Charges copro/mois'}</Label><Input type="number" value={chargesCopro} onChange={e => setChargesCopro(Number(e.target.value))} className="mt-1" /></div>
                <div><Label className="text-xs">{isCH ? 'Charges locataire non récup./mois' : 'Eau/Électricité/mois (si non récupéré)'}</Label><Input type="number" value={chargesEauElec} onChange={e => setChargesEauElec(Number(e.target.value))} className="mt-1" /></div>
                {isCH && (
                  <div>
                    <Label className="text-xs">Provision entretien : {entretienProvision}% du prix/an</Label>
                    <Slider value={[entretienProvision * 10]} onValueChange={v => setEntretienProvision(v[0] / 10)} min={0} max={30} step={1} className="mt-2" />
                    <p className="text-[10px] text-muted-foreground mt-1">= {formatAmount(entretienAnnuel, currency)}/an</p>
                  </div>
                )}
              </div>

              {/* Taxes */}
              {!isCH && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Taxes</h4>
                  <div><Label className="text-xs">Taxe foncière/an</Label><Input type="number" value={taxeFonciere} onChange={e => setTaxeFonciere(Number(e.target.value))} className="mt-1" /></div>
                </div>
              )}

              {/* Autres charges */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Autres charges
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Exemples de charges :</p>
                        <ul className="text-xs space-y-0.5">
                          {isCH ? (
                            <>
                              <li>• Assurance bâtiment (RC + incendie)</li>
                              <li>• Gérance immobilière</li>
                              <li>• Réparations courantes</li>
                              <li>• Frais bancaires hypothèque</li>
                            </>
                          ) : (
                            <>
                              <li>• Comptabilité (expert-comptable LMNP)</li>
                              <li>• Assurance PNO (propriétaire non occupant)</li>
                              <li>• GLI (garantie loyers impayés)</li>
                              <li>• CFE (cotisation foncière entreprise)</li>
                              <li>• Entretien courant, petites réparations</li>
                            </>
                          )}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h4>
                <div><Label className="text-xs">{isCH ? 'Assurance bâtiment/an' : 'Assurance PNO/an'}</Label><Input type="number" value={assurancePNO} onChange={e => setAssurancePNO(Number(e.target.value))} className="mt-1" /></div>
                <div>
                  <Label className="text-xs">{isCH ? 'Frais de gérance' : 'Frais de gestion'} : {fraisGestion}%</Label>
                  <Slider value={[fraisGestion]} onValueChange={v => setFraisGestion(v[0])} min={0} max={15} step={0.5} className="mt-2" />
                </div>
                {!isCH && <div><Label className="text-xs">Comptabilité/an</Label><Input type="number" value={comptabilite} onChange={e => setComptabilite(Number(e.target.value))} className="mt-1" /></div>}
                {!isCH && <div><Label className="text-xs">GLI/an</Label><Input type="number" value={gli} onChange={e => setGli(Number(e.target.value))} className="mt-1" /></div>}
                <div><Label className="text-xs">{isCH ? 'Autres (réparations, divers)/an' : 'Autres (CFE, entretien...)/an'}</Label><Input type="number" value={autresCharges} onChange={e => setAutresCharges(Number(e.target.value))} className="mt-1" /></div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ONGLET FISCALITÉ (FR only) */}
        {!isCH && (
          <TabsContent value="fiscalite" className="space-y-6">
            <div className="rounded-2xl border bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 space-y-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Calculator className="h-4 w-4 text-amber-600" />
                  Simulation d'impôt locatif
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Régime fiscal</Label>
                    <Select value={taxRegime} onValueChange={(v) => setTaxRegime(v as TaxRegime)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TAX_REGIME_INFO).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <span className="font-medium">{info.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">— {info.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(taxRegime === 'nu_sci_ir' || taxRegime === 'meuble_forfait' || taxRegime === 'lmnp_reel') && (
                    <div>
                      <Label>Tranche marginale d'imposition (TMI) : {tmi}%</Label>
                      <Slider value={[tmi]} onValueChange={v => setTmi(v[0])} min={0} max={45} step={1} className="mt-2" />
                      <div className="flex gap-2 mt-2">
                        {[0, 11, 30, 41, 45].map(t => (
                          <Button key={t} variant={tmi === t ? 'default' : 'outline'} size="sm" onClick={() => setTmi(t)} className="text-xs">
                            {t}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(taxRegime === 'lmnp_reel' || taxRegime === 'sci_is') && (
                    <div>
                      <Label>Durée d'amortissement : {dureeAmortissement} ans</Label>
                      <Slider value={[dureeAmortissement]} onValueChange={v => setDureeAmortissement(v[0])} min={10} max={40} step={1} className="mt-2" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Amortissement annuel: {formatAmount((prix + travaux) / dureeAmortissement, currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Résultat fiscal */}
              <div className="rounded-xl bg-card border p-4 space-y-3">
                <h4 className="font-medium text-sm">{TAX_REGIME_INFO[taxRegime].label}</h4>
                <p className="text-xs text-muted-foreground">{impotCalcul.detail}</p>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Base imposable</p>
                    <p className="font-bold">{formatAmount(impotCalcul.baseImposable, currency)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">{taxRegime === 'sci_is' ? 'Impôt IS' : 'IR + PS'}</p>
                    <p className="font-bold text-red-600">{formatAmount(impotCalcul.total, currency)}</p>
                  </div>
                </div>

                {taxRegime !== 'sci_is' && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Impôt sur le revenu ({tmi}%)</span>
                      <span>{formatAmount(impotCalcul.ir, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prélèvements sociaux (17.2%)</span>
                      <span>{formatAmount(impotCalcul.ps, currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comparatif rapide */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-semibold mb-4">Comparatif des régimes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(TAX_REGIME_INFO) as TaxRegime[]).map(regime => {
                  const calc = (() => {
                    const amortAnnuel = (prix + travaux) / dureeAmortissement;
                    switch (regime) {
                      case 'meuble_forfait': return loyerNet * 0.5 * (tmi / 100 + 0.172);
                      case 'lmnp_reel': { const base = Math.max(0, loyerNet - chargesAnnuelles - interetsAnnuels - amortAnnuel); return base * (tmi / 100 + 0.172); }
                      case 'nu_sci_ir': { const base = Math.max(0, loyerNet - chargesAnnuelles - interetsAnnuels); return base * (tmi / 100 + 0.172); }
                      case 'sci_is': { const base = Math.max(0, loyerNet - chargesAnnuelles - interetsAnnuels - amortAnnuel); return base <= 42500 ? base * 0.15 : 42500 * 0.15 + (base - 42500) * 0.25; }
                    }
                  })();
                  const isSelected = regime === taxRegime;
                  const allCalcs = (Object.keys(TAX_REGIME_INFO) as TaxRegime[]).map(r => {
                    const a = (prix + travaux) / dureeAmortissement;
                    switch (r) {
                      case 'meuble_forfait': return loyerNet * 0.5 * (tmi / 100 + 0.172);
                      case 'lmnp_reel': return Math.max(0, loyerNet - chargesAnnuelles - interetsAnnuels - a) * (tmi / 100 + 0.172);
                      case 'nu_sci_ir': return Math.max(0, loyerNet - chargesAnnuelles - interetsAnnuels) * (tmi / 100 + 0.172);
                      case 'sci_is': { const b = Math.max(0, loyerNet - chargesAnnuelles - interetsAnnuels - a); return b <= 42500 ? b * 0.15 : 42500 * 0.15 + (b - 42500) * 0.25; }
                    }
                  });
                  const isBest = calc === Math.min(...allCalcs);

                  return (
                    <button key={regime} onClick={() => setTaxRegime(regime)}
                      className={`rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/50'}`}>
                      <p className="text-xs font-medium truncate">{TAX_REGIME_INFO[regime].label.split(' ')[0]}</p>
                      <p className={`text-lg font-bold ${isBest ? 'text-emerald-600' : ''}`}>{formatAmount(calc, currency)}</p>
                      <p className="text-[9px] text-muted-foreground">impôt/an</p>
                      {isBest && <span className="text-[9px] text-emerald-600 font-medium">✓ Plus avantageux</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        )}

        {/* ONGLET RÉSULTATS */}
        <TabsContent value="resultats" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Résumé cashflow */}
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <h3 className="font-semibold">Synthèse du cashflow</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm">Loyer annuel brut</span>
                  <span className="font-medium text-emerald-600">+{formatAmount(loyerAnnuel, currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">- Vacance ({vacanceLocative}%)</span>
                  <span className="text-muted-foreground">-{formatAmount(loyerAnnuel - loyerNet, currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">= Loyer net</span>
                  <span className="font-medium">{formatAmount(loyerNet, currency)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">- {isCH ? 'Charges PPE' : 'Charges courantes'}</span>
                  <span className="text-red-600">-{formatAmount(chargesCourantesAnnuelles, currency)}</span>
                </div>
                {!isCH && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">- Taxes (foncière)</span>
                    <span className="text-red-600">-{formatAmount(taxesAnnuelles, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">- Autres charges</span>
                  <span className="text-red-600">-{formatAmount(autresChargesAnnuelles, currency)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">- {creditLabel}</span>
                  <span className="text-red-600">-{formatAmount(creditAnnuel, currency)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">= Cashflow avant impôt</span>
                  <span className={`font-medium ${cashflowAvantImpot >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatAmount(cashflowAvantImpot, currency)}
                  </span>
                </div>
                
                {!isCH && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">- Impôt ({TAX_REGIME_INFO[taxRegime].label.split(' ')[0]})</span>
                      <span className="text-red-600">-{formatAmount(impotCalcul.total, currency)}</span>
                    </div>
                    
                    <div className="flex justify-between py-3 bg-muted/50 rounded-lg px-3 -mx-3">
                      <span className="font-semibold">= Cashflow net-net</span>
                      <span className={`text-xl font-bold ${cashflowApresImpot >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatAmount(cashflowApresImpot, currency)}/an
                      </span>
                    </div>
                  </>
                )}

                {isCH && (
                  <div className="flex justify-between py-3 bg-muted/50 rounded-lg px-3 -mx-3">
                    <span className="font-semibold">= Cashflow avant impôt</span>
                    <span className={`text-xl font-bold ${cashflowAvantImpot >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatAmount(cashflowAvantImpot, currency)}/an
                    </span>
                  </div>
                )}

                {isCH && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground mt-2">
                    <p>⚠ La fiscalité immobilière suisse est complexe (valeur locative, déductions cantonales, impôt sur le revenu). Consulte un fiduciaire pour une estimation précise.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Graphique répartition */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="mb-4 font-semibold">Répartition des charges annuelles</h3>
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={chargesDetail} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {chargesDetail.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v: number) => formatAmount(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2">
                  {chargesDetail.map((d, i) => (
                    <span key={d.name} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name}: {formatAmount(d.value, currency)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total charges{!isCH ? ' + impôts' : ''}</span>
                  <span className="font-bold">{formatAmount(chargesAnnuelles + creditAnnuel + (isCH ? 0 : impotCalcul.total), currency)}/an</span>
                </div>
              </div>
            </div>
          </div>

          {/* Investissement total */}
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold mb-4">Récapitulatif de l'investissement</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Prix d'achat</p>
                <p className="text-lg font-bold">{formatAmount(prix, currency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{isCH ? 'Frais acte/registre' : 'Frais notaire'}</p>
                <p className="text-lg font-bold">{formatAmount(montantFraisNotaire, currency)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Travaux</p>
                <p className="text-lg font-bold">{formatAmount(travaux, currency)}</p>
              </div>
              <div className="text-center bg-primary/5 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">Investissement total</p>
                <p className="text-lg font-bold text-primary">{formatAmount(investTotal, currency)}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
