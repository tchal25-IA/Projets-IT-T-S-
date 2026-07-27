import { useState } from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { usePlan } from '@/hooks/usePlan';
import { SEO } from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectionForm } from '@/components/projections/ProjectionForm';
import { ProjectionResults } from '@/components/projections/ProjectionResults';
import { AllocationAdvice } from '@/components/projections/AllocationAdvice';
import { TimelinePlanner } from '@/components/projections/TimelinePlanner';
import { calculateProjection, type ProjectionInputs, type ProjectionResult } from '@/lib/projectionCalculations';
import { ArrowLeft, Target, Lightbulb, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectionsPage() {
  const { isPremium } = usePlan();
  if (!isPremium) return <PremiumGate feature="Projections patrimoniales long terme" />;
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const [inputs, setInputs] = useState<ProjectionInputs | null>(null);
  const [years, setYears] = useState(10);
  const [timelineYears, setTimelineYears] = useState(10);
  const [activeTab, setActiveTab] = useState('projections');

  const handleSubmit = (data: ProjectionInputs) => {
    setInputs(data);
    setResult(calculateProjection(data, years));
  };

  const handleYearsChange = (newYears: number) => {
    setYears(newYears);
    if (inputs) {
      setResult(calculateProjection(inputs, newYears));
    }
  };

  const handleReset = () => {
    setResult(null);
    setInputs(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO 
        title="Projections" 
        description="Simulez vos projections d'épargne et d'investissement personnalisées, obtenez des conseils d'allocation et planifiez vos événements financiers." 
        path="/projections" 
      />
      
      <div>
        <h1 className="text-2xl font-bold">📊 Projections & Conseils</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simule ton avenir financier, reçois des conseils personnalisés et planifie tes projets
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="projections" className="gap-2">
            <Target className="h-4 w-4 hidden sm:block" />
            Mes projections
          </TabsTrigger>
          <TabsTrigger value="allocation" className="gap-2">
            <Lightbulb className="h-4 w-4 hidden sm:block" />
            Conseils
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="h-4 w-4 hidden sm:block" />
            Ma timeline
          </TabsTrigger>
        </TabsList>

        {/* Onglet 1: Projections */}
        <TabsContent value="projections" className="mt-6">
          {result && inputs ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Modifier mes réponses
              </Button>
              <ProjectionResults 
                result={result} 
                inputs={inputs} 
                years={years} 
                onYearsChange={handleYearsChange} 
              />
            </div>
          ) : (
            <ProjectionForm onSubmit={handleSubmit} />
          )}
        </TabsContent>

        {/* Onglet 2: Conseils d'allocation */}
        <TabsContent value="allocation" className="mt-6">
          <AllocationAdvice 
            riskProfile={result?.riskProfile ?? 'equilibre'}
            emergencyFundStatus={inputs?.emergencyFund ?? '3-6mois'}
            projectionInputs={inputs}
            projectionResult={result}
          />
        </TabsContent>

        {/* Onglet 3: Timeline */}
        <TabsContent value="timeline" className="mt-6">
          <TimelinePlanner 
            projectionInputs={inputs} 
            years={timelineYears}
            onYearsChange={setTimelineYears}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
