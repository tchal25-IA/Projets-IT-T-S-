import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Check, User, Ruler, Scale, HeartPulse, Dumbbell, Target, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PhoenixLogo } from "@/components/phoenix-logo";
import { FF } from "@/lib/ff-colors";
import { todayISO } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/fusionfit/onboarding")({
  component: OnboardingPage,
});

// Questionnaire d'accueil "Typeform-like" : une question par écran, pour
// cartographier l'athlète dès le jour 1 (identité, sportif & santé, objectifs).
type Answers = {
  prenom: string;
  nom: string;
  sexe: string;
  age: string;
  taille: string;
  poids: string;
  historique: string;
  blessures: string;
  objectifMoyen: string;
  objectifLong: string;
};

const EMPTY: Answers = {
  prenom: "", nom: "", sexe: "", age: "", taille: "", poids: "",
  historique: "", blessures: "", objectifMoyen: "", objectifLong: "",
};

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Pré-remplit le prénom depuis le profil créé à l'inscription.
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("prenom, onboarding_done").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_done) { navigate({ to: "/fusionfit/abonnement", replace: true }); return; }
        if (data?.prenom) setA((p) => ({ ...p, prenom: p.prenom || data.prenom }));
      });
  }, [user, navigate]);

  const upd = (k: keyof Answers) => (v: string) => setA((p) => ({ ...p, [k]: v }));

  type Step = {
    icon: React.ReactNode;
    titre: string;
    sous: string;
    valid: () => boolean;
    body: React.ReactNode;
  };

  const steps: Step[] = [
    {
      icon: <User className="h-5 w-5" />, titre: "Faisons connaissance",
      sous: "Ton prénom et ton nom.",
      valid: () => a.prenom.trim().length > 0,
      body: (
        <div className="space-y-3">
          <Input placeholder="Prénom" value={a.prenom} onChange={upd("prenom")} autoFocus />
          <Input placeholder="Nom" value={a.nom} onChange={upd("nom")} />
        </div>
      ),
    },
    {
      icon: <User className="h-5 w-5" />, titre: "Tu es…",
      sous: "Pour adapter les repères d'entraînement.",
      valid: () => a.sexe !== "",
      body: (
        <div className="grid grid-cols-3 gap-2">
          {["Femme", "Homme", "Autre"].map((s) => (
            <button key={s} onClick={() => upd("sexe")(s)}
              className="py-3 rounded-xl border text-sm font-semibold"
              style={{
                borderColor: a.sexe === s ? FF.cyan : FF.border,
                background: a.sexe === s ? FF.cyanBg20 : FF.surface2,
                color: a.sexe === s ? FF.cyan : FF.textMuted,
              }}>
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: <Ruler className="h-5 w-5" />, titre: "Âge et taille",
      sous: "Deux repères simples.",
      valid: () => +a.age >= 10 && +a.age <= 100 && +a.taille >= 100 && +a.taille <= 250,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Âge (ans)" type="number" value={a.age} onChange={upd("age")} />
          <Input placeholder="Taille (cm)" type="number" value={a.taille} onChange={upd("taille")} />
        </div>
      ),
    },
    {
      icon: <Scale className="h-5 w-5" />, titre: "Ton poids actuel",
      sous: "Il servira de point de départ pour ton suivi.",
      valid: () => +a.poids > 0 && +a.poids < 500,
      body: <Input placeholder="Poids (kg)" type="number" value={a.poids} onChange={upd("poids")} />,
    },
    {
      icon: <Dumbbell className="h-5 w-5" />, titre: "Ton parcours sportif",
      sous: "Sports pratiqués, niveau, fréquence — en quelques lignes.",
      valid: () => true,
      body: <TextArea placeholder="Ex : 5 ans de course à pied, un peu de renfo, jamais de CrossFit…" value={a.historique} onChange={upd("historique")} />,
    },
    {
      icon: <HeartPulse className="h-5 w-5" />, titre: "Santé & blessures",
      sous: "Blessures passées ou actuelles, douleurs, points de vigilance.",
      valid: () => true,
      body: <TextArea placeholder="Ex : épaule droite fragile (luxation 2022), rien d'autre à signaler." value={a.blessures} onChange={upd("blessures")} />,
    },
    {
      icon: <Target className="h-5 w-5" />, titre: "Objectif à moyen terme",
      sous: "Dans les 3 à 6 mois, tu vises quoi ?",
      valid: () => a.objectifMoyen.trim().length > 0,
      body: <TextArea placeholder="Ex : finir un Hyrox en moins d'1h30, perdre 5 kg…" value={a.objectifMoyen} onChange={upd("objectifMoyen")} />,
    },
    {
      icon: <Flag className="h-5 w-5" />, titre: "Objectif à long terme",
      sous: "Et à l'horizon 1-2 ans ?",
      valid: () => true,
      body: <TextArea placeholder="Ex : marathon sub-4h en 2027." value={a.objectifLong} onChange={upd("objectifLong")} />,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  async function terminer() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        prenom: a.prenom.trim(),
        nom: a.nom.trim() || null,
        sexe: a.sexe || null,
        age: +a.age || null,
        taille_cm: +a.taille || null,
        historique_sportif: a.historique.trim() || null,
        antecedents_blessures: a.blessures.trim() || null,
        objectif_moyen_terme: a.objectifMoyen.trim() || null,
        objectif_long_terme: a.objectifLong.trim() || null,
        // Compat : l'objectif moyen terme alimente aussi l'objectif principal
        // affiché partout (fiche coach, escouade…).
        objectif_principal: a.objectifMoyen.trim() || null,
        onboarding_done: true,
      }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
      if (+a.poids > 0) {
        await supabase.from("weight_entries").upsert(
          { user_id: user.id, date: todayISO(), weight_kg: +a.poids },
          { onConflict: "user_id,date" }
        );
      }
      navigate({ to: "/fusionfit/abonnement", replace: true });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-2">
        <PhoenixLogo size={56} />
        <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: FF.textMuted }}>
          Bienvenue dans l'Initiative
        </p>
      </div>

      {/* Progression */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase" style={{ color: FF.textMuted }}>
            Étape {step + 1} / {steps.length}
          </span>
          <span className="text-[10px] font-mono" style={{ color: FF.cyan }}>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: FF.surface2 }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: FF.cyan }} />
        </div>
      </div>

      {/* Question courante */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: FF.surface, borderColor: FF.border }}>
        <div className="flex items-center gap-2" style={{ color: FF.cyan }}>
          {current.icon}
          <h1 className="text-lg font-bold" style={{ color: FF.text }}>{current.titre}</h1>
        </div>
        <p className="text-sm -mt-2" style={{ color: FF.textMuted }}>{current.sous}</p>
        {current.body}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="px-4 py-3 rounded-xl border text-sm flex items-center gap-1"
            style={{ borderColor: FF.border, color: FF.textMuted }}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
        )}
        <button
          disabled={!current.valid() || saving}
          onClick={() => (isLast ? terminer() : setStep((s) => s + 1))}
          className="flex-1 py-3 rounded-xl border text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
        >
          {saving ? "Enregistrement…" : isLast ? (<><Check className="h-4 w-4" /> C'est parti</>) : (<>Continuer <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </div>
    </div>
  );
}

function Input({ placeholder, value, onChange, type = "text", autoFocus = false }: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border bg-transparent text-base outline-none"
      style={{ borderColor: FF.border, color: FF.text }}
    />
  );
}

function TextArea({ placeholder, value, onChange }: {
  placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      rows={4}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border bg-transparent text-sm outline-none resize-none leading-relaxed"
      style={{ borderColor: FF.border, color: FF.text }}
    />
  );
}
