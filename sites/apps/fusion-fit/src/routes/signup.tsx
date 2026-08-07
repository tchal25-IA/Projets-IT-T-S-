import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, Lock, User } from "lucide-react";
import { PhoenixLogo } from "@/components/phoenix-logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Inscription — FusionFit Initiative" },
      { name: "description", content: "Rejoignez l'expérience Initiative via invitation coach." },
    ],
  }),
});

type InviteInfo = { coach_id: string; email: string | null; coach_prenom: string | null };

function SignupPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/signup" });
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!token);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/fusionfit/routine", replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function checkToken() {
      if (!token) {
        setInviteLoading(false);
        setInviteError("Un lien d'invitation coach est requis pour créer un compte.");
        return;
      }
      setInviteLoading(true);
      setInviteError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc("validate_invitation", {
          p_token: token,
        });
        if (cancelled) return;
        if (rpcError) {
          setInviteError("Impossible de vérifier l'invitation.");
          setInvite(null);
        } else {
          const row = Array.isArray(data) ? data[0] : data;
          if (row?.coach_id) {
            setInvite(row as InviteInfo);
            if (row.email) setEmail(row.email);
          } else {
            setInvite(null);
            setInviteError("Invitation invalide ou expirée. Demande un nouveau lien à ton coach.");
          }
        }
      } catch {
        if (!cancelled) setInviteError("Impossible de vérifier l'invitation.");
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    }
    void checkToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token || !invite) {
      setError("Invitation requise.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    const { error: signError } = await signUp(email.trim(), password, prenom.trim(), token);
    setLoading(false);
    if (signError) {
      setError(signError);
      return;
    }
    navigate({ to: "/fusionfit/onboarding", replace: true });
  }

  const blocked = !token || !!inviteError || !invite;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 ff-scanline"
      style={{ background: "var(--ff-bg)", color: "var(--ff-text)" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <PhoenixLogo size={88} />
          <p className="mt-3 text-2xl font-extrabold tracking-[0.15em]" style={{ color: "var(--ff-amber)" }}>
            FUSION FIT
          </p>
          <p
            className="text-xl font-extrabold tracking-[0.3em] pb-1 border-b-2"
            style={{ color: "var(--ff-text)", borderColor: "var(--ff-amber)" }}
          >
            INITIATIVE
          </p>
          <p
            className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "var(--ff-text-muted)" }}
          >
            // Activation Agent
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
        >
          <h1 className="text-xl font-bold mb-1">Recrutement Initiative</h1>
          <p className="text-xs mb-5" style={{ color: "var(--ff-text-muted)" }}>
            {inviteLoading
              ? "Vérification de l'invitation…"
              : invite
                ? `Invité par ${invite.coach_prenom ?? "ton coach"}. Crée ton compte Agent.`
                : "L'inscription est réservée aux athlètes invités par un coach."}
          </p>

          {blocked && !inviteLoading ? (
            <div className="space-y-4">
              <p
                className="text-xs px-3 py-2 rounded-lg border"
                style={{
                  background: "oklch(0.65 0.20 22 / 12%)",
                  borderColor: "var(--ff-red)",
                  color: "var(--ff-red)",
                }}
              >
                {inviteError ?? "Invitation requise."}
              </p>
              <Link
                to="/login"
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest border"
                style={{
                  background: "oklch(0.78 0.16 198 / 20%)",
                  borderColor: "var(--ff-cyan)",
                  color: "var(--ff-cyan)",
                }}
              >
                Aller à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field
                icon={<User className="h-4 w-4" />}
                type="text"
                placeholder="Prénom"
                value={prenom}
                onChange={setPrenom}
                required
              />
              <Field
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="Email"
                value={email}
                onChange={setEmail}
                required
              />
              <Field
                icon={<Lock className="h-4 w-4" />}
                type="password"
                placeholder="Mot de passe (8+ caractères)"
                value={password}
                onChange={setPassword}
                required
                minLength={8}
              />

              {error && (
                <p
                  className="text-xs px-3 py-2 rounded-lg border"
                  style={{
                    background: "oklch(0.65 0.20 22 / 12%)",
                    borderColor: "var(--ff-red)",
                    color: "var(--ff-red)",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || inviteLoading || blocked}
                className="w-full mt-2 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest border transition-all"
                style={{
                  background: "oklch(0.78 0.16 198 / 20%)",
                  borderColor: "var(--ff-cyan)",
                  color: "var(--ff-cyan)",
                  boxShadow: "var(--ff-glow-cyan)",
                  opacity: loading || inviteLoading || blocked ? 0.6 : 1,
                }}
              >
                {loading ? "Création…" : "Créer mon compte"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Déjà inscrit ?{" "}
          <Link to="/login" className="underline" style={{ color: "var(--ff-cyan)" }}>
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 h-11"
      style={{ background: "var(--ff-surface-2)", borderColor: "var(--ff-border)" }}
    >
      <span style={{ color: "var(--ff-text-muted)" }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: "var(--ff-text)" }}
      />
    </div>
  );
}
