import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Award, Target, Clock, Shield, Star, Edit2, Check, Loader2, FileText, Users, MessageSquare, ChevronRight, Flame, CalendarCheck, CreditCard, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCoachId, useAthletes } from "@/hooks/use-messages";
import { useCoachOverview, useCoachReviews, useMyReview, useSaveReview } from "@/hooks/use-coaching";
import { notify, getMyPrenom } from "@/hooks/use-notifications";
import { AvatarUploader } from "@/components/avatar-uploader";
import { ABONNEMENT_PLANS, ABONNEMENT_STATUTS } from "@/lib/ff-colors";

export const Route = createFileRoute("/_authenticated/fusionfit/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const { role } = useAuth();
  return role === "coach" ? <CoachProfil /> : <AthleteProfil />;
}

type Profil = {
  prenom: string;
  objectifPrincipal: string;
  niveauAgent: number;
  discipline: string;
  chronoMarathon: string;
  objectifCourse: string;
  profilPsycho: string;
  bio: string;
  avatarPath: string | null;
  pointsForts: string[];
  evenements: { nom: string; date: string; statut: "A venir" | "Terminé" }[];
};

const DEFAULT_PROFIL: Profil = {
  prenom: "Sujet Zéro",
  objectifPrincipal: "Hyrox Lyon 2026 · Marathon 2027",
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
};

const NIVEAUX_AGENT = [
  { level: 1, titre: "Recrue Initiative", couleur: "var(--ff-text-muted)" },
  { level: 2, titre: "Agent Terrain", couleur: "var(--ff-amber)" },
  { level: 3, titre: "Opérateur Confirmé", couleur: "var(--ff-cyan)" },
  { level: 4, titre: "Spécialiste Hybride", couleur: "var(--ff-green)" },
  { level: 5, titre: "Élite Initiative", couleur: "oklch(0.80 0.20 300)" },
];

