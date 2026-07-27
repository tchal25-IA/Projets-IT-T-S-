# Cahier des charges — Finzy (à destination de Lovable)

> Document de spécification pour finaliser l'application Finzy.
> Une partie du travail (code applicatif) a déjà été réalisée et poussée.
> Ce document liste **ce qui reste à faire**, en priorisant ce qui nécessite
> des accès/configurations externes (Stripe, Supabase, juridique) que l'IA de
> développement ne peut pas exécuter seule.

---

## 1. Contexte du projet

- **Produit :** Finzy, application web (PWA) d'éducation et de gestion financière personnelle, gamifiée.
- **Marchés :** France 🇫🇷 et Suisse 🇨🇭 (bi-devise EUR/CHF, contenus et simulateurs adaptés).
- **Éditeur :** entreprise suisse servant une clientèle franco-suisse.
- **Stack :** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui ; backend Supabase (PostgreSQL, Auth, Edge Functions) ; IA via gateway Lovable/Google Gemini.
- **Modèle économique :** freemium. Plan gratuit + abonnement **Premium** (mensuel/annuel) incluant une seconde app **FinzyImmo** (gestion locative).

---

## 2. Ce qui est DÉJÀ réalisé (livré dans le code)

- ✅ Modules : Dashboard, Budget, Projets, Patrimoine, 13 simulateurs, Academy, Marchés, Watchlist, FinzyBot (IA).
- ✅ Gamification : XP, niveaux, badges, streak, leaderboard, parrainage.
- ✅ **Sécurité FinzyBot** : vérification JWT côté Edge Function + envoi du token de session.
- ✅ **Paywall Premium** : hook `usePlan`, composant `PremiumGate`, page `/premium`, gating des fonctionnalités avancées.
- ✅ **Intégration Stripe (code)** : Edge Functions `stripe-checkout` et `stripe-webhook`, colonne `stripe_customer_id`.
- ✅ **Bundle FinzyImmo** : module quittances gaté Premium + mise en avant sur la page Premium.
- ✅ **Conformité légale (base)** : page `/legal` (mentions, CGU/CGV, confidentialité RGPD/nLPD, cookies), bannière cookies, consentement CGU à l'inscription, mot de passe ≥ 8 caractères.
- ✅ Correctifs : persistance avatar, anti double-parrainage, comptage parrainages, plan dynamique dans le profil.

---

## 3. CE QUI RESTE À FAIRE

### 3.1 — Configuration Stripe (BLOQUANT pour la monétisation) 🔴

> Le code est prêt mais nécessite des accès au compte Stripe et Supabase.

1. **Créer le compte Stripe** (entité suisse) et activer les paiements EUR + CHF.
2. **Créer les produits & prix** sur Stripe :
   - Premium Mensuel : 6,99 € / 7,90 CHF
   - Premium Annuel : 59 € / 69 CHF
3. **Renseigner les variables d'environnement front** (`.env`) :
   - `VITE_STRIPE_PRICE_MONTHLY`, `VITE_STRIPE_PRICE_YEARLY`
