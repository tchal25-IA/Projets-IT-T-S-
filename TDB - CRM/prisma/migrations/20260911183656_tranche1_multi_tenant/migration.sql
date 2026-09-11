-- Tranche 1: Multi-tenant Platform Migration
-- This migration introduces Organization (tenant) concept and extensibility layer

-- ============================================================================
-- STEP 1: Create new enums
-- ============================================================================

-- Account status (renamed from ClientStatus)
CREATE TYPE "AccountStatus" AS ENUM ('EN_LIVRAISON', 'ACTIF', 'MAINTENANCE');

-- Opportunity stages (new Salesforce-aligned)
CREATE TYPE "OpportunityStage" AS ENUM ('QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

-- Update SavedViewEntity to include new entities
ALTER TYPE "SavedViewEntity" ADD VALUE IF NOT EXISTS 'ACCOUNT';
ALTER TYPE "SavedViewEntity" ADD VALUE IF NOT EXISTS 'OPPORTUNITY';

-- Metadata enums
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'DATE', 'DATETIME', 'BOOLEAN', 'PICKLIST', 'MULTIPICKLIST', 'REFERENCE', 'URL', 'EMAIL', 'PHONE');

CREATE TYPE "ModuleType" AS ENUM ('SALES', 'MARKETING', 'SERVICE', 'CUSTOM_OBJECTS', 'ADVANCED_REPORTS', 'API_ACCESS', 'INTEGRATIONS');

-- ============================================================================
-- STEP 2: Create Organization table (tenant core)
-- ============================================================================

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_active_idx" ON "Organization"("active");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- ============================================================================
-- STEP 3: Create metadata & extensibility tables
-- ============================================================================

CREATE TABLE "CustomObject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pluralLabel" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomObject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomObject_organizationId_apiName_key" ON "CustomObject"("organizationId", "apiName");
CREATE INDEX "CustomObject_organizationId_isActive_idx" ON "CustomObject"("organizationId", "isActive");

CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "helpText" TEXT,
    "picklistValues" JSONB,
    "referenceTo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customObjectId" TEXT,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomField_organizationId_objectType_apiName_key" ON "CustomField"("organizationId", "objectType", "apiName");
CREATE INDEX "CustomField_organizationId_objectType_isActive_idx" ON "CustomField"("organizationId", "objectType", "isActive");

CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),
    "valueBoolean" BOOLEAN,
    "valueJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomFieldValue_customFieldId_recordId_key" ON "CustomFieldValue"("customFieldId", "recordId");
CREATE INDEX "CustomFieldValue_organizationId_recordType_recordId_idx" ON "CustomFieldValue"("organizationId", "recordType", "recordId");
CREATE INDEX "CustomFieldValue_customFieldId_recordId_idx" ON "CustomFieldValue"("customFieldId", "recordId");

CREATE TABLE "ModuleEntitlement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleType" "ModuleType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quota" INTEGER,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ModuleEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModuleEntitlement_organizationId_moduleType_key" ON "ModuleEntitlement"("organizationId", "moduleType");
CREATE INDEX "ModuleEntitlement_organizationId_isEnabled_idx" ON "ModuleEntitlement"("organizationId", "isEnabled");

-- ============================================================================
-- STEP 4: Create Contact table (new entity, separate from Account)
-- ============================================================================

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Contact_organizationId_accountId_idx" ON "Contact"("organizationId", "accountId");
CREATE INDEX "Contact_organizationId_email_idx" ON "Contact"("organizationId", "email");

-- ============================================================================
-- STEP 5: Rename Client → Account
-- ============================================================================

ALTER TABLE "Client" RENAME TO "Account";
ALTER TABLE "Account" RENAME COLUMN "contactName" TO "_legacy_contactName";
ALTER TABLE "Account" ADD COLUMN "website" TEXT;
ALTER INDEX "Client_pkey" RENAME TO "Account_pkey";

-- ============================================================================
-- STEP 6: Rename DealLine → Opportunity and add new fields
-- ============================================================================

ALTER TABLE "DealLine" RENAME TO "Opportunity";
ALTER TABLE "Opportunity" RENAME COLUMN "label" TO "name";
ALTER TABLE "Opportunity" ADD COLUMN "stage" "OpportunityStage" DEFAULT 'QUALIFICATION';
ALTER TABLE "Opportunity" ADD COLUMN "closeDate" TIMESTAMP(3);
ALTER TABLE "Opportunity" ADD COLUMN "probability" INTEGER DEFAULT 0;
ALTER TABLE "Opportunity" ADD COLUMN "description" TEXT;
ALTER TABLE "Opportunity" RENAME COLUMN "amountHt" TO "amount";
ALTER TABLE "Opportunity" RENAME COLUMN "clientId" TO "accountId";

