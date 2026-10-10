import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoenixLogo } from "@/components/phoenix-logo";
import { FF } from "@/lib/ff-colors";

export const Route = createFileRoute("/landing")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "FusionFit — Le logiciel de coaching qui vous rend vos soirées" },
      {
        name: "description",
        content:
          "Créez vos séances en 3 clics, attribuez-les à vos athlètes. Essai gratuit 14 jours, sans carte bancaire.",
      },
    ],
  }),
});

const PLANS = [
  {
    id: "launch",
    nom: "Launch",
    prix: "29 €",
    chf: "29 CHF",
    cible: "Coach débutant ou à temps partiel",
    features: ["10 athlètes actifs", "Modules 1, 2 et 11", "Atelier · 10 modèles", "Essai 14 jours sans CB"],
  },
  {
    id: "pro",
    nom: "Pro",
    prix: "59 €",
    chf: "65 CHF",
    populaire: true,
    cible: "Coach indépendant installé",
    features: ["25 athlètes actifs", "11 modules + WOD + Hyrox", "Atelier illimité", "Dashboard + Agenda"],
  },
  {
    id: "studio",
    nom: "Studio",
    prix: "149 €",
    chf: "169 CHF",
    cible: "Studio, box, équipe de coachs",
    features: ["75 athlètes (3 coachs)", "Siège +39 € / mois", "Fiches privées org", "Tout Pro"],
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: FF.bg, color: FF.text }}>
      <header className="sticky top-0 z-20 border-b backdrop-blur-xl"
        style={{ borderColor: FF.border, background: "oklch(0.07 0.025 265 / 85%)" }}>
        <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoenixLogo size={32} />
            <span className="text-sm font-bold tracking-widest" style={{ color: FF.amber }}>FUSIONFIT</span>
          </div>
          <nav className="hidden sm:flex gap-4 text-[11px] font-mono uppercase" style={{ color: FF.textMuted }}>
            <a href="#probleme">Problème</a>
            <a href="#atelier">Atelier</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#faq">FAQ</a>
          </nav>
          <Link
            to="/signup"
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: FF.cyan, color: FF.cyan, background: FF.cyanBg }}
          >
            Essai 14 jours
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 space-y-20">
        {/* Hero */}
        <section className="space-y-5 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: FF.amber }}>
            Pour les coachs qui en ont assez de coacher le soir
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            Moins d'admin.<br />Plus de coaching.<br />Zéro épuisement.
          </h1>
          <p className="text-sm max-w-xl mx-auto" style={{ color: FF.textMuted }}>
            FusionFit fait passer vos 10 heures d'administratif par semaine à 1 heure.
            Plus de 300 fiches, un Atelier en 3 clics, un suivi pensé pour 25 clients à distance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="rounded-xl border px-6 py-3 text-sm font-semibold"
              style={{ borderColor: FF.cyan, color: "#0a0e1a", background: FF.cyan }}
            >
              Commencer mes 14 jours gratuits
            </Link>
            <a href="#atelier" className="rounded-xl border px-6 py-3 text-sm"
              style={{ borderColor: FF.border, color: FF.text }}>
              Voir l'Atelier ▶
            </a>
          </div>
          <p className="text-[11px]" style={{ color: FF.textMuted }}>
            Sans carte bancaire · Prêt en 5 minutes · Sans engagement
          </p>
          <div className="grid grid-cols-3 gap-2 pt-4 text-center">
            {[
              ["11", "modules"],
              ["3", "clics / séance"],
              ["14", "jours d'essai"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl border p-3" style={{ borderColor: FF.border, background: FF.surface }}>
                <p className="text-2xl font-bold" style={{ color: FF.cyan }}>{n}</p>
                <p className="text-[10px] font-mono uppercase" style={{ color: FF.textMuted }}>{l}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="probleme" className="space-y-3">
          <h2 className="text-xl font-bold">Vous êtes devenu l'administrateur de votre métier</h2>
          <ul className="space-y-2 text-sm" style={{ color: FF.textMuted }}>
            <li>· Reconstruire des séances de zéro ou copier-coller de mauvais fichiers.</li>
            <li>· Chercher la bonne variante dans notes, captures et vidéos éparpillées.</li>
            <li>· Envoyer des PDF, puis répondre à « c'est quoi cet exercice ? » à 22 h.</li>
            <li>· Adapter à la main sans abîmer le programme des autres athlètes.</li>
          </ul>
        </section>

        <section id="atelier" className="space-y-3">
          <h2 className="text-xl font-bold">L'Atelier : une séance en 3 clics</h2>
          <ol className="space-y-2 text-sm">
            <li><span style={{ color: FF.cyan }}>1.</span> Recherchez un mouvement (pompe, squat, WOD…).</li>
            <li><span style={{ color: FF.cyan }}>2.</span> Composez échauffement · corps · retour au calme.</li>
            <li><span style={{ color: FF.cyan }}>3.</span> Attribuez : chaque athlète reçoit une instance indépendante.</li>
          </ol>
          <Link to="/login" className="inline-block text-sm underline" style={{ color: FF.cyan }}>
            Se connecter pour ouvrir l'Atelier →
          </Link>
        </section>

        <section id="tarifs" className="space-y-4">
          <h2 className="text-xl font-bold text-center">Tarifs coach (€ / CHF)</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border p-4 space-y-2"
                style={{
                  borderColor: p.populaire ? FF.amber : FF.border,
                  background: FF.surface,
                }}
              >
                {p.populaire && (
                  <p className="text-[9px] font-mono uppercase" style={{ color: FF.amber }}>Populaire</p>
                )}
                <p className="font-bold text-lg">{p.nom}</p>
                <p className="text-2xl font-bold" style={{ color: FF.cyan }}>
                  {p.prix} <span className="text-xs font-normal" style={{ color: FF.textMuted }}>/ mois</span>
                </p>
                <p className="text-[11px]" style={{ color: FF.textMuted }}>{p.chf} · {p.cible}</p>
                <ul className="text-xs space-y-1 pt-2" style={{ color: FF.textMuted }}>
                  {p.features.map((f) => <li key={f}>· {f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="space-y-3">
          <h2 className="text-xl font-bold">FAQ</h2>
          <details className="rounded-xl border p-3" style={{ borderColor: FF.border }}>
            <summary className="text-sm font-semibold cursor-pointer">Faut-il une carte pour l'essai ?</summary>
            <p className="text-xs mt-2" style={{ color: FF.textMuted }}>Non. 14 jours sans carte sur Launch et Pro.</p>
          </details>
          <details className="rounded-xl border p-3" style={{ borderColor: FF.border }}>
            <summary className="text-sm font-semibold cursor-pointer">Modifier une séance d'un athlète écrase-t-elle le modèle ?</summary>
            <p className="text-xs mt-2" style={{ color: FF.textMuted }}>
              Non. L'attribution crée une instance indépendante (copy-on-assign).
            </p>
          </details>
          <details className="rounded-xl border p-3" style={{ borderColor: FF.border }}>
            <summary className="text-sm font-semibold cursor-pointer">Combien d'athlètes max ?</summary>
            <p className="text-xs mt-2" style={{ color: FF.textMuted }}>
              10 (Launch), 25 (Pro), 75 (Studio · 25 par coach). Plafond qualité anti-épuisement.
            </p>
          </details>
        </section>

        <section className="text-center space-y-3 pb-16">
          <h2 className="text-xl font-bold">Prêt à récupérer vos soirées ?</h2>
          <Link
            to="/signup"
            className="inline-block rounded-xl border px-8 py-3 text-sm font-semibold"
            style={{ borderColor: FF.cyan, color: "#0a0e1a", background: FF.cyan }}
          >
            Démarrer l'essai gratuit
          </Link>
          <p className="text-xs">
            Déjà un compte ?{" "}
            <Link to="/login" className="underline" style={{ color: FF.cyan }}>Se connecter</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
