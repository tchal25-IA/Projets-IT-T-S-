import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLeads, useQuotes } from "@/lib/useStore";
import { uid } from "@/lib/store";
import { nextQuoteNumber } from "@/lib/quoteEngine";

export const Route = createFileRoute("/app/devis/nouveau")({
  component: NewDevis,
});

function NewDevis() {
  const { quotes, save } = useQuotes();
  const { leads } = useLeads();
  const navigate = useNavigate();

  useEffect(() => {
    const number = nextQuoteNumber(quotes);
    const q = {
      id: uid(),
      leadId: leads[0]?.id ?? "",
      number,
      status: "brouillon" as const,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400_000).toISOString(),
      notes: "",
      lines: [{ id: uid(), desc: "", qty: 1, unitPrice: 0, tva: 8.1 }],
    };
    save([q, ...quotes]);
    navigate({ to: "/app/devis/$id", params: { id: q.id }, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-8 text-center text-muted-foreground">Création…</div>;
}
