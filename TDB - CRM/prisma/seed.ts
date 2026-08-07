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

  await prisma.fieldHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.savedView.deleteMany();
  await prisma.quota.deleteMany();
  await prisma.leadInterest.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.dealLine.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const associe = await prisma.user.create({
    data: {
      email: "associe@ts-crm.fr",
      fullName: "Thibaud Associé",
      role: "ASSOCIE",
      passwordHash,
    },
  });

  const dirVf = await prisma.user.create({
    data: {
      email: "direction.vf@ts-crm.fr",
      fullName: "Direction VitrineFlash",
      role: "DIRECTION_VF",
      passwordHash,
    },
  });

  const dirBf = await prisma.user.create({
    data: {
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
          email: emailFromName("commercial", i + 1),
          fullName: COMMERCIAL_NAMES[i],
          role: "COMMERCIAL",
          passwordHash,
        },
      })
    );
  }

  const vf = await prisma.product.create({
    data: {
      slug: "vitrineflash",
      name: "VitrineFlash",
      description: "Création / reprise / modification de sites web (± maintenance)",
      fieldSchema: VITRINEFLASH_FIELDS,
    },
  });

  const bookflow = await prisma.product.create({
    data: {
      slug: "bookflow",
      name: "Bookflow",
      description: "Outil de prise de RDV moderne, complet et accessible (type Calendly)",
      fieldSchema: BOOKFLOW_FIELDS,
    },
  });

  // Sample leads across apporteurs / commerciaux / products
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
      dealLines: [
        { label: "Site vitrine reprise", amountHt: 1490 },
        { label: "Maintenance 12 mois", amountHt: 348, isRecurring: true },
      ],
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
      dealLines: [
        { label: "Abonnement Bookflow Pro (annuel)", amountHt: 348, isRecurring: true },
      ],
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
      dealLines: [],
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
      dealLines: [],
    },
  ];

  const createdLeads = [];
  for (const spec of leadSpecs) {
    const { dealLines, ...leadData } = spec;
    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        source: "Apporteur",
        customData: leadData.customData,
      },
    });
    createdLeads.push(lead);
    if (dealLines.length) {
      await prisma.dealLine.createMany({
        data: dealLines.map((d) => ({
          leadId: lead.id,
          label: d.label,
          amountHt: d.amountHt,
          billingStatus: "DEVIS" as const,
          isRecurring: d.isRecurring ?? false,
        })),
      });
    }
  }

  // Closed client with full fiche (commissions, services, actors)
  const closedLead = await prisma.lead.create({
    data: {
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

  const client = await prisma.client.create({
    data: {
      companyName: "Atelier Nord",
      contactName: "Nina Petit",
      email: "nina@ateliernord.fr",
      phone: "06 11 22 33 44",
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

  await prisma.lead.update({
    where: { id: closedLead.id },
    data: { clientId: client.id },
  });

  await prisma.dealLine.createMany({
    data: [
      {
        leadId: closedLead.id,
        clientId: client.id,
        label: "Site vitrine 5 pages",
        amountHt: 1490,
        billingStatus: "FACTURE",
      },
      {
        leadId: closedLead.id,
        clientId: client.id,
        label: "Maintenance 12 mois",
        amountHt: 348,
        billingStatus: "A_FACTURER",
        isRecurring: true,
      },
    ],
  });

  const ca = 1490 + 348;
  await prisma.commission.createMany({
    data: [
      {
        clientId: client.id,
        leadId: closedLead.id,
        userId: apporteurs[0].id,
        label: "Commission apporteur",
        roleLabel: "Apporteur d'affaires",
        ratePercent: 10,
        amountHt: Math.round(ca * 0.1),
        status: "A_VERSER",
      },
      {
        clientId: client.id,
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

  // Bookflow closed client
  const closedBf = await prisma.lead.create({
    data: {
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

  const clientBf = await prisma.client.create({
    data: {
      companyName: "Cabinet Horizon",
      contactName: "Marc Olivier",
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

  await prisma.lead.update({
    where: { id: closedBf.id },
    data: { clientId: clientBf.id },
  });

  await prisma.dealLine.create({
    data: {
      leadId: closedBf.id,
      clientId: clientBf.id,
      label: "Bookflow Pro — annuel",
      amountHt: 348,
      billingStatus: "PAYE",
      isRecurring: true,
    },
  });

  await prisma.commission.createMany({
    data: [
      {
        clientId: clientBf.id,
        leadId: closedBf.id,
        userId: apporteurs[4].id,
        label: "Commission apporteur",
        roleLabel: "Apporteur d'affaires",
        ratePercent: 10,
        amountHt: 35,
        status: "VERSEE",
      },
      {
        clientId: clientBf.id,
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

  // Extra assigned leads for other commerciaux so each has something
  for (let i = 5; i < 10; i++) {
    await prisma.lead.create({
      data: {
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

  await prisma.activity.createMany({
    data: [
      {
        leadId: createdLeads[0].id,
        userId: commerciaux[0].id,
        type: "APPEL",
        note: "Premier contact — intéressé par une reprise WordPress.",
      },
      {
        leadId: createdLeads[0].id,
        userId: commerciaux[0].id,
        type: "RDV",
        note: "RDV démo posé.",
      },
      {
        leadId: closedLead.id,
        userId: commerciaux[0].id,
        type: "STATUT",
        note: "Deal closé — client créé avec prestations et commissions.",
      },
      {
        leadId: closedBf.id,
        userId: commerciaux[4].id,
        type: "STATUT",
        note: "Bookflow Pro signé — client actif.",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: associe.id,
        title: "Bienvenue Associé",
        body: "Vous avez accès à l'ensemble du CRM (VitrineFlash + Bookflow).",
        link: "/dashboard",
      },
      {
        userId: dirVf.id,
        title: "Pilotage VitrineFlash",
        body: "Votre vue est filtrée sur le produit VitrineFlash.",
        link: "/dashboard",
      },
      {
        userId: dirBf.id,
        title: "Pilotage Bookflow",
        body: "Votre vue est filtrée sur le produit Bookflow.",
        link: "/dashboard",
      },
      {
        userId: commerciaux[0].id,
        title: "Leads à appeler",
        body: "Des leads vous sont attribués dans la file d'appels.",
        link: "/appels",
      },
      {
        userId: apporteurs[0].id,
        title: "Lead converti",
        body: "Votre apport Atelier Nord est passé en client.",
        link: `/clients/${client.id}`,
      },
    ],
  });

  // Multi-produits : intérêts VF + Bookflow
  await prisma.leadInterest.createMany({
    data: [
      { leadId: createdLeads[0].id, productSlug: "vitrineflash" },
      { leadId: createdLeads[0].id, productSlug: "bookflow" },
      { leadId: createdLeads[1].id, productSlug: "bookflow" },
      { leadId: closedLead.id, productSlug: "vitrineflash" },
      { leadId: closedBf.id, productSlug: "bookflow" },
    ],
  });

  const yearMonth = new Date().toISOString().slice(0, 7);
  await prisma.quota.createMany({
    data: commerciaux.slice(0, 5).map((c) => ({
      userId: c.id,
      yearMonth,
      targetCloses: 4,
      targetCa: 8000,
    })),
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Relancer Dupont SAS — devis reprise",
        userId: commerciaux[0].id,
        leadId: createdLeads[0].id,
        dueAt: new Date(),
        priority: "HIGH",
      },
      {
        title: "Préparer démo Bookflow Studio Lumière",
        userId: commerciaux[1].id,
        leadId: createdLeads[1].id,
        dueAt: new Date(Date.now() + 2 * 86400_000),
        priority: "MEDIUM",
      },
      {
        title: "Appeler Boulangerie Pain d'Or",
        userId: commerciaux[2].id,
        leadId: createdLeads[2].id,
        dueAt: new Date(Date.now() - 86400_000),
        priority: "HIGH",
      },
      {
        title: "Suivi livraison Atelier Nord",
        userId: commerciaux[0].id,
        clientId: client.id,
        leadId: closedLead.id,
        dueAt: new Date(Date.now() + 5 * 86400_000),
        priority: "MEDIUM",
      },
    ],
  });

  await prisma.savedView.create({
    data: {
      name: "Relances urgentes (partagée)",
      entity: "LEAD",
      isShared: true,
      userId: associe.id,
      filters: { status: "CONTACTE", overdue: true },
    },
  });

  console.log("Seed OK — mot de passe: demo1234");
  console.log("associe@ts-crm.fr");
  console.log("direction.vf@ts-crm.fr");
  console.log("direction.bookflow@ts-crm.fr");
  console.log("apporteur1@ts-crm.fr … apporteur10@ts-crm.fr");
  console.log("commercial1@ts-crm.fr … commercial10@ts-crm.fr");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
