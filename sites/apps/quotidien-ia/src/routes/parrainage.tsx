import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Gift, Copy, Share2, Trophy, Info, ShieldCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { REFERRAL_BONUS_MONTHS, REFERRER_BONUS_PER_REFERRAL } from "@/lib/pricing";
import { useToast } from "@/components/toast";

export const Route = createFileRoute("/parrainage")({
  head: () => ({
    meta: [
      { title: "Parrainage — Quotidien IA" },
      { name: "description", content: "Partagez votre code, gagnez des mois offerts et grimpez au classement temps réel." },
      { property: "og:title", content: "Parrainage — Quotidien IA" },
      { property: "og:description", content: "2 mois offerts par filleul vérifié. Classement temps réel." },
    ],
  }),
  component: ParrainagePage,
});

type Profile = { id: string; display_name: string | null; referral_code: string };
type Referral = {
  id: string;
  referee_id: string;
  status: "pending" | "verified" | "rejected";
  verified_at: string | null;
  created_at: string;
};
type LeaderboardEntry = { user_id: string; display_name: string; verified_count: number };

function ParrainagePage() {
  const { session, loading: sessLoading } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refereeNames, setRefereeNames] = useState<Record<string, string>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Chargement initial
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ data: prof }, { data: refs }, { data: board }] = await Promise.all([
          supabase.from("profiles").select("id, display_name, referral_code").eq("id", session.user.id).maybeSingle(),
          supabase.from("referrals").select("*").eq("referrer_id", session.user.id).order("created_at", { ascending: false }),
          supabase.rpc("get_leaderboard", { _limit: 15 }),
        ]);
        if (cancelled) return;
        if (prof) setProfile(prof as Profile);
        if (refs) setReferrals(refs as Referral[]);
        if (board) setLeaderboard(board as unknown as LeaderboardEntry[]);

        // Charge le nom des filleuls
        if (refs && refs.length) {
          const ids = (refs as Referral[]).map((r) => r.referee_id);
          const { data: names } = await supabase.rpc("get_referee_names", { _ids: ids });
          if (names && !cancelled) {
            const map: Record<string, string> = {};
            (names as { id: string; display_name: string | null }[]).forEach((n) => {
              map[n.id] = n.display_name ?? "Filleul";
            });
            setRefereeNames(map);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Chargement du parrainage impossible :", err);
      }
    })();

    // Realtime : refresh sur changement de referrals (mes parrainages + classement)
    const ch = supabase
      .channel("parrainage-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "referrals" }, async () => {
        const { data: board } = await supabase.rpc("get_leaderboard", { _limit: 15 });
        if (!cancelled && board) setLeaderboard(board as unknown as LeaderboardEntry[]);

        const { data: refs } = await supabase
          .from("referrals")
          .select("*")
          .eq("referrer_id", session.user.id)
          .order("created_at", { ascending: false });
        if (!cancelled && refs) setReferrals(refs as Referral[]);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [session]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !profile) return "";
    return `${window.location.origin}/onboarding?code=${encodeURIComponent(profile.referral_code)}`;
  }, [profile]);

  const verifiedCount = referrals.filter((r) => r.status === "verified").length;
  const pendingCount = referrals.filter((r) => r.status === "pending").length;
  const monthsEarned = verifiedCount * REFERRER_BONUS_PER_REFERRAL;

  function copy(text: string, label: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(
      () => toast(`${label} copié·e.`, "success"),
      () => toast("Copie impossible.", "error"),
    );
  }

  function shareNative() {
    if (!shareUrl || !profile) return;
    const data = {
      title: "Quotidien IA",
      text: `Rejoins-moi sur Quotidien IA avec mon code ${profile.referral_code} — ${REFERRAL_BONUS_MONTHS} mois offerts !`,
      url: shareUrl,
    };
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      (navigator as any).share(data).catch(() => copy(shareUrl, "Lien"));
    } else {
      copy(shareUrl, "Lien");
    }
  }

  if (sessLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <PageHeader icon={Gift} eyebrow="Récompenses" title="Parrainage" description="Connectez-vous pour récupérer votre code de parrainage." />
        <Link to="/login" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Se connecter
        </Link>
      </div>
    );
  }

  const myRank = (() => {
    const idx = leaderboard.findIndex((e) => e.user_id === session.user.id);
    return idx >= 0 ? idx + 1 : null;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Gift}
        eyebrow="Récompenses"
        title="Parrainage"
        description={`Partagez votre code et gagnez ${REFERRER_BONUS_PER_REFERRAL} mois offerts par filleul vérifié. Vos amis reçoivent ${REFERRAL_BONUS_MONTHS} mois.`}
      />

      {/* Comment ça marche */}
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-bold">Comment ça marche</h2>
        </div>
        <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-lg border bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">1. Partagez</p>
            <p className="mt-1">Envoyez votre code ou lien à vos proches.</p>
          </li>
          <li className="rounded-lg border bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">2. Ils s'inscrivent</p>
            <p className="mt-1">
              Ils créent leur compte avec votre code → reçoivent {REFERRAL_BONUS_MONTHS} mois offerts.
            </p>
          </li>
          <li className="rounded-lg border bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">3. Vérification</p>
            <p className="mt-1">
              Dès qu'ils confirment leur email <strong>et</strong> finalisent leur abonnement, vous recevez{" "}
              <strong>+{REFERRER_BONUS_PER_REFERRAL} mois</strong> et grimpez au classement.
            </p>
          </li>
        </ol>
      </section>

      {/* Code + gains */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4 rounded-2xl border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-lg font-bold">Votre code</h2>
            <p className="text-xs text-muted-foreground">Généré une fois pour toutes à votre inscription.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-md border bg-muted px-4 py-2 text-lg font-bold tracking-widest">
              {profile?.referral_code ?? "…"}
            </code>
            <button
              type="button"
              onClick={() => profile && copy(profile.referral_code, "Code")}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" /> Copier le code
            </button>
            <button
              type="button"
              onClick={shareNative}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Share2 className="h-3.5 w-3.5" /> Partager le lien
            </button>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Lien d'invitation</p>
            <p className="mt-1 break-all text-sm">{shareUrl || "—"}</p>
          </div>
        </div>

        <aside className="space-y-2 rounded-2xl border-2 border-primary/40 bg-primary-soft/30 p-5 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Vos gains</p>
          <p className="text-4xl font-bold tabular-nums">
            {monthsEarned}
            <span className="ml-1 text-sm font-medium text-muted-foreground">mois offerts</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {verifiedCount} vérifié{verifiedCount > 1 ? "s" : ""} · {pendingCount} en attente
          </p>
          <p className="border-t pt-2 text-xs">
            Classement : <span className="font-semibold">{myRank ? `#${myRank}` : "non classé"}</span>
          </p>
        </aside>
      </section>

      {/* Filleuls */}
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-bold">Vos filleuls</h2>
        <p className="text-xs text-muted-foreground">
          Liste mise à jour en temps réel. Seuls les filleuls vérifiés comptent dans les gains.
        </p>
        <ul className="mt-4 divide-y rounded-lg border">
          {referrals.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              Personne pour le moment — partagez votre code pour commencer.
            </li>
          )}
          {referrals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{refereeNames[r.referee_id] ?? "Filleul"}</p>
                <p className="text-xs text-muted-foreground">
                  Inscrit le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {r.status === "verified" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                  <ShieldCheck className="h-3 w-3" /> Vérifié · +{REFERRER_BONUS_PER_REFERRAL} mois
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" /> En attente
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Classement */}
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Classement temps réel</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Top des parrains, mis à jour automatiquement quand un nouveau filleul est vérifié.
        </p>
        <ol className="mt-3 divide-y rounded-lg border">
          {leaderboard.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">Classement vide pour l'instant.</li>
          )}
          {leaderboard.map((e, i) => {
            const isMe = e.user_id === session.user.id;
            return (
              <li
                key={e.user_id}
                className={"flex items-center justify-between px-4 py-2 text-sm " + (isMe ? "bg-primary-soft/30 font-semibold" : "")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs " +
                      (i === 0
                        ? "bg-yellow-400 text-yellow-950"
                        : i === 1
                          ? "bg-zinc-300 text-zinc-900"
                          : i === 2
                            ? "bg-amber-700 text-amber-50"
                            : "bg-muted text-muted-foreground")
                    }
                  >
                    {i + 1}
                  </span>
                  <span>{e.display_name}{isMe ? " (vous)" : ""}</span>
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {e.verified_count} vérifié{e.verified_count > 1 ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
