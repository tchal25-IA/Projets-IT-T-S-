import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { VITRINEFLASH_FIELDS, BOOKFLOW_FIELDS } from "../src/lib/utils";

const APPORTEUR_NAMES = [
  "Marie Lefèvre",
  "Thomas Girard",
  "Sophie Bernard",
  "Lucas Moreau",
  "Camille Rousseau",
  "Julien Petit",
  "Emma Laurent",
  "Nicolas Durand",
  "Léa Fontaine",
  "Hugo Mercier",
];

const COMMERCIAL_NAMES = [
  "Alice Martin",
  "Bob Dupont",
  "Clara Nguyen",
  "David Roux",
  "Emma Blanc",
  "François Leroy",
  "Gabrielle Simon",
  "Hugo Fabre",
  "Inès Garnier",
  "Jules Robin",
];

function emailFromName(prefix: string, index: number) {
  return `${prefix}${index}@ts-crm.fr`;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Clean up in dependency order
  await prisma.fieldHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.savedView.deleteMany();
  await prisma.quota.deleteMany();
  await prisma.leadInterest.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.customObject.deleteMany();
  await prisma.moduleEntitlement.deleteMany();
  await prisma.productOffering.deleteMany();
  await prisma.product.deleteMany();
  await prisma.commissionRule.deleteMany();
  await prisma.crmSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ============================================================================
  // CREATE DEFAULT ORGANIZATION
  // ============================================================================
  console.log("Creating default organization...");
  const org = await prisma.organization.create({
    data: {
      id: "org_ts_crm_default",
      name: "T&S CRM",
      slug: "ts-crm",
      active: true,
      settings: {
        timezone: "Europe/Paris",
        locale: "fr-FR",
        currency: "EUR",
      },
    },
  });
  console.log(`✓ Organization created: ${org.name} (${org.slug})`);

  // ============================================================================
  // MODULE ENTITLEMENTS (Feature Flags)
  // ============================================================================
  console.log("Setting up module entitlements...");
  await prisma.moduleEntitlement.createMany({
    data: [
      {
        organizationId: org.id,
        moduleType: "SALES",
        isEnabled: true,
        notes: "Core sales module (leads, opportunities, pipeline)",
      },
      {
        organizationId: org.id,
        moduleType: "CUSTOM_OBJECTS",
        isEnabled: true,
        quota: 10,
        notes: "Up to 10 custom objects",
      },
      {
        organizationId: org.id,
        moduleType: "ADVANCED_REPORTS",
        isEnabled: true,
        notes: "Advanced reporting and analytics",
      },
      {
        organizationId: org.id,
        moduleType: "API_ACCESS",
        isEnabled: true,
        notes: "REST API access",
      },
    ],
  });
  console.log("✓ Module entitlements configured");

  // ============================================================================
  // COMMISSION RULES
  // ============================================================================
  await prisma.commissionRule.createMany({
    data: [
      {
        organizationId: org.id,
        roleKey: "APPORTEUR",
        label: "Apporteur d'affaires",
        ratePercent: 10,
        sortOrder: 0,
      },
      {
        organizationId: org.id,
        roleKey: "COMMERCIAL",
        label: "Commercial (close)",
        ratePercent: 15,
        sortOrder: 1,
      },
    ],
  });

  // ============================================================================
  // USERS
  // ============================================================================
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const associe = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "associe@ts-crm.fr",
      fullName: "Thibaud Associé",
      role: "ASSOCIE",
      passwordHash,
    },
  });

  const dirVf = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "direction.vf@ts-crm.fr",
      fullName: "Direction VitrineFlash",
      role: "DIRECTION_VF",
      passwordHash,
    },
  });

  const dirBf = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: "direction.bookflow@ts-crm.fr",
      fullName: "Direction Bookflow",
      role: "DIRECTION_BOOKFLOW",
      passwordHash,
    },
  });

  const apporteurs = [];
  for (let i = 0; i < 10; i++) {
    apporteurs.push(
      await prisma.user.create({
        data: {
          organizationId: org.id,
          email: emailFromName("apporteur", i + 1),
          fullName: APPORTEUR_NAMES[i],
          role: "APPORTEUR",
          passwordHash,
        },
      })
    );
  }

  const commerciaux = [];
  for (let i = 0; i < 10; i++) {
    commerciaux.push(
      await prisma.user.create({
        data: {
          organizationId: org.id,
          email: emailFromName("commercial", i + 1),
          fullName: COMMERCIAL_NAMES[i],
          role: "COMMERCIAL",
          passwordHash,
        },
      })
    );
  }
  console.log(`✓ Created ${2 + apporteurs.length + commerciaux.length} users`);

  // ============================================================================
  // PRODUCTS & OFFERINGS
  // ============================================================================
  console.log("Creating products...");
  const vf = await prisma.product.create({
    data: {
      organizationId: org.id,
      slug: "vitrineflash",
      name: "VitrineFlash",
      description: "Création / reprise / modification de sites web (± maintenance)",
      fieldSchema: VITRINEFLASH_FIELDS,
      sortOrder: 0,
    },
  });

  const bookflow = await prisma.product.create({
    data: {
      organizationId: org.id,
      slug: "bookflow",
      name: "Bookflow",
      description: "Outil de prise de RDV moderne, complet et accessible (type Calendly)",
      fieldSchema: BOOKFLOW_FIELDS,
      sortOrder: 1,
    },
  });

  await prisma.productOffering.createMany({
    data: [
      {
        organizationId: org.id,
        productId: vf.id,
        name: "Site vitrine one-shot",
        code: "VF-SITE",
        kind: "ONE_SHOT",
        amountHt: 1500,
        billingPeriod: "NONE",
        sortOrder: 0,
      },
      {
        organizationId: org.id,
        productId: vf.id,
        name: "Maintenance Essentiel",
        code: "VF-MAINT-E",
        kind: "MAINTENANCE",
        amountHt: 49,
        billingPeriod: "MONTHLY",
        sortOrder: 1,
      },
      {
        organizationId: org.id,
        productId: vf.id,
        name: "Maintenance Pro",
        code: "VF-MAINT-P",
        kind: "MAINTENANCE",
        amountHt: 99,
        billingPeriod: "MONTHLY",
        sortOrder: 2,
      },
      {
        organizationId: org.id,
        productId: bookflow.id,
        name: "Bookflow Starter",
        code: "BF-START",
        kind: "SUBSCRIPTION",
        amountHt: 29,
        billingPeriod: "MONTHLY",
        sortOrder: 0,
      },
      {
        organizationId: org.id,
        productId: bookflow.id,
        name: "Bookflow Pro",
        code: "BF-PRO",
        kind: "SUBSCRIPTION",
        amountHt: 79,
        billingPeriod: "MONTHLY",
        sortOrder: 1,
      },
      {
        organizationId: org.id,
        productId: bookflow.id,
        name: "Bookflow Business",
        code: "BF-BIZ",
        kind: "SUBSCRIPTION",
        amountHt: 149,
        billingPeriod: "MONTHLY",
        sortOrder: 2,
      },
    ],
  });
  console.log("✓ Products and offerings created");

  // ============================================================================
  // CUSTOM FIELDS (Sample extensibility)
  // ============================================================================
  console.log("Creating sample custom fields...");
  const leadBudgetField = await prisma.customField.create({
    data: {
      organizationId: org.id,
      objectType: "Lead",
      apiName: "budget_estime__c",
      label: "Budget estimé",
      fieldType: "DECIMAL",
      isRequired: false,
      helpText: "Budget client pour le projet (€)",
      sortOrder: 0,
    },
  });

  const leadSecteurField = await prisma.customField.create({
    data: {
      organizationId: org.id,
      objectType: "Lead",
      apiName: "secteur_activite__c",
      label: "Secteur d'activité",
      fieldType: "PICKLIST",
      isRequired: false,
      picklistValues: [
        "Commerce / Retail",
        "Services B2B",
        "Santé / Bien-être",
        "Restauration",
        "Immobilier",
        "Industrie",
        "Tech / Digital",
        "Autre",
      ],
      sortOrder: 1,
    },
  });

  const accountCaField = await prisma.customField.create({
    data: {
      organizationId: org.id,
      objectType: "Account",
      apiName: "ca_annuel__c",
      label: "CA annuel estimé",
      fieldType: "NUMBER",
      isRequired: false,
      helpText: "Chiffre d'affaires annuel (€)",
      sortOrder: 0,
    },
  });
  console.log("✓ Sample custom fields created");

  // ============================================================================
  // SAMPLE LEADS
  // ============================================================================
  console.log("Creating sample leads...");
  const leadSpecs = [
    {
      companyName: "Dupont SAS",
      contactName: "Jean Dupont",
      email: "jean@dupont-sas.fr",
      phone: "06 12 34 56 78",
      status: "QUALIFIE" as const,
      productId: vf.id,
      apporteurId: apporteurs[0].id,
      commercialId: commerciaux[0].id,
      estimatedValue: 1840,
      customData: {
        besoin: "Reprise",
        urlActuelle: "https://dupont-sas.fr",
        maintenance: true,
        formuleMaintenance: "12 mois",
        budget: 2000,
      },
      opportunities: [
        { name: "Site vitrine reprise", amount: 1490, stage: "PROPOSAL" as const },
        {
          name: "Maintenance 12 mois",
          amount: 348,
          stage: "QUALIFICATION" as const,
          isRecurring: true,
        },
      ],
      customFields: {
        [leadBudgetField.id]: 2000,
        [leadSecteurField.id]: "Services B2B",
      },
    },
    {
      companyName: "Studio Lumière",
      contactName: "Léa Martin",
      email: "lea@studiolumiere.fr",
      phone: "06 98 76 54 32",
      status: "PROPOSITION" as const,
      productId: bookflow.id,
      apporteurId: apporteurs[1].id,
      commercialId: commerciaux[1].id,
      estimatedValue: 348,
      customData: {
        casUsage: "Salon",
        volumeRdv: 80,
        planCible: "Pro",
        demoEffectuee: true,
      },
      opportunities: [
        {
          name: "Abonnement Bookflow Pro (annuel)",
          amount: 348,
          stage: "NEGOTIATION" as const,
          isRecurring: true,
        },
      ],
      customFields: {
        [leadSecteurField.id]: "Santé / Bien-être",
      },
    },
    {
      companyName: "Boulangerie Pain d'Or",
      contactName: "Paul Bernard",
      email: "contact@paindor.fr",
      phone: "01 23 45 67 89",
      status: "NOUVEAU" as const,
      productId: vf.id,
      apporteurId: apporteurs[2].id,
      commercialId: commerciaux[2].id,
      nextCallAt: new Date(),
      customData: { besoin: "Création" },
      opportunities: [],
      customFields: {
        [leadSecteurField.id]: "Restauration",
      },
    },
    {
      companyName: "Coach Élan",
      contactName: "Sophie Roux",
      email: "sophie@coachelan.fr",
      status: "RDV_PLANIFIE" as const,
      productId: bookflow.id,
      apporteurId: apporteurs[3].id,
      commercialId: commerciaux[3].id,
      estimatedValue: 228,
      customData: { casUsage: "Coach", volumeRdv: 40, demoEffectuee: false },
      opportunities: [],
      customFields: {
        [leadBudgetField.id]: 300,
        [leadSecteurField.id]: "Santé / Bien-être",
      },
    },
  ];

  const createdLeads = [];
  for (const spec of leadSpecs) {
    const { opportunities, customFields, ...leadData } = spec;
    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        ...leadData,
        source: "Apporteur",
        customData: leadData.customData,
      },
    });
    createdLeads.push(lead);

    // Create opportunities
    if (opportunities.length) {
      await prisma.opportunity.createMany({
        data: opportunities.map((opp) => ({
          organizationId: org.id,
          leadId: lead.id,
          name: opp.name,
          amount: opp.amount,
          stage: opp.stage,
          isRecurring: opp.isRecurring ?? false,
          billingStatus: "DEVIS",
        })),
      });
    }

    // Store custom field values
    if (customFields) {
      for (const [fieldId, value] of Object.entries(customFields)) {
        if (typeof value === "number") {
          await prisma.customFieldValue.create({
            data: {
              organizationId: org.id,
              customFieldId: fieldId,
              recordType: "Lead",
              recordId: lead.id,
              valueNumber: value,
            },
          });
        } else if (typeof value === "string") {
          await prisma.customFieldValue.create({
            data: {
              organizationId: org.id,
              customFieldId: fieldId,
              recordType: "Lead",
              recordId: lead.id,
              valueText: value,
            },
          });
        }
      }
    }
  }

  // ============================================================================
  // CLOSED LEAD → ACCOUNT + CONTACT
  // ============================================================================
  console.log("Creating closed deals with accounts...");
  const closedLead = await prisma.lead.create({
    data: {
      organizationId: org.id,
      companyName: "Atelier Nord",
      contactName: "Nina Petit",
      email: "nina@ateliernord.fr",
      phone: "06 11 22 33 44",
      status: "CLOSE",
      source: "Apporteur",
      productId: vf.id,
      apporteurId: apporteurs[0].id,
      commercialId: commerciaux[0].id,
      estimatedValue: 1838,
      closedAt: new Date(),
      customData: {
        besoin: "Création",
        maintenance: true,
        formuleMaintenance: "12 mois",
        pages: "5 pages + formulaire contact",
      },
    },
  });

  const account = await prisma.account.create({
    data: {
      organizationId: org.id,
      companyName: "Atelier Nord",
      email: "nina@ateliernord.fr",
      phone: "06 11 22 33 44",
      website: "https://ateliernord.fr",
      status: "EN_LIVRAISON",
      notes: "Site vitrine 5 pages — livraison prévue sous 3 semaines",
      qualification: {
        besoin: "Création",
        maintenance: true,
        budget: 2000,
        score: "A",
        priorite: "Haute",
      },
    },
  });

  await prisma.contact.create({
    data: {
      organizationId: org.id,
      accountId: account.id,
      firstName: "Nina",
      lastName: "Petit",
      email: "nina@ateliernord.fr",
      phone: "06 11 22 33 44",
      title: "Gérante",
      isPrimary: true,
    },
  });

  // Custom field for account
  await prisma.customFieldValue.create({
    data: {
      organizationId: org.id,
      customFieldId: accountCaField.id,
      recordType: "Account",
      recordId: account.id,
      valueNumber: 250000,
    },
  });

  await prisma.lead.update({
    where: { id: closedLead.id },
    data: { accountId: account.id },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _oppsClosedLead = await prisma.opportunity.createMany({
    data: [
      {
        organizationId: org.id,
        leadId: closedLead.id,
        accountId: account.id,
        name: "Site vitrine 5 pages",
        amount: 1490,
        stage: "CLOSED_WON",
        closeDate: new Date(),
        billingStatus: "FACTURE",
      },
      {
        organizationId: org.id,
        leadId: closedLead.id,
        accountId: account.id,
        name: "Maintenance 12 mois",
        amount: 348,
        stage: "CLOSED_WON",
        closeDate: new Date(),
        billingStatus: "A_FACTURER",
        isRecurring: true,
      },
    ],
  });

  const ca = 1490 + 348;
  await prisma.commission.createMany({
    data: [
      {
        organizationId: org.id,
        accountId: account.id,
        leadId: closedLead.id,
        userId: apporteurs[0].id,
        label: "Commission apporteur",
        roleLabel: "Apporteur d'affaires",
        ratePercent: 10,
        amountHt: Math.round(ca * 0.1),
        status: "A_VERSER",
      },
      {
        organizationId: org.id,
        accountId: account.id,
        leadId: closedLead.id,
        userId: commerciaux[0].id,
        label: "Commission commercial (close)",
        roleLabel: "Commercial",
        ratePercent: 15,
        amountHt: Math.round(ca * 0.15),
        status: "A_VERSER",
      },
    ],
  });

  // Bookflow closed account
  const closedBf = await prisma.lead.create({
    data: {
      organizationId: org.id,
      companyName: "Cabinet Horizon",
      contactName: "Marc Olivier",
      email: "marc@cabinethorizon.fr",
      status: "CLOSE",
      source: "Import",
      productId: bookflow.id,
      apporteurId: apporteurs[4].id,
      commercialId: commerciaux[4].id,
      estimatedValue: 348,
      closedAt: new Date(),
      customData: {
        casUsage: "Cabinet",
        volumeRdv: 120,
        planCible: "Pro",
        demoEffectuee: true,
      },
    },
  });

  const accountBf = await prisma.account.create({
    data: {
      organizationId: org.id,
      companyName: "Cabinet Horizon",
      email: "marc@cabinethorizon.fr",
      status: "ACTIF",
      notes: "Abonnement Bookflow Pro actif",
      qualification: {
        casUsage: "Cabinet",
        planCible: "Pro",
        score: "B",
      },
    },
  });

  await prisma.contact.create({
    data: {
      organizationId: org.id,
      accountId: accountBf.id,
      firstName: "Marc",
      lastName: "Olivier",
      email: "marc@cabinethorizon.fr",
      isPrimary: true,
    },
  });

  await prisma.lead.update({
    where: { id: closedBf.id },
    data: { accountId: accountBf.id },
  });

  await prisma.opportunity.create({
    data: {
      organizationId: org.id,
      leadId: closedBf.id,
      accountId: accountBf.id,
      name: "Bookflow Pro — annuel",
      amount: 348,
      stage: "CLOSED_WON",
      closeDate: new Date(),
      billingStatus: "PAYE",
      isRecurring: true,
    },
  });

  await prisma.commission.createMany({
    data: [
      {
        organizationId: org.id,
        accountId: accountBf.id,
        leadId: closedBf.id,
        userId: apporteurs[4].id,
        label: "Commission apporteur",
        roleLabel: "Apporteur d'affaires",
        ratePercent: 10,
        amountHt: 35,
        status: "VERSEE",
      },
      {
        organizationId: org.id,
        accountId: accountBf.id,
        leadId: closedBf.id,
        userId: commerciaux[4].id,
        label: "Commission commercial (close)",
        roleLabel: "Commercial",
        ratePercent: 15,
        amountHt: 52,
        status: "VERSEE",
      },
    ],
  });

  // Extra assigned leads for other commerciaux
  for (let i = 5; i < 10; i++) {
    await prisma.lead.create({
      data: {
        organizationId: org.id,
        companyName: `Prospect ${i + 1} SARL`,
        contactName: `Contact ${i + 1}`,
        email: `prospect${i + 1}@exemple.fr`,
        phone: `06 00 00 00 ${10 + i}`,
        status: i % 2 === 0 ? "NOUVEAU" : "CONTACTE",
        source: "Import CSV",
        productId: i % 2 === 0 ? vf.id : bookflow.id,
        apporteurId: apporteurs[i].id,
        commercialId: commerciaux[i].id,
        nextCallAt: new Date(Date.now() + i * 3600_000),
        customData: i % 2 === 0 ? { besoin: "Création" } : { casUsage: "Freelance" },
      },
    });
  }
  console.log(`✓ Created ${createdLeads.length + 7} leads and 2 accounts`);

  // ============================================================================
  // ACTIVITIES
  // ============================================================================
  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id,
        leadId: createdLeads[0].id,
        userId: commerciaux[0].id,
        type: "APPEL",
        note: "Premier contact — intéressé par une reprise WordPress.",
      },
      {
        organizationId: org.id,
        leadId: createdLeads[0].id,
        userId: commerciaux[0].id,
        type: "RDV",
        note: "RDV démo posé.",
      },
      {
        organizationId: org.id,
        leadId: closedLead.id,
        userId: commerciaux[0].id,
        type: "STATUT",
        note: "Deal closé — account créé avec opportunités et commissions.",
      },
      {
        organizationId: org.id,
        leadId: closedBf.id,
        userId: commerciaux[4].id,
        type: "STATUT",
        note: "Bookflow Pro signé — account actif.",
      },
    ],
  });

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: associe.id,
        title: "Bienvenue Associé",
        body: "Vous avez accès à l'ensemble du CRM (VitrineFlash + Bookflow).",
        link: "/dashboard",
      },
      {
        organizationId: org.id,
        userId: dirVf.id,
        title: "Pilotage VitrineFlash",
        body: "Votre vue est filtrée sur le produit VitrineFlash.",
        link: "/dashboard",
      },
      {
        organizationId: org.id,
        userId: dirBf.id,
        title: "Pilotage Bookflow",
        body: "Votre vue est filtrée sur le produit Bookflow.",
        link: "/dashboard",
      },
      {
        organizationId: org.id,
        userId: commerciaux[0].id,
        title: "Leads à appeler",
        body: "Des leads vous sont attribués dans la file d'appels.",
        link: "/appels",
      },
      {
        organizationId: org.id,
        userId: apporteurs[0].id,
        title: "Lead converti",
        body: "Votre apport Atelier Nord est passé en account.",
        link: `/accounts/${account.id}`,
      },
    ],
  });

  // ============================================================================
  // LEAD INTERESTS (Multi-produits)
  // ============================================================================
  await prisma.leadInterest.createMany({
    data: [
      { organizationId: org.id, leadId: createdLeads[0].id, productSlug: "vitrineflash" },
      { organizationId: org.id, leadId: createdLeads[0].id, productSlug: "bookflow" },
      { organizationId: org.id, leadId: createdLeads[1].id, productSlug: "bookflow" },
      { organizationId: org.id, leadId: closedLead.id, productSlug: "vitrineflash" },
      { organizationId: org.id, leadId: closedBf.id, productSlug: "bookflow" },
    ],
  });

  // ============================================================================
  // QUOTAS
  // ============================================================================
  const yearMonth = new Date().toISOString().slice(0, 7);
  await prisma.quota.createMany({
    data: commerciaux.slice(0, 5).map((c) => ({
      organizationId: org.id,
      userId: c.id,
      yearMonth,
      targetCloses: 4,
      targetCa: 8000,
    })),
  });

  // ============================================================================
  // TASKS
  // ============================================================================
  await prisma.task.createMany({
    data: [
      {
        organizationId: org.id,
        title: "Relancer Dupont SAS — devis reprise",
        userId: commerciaux[0].id,
        leadId: createdLeads[0].id,
        dueAt: new Date(),
        priority: "HIGH",
      },
      {
        organizationId: org.id,
        title: "Préparer démo Bookflow Studio Lumière",
        userId: commerciaux[1].id,
        leadId: createdLeads[1].id,
        dueAt: new Date(Date.now() + 2 * 86400_000),
        priority: "MEDIUM",
      },
      {
        organizationId: org.id,
        title: "Appeler Boulangerie Pain d'Or",
        userId: commerciaux[2].id,
        leadId: createdLeads[2].id,
        dueAt: new Date(Date.now() - 86400_000),
        priority: "HIGH",
      },
      {
        organizationId: org.id,
        title: "Suivi livraison Atelier Nord",
        userId: commerciaux[0].id,
        accountId: account.id,
        leadId: closedLead.id,
        dueAt: new Date(Date.now() + 5 * 86400_000),
        priority: "MEDIUM",
      },
    ],
  });

  // ============================================================================
  // SAVED VIEWS
  // ============================================================================
  await prisma.savedView.create({
    data: {
      organizationId: org.id,
      name: "Relances urgentes (partagée)",
      entity: "LEAD",
      isShared: true,
      userId: associe.id,
      filters: { status: "CONTACTE", overdue: true },
    },
  });

  // ============================================================================
  // CRM SETTINGS
  // ============================================================================
  await prisma.crmSetting.createMany({
    data: [
      {
        organizationId: org.id,
        key: "lead_sources",
        value: ["Apporteur", "Import CSV", "Site web", "Prospection", "Référence", "Autre"],
      },
      {
        organizationId: org.id,
        key: "company_info",
        value: {
          name: "T&S Digital",
          siret: "123 456 789 00012",
          address: "12 Rue de la Paix, 75002 Paris",
          phone: "01 23 45 67 89",
          email: "contact@ts-digital.fr",
        },
      },
    ],
  });

  console.log("\n========================================");
  console.log("✅ Seed completed successfully!");
  console.log("========================================");
  console.log("\n📋 Default Organization:");
  console.log(`   Name: ${org.name}`);
  console.log(`   Slug: ${org.slug}`);
  console.log(`   ID: ${org.id}`);
  console.log("\n🔑 Demo accounts (password: demo1234):");
  console.log("   • associe@ts-crm.fr");
  console.log("   • direction.vf@ts-crm.fr");
  console.log("   • direction.bookflow@ts-crm.fr");
  console.log("   • apporteur1@ts-crm.fr … apporteur10@ts-crm.fr");
  console.log("   • commercial1@ts-crm.fr … commercial10@ts-crm.fr");
  console.log("\n📊 Data summary:");
  console.log(`   • ${2 + apporteurs.length + commerciaux.length} users`);
  console.log(`   • ${createdLeads.length + 7} leads`);
  console.log(`   • 2 accounts (Atelier Nord, Cabinet Horizon)`);
  console.log("   • 3 sample custom fields (extensibility demo)");
  console.log("   • 4 module entitlements");
  console.log("\n========================================\n");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
