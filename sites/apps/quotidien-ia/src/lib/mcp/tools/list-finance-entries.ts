import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_finance_entries",
  title: "List finance entries",
  description: "List recent finance entries (income/expenses) for the signed-in user.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional(),
    kind: z.enum(["income", "expense"]).optional().describe("Filter by entry kind."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, kind }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("finance_entries")
      .select("id, amount, currency, kind, category, note, occurred_on")
      .eq("user_id", ctx.getUserId())
      .order("occurred_on", { ascending: false })
      .limit(limit ?? 50);
    if (kind) query = query.eq("kind", kind);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { entries: data ?? [] },
    };
  },
});
