# Guide de migration de base de données — TDB CRM

## État actuel

- **Provider** : PostgreSQL via Prisma 7 + `@prisma/adapter-pg`
- **Base actuelle** : `create-db.prisma.io` (temporaire, peut expirer)
- **Schéma** : Utilise `prisma db push` (pas de migrations versionnées)

## Options de migration (recommandées)

### Option 1 : Vercel Postgres (recommandé pour Vercel)

**Avantages** : Intégration native, pooling inclus, gratuit tier généreux

```bash
# 1. Créer une base Vercel Postgres dans le dashboard
#    Vercel Dashboard > Storage > Create Database > Postgres

# 2. Récupérer les credentials (automatique via Vercel CLI)
vercel link
vercel env pull .env.local

# 3. La variable POSTGRES_PRISMA_URL sera ajoutée automatiquement
# Mettre à jour .env pour pointer vers elle :
DATABASE_URL="${POSTGRES_PRISMA_URL}"
```

**Setup Vercel** :
1. Dashboard Vercel → votre projet `tdb-crm`
2. Storage → Create Database → Postgres
3. Nom : `tdb-crm-prod`
4. Region : choisir proche de vos users (eu-west par défaut)
5. Copier `POSTGRES_PRISMA_URL` dans Project Settings → Environment Variables

### Option 2 : Supabase (alternative gratuite robuste)

**Avantages** : Gratuit généreux, backups automatiques, dashboard SQL

```bash
# 1. Créer projet sur supabase.com
# 2. Database Settings → Connection string → URI (pooler)
# 3. Format : postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# Ajouter à .env :
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### Option 3 : Claim la base create-db actuelle

**Temporaire** : Permet de garder les données existantes avant vraie migration

```bash
# Visiter : https://create-db.prisma.io/claim?projectID=proj_sw9u7nwu8tzmu3ecf1181fpv
# Suivre les instructions pour prolonger
```

⚠️ **Limité dans le temps** — À n'utiliser QUE pour transition.

## Migration étape par étape

### Phase 1 : Initialiser les migrations Prisma

```bash
# Depuis /workspace/TDB - CRM

# 1. Créer le dossier migrations avec état actuel
npx prisma migrate dev --name init --create-only

# 2. Vérifier la migration générée
cat prisma/migrations/*/migration.sql

# 3. Appliquer (si DB de dev locale disponible)
npx prisma migrate dev

# OU pour production (sans prompt interactif)
npx prisma migrate deploy
```

### Phase 2 : Configurer la nouvelle base

**Pour Vercel Postgres** :
```bash
# 1. Créer DB dans Vercel Dashboard
# 2. Récupérer POSTGRES_PRISMA_URL
# 3. Appliquer migrations
DATABASE_URL="$POSTGRES_PRISMA_URL" npx prisma migrate deploy

# 4. Seed initial (comptes démo)
DATABASE_URL="$POSTGRES_PRISMA_URL" npm run db:seed
```

**Pour Supabase** :
```bash
# 1. Créer projet Supabase
# 2. DATABASE_URL avec pooler URL
# 3. Appliquer migrations
npx prisma migrate deploy

# 4. Seed
npm run db:seed
```

### Phase 3 : Migration des données existantes (si nécessaire)

Si vous avez des données en prod sur create-db à conserver :

```bash
# 1. Dump depuis l'ancienne base
pg_dump "$OLD_DATABASE_URL" > backup.sql

# 2. Restore vers nouvelle base (après migrate deploy)
psql "$NEW_DATABASE_URL" < backup.sql

# OU via Prisma Studio pour vérification
npx prisma studio
```

## Variables d'environnement requises

### Développement (.env.local)
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/tdb_crm_dev"
```

### Production (Vercel Environment Variables)
```bash
# Auto-configuré si Vercel Postgres
POSTGRES_PRISMA_URL="postgres://..."

# OU manuel
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=1&pool_timeout=10"
```

## Checklist de migration

- [ ] Nouvelle base créée (Vercel Postgres ou Supabase)
- [ ] `prisma migrate deploy` réussi sur nouvelle base
- [ ] `npm run db:seed` exécuté (comptes démo)
- [ ] Variable `DATABASE_URL` mise à jour dans Vercel Environment Variables
- [ ] Test de connexion : `npx prisma db pull` réussit
- [ ] Déploiement Vercel avec nouvelle DB
- [ ] Vérification login avec comptes démo
- [ ] Ancienne base create-db désactivée

## Troubleshooting

**Erreur "Connection pool exhausted"** :
- Vérifier `connection_limit=1` dans DATABASE_URL
- Pour Vercel, utiliser `POSTGRES_PRISMA_URL` (pooling automatique)

**Erreur "Can't reach database server"** :
- Whitelist IP si nécessaire (Supabase : Project Settings → Database → Connection pooling)
- Vercel Postgres : Pas de whitelist nécessaire

**Migrations divergentes** :
```bash
# Reset et recommencer (⚠️ perte de données)
npx prisma migrate reset

# OU résoudre manuellement
npx prisma migrate resolve --applied "20240101000000_migration_name"
```

## Rollback

Si problème après migration :

```bash
# 1. Restaurer ancienne DATABASE_URL dans Vercel
# 2. Redéployer
# 3. Vérifier fonctionnement

# Si données à récupérer :
pg_dump "$NEW_DATABASE_URL" > post-migration-backup.sql
```

## Notes de sécurité

- ✅ Ne JAMAIS commit de DATABASE_URL en clair
- ✅ Utiliser Vercel Environment Variables (encrypted)
- ✅ Rotation credentials tous les 90j recommandée
- ✅ Connection pooling activé (déjà fait dans `src/lib/db.ts`)
- ✅ SSL requis en production (`sslmode=require`)

## Support

- Vercel Postgres : https://vercel.com/docs/storage/vercel-postgres
- Supabase : https://supabase.com/docs/guides/database
- Prisma Migrate : https://www.prisma.io/docs/concepts/components/prisma-migrate
