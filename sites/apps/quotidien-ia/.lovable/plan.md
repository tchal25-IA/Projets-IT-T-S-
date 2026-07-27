## Objectif
Recevoir les utilisateurs Quotidien IA sur `/sso?token=<JWT>` et les connecter automatiquement à Finzy sans ré-inscription ni formulaire.

## Étapes

### 1. Secrets à ajouter
- `SSO_SECRET_FINZY` (valeur fournie)
- `SERVICE_SHARED_SECRET` (valeur fournie)
- `QUOTIDIEN_IA_URL` = `https://votre-quotidien-ia.lovable.app`

Note : `FINZY_URL` et `PAPERASSE_URL` sont déjà enregistrés.

### 2. Fichiers à créer

**`src/lib/jwt.ts`** — vérification JWT HS256 via Web Crypto (compatible Cloudflare Workers), avec contrôle `aud === "finzy"` et `exp`.

**`src/routes/sso.tsx`** — server route TanStack Start :
- Lit `?token=` depuis l'URL
- Vérifie le JWT avec `SSO_SECRET_FINZY`
- Si invalide/expiré → 401 HTML « Lien expiré »
- Sinon, via `supabaseAdmin` :
  - `listUsers()` → si l'email n'existe pas, `createUser({ email, email_confirm: true, user_metadata: { sso_from, qia_user_id } })`
  - `generateLink({ type: "magiclink", email })`
  - `Response.redirect(action_link, 302)` → l'utilisateur arrive connecté

### 3. Points de conformité avec les règles du projet
- `supabaseAdmin` est importé au top-level dans `src/routes/sso.tsx` : c'est un fichier de **server route** (pas un `*.functions.ts`), mais selon les règles le client.server doit être chargé **inside the handler** via `await import(...)` pour éviter toute fuite vers le bundle client. **Ajustement vs. spec utilisateur** : je remplacerai l'import top-level par `const { supabaseAdmin } = await import("@/integrations/supabase/client.server")` à l'intérieur du handler GET. Le reste du code reste identique à la spec.
- Le composant `() => null` est conservé (le handler redirige avant tout rendu).
- Route publique (pas sous `_authenticated/`) — normal, l'utilisateur n'est pas encore connecté.

### 4. Vérifications post-implémentation
- Lecture du fichier `src/integrations/supabase/client.server.ts` pour confirmer l'export `supabaseAdmin`.
- Build implicite via le harness.

## Confirmation demandée
OK pour l'ajustement à l'import dynamique de `supabaseAdmin` (sinon le build/lint Lovable bloque l'import top-level d'un module `.server` depuis une route) ?
