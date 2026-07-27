import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/hooks/useXP';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react';

const questionsFR = [
  { q: 'Quel est le plafond du Livret A en 2026 ?', opts: ['15 000€', '22 950€', '30 000€'], correct: 1 },
  { q: 'Que signifie PFU ?', opts: ['Plan Fiscal Unique', 'Prélèvement Forfaitaire Unique', 'Prime Financière Universelle'], correct: 1 },
  { q: 'Quelle est la flat tax en France ?', opts: ['25%', '30%', '35%'], correct: 1 },
  { q: 'Après combien d\'années le PEA est-il optimisé ?', opts: ['3 ans', '5 ans', '8 ans'], correct: 1 },
  { q: 'Que réplique un ETF ?', opts: ['Une action', 'Un indice boursier', 'Une obligation'], correct: 1 },
  { q: 'La règle budgétaire 50/30/20 : que représentent les 20% ?', opts: ['Loisirs', 'Épargne', 'Besoins'], correct: 1 },
  { q: 'Quel est le plafond du PEA ?', opts: ['100 000€', '150 000€', '200 000€'], correct: 1 },
];

const questionsCH = [
  { q: 'Combien de piliers dans le système suisse ?', opts: ['2', '3', '4'], correct: 1 },
  { q: 'Quel est le plafond du 3ème pilier A en 2026 ?', opts: ['6 883 CHF', '7 258 CHF', '7 056 CHF'], correct: 2 },
  { q: 'Que signifie LPP ?', opts: ['Loi sur la Prévoyance Professionnelle', 'Loi sur le Placement Privé', 'Livret de Pension Publique'], correct: 0 },
  { q: 'Quel impôt s\'applique au retrait du 2ème pilier ?', opts: ['Impôt sur le revenu', 'Impôt à taux réduit séparé', 'Aucun impôt'], correct: 1 },
  { q: 'Que réplique un ETF ?', opts: ['Une action', 'Un indice boursier', 'Une obligation'], correct: 1 },
  { q: 'La règle budgétaire 50/30/20 : que représentent les 20% ?', opts: ['Loisirs', 'Épargne', 'Besoins'], correct: 1 },
  { q: 'Le 3ème pilier B est-il déductible fiscalement ?', opts: ['Oui partout', 'Seulement à Genève et Fribourg', 'Non jamais'], correct: 1 },
];

export function DailyQuiz() {
  const { user, profile } = useAuth();
  const { grantXP, updateStreak } = useXP();
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const market = profile?.market ?? 'FR';
  const dailyQuestions = market === 'CH' ? questionsCH : questionsFR;
  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date().getDate() % dailyQuestions.length;
  const question = dailyQuestions[dayIndex];

  useEffect(() => {
    if (!user) return;
    supabase.from('daily_quiz_answers').select('*').eq('user_id', user.id).eq('quiz_date', today).maybeSingle()
      .then(({ data }) => {
        if (data) setAnswered(true);
        setLoading(false);
      });
  }, [user, today]);

  const handleAnswer = async (idx: number) => {
    if (!user || answered) return;
    setSelected(idx);
    const correct = idx === question.correct;
    const xp = correct ? 20 : 5;
    await supabase.from('daily_quiz_answers').insert({ user_id: user.id, quiz_date: today, correct, xp_earned: xp });
    await grantXP(xp, correct ? 'Quiz du jour réussi !' : 'Participation au quiz');
    await updateStreak();
    setAnswered(true);
  };

  if (loading || answered) {
    if (answered) return (
      <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="text-sm font-medium">Quiz du jour complété ! Revenez demain.</span>
      </div>
    );
    return null;
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-sm">Quiz du jour (+20 XP)</h3>
      </div>
      <p className="text-sm">{question.q}</p>
      <div className="grid gap-2">
        {question.opts.map((opt, i) => (
          <Button
            key={i}
            variant={selected === null ? 'outline' : i === question.correct ? 'default' : selected === i ? 'destructive' : 'outline'}
            size="sm"
            className="justify-start"
            onClick={() => handleAnswer(i)}
            disabled={answered}
          >
            {answered && i === question.correct && <CheckCircle2 className="mr-2 h-4 w-4" />}
            {answered && selected === i && i !== question.correct && <XCircle className="mr-2 h-4 w-4" />}
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}