4. **Renseigner les secrets Edge Functions** (Supabase Dashboard) :
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`
5. **Déclarer le webhook Stripe** vers `https://<projet>.supabase.co/functions/v1/stripe-webhook`
   avec les events : `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `customer.subscription.paused`.
6. **Déployer les Edge Functions** : `supabase functions deploy stripe-checkout stripe-webhook ai-chat`.
7. **Appliquer les migrations** : `supabase db push` (ajoute `avatar`, `referral_used_by`, `stripe_customer_id`).
8. **Gérer la multi-devise** : afficher le prix CHF aux utilisateurs `market = CH` (actuellement EUR par défaut sur la page Premium).
9. **Portail client Stripe** : ajouter un bouton « Gérer mon abonnement » (Stripe Billing Portal) dans le profil pour résiliation/changement de carte.

### 3.2 — Hébergement & résidence des données (réglementaire) 🔴

> Point critique pour une entreprise suisse avec clients FR/CH.

1. **Vérifier/forcer la région d'hébergement Supabase** : idéalement **UE (Francfort)** ou **Suisse** pour respecter RGPD + nLPD et éviter les transferts hors UE/CH.
2. Si transfert hors UE/CH (ex. sous-traitants US Stripe/Google) : documenter les **garanties** (clauses contractuelles types) dans la politique de confidentialité.
3. **Signer les DPA** (Data Processing Agreements) avec Supabase, Stripe et le fournisseur IA.
4. Compléter toutes les zones **[À COMPLÉTER]** de la page `/legal` (raison sociale, IDE/n° RC, adresse, DPO/PrPD, durées de conservation).

### 3.3 — Suppression de compte (RGPD/nLPD — droit à l'effacement) 🟠

- Ajouter dans Profil > Sécurité un bouton **« Supprimer mon compte »** avec double confirmation.
- Implémenter une Edge Function `delete-account` (service_role) qui supprime l'utilisateur `auth.users` (cascade sur toutes les tables) — le simple export actuel ne suffit pas légalement.

### 3.4 — Vérification email & récupération de mot de passe 🟠

- L'auth actuelle utilise un pseudo converti en faux email (`pseudo@finzy.local`) : **pas de récupération de mot de passe possible** sans vrai email.
- Mettre en place : vérification d'email optionnelle mais recommandée, flux « mot de passe oublié » par email, validation du format email côté profil.

### 3.5 — Rate limiting FinzyBot (free vs premium) 🟠

- Le paywall prévoit « 3 messages/jour » en gratuit et illimité en Premium, mais **ce quota n'est pas implémenté**.
- Ajouter un comptage quotidien (table `ai_usage` ou compteur sur `profiles`) vérifié dans l'Edge Function `ai-chat`.

### 3.6 — Cohérence fonctionnelle 🟡

- **Tables `projects` vs `goals`** : les deux coexistent et sont utilisées en parallèle (Projets, Export). Clarifier ou fusionner le modèle pour éviter la confusion.
- **XP simulateurs** : le badge « stratège » est attribué mais aucun XP n'est réellement octroyé à l'usage d'un simulateur. Décider et implémenter.
- **Leaderboard** : anonymisation « 2 premiers caractères + *** » expose les pseudos courts. Renforcer (ex. afficher uniquement un identifiant généré).

### 3.7 — Performance & qualité 🟡

- Le bundle principal fait **708 kB** (>500 kB). Mettre en place le code-splitting (manualChunks) — notamment isoler `jspdf`, `recharts`.
- Corriger le warning ESLint `react-hooks/exhaustive-deps` dans `ProfilPage`.
- Ajouter des tests unitaires sur les nouveaux modules (`usePlan`, simulateurs avancés).

---

## 4. FinzyImmo — Intégration de la seconde app

**Objectif :** un seul abonnement Premium débloque Finzy **et** FinzyImmo.

**Architecture recommandée (SSO Supabase partagé) :**
1. FinzyImmo utilise **le même projet Supabase** que Finzy (même `auth.users`, même table `profiles`).
2. FinzyImmo vérifie `profiles.plan IN ('premium','beta')` pour autoriser l'accès.
3. L'app est actuellement intégrée via **iframe** (`VITE_QUITTANCES_APP_URL`). Pour une vraie intégration :
   - soit héberger FinzyImmo sous un sous-domaine partageant la session Supabase ;
   - soit passer le JWT Supabase à l'iframe via `postMessage` pour une authentification transparente.
4. Définir le partage de données entre les deux apps (les biens locatifs de FinzyImmo pourraient alimenter le Patrimoine de Finzy).

---

## 5. Idées d'amélioration (backlog produit)

| Priorité | Idée | Bénéfice |
|----------|------|----------|
| Haute | Import bancaire (agrégation via Powens/Bridge) | Réduit la saisie manuelle — frein n°1 |
| Haute | Simulateur Retraite (régime FR + LPP/AVS CH) | Sujet à fort engagement |
| Moyenne | Comparateur de produits d'épargne en temps réel | Valeur concrète immédiate |
| Moyenne | Notifications push PWA réelles (rappels quiz/streak/échéances) | Rétention |
| Moyenne | Plan d'action IA personnalisé (analyse globale du profil) | Différenciation premium |
| Basse | Mode collaboratif / foyer (budget partagé) | Élargit la cible |
| Basse | Widget mobile + app native (Capacitor) | Présence mobile |

---

## 6. Définition de « Terminé » (Definition of Done)

- [ ] Paiement Premium fonctionnel de bout en bout (test en mode Stripe test puis live).
- [ ] Données hébergées en UE/CH, DPA signés, page `/legal` complétée et validée juridiquement.
- [ ] Suppression de compte opérationnelle.
- [ ] Récupération de mot de passe par email.
- [ ] Quota FinzyBot appliqué (free vs premium).
- [ ] FinzyImmo accessible sans re-login pour les abonnés Premium.
- [ ] Bundle < 500 kB par chunk, 0 erreur lint, tests verts.
