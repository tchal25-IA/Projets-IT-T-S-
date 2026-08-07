import { useState, useEffect } from "react";
import { Award, Target, Clock, Shield, Star, Loader2, FileText, ClipboardList } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Card, EditableField } from "./profil-ui";
import { MonAbonnementCard } from "./mon-abonnement-card";
import { MonCoachCard } from "./mon-coach-card";
import { BilansVideoCard } from "@/components/bilans-video-card";
import { QuestionnaireSassCard } from "@/components/questionnaire-sass-card";
import type { SassAnswers } from "@/lib/questionnaire-sass";

type Profil = {
  prenom: string;
  objectifPrincipal: string;
  objectifMoyenTerme: string;
  objectifLongTerme: string;
  objectifsSecondaires: string[];
  historiqueSportif: string;
  antecedentsBlessures: string;
  sexe: string;
  age: string;
  tailleCm: string;
  niveauAgent: number;
  discipline: string;
  chronoMarathon: string;
  objectifCourse: string;
  profilPsycho: string;
  bio: string;
  avatarPath: string | null;
  pointsForts: string[];
  evenements: { nom: string; date: string; statut: "A venir" | "Terminé" }[];
  questionnaireSass: Record<string, unknown> | null;
};

const DEFAULT_PROFIL: Profil = {
  prenom: "Sujet Zéro",
  objectifPrincipal: "Hyrox Lyon 2026 · Marathon 2027",
  objectifMoyenTerme: "",
  objectifLongTerme: "",
  objectifsSecondaires: [],
  historiqueSportif: "",
  antecedentsBlessures: "",
  sexe: "",
  age: "",
  tailleCm: "",
  niveauAgent: 3,
  discipline: "Athlète Hybride (CrossFit / Hyrox / Marathon)",
  chronoMarathon: "Non renseigné",
  objectifCourse: "Sub-4h Marathon 2027",
  profilPsycho: "Caméléon",
  bio: "",
  avatarPath: null,
  pointsForts: ["Résilience mentale", "Endurance cardio", "Régularité"],
  evenements: [
    { nom: "Hyrox Lyon", date: "2026", statut: "A venir" },
    { nom: "Marathon Objectif", date: "2027", statut: "A venir" },
  ],
  questionnaireSass: null,
};

const NIVEAUX_AGENT = [
  { level: 1, titre: "Recrue Initiative", couleur: "var(--ff-text-muted)" },
  { level: 2, titre: "Agent Terrain", couleur: "var(--ff-amber)" },
  { level: 3, titre: "Opérateur Confirmé", couleur: "var(--ff-cyan)" },
  { level: 4, titre: "Spécialiste Hybride", couleur: "var(--ff-green)" },
  { level: 5, titre: "Élite Initiative", couleur: "oklch(0.80 0.20 300)" },
];

