import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'finzy_tutorial_done';

const steps = [
  {
    title: 'Bienvenue sur Finzy ! 👋',
    desc: 'Ton tableau de bord centralise tes finances : revenus, dépenses, patrimoine.',
    cta: 'Commencer',
  },
  {
    title: 'Budget & Transactions',
    desc: 'Ajoute tes transactions et plafonds par catégorie pour garder le contrôle.',
    cta: 'Suivant',
  },
  {
    title: 'Projets & Objectifs',
    desc: 'Définis des objectifs d\'épargne (voyage, apport, etc.) et suis ta progression.',
    cta: 'Suivant',
  },
  {
    title: 'Simulateurs & FinzyBot',
    desc: 'Utilise les simulateurs pour calculer impôts, crédits, FIRE... et pose tes questions à FinzyBot.',
    cta: 'C\'est parti !',
  },
];

export function OnboardingTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, '1');
      setVisible(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-desc"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-md w-full rounded-2xl border bg-card p-6 shadow-xl"
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 rounded-full p-1 hover:bg-muted text-muted-foreground"
            aria-label="Passer le tutoriel"
          >
            <X className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 id="tutorial-title" className="text-xl font-bold pr-8">
                {steps[step].title}
              </h2>
              <p id="tutorial-desc" className="mt-3 text-muted-foreground">
                {steps[step].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {step + 1} / {steps.length}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Passer
              </Button>
              <Button onClick={handleNext} size="sm" className="gap-1">
                {steps[step].cta}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
