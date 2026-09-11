# Platform Tranche 1 : Multi-tenant & Extensibilité

## Vue d'ensemble

Transformation de TDB CRM mono-tenant vers une plateforme multi-entreprise modulaire inspirée de Salesforce, tout en conservant la compatibilité avec le code existant.

## Architecture Tranche 1

### 1. Modèle Multi-tenant

#### Organization (Tenant)
Entité centrale qui scope toutes les données business :

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique  // URL-safe identifier
  domain      String?              // Future: custom domain
  settings    Json     @default("{}")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users              User[]
  leads              Lead[]
  accounts           Account[]  // Renommé de Client
  opportunities      Opportunity[]  // Renommé de DealLine
  activities         Activity[]
  customObjects      CustomObject[]
  customFieldValues  CustomFieldValue[]
  moduleEntitlements ModuleEntitlement[]
  // ... autres relations
}
```

#### Isolation des données
**Principe** : Toutes les requêtes Prisma DOIVENT filtrer par `organizationId`.

**Implémentation** :
- Middleware Prisma pour injection automatique du filtre org
- Helper `requireOrg()` dans server actions
- Session enrichie avec `organizationId`

### 2. Évolution du modèle de données

#### Alignement Salesforce

| Actuel | Tranche 1 | Salesforce équivalent | Notes |
|--------|-----------|----------------------|-------|
| Lead | Lead | Lead | Conservé, ajout orgId |
| Client | Account | Account | Renommage progressif |
| DealLine | Opportunity | Opportunity | Nouveau nom |
| Activity | Activity | Activity/Task/Event | Conservé |
| Commission | Commission | N/A | Spécifique métier |
| Product | Product | N/A | Devient paramétrable |

**Labels UI** : Restent en français, mapping interne seulement.

#### Schema évolutions principales

**User** :
```prisma
model User {
  // ... champs existants
  organizationId String
  organization   Organization @relation(...)
  
  // Future: multi-org membership
  // memberships OrganizationMembership[]
}
```

**Account** (ex-Client) :
```prisma
model Account {
  id             String  @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  // Champs métier conservés
  companyName String
  // ... autres champs
  
  // Relations ajustées
  leads         Lead[]
  opportunities Opportunity[]
  contacts      Contact[]  // Nouveau
}
```

**Opportunity** (ex-DealLine) :
```prisma
model Opportunity {
  id             String  @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  name           String
  amount         Float
  stage          OpportunityStage
  closeDate      DateTime?
  
  accountId      String?
  account        Account? @relation(...)
  leadId         String?
  lead           Lead? @relation(...)
}

enum OpportunityStage {
  QUALIFICATION
  PROPOSAL
  NEGOTIATION
  CLOSED_WON
  CLOSED_LOST
}
```

**Contact** (nouveau) :
```prisma
model Contact {
  id             String @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  firstName      String?
  lastName       String
  email          String?
  phone          String?
  title          String?  // Fonction
  
  accountId      String?
  account        Account? @relation(...)
}
```

### 3. Couche de métadonnées (extensibilité)

#### CustomObject
Permet de créer des objets personnalisés par tenant :

```prisma
model CustomObject {
  id             String  @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  name           String  // "Projet", "Contrat", etc.
  apiName        String  // "custom_projet__c"
  label          String  // Label UI français
  pluralLabel    String?
  description    String?
  
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  customFields   CustomField[]
  
  @@unique([organizationId, apiName])
  @@index([organizationId, isActive])
}
```

#### CustomField
Champs personnalisés sur objets standard OU custom :

```prisma
enum FieldType {
  TEXT
  TEXTAREA
  NUMBER
  DECIMAL
  DATE
  DATETIME
  BOOLEAN
  PICKLIST
  MULTIPICKLIST
  REFERENCE  // Relation vers autre objet
  URL
  EMAIL
  PHONE
}

model CustomField {
  id             String    @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  // Définition
  objectType     String    // "Lead", "Account", "custom_projet__c"
  apiName        String    // "budget__c", "secteur__c"
  label          String    // "Budget estimé", "Secteur d'activité"
  fieldType      FieldType
  
  // Options
  isRequired     Boolean   @default(false)
  defaultValue   String?
  helpText       String?
  
  // Pour PICKLIST
  picklistValues Json?     // ["Option A", "Option B"]
  
  // Pour REFERENCE
  referenceTo    String?   // "Account", "Contact"
  
  // Métadonnées
  isActive       Boolean   @default(true)
  sortOrder      Int       @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  values         CustomFieldValue[]
  
  @@unique([organizationId, objectType, apiName])
  @@index([organizationId, objectType, isActive])
}
```

#### CustomFieldValue
Stockage EAV des valeurs :

```prisma
model CustomFieldValue {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  customFieldId  String
  customField    CustomField @relation(...)
  
  recordType     String   // "Lead", "Account", "custom_projet__c"
  recordId       String   // ID du record
  
  // Stockage polymorphe
  valueText      String?
  valueNumber    Float?
  valueDate      DateTime?
  valueBoolean   Boolean?
  valueJson      Json?    // Pour MULTIPICKLIST, complex data
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([customFieldId, recordId])
  @@index([organizationId, recordType, recordId])
  @@index([customFieldId, recordId])
}
```

### 4. Module Entitlements (Feature Flags)

```prisma
enum ModuleType {
  SALES          // Pipeline, Opportunities
  MARKETING      // Campagnes (Tranche 2+)
  SERVICE        // Support tickets (Tranche 2+)
  CUSTOM_OBJECTS // Objets personnalisés
  ADVANCED_REPORTS
  API_ACCESS
  INTEGRATIONS
}

