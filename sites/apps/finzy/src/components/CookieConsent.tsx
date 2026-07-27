import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'finzy_cookie_consent';

/**
 * Bannière de consentement cookies (RGPD / nLPD).
 * Finzy n'utilise actuellement que des cookies essentiels ; la bannière
 * informe l'utilisateur et mémorise son acquittement. Si des cookies non
 * essentiels (analytics) sont ajoutés, conditionner leur chargement au consentement.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, at: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border bg-card p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Finzy utilise uniquement des cookies <strong className="text-foreground">essentiels</strong> au
              fonctionnement (connexion, préférences). Aucun pistage publicitaire.{' '}
              <Link to="/legal" className="text-primary underline">En savoir plus</Link>.
            </p>
            <Button size="sm" onClick={accept}>J'ai compris</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
