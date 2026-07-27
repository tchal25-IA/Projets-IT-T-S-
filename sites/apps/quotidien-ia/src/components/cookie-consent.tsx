import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { readLS, writeLS } from "@/lib/storage";

const CONSENT_KEY = "qia:consent";

type Consent = { choice: "accepted" | "essential"; at: string };

/**
 * Bandeau d'information sur le stockage local et les transferts liés à l'assistant IA.
 * Aucun traceur publicitaire n'est utilisé : le bandeau est informatif et mémorise le choix
 * de l'utilisateur dans localStorage (qia:consent).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readLS<Consent | null>(CONSENT_KEY, null);
    if (!existing) setVisible(true);
  }, []);

  function decide(choice: Consent["choice"]) {
    writeLS<Consent>(CONSENT_KEY, { choice, at: new Date().toISOString() });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border bg-card p-4 shadow-elev sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-primary sm:block" />
        <div className="flex-1 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Vos données et votre vie privée</p>
          <p className="mt-1">
            Nous utilisons uniquement le stockage local et des cookies nécessaires à votre connexion (aucun
            traceur publicitaire). Les modules d'assistant IA transmettent vos saisies à un service tiers (Google
            Gemini). Détails dans nos{" "}
            <Link to="/cookies" className="text-primary hover:underline">cookies</Link> et notre{" "}
            <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            Nécessaires uniquement
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
