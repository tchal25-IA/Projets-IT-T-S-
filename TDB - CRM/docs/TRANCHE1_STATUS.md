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

### 4. Server Actions (Partial)
- [x] `src/lib/actions/leads.ts`
  - All lead actions updated (create, update, delete, status, activity)
  - Uses requireOrg() and orgWhere()
  - Uses Account instead of Client
  - Uses Opportunity instead of DealLine

### 5. Documentation
- [x] `docs/PLATFORM_TRANCHE1.md` - Complete architecture guide

## ⏳ In Progress / Not Started

### Server Actions (Critical - need updating)
- [ ] `src/lib/actions/clients.ts` → rename to accounts.ts or update
- [ ] `src/lib/actions/billing.ts`
- [ ] `src/lib/actions/commissions.ts`
- [ ] `src/lib/actions/tasks.ts`
- [ ] `src/lib/actions/users.ts`
- [ ] `src/lib/actions/import.ts`
- [ ] `src/lib/actions/settings.ts`

### Helper Libraries (Need updating)
- [ ] `src/lib/scope.ts` - getScopedProductId needs org filtering
- [ ] `src/lib/audit.ts` - recordFieldChanges needs org
- [ ] `src/lib/email.ts` - may need updates
- [ ] `src/lib/utils.ts` - check for any db queries
- [ ] `src/lib/roles.ts` - likely OK but verify

### Server Components/Pages (Need updating)
- [ ] `src/app/(app)/dashboard/page.tsx`
- [ ] `src/app/(app)/leads/page.tsx`
- [ ] `src/app/(app)/leads/[id]/page.tsx`
- [ ] `src/app/(app)/clients/...` → update or create /accounts
- [ ] `src/app/(app)/pipeline/page.tsx`
- [ ] `src/app/(app)/facturation/page.tsx`
- [ ] `src/app/(app)/stats/page.tsx`
- [ ] `src/app/(app)/taches/page.tsx`
- [ ] `src/app/(app)/notifications/page.tsx`
- [ ] All admin pages

### Client Components (May need updating)
- [ ] Components that use old model names (Client, DealLine)
- [ ] Components that call server actions (already updated)
- [ ] Forms that submit to updated actions

### Build & Test
- [ ] Regenerate Prisma client
- [ ] Run `npm run build` - fix any TypeScript errors
- [ ] Run `npm run lint` - fix remaining linting issues
- [ ] Verify seed runs successfully
- [ ] Test login and org loading
- [ ] Smoke test critical flows

## Breaking Changes Summary

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

### Function Renames
- `assertClientAccess()` → `assertAccountAccess()` (legacy alias exists)
- `assertDealLineAccess()` → `assertOpportunityAccess()` (legacy alias exists)
- `clientVisibilityWhere()` → `accountVisibilityWhere()` (legacy alias exists)

### New Patterns
Every server action must:
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

## Estimated Remaining Work

### High Priority (Required for MVP)
1. Update remaining server actions (~6-8 files)
2. Update key pages (dashboard, leads list, lead detail)
3. Update helper libraries (scope, audit)
4. Fix build errors
5. Test end-to-end with seed data

### Medium Priority (Required for full Tranche 1)
1. Update all remaining pages
2. Update client components using old model names
3. Add custom field display in lead/account detail pages
4. Add module entitlement checks in relevant actions

### Low Priority (Nice to have, defer to Tranche 2)
1. Custom field editor UI (read-only for now)
2. Module config UI
3. Organization switcher (when user multi-org support added)

## Migration Path for Production

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
- Navigation still shows French labels (Clients vs Accounts)
- URLs keep legacy `/clients` paths for backward compat
- Custom fields stored but minimal display in UI

## Next Steps for Developer

1. Continue updating server actions (start with scope.ts, audit.ts)
2. Update dashboard and leads list pages
3. Run build and fix TypeScript errors iteratively
4. Test with seed data
5. Update PR description when build passes
