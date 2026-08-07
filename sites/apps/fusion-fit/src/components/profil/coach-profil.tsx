import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Shield, Star, Loader2, FileText, Users, MessageSquare, ChevronRight, Flame, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-messages";
import { useCoachOverview, useCoachReviews } from "@/hooks/use-coaching";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Card, StarRating } from "./profil-ui";

export function CoachProfil() {
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

      <CoachAbonnesList />

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

/** Liste des abonnés du coach (cliquable → fiche détaillée) */
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