function AthleteProfil() {
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
            niveauAgent: data.niveau_agent ?? DEFAULT_PROFIL.niveauAgent,
            discipline: data.discipline ?? DEFAULT_PROFIL.discipline,
            chronoMarathon: data.chrono_marathon ?? DEFAULT_PROFIL.chronoMarathon,
            objectifCourse: data.objectif_course ?? DEFAULT_PROFIL.objectifCourse,
            profilPsycho: data.profil_psycho ?? DEFAULT_PROFIL.profilPsycho,
            bio: data.bio ?? "",
            avatarPath: data.avatar_url ?? null,
            pointsForts: Array.isArray(data.points_forts) ? (data.points_forts as string[]) : DEFAULT_PROFIL.pointsForts,
            evenements: Array.isArray(data.evenements) ? (data.evenements as Profil["evenements"]) : DEFAULT_PROFIL.evenements,
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
      niveau_agent: updated.niveauAgent,
      discipline: updated.discipline,
      chrono_marathon: updated.chronoMarathon,
      objectif_course: updated.objectifCourse,
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
          label="Objectif course"
          value={profil.objectifCourse}
          field="objectifCourse"
          editing={editing}
          tempValue={tempValue}
          onEdit={startEdit}
          onSave={saveEdit}
          onChange={setTempValue}
        />
      </Card>

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

      {/* Mon abonnement */}
      <MonAbonnementCard />

      {/* Mon coach — notation */}
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

// ── Carte « Mon abonnement » (abonné) — base à développer plus tard ───
function MonAbonnementCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<string>("decouverte");
  const [statut, setStatut] = useState<string>("essai");
  const [depuis, setDepuis] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("abonnement_plan, abonnement_statut, abonnement_depuis").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlan(data.abonnement_plan ?? "decouverte");
          setStatut(data.abonnement_statut ?? "essai");
          setDepuis(data.abonnement_depuis ?? null);
        }
      });
  }, [user]);

  const p = ABONNEMENT_PLANS[plan] ?? ABONNEMENT_PLANS.decouverte;
  const s = ABONNEMENT_STATUTS[statut] ?? ABONNEMENT_STATUTS.essai;

  return (
    <Card icon={<CreditCard className="h-4 w-4" />} title="Mon abonnement">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center border" style={{ borderColor: p.couleur, background: "var(--ff-surface-2)" }}>
            <Crown className="h-5 w-5" style={{ color: p.couleur }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: p.couleur }}>{p.nom}</p>
            <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
              {p.prix}{depuis ? ` · depuis ${new Date(depuis).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : ""}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-full border" style={{ borderColor: s.couleur, color: s.couleur }}>
          {s.label}
        </span>
      </div>
      <button
        onClick={() => navigate({ to: "/fusionfit/abonnement" })}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest"
        style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
      >
        Gérer mon abonnement <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <p className="text-center text-[10px] font-mono mt-2" style={{ color: "var(--ff-text-muted)" }}>
        Paiement sécurisé bientôt disponible
      </p>
    </Card>
  );
}

// ── Étoiles cliquables ────────────────────────────────────────────────
function StarRating({ value, onChange, size = 22, readOnly = false }: {
  value: number; onChange?: (v: number) => void; size?: number; readOnly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={readOnly ? "" : "transition-transform hover:scale-110"}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            style={{
              width: size, height: size,
              color: n <= value ? "var(--ff-amber)" : "var(--ff-border)",
              fill: n <= value ? "var(--ff-amber)" : "transparent",
            }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Carte « Mon coach » côté abonné (voir + noter) ────────────────────
function MonCoachCard() {
  const { data: coachId, isLoading: loadingCoach } = useCoachId();
  const [coachName, setCoachName] = useState<string>("Coach");
  const { data: reviews } = useCoachReviews(coachId);
  const { data: myReview } = useMyReview(coachId);
  const { mutateAsync: saveReview, isPending } = useSaveReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!coachId) return;
    supabase.from("profiles").select("prenom").eq("user_id", coachId).maybeSingle()
      .then(({ data }) => { if (data?.prenom) setCoachName(data.prenom); });
  }, [coachId]);

  useEffect(() => {
    if (myReview) { setRating(myReview.rating); setComment(myReview.comment ?? ""); }
  }, [myReview]);

  // État explicite : pas encore de coach rattaché (au lieu de masquer la carte).
  if (!loadingCoach && !coachId) {
    return (
      <Card icon={<Shield className="h-4 w-4" />} title="Mon coach">
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucun coach rattaché à ton compte. Rejoins un coach via son lien
          d'invitation ou son QR code pour pouvoir le noter et recevoir tes
          séances personnalisées.
        </p>
      </Card>
    );
  }
  if (!coachId) return null;

  async function envoyer() {
    if (!rating) { alert("Choisis une note."); return; }
    try {
      await saveReview({ coachId: coachId!, rating, comment: comment.trim() || null });
      const { data: { user: me } } = await supabase.auth.getUser();
      const prenom = me ? await getMyPrenom(me.id) : "Un abonné";
      await notify(coachId!, "avis", `${prenom} t'a noté ${rating}/5`,
        comment.trim() || null, "/fusionfit/profil");
      setSavedMsg("Merci pour ton avis ✓");
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <Card icon={<Shield className="h-4 w-4" />} title="Mon coach">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-sm font-bold">{coachName}</p>
        {reviews?.avg != null && (
          <span className="flex items-center gap-1 text-sm font-bold" style={{ color: "var(--ff-amber)" }}>
            <Star className="h-4 w-4" style={{ fill: "var(--ff-amber)", color: "var(--ff-amber)" }} />
            {reviews.avg} <span className="text-[10px] font-mono" style={{ color: "var(--ff-text-muted)" }}>({reviews.count})</span>
          </span>
        )}
      </div>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--ff-text-muted)" }}>
        {myReview ? "Ton avis" : "Note ton coach"}
      </p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Un mot sur ton coach (optionnel)…"
        rows={2}
        className="w-full mt-2 px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
      />
      <button
        onClick={envoyer}
        disabled={isPending}
        className="w-full mt-2 py-2 rounded-lg border text-xs font-bold"
        style={{ borderColor: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 15%)", color: "var(--ff-amber)" }}
      >
        {isPending ? "…" : myReview ? "Mettre à jour mon avis" : "Envoyer mon avis"}
      </button>
      {savedMsg && <p className="text-[10px] mt-1" style={{ color: "var(--ff-green)" }}>{savedMsg}</p>}
    </Card>
  );
}

