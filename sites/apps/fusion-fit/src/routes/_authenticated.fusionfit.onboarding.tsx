import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Check, User, Ruler, Scale, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PhoenixLogo } from "@/components/phoenix-logo";
import { FF } from "@/lib/ff-colors";
import { todayISO } from "@/lib/dates";
import {
  SASS_QUESTIONS,
  EMPTY_SASS,
  deriveObjectifsFromSass,
  type SassAnswers,
  type SassQuestion,
} from "@/lib/questionnaire-sass";

export const Route = createFileRoute("/_authenticated/fusionfit/onboarding")({
  component: OnboardingPage,
});

type Identity = {
  prenom: string;
  nom: string;
  sexe: string;
  age: string;
  taille: string;
  poids: string;
};

const EMPTY_ID: Identity = {
  prenom: "",
  nom: "",
  sexe: "",
  age: "",
  taille: "",
  poids: "",
};

type StepDef = {
  key: string;
  icon: React.ReactNode;
  titre: string;
  sous: string;
  valid: () => boolean;
  body: React.ReactNode;
};

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [id, setId] = useState<Identity>(EMPTY_ID);
  const [sass, setSass] = useState<SassAnswers>({ ...EMPTY_SASS });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("prenom, onboarding_done")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_done) {
          navigate({ to: "/fusionfit/abonnement", replace: true });
          return;
        }
        if (data?.prenom) setId((p) => ({ ...p, prenom: p.prenom || data.prenom }));
      });
  }, [user, navigate]);

  function setSassField(qid: string, value: string | string[] | number | null) {
    setSass((prev) => ({ ...prev, [qid]: value }));
  }

  function toggleMulti(qid: string, opt: string) {
    setSass((prev) => {
      const cur = Array.isArray(prev[qid]) ? [...(prev[qid] as string[])] : [];
      const i = cur.indexOf(opt);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(opt);
      return { ...prev, [qid]: cur };
    });
  }

  function isSassValid(q: SassQuestion): boolean {
    const v = sass[q.id];
    if (!q.required) return true;
    if (q.type === "multi") return Array.isArray(v) && v.length > 0;
    if (q.type === "scale") return typeof v === "number";
    return typeof v === "string" && v.trim().length > 0;
  }

  const identitySteps: StepDef[] = [
    {
      key: "id-name",
      icon: <User className="h-5 w-5" />,
      titre: "Faisons connaissance",
      sous: "Ton prénom et ton nom.",
      valid: () => id.prenom.trim().length > 0,
      body: (
        <div className="space-y-3">
          <Input
            placeholder="Prénom"
            value={id.prenom}
            onChange={(v) => setId((p) => ({ ...p, prenom: v }))}
            autoFocus
          />
          <Input
            placeholder="Nom"
            value={id.nom}
            onChange={(v) => setId((p) => ({ ...p, nom: v }))}
          />
        </div>
      ),
    },
    {
      key: "id-sexe",
      icon: <User className="h-5 w-5" />,
      titre: "Tu es…",
      sous: "Pour adapter les repères d'entraînement.",
      valid: () => id.sexe !== "",
      body: (
        <ChoiceGrid
          options={["Femme", "Homme", "Autre"]}
          value={id.sexe}
          onChange={(v) => setId((p) => ({ ...p, sexe: v }))}
        />
      ),
    },
    {
      key: "id-age",
      icon: <Ruler className="h-5 w-5" />,
      titre: "Âge et taille",
      sous: "Deux repères simples.",
      valid: () => +id.age >= 10 && +id.age <= 100 && +id.taille >= 100 && +id.taille <= 250,
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Âge (ans)"
            type="number"
            value={id.age}
            onChange={(v) => setId((p) => ({ ...p, age: v }))}
          />
          <Input
            placeholder="Taille (cm)"
            type="number"
            value={id.taille}
            onChange={(v) => setId((p) => ({ ...p, taille: v }))}
          />
        </div>
      ),
    },
    {
      key: "id-poids",
      icon: <Scale className="h-5 w-5" />,
      titre: "Ton poids actuel",
      sous: "Point de départ pour ton suivi.",
      valid: () => +id.poids > 0 && +id.poids < 500,
      body: (
        <Input
          placeholder="Poids (kg)"
          type="number"
          value={id.poids}
          onChange={(v) => setId((p) => ({ ...p, poids: v }))}
        />
      ),
    },
  ];

  const sassSteps: StepDef[] = useMemo(
    () =>
      SASS_QUESTIONS.map((q) => ({
        key: q.id,
        icon: <ClipboardList className="h-5 w-5" />,
        titre: q.titre,
        sous: q.intention,
        valid: () => isSassValid(q),
        body: <SassField q={q} value={sass[q.id]} onText={setSassField} onToggle={toggleMulti} />,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sass],
  );

  const steps = [...identitySteps, ...sassSteps];
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const sassIndex = step - identitySteps.length;

  async function terminer() {
    if (!user) return;
    setSaving(true);
    try {
      const { objectifPrincipal, objectifsSecondaires, objectifMoyenTerme, objectifLongTerme } =
        deriveObjectifsFromSass(sass);
      const sante =
        typeof sass.q8_sante === "string" ? sass.q8_sante.trim() : "";
      const activites = Array.isArray(sass.q7_activites)
        ? (sass.q7_activites as string[]).join(", ")
        : "";
      const niveau = typeof sass.q6_niveau === "string" ? sass.q6_niveau : "";

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          prenom: id.prenom.trim(),
          nom: id.nom.trim() || null,
          sexe: id.sexe || null,
          age: +id.age || null,
          taille_cm: +id.taille || null,
          historique_sportif: [niveau && `Niveau : ${niveau}`, activites && `Activités : ${activites}`]
            .filter(Boolean)
            .join("\n") || null,
          antecedents_blessures: sante || null,
          objectif_principal: objectifPrincipal,
          objectif_moyen_terme: objectifMoyenTerme,
          objectif_long_terme: objectifLongTerme,
          objectifs_secondaires: objectifsSecondaires,
          questionnaire_sass: sass as never,
          onboarding_done: true,
        },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);

      if (+id.poids > 0) {
        await supabase.from("weight_entries").upsert(
          { user_id: user.id, date: todayISO(), weight_kg: +id.poids },
          { onConflict: "user_id,date" },
        );
      }

      await qc.invalidateQueries({ queryKey: ["profile-objectifs", user.id] });
      await qc.invalidateQueries({ queryKey: ["profile", user.id] });
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
          Bienvenue dans l&apos;Initiative
        </p>
        <p className="mt-1 text-[10px] font-mono" style={{ color: FF.cyan }}>
          Questionnaire Sass · cartographie athlète
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase" style={{ color: FF.textMuted }}>
            {sassIndex >= 0
              ? `Question Sass ${SASS_QUESTIONS[sassIndex]?.n ?? ""} · étape ${step + 1}/${steps.length}`
              : `Identité · étape ${step + 1}/${steps.length}`}
          </span>
          <span className="text-[10px] font-mono" style={{ color: FF.cyan }}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: FF.surface2 }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: FF.cyan }}
          />
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ background: FF.surface, borderColor: FF.border }}>
        <div className="flex items-center gap-2" style={{ color: FF.cyan }}>
          {current.icon}
          <h1 className="text-lg font-bold" style={{ color: FF.text }}>
            {current.titre}
          </h1>
        </div>
        <p className="text-sm -mt-2" style={{ color: FF.textMuted }}>
          {current.sous}
        </p>
        {current.body}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-3 rounded-xl border text-sm flex items-center gap-1"
            style={{ borderColor: FF.border, color: FF.textMuted }}
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
        )}
        <button
          disabled={!current.valid() || saving}
          onClick={() => (isLast ? terminer() : setStep((s) => s + 1))}
          className="flex-1 py-3 rounded-xl border text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ borderColor: FF.cyan, background: FF.cyanBg20, color: FF.cyan }}
        >
          {saving ? (
            "Enregistrement…"
          ) : isLast ? (
            <>
              <Check className="h-4 w-4" /> C&apos;est parti
            </>
          ) : (
            <>
              Continuer <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SassField({
  q,
  value,
  onText,
  onToggle,
}: {
  q: SassQuestion;
  value: string | string[] | number | null | undefined;
  onText: (id: string, v: string | string[] | number | null) => void;
  onToggle: (id: string, opt: string) => void;
}) {
  if (q.type === "single" && q.options) {
    return (
      <ChoiceGrid
        options={q.options}
        value={typeof value === "string" ? value : ""}
        onChange={(v) => onText(q.id, v)}
      />
    );
  }
  if (q.type === "multi" && q.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-2">
        {q.options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(q.id, opt)}
              className="text-left rounded-xl border px-3 py-2.5 text-sm font-semibold"
              style={{
                borderColor: active ? FF.cyan : FF.border,
                background: active ? FF.cyanBg20 : FF.surface2,
                color: active ? FF.cyan : FF.textMuted,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.type === "scale") {
    const min = q.scaleMin ?? 1;
    const max = q.scaleMax ?? 10;
    const cur = typeof value === "number" ? value : null;
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onText(q.id, n)}
            className="py-3 rounded-xl border text-sm font-bold"
            style={{
              borderColor: cur === n ? FF.cyan : FF.border,
              background: cur === n ? FF.cyanBg20 : FF.surface2,
              color: cur === n ? FF.cyan : FF.textMuted,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }
  if (q.type === "textarea") {
    return (
      <TextArea
        placeholder={q.placeholder ?? ""}
        value={typeof value === "string" ? value : ""}
        onChange={(v) => onText(q.id, v)}
      />
    );
  }
  return (
    <Input
      placeholder={q.placeholder ?? ""}
      value={typeof value === "string" ? value : ""}
      onChange={(v) => onText(q.id, v)}
    />
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const cols = options.length <= 3 ? "grid-cols-1" : "grid-cols-1";
  return (
    <div className={`grid ${cols} gap-2`}>
      {options.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="py-3 rounded-xl border text-sm font-semibold text-left px-3"
          style={{
            borderColor: value === s ? FF.cyan : FF.border,
            background: value === s ? FF.cyanBg20 : FF.surface2,
            color: value === s ? FF.cyan : FF.textMuted,
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  autoFocus = false,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoFocus?: boolean;
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

function TextArea({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
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
