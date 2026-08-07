# T&S CRM — plateforme multi-rôles

CRM SaaS interne pour suivre les leads **VitrineFlash** (sites web) et **Bookflow** (prise de RDV), de l'import jusqu'à la facturation.

## Stack

- Next.js 16 (App Router) + Tailwind CSS
- Prisma 7 + PostgreSQL
- Auth.js (NextAuth v5) — rôles : Associé, Direction VF/Bookflow, Commercial, Apporteur, Admin

## Démarrage local

```bash
cp .env.example .env
# Renseigner DATABASE_URL et AUTH_SECRET
npm install
npm run db:setup
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Comptes démo (mot de passe : `demo1234`)

| Email | Rôle |
|-------|------|
| associe@ts-crm.fr | Associé (accès total) |
| direction.vf@ts-crm.fr | Direction VitrineFlash |
| direction.bookflow@ts-crm.fr | Direction Bookflow |
| apporteur1@ts-crm.fr … apporteur10@ts-crm.fr | 10 apporteurs d'affaires |
| commercial1@ts-crm.fr … commercial10@ts-crm.fr | 10 commerciaux |

## Fonctionnalités

- Auth multi-rôles + dashboards / navigation adaptés
- Produits **VitrineFlash** et **Bookflow** (intérêts multi-produits)
- Leads, Sales Path, onglets débloqués, scoring, list views
- Pipeline Kanban, file d'appels (mode focus PWA), agenda / tâches
- Import CSV / Excel, audit trail, objectifs commerciaux
- Facturation + PDF + Stripe Checkout (si clés) + emails Resend (si clé)
- Webhook Bookflow (`POST /api/webhooks/bookflow`)
- Commissions 10 % apporteur / 15 % commercial

## Variables d'environnement

Voir `.env.example` : `RESEND_*`, `STRIPE_*`, `BOOKFLOW_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`.

## Production

- URL : https://tdb-crm.vercel.app
- Projet Vercel : `tdb-crm`

## Base de données temporaire Prisma

La base Postgres actuelle a été créée via `create-db`.
**À faire :** claimez-la pour la conserver :
https://create-db.prisma.io/claim?projectID=proj_sw9u7nwu8tzmu3ecf1181fpv

Sinon créez une base Postgres permanente et mettez à jour `DATABASE_URL` (local + Vercel).
