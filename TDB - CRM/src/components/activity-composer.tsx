"use client";

import { useTransition } from "react";
import { addActivity, sendLeadEmail } from "@/lib/actions";
import { Button, Input, Textarea } from "@/components/ui";

export function ActivityComposer({
  leadId,
  hasEmail,
}: {
  leadId: string;
  hasEmail: boolean;
}) {
  const [pending, start] = useTransition();

  function quick(type: "APPEL" | "NOTE" | "RDV", note: string) {
    const fd = new FormData();
    fd.set("type", type);
    fd.set("note", note);
    if (type === "RDV") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setMinutes(0, 0, 0);
      fd.set("nextCallAt", d.toISOString().slice(0, 16));
    }
    start(async () => {
      await addActivity(leadId, fd);
    });
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
        Composer d&apos;activité
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => quick("APPEL", "Appel effectué")}
        >
          Log appel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => quick("RDV", "RDV planifié")}
        >
          Poser RDV
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !hasEmail}
          onClick={() => start(async () => sendLeadEmail(leadId, "relance"))}
        >
          Email relance
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !hasEmail}
          onClick={() => start(async () => sendLeadEmail(leadId, "devis"))}
        >
          Email devis
        </Button>
      </div>
      <form
        action={(fd) => {
          start(async () => {
            await addActivity(leadId, fd);
          });
        }}
        className="grid gap-2 sm:grid-cols-[1fr_auto]"
      >
        <input type="hidden" name="type" value="NOTE" />
        <Textarea name="note" placeholder="Note rapide…" rows={2} required />
        <div className="flex flex-col gap-2">
          <Input name="nextCallAt" type="datetime-local" />
          <Button type="submit" disabled={pending}>
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}
