import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, MessageCircle, User, Zap, Sun, Moon, LogOut, Shield, BarChart3, Users, Repeat, CalendarCheck, ClipboardList } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-messages";
import { useUnreadNotifCount, useCreneauPushNotifications, useRegisterWebPush } from "@/hooks/use-notifications";
import { useTodayCheckin, useMyObjectifsProfile, hasQuestionnaireSass } from "@/hooks/use-checkins";
import { useCreneauRemindersPoll } from "@/hooks/use-coach-exercises";
import { useAgendaRemindersPoll } from "@/hooks/use-events";
import { PhoenixLogo } from "@/components/phoenix-logo";
import { FF } from "@/lib/ff-colors";

export const Route = createFileRoute("/_authenticated/fusionfit")({
  component: FusionFitShell,
});

const NAV_ATHLETE = [
  { to: "/fusionfit/routine",     label: "Routine",     icon: Zap          },
  { to: "/fusionfit/stats",       label: "Suivi",       icon: BarChart3    },
  { to: "/fusionfit/agenda",      label: "Agenda",      icon: CalendarCheck},
  { to: "/fusionfit/messagerie",  label: "Messagerie",  icon: MessageCircle},
  { to: "/fusionfit/profil",      label: "Profil",      icon: User         },
] as const;

const NAV_COACH = [
  { to: "/fusionfit/escouade",    label: "Escouade",    icon: Users        },
  { to: "/fusionfit/agenda",      label: "Agenda",      icon: CalendarCheck},
  { to: "/fusionfit/messagerie",  label: "Messagerie",  icon: MessageCircle},
  { to: "/fusionfit/bibliotheque",label: "Biblio",      icon: BookOpen     },
  { to: "/fusionfit/profil",      label: "Profil",      icon: User         },
] as const;

