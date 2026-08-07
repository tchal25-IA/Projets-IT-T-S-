import { prisma } from "@/lib/db";
import { escapeHtml } from "@/lib/access";

type SendEmailOpts = {
  to: string;
  subject: string;
  html: string;
  leadId?: string;
  userId?: string;
  logNote?: string;
};

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendCrmEmail(opts: SendEmailOpts): Promise<{
  ok: boolean;
  mode: "resend" | "logged";
  error?: string;
}> {
  let mode: "resend" | "logged" = "logged";
  let error: string | undefined;

  if (isResendConfigured()) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        error = body.slice(0, 200);
      } else {
        mode = "resend";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Erreur Resend";
    }
  }

  if (opts.leadId) {
    await prisma.activity.create({
      data: {
        leadId: opts.leadId,
        userId: opts.userId ?? null,
        type: "EMAIL",
        note:
          opts.logNote ??
          `Email « ${opts.subject} » → ${opts.to} (${mode}${error ? ` — ${error}` : ""})`,
      },
    });
  }

  return { ok: !error || mode === "logged", mode, error };
}

export function templateDevis(company: string, amount: string) {
  const c = escapeHtml(company);
  const a = escapeHtml(amount);
  return {
    subject: `Devis T&S — ${company}`,
    html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint notre proposition pour <strong>${c}</strong> (montant HT indicatif : ${a}).</p><p>Cordialement,<br/>L'équipe T&S</p>`,
  };
}

export function templateRelance(company: string) {
  const c = escapeHtml(company);
  return {
    subject: `Relance — ${company}`,
    html: `<p>Bonjour,</p><p>Nous revenons vers vous concernant le dossier <strong>${c}</strong>. Souhaitez-vous échanger rapidement ?</p><p>Cordialement,<br/>L'équipe T&S</p>`,
  };
}

export function templateCloseConfirm(company: string) {
  const c = escapeHtml(company);
  return {
    subject: `Bienvenue — ${company}`,
    html: `<p>Bonjour,</p><p>Merci pour votre confiance. Le dossier <strong>${c}</strong> est désormais en livraison.</p><p>Cordialement,<br/>L'équipe T&S</p>`,
  };
}
