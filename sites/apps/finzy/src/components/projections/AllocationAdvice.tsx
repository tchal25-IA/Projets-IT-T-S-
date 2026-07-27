import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, Shield, TrendingUp, Zap, Target, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Wallet, Info, FileQuestion } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  calculateAllocationRecommendation, 
  type AllocationContext, 
  type AllocationRecommendation,
  type ProjectionResult,
  type ProjectionInputs
} from '@/lib/projectionCalculations';
import type { Currency } from '@/types';

interface Project {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
}

const profileLabels: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  prudent: { label: 'Prudent', icon: Shield, color: 'text-blue-500', description: 'Priorité à la sécurité du capital' },
  equilibre: { label: 'Équilibré', icon: Target, color: 'text-green-500', description: 'Balance entre sécurité et rendement' },
  dynamique: { label: 'Dynamique', icon: TrendingUp, color: 'text-orange-500', description: 'Accepte la volatilité pour plus de performance' },
  offensif: { label: 'Offensif', icon: Zap, color: 'text-red-500', description: 'Maximise le potentiel de gains' },
};

interface AllocationAdviceProps {
  riskProfile?: ProjectionResult['riskProfile'];
  emergencyFundStatus?: string;
  projectionInputs?: ProjectionInputs | null;
  projectionResult?: ProjectionResult | null;
}

