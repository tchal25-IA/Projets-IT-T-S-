import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { PhoenixLogo } from "@/components/phoenix-logo";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Connexion — FusionFit Initiative" },
      { name: "description", content: "Accédez à votre interface FusionFit Initiative." },
    ],
  }),
});

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/fusionfit/routine", replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
    else navigate({ to: "/fusionfit/routine", replace: true });
  }

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
          <p className="text-xl font-extrabold tracking-[0.3em] pb-1 border-b-2"
            style={{ color: "var(--ff-text)", borderColor: "var(--ff-amber)" }}>
            INITIATIVE
          </p>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: "var(--ff-text-muted)" }}>
            Transform · Rise · Repeat
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--ff-surface)", borderColor: "var(--ff-border)" }}
        >
          <h1 className="text-xl font-bold mb-1">Identification Agent</h1>
          <p className="text-xs mb-5" style={{ color: "var(--ff-text-muted)" }}>
            Connectez-vous pour accéder à votre routine.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={email} onChange={setEmail} required />
            <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Mot de passe" value={password} onChange={setPassword} required />

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg border" style={{
                background: "oklch(0.65 0.20 22 / 12%)",
                borderColor: "var(--ff-red)",
                color: "var(--ff-red)",
              }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest border transition-all"
              style={{
                background: "oklch(0.78 0.16 198 / 20%)",
                borderColor: "var(--ff-cyan)",
                color: "var(--ff-cyan)",
                boxShadow: "var(--ff-glow-cyan)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Connexion…" : "Se connecter"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--ff-text-muted)" }}>
          Pas encore de compte ?{" "}
          <Link to="/signup" search={{ token: undefined }} className="underline" style={{ color: "var(--ff-cyan)" }}>
            Créer le premier compte coach
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon, type, placeholder, value, onChange, required,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
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
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: "var(--ff-text)" }}
      />
    </div>
  );
}
