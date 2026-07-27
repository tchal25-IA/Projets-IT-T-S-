export type Country = "CH" | "FR";
export type Currency = "CHF" | "EUR";
export type InvoiceStatus = "brouillon" | "envoyée" | "payée";

export interface SellerProfile {
  companyName: string;
  contactName: string;
  address: string;
  postalCode: string;
  city: string;
  country: Country;
  email: string;
  phone: string;
  vatNumber: string; // TVA CH (CHE-...) or FR (FR...)
  ide: string; // Swiss IDE
  siret: string; // French SIRET
  iban: string;
  bic: string;
  bankName: string;
  defaultCurrency: Currency;
  defaultVatRate: number;
  logoDataUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  country: Country;
  currency: Currency;
  vatNumber?: string;
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  issueDate: string; // ISO
  dueDate: string; // ISO
  currency: Currency;
  lines: InvoiceLine[];
  notes: string;
  status: InvoiceStatus;
  createdAt: string;
}

export interface FactuFrontState {
  profile: SellerProfile;
  clients: Client[];
  invoices: Invoice[];
}