-- Update stage based on billingStatus (backward compat mapping)
UPDATE "Opportunity" SET "stage" = 'CLOSED_WON' WHERE "billingStatus" = 'PAYE';
UPDATE "Opportunity" SET "stage" = 'NEGOTIATION' WHERE "billingStatus" = 'FACTURE';
UPDATE "Opportunity" SET "stage" = 'PROPOSAL' WHERE "billingStatus" = 'A_FACTURER';
UPDATE "Opportunity" SET "stage" = 'QUALIFICATION' WHERE "billingStatus" = 'DEVIS';

ALTER INDEX "DealLine_pkey" RENAME TO "Opportunity_pkey";

-- ============================================================================
-- STEP 7: Add organizationId to all existing tables (nullable first)
-- ============================================================================

-- Users
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;

-- CRM Entities
ALTER TABLE "Lead" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Account" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Commission" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Task" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "LeadInterest" ADD COLUMN "organizationId" TEXT;

-- Support tables
ALTER TABLE "SavedView" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "FieldHistory" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Quota" ADD COLUMN "organizationId" TEXT;

-- Product catalog
ALTER TABLE "Product" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ProductOffering" ADD COLUMN "organizationId" TEXT;

-- Config tables
ALTER TABLE "CommissionRule" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "CrmSetting" ADD COLUMN "organizationId" TEXT;

-- ============================================================================
-- STEP 8: Create default organization and migrate existing data
-- ============================================================================

INSERT INTO "Organization" ("id", "name", "slug", "active", "settings", "updatedAt")
VALUES (
    'org_ts_crm_default',
    'T&S CRM',
    'ts-crm',
    true,
    '{"timezone":"Europe/Paris","locale":"fr-FR","currency":"EUR"}',
    CURRENT_TIMESTAMP
);

-- Link all existing data to default org
UPDATE "User" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Lead" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Account" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Opportunity" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Activity" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Commission" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Task" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Notification" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "LeadInterest" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "SavedView" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "FieldHistory" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Quota" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "Product" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "ProductOffering" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "CommissionRule" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;
UPDATE "CrmSetting" SET "organizationId" = 'org_ts_crm_default' WHERE "organizationId" IS NULL;

-- ============================================================================
-- STEP 9: Make organizationId NOT NULL and add foreign keys
-- ============================================================================

ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Opportunity" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Activity" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Commission" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "LeadInterest" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "SavedView" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "FieldHistory" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Quota" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ProductOffering" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "CommissionRule" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "CrmSetting" ALTER COLUMN "organizationId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadInterest" ADD CONSTRAINT "LeadInterest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldHistory" ADD CONSTRAINT "FieldHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductOffering" ADD CONSTRAINT "ProductOffering_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmSetting" ADD CONSTRAINT "CrmSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK for new tables
ALTER TABLE "CustomObject" ADD CONSTRAINT "CustomObject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_customObjectId_fkey" FOREIGN KEY ("customObjectId") REFERENCES "CustomObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModuleEntitlement" ADD CONSTRAINT "ModuleEntitlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- STEP 10: Update existing indexes to include organizationId
-- ============================================================================

-- Drop old indexes
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "Lead_status_idx";
DROP INDEX IF EXISTS "Lead_productId_idx";
DROP INDEX IF EXISTS "Lead_commercialId_idx";
DROP INDEX IF EXISTS "Lead_apporteurId_idx";
DROP INDEX IF EXISTS "Lead_nextCallAt_idx";
DROP INDEX IF EXISTS "Lead_email_idx";
DROP INDEX IF EXISTS "Lead_website_idx";
DROP INDEX IF EXISTS "Opportunity_billingStatus_idx";
DROP INDEX IF EXISTS "Commission_clientId_idx";
DROP INDEX IF EXISTS "Commission_userId_idx";
DROP INDEX IF EXISTS "Task_userId_doneAt_idx";
DROP INDEX IF EXISTS "Task_dueAt_idx";
DROP INDEX IF EXISTS "Notification_userId_read_idx";
DROP INDEX IF EXISTS "SavedView_userId_entity_idx";
DROP INDEX IF EXISTS "FieldHistory_entity_entityId_createdAt_idx";
DROP INDEX IF EXISTS "Quota_userId_yearMonth_key";
DROP INDEX IF EXISTS "Quota_yearMonth_idx";
DROP INDEX IF EXISTS "Product_slug_key";
DROP INDEX IF EXISTS "ProductOffering_productId_active_idx";
DROP INDEX IF EXISTS "CommissionRule_roleKey_key";
DROP INDEX IF EXISTS "CrmSetting_key_key";
DROP INDEX IF EXISTS "LeadInterest_productSlug_idx";

