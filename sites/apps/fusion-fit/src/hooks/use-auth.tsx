// Auth provider with role detection (coach vs abonne)
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "coach" | "abonne";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  /** Rôle effectif : "abonne" si le coach est en mode Sujet Zéro. */
  role: AppRole | null;
  /** Vrai rôle du compte, indépendant du switch. */
  realRole: AppRole | null;
  /** Mode "Sujet Zéro" : le coach voit l'app comme un athlète. */
  viewAsAthlete: boolean;
  setViewAsAthlete: (v: boolean) => void;
  loading: boolean;
  cloudConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    prenom: string,
    invitationToken?: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const VIEW_MODE_KEY = "ff-view-as-athlete";
const AUTH_TIMEOUT_MS = 4000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cloudConfigured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(cloudConfigured);
  const [viewAsAthlete, setViewAsAthleteState] = useState<boolean>(() => {
    try { return localStorage.getItem(VIEW_MODE_KEY) === "1"; } catch { return false; }
  });

  function setViewAsAthlete(v: boolean) {
    setViewAsAthleteState(v);
    try {
      if (v) localStorage.setItem(VIEW_MODE_KEY, "1");
      else localStorage.removeItem(VIEW_MODE_KEY);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!cloudConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let initialized = false;

    const finish = () => {
      if (!cancelled) setLoading(false);
    };

    const timeout = window.setTimeout(finish, AUTH_TIMEOUT_MS);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (cancelled) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRole(null);
        finish();
      } else {
        const isFirst = !initialized;
        setTimeout(() => {
          void fetchRole(sess.user.id, true).finally(() => {
            if (isFirst) finish();
          });
        }, 0);
      }
      initialized = true;
    });

    Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), AUTH_TIMEOUT_MS)),
    ])
      .then((result) => {
        if (cancelled || initialized || result == null) {
          if (!initialized) finish();
          return;
        }
        const s = result.data.session;
        setSession(s);
        setUser(s?.user ?? null);
        if (!s?.user) finish();
        else {
          void fetchRole(s.user.id, true).finally(finish);
        }
      })
      .catch(() => finish());

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [cloudConfigured]);

  async function fetchRole(userId: string, _setLoadingAfter = false) {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.error("[useAuth] fetchRole error:", error.message);
      }
      setRole(!error && data?.role ? (data.role as AppRole) : "abonne");
    } catch (e) {
      console.error("[useAuth] fetchRole failed:", e);
      setRole("abonne");
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!cloudConfigured) return { error: "Cloud non configuré — connexion indisponible." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    prenom: string,
    invitationToken?: string,
  ) => {
    if (!cloudConfigured) return { error: "Cloud non configuré — inscription indisponible." };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/fusionfit/routine`,
        data: { prenom, invitation_token: invitationToken ?? null },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (cloudConfigured) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  };

  const effectiveRole: AppRole | null =
    role === "coach" && viewAsAthlete ? "abonne" : role;

  return (
    <AuthContext.Provider value={{
      user, session,
      role: effectiveRole,
      realRole: role,
      viewAsAthlete, setViewAsAthlete,
      loading, cloudConfigured, signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
