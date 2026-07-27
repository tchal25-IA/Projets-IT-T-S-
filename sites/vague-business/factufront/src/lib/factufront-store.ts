import { useEffect, useState, useSyncExternalStore } from "react";
import type {
  Client,
  FactuFrontState,
  Invoice,
  SellerProfile,
} from "./factufront-types";
import { addDaysISO, todayISO } from "./invoiceEngine";

const STORAGE_KEY = "factufront:v1";

const defaultProfile: SellerProfile = {
  companyName: "Studio Lemaire",
  contactName: "Camille Lemaire",
  address: "12 rue du Rhône",
  postalCode: "1204",
  city: "Genève",
  country: "CH",
  email: "hello@studiolemaire.ch",
  phone: "+41 22 000 00 00",
  vatNumber: "CHE-123.456.789 TVA",
  ide: "CHE-123.456.789",
  siret: "",
  iban: "CH93 0076 2011 6238 5295 7",
  bic: "POFICHBEXXX",
  bankName: "PostFinance",
  defaultCurrency: "CHF",
  defaultVatRate: 8.1,
};

function seedState(): FactuFrontState {
  const demoClient: Client = {
    id: cryptoId(),
    name: "Atelier Vidal SARL",
    email: "compta@atelier-vidal.fr",
    address: "8 rue Victor Hugo",
    postalCode: "74100",
    city: "Annemasse",
    country: "FR",
    currency: "EUR",
    vatNumber: "FR40123456824",
    createdAt: new Date().toISOString(),
  };
  const issue = todayISO();
  const demoInvoice: Invoice = {
    id: cryptoId(),
    number: "FF-" + new Date().getFullYear() + "-0001",
    clientId: demoClient.id,
    issueDate: issue,
    dueDate: addDaysISO(issue, 30),
    currency: "EUR",
    lines: [
      {
        id: cryptoId(),
        description: "Refonte identité visuelle — phase 1",
        quantity: 1,
        unitPrice: 1800,
        vatRate: 20,
      },
      {
        id: cryptoId(),
        description: "Direction artistique (journée)",
        quantity: 2,
        unitPrice: 650,
        vatRate: 20,
      },
    ],
    notes: "Paiement à 30 jours. Merci de rappeler le n° de facture sur le virement.",
    status: "brouillon",
    createdAt: new Date().toISOString(),
  };
  return {
    profile: defaultProfile,
    clients: [demoClient],
    invoices: [demoInvoice],
  };
}

export function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

let memoryState: FactuFrontState | null = null;
const listeners = new Set<() => void>();

function load(): FactuFrontState {
  if (typeof window === "undefined") {
    return memoryState ?? seedState();
  }
  if (memoryState) return memoryState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryState = JSON.parse(raw) as FactuFrontState;
      return memoryState;
    }
  } catch {
    // ignore
  }
  memoryState = seedState();
  save(memoryState);
  return memoryState;
}

function save(state: FactuFrontState) {
  memoryState = state;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): FactuFrontState {
  return load();
}

function getServerSnapshot(): FactuFrontState {
  return memoryState ?? seedState();
}

export function useFactuFront() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    state,
    updateProfile(patch: Partial<SellerProfile>) {
      save({ ...state, profile: { ...state.profile, ...patch } });
    },
    addClient(c: Omit<Client, "id" | "createdAt">) {
      const client: Client = { ...c, id: cryptoId(), createdAt: new Date().toISOString() };
      save({ ...state, clients: [...state.clients, client] });
      return client;
    },
    updateClient(id: string, patch: Partial<Client>) {
      save({
        ...state,
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
    },
    deleteClient(id: string) {
      save({ ...state, clients: state.clients.filter((c) => c.id !== id) });
    },
    addInvoice(inv: Invoice) {
      save({ ...state, invoices: [inv, ...state.invoices] });
    },
    updateInvoice(id: string, patch: Partial<Invoice>) {
      save({
        ...state,
        invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      });
    },
    deleteInvoice(id: string) {
      save({ ...state, invoices: state.invoices.filter((i) => i.id !== id) });
    },
  };
}

// SSR-safe hydration check
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
