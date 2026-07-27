# Plan FusionFit — v2

Scope énorme. Je propose de livrer en **3 phases**, chacune testable indépendamment. Tu valides la phase 1 avant que j'attaque la 2.

## Phase 0 — Préparation (immédiat)

1. **GitHub** : à faire par toi via le bouton **+** du chat → GitHub → Connect.
2. **Activer Lovable Cloud** : indispensable pour auth, base de données et messagerie temps réel.

## Phase 1 — Mode dark/light + Auth + Rôles

### Mode dark/light (auto + toggle manuel)
- Hook `useTheme` avec persistance localStorage + détection `prefers-color-scheme`
- Bouton soleil/lune dans la TopBar
- Variables `--ff-*` déclinées en mode clair dans `:root` vs `.dark`
- Identité Initiative préservée (cyan/ambre/vert) sur les deux thèmes

### Authentification (email/MDP + invitation)
- Page `/login` (email + mot de passe, pas d'inscription publique)
- Page `/signup?token=...` (accessible uniquement via lien d'invitation)
- Layout `_authenticated` qui protège tout `/fusionfit/*`
- Email confirmation **désactivée** pour test rapide

### Rôles (coach / abonné, plusieurs coachs)
- Enum `app_role` : `coach`, `abonne`
- Table `user_roles` avec fonction `has_role()` security definer
- Premier inscrit = coach automatique (trigger)
- Tables `profiles` (info publique) liées à `auth.users`

## Phase 2 — Vues différenciées coach / abonné

### Vue Abonné (existante adaptée)
- Routine, Bibliothèque, Profil = comme actuellement
- Messagerie = chat avec **son** coach
- Profil persisté en DB (objectifs, archétype, événements)

### Vue Coach (nouvelle)
- Onglet **Escouade** : liste des abonnés, accès au profil de chacun
- Page abonné : profil + check-ins + chat 1-to-1
- Bouton "Inviter un abonné" → génère lien `/signup?token=...`
- Édition du programme hebdo + assignation de protocoles
- Commentaires sur chaque check-in

### Tables DB
- `profiles` (id, user_id, prenom, objectif, niveau, archetype, points_forts, evenements jsonb)
- `coach_assignments` (coach_id, abonne_id) — qui suit qui
- `invitations` (token, coach_id, email, used_at)
- `check_ins` (id, abonne_id, date, temps, energie, humeur, coach_comment)
- `programs` (id, abonne_id, coach_id, semaine, blocs jsonb)

## Phase 3 — Messagerie temps réel + Créneaux

### Messagerie (Realtime)
- Table `messages` (id, conversation_id, from_user_id, texte, type, created_at)
- Table `conversations` (id, coach_id, abonne_id)
- Subscriptions Supabase Realtime pour push instantané
- RLS : seuls les 2 participants voient la conversation

### Créneaux d'entraînement
- Table `training_slots` (id, abonne_id, coach_id, date, heure, lieu, statut)
- Statuts : `proposé` (par abonné) → `validé` / `refusé` / `contre-proposé` (par coach)
- Vue calendrier abonné : "Demander un créneau" + liste des créneaux
- Vue calendrier coach : créneaux en attente avec actions valider/refuser/proposer autre date
- Notification dans la messagerie quand statut change

---

## Détails techniques

- **Stack** : Lovable Cloud (Supabase) + TanStack Start server functions
- **RLS** : policies strictes (`has_role`, `auth.uid() = user_id`)
- **Images du coach/abonné** : avatars via Storage bucket public
- **Routes nouvelles** :
  - `/login`, `/signup`
  - `/fusionfit/escouade` (coach uniquement)
  - `/fusionfit/escouade/$abonneId` (coach uniquement)
  - `/fusionfit/creneaux` (les 2)
- **Estimation** : Phase 1 = 1 message, Phase 2 = 2-3 messages, Phase 3 = 2 messages

---

## Question avant de démarrer

Je propose de **commencer par Phase 1** (dark mode + auth + rôles + premier coach), tester ensemble, puis enchaîner. OK pour ce découpage ?

Si tu valides, j'active Lovable Cloud immédiatement après et j'attaque Phase 1.
