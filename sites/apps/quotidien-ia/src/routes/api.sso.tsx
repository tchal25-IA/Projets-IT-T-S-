import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { signJwt } from "@/lib/jwt";
import { CONNECTED_APPS, entitledApps, type ConnectedAppKey } from "@/lib/connected-apps";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CategoryId } from "@/lib/pricing";

// IMPORTANT : accès LITTÉRAL aux variables d'environnement.
// Les bundlers (Vite/esbuild, Cloudflare Workers) remplacent statiquement
// process.env.NOM_LITTERAL au build ; un accès dynamique process.env[variable]
// renverrait undefined en production. On résout donc chaque app explicitement.
function resolveAppConfig(key: ConnectedAppKey): { secret?: string; target?: string } {
  switch (key) {
    case "finzy":
      return { secret: process.env.SSO_SECRET_FINZY, target: process.env.FINZY_URL };
    case "paperasse":
      return { secret: process.env.SSO_SECRET_PAPERASSE, target: process.env.PAPERASSE_URL };
    default:
      return {};
  }
}

/** Vérifie le jeton Supabase et renvoie l'identité, ou null. */
async function verifyAuth(request: Request): Promise<{ id: string; email: string | null } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub as string, email: (data.claims.email as string) ?? null };
}

export const Route = createFileRoute("/api/sso")({
  server: {
    handlers: {
      // Émet un jeton SSO signé et renvoie l'URL de redirection vers l'app externe.
      // L'app cible vérifiera ce jeton avec le secret partagé puis ouvrira/relie le compte.
      GET: async ({ request }) => {
        try {
          const reqUrl = new URL(request.url);
          const appKey = reqUrl.searchParams.get("app");
          const app = CONNECTED_APPS.find((a) => a.key === appKey);
          if (!app) {
            return Response.json({ error: "Application inconnue." }, { status: 400 });
          }

          const user = await verifyAuth(request);
          if (!user) {
            return Response.json({ error: "Authentification requise." }, { status: 401 });
          }

          // Source de vérité des droits : la table subscriptions de Quotidien IA.
          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("selected")
            .eq("user_id", user.id)
            .maybeSingle();
          const selected = ((sub?.selected ?? []) as CategoryId[]);
          const apps = entitledApps(selected);
          if (!apps.includes(app.key)) {
            return Response.json(
              { error: "Votre abonnement n'inclut pas cette application." },
              { status: 403 },
            );
          }

          const { secret, target } = resolveAppConfig(app.key);
          if (!secret || !target) {
            console.error(`SSO non configuré pour ${app.key} (${app.secretEnv}/${app.urlEnv} manquant).`);
            return Response.json({ error: "SSO non configuré pour cette application." }, { status: 500 });
          }

          const ssoToken = await signJwt(
            {
              sub: user.id,
              email: user.email,
              app: app.key,
              entitlements: apps,
              iss: "quotidien-ia",
              aud: app.key,
              jti: crypto.randomUUID(),
            },
            secret,
            300,
          );

          const redirectUrl = `${target.replace(/\/$/, "")}/sso?token=${encodeURIComponent(ssoToken)}`;
          return Response.json({ url: redirectUrl });
        } catch (e) {
          console.error("SSO route error:", e);
          return Response.json({ error: "Une erreur interne est survenue." }, { status: 500 });
        }
      },
    },
  },
});
