# Tranche 1 Implementation Status

## ✅ Completed (Core Foundation)

### 1. Schema & Database
- [x] **Prisma schema** updated with full multi-tenant model
  - Organization table (tenant core)
  - CustomObject, CustomField, CustomFieldValue (extensibility layer)
  - ModuleEntitlement (feature flags)
  - Contact (new entity)
  - Renamed: Client → Account, DealLine → Opportunity
  - Added organizationId to all business entities
  - Comprehensive indexes for multi-tenant queries
  
- [x] **Migration SQL** (`20260911183656_tranche1_multi_tenant/migration.sql`)
  - Creates all new tables and enums
  - Renames existing tables
  - Creates default org `org_ts_crm_default`
  - Migrates all existing data to default org
  - Makes organizationId NOT NULL with proper FKs
  - Updates indexes for org-scoped queries
  
- [x] **Seed** updated for multi-tenant
  - Creates default organization
  - Creates module entitlements
  - Creates sample custom fields
  - Links all entities to org
  - Uses new model names (Account, Opportunity)

### 2. Authentication & Session
- [x] `src/lib/auth.ts`
  - Session includes organizationId and organizationSlug
  - Login fetches and validates organization
  - JWT refresh checks organization active status

### 3. Core Libraries
- [x] `src/lib/tenant.ts` (NEW)
  - `requireOrg()` - get org from session
  - `orgWhere()` - create tenant-scoped where clause
  - `orgFilter()` - simple org filter
  - `ensureOrgMatch()` - validate record belongs to org

- [x] `src/lib/access.ts`
  - Updated assertLeadAccess with org filtering
  - Renamed assertClientAccess → assertAccountAccess
  - Renamed assertDealLineAccess → assertOpportunityAccess
  - Legacy aliases for backward compat

- [x] `src/lib/permissions.ts`
  - Renamed clientVisibilityWhere → accountVisibilityWhere
  - Uses new Prisma Account type
  - Legacy alias for backward compat

- [x] `src/lib/catalog.ts`
  - getCommissionRates() now org-scoped
  - syncDealLinesFromQualification renamed to use Opportunity
  - Removed ensureDefaultCommissionRules (now in seed per-org)

- [x] `src/lib/interests.ts`
  - syncLeadInterests() now org-scoped
  - Creates LeadInterest with organizationId

- [x] `src/lib/actions/helpers.ts`
  - notify() includes organizationId
  - revalidateCrm() supports accountId (+ clientId legacy alias)

- [x] `src/lib/scope.ts`
  - getScopedProductId() now org-scoped

- [x] `src/lib/audit.ts`
  - recordFieldChanges() includes organizationId
  
- [x] `src/lib/utils.ts`
  - ACCOUNT_STATUS_LABELS exported (CLIENT_STATUS_LABELS alias)
  - AccountStatus imported instead of ClientStatus

### 4. Server Actions (✅ ALL COMPLETED)
- [x] `src/lib/actions/leads.ts`
  - All lead actions updated (create, update, delete, status, activity)
  - Uses requireOrg() and orgWhere()
  - Uses Account instead of Client
  - Uses Opportunity instead of DealLine

- [x] `src/lib/actions/billing.ts`
  - Renamed to use Account, Opportunity models
  - All functions tenant-aware with orgWhere()
  - Legacy aliases: addDealLine, updateDealLine, etc.
  - updateAccountStatus, updateAccountDetails, deleteAccount
  - addOpportunity, updateOpportunity, deleteOpportunity

- [x] `src/lib/actions/tasks.ts`
  - All task actions org-scoped
  - Supports accountId (+ clientId fallback)

- [x] `src/lib/actions/users.ts`
  - createUser adds organizationId
  - All queries org-filtered
  - Quota unique constraint: organizationId_userId_yearMonth

- [x] `src/lib/actions/import.ts`
  - importLeads fully org-scoped
  - Lead and Activity creates include organizationId

- [x] `src/lib/actions/settings.ts`
  - All product/offering/commissionRule operations org-scoped
  - Unique constraints updated for org (organizationId_roleKey, etc.)

- [x] `src/lib/actions/notifications.ts`
  - markNotificationRead org-filtered

- [x] `src/lib/actions/views.ts`
  - saveLeadView, deleteSavedView org-scoped

- [x] `src/lib/actions/index.ts`
  - Exports all new Account/Opportunity functions
  - Maintains legacy aliases for compatibility

### 5. Server Components/Pages (Partial)
- [x] `src/app/(app)/clients/[id]/page.tsx`
  - Updated to use Account model
  - All queries org-aware
  - Uses ACCOUNT_STATUS_LABELS
  - Legacy URL path /clients kept for compat

- [x] `src/app/(app)/admin/parametres/page.tsx`
  - Removed ensureDefaultCommissionRules call
  - Fixed AccountStatus import

- [x] `src/app/(app)/admin/quotas/page.tsx`
  - Updated to use opportunities instead of dealLines
  - Fixed leadsCommerciaux query

