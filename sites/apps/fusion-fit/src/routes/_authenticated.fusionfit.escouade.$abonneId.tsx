import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FatigueAnalysisCard } from "@/components/fatigue-analysis-card";
import type { Bloc } from "@/data/program-templates";
import { AbonneHeader } from "@/components/escouade/abonne-header";
import { PerformanceRecap } from "@/components/escouade/performance-recap";
import { ProgrammeHistorique } from "@/components/escouade/programme-historique";
import { SessionRow } from "@/components/escouade/session-row";
import { SeancePersoEditor } from "@/components/escouade/seance-perso-editor";
import { ProgramEditor } from "@/components/escouade/program-editor";
import type { Profile, Program, Session, DbTemplate } from "@/components/escouade/types";
import { buildObjectifOptions } from "@/lib/objectifs";

export const Route = createFileRoute("/_authenticated/fusionfit/escouade/$abonneId")({
  component: AbonneDetailPage,
});

function AbonneDetailPage() {
  const { abonneId } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prog, setProg] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myTemplates, setMyTemplates] = useState<DbTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== "coach") return;
    (async () => {
      try {
        const { data: p, error: pErr } = await supabase.from("profiles").select("*").eq("user_id", abonneId).maybeSingle();
        if (pErr) setLoadError(pErr.message);
        setProfile(p as Profile);

      // Archive séances (détail + historique long) — RLS "Coach lit check-ins de ses abonnés"
      const { data: chk } = await supabase
        .from("check_ins")
        .select("id, date, serenite, energie, humeur, temps, objectif_du_jour, nb_blocs, blocs_completes, session_duration_sec, session_ended, ressenti_score, ressenti_note, coach_comment, session_source")
        .eq("user_id", abonneId)
        .order("created_at", { ascending: false })
        .limit(120);
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

      <AbonneHeader profile={profile} prenom={prenom} onChat={ouvrirChat} />

      <PerformanceRecap sessions={sessions} />

      <ProgrammeHistorique abonneId={abonneId} />

      <FatigueAnalysisCard targetUserId={abonneId} audience="coach" />

      {/* Ressenti & sessions récentes */}
      <section
        className="rounded-2xl border p-4 space-y-3"
        style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
      >
        <p className="text-xs font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ff-green)" }}>
          <Smile className="h-3.5 w-3.5" /> Archive des séances
        </p>
        <p className="text-[11px]" style={{ color: "var(--ff-text-muted)" }}>
          Ouvre une session pour voir le détail des blocs et exercices réalisés.
        </p>
        {sessions.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--ff-text-muted)" }}>
            Aucune session enregistrée pour le moment.
          </p>
        ) : (
          <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <SessionRow key={s.id} s={s} abonneId={abonneId} />
            ))}
          </div>
        )}
      </section>

      <SeancePersoEditor abonneId={abonneId} prenom={prenom} />

      {prog && user && (
        <ProgramEditor
          prog={prog}
          setProg={setProg}
          abonneId={abonneId}
          coachId={user.id}
          myTemplates={myTemplates}
          setMyTemplates={setMyTemplates}
          athleteObjectifs={buildObjectifOptions(profile)}
        />
      )}
    </div>
  );
}