export function AllocationAdvice({ 
  riskProfile = 'equilibre', 
  emergencyFundStatus = '3-6mois',
  projectionInputs,
  projectionResult
}: AllocationAdviceProps) {
  const { user, profile } = useAuth();
  const currency = (profile?.currency ?? 'EUR') as Currency;
  const market = profile?.market ?? 'FR';

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Check if we have projection data
  const hasProjectionData = projectionInputs !== null && projectionInputs !== undefined && projectionResult !== null && projectionResult !== undefined;

  // Calculate values from projection data
  const monthlySavings = hasProjectionData ? projectionResult.monthlySavings : 0;
  const monthlyExpenses = hasProjectionData ? projectionInputs.monthlyExpenses : 0;
  const monthlyIncome = hasProjectionData ? projectionInputs.monthlyIncome : 0;
  
  const patrimoine = hasProjectionData && projectionInputs?.patrimoine 
    ? {
        'Livrets': projectionInputs.patrimoine.livrets,
        'Assurance Vie': projectionInputs.patrimoine.assuranceVie,
        'Bourse': projectionInputs.patrimoine.bourse,
        'Immo papier': projectionInputs.patrimoine.immoPapier,
        'Immo physique': projectionInputs.patrimoine.immoPhysique,
        'Alternatifs': projectionInputs.patrimoine.alternatifs,
        'Retraite': projectionInputs.patrimoine.epargneRetraite,
      }
    : {};

  useEffect(() => {
    if (!user) return;
    
    const fetchProjects = async () => {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });

      if (projectsData) {
        setProjects(projectsData);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  const getMonthsUntil = (dateStr: string): number => {
    const target = new Date(dateStr);
    const now = new Date();
    return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  };

  const selectedProjects = useMemo(() => 
    projects.filter(p => selectedProjectIds.includes(p.id)),
    [projects, selectedProjectIds]
  );

  const hasShortTermProject = selectedProjects.length > 0;

  const shortTermTotalAmount = useMemo(() => 
    selectedProjects.reduce((sum, p) => sum + (p.target_amount - p.current_amount), 0),
    [selectedProjects]
  );

  const shortTermAvgMonths = useMemo(() => {
    if (selectedProjects.length === 0) return 0;
    const totalMonths = selectedProjects.reduce((sum, p) => 
      sum + (p.deadline ? getMonthsUntil(p.deadline) : 24), 0
    );
    return Math.round(totalMonths / selectedProjects.length);
  }, [selectedProjects]);

  const context: AllocationContext = useMemo(() => ({
    monthlySavings,
    hasEmergencyFund: emergencyFundStatus === '3-6mois',
    emergencyFundMonths: emergencyFundStatus === '3-6mois' ? 6 : emergencyFundStatus === '<3mois' ? 2 : 0,
    monthlyExpenses,
    riskProfile,
    hasShortTermProject,
    shortTermProjectAmount: shortTermTotalAmount || undefined,
    shortTermProjectMonths: shortTermAvgMonths || undefined,
    market,
  }), [monthlySavings, emergencyFundStatus, monthlyExpenses, riskProfile, hasShortTermProject, shortTermTotalAmount, shortTermAvgMonths, market]);

  const recommendations = useMemo(() => 
    calculateAllocationRecommendation(context),
    [context]
  );

  const totalPatrimoine = useMemo(() => 
    Math.round(Object.values(patrimoine).reduce((s, v) => s + v, 0)),
    [patrimoine]
  );

  const profileInfo = profileLabels[riskProfile];
  const ProfileIcon = profileInfo.icon;

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // If no projection data, show message to fill form first
  if (!hasProjectionData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Formulaire non rempli</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Pour recevoir des conseils d'allocation personnalisés, remplis d'abord le questionnaire 
            dans l'onglet "Mes projections".
          </p>
          <p className="text-sm text-muted-foreground">
            Tes revenus, dépenses et patrimoine seront utilisés pour calculer ton épargne mensuelle 
            et te proposer une allocation adaptée à ton profil.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <Info className="h-3.5 w-3.5 text-primary" />
        Calcul basé sur ton formulaire : {fmt(monthlyIncome)} {currency === 'EUR' ? '€' : 'CHF'} de revenus - {fmt(monthlyExpenses)} {currency === 'EUR' ? '€' : 'CHF'} de dépenses = <strong className="text-primary">{fmt(monthlySavings)} {currency === 'EUR' ? '€' : 'CHF'} d'épargne</strong>
      </div>

      {/* Situation actuelle */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/20 p-2.5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Épargne mensuelle</p>
                <p className="text-xl font-bold text-primary">{fmt(monthlySavings)} {currency === 'EUR' ? '€' : 'CHF'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/20 p-2.5">
                <ProfileIcon className={`h-5 w-5 ${profileInfo.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profil</p>
                <p className={`text-lg font-bold ${profileInfo.color}`}>{profileInfo.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${emergencyFundStatus === '3-6mois' ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                {emergencyFundStatus === '3-6mois' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fonds d'urgence</p>
                <p className={`text-sm font-medium ${emergencyFundStatus === '3-6mois' ? 'text-green-600' : 'text-amber-600'}`}>
                  {emergencyFundStatus === '3-6mois' ? '✓ 3-6 mois OK' : emergencyFundStatus === '<3mois' ? '< 3 mois' : 'À constituer'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/20 p-2.5">
                <Wallet className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Patrimoine total</p>
                <p className="text-lg font-bold">{fmt(totalPatrimoine)} {currency === 'EUR' ? '€' : 'CHF'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Option projets court terme - MULTI-SELECT */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              As-tu des projets à financer ?
            </CardTitle>
            <CardDescription>
              Sélectionne un ou plusieurs projets court terme pour adapter l'allocation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {projects.filter(p => p.deadline && getMonthsUntil(p.deadline) <= 60).map(project => {
                const remaining = project.target_amount - project.current_amount;
                const months = project.deadline ? getMonthsUntil(project.deadline) : 0;
                const isSelected = selectedProjectIds.includes(project.id);
                
                return (
                  <label
                    key={project.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(remaining)} {currency === 'EUR' ? '€' : 'CHF'} • {months > 0 ? `${months} mois` : 'Échéance passée'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {selectedProjects.length > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mt-3">
                <p className="text-sm">
                  <span className="font-medium">{selectedProjects.length} projet{selectedProjects.length > 1 ? 's' : ''} sélectionné{selectedProjects.length > 1 ? 's' : ''}</span>
                  {' '}: {fmt(shortTermTotalAmount)} {currency === 'EUR' ? '€' : 'CHF'} à épargner sur ~{shortTermAvgMonths} mois en moyenne
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommandations d'allocation */}
      {monthlySavings > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle>Notre recommandation</CardTitle>
            </div>
            <CardDescription>
              Allocation optimale de tes {fmt(monthlySavings)} {currency === 'EUR' ? '€' : 'CHF'} mensuels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Pie Chart */}
              <div className="w-64 h-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recommendations}
                      dataKey="monthlyAmount"
                      nameKey="envelope"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={40}
                      label={false}
                    >
                      {recommendations.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${fmt(value)} ${currency === 'EUR' ? '€' : 'CHF'}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Détail des allocations */}
              <div className="flex-1 space-y-4 w-full">
                {recommendations.map((rec, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: rec.color }} />
                        <span className="font-medium">{rec.envelope}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{fmt(rec.monthlyAmount)} {currency === 'EUR' ? '€' : 'CHF'}</span>
                        <span className="text-muted-foreground text-sm ml-2">({rec.percentage}%)</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{rec.rationale}</p>
                    <Progress value={rec.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {emergencyFundStatus !== '3-6mois' && (
              <div className="mt-6 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">Priorité : Épargne de précaution</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avant d'investir, nous te recommandons de constituer 3 à 6 mois de dépenses 
                      ({fmt(monthlyExpenses * 6)} {currency === 'EUR' ? '€' : 'CHF'}) sur un support garanti.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pas d'épargne mensuelle</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              D'après ton formulaire, tes dépenses ({fmt(monthlyExpenses)} {currency === 'EUR' ? '€' : 'CHF'}) 
              sont supérieures ou égales à tes revenus ({fmt(monthlyIncome)} {currency === 'EUR' ? '€' : 'CHF'}).
              <br />
              Ajuste tes valeurs dans l'onglet "Mes projections" si nécessaire.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparaison avec/sans projet */}
      {selectedProjects.length > 0 && monthlySavings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impact des projets sur ton allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium text-sm mb-2">Sans projet court terme</h4>
                <p className="text-xs text-muted-foreground">
                  Plus de diversification vers les actifs de croissance (PEA, ETF, SCPI...)
                </p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <h4 className="font-medium text-sm mb-2 text-primary">Avec tes {selectedProjects.length} projet{selectedProjects.length > 1 ? 's' : ''}</h4>
                <p className="text-xs text-muted-foreground">
                  Priorité à l'épargne sécurisée pour atteindre {fmt(shortTermTotalAmount)} {currency === 'EUR' ? '€' : 'CHF'} d'ici ~{shortTermAvgMonths} mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
