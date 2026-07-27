// Auth provider with role detection (coach vs abonne)
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Setup listener BEFORE getSession (per Supabase best practices)
  useEffect(() => {
    let initialized = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRole(null);
        setLoading(false);
      } else {
        const isFirst = !initialized;
        // Defer role lookup to avoid Supabase deadlock on initial load
        setTimeout(() => fetchRole(sess.user.id, isFirst), 0);
      }
      initialized = true;
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!initialized) {
        setSession(s);
        setUser(s?.user ?? null);
        if (!s?.user) setLoading(false);
        // Role fetch (if needed) will set loading=false inside fetchRole
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(userId: string, setLoadingAfter = false) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[useAuth] fetchRole error:", error.message);
    }
    setRole(!error && data?.role ? (data.role as AppRole) : "abonne");
    if (setLoadingAfter) setLoading(false);
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    prenom: string,
    invitationToken?: string,
  ) => {
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
    await supabase.auth.signOut();
  };

  // Rôle effectif : un coach en mode "Sujet Zéro" est vu comme abonné partout.
  const effectiveRole: AppRole | null =
    role === "coach" && viewAsAthlete ? "abonne" : role;

  return (
    <AuthContext.Provider value={{
      user, session,
      role: effectiveRole,
      realRole: role,
      viewAsAthlete, setViewAsAthlete,
      loading, signIn, signUp, signOut,
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