-- Re-create with org scoping
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_organizationId_active_idx" ON "User"("organizationId", "active");
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");

CREATE INDEX "Lead_organizationId_status_idx" ON "Lead"("organizationId", "status");
CREATE INDEX "Lead_organizationId_productId_idx" ON "Lead"("organizationId", "productId");
CREATE INDEX "Lead_organizationId_commercialId_idx" ON "Lead"("organizationId", "commercialId");
CREATE INDEX "Lead_organizationId_apporteurId_idx" ON "Lead"("organizationId", "apporteurId");
CREATE INDEX "Lead_organizationId_nextCallAt_idx" ON "Lead"("organizationId", "nextCallAt");
CREATE INDEX "Lead_organizationId_email_idx" ON "Lead"("organizationId", "email");
CREATE INDEX "Lead_organizationId_website_idx" ON "Lead"("organizationId", "website");

CREATE INDEX "Account_organizationId_status_idx" ON "Account"("organizationId", "status");
CREATE INDEX "Account_organizationId_companyName_idx" ON "Account"("organizationId", "companyName");

CREATE INDEX "Opportunity_organizationId_stage_idx" ON "Opportunity"("organizationId", "stage");
CREATE INDEX "Opportunity_organizationId_accountId_idx" ON "Opportunity"("organizationId", "accountId");
CREATE INDEX "Opportunity_organizationId_leadId_idx" ON "Opportunity"("organizationId", "leadId");
CREATE INDEX "Opportunity_organizationId_closeDate_idx" ON "Opportunity"("organizationId", "closeDate");

CREATE INDEX "Activity_organizationId_leadId_idx" ON "Activity"("organizationId", "leadId");
CREATE INDEX "Activity_organizationId_createdAt_idx" ON "Activity"("organizationId", "createdAt");

CREATE INDEX "Commission_organizationId_accountId_idx" ON "Commission"("organizationId", "accountId");
CREATE INDEX "Commission_organizationId_userId_idx" ON "Commission"("organizationId", "userId");

CREATE INDEX "Task_organizationId_userId_doneAt_idx" ON "Task"("organizationId", "userId", "doneAt");
CREATE INDEX "Task_organizationId_dueAt_idx" ON "Task"("organizationId", "dueAt");

CREATE INDEX "Notification_organizationId_userId_read_idx" ON "Notification"("organizationId", "userId", "read");

CREATE INDEX "SavedView_organizationId_userId_entity_idx" ON "SavedView"("organizationId", "userId", "entity");

CREATE INDEX "FieldHistory_organizationId_entity_entityId_createdAt_idx" ON "FieldHistory"("organizationId", "entity", "entityId", "createdAt");

CREATE UNIQUE INDEX "Quota_organizationId_userId_yearMonth_key" ON "Quota"("organizationId", "userId", "yearMonth");
CREATE INDEX "Quota_organizationId_yearMonth_idx" ON "Quota"("organizationId", "yearMonth");

CREATE UNIQUE INDEX "Product_organizationId_slug_key" ON "Product"("organizationId", "slug");
CREATE INDEX "Product_organizationId_active_idx" ON "Product"("organizationId", "active");

CREATE INDEX "ProductOffering_organizationId_productId_active_idx" ON "ProductOffering"("organizationId", "productId", "active");

CREATE UNIQUE INDEX "CommissionRule_organizationId_roleKey_key" ON "CommissionRule"("organizationId", "roleKey");

CREATE UNIQUE INDEX "CrmSetting_organizationId_key_key" ON "CrmSetting"("organizationId", "key");
CREATE INDEX "CrmSetting_organizationId_idx" ON "CrmSetting"("organizationId");

CREATE INDEX "LeadInterest_organizationId_productSlug_idx" ON "LeadInterest"("organizationId", "productSlug");

-- ============================================================================
-- STEP 11: Update Lead.clientId → Lead.accountId
-- ============================================================================

ALTER TABLE "Lead" RENAME COLUMN "clientId" TO "accountId";
ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_clientId_fkey";
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- STEP 12: Update Commission.clientId → Commission.accountId
-- ============================================================================

ALTER TABLE "Commission" RENAME COLUMN "clientId" TO "accountId";
ALTER TABLE "Commission" DROP CONSTRAINT IF EXISTS "Commission_clientId_fkey";
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- STEP 13: Update Task.clientId → Task.accountId
-- ============================================================================

ALTER TABLE "Task" RENAME COLUMN "clientId" TO "accountId";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_clientId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- FINAL: Migration complete
-- ============================================================================
