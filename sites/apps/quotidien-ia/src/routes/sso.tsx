import { createFileRoute } from "@tanstack/react-router";
import { verifyJwt } from "@/lib/jwt";

export const Route = createFileRoute("/sso")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? "";
        const secret = process.env.SSO_SECRET_FINZY;
        if (!secret) return new Response("SSO non configuré.", { status: 500 });

        const payload = await verifyJwt<{ sub: string; email: string; entitlements: string[] }>(
          token,
          secret,
        );
        if (!payload) {
          return new Response(
            `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Lien expiré</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:24px;color:#111}h1{font-size:22px;margin-bottom:12px}p{color:#444;line-height:1.5}</style></head><body><h1>Lien expiré</h1><p>Ce lien de connexion n'est plus valide (durée 5 min).</p><p>Retournez sur Quotidien IA et cliquez à nouveau sur « Ouvrir Finzy ».</p></body></html>`,
            { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
        const found = existing?.users?.find((u) => u.email === payload.email);
        if (!found) {
          await supabaseAdmin.auth.admin.createUser({
            email: payload.email,
            email_confirm: true,
            user_metadata: { sso_from: "quotidien-ia", qia_user_id: payload.sub },
          });
        }

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: payload.email,
        });
        if (error || !data?.properties?.action_link) {
          return new Response("Erreur lors de la connexion SSO.", { status: 500 });
        }

        return Response.redirect(data.properties.action_link, 302);
      },
    },
  },
  component: () => null,
});