// ── Profil COACH ──────────────────────────────────────────────────────
function CoachProfil() {
  const { user } = useAuth();
  const { data: overview } = useCoachOverview();
  const { data: reviews } = useCoachReviews(user?.id);
  const [prenom, setPrenom] = useState("Coach");
  const [bio, setBio] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("prenom, bio, avatar_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setPrenom(data.prenom ?? "Coach"); setBio(data.bio ?? ""); setAvatarPath(data.avatar_url ?? null); }
        setLoading(false);
      });
  }, [user]);

  async function persist(patch: Record<string, unknown>) {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--ff-cyan)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* En-tête coach */}
      <div className="rounded-2xl p-5 border ff-scanline" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-amber)" }}>
        <div className="flex items-center gap-4">
          {user && (
            <AvatarUploader
              userId={user.id}
              avatarPath={avatarPath}
              size={64}
              editable
              ringColor="var(--ff-amber)"
              onChange={(p) => { setAvatarPath(p); persist({ avatar_url: p }); }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] flex items-center gap-1" style={{ color: "var(--ff-amber)" }}>
              <Shield className="h-3 w-3" /> Coach Initiative
            </p>
            <h1 className="text-xl font-bold truncate mt-0.5">{prenom}</h1>
          </div>
        </div>

        {/* Stats coach */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl p-3 border text-center" style={{ background: "var(--ff-surface-2)", borderColor: "var(--ff-border)" }}>
            <Users className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--ff-cyan)" }} />
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--ff-cyan)" }}>{overview?.nbAbonnes ?? 0}</p>
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>abonné(s)</p>
          </div>
          <div className="rounded-xl p-3 border text-center" style={{ background: "var(--ff-surface-2)", borderColor: "var(--ff-border)" }}>
            <Star className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--ff-amber)", fill: "var(--ff-amber)" }} />
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--ff-amber)" }}>
              {overview?.avgRating != null ? overview.avgRating : "—"}
            </p>
            <p className="text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
              note ({overview?.nbReviews ?? 0} avis)
            </p>
          </div>
        </div>
      </div>

      {/* Mes abonnés — cliquables vers la fiche détaillée */}
      <CoachAbonnesList />

      {/* Description */}
      <Card icon={<FileText className="h-4 w-4" />} title="Description publique">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          onBlur={() => persist({ bio })}
          placeholder="Présente ton approche, tes spécialités, ton parcours… (visible par tes abonnés)"
          rows={4}
          className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none"
          style={{ color: "var(--ff-text)" }}
        />
      </Card>

      {/* Avis reçus */}
      <Card icon={<MessageSquare className="h-4 w-4" />} title={`Avis de mes abonnés (${reviews?.count ?? 0})`}>
        {!reviews || reviews.count === 0 ? (
          <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
            Aucun avis pour le moment. Tes abonnés pourront te noter depuis leur profil.
          </p>
        ) : (
          <div className="space-y-2">
            {reviews.list.map((r) => (
              <div key={r.id} className="rounded-lg border p-2.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
                <StarRating value={r.rating} readOnly size={16} />
                {r.comment && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--ff-text)" }}>« {r.comment} »</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-center text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2" style={{ color: "var(--ff-text-muted)" }}>
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        FusionFit Initiative — Console Coach
      </p>
    </div>
  );
}

// ── Liste des abonnés du coach (cliquable → fiche détaillée) ──────────
function CoachAbonnesList() {
  const { data: athletes = [], isLoading } = useAthletes();

  return (
    <Card icon={<Users className="h-4 w-4" />} title={`Mes abonnés (${athletes.length})`}>
      {isLoading ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>Chargement…</p>
      ) : athletes.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucun abonné rattaché. Invite-en un depuis l'onglet Escouade.
        </p>
      ) : (
        <div className="space-y-2">
          {athletes.map((a) => (
            <Link
              key={a.user_id}
              to="/fusionfit/escouade/$abonneId"
              params={{ abonneId: a.user_id }}
              className="flex items-center gap-3 rounded-lg border p-2.5 transition hover:opacity-90"
              style={{ background: "var(--ff-surface-2)", borderColor: "var(--ff-border)" }}
            >
              <AvatarUploader userId={a.user_id} avatarPath={a.avatar_url} size={38} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{a.prenom}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono mt-0.5" style={{ color: "var(--ff-text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3" /> {a.total_checkins} séance(s)
                  </span>
                  {a.avg_energie != null && (
                    <span className="flex items-center gap-1" style={{ color: "var(--ff-amber)" }}>
                      <Flame className="h-3 w-3" /> {a.avg_energie}/5
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color: "var(--ff-text-muted)" }}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  field,
  editing,
  tempValue,
  onEdit,
  onSave,
  onChange,
}: {
  label: string;
  value: string;
  field: string;
  editing: string | null;
  tempValue: string;
  onEdit: (f: string, v: string) => void;
  onSave: (f: string) => Promise<void>;
  onChange: (v: string) => void;
}) {
  const isEditing = editing === field;
  return (
    <div className="flex items-start justify-between gap-3 py-2 group">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
          {label}
        </p>
        {isEditing ? (
          <input
            autoFocus
            className="mt-1 w-full bg-transparent border-b text-sm font-semibold outline-none"
            style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-text)" }}
            value={tempValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave(field)}
          />
        ) : (
          <p className="mt-1 text-sm font-semibold">{value}</p>
        )}
      </div>
      <button
        onClick={() => (isEditing ? onSave(field) : onEdit(field, value))}
        className="mt-4 flex-shrink-0"
        style={{ color: "var(--ff-cyan)" }}
        aria-label="Modifier"
      >
        {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