- [ ] `src/app/(app)/dashboard/page.tsx` - TODO
- [ ] `src/app/(app)/leads/page.tsx` - TODO
- [ ] `src/app/(app)/leads/[id]/page.tsx` - TODO
- [ ] `src/app/(app)/clients/page.tsx` - TODO
- [ ] `src/app/(app)/pipeline/page.tsx` - TODO
- [ ] `src/app/(app)/facturation/page.tsx` - TODO
- [ ] `src/app/(app)/stats/page.tsx` - TODO
- [ ] `src/app/(app)/taches/page.tsx` - TODO
- [ ] `src/app/(app)/notifications/page.tsx` - TODO
- [ ] Other admin pages - TODO

### 6. Documentation
- [x] `docs/PLATFORM_TRANCHE1.md` - Complete architecture guide
- [x] `docs/TRANCHE1_STATUS.md` - This status document

## ⏳ Remaining Work

### Server Components/Pages (CRITICAL)
- [ ] Update remaining ~12 pages to use Account/Opportunity
- [ ] Add org filtering to all page queries
- [ ] Update imports to use new model types

### Testing & Validation
- [x] ~~Regenerate Prisma client~~ (done automatically)
- [x] ~~Run `npm run build`~~ - **✅ BUILD PASSES**
- [ ] Run `npm run lint` - clean up 6 minor warnings
- [ ] Run seed successfully with new migration
- [ ] Test login with organizationId in session
- [ ] Smoke test: create lead, convert to account, add opportunity

### Minor Cleanups
- [ ] Remove unused orgId variables (6 lint warnings)
- [ ] Update component props to use Account/Opportunity types where needed
- [ ] Verify all client components work with new action signatures

## ✅ Breaking Changes Summary (All Implemented)

### Model Renames
- `Client` → `Account` (internal model, UI still "Clients")
- `DealLine` → `Opportunity`
- `clientId` → `accountId` (in relations)
- `amountHt` → `amount` (in Opportunity)
- `label` → `name` (in Opportunity)

### New Required Fields
- All business entities now require `organizationId`
- All Create operations must include `organizationId`
- All queries must filter by `organizationId`

### Function Renames (with legacy aliases)
- `assertClientAccess()` → `assertAccountAccess()`
- `assertDealLineAccess()` → `assertOpportunityAccess()`
- `clientVisibilityWhere()` → `accountVisibilityWhere()`
- `updateClientStatus()` → `updateAccountStatus()`
- `addDealLine()` → `addOpportunity()`
- etc.

### Tenant-Aware Pattern (Applied Everywhere)
```typescript
import { requireOrg, orgWhere } from "@/lib/tenant";

export async function myAction() {
  const orgId = await requireOrg();
  
  // Queries
  const records = await prisma.model.findMany({
    where: orgWhere(orgId, { ...other filters }),
  });
  
  // Creates
  await prisma.model.create({
    data: {
      organizationId: orgId,
      ...other data
    },
  });
}
```

## 🎯 Estimated Remaining Effort

### Critical (Required to complete Tranche 1)
1. **Update ~12 remaining pages** (~2-3 hours)
   - Dashboard, leads list/detail, clients list, pipeline, etc.
   - Replace prisma.client → prisma.account
   - Replace prisma.dealLine → prisma.opportunity
   - Add org filtering to all queries

2. **Testing** (~30 min)
   - Run seed with migration
   - Manual smoke test
   - Fix any runtime issues

3. **Final cleanup** (~15 min)
   - Fix lint warnings
   - Update TRANCHE1_STATUS to COMPLETED
   - Update PR description

**Total estimate: 3-4 hours remaining**

### Tranche 1 Progress: ~75% Complete
- ✅ Schema & Migration (100%)
- ✅ Auth & Session (100%)
- ✅ Core Libraries (100%)
- ✅ Server Actions (100%)
- ⏳ Pages/Components (25%)
- ⏳ Testing (0%)

## 🚀 Migration Path for Production

When ready to deploy Tranche 1 to production:

1. **Backup database** - critical before schema migration
2. **Run migration** - `npx prisma migrate deploy`
3. **Verify default org created** - check `Organization` table
4. **Verify data migration** - all records have organizationId
5. **Deploy application** - with updated code
6. **Test login** - users should see organizationId in session
7. **Smoke test** - verify lead create/update/close flows work

## Known Limitations (Tranche 1)

- Users belong to exactly 1 organization (no multi-org membership)
- No UI to create/edit custom objects or fields (data layer ready)
- No UI to manage module entitlements (can edit via seed/admin)
- Navigation still shows French labels (Clients vs Accounts internally)
- URLs keep legacy `/clients` paths for backward compat
- Custom fields stored but minimal display in UI

## ⛔ NOT in Tranche 1 (Deferred to Tranche 2)

- ❌ Admin UI for custom objects/fields
- ❌ Multi-org user membership
- ❌ Organization switcher UI
- ❌ Module entitlement admin UI
- ❌ Industry-specific configuration packs
- ❌ Advanced Sales features (forecasting, territories, CPQ)