model ModuleEntitlement {
  id             String     @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  moduleType     ModuleType
  isEnabled      Boolean    @default(true)
  quota          Int?       // Ex: max custom objects
  
  // Métadonnées
  enabledAt      DateTime   @default(now())
  expiresAt      DateTime?
  notes          String?
  
  @@unique([organizationId, moduleType])
  @@index([organizationId, isEnabled])
}
```

## Migration & Compatibilité

### Phase 1 : Ajout des structures
1. Créer `Organization`, `CustomObject`, `CustomField`, `CustomFieldValue`, `ModuleEntitlement`
2. Ajouter `organizationId` à tous les modèles existants (nullable)
3. Créer organisation par défaut : "T&S CRM"

### Phase 2 : Migration des données
```sql
-- Créer org par défaut
INSERT INTO "Organization" (id, name, slug, active)
VALUES ('org_default', 'T&S CRM', 'ts-crm', true);

-- Lier tous les users
UPDATE "User" SET "organizationId" = 'org_default';

-- Lier toutes les entités business
UPDATE "Lead" SET "organizationId" = 'org_default';
UPDATE "Client" SET "organizationId" = 'org_default';
-- etc.
```

### Phase 3 : Rendre obligatoire
1. Migration pour rendre `organizationId` NOT NULL
2. Ajouter contraintes FK
3. Ajouter indexes

### Compatibilité code existant

**Helper tenant-aware** :
```typescript
// src/lib/tenant.ts
export async function requireOrg(session?: Session): Promise<string> {
  const s = session ?? await auth();
  if (!s?.user?.organizationId) throw new Error("No organization");
  return s.user.organizationId;
}

export function orgFilter(organizationId: string) {
  return { organizationId };
}
```

**Pattern d'usage** :
```typescript
// Avant
const leads = await prisma.lead.findMany({ where: { status: "NOUVEAU" } });

// Après
const orgId = await requireOrg();
const leads = await prisma.lead.findMany({ 
  where: { 
    organizationId: orgId,
    status: "NOUVEAU" 
  } 
});
```

## Auth & Roles

### Session enrichie
```typescript
// src/lib/auth.ts
interface Session {
  user: {
    id: string;
    email: string;
    role: Role;
    fullName: string;
    organizationId: string;      // Nouveau
    organizationSlug: string;    // Nouveau
  }
}
```

### Roles multi-tenant
Les rôles existants (ASSOCIE, COMMERCIAL, etc.) restent mais scope par org.

**Future Tranche 2+** : Permission sets personnalisables par org.

## Interfaces UI (Tranche 1)

### Navigation
- Header affiche org name (lecture seule pour l'instant)
- URLs restent identiques : `/leads`, `/clients`, etc.
- Labels français maintenus : "Leads", "Comptes", "Opportunités"

### Formulaires
- Pas d'UI admin des custom fields encore
- Custom fields existants (via Product.fieldSchema) migrés vers CustomField progressivement
- Affichage custom fields dans détails lead/account (lecture seule pour l'instant)

## Ce qui N'EST PAS dans Tranche 1

❌ **UI de configuration admin** :
- Création/édition custom objects via UI
- Création/édition custom fields via UI
- Gestion module entitlements via UI

❌ **Multi-org switcher** :
- Users restent liés à 1 org
- Pas de menu de switch org

❌ **Packs sectoriels** :
- Templates pré-configurés par industrie (Tranche 2+)

❌ **Features Sales avancées** :
- Forecasting
- Territory management
- Quotes & CPQ

❌ **Marketplace** :
- Installation de modules tiers

## Roadmap Tranche 2+ (pour référence)

### Tranche 2 : Admin & Configuration
- UI complète de gestion custom objects/fields
- Permission sets éditables
- Module entitlements avec UI
- Multi-org membership (user appartient à plusieurs orgs)
- Org switcher dans header

### Tranche 3 : Packs sectoriels
- Templates par industrie (Immobilier, Tech, Consulting, etc.)
- Configuration wizard first-time
- Import/Export configurations

### Tranche 4 : Advanced Sales
- Sales forecasting
- Territory management
- Quotes & CPQ
- Contract management

## Testing & Validation

### Tests Tranche 1
- [ ] Seed crée org par défaut
- [ ] User login charge organizationId dans session
- [ ] Toutes les requêtes filtrent par org
- [ ] Isolation : User org A ne voit pas data org B
- [ ] Custom fields peuvent être créés via seed
- [ ] Custom field values stockées et récupérées
- [ ] Module entitlements créés par défaut

### Scripts utiles
```bash
# Créer nouvelle org (via seed ou console)
npm run db:studio

# Vérifier isolation
npm run db:seed -- --check-isolation

# Migration
npm run db:migrate:dev
```

## Fichiers clés

### Schéma
- `prisma/schema.prisma` : Tous les models
- `prisma/seed.ts` : Création org par défaut + sample data

### Bibliothèques
- `src/lib/tenant.ts` : Helpers org/tenant
- `src/lib/custom-fields.ts` : Gestion custom fields
- `src/lib/metadata.ts` : CustomObject queries

### Auth
- `src/lib/auth.ts` : Session enrichie avec orgId

### Actions
- `src/lib/actions/*.ts` : Toutes doivent utiliser `requireOrg()`

## Notes d'implémentation

### Performance
- Index sur tous les `(organizationId, ...)` composites
- CustomFieldValue peut croître rapidement → surveiller performances
- Considérer partitioning par org si > 100 tenants

### Sécurité
- JAMAIS de query sans filtre org (sauf super-admin Tranche 2+)
- Row-level security via Prisma middleware en secours
- Validation stricte des custom field values

### Évolutivité
- CustomFieldValue EAV flexible mais limite ~50 custom fields/object
- Si croissance forte : considérer JSONB ou tables dynamiques
