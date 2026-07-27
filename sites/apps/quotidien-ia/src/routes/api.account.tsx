import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Vérifie le jeton Bearer et renvoie l'identifiant utilisateur, ou null. */
async function verifyAuth(request: Request): Promise<string | null> {
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
  return data.claims.sub as string;
}

export const Route = createFileRoute("/api/account")({
  server: {
    handlers: {
      // Droit à l'effacement (RGPD art. 17) — supprime le compte et, par cascade,
      // l'ensemble des données rattachées (profil, événements, finances, documents,
      // abonnement, parrainage).
      DELETE: async ({ request }) => {
        try {
          const userId = await verifyAuth(request);
          if (!userId) {
            return Response.json({ error: "Authentification requise." }, { status: 401 });
          }

          const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
          if (error) {
            console.error("Account deletion error:", error.message);
            return Response.json(
              { error: "La suppression du compte a échoué. Réessayez ou contactez le support." },
              { status: 502 },
            );
          }

          return Response.json({ ok: true });
        } catch (e) {
          console.error("Account route error:", e);
          return Response.json({ error: "Une erreur interne est survenue." }, { status: 500 });
        }
      },
    },
  },
});
