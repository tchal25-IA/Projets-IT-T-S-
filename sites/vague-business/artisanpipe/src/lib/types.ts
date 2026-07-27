export type LeadStatus = "nouveau" | "contacté" | "devis_envoyé" | "gagné" | "perdu";
export type QuoteStatus = "brouillon" | "envoyé" | "accepté" | "refusé";
export type Channel = "appel" | "sms" | "email";
export type Currency = "CHF" | "EUR";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
}

export interface QuoteLine {
  id: string;
  desc: string;
  qty: number;
  unitPrice: number;
  tva: number;
}

export interface Quote {
  id: string;
  leadId: string;
  number: string;
  lines: QuoteLine[];
  status: QuoteStatus;
  validUntil: string;
  notes: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  quoteId: string;
  dueDate: string;
  done: boolean;
  channel: Channel;
  note?: string;
}

export interface Profile {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  tva: number;
  currency: Currency;
}
