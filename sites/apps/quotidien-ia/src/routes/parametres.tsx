import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon, Trash2, Check, Gift, CalendarClock, X, CreditCard, Loader2, Download, ShieldAlert, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Disclaimer } from "@/components/disclaimer";
import { clearLS } from "@/lib/storage";
import {
  CATEGORIES,
  type CategoryId,
  computeMonthly,
  computeAnnualMonthly,
  formatEUR,
  ANNUAL_DISCOUNT,
  PRICING_CAP,
} from "@/lib/pricing";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useCloudSubscription, nextFirstOfMonth } from "@/hooks/use-cloud-subscription";
import { ConnectedAppButton } from "@/components/connected-app-button";
import { CONNECTED_APPS } from "@/lib/connected-apps";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Quotidien IA" },
      { name: "description", content: "Profil, abonnement, parrainage et gestion des données." },
      { property: "og:title", content: "Paramètres — Quotidien IA" },
      { property: "og:description", content: "Modifiez votre abonnement, gérez votre profil." },
    ],
  }),
  component: SettingsPage,
});

type ProfileRow = {
  display_name: string | null;
  email: string | null;
  work_country: "FR" | "CH" | "OTHER" | null;
};

function SettingsPage() {
  const { toast } = useToast();
  const { session } = useSession();
  const navigate = useNavigate();
  const { sub, loading, refresh } = useCloudSubscription();
  const [profile, setProfile] = useState<ProfileRow>({ display_name: "", email: "", work_country: null });
  const [savingProf, setSavingProf] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Édition d'abonnement
  const [editing, setEditing] = useState(false);
  const [draftSelected, setDraftSelected] = useState<CategoryId[]>([]);
  const [draftBilling, setDraftBilling] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email, work_country")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data) setProfile(data as ProfileRow);
    })();
  }, [session]);

  async function saveProfile(patch: Partial<ProfileRow>) {
    if (!session) return;
    setSavingProf(true);
    const next = { ...profile, ...patch };
    setProfile(next);
    const { error } = await supabase.from("profiles").update(patch).eq("id", session.user.id);
    setSavingProf(false);
    if (error) toast("Sauvegarde du profil impossible.", "error");
  }

  function startEdit() {
    if (!sub) return;
    const baseSel = sub.pending_selected ?? sub.selected;
    const baseBill = sub.pending_billing ?? sub.billing;
    setDraftSelected([...baseSel]);
    setDraftBilling(baseBill);
    setEditing(true);
  }

  function toggleDraft(id: CategoryId) {
    const cat = CATEGORIES.find((c) => c.id === id)!;
    setDraftSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = cat.exclusiveWith ? prev.filter((x) => x !== cat.exclusiveWith) : prev.slice();
      next.push(id);
      return next;
    });
  }

  async function scheduleChange() {
    if (!sub || !session) return;
    const effectiveAt = nextFirstOfMonth();
    const { error } = await supabase
      .from("subscriptions")
      .update({
        pending_selected: draftSelected,
        pending_billing: draftBilling,
        pending_effective_at: effectiveAt,
      })
      .eq("user_id", session.user.id);
    if (error) return toast("Modification impossible.", "error");
    await refresh();
    setEditing(false);
    toast(`Modification programmée pour le ${new Date(effectiveAt).toLocaleDateString("fr-FR")}.`, "success");
  }

  async function cancelPending() {
    if (!sub || !session) return;
    await supabase
      .from("subscriptions")
      .update({ pending_selected: null, pending_billing: null, pending_effective_at: null })
      .eq("user_id", session.user.id);
    await refresh();
    toast("Modification programmée annulée.", "info");
  }

  function reset() {
    if (confirm("Effacer toutes les données locales (tâches, événements, etc.) du navigateur ?")) {
      clearLS();
      toast("Données locales effacées.", "success");
    }
  }

  // Droit d'accès / portabilité (RGPD art. 15 & 20) — export JSON de toutes les données.
  async function exportData() {
    if (!session) return;
    setExporting(true);
    try {
      const uid = session.user.id;
      const [profileRes, events, finance, documents, subscription, referrals] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("events").select("*").eq("user_id", uid),
        supabase.from("finance_entries").select("*").eq("user_id", uid),
        supabase.from("documents").select("*").eq("user_id", uid),
        supabase.from("subscriptions").select("*").eq("user_id", uid),
        supabase.from("referrals").select("*").eq("referrer_id", uid),
      ]);

      const local: Record<string, unknown> = {};
      if (typeof window !== "undefined") {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith("qia:")) {
            try { local[k] = JSON.parse(window.localStorage.getItem(k) ?? "null"); }
            catch { local[k] = window.localStorage.getItem(k); }
          }
        }
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        account: { id: uid, email: session.user.email },
        cloud: {
          profile: profileRes.data,
          events: events.data ?? [],
          finance_entries: finance.data ?? [],
          documents: documents.data ?? [],
          subscriptions: subscription.data ?? [],
          referrals: referrals.data ?? [],
        },
        local,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotidien-ia-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Vos données ont été exportées.", "success");
    } catch (e) {
      console.error("Export error:", e);
      toast("Export impossible. Réessayez.", "error");
    } finally {
      setExporting(false);
    }
  }

  // Droit à l'effacement (RGPD art. 17) — supprime le compte et toutes les données.
  async function deleteAccount() {
    if (!session) return;
    const confirmed = window.confirm(
      "Supprimer définitivement votre compte et toutes vos données (profil, événements, finances, documents, abonnement) ? Cette action est irréversible.",
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée.");
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Suppression impossible.");
      }
      clearLS();
      await supabase.auth.signOut();
      toast("Compte supprimé. Au revoir.", "success");
      navigate({ to: "/login" });
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  }

  const draftMonthly = useMemo(() => computeMonthly(draftSelected), [draftSelected]);
  const draftAnnual = useMemo(() => computeAnnualMonthly(draftSelected), [draftSelected]);

  if (!session) {
    return (
      <div className="space-y-4">
        <PageHeader icon={SettingsIcon} eyebrow="Compte" title="Paramètres" description="Connectez-vous pour gérer votre abonnement." />
        <Link to="/login" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={SettingsIcon} eyebrow="Compte" title="Paramètres" description="Profil, abonnement et données." />

      {/* Abonnement */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Mon abonnement</h2>
            <p className="text-xs text-muted-foreground">
              Les modifications prennent effet le 1<sup>er</sup> du mois suivant.
            </p>
          </div>
          {sub && !editing && (
            <button type="button" onClick={startEdit} className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              Modifier
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…</div>
        ) : !sub ? (
          <div className="rounded-lg border-dashed border bg-muted/30 p-4 text-sm">
            <p>Vous n'avez pas encore d'abonnement actif.</p>
            <Link to="/onboarding" className="mt-2 inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              Choisir mes modules
            </Link>
          </div>
        ) : !editing ? (
          <>
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-2xl font-bold tabular-nums">
                  {formatEUR(sub.billing === "monthly" ? computeMonthly(sub.selected) : computeAnnualMonthly(sub.selected))}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">/mois</span>
                </p>
                <span className="text-xs text-muted-foreground">{sub.billing === "monthly" ? "Mensuel" : "Annuel"}</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {sub.selected.map((id) => {
                  const c = CATEGORIES.find((x) => x.id === id);
                  if (!c) return null;
                  return (
                    <li key={id} className="rounded-full bg-primary-soft/60 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {c.label}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/checkout"
                  search={{ modules: sub.selected.join(","), billing: sub.billing } as any}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Passer au paiement
                </Link>
                {sub.stripe_customer_id && (
                  <button
                    type="button"
                    onClick={async () => {
                      const { createPortalSession } = await import("@/utils/payments.functions");
                      const { getStripeEnvironment } = await import("@/lib/stripe");
                      const res = await createPortalSession({
                        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
                      });
                      if ("error" in res) alert(res.error);
                      else window.open(res.url, "_blank");
                    }}
                    className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    Gérer facturation & moyens de paiement
                  </button>
                )}
              </div>
            </div>
            {sub.pending_effective_at && sub.pending_selected && sub.pending_billing && (
              <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary-soft/30 p-3 text-sm">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">
                    Modification programmée — effet au {new Date(sub.pending_effective_at).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Nouveau prix :{" "}
                    {formatEUR(
                      sub.pending_billing === "monthly"
                        ? computeMonthly(sub.pending_selected)
                        : computeAnnualMonthly(sub.pending_selected),
                    )}{" "}
                    /mois ({sub.pending_billing === "monthly" ? "mensuel" : "annuel"}) ·{" "}
                    {sub.pending_selected.length} module{sub.pending_selected.length > 1 ? "s" : ""}
                  </p>
                </div>
                <button type="button" onClick={cancelPending} className="rounded-md border px-2 py-1 text-xs hover:bg-background">
                  Annuler
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const checked = draftSelected.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleDraft(cat.id)}
                    className={cn("flex items-start gap-2 rounded-lg border p-3 text-left transition-colors", checked ? "border-primary bg-primary-soft/30" : "hover:bg-muted")}
                  >
                    <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30")}>
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                      {cat.priceMonthly === 0 ? "Inclus" : `${formatEUR(cat.priceMonthly)}/mois`}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["monthly", "annual"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setDraftBilling(b)}
                  className={cn("rounded-lg border p-2 text-sm", draftBilling === b ? "border-primary bg-primary-soft/30 font-semibold" : "hover:bg-muted")}
                >
                  {b === "monthly" ? "Mensuel" : `Annuel · -${Math.round(ANNUAL_DISCOUNT * 100)}%`}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-background p-3">
              <div>
                <p className="text-xs text-muted-foreground">Nouveau prix</p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatEUR(draftBilling === "monthly" ? draftMonthly : draftAnnual)}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">/mois</span>
                </p>
                {draftMonthly >= PRICING_CAP && (
                  <p className="text-[11px] text-primary">Plafond {formatEUR(PRICING_CAP)} atteint.</p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Effet le <span className="font-semibold text-foreground">{new Date(nextFirstOfMonth()).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={scheduleChange}
                disabled={draftSelected.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Programmer la modification
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" /> Annuler
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Paiement (Stripe — différé) */}
      <section className="flex items-start gap-3 rounded-2xl border border-dashed bg-muted/30 p-5">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Paiement — bientôt</p>
          <p className="mt-1 text-xs text-muted-foreground">
            L'intégration Stripe est prête à être branchée. Elle sera activée à votre demande dans les prochains mois ; en attendant, votre essai et vos modules restent accessibles gratuitement.
          </p>
        </div>
      </section>

      {/* Parrainage */}
      <section className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">Parrainage</h2>
            <p className="text-xs text-muted-foreground">Code, gains et classement temps réel.</p>
          </div>
        </div>
        <Link to="/parrainage" className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          Ouvrir
        </Link>
      </section>

      {/* Profil */}
      <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-bold">Profil</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-display-name" className="text-xs font-medium text-muted-foreground">Nom affiché</label>
            <input
              id="profile-display-name"
              value={profile.display_name ?? ""}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              onBlur={() => saveProfile({ display_name: profile.display_name })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              id="profile-email"
              type="email"
              value={profile.email ?? session.user.email ?? ""}
              disabled
              className="mt-1 w-full rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-work-country" className="text-xs font-medium text-muted-foreground">Pays de travail</label>
            <select
              id="profile-work-country"
              value={profile.work_country ?? ""}
              onChange={(e) => saveProfile({ work_country: (e.target.value || null) as ProfileRow["work_country"] })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Non renseigné</option>
              <option value="FR">France</option>
              <option value="CH">Suisse</option>
              <option value="OTHER">Autre</option>
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Détermine l'affichage des outils fiscaux (par ex. Impôt CH n'apparaît que si « Suisse »).
            </p>
          </div>
        </div>
        {savingProf && <p className="text-[11px] text-muted-foreground">Sauvegarde…</p>}
      </section>

      {/* Données locales */}
      <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-bold">Données locales</h2>
        <p className="text-sm text-muted-foreground">
          Tâches, événements et documents sont encore stockés dans votre navigateur (migration Cloud en cours). Vous pouvez les effacer ici.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
        >
          <Trash2 className="h-4 w-4" /> Réinitialiser les données locales
        </button>
      </section>

      {/* Mes données & confidentialité (RGPD) */}
      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ShieldAlert className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Mes données & confidentialité</h2>
            <p className="text-xs text-muted-foreground">
              Exercez vos droits d'accès, de portabilité et d'effacement (RGPD). Consultez notre{" "}
              <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={exportData}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exporter mes données (JSON)
          </button>
          <button
            type="button"
            onClick={deleteAccount}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Supprimer mon compte
          </button>
        </div>
      </section>

      {/* Applications connectées (SSO) */}
      {sub && sub.selected.length > 0 && (() => {
        const entitled = CONNECTED_APPS.filter((a) => sub.selected.includes(a.requires as CategoryId));
        if (entitled.length === 0) return null;
        return (
          <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <ExternalLink className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">Applications connectées</h2>
                <p className="text-xs text-muted-foreground">
                  Incluses dans votre abonnement — connexion automatique sans nouvelle inscription.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {entitled.map((app) => (
                <ConnectedAppButton key={app.key} app={app.key} label={app.label} />
              ))}
            </div>
          </section>
        );
      })()}

      <Disclaimer variant="data" />
    </div>
  );
}
