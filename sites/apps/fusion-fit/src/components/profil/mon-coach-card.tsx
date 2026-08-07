import { useState, useEffect } from "react";
import { Shield, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoachId } from "@/hooks/use-messages";
import { useCoachReviews, useMyReview, useSaveReview } from "@/hooks/use-coaching";
import { notify, getMyPrenom } from "@/hooks/use-notifications";
import { Card, StarRating } from "./profil-ui";

/** Carte « Mon coach » côté abonné (voir + noter) */
export function MonCoachCard() {
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
