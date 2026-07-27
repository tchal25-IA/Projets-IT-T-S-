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
  name: "create_event",
  title: "Create event",
  description: "Create a calendar event for the signed-in user.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Event title."),
    starts_at: z.string().describe("ISO 8601 start datetime (e.g. 2026-07-15T09:00:00Z)."),
    ends_at: z.string().optional().describe("ISO 8601 end datetime."),
    description: z.string().optional(),
    location: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("events")
      .insert({ ...input, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Created event ${data.id}` }],
      structuredContent: { event: data },
    };
  },
});
