import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { AGENTS, type AgentId } from "@/lib/agents";

const VALID = new Set(AGENTS.map((a) => a.id));

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const r = rateLimitMap.get(userId);
  if (!r || now > r.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (r.count >= RATE_LIMIT) return false;
  r.count++;
  return true;
}

async function verifyAuth(request: Request): Promise<string | null> {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7).trim();
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

export const Route = createFileRoute("/api/skill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await verifyAuth(request);
          if (!userId) return Response.json({ error: "Authentification requise." }, { status: 401 });
          if (!checkRateLimit(userId))
            return Response.json({ error: "Trop de requêtes. Patientez une minute." }, { status: 429 });

          const body = (await request.json()) as { agentId?: string; userInput?: string };
          const agentId = typeof body.agentId === "string" ? body.agentId : "";
          if (!VALID.has(agentId as AgentId)) return Response.json({ error: "Agent inconnu." }, { status: 400 });
          const agent = AGENTS.find((a) => a.id === (agentId as AgentId))!;
          const userInput = (typeof body.userInput === "string" ? body.userInput : "").slice(0, 6000);
          if (!userInput.trim())
            return Response.json({ error: "Veuillez préciser votre question." }, { status: 400 });

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return Response.json({ error: "Service IA indisponible." }, { status: 500 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: agent.system },
                { role: "user", content: userInput },
              ],
            }),
          });

          if (!res.ok) {
            if (res.status === 429)
              return Response.json({ error: "Trop de requêtes. Réessayez dans un instant." }, { status: 429 });
            if (res.status === 402)
              return Response.json(
                { error: "Crédits IA épuisés. Ajoutez des crédits dans Settings → Workspace → Usage." },
                { status: 402 },
              );
            const errText = await res.text();
            console.error("Skill gateway error", res.status, errText);
            return Response.json({ error: "Erreur de la passerelle IA." }, { status: 502 });
          }

          const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const text = data.choices?.[0]?.message?.content ?? "";
          return Response.json({ text });
        } catch (e) {
          console.error("Skill route error:", e);
          return Response.json({ error: "Erreur interne." }, { status: 500 });
        }
      },
    },
  },
});
