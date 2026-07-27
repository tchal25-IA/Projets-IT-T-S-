import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Sparkles, Gift, Calendar, Tag, ArrowRight, Loader2, PartyPopper } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  type CategoryId,
  computeMonthly,
  computeAnnualMonthly,
  formatEUR,
  PRICING_CAP,
  ANNUAL_DISCOUNT,
  TRIAL_DAYS,
  REFERRAL_BONUS_MONTHS,
} from "@/lib/pricing";
import { useToast } from "@/components/toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { lovable } from "@/integrations/lovable";

const onboardingSearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/onboarding")({
  validateSearch: onboardingSearchSchema,
  head: () => ({
    meta: [
      { title: "Bienvenue — Quotidien IA" },
      { name: "description", content: "Choisissez vos modules. 1 mois d'essai gratuit, abonnement plafonné à 9,99 €/mois." },
      { property: "og:title", content: "Bienvenue sur Quotidien IA" },
      { property: "og:description", content: "Composez votre abonnement personnalisé." },
    ],
  }),
  component: OnboardingPage,
});

type Step = "modules" | "auth" | "success";

function OnboardingPage() {
  const { code: incomingCode } = useSearch({ from: "/onboarding" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading: sessLoading } = useSession();

  const [step, setStep] = useState<Step>("modules");
  const defaultSelected: CategoryId[] = ["finance", "productivite", "evenements", "voyage", "contenu", "vie_admin"];
  const [selected, setSelected] = useState<CategoryId[]>(defaultSelected);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [referral, setReferral] = useState((incomingCode ?? "").toUpperCase());
  const [displayName, setDisplayName] = useState("");

  // Auth state
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si l'utilisateur est déjà connecté et qu'il n'a pas encore d'abonnement,
  // on lui propose directement les modules → finalize directement à la soumission.
  useEffect(() => {
    if (sessLoading || !session) return;
    // Vérifie s'il a déjà un abonnement → succès direct
    (async () => {
      const { data } = await supabase.from("subscriptions").select("user_id").eq("user_id", session.user.id).maybeSingle();
      if (data) {
        // Déjà abonné, on file vers l'accueil
        navigate({ to: "/", replace: true });
      }
    })();
  }, [sessLoading, session, navigate]);

  function toggle(id: CategoryId) {
    const cat = CATEGORIES.find((c) => c.id === id)!;
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = cat.exclusiveWith ? prev.filter((x) => x !== cat.exclusiveWith) : prev.slice();
      next.push(id);
      return next;
    });
  }

  const monthly = useMemo(() => computeMonthly(selected), [selected]);
  const annual = useMemo(() => computeAnnualMonthly(selected), [selected]);
  const capReached = monthly >= PRICING_CAP;
  const monthsFree = referral.trim() ? REFERRAL_BONUS_MONTHS : 0;

  const groups = useMemo(() => {
    const m = new Map<string, typeof CATEGORIES>();
    CATEGORIES.forEach((c) => {
      const arr = m.get(c.group) ?? [];
      arr.push(c);
      m.set(c.group, arr);
    });
    return Array.from(m.values());
  }, []);

  /** Crée l'abonnement Cloud + met à jour le profil. */
  async function finalize(userId: string) {
    // Base : essai TRIAL_DAYS. Si code parrainage : +REFERRAL_BONUS_MONTHS mois offerts.
    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 86400 * 1000);
    if (referral.trim()) {
      trialEnd.setMonth(trialEnd.getMonth() + REFERRAL_BONUS_MONTHS);
    }
    const { error: subErr } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        selected,
        billing,
        referral_code_used: referral.trim() || null,
        trial_ends_at: trialEnd.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (subErr) throw subErr;
    if (displayName.trim()) {
      await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", userId);
    }
  }

  /** Étape 1 → étape 2 (ou directement finalize si déjà connecté). */
  async function handleModulesNext() {
    setError(null);
    if (selected.length === 0) {
      setError("Sélectionnez au moins un module.");
      return;
    }
    if (session) {
      setSubmitting(true);
      try {
        await finalize(session.user.id);
        setStep("success");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep("auth");
    }
  }

  /** Étape 2 : signup email/password (avec referral_code en metadata) ou login. */
  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (authMode === "signup") {
        const { data, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: displayName.trim() || email.split("@")[0],
              referral_code: referral.trim() || undefined,
            },
          },
        });
        if (authErr) throw authErr;
        if (!data.user) throw new Error("Inscription impossible.");
        // Le trigger DB a créé le profil. Crée l'abonnement.
        await finalize(data.user.id);
        toast("Bienvenue ! Vérifiez votre email pour confirmer votre compte.", "success");
        setStep("success");
      } else {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;
        if (!data.user) throw new Error("Connexion impossible.");
        await finalize(data.user.id);
        setStep("success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'authentification");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/onboarding" + (referral ? `?code=${encodeURIComponent(referral)}` : ""),
      });
      if (result.error) {
        setError("Connexion Google impossible.");
        setSubmitting(false);
      }
    } catch {
      setError("Connexion Google impossible.");
      setSubmitting(false);
    }
  }

  // ----- Rendu -----
  if (step === "success") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <PartyPopper className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Bienvenue sur Quotidien IA !</h1>
        <p className="text-muted-foreground">
          Votre essai gratuit de {TRIAL_DAYS} jours est activé. Voici votre formule :
        </p>
        <div className="mx-auto max-w-md rounded-2xl border-2 border-primary/40 bg-primary-soft/30 p-5 text-left shadow-card">
          <p className="text-4xl font-bold tabular-nums">
            {formatEUR(billing === "monthly" ? monthly : annual)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/mois</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{selected.length} module{selected.length > 1 ? "s" : ""} actif{selected.length > 1 ? "s" : ""}</p>
          {referral.trim() && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              <Gift className="h-3 w-3" /> {REFERRAL_BONUS_MONTHS} mois offerts via le code {referral}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Accéder à mon hub <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/parrainage" className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted">
            <Gift className="h-4 w-4" /> Parrainer maintenant
          </Link>
        </div>
      </div>
    );
  }

  if (step === "auth") {
    return (
      <div className="mx-auto max-w-md space-y-6 py-6">
        <PageHeader icon={Sparkles} eyebrow="Étape 2/2" title="Créez votre compte" description="Pour sauvegarder votre abonnement et accéder à votre hub." />

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleAuth} className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
          <div className="grid grid-cols-2 gap-1 rounded-md border bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={cn("rounded py-1.5", authMode === "signup" ? "bg-background font-semibold shadow" : "")}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={cn("rounded py-1.5", authMode === "signin" ? "bg-background font-semibold shadow" : "")}
            >
              Se connecter
            </button>
          </div>

          {authMode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Nom affiché</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex : Camille"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive-foreground">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {authMode === "signup" ? "Activer mon essai gratuit" : "Se connecter et activer"}
          </button>

          <button
            type="button"
            onClick={() => setStep("modules")}
            className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            ← Modifier mes modules
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Sparkles}
        eyebrow="Étape 1/2"
        title="Composez votre Quotidien IA"
        description={`Cochez les modules utiles. ${TRIAL_DAYS} jours d'essai gratuit, abonnement plafonné à ${formatEUR(PRICING_CAP)}/mois.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard icon={Calendar} title="1 mois d'essai" description="Tout testé sans engagement, résiliable à tout moment." />
        <InfoCard icon={Tag} title={`Plafond ${formatEUR(PRICING_CAP)}/mois`} description="Quoi que vous cochiez, le prix ne dépasse jamais ce plafond." />
        <InfoCard icon={Gift} title="Parrainage" description={`${REFERRAL_BONUS_MONTHS} mois offerts via code, +${2} mois par filleul vérifié.`} />
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">Vos modules</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((grp) => (
            <div key={grp[0].group} className="space-y-2">
              {grp.map((cat) => {
                const isSelected = selected.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggle(cat.id)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-card transition-all",
                      isSelected
                        ? "border-primary bg-primary-soft/40"
                        : "bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-elev",
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30")}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{cat.label}</h3>
                        {cat.badge && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums">
                      {cat.priceMonthly === 0 ? "Inclus" : `${formatEUR(cat.priceMonthly)} /mois`}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4 rounded-2xl border bg-card p-5 shadow-card">
          <div>
            <h2 className="font-display text-base font-bold">Facturation</h2>
            <p className="text-xs text-muted-foreground">Choisissez votre rythme. -10 % en annuel.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  billing === b ? "border-primary bg-primary-soft/40" : "hover:bg-muted",
                )}
              >
                <p className="text-sm font-semibold">{b === "monthly" ? "Mensuel" : "Annuel"}</p>
                <p className="text-xs text-muted-foreground">
                  {b === "monthly" ? "Sans engagement" : `Économisez ${Math.round(ANNUAL_DISCOUNT * 100)}% sur l'année`}
                </p>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Code de parrainage (optionnel)</label>
            <input
              value={referral}
              onChange={(e) => setReferral(e.target.value.toUpperCase())}
              placeholder="Ex : AMI2026"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm uppercase tracking-wider"
            />
            {referral.trim() && (
              <p className="mt-1 text-xs text-success">
                ✓ {REFERRAL_BONUS_MONTHS} mois all-inclusive offerts appliqués à votre première facture.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border-2 border-primary/40 bg-primary-soft/30 p-5 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Votre formule</p>
          <p className="text-4xl font-bold tabular-nums">
            {formatEUR(billing === "monthly" ? monthly : annual)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/mois</span>
          </p>
          {billing === "annual" && monthly > 0 && (
            <p className="text-xs text-muted-foreground">Soit {formatEUR(annual * 12)} facturés / an</p>
          )}
          {capReached && (
            <p className="text-xs font-medium text-primary">Plafond {formatEUR(PRICING_CAP)}/mois atteint.</p>
          )}
          <ul className="space-y-1 border-t pt-3 text-xs">
            <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success" /> {TRIAL_DAYS} jours d'essai gratuit</li>
            <li className="flex items-center gap-2"><Check className="h-3 w-3 text-success" /> Résiliation à tout moment</li>
            {monthsFree > 0 && (
              <li className="flex items-center gap-2"><Gift className="h-3 w-3 text-primary" /> {monthsFree} mois all-inclusive offerts</li>
            )}
          </ul>
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive-foreground">{error}</p>
          )}
          <button
            type="button"
            onClick={handleModulesNext}
            disabled={submitting || selected.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {session ? "Activer mon essai gratuit" : "Continuer →"}
          </button>
        </aside>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-card">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
