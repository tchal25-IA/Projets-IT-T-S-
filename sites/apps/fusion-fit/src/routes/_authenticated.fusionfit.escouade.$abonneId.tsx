import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Save, Plus, Trash2, Target, Sparkles, BookOpen, X, Smile, Timer, Library, Check, MessageSquare, Dumbbell, Repeat, Activity, Calendar, CreditCard, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FatigueAnalysisCard } from "@/components/fatigue-analysis-card";
import { PROGRAM_TEMPLATES, PROTOCOLES, type Bloc } from "@/data/program-templates";
import {
  useCoachSessionFor, useSaveCoachSession, useSetSessionComment, type CoachBloc,
} from "@/hooks/use-coaching";
import { notify } from "@/hooks/use-notifications";
import { useAbonneProgramCompletions } from "@/hooks/use-program-completions";
import { PILIER_COLORS, ABONNEMENT_PLANS, ABONNEMENT_STATUTS } from "@/lib/ff-colors";

export const Route = createFileRoute("/_authenticated/fusionfit/escouade/$abonneId")({
  component: AbonneDetailPage,
});

type Profile = {
  user_id: string;
  prenom: string;
  email: string | null;
  objectif_principal: string | null;
  objectif_course: string | null;
  discipline: string | null;
  niveau_agent: number;
  abonnement_plan: string | null;
  abonnement_statut: string | null;
};

type Program = {
  id?: string;
  abonne_id: string;
  coach_id: string;
  titre: string;
  objectif: string;
  blocs: Bloc[];
};

// Session récente de l'abonné (check-in + ressenti) lisible par le coach via RLS dédiée.
type Session = {
  id: string;
  date: string;
  serenite: number;
  energie: number;
  humeur: number;
  nb_blocs: number;
  blocs_completes: number[];
  session_duration_sec: number | null;
  session_ended: boolean;
  ressenti_score: number | null;
  ressenti_note: string | null;
  coach_comment: string | null;
  session_source: string | null;
};

// Template enregistré par le coach dans sa bibliothèque (table program_templates).
type DbTemplate = { id: string; titre: string; objectif: string | null; blocs: Bloc[] };

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const RESSENTI_LABELS = ["", "Très dur", "Dur", "Correct", "Facile", "Très facile"];

