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
  name: "create_finance_entry",
  title: "Create finance entry",
  description: "Record an income or expense entry for the signed-in user.",
  inputSchema: {
    amount: z.number().describe("Amount (positive number)."),
    kind: z.enum(["income", "expense"]),
    occurred_on: z.string().describe("Date (YYYY-MM-DD)."),
    currency: z.string().optional().describe("Currency code, e.g. EUR. Defaults server-side."),
    category: z.string().optional(),
    note: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("finance_entries")
      .insert({ ...input, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Created entry ${data.id}` }],
      structuredContent: { entry: data },
    };
  },
});
