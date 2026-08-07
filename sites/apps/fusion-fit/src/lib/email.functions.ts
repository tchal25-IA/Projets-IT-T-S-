import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Drain email_outbox via Resend (si RESEND_API_KEY présent).
 * À appeler périodiquement (cron / bouton admin) ou après enqueue.
 */
export const drainEmailOutbox = createServerFn({ method: "POST" }).handler(async () => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "FusionFit <noreply@fusionfit.app>";
  if (!key) {
    return { sent: 0, skipped: true as const, reason: "RESEND_API_KEY manquante" };
  }

  const { data: rows } = await supabaseAdmin
    .from("email_outbox")
    .select("id, to_email, subject, body")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(25);

  let sent = 0;
  for (const row of rows ?? []) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [row.to_email],
          subject: row.subject,
          text: row.body,
        }),
      });
      if (!res.ok) continue;
      await supabaseAdmin
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent += 1;
    } catch {
      /* continue */
    }
  }

  return { sent, skipped: false as const };
});
