# 📋 Cahier des charges — modifications à réaliser dans Lovable

> Projet : **Quotidien IA** · Éditeur **société suisse** · Marchés **France + Suisse**
> Destinataire : agent Lovable / développeur
> Objectif : finaliser l'application en vue d'une mise en ligne publique conforme.

Ce document liste les travaux qui n'ont pas été réalisés directement (car ils nécessitent
des secrets, des décisions métier, ou touchent des fichiers fréquemment régénérés par Lovable).
Pour chaque lot : contexte, travail attendu, critères d'acceptation.

---

## §1. Finaliser les pages légales (priorité 🔴)

**Contexte.** Les pages `/mentions-legales`, `/confidentialite`, `/cgu`, `/cookies` existent déjà
(composant partagé `src/components/legal-layout.tsx`). Elles contiennent des marqueurs
`[À COMPLÉTER : …]` mis en évidence en jaune.

**Travail attendu.**
1. Remplacer **tous** les `[À COMPLÉTER]` par les informations réelles de la société suisse :
   - Raison sociale, forme juridique, capital, adresse du siège (CH)
   - IDE/UID `CHE-xxx.xxx.xxx`, registre du commerce (canton + n°), n° TVA
   - Email de contact, responsable de publication, DPO
   - **Représentant dans l'UE (art. 27 RGPD)** : nom + adresse dans un État membre + email
   - Région d'hébergement Supabase
   - For/canton compétent pour les litiges
2. Une fois renseignées, retirer le composant `ToFill` (ne plus afficher de surlignage jaune).

**Critères d'acceptation.** Plus aucun marqueur `[À COMPLÉTER]` visible ; informations cohérentes
entre `/mentions-legales` et `/confidentialite`.

---

## §2. Intégration du paiement Stripe (priorité 🟠 — si paiement au lancement)

**Contexte.** La page Paramètres affiche « Paiement — bientôt ». La table `subscriptions`
existe déjà dans Supabase ; la logique de prix est dans `src/lib/pricing.ts`.

**Travail attendu.**
1. Créer les produits/prix dans Stripe correspondant aux modules de `pricing.ts` (mensuel + annuel).
2. Endpoint serveur `POST /api/checkout` : crée une session Stripe Checkout pour les modules
   sélectionnés, avec l'utilisateur authentifié (réutiliser le `verifyAuth` de `api.agent.tsx`).
3. Endpoint webhook `POST /api/stripe-webhook` : à la réception de `checkout.session.completed`
   et `customer.subscription.updated/deleted`, mettre à jour la table `subscriptions`
   (statut, période, modules) via le client admin Supabase.
4. **TVA** : configurer Stripe Tax ou gérer manuellement TVA FR (20 %) et CH (8,1 %) selon le
   pays du client (`profiles.work_country`).
5. Gérer le **droit de rétractation** (consommateurs FR, 14 j) et les remboursements.
6. Secrets à placer dans `.dev.vars` / variables d'environnement : `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`. Ne jamais committer ces clés.

**Critères d'acceptation.** Un utilisateur peut souscrire, le webhook met à jour `subscriptions`,
la page Paramètres reflète l'abonnement réel. Aucune clé secrète dans le dépôt.

---

## §3. Sécurité — dépendances et accès (priorité 🟠)

**Travail attendu.**
1. `npm audit` : traiter les 16 vulnérabilités (la majorité sont des dépendances de build —
   `vite`, `esbuild`, `miniflare`, `undici`). Exécuter `npm audit fix` ; pour les `high`
   nécessitant un bump majeur, valider que le build Lovable passe toujours.
2. Vérifier les policies **RLS** sur toutes les tables (`profiles`, `events`, `finance_entries`,
   `documents`, `event_attachments`, `subscriptions`, `referrals`, `user_roles`) : chaque
   utilisateur ne doit accéder qu'à ses propres lignes.
3. Vérifier les permissions **Supabase Storage** (documents, pièces jointes).
4. Ajouter des en-têtes de sécurité côté Cloudflare : `Content-Security-Policy`,
   `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

**Critères d'acceptation.** `npm audit` sans vulnérabilité `high` exploitable en production ;
test manuel confirmant qu'un utilisateur A ne peut pas lire les données d'un utilisateur B.

---

## §4. Accessibilité (a11y) (priorité 🟠)

**Contexte.** Audit : labels de formulaire non associés, boutons-icônes sans intitulé, contraste à vérifier.

**Travail attendu.**
1. Associer chaque `<label>` à son `<input>` via `htmlFor`/`id` (ou envelopper l'input dans le label).
   Fichiers prioritaires : `src/routes/voyage.tsx`, `src/routes/parametres.tsx`, formulaires d'événements.
2. Ajouter `aria-label` sur tous les boutons ne contenant qu'une icône.
3. Vérifier le contraste des textes gris (`text-muted-foreground`) sur fond clair (cible WCAG AA).
4. S'assurer que la navigation au clavier et le focus visible fonctionnent (modales, menus).

**Critères d'acceptation.** Score Lighthouse Accessibilité ≥ 90 ; navigation clavier complète.

---

## §5. Observabilité & qualité (priorité 🟡)

**Travail attendu.**
1. Intégrer un outil de monitoring d'erreurs (Sentry ou équivalent) côté client et serveur.
2. Uniformiser le formatage : `npm run format` (Prettier) en une PR dédiée pour éviter le bruit.
3. Corriger les clés React basées sur l'index dans les graphiques recharts
   (`budget-simulator.tsx`, `task-manager.tsx`) : utiliser un identifiant stable (`key={d.name}`).
4. Ajouter quelques tests E2E (Playwright) sur les parcours clés : inscription, choix de modules,
   appel à l'assistant IA, suppression de compte.

**Critères d'acceptation.** Erreurs runtime remontées dans le monitoring ; CI de formatage verte.

---

## §6. SEO & domaine (priorité 🟠)

**Travail attendu.**
1. Remplacer `VOTRE-DOMAINE` par le domaine de production dans `public/robots.txt` et
   `public/sitemap.xml`, puis décommenter la ligne `Sitemap:` dans `robots.txt`.
2. Ajouter favicon + image Open Graph définitive (hébergées sur le domaine final).
3. Déclarer le site dans Google Search Console et soumettre le sitemap.

**Critères d'acceptation.** Sitemap accessible à `https://<domaine>/sitemap.xml` ; pages publiques
indexables, espace authentifié et `/api` exclus.

---

## §7. Conformité Suisse spécifique (priorité 🟡)

**Contexte.** Des agents IA « fiscalité » sont calibrés pour la France. Un utilisateur suisse
pourrait s'y fier à tort (un avertissement existe déjà dans `paperasse.tsx`).

**Travail attendu.**
1. Renforcer l'avertissement quand `work_country === "CH"` et que l'agent est `country === "FR"`.
2. Envisager des agents/contenus dédiés à la fiscalité suisse (cantons, AFC), ou afficher
   clairement le périmètre géographique de chaque agent.

**Critères d'acceptation.** Aucun conseil fiscal présenté sans mention claire de son périmètre pays.

---

## Récapitulatif des priorités

| Lot | Priorité | Dépendance |
|---|---|---|
| §1 Pages légales | 🔴 | Infos société (client) |
| §2 Stripe | 🟠 | Décision + compte Stripe (client) |
| §3 Sécurité deps/RLS | 🟠 | — |
| §4 Accessibilité | 🟠 | — |
| §6 SEO/domaine | 🟠 | Domaine (client) |
| §5 Observabilité | 🟡 | Compte Sentry |
| §7 Conformité CH | 🟡 | — |
