import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CORS = {
  ...corsHeaders,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;

  function b64urlDecode(s: string): Uint8Array {
    let b = s.replace(/-/g, "+").replace(/_/g, "/");
    b += "=".repeat(b.length % 4 ? 4 - (b.length % 4) : 0);
    const bin = atob(b);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(`${header}.${body}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Record<string, unknown>;
    if (payload["aud"] !== "finzy") return null;
    if (typeof payload["exp"] === "number" && payload["exp"] < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { token } = await req.json().catch(() => ({})) as { token?: string };
    const secret = Deno.env.get("SSO_SECRET_FINZY");
    if (!secret) {
      return new Response(JSON.stringify({ error: "SSO non configuré." }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const payload = token ? await verifyJwt(token, secret) : null;
    if (!payload || typeof payload["email"] !== "string") {
      return new Response(JSON.stringify({ error: "invalid_or_expired_token" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const email = payload["email"] as string;
    const qiaUserId = typeof payload["sub"] === "string" ? payload["sub"] : undefined;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return new Response(JSON.stringify({ error: "Recherche compte impossible." }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { sso_from: "quotidien-ia", qia_user_id: qiaUserId },
      });
      if (createErr || !created?.user) {
        return new Response(JSON.stringify({ error: "Création compte impossible." }), {
          status: 500,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      user = created.user;
    }

    // Ensure profile exists and skip onboarding for SSO users
    try {
      const username = (typeof payload["username"] === "string" && payload["username"]) ||
        (typeof payload["display_name"] === "string" && payload["display_name"]) ||
        email.split("@")[0];
      const market = typeof payload["market"] === "string" ? payload["market"] : undefined;
      const profileRow: Record<string, unknown> = {
        id: user.id,
        email,
        username,
        onboarding_completed: true,
      };
      if (market) profileRow.market = market;
      const { error: profileErr } = await admin.from("profiles").upsert(profileRow, { onConflict: "id" });
      if (profileErr) {
        console.error("profile upsert error:", profileErr.message);
        return new Response(JSON.stringify({ error: "Profil impossible." }), {
          status: 500,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("profile upsert error:", e);
      return new Response(JSON.stringify({ error: "Profil impossible." }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Génère un magic link puis échange le hashed_token contre une session réelle
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("generateLink error:", linkErr);
      return new Response(JSON.stringify({ error: "Création session impossible." }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: verified, error: verifyErr } = await anon.auth.verifyOtp({
      type: "magiclink",
      token_hash: linkData.properties.hashed_token,
    });
    if (verifyErr || !verified?.session) {
      console.error("verifyOtp error:", verifyErr);
      return new Response(JSON.stringify({ error: "Échange session impossible." }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const session = { session: verified.session };

    return new Response(
      JSON.stringify({
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sso-verify error:", e);
    return new Response(JSON.stringify({ error: "Erreur interne." }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});