function formatDuree(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function AbonneDetailPage() {
  const { abonneId } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prog, setProg] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [protoTargetIdx, setProtoTargetIdx] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myTemplates, setMyTemplates] = useState<DbTemplate[]>([]);
  const [savedTplMsg, setSavedTplMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== "coach") return;
    (async () => {
      try {
        const { data: p, error: pErr } = await supabase.from("profiles").select("*").eq("user_id", abonneId).maybeSingle();
        if (pErr) setLoadError(pErr.message);
        setProfile(p as Profile);

      // Sessions récentes de l'abonné (ressenti + durée) — RLS "Coach lit check-ins de ses abonnés"
      const { data: chk } = await supabase
        .from("check_ins")
        .select("id, date, serenite, energie, humeur, nb_blocs, blocs_completes, session_duration_sec, session_ended, ressenti_score, ressenti_note, coach_comment, session_source")
        .eq("user_id", abonneId)
        .order("created_at", { ascending: false })
        .limit(30);
      setSessions((chk as Session[]) ?? []);

      // Templates de la bibliothèque du coach
      const { data: tpls } = await supabase
        .from("program_templates")
        .select("id, titre, objectif, blocs")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });
      setMyTemplates(((tpls ?? []) as unknown) as DbTemplate[]);

      const { data: prg } = await supabase
        .from("programs")
        .select("*")
        .eq("abonne_id", abonneId)
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prg) {
        setProg({
          id: prg.id,
          abonne_id: prg.abonne_id,
          coach_id: prg.coach_id,
          titre: prg.titre,
          objectif: prg.objectif ?? "",
          blocs: Array.isArray(prg.blocs) ? (prg.blocs as unknown as Bloc[]) : [],
        });
      } else {
        setProg({
          abonne_id: abonneId,
          coach_id: user.id,
          titre: "Programme hebdo",
          objectif: "",
          blocs: [{ jour: "Lundi", titre: "Séance 1", details: "" }],
        });
      }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoaded(true);
      }
    })();
  }, [user, role, abonneId]);

  async function ouvrirChat() {
    if (!user) return;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("coach_id", user.id)
      .eq("abonne_id", abonneId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("conversations").insert({ coach_id: user.id, abonne_id: abonneId });
    }
    // Ouvre directement la conversation avec cet abonné (deep link).
    navigate({ to: "/fusionfit/messagerie", search: { with: abonneId } });
  }

  async function notifierMiseAJour(progTitre: string) {
    if (!user) return;
    // Récupère ou crée la conversation
    let convId: string | null = null;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("coach_id", user.id)
      .eq("abonne_id", abonneId)
      .maybeSingle();
    if (existing) {
      convId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ coach_id: user.id, abonne_id: abonneId })
        .select("id")
        .single();
      convId = created?.id ?? null;
    }
    if (!convId) return;
    await supabase.from("messages").insert({
      conversation_id: convId,
      from_user_id: user.id,
      texte: `🔔 Ton coach vient de mettre à jour ton programme « ${progTitre} ». Retrouve-le dans ta Routine.`,
      type: "notification",
    });
    // Fait avancer last_message_at pour déclencher le badge non-lu côté abonné.
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", convId);
  }

  async function sauvegarder() {
    if (!prog) return;
    setSaving(true);
    const payload = {
      abonne_id: prog.abonne_id,
      coach_id: prog.coach_id,
      titre: prog.titre,
      objectif: prog.objectif,
      blocs: prog.blocs as unknown as any,
    };
    let res;
    if (prog.id) {
      res = await supabase.from("programs").update(payload).eq("id", prog.id).select().single();
    } else {
      res = await supabase.from("programs").insert(payload).select().single();
    }
    if (res.error) {
      alert(res.error.message);
    } else {
      setProg((p) => (p ? { ...p, id: res.data.id } : p));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      await notifierMiseAJour(prog.titre);
      await notify(abonneId, "programme", "Programme mis à jour",
        `Ton coach a mis à jour ton programme « ${prog.titre} ».`, "/fusionfit/stats");
    }
    setSaving(false);
  }

  function appliquerTemplate(tplId: string) {
    const tpl = PROGRAM_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl || !prog) return;
    if (prog.blocs.length > 0 && !confirm(`Remplacer le programme actuel par « ${tpl.titre} » ?`)) return;
    setProg({ ...prog, titre: tpl.titre, objectif: tpl.objectif, blocs: tpl.blocs.map((b) => ({ ...b })) });
    setShowTemplates(false);
  }

  function appliquerDbTemplate(tpl: DbTemplate) {
    if (!prog) return;
    if (prog.blocs.length > 0 && !confirm(`Remplacer le programme actuel par « ${tpl.titre} » ?`)) return;
    setProg({
      ...prog,
      titre: tpl.titre,
      objectif: tpl.objectif ?? "",
      blocs: (tpl.blocs ?? []).map((b) => ({ ...b })),
    });
    setShowTemplates(false);
  }

  async function sauvegarderCommeTemplate() {
    if (!user || !prog || !prog.titre.trim()) {
      alert("Donne un titre au programme avant de l'enregistrer comme template.");
      return;
    }
    const payload = {
      coach_id: user.id,
      titre: prog.titre.trim(),
      objectif: prog.objectif.trim() || null,
      blocs: prog.blocs.filter((b) => b.titre.trim() || b.details.trim()) as unknown as any,
    };
    const { data, error } = await supabase.from("program_templates").insert(payload).select("id, titre, objectif, blocs").single();
    if (error) { alert(error.message); return; }
    setMyTemplates((p) => [((data as unknown) as DbTemplate), ...p]);
    setSavedTplMsg("Ajouté à ta bibliothèque ✓");
    setTimeout(() => setSavedTplMsg(null), 2500);
  }

  function insererProtocole(idx: number, protoId: string) {
    const proto = PROTOCOLES.find((p) => p.id === protoId);
    if (!proto || !prog) return;
    setProg({
      ...prog,
      blocs: prog.blocs.map((b, j) =>
        j === idx
          ? {
              ...b,
              titre: b.titre || proto.titre,
              details: b.details ? `${b.details}\n— ${proto.titre}\n${proto.contenu}` : proto.contenu,
            }
          : b
      ),
    });
    setProtoTargetIdx(null);
  }

  function updBloc(i: number, patch: Partial<Bloc>) {
    setProg((p) => (p ? { ...p, blocs: p.blocs.map((b, j) => (j === i ? { ...b, ...patch } : b)) } : p));
  }
  function addBloc() {
    setProg((p) => (p ? { ...p, blocs: [...p.blocs, { jour: "Lundi", titre: "", details: "" }] } : p));
  }
  function delBloc(i: number) {
    setProg((p) => (p ? { ...p, blocs: p.blocs.filter((_, j) => j !== i) } : p));
  }

  if (role !== "coach") return <p className="text-center mt-12 text-sm">Réservé au coach.</p>;
  if (!loaded) return <p className="text-center mt-12 text-sm" style={{ color: "var(--ff-text-muted)" }}>Chargement…</p>;

  const prenom = profile?.prenom ?? "Abonné";

  return (
    <div className="space-y-5">
      <Link to="/fusionfit/escouade" className="flex items-center gap-1 text-xs" style={{ color: "var(--ff-text-muted)" }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Escouade
      </Link>

      {loadError && (
        <div className="rounded-xl border p-3 text-xs" style={{ borderColor: "var(--ff-red)", background: "oklch(0.65 0.20 22 / 10%)", color: "var(--ff-red)" }}>
          Certaines données n'ont pas pu être chargées : {loadError}
        </div>
      )}

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            Abonné{profile ? ` · Niveau ${profile.niveau_agent}` : ""}
          </p>
          <h1 className="text-2xl font-bold mt-1">{prenom}</h1>
          <p className="text-xs mt-1" style={{ color: "var(--ff-text-muted)" }}>
            {profile?.email}
          </p>
        </div>
        <button
          onClick={ouvrirChat}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)", color: "var(--ff-cyan)" }}
        >
          <MessageCircle className="h-4 w-4" /> Chat
        </button>
      </header>

      {/* Objectifs */}
      <section
        className="rounded-2xl border p-4 space-y-1"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-amber)" }}>
          <Target className="h-3 w-3" /> Objectifs de l'abonné
        </p>
        <p className="text-sm"><b>Principal :</b> {profile?.objectif_principal || "—"}</p>
        <p className="text-sm"><b>Course :</b> {profile?.objectif_course || "—"}</p>
        <p className="text-sm"><b>Discipline :</b> {profile?.discipline || "—"}</p>
      </section>

      {/* Abonnement de l'abonné */}
      {(() => {
        const p = ABONNEMENT_PLANS[profile?.abonnement_plan ?? "decouverte"] ?? ABONNEMENT_PLANS.decouverte;
        const st = ABONNEMENT_STATUTS[profile?.abonnement_statut ?? "essai"] ?? ABONNEMENT_STATUTS.essai;
        return (
          <section className="rounded-2xl border p-4 flex items-center justify-between gap-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg grid place-items-center border" style={{ borderColor: p.couleur, background: "var(--ff-surface-2)" }}>
                <Crown className="h-4 w-4" style={{ color: p.couleur }} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-text-muted)" }}>
                  <CreditCard className="h-3 w-3" /> Abonnement
                </p>
                <p className="font-bold text-sm" style={{ color: p.couleur }}>{p.nom} <span className="text-[11px] font-normal" style={{ color: "var(--ff-text-muted)" }}>· {p.prix}</span></p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-1 rounded-full border" style={{ borderColor: st.couleur, color: st.couleur }}>
              {st.label}
            </span>
          </section>
        );
      })()}

      {/* Performance globale */}
      <PerformanceRecap sessions={sessions} />

      {/* Historique du programme (validations jour par jour de l'abonné) */}
      <ProgrammeHistorique abonneId={abonneId} />

      {/* IA Fatigue */}
      <FatigueAnalysisCard targetUserId={abonneId} audience="coach" />

      {/* Ressenti & sessions récentes */}
      <section
        className="rounded-2xl border p-4 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-green)" }}>
          <Smile className="h-3.5 w-3.5" /> Ressenti & sessions récentes
        </p>
        {sessions.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
            Aucune session enregistrée pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionRow key={s.id} s={s} abonneId={abonneId} />
            ))}
          </div>
        )}
      </section>

      {/* Séance personnalisée du jour */}
      <SeancePersoEditor abonneId={abonneId} prenom={prenom} />

      {/* Programme */}
      {prog && (
      <section
        className="rounded-2xl border p-4 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ff-cyan)" }}>
            Programme hebdomadaire
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)", background: "oklch(0.78 0.18 55 / 12%)" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Templates
            </button>
            <button
              onClick={sauvegarderCommeTemplate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 12%)" }}
            >
              <Library className="h-3.5 w-3.5" /> Sauver tpl
            </button>
            <button
              onClick={sauvegarder}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)", background: "oklch(0.65 0.18 145 / 12%)" }}
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>
        {savedTplMsg && <p className="text-[10px]" style={{ color: "var(--ff-cyan)" }}>{savedTplMsg}</p>}
        {savedAt && <p className="text-[10px]" style={{ color: "var(--ff-green)" }}>Sauvegardé à {savedAt} · notification envoyée à l'abonné</p>}

        <input
          value={prog.titre}
          onChange={(e) => setProg({ ...prog, titre: e.target.value })}
          placeholder="Titre du programme"
          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
          style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
        />
        <textarea
          value={prog.objectif}
          onChange={(e) => setProg({ ...prog, objectif: e.target.value })}
          placeholder="Objectif du cycle (adapter aux objectifs de l'abonné…)"
          rows={2}
          className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
          style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
        />

        <div className="space-y-2">
          {prog.blocs.map((b, i) => (
            <div key={i} className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
              <div className="flex gap-2">
                <select
                  value={b.jour}
                  onChange={(e) => updBloc(i, { jour: e.target.value })}
                  className="px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                >
                  {JOURS.map((j) => (
                    <option key={j} value={j} style={{ background: "var(--ff-bg)" }}>{j}</option>
                  ))}
                </select>
                <input
                  value={b.titre}
                  onChange={(e) => updBloc(i, { titre: e.target.value })}
                  placeholder="Titre séance"
                  className="flex-1 px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                />
                <button onClick={() => delBloc(i)} className="p-1" style={{ color: "var(--ff-text-muted)" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={b.details}
                onChange={(e) => updBloc(i, { details: e.target.value })}
                placeholder="Détails (séries, charges, intensité…)"
                rows={2}
                className="w-full px-2 py-1 rounded border bg-transparent text-xs outline-none resize-none"
                style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
              />
              <button
                onClick={() => setProtoTargetIdx(i)}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border"
                style={{ borderColor: "var(--ff-border)", color: "var(--ff-cyan)" }}
              >
                <BookOpen className="h-3 w-3" /> Insérer un protocole
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addBloc}
          className="w-full py-2 rounded-lg border border-dashed text-xs flex items-center justify-center gap-1"
          style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une séance
        </button>
      </section>
      )}

      {/* Modal Templates */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-4 space-y-3"
            style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--ff-amber)" }} />
                Templates de programme
              </h2>
              <button onClick={() => setShowTemplates(false)}>
                <X className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
              Sélectionne un modèle prêt à l'emploi. Tu pourras le modifier ensuite.
            </p>

            {myTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
                  <Library className="h-3 w-3" /> Ma bibliothèque
                </p>
                {myTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => appliquerDbTemplate(tpl)}
                    className="w-full text-left rounded-lg border p-3 space-y-1"
                    style={{ background: "var(--ff-surface)", borderColor: "var(--ff-cyan)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" style={{ color: "var(--ff-cyan)" }} /> {tpl.titre}
                      </h3>
                      <span className="text-[10px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
                        {(tpl.blocs ?? []).length} séances
                      </span>
                    </div>
                    {tpl.objectif && <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>{tpl.objectif}</p>}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-amber)" }}>
                Modèles prêts à l'emploi
              </p>
              {PROGRAM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => appliquerTemplate(tpl.id)}
                  className="w-full text-left rounded-lg border p-3 space-y-1"
                  style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{tpl.titre}</h3>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>
                      {tpl.cible}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>{tpl.objectif}</p>
                  <div className="flex gap-2 text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
                    <span>{tpl.niveau}</span>
                    <span>·</span>
                    <span>{tpl.duree}</span>
                    <span>·</span>
                    <span>{tpl.blocs.length} séances</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Protocole */}
      {protoTargetIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={() => setProtoTargetIdx(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-4 space-y-3"
            style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4" style={{ color: "var(--ff-cyan)" }} />
                Insérer un protocole
              </h2>
              <button onClick={() => setProtoTargetIdx(null)}>
                <X className="h-4 w-4" style={{ color: "var(--ff-text-muted)" }} />
              </button>
            </div>
            <div className="space-y-2">
              {PROTOCOLES.map((proto) => (
                <button
                  key={proto.id}
                  onClick={() => insererProtocole(protoTargetIdx, proto.id)}
                  className="w-full text-left rounded-lg border p-3 space-y-1"
                  style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{proto.titre}</h3>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
                      {proto.pilier}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>{proto.contenu}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recap performance de l'abonné (agrégé sur ses séances) ────────────
function PerformanceRecap({ sessions }: { sessions: Session[] }) {
  const done = sessions.filter((s) => s.session_ended);
  const n = done.length;

  if (n === 0) {
    return (
      <section className="rounded-2xl border p-4" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1 mb-2" style={{ color: "var(--ff-cyan)" }}>
          <Activity className="h-3.5 w-3.5" /> Performance
        </p>
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucune séance terminée pour le moment. Les stats apparaîtront dès la première séance de l'abonné.
        </p>
      </section>
    );
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const sereniteMoy = Math.round(avg(done.map((s) => s.serenite)));
  const completion = Math.round(
    avg(done.map((s) => (s.nb_blocs > 0 ? ((s.blocs_completes?.length ?? 0) / s.nb_blocs) * 100 : 0)))
  );
  const ressentis = done.map((s) => s.ressenti_score).filter((v): v is number => v != null);
  const ressentiMoy = ressentis.length ? +(avg(ressentis)).toFixed(1) : null;
  const dureeMoy = Math.round(avg(done.map((s) => s.session_duration_sec ?? 0)) / 60);
  const nbCoach = done.filter((s) => s.session_source === "coach").length;
  const nbBase = n - nbCoach;

  // Complétion par activité (piliers) sur les séances "base" (ordre fixe Bouger/Respirer/Nourrir)
  const base = done.filter((s) => s.session_source !== "coach");
  const PIL = [{ idx: 0, key: "Bouger" as const }, { idx: 1, key: "Respirer" as const }, { idx: 2, key: "Nourrir" as const }];
  const parActivite = PIL.map(({ idx, key }) => {
    const presentes = base.filter((s) => s.nb_blocs > idx);
    const faites = presentes.filter((s) => (s.blocs_completes ?? []).includes(idx));
    return { key, total: presentes.length, fait: faites.length };
  }).filter((p) => p.total > 0);

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
      <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
        <Activity className="h-3.5 w-3.5" /> Performance · {n} séance{n > 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Complétion moy." value={`${completion}%`} color="var(--ff-cyan)" />
        <Stat label="Sérénité moy." value={`${sereniteMoy}%`} color="var(--ff-cyan)" />
        <Stat label="Ressenti moy." value={ressentiMoy != null ? `${ressentiMoy}/5` : "—"} color="var(--ff-green)" />
        <Stat label="Durée moy." value={`${dureeMoy} min`} color="var(--ff-amber)" />
      </div>

      <div className="flex gap-2 text-[10px] font-mono uppercase" style={{ color: "var(--ff-text-muted)" }}>
        <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--ff-border)" }}>{nbBase} base</span>
        <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>{nbCoach} coach</span>
      </div>

      {parActivite.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ff-text-muted)" }}>
            Complétion par activité (base)
          </p>
          {parActivite.map((p) => {
            const col = PILIER_COLORS[p.key];
            const pct = Math.round((p.fait / p.total) * 100);
            return (
              <div key={p.key}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span style={{ color: col.text }}>{p.key}</span>
                  <span style={{ color: "var(--ff-text-muted)" }}>{p.fait}/{p.total} · {pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ff-surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col.text }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border p-2.5 text-center" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
      <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--ff-text-muted)" }}>{label}</p>
    </div>
  );
}

const RESSENTI_LABELS_HIST = ["", "Très dur", "Dur", "Correct", "Facile", "Très facile"];

// ── Historique des validations du programme par l'abonné (vu par le coach) ─
function ProgrammeHistorique({ abonneId }: { abonneId: string }) {
  const { data: completions = [], isLoading } = useAbonneProgramCompletions(abonneId);

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}>
      <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
        <Calendar className="h-3.5 w-3.5" /> Historique du programme
      </p>
      {isLoading ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>Chargement…</p>
      ) : completions.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Aucune séance de programme validée pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {completions.map((c) => (
            <div key={c.id} className="rounded-lg border p-2.5" style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {c.jour} · {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border flex items-center gap-1"
                  style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)" }}>
                  <Check className="h-2.5 w-2.5" /> Fait
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--ff-text-muted)" }}>{c.titre}</p>
              {c.ressenti_score != null && (
                <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
                  <Smile className="h-3 w-3" /> Ressenti : {RESSENTI_LABELS_HIST[c.ressenti_score]}
                </p>
              )}
              {c.ressenti_note && (
                <p className="text-xs italic mt-1" style={{ color: "var(--ff-text)" }}>« {c.ressenti_note} »</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Carte d'une session passée + commentaire éditable du coach ────────
function SessionRow({ s, abonneId }: { s: Session; abonneId: string }) {
  const { mutateAsync: saveComment, isPending } = useSetSessionComment();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.coach_comment ?? "");
  const [comment, setComment] = useState(s.coach_comment ?? "");

  const ressColor =
    s.ressenti_score == null ? "var(--ff-text-muted)"
    : s.ressenti_score <= 2 ? "oklch(0.65 0.22 25)"
    : s.ressenti_score === 3 ? "var(--ff-amber)"
    : "var(--ff-green)";

  async function envoyer() {
    try {
      await saveComment({ checkinId: s.id, comment: draft.trim() });
      setComment(draft.trim());
      setEditing(false);
      if (draft.trim()) {
        await notify(abonneId, "commentaire", "Ton coach a commenté ta séance",
          draft.trim(), "/fusionfit/stats");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div
      className="rounded-lg border p-2.5 space-y-1.5"
      style={{ borderColor: "var(--ff-border)", background: "var(--ff-surface-2)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
        </p>
        <div className="flex items-center gap-2">
          {s.session_source === "coach" && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-cyan)" }}>
              séance coach
            </span>
          )}
          {!s.session_ended && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--ff-amber)", color: "var(--ff-amber)" }}>
              en cours
            </span>
          )}
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--ff-cyan)" }}>{s.serenite}%</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono" style={{ color: "var(--ff-text-muted)" }}>
        <span>⚡ Énergie {s.energie}/5</span>
        <span>🧠 Humeur {s.humeur}/5</span>
        <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatDuree(s.session_duration_sec)}</span>
      </div>
      {s.ressenti_score != null && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: ressColor }}>
          <Smile className="h-3 w-3" />
          <span className="font-semibold">Ressenti : {RESSENTI_LABELS[s.ressenti_score]}</span>
        </div>
      )}
      {s.ressenti_note && (
        <p className="text-xs italic leading-relaxed" style={{ color: "var(--ff-text)" }}>
          « {s.ressenti_note} »
        </p>
      )}

      {/* Commentaire du coach */}
      {!editing && comment && (
        <div className="rounded-md border p-2 mt-1" style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 8%)" }}>
          <p className="text-[10px] font-mono uppercase mb-0.5 flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
            <MessageSquare className="h-3 w-3" /> Ton commentaire (visible par l'abonné)
          </p>
          <p className="text-xs" style={{ color: "var(--ff-text)" }}>{comment}</p>
          <button onClick={() => { setDraft(comment); setEditing(true); }} className="text-[10px] mt-1 underline" style={{ color: "var(--ff-text-muted)" }}>
            Modifier
          </button>
        </div>
      )}
      {!editing && !comment && (
        <button
          onClick={() => { setDraft(""); setEditing(true); }}
          className="flex items-center gap-1 text-[11px] mt-1"
          style={{ color: "var(--ff-cyan)" }}
        >
          <MessageSquare className="h-3 w-3" /> Ajouter un commentaire
        </button>
      )}
      {editing && (
        <div className="space-y-1.5 mt-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Feedback sur cette séance (visible par l'abonné)…"
            rows={2}
            className="w-full px-2 py-1.5 rounded border bg-transparent text-xs outline-none resize-none"
            style={{ borderColor: "var(--ff-cyan)", color: "var(--ff-text)" }}
          />
          <div className="flex gap-2">
            <button onClick={envoyer} disabled={isPending}
              className="flex-1 py-1 rounded border text-[11px] font-bold"
              style={{ borderColor: "var(--ff-cyan)", background: "oklch(0.78 0.16 198 / 20%)", color: "var(--ff-cyan)" }}>
              {isPending ? "…" : "Enregistrer"}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1 rounded border text-[11px]"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const PILIERS: Array<CoachBloc["pilier"]> = ["Bouger", "Respirer", "Nourrir"];

// ── Éditeur de la séance personnalisée du jour (coach) ────────────────
function SeancePersoEditor({ abonneId, prenom }: { abonneId: string; prenom: string }) {
  const { data: existing, isLoading } = useCoachSessionFor(abonneId);
  const { mutateAsync: save, isPending } = useSaveCoachSession();
  const [titre, setTitre] = useState("");
  const [objectif, setObjectif] = useState("");
  const [frequence, setFrequence] = useState(3);
  const [mode, setMode] = useState<"recurrent" | "jour">("recurrent");
  const [dateSeance, setDateSeance] = useState("");
  const [actif, setActif] = useState(true);
  const [blocs, setBlocs] = useState<CoachBloc[]>([{ pilier: "Bouger", titre: "", exercices: [] }]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isLoading || hydrated) return;
    if (existing) {
      setTitre(existing.titre);
      setObjectif(existing.objectif ?? "");
      setFrequence(existing.frequence_jours);
      setActif(existing.actif);
      if (existing.date_seance) { setMode("jour"); setDateSeance(existing.date_seance); }
      setBlocs(existing.blocs.length ? existing.blocs : [{ pilier: "Bouger", titre: "", exercices: [] }]);
    }
    setHydrated(true);
  }, [existing, isLoading, hydrated]);

  function updBloc(i: number, patch: Partial<CoachBloc>) {
    setBlocs((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  }
  function addBlocPerso() {
    setBlocs((bs) => [...bs, { pilier: "Bouger", titre: "", exercices: [] }]);
  }
  function delBlocPerso(i: number) {
    setBlocs((bs) => bs.filter((_, j) => j !== i));
  }

  async function enregistrer() {
    if (!titre.trim()) { alert("Donne un titre à la séance."); return; }
    if (mode === "jour" && !dateSeance) { alert("Choisis une date pour la séance."); return; }
    const clean = blocs
      .map((b) => ({ ...b, exercices: b.exercices.filter((e) => e.trim()) }))
      .filter((b) => b.titre.trim() || b.exercices.length);
    try {
      await save({
        abonne_id: abonneId,
        titre: titre.trim(),
        objectif: objectif.trim() || null,
        blocs: clean,
        frequence_jours: frequence,
        date_seance: mode === "jour" ? dateSeance : null,
        actif,
      });
      setSavedMsg("Séance enregistrée · disponible pour l'abonné ✓");
      setTimeout(() => setSavedMsg(null), 2500);
      await notify(abonneId, "seance", "Nouvelle séance de ton coach",
        `« ${titre.trim()} » t'attend dans ta Routine.`, "/fusionfit/routine");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <section className="rounded-2xl border p-4 space-y-3" style={{ background: "var(--ff-surface)", borderColor: "var(--ff-cyan)" }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-cyan)" }}>
          <Dumbbell className="h-3.5 w-3.5" /> Séance perso de {prenom}
        </p>
        <button onClick={enregistrer} disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs"
          style={{ borderColor: "var(--ff-green)", color: "var(--ff-green)", background: "oklch(0.65 0.18 145 / 12%)" }}>
          <Save className="h-3.5 w-3.5" /> {isPending ? "…" : "Enregistrer"}
        </button>
      </div>
      <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
        L'abonné pourra choisir cette séance à la place du programme de base, selon la fréquence définie.
      </p>
      {savedMsg && <p className="text-[10px]" style={{ color: "var(--ff-green)" }}>{savedMsg}</p>}

      <input
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Titre (ex: Force + Hyrox du jour)"
        className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
      />
      <input
        value={objectif}
        onChange={(e) => setObjectif(e.target.value)}
        placeholder="Objectif de la séance (optionnel)"
        className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm outline-none"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
      />

      {/* Choix : récurrent ou jour précis */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("recurrent")}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold"
          style={{
            borderColor: mode === "recurrent" ? "var(--ff-cyan)" : "var(--ff-border)",
            background: mode === "recurrent" ? "oklch(0.78 0.16 198 / 15%)" : "transparent",
            color: mode === "recurrent" ? "var(--ff-cyan)" : "var(--ff-text-muted)",
          }}
        >
          <Repeat className="h-3.5 w-3.5" /> Récurrente
        </button>
        <button
          type="button"
          onClick={() => setMode("jour")}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold"
          style={{
            borderColor: mode === "jour" ? "var(--ff-cyan)" : "var(--ff-border)",
            background: mode === "jour" ? "oklch(0.78 0.16 198 / 15%)" : "transparent",
            color: mode === "jour" ? "var(--ff-cyan)" : "var(--ff-text-muted)",
          }}
        >
          <Calendar className="h-3.5 w-3.5" /> Jour précis
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {mode === "recurrent" ? (
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--ff-text-muted)" }}>
            <Repeat className="h-3.5 w-3.5" /> Tous les
            <input
              type="number" min={1} max={30} value={frequence}
              onChange={(e) => setFrequence(Math.max(1, Math.min(30, +e.target.value || 1)))}
              className="w-14 px-2 py-1 rounded border bg-transparent text-sm outline-none text-center"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
            />
            jour(s)
          </label>
        ) : (
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--ff-text-muted)" }}>
            <Calendar className="h-3.5 w-3.5" /> Le
            <input
              type="date" value={dateSeance}
              onChange={(e) => setDateSeance(e.target.value)}
              className="px-2 py-1 rounded border bg-transparent text-sm outline-none"
              style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)", colorScheme: "dark" }}
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: actif ? "var(--ff-green)" : "var(--ff-text-muted)" }}>
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
          {actif ? "Active" : "Désactivée"}
        </label>
      </div>

      <div className="space-y-2">
        {blocs.map((b, i) => {
          const col = PILIER_COLORS[b.pilier];
          return (
            <div key={i} className="rounded-lg border p-2 space-y-1.5" style={{ borderColor: col.border, background: "var(--ff-surface-2)" }}>
              <div className="flex gap-2">
                <select
                  value={b.pilier}
                  onChange={(e) => updBloc(i, { pilier: e.target.value as CoachBloc["pilier"] })}
                  className="px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: col.text }}
                >
                  {PILIERS.map((p) => (
                    <option key={p} value={p} style={{ background: "var(--ff-bg)" }}>{p}</option>
                  ))}
                </select>
                <input
                  value={b.titre}
                  onChange={(e) => updBloc(i, { titre: e.target.value })}
                  placeholder="Titre du bloc (ex: AMRAP 20 min)"
                  className="flex-1 px-2 py-1 rounded border bg-transparent text-xs outline-none"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
                />
                <button onClick={() => delBlocPerso(i)} className="p-1" style={{ color: "var(--ff-text-muted)" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={b.exercices.join("\n")}
                onChange={(e) => updBloc(i, { exercices: e.target.value.split("\n") })}
                placeholder="Un exercice par ligne (ex: 5 Burpees)"
                rows={3}
                className="w-full px-2 py-1 rounded border bg-transparent text-xs outline-none resize-none"
                style={{ borderColor: "var(--ff-border)", color: "var(--ff-text)" }}
              />
            </div>
          );
        })}
      </div>
      <button
        onClick={addBlocPerso}
        className="w-full py-2 rounded-lg border border-dashed text-xs flex items-center justify-center gap-1"
        style={{ borderColor: "var(--ff-border)", color: "var(--ff-text-muted)" }}
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
      </button>
    </section>
  );
}
