"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";

const demos = [
  { email: "associe@ts-crm.fr", role: "Associé (tout)" },
  { email: "direction.vf@ts-crm.fr", role: "Direction VitrineFlash" },
  { email: "direction.bookflow@ts-crm.fr", role: "Direction Bookflow" },
  { email: "apporteur1@ts-crm.fr", role: "Apporteur #1" },
  { email: "commercial1@ts-crm.fr", role: "Commercial #1" },
];

export default function LoginPage({ showDemo = false }: { showDemo?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(showDemo ? "associe@ts-crm.fr" : "");
  const [password, setPassword] = useState(showDemo ? "demo1234" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants invalides");
      return;
    }
    router.push(params.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f2f2c]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #1d6b63 0%, transparent 40%), radial-gradient(circle at 80% 0%, #c4a574 0%, transparent 35%), linear-gradient(160deg, #0f2f2c, #163d39 50%, #0b221f)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-16 lg:flex-row lg:items-center lg:gap-20">
        <div className="max-w-lg text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-teal-200/70">T&S</p>
          <h1 className="mt-3 font-display text-5xl leading-tight">CRM multi-rôles</h1>
          <p className="mt-4 text-teal-50/80">
            VitrineFlash & Bookflow — Associé, directions produit, apporteurs et
            commerciaux, chacun avec son tableau de bord.
          </p>
          {showDemo ? (
            <p className="mt-4 text-sm text-teal-100/70">
              Comptes démo (dev) : apporteur1…10@ts-crm.fr · commercial1…10@ts-crm.fr
              <br />
              Mot de passe : demo1234
            </p>
          ) : null}
        </div>

        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">Connexion</h2>
          {showDemo ? (
            <p className="mt-1 text-sm text-stone-500">Mot de passe démo : demo1234</p>
          ) : (
            <p className="mt-1 text-sm text-stone-500">
              Identifiants fournis par votre administrateur
            </p>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
              />
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
          {showDemo ? (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Accès rapides
              </p>
              <div className="grid gap-2">
                {demos.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("demo1234");
                    }}
                    className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-left text-sm hover:bg-stone-50"
                  >
                    <span className="font-medium text-stone-800">{d.role}</span>
                    <span className="text-xs text-stone-500">{d.email}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
