export {
  createLead,
  updateLeadStatus,
  updateLeadDetails,
  addActivity,
  deleteLead,
} from "@/lib/actions/leads";

export {
  // Opportunity actions (with legacy aliases)
  addOpportunity,
  addDealLine, // legacy alias
  updateOpportunity,
  updateDealLine, // legacy alias
  deleteOpportunity,
  deleteDealLine, // legacy alias
  updateOpportunityStatus,
  updateDealLineStatus, // legacy alias
  // Account actions (with legacy aliases)
  updateAccountStatus,
  updateClientStatus, // legacy alias
  updateAccountDetails,
  updateClientDetails, // legacy alias
  deleteAccount,
  deleteClient, // legacy alias
  // Commission actions
  updateCommissionStatus,
  updateCommission,
  deleteCommission,
  // Stripe
  startStripeCheckout,
} from "@/lib/actions/billing";

export {
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  upsertQuota,
} from "@/lib/actions/users";

export { importLeads } from "@/lib/actions/import";

export { createTask, toggleTaskDone, deleteTask } from "@/lib/actions/tasks";

export { saveLeadView, deleteSavedView } from "@/lib/actions/views";

export { sendLeadEmail } from "@/lib/actions/emails";

export {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";

export {
  upsertProduct,
  deleteProduct,
  updateProductFieldSchema,
  addProductField,
  updateProductField,
  removeProductField,
  upsertOffering,
  deleteOffering,
  toggleOfferingActive,
  upsertCommissionRule,
  saveCompanySettings,
  saveLeadSources,
  saveCrmLabels,
} from "@/lib/actions/settings";