export function AthleteProfil() {
  const { user } = useAuth();
  const [profil, setProfil] = useState<Profil>(DEFAULT_PROFIL);
  const [editing, setEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfil({
            prenom: data.prenom ?? DEFAULT_PROFIL.prenom,
            objectifPrincipal: data.objectif_principal ?? DEFAULT_PROFIL.objectifPrincipal,
            objectifMoyenTerme: data.objectif_moyen_terme ?? "",
            objectifLongTerme: data.objectif_long_terme ?? "",
            objectifsSecondaires: Array.isArray(data.objectifs_secondaires)
              ? (data.objectifs_secondaires as string[]).filter((x) => typeof x === "string")
              : [],
            historiqueSportif: data.historique_sportif ?? "",
            antecedentsBlessures: data.antecedents_blessures ?? "",
            sexe: data.sexe ?? "",
            age: data.age != null ? String(data.age) : "",
            tailleCm: data.taille_cm != null ? String(data.taille_cm) : "",
            niveauAgent: data.niveau_agent ?? DEFAULT_PROFIL.niveauAgent,
            discipline: data.discipline ?? DEFAULT_PROFIL.discipline,
            chronoMarathon: data.chrono_marathon ?? DEFAULT_PROFIL.chronoMarathon,
            objectifCourse: data.objectif_course ?? DEFAULT_PROFIL.objectifCourse,
            profilPsycho: data.profil_psycho ?? DEFAULT_PROFIL.profilPsycho,
            bio: data.bio ?? "",
            avatarPath: data.avatar_url ?? null,
            pointsForts: Array.isArray(data.points_forts) ? (data.points_forts as string[]) : DEFAULT_PROFIL.pointsForts,
            evenements: Array.isArray(data.evenements) ? (data.evenements as Profil["evenements"]) : DEFAULT_PROFIL.evenements,
            questionnaireSass:
              data.questionnaire_sass &&
              typeof data.questionnaire_sass === "object" &&
              !Array.isArray(data.questionnaire_sass) &&
              Object.keys(data.questionnaire_sass as object).length > 0
                ? (data.questionnaire_sass as Record<string, unknown>)
                : null,
          });
        }
        setLoadingProfil(false);
      });
  }, [user]);

  const niveau = NIVEAUX_AGENT.find((n) => n.level === profil.niveauAgent) ?? NIVEAUX_AGENT[0];
  const xpPercent = ((profil.niveauAgent - 1) / 4) * 100;

  function startEdit(field: string, value: string) {
    setEditing(field);
    setTempValue(value);
  }

  async function saveEdit(field: string) {
    const updated = { ...profil, [field]: tempValue } as Profil;
    setProfil(updated);
    setEditing(null);
    await persist(updated);
  }

  async function persist(updated: Profil) {
    if (!user) return;
    setSaving(true);
    const dbRow = {
      user_id: user.id,
      prenom: updated.prenom,
      objectif_principal: updated.objectifPrincipal,
      objectif_moyen_terme: updated.objectifMoyenTerme || null,
      objectif_long_terme: updated.objectifLongTerme || null,
      objectifs_secondaires: updated.objectifsSecondaires,
      niveau_agent: updated.niveauAgent,
      discipline: updated.discipline,
      chrono_marathon: updated.chronoMarathon,
      objectif_course: updated.objectifCourse || null,
      profil_psycho: updated.profilPsycho,
      bio: updated.bio,
      avatar_url: updated.avatarPath,
      points_forts: updated.pointsForts,
      evenements: updated.evenements,
    };
    await supabase.from("profiles").upsert(dbRow, { onConflict: "user_id" });
    setSaving(false);
  }

  async function updateAvatar(path: string) {
    const updated = { ...profil, avatarPath: path };
    setProfil(updated);
    await persist(updated);
  }

  if (loadingProfil) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--ff-cyan)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl p-5 border ff-scanline"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <div className="flex items-center gap-4">
          {user && (
            <AvatarUploader
              userId={user.id}
              avatarPath={profil.avatarPath}
              size={64}
              editable
              ringColor={niveau.couleur}
              onChange={updateAvatar}
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{profil.prenom}</h1>
            <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
              {profil.discipline}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" style={{ color: niveau.couleur }} />
              <span className="text-sm font-semibold">
                Niv. {profil.niveauAgent} — {niveau.titre}
              </span>
            </div>
            <div className="flex gap-1">
              {NIVEAUX_AGENT.map((n) => (
                <Star
                  key={n.level}
                  className="h-3 w-3"
                  style={{
                    color: n.level <= profil.niveauAgent ? niveau.couleur : "var(--ff-border)",
                    fill: n.level <= profil.niveauAgent ? niveau.couleur : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ff-surface-2)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${xpPercent}%`, background: niveau.couleur }}
            />
          </div>
        </div>
      </div>

      <Card icon={<Target className="h-4 w-4" />} title="Objectifs stratégiques">
        <EditableField
          label="Objectif principal"
          value={profil.objectifPrincipal}
          field="objectifPrincipal"
          editing={editing}
          tempValue={tempValue}
          onEdit={startEdit}
          onSave={saveEdit}
          onChange={setTempValue}
        />
        <EditableField
          label="Moyen terme"
          value={profil.objectifMoyenTerme}
          field="objectifMoyenTerme"
          editing={editing}
          tempValue={tempValue}
          onEdit={startEdit}
          onSave={saveEdit}
          onChange={setTempValue}
        />
        <EditableField
          label="Long terme"
          value={profil.objectifLongTerme}
          field="objectifLongTerme"
          editing={editing}
          tempValue={tempValue}
          onEdit={startEdit}
          onSave={saveEdit}
          onChange={setTempValue}
        />
        {profil.objectifsSecondaires.length > 0 && (
          <div className="mt-3 space-y-1.5 pt-2 border-t" style={{ borderColor: "var(--ff-border)" }}>
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
              Secondaires
            </p>
            {profil.objectifsSecondaires.map((o) => (
              <p key={o} className="text-sm" style={{ color: "var(--ff-text-muted)" }}>· {o}</p>
            ))}
          </div>
        )}
        <p className="text-[10px] mt-3 font-mono" style={{ color: "var(--ff-text-muted)" }}>
          Astuce : un objectif course / compétition se renseigne comme principal, secondaire ou horizon — ce n&apos;est pas une catégorie à part.
        </p>
      </Card>

      {!profil.questionnaireSass && (
        <Card icon={<ClipboardList className="h-4 w-4" />} title="Questionnaire Sass">
          <p className="text-sm mb-3" style={{ color: "var(--ff-text-muted)" }}>
            Ton profil n&apos;est pas encore cartographié. Réponds au questionnaire pour actualiser tes objectifs (principal, secondaires, moyen / long terme).
          </p>
          <Link
            to="/fusionfit/onboarding"
            search={{ update: true }}
            className="inline-flex items-center justify-center w-full py-2.5 rounded-lg border text-sm font-bold"
            style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 15%)", color: "var(--ff-cyan)" }}
          >
            Répondre au questionnaire
          </Link>
        </Card>
      )}

      {(profil.historiqueSportif || profil.antecedentsBlessures || profil.sexe || profil.age) && !profil.questionnaireSass && (
        <Card icon={<ClipboardList className="h-4 w-4" />} title="Questionnaire d'accueil">
          {(profil.sexe || profil.age || profil.tailleCm) && (
            <p className="text-sm mb-2" style={{ color: "var(--ff-text-muted)" }}>
              {[profil.sexe, profil.age ? `${profil.age} ans` : null, profil.tailleCm ? `${profil.tailleCm} cm` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {profil.historiqueSportif && (
            <div className="mb-2">
              <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: "var(--ff-text-muted)" }}>Parcours sportif</p>
              <p className="text-sm whitespace-pre-line">{profil.historiqueSportif}</p>
            </div>
          )}
          {profil.antecedentsBlessures && (
            <div>
              <p className="text-[10px] font-mono uppercase mb-0.5" style={{ color: "var(--ff-text-muted)" }}>Santé & blessures</p>
              <p className="text-sm whitespace-pre-line">{profil.antecedentsBlessures}</p>
            </div>
          )}
        </Card>
      )}

      <QuestionnaireSassCard answers={profil.questionnaireSass as SassAnswers | null} />

      <Card icon={<FileText className="h-4 w-4" />} title="Bio">
        <textarea
          value={profil.bio}
          onChange={(e) => setProfil({ ...profil, bio: e.target.value })}
          onBlur={() => persist(profil)}
          placeholder="Quelques mots sur toi, ton histoire, tes objectifs…"
          rows={4}
          className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none"
          style={{ color: "var(--ff-text)" }}
        />
      </Card>

      <Card icon={<Clock className="h-4 w-4" />} title="Historique performance">
        <EditableField
          label="Chrono marathon"
          value={profil.chronoMarathon}
          field="chronoMarathon"
          editing={editing}
          tempValue={tempValue}
          onEdit={startEdit}
          onSave={saveEdit}
          onChange={setTempValue}
        />
      </Card>

      <Card icon={<Award className="h-4 w-4" />} title="Profil psychologique">
        <EditableField
          label="Archétype"
          value={profil.profilPsycho}
          field="profilPsycho"
          editing={editing}
          tempValue={tempValue}
          onEdit={startEdit}
          onSave={saveEdit}
          onChange={setTempValue}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profil.pointsForts.map((pf) => (
            <span
              key={pf}
              className="text-[11px] font-mono px-2 py-1 rounded-md border"
              style={{
                borderColor: "var(--ff-cyan)",
                color: "var(--ff-cyan)",
                background: "oklch(0.78 0.16 198 / 10%)",
              }}
            >
              {pf}
            </span>
          ))}
        </div>
      </Card>

      <Card icon={<Star className="h-4 w-4" />} title="Calendrier compétitions">
        <div className="space-y-2">
          {profil.evenements.map((ev, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg border"
              style={{ background: "var(--ff-surface-2)", borderColor: "var(--ff-border)" }}
            >
              <div>
                <p className="text-sm font-semibold">{ev.nom}</p>
                <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
                  {ev.date}
                </p>
              </div>
              <span
                className="text-[10px] font-mono uppercase px-2 py-1 rounded border"
                style={{
                  borderColor: ev.statut === "A venir" ? "var(--ff-amber)" : "var(--ff-green)",
                  color: ev.statut === "A venir" ? "var(--ff-amber)" : "var(--ff-green)",
                }}
              >
                {ev.statut}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <MonAbonnementCard />
      <BilansVideoCard />
      <MonCoachCard />

      <p
        className="text-center text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2"
        style={{ color: "var(--ff-text-muted)" }}
      >
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        FusionFit Initiative — Sujet Zéro Protocol
      </p>
    </div>
  );
}
