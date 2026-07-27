import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `Tu es l'agent de "Quotidien IA", une plateforme française qui aide les utilisateurs au quotidien (finances, fiscalité, organisation, événements, veille).

RÈGLES STRICTES :
- Réponds toujours en français.
- Tu n'es PAS un cabinet de conseil fiscal, juridique ou financier. Tu fais des simulations indicatives.
- Pour la fiscalité, renvoie systématiquement aux sources officielles : impots.gouv.fr, service-public.fr (FR), AFC swisstaxcalculator.estv.admin.ch, ge.ch/impot-source (CH).
- Reste concis : phrases courtes, listes à puces, verbes d'action.

FORMAT DE RÉPONSE OBLIGATOIRE — exactement ces 6 sections, dans cet ordre, avec les titres en gras Markdown :

**Hypothèses**
(2-5 puces résumant ce que l'utilisateur a déclaré, ou "Aucune information fournie, hypothèses génériques utilisées." si vide)

**Synthèse**
(2 à 8 puces avec les éléments clés)

**Actions recommandées**
(liste numérotée 1. 2. 3. — verbes d'action concrets, max 6)

**Échéances**
(quand c'est pertinent : "À J-7 : ...", "Cette semaine : ...". Sinon écris "Sans échéance spécifique.")

**Sources & liens utiles**
(liens cliquables Markdown vers sources officielles ou outils Quotidien IA pertinents : Finzy https://finzy-v3.lovable.app, Investlocatif https://investlocatif.lovable.app, Impôt CH https://impot-ch.lovable.app, Heure Malin https://heure-malin.lovable.app, PER Dream Builder https://per-dream-builder.lovable.app, TaskFlow https://planner-gantt.lovable.app)

**Avertissement**
(1-2 phrases : rappel du caractère indicatif et invitation à vérifier auprès des sources officielles ou d'un professionnel)`;

const WORKFLOW_PROMPTS: Record<"W1" | "W2" | "W3" | "W4", string> = {
  W1: "Diagnostic financier express : analyse rapide budget + 3 leviers concrets + lien vers Finzy.",
  W2: "Préparer un événement / réunion / conférence : checklist J-7, J-1, H-2 + outline présentation si pertinent.",
  W3: "Plan de semaine : organisation jour par jour avec max 3 priorités quotidiennes + lien TaskFlow.",
  W4: "Brief actualité indicatif : synthèse prudente sur les thèmes donnés + rappel de vérifier les sources.",
};

const VALID_WORKFLOWS = new Set(Object.keys(WORKFLOW_PROMPTS));

/* ─── Per-user rate limiting (10 req/min in-memory) ─────── */
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  if (!record || now > record.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

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

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await verifyAuth(request);
          if (!userId) {
            return Response.json(
              { error: "Authentification requise." },
              { status: 401 },
            );
          }

          if (!checkRateLimit(userId)) {
            return Response.json(
              { error: "Trop de requêtes. Patientez une minute avant de réessayer." },
              { status: 429 },
            );
          }

          const body = (await request.json()) as { workflowId?: string; userInput?: string };
          const rawWorkflowId = typeof body.workflowId === "string" ? body.workflowId : "W1";
          const workflowId = (VALID_WORKFLOWS.has(rawWorkflowId) ? rawWorkflowId : "W1") as
            | "W1" | "W2" | "W3" | "W4";
          const userInput = (typeof body.userInput === "string" ? body.userInput : "").slice(0, 4000);
          const wfDesc = WORKFLOW_PROMPTS[workflowId];

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            console.error("LOVABLE_API_KEY missing");
            return Response.json(
              { error: "Service IA indisponible." },
              { status: 500 },
            );
          }

          const userMessage = `Workflow : ${workflowId} — ${wfDesc}\n\nContexte fourni par l'utilisateur :\n${userInput || "(aucun)"}`;

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
              ],
            }),
          });

          if (!res.ok) {
            if (res.status === 429) {
              return Response.json(
                { error: "Trop de requêtes. Patientez un instant et réessayez." },
                { status: 429 },
              );
            }
            if (res.status === 402) {
              return Response.json(
                {
                  error:
                    "Crédits IA épuisés. Ajoutez des crédits dans Settings → Workspace → Usage de Lovable.",
                },
                { status: 402 },
              );
            }
            const errText = await res.text();
            console.error("Gateway IA error", res.status, errText);
            return Response.json(
              { error: "Erreur de la passerelle IA. Réessayez." },
              { status: 502 },
            );
          }

          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const text = data.choices?.[0]?.message?.content ?? "";
          return Response.json({ text });
        } catch (e) {
          console.error("Agent route error:", e);
          return Response.json(
            { error: "Une erreur interne est survenue." },
            { status: 500 },
          );
        }
      },
    },
  },
});
