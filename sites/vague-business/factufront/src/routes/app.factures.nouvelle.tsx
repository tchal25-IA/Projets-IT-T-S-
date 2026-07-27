import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useFactuFront } from "@/lib/factufront-store";
import { cryptoId } from "@/lib/factufront-store";
import {
  addDaysISO,
  generateInvoiceNumber,
  todayISO,
} from "@/lib/invoiceEngine";
import type { Invoice } from "@/lib/factufront-types";

export const Route = createFileRoute("/app/factures/nouvelle")({
  component: NewInvoice,
});

function NewInvoice() {
  const navigate = useNavigate();
  const { state, addInvoice } = useFactuFront();

  useEffect(() => {
    const issue = todayISO();
    const firstClient = state.clients[0];
    const inv: Invoice = {
      id: cryptoId(),
      number: generateInvoiceNumber(state.invoices),
      clientId: firstClient?.id ?? "",
      issueDate: issue,
      dueDate: addDaysISO(issue, 30),
      currency: firstClient?.currency ?? state.profile.defaultCurrency,
      lines: [
        {
          id: cryptoId(),
          description: "",
          quantity: 1,
          unitPrice: 0,
          vatRate: state.profile.defaultVatRate,
        },
      ],
      notes: "",
      status: "brouillon",
      createdAt: new Date().toISOString(),
    };
    addInvoice(inv);
    navigate({ to: "/app/factures/$id", params: { id: inv.id }, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-8 text-sm text-muted-foreground">Création…</div>;
}
