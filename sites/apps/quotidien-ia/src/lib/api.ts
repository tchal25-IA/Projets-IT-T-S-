import { supabase } from "@/integrations/supabase/client";

export type WorkflowId = "W1" | "W2" | "W3" | "W4";

export async function callAgent(workflowId: WorkflowId, userInput: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Authentification requise. Veuillez vous reconnecter.");

  const safeInput = userInput.slice(0, 4000);

  const res = await fetch("/api/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workflowId, userInput: safeInput }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Erreur serveur");
  return data.text as string;
}
