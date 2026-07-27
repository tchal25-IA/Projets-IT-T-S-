import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEvents from "./tools/list-events";
import createEvent from "./tools/create-event";
import listFinanceEntries from "./tools/list-finance-entries";
import createFinanceEntry from "./tools/create-finance-entry";
import getSubscription from "./tools/get-subscription";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "quotidien-ia-mcp",
  title: "Quotidien IA",
  version: "0.1.0",
  instructions:
    "Tools to manage the signed-in user's Quotidien IA data: calendar events, finance entries (income/expenses), and subscription info.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEvents, createEvent, listFinanceEntries, createFinanceEntry, getSubscription],
});
