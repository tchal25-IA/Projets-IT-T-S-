import { createFileRoute } from "@tanstack/react-router";
import { entitledApps } from "@/lib/connected-apps";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CategoryId } from "@/lib/pricing";

// Vérification des droits de service à service (Finzy / Paperasse → Quotidien IA).
// Permet de revérifier l'abonnement (révocation) après le SSO initial.
// Protégé par un secret partagé dans l'en-tête X-Service-Secret.

export const Route = createFileRoute("/api/entitlements")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const expected = process.env.SERVICE_SHARED_SECRET;
          const provided = request.headers.get("x-service-secret");
          if (!expected || !provided || provided !== expected) {
            return Response.json({ error: "Non autorisé." }, { status: 401 });
          }

          const url = new URL(request.url);
          const email = url.searchParams.get("email");
          const userId = url.searchParams.get("user_id");
          if (!email && !userId) {
            return Response.json({ error: "Paramètre email ou user_id requis." }, { status: 400 });
          }

          let resolvedId = userId;
          if (!resolvedId && email) {
            const { data: prof } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("email", email)
              .maybeSingle();
            if (!prof) {
              return Response.json({ active: false, entitlements: [] });
            }
            resolvedId = prof.id as string;
          }

          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("selected")
            .eq("user_id", resolvedId!)
            .maybeSingle();
          const apps = entitledApps((sub?.selected ?? []) as CategoryId[]);

          return Response.json({ active: apps.length > 0, entitlements: apps });
        } catch (e) {
          console.error("Entitlements route error:", e);
          return Response.json({ error: "Une erreur interne est survenue." }, { status: 500 });
        }
      },
    },
  },
});
