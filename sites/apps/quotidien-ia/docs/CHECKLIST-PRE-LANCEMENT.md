# ✅ Checklist de pré-lancement — Quotidien IA

> Éditeur : **société suisse** · Marchés : **France 🇫🇷 + Suisse 🇨🇭**
> Cadre : **nLPD** (Suisse) + **RGPD** (UE/France)
> Dernière mise à jour de ce document : 21 juin 2026

Légende : 🔴 Bloquant · 🟠 Important · 🟡 Recommandé · ✅ Déjà fait

---

## 1. Conformité légale & RGPD/nLPD

| Statut | Tâche | Détail |
|---|---|---|
| ✅ | Pages légales créées | `/mentions-legales`, `/confidentialite`, `/cgu`, `/cookies` |
| ✅ | Liens légaux dans le footer | Visibles sur toutes les pages |
| ✅ | Bandeau de consentement | Stockage local + transfert IA |
| ✅ | Droits RGPD (accès/export, effacement) | Page Paramètres |
| ✅ | Disclaimer IA (Gemini + hors UE) | Mention du modèle tiers et du transfert |
| 🔴 | **Renseigner les `[À COMPLÉTER]`** | Raison sociale, IDE/UID (CHE-xxx.xxx.xxx), adresse CH, registre du commerce, n° TVA, email contact, responsable publication |
| 🔴 | **Désigner un représentant UE (art. 27 RGPD)** | Obligatoire car éditeur hors UE ciblant la France. Renseigner nom + adresse UE dans `/mentions-legales` et `/confidentialite` |
| 🔴 | **Désigner un DPO / contact protection des données** | Email dédié (ex. privacy@…) |
| 🟠 | Vérifier la région d'hébergement Supabase | Privilégier UE ou Suisse (adéquation CH↔UE OK) |
| 🟠 | Signer les DPA (accords de sous-traitance) | Supabase, Cloudflare, passerelle IA Lovable/Google |
| 🟠 | Registre des traitements (art. 30 RGPD) | Document interne à tenir |
| 🟡 | Mention du droit de rétractation (consommateurs FR) | 14 jours — adapter selon activation du paiement |

---

## 2. Sécurité

| Statut | Tâche | Détail |
|---|---|---|
| ✅ | Authentification Supabase + RLS | Row Level Security active |
| ✅ | Endpoints IA protégés (Bearer + rate limiting) | `/api/agent`, `/api/skill` |
| ✅ | Suppression de compte côté serveur | `/api/account` (service role) |
| ✅ | `.dev.vars` hors git (secrets réels) | `SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` |
| 🟠 | `npm audit fix` | 16 vulnérabilités (deps de build surtout) — voir cahier des charges |
| 🟠 | Vérifier les policies RLS sur **toutes** les tables | `profiles`, `events`, `finance_entries`, `documents`, `subscriptions`, `referrals` |
| 🟠 | Vérifier les permissions Supabase Storage | Documents et pièces jointes |
| 🟡 | En-têtes de sécurité HTTP | CSP, HSTS, X-Content-Type-Options (config Cloudflare) |
| 🟡 | Rotation des clés en cas de doute | Clé anon publiable = non sensible |

---

## 3. Paiement & facturation

| Statut | Tâche | Détail |
|---|---|---|
| 🔴 | **Décider : lancer en gratuit/essai OU brancher Stripe d'abord** | Actuellement « Paiement — bientôt » |
| 🟠 | Intégration Stripe (si paiement au lancement) | Voir cahier des charges §2 |
| 🟠 | TVA : FR (20 %) vs CH (8,1 %) + seuils | Configurer selon le pays du client |
| 🟠 | Facation/justificatifs conformes | Conservation légale |

---

## 4. Technique & qualité

| Statut | Tâche | Détail |
|---|---|---|
| ✅ | Build de production OK | `npm run build` passe |
| ✅ | TypeScript sans erreur projet | `tsc --noEmit` propre |
| ✅ | `robots.txt` + `sitemap.xml` | Remplacer `VOTRE-DOMAINE` |
| ✅ | ErrorBoundary + Toasts | Gestion d'erreurs globale |
| 🟠 | Remplacer `VOTRE-DOMAINE` dans `robots.txt` et `sitemap.xml` | Domaine de production réel |
| 🟠 | Accessibilité (labels, contraste, focus) | Voir cahier des charges §4 |
| 🟡 | Monitoring d'erreurs (Sentry) | Voir cahier des charges §5 |
| 🟡 | Optimisation des chunks (recharts) | Lazy-load déjà en place |
| 🟡 | Tests E2E (parcours clés) | Inscription, abonnement, IA |

---

## 5. SEO & contenu

| Statut | Tâche | Détail |
|---|---|---|
| ✅ | Balises meta/title par page | `head()` sur chaque route |
| 🟠 | Favicon + image Open Graph définitive | Hébergée sur le domaine final |
| 🟠 | Déclarer le site à Google Search Console | Soumettre le sitemap |
| 🟡 | Page d'accueil orientée conversion | Pitch clair + CTA |

---

## 6. Go / No-Go final

- [ ] 🔴 Tous les `[À COMPLÉTER]` légaux renseignés
- [ ] 🔴 Représentant UE + DPO désignés
- [ ] 🔴 Décision paiement prise (gratuit/essai ou Stripe)
- [ ] 🟠 Région Supabase vérifiée (UE/CH)
- [ ] 🟠 Domaine renseigné (robots, sitemap, OG)
- [ ] 🟠 `npm audit` traité
- [ ] 🟠 RLS vérifiée sur toutes les tables
- [ ] 🟢 Test complet du parcours utilisateur en pré-production