function FusionFitShell() {
  const loc               = useLocation();
  const { resolved, toggle } = useTheme();
  const { signOut, role, realRole, viewAsAthlete, setViewAsAthlete } = useAuth();
  const { data: unread = 0 } = useUnreadCount();
  const { data: unreadNotifs = 0 } = useUnreadNotifCount();
  useCreneauPushNotifications();
  useRegisterWebPush();
  useCreneauRemindersPoll();
  useAgendaRemindersPoll();
  const navigate          = useNavigate();
  const today = new Date()
    .toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();

  const onOnboarding = loc.pathname.startsWith("/fusionfit/onboarding");
  const { data: objectifsProfile } = useMyObjectifsProfile();

  // 1ère connexion athlète : forcer le questionnaire avant le reste de l'app.
  useEffect(() => {
    if (role !== "abonne") return;
    if (!objectifsProfile) return;
    if (objectifsProfile.onboarding_done) return;
    if (onOnboarding) return;
    navigate({ to: "/fusionfit/onboarding", replace: true });
  }, [role, objectifsProfile, onOnboarding, navigate]);

  async function handleLogout() {
    try { await signOut(); } catch { /* silenced */ }
    navigate({ to: "/login", replace: true });
  }

  function toggleSwitch() {
    const next = !viewAsAthlete;
    setViewAsAthlete(next);
    // On repart de la page d'accueil du mode ciblé pour éviter les pages réservées.
    navigate({ to: next ? "/fusionfit/routine" : "/fusionfit/escouade", replace: true });
  }

  const NAV = role === "coach" ? NAV_COACH : NAV_ATHLETE;
  const hideChrome = onOnboarding || (role === "abonne" && !!objectifsProfile && !objectifsProfile.onboarding_done);

  const headerBg = resolved === "dark"
    ? "oklch(0.07 0.025 265 / 80%)"
    : "oklch(1 0 0 / 80%)";
  const navBg = resolved === "dark"
    ? "oklch(0.07 0.025 265 / 90%)"
    : "oklch(1 0 0 / 92%)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: FF.bg, color: FF.text }}>
      {/* Header */}
      {!hideChrome && (
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b ff-scanline"
        style={{ borderColor: FF.border, background: headerBg }}>
        <div className="mx-auto max-w-md px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoenixLogo size={34} />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-widest" style={{ color: FF.amber }}>
                FUSION FIT
              </p>
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] flex items-center gap-1"
                style={{ color: FF.textMuted }}>
                {role === "coach" && <Shield className="h-2.5 w-2.5" style={{ color: FF.amber }} />}
                {viewAsAthlete ? "Mode Sujet Zéro" : role === "coach" ? "Coach Initiative" : "Agent · " + today}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {realRole === "coach" && (
              <button onClick={toggleSwitch} aria-label="Basculer coach / athlète"
                className="h-9 w-9 rounded-lg border grid place-items-center transition-all hover:opacity-80"
                style={{
                  borderColor: viewAsAthlete ? FF.cyan : FF.border,
                  color: viewAsAthlete ? FF.cyan : FF.textMuted,
                  background: viewAsAthlete ? FF.cyanBg : FF.surface,
                }}>
                <Repeat className="h-4 w-4" />
              </button>
            )}
            {/* La cloche a été retirée : les notifications sont regroupées dans la Messagerie. */}
            <button onClick={toggle} aria-label="Basculer le thème"
              className="h-9 w-9 rounded-lg border grid place-items-center transition-all hover:opacity-80"
              style={{ borderColor: FF.border, color: FF.textMuted, background: FF.surface }}>
              {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={handleLogout} aria-label="Déconnexion"
              className="h-9 w-9 rounded-lg border grid place-items-center transition-all hover:opacity-80"
              style={{ borderColor: FF.border, color: FF.textMuted, background: FF.surface }}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      )}

      {/* Rappel check-in (athlète, hors page Routine) */}
      {!hideChrome && role !== "coach" && !loc.pathname.startsWith("/fusionfit/routine") && <CheckinReminder />}
      {!hideChrome && role !== "coach" && !onOnboarding && (
        <QuestionnaireReminder profile={objectifsProfile} />
      )}

      {/* Contenu */}
      <main className={`flex-1 mx-auto w-full max-w-md px-5 py-6 ${hideChrome ? "" : "pb-28"}`}>
        <Outlet />
      </main>

      {/* Navigation (5 items) */}
      {!hideChrome && (
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t backdrop-blur-xl"
        style={{ borderColor: FF.border, background: navBg }}>
        <div className="mx-auto max-w-md px-3 h-20 grid grid-cols-5">
          {NAV.map((item) => {
            const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
            const Icon   = item.icon;
            const isCoachTab = item.to === "/fusionfit/escouade";
            // Le badge Messagerie compte messages ET notifications, désormais regroupés.
            const messagerieCount = item.to === "/fusionfit/messagerie" ? unread + unreadNotifs : 0;
            const showBadge = messagerieCount > 0;
            return (
              <Link key={item.to} to={item.to}
                className="flex flex-col items-center justify-center gap-1 transition relative"
                style={{ color: active ? (isCoachTab ? FF.amber : FF.cyan) : FF.textMuted }}>
                {active && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full ${isCoachTab ? "ff-glow-amber" : "ff-glow-cyan"}`}
                    style={{ background: isCoachTab ? FF.amber : FF.cyan }} />
                )}
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold grid place-items-center"
                      style={{ background: FF.amber, color: "#0a0e1a" }}
                    >
                      {messagerieCount > 9 ? "9+" : messagerieCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}

// Bannière de rappel : l'athlète n'a pas encore fait son check-in du jour.
// Bannière : inscrits existants sans questionnaire Sass → proposer de compléter le profil.
function QuestionnaireReminder({ profile }: {
  profile: { onboarding_done?: boolean | null; questionnaire_sass?: unknown } | null | undefined;
}) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  if (!profile || dismissed) return null;
  if (hasQuestionnaireSass(profile)) return null;

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-4">
      <div className="rounded-xl border p-3 flex items-center gap-3"
        style={{ borderColor: FF.cyan, background: "oklch(0.78 0.16 198 / 10%)" }}>
        <ClipboardList className="h-5 w-5 flex-shrink-0" style={{ color: FF.cyan }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: FF.text }}>Questionnaire Sass</p>
          <p className="text-[11px]" style={{ color: FF.textMuted }}>
            Complète-le pour actualiser tes objectifs et ton profil athlète.
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/fusionfit/onboarding", search: { update: true } })}
          className="px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
          style={{ borderColor: FF.cyan, color: FF.cyan }}>
          Répondre
        </button>
        <button onClick={() => setDismissed(true)} aria-label="Ignorer"
          className="flex-shrink-0 text-lg leading-none px-1" style={{ color: FF.textMuted }}>
          ×
        </button>
      </div>
    </div>
  );
}

function CheckinReminder() {
  const { data: todayCheckin, isLoading } = useTodayCheckin();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (isLoading || todayCheckin || dismissed) return null;

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-4">
      <div className="rounded-xl border p-3 flex items-center gap-3"
        style={{ borderColor: FF.amber, background: "oklch(0.78 0.18 55 / 10%)" }}>
        <CalendarCheck className="h-5 w-5 flex-shrink-0" style={{ color: FF.amber }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: FF.text }}>Check-in du jour à faire</p>
          <p className="text-[11px]" style={{ color: FF.textMuted }}>30 secondes pour adapter ta séance.</p>
        </div>
        <button
          onClick={() => navigate({ to: "/fusionfit/routine" })}
          className="px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
          style={{ borderColor: FF.amber, color: FF.amber }}>
          Go
        </button>
        <button onClick={() => setDismissed(true)} aria-label="Ignorer"
          className="flex-shrink-0 text-lg leading-none px-1" style={{ color: FF.textMuted }}>
          ×
        </button>
      </div>
    </div>
  );
}
