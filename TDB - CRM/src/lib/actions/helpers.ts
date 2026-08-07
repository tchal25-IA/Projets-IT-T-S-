import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  if (session.error === "Inactive") throw new Error("Compte désactivé");
  return session.user;
}

export async function notify(
  userId: string,
  title: string,
  body: string,
  link?: string
) {
  const { prisma } = await import("@/lib/db");
  await prisma.notification.create({
    data: { userId, title, body, link },
  });
}

/** Invalide les surfaces CRM liées aux leads / pipeline / facturation. */
export function revalidateCrm(opts?: {
  leadId?: string | null;
  clientId?: string | null;
}) {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/appels");
  revalidatePath("/clients");
  revalidatePath("/facturation");
  revalidatePath("/taches");
  revalidatePath("/stats");
  revalidatePath("/notifications");
  if (opts?.leadId) revalidatePath(`/leads/${opts.leadId}`);
  if (opts?.clientId) revalidatePath(`/clients/${opts.clientId}`);
}
