# Projets IT T&S — Monorepo Lovable

Regroupement des applications et sites **Lovable** (CH/FR) dans un seul dépôt pour design, développement et déploiement.

- **Organisation GitHub :** [tchal25-IA](https://github.com/tchal25-IA)
- **Dépôt :** [Projets-IT-T-S-](https://github.com/tchal25-IA/Projets-IT-T-S-)

## Structure

```
sites/
  vague-business/     # 14 sites « vague business »
  apps/               # Applications standalone
```

Chaque sous-dossier contient une copie du code (sans historique `.git`) clonée depuis le dépôt GitHub du même slug lorsque disponible.

## Catalogue — Vague business (14 sites)

| Produit | URL live | Dossier | Dépôt GitHub source |
|---------|----------|---------|---------------------|
| NetFrontalier | https://netfrontalier.lovable.app | `sites/vague-business/netfrontalier/` | [tchal25-IA/netfrontalier](https://github.com/tchal25-IA/netfrontalier) |
| AssoPV | https://assopv.lovable.app | `sites/vague-business/assopv/` | [tchal25-IA/assopv](https://github.com/tchal25-IA/assopv) |
| FactuFront | https://factufront.lovable.app | `sites/vague-business/factufront/` | [tchal25-IA/factufront](https://github.com/tchal25-IA/factufront) |
| Adhezia | https://adhezia.lovable.app | `sites/vague-business/adhezia/` | [tchal25-IA/adhezia](https://github.com/tchal25-IA/adhezia) |
| ArtisanPipe | https://artisanpipe.lovable.app | `sites/vague-business/artisanpipe/` | [tchal25-IA/artisanpipe](https://github.com/tchal25-IA/artisanpipe) |
| Conformia | https://conformia-audit.lovable.app | `sites/vague-business/conformia-audit/` | [tchal25-IA/conformia-audit](https://github.com/tchal25-IA/conformia-audit) |
| FrontBudget | https://frontbudget.lovable.app | `sites/vague-business/frontbudget/` | [tchal25-IA/frontbudget](https://github.com/tchal25-IA/frontbudget) |
| TipShare | https://tipshare-ch.lovable.app | `sites/vague-business/tipshare-ch/` | [tchal25-IA/tipshare-ch](https://github.com/tchal25-IA/tipshare-ch) |
| FiduciaFind | https://fiduciafind.lovable.app | `sites/vague-business/fiduciafind/` | [tchal25-IA/fiduciafind](https://github.com/tchal25-IA/fiduciafind) |
| VitrineFlash | https://vitrineflash.lovable.app | `sites/vague-business/vitrineflash/` | [tchal25-IA/vitrineflash](https://github.com/tchal25-IA/vitrineflash) |
| AutoFlux | https://autoflux.lovable.app | `sites/vague-business/autoflux/` | [tchal25-IA/autoflux](https://github.com/tchal25-IA/autoflux) |
| RelancePro | https://relancepro-setup.lovable.app | `sites/vague-business/relancepro-setup/` | [tchal25-IA/relancepro-setup](https://github.com/tchal25-IA/relancepro-setup) |
| CRMChantier | https://crmchantier.lovable.app | `sites/vague-business/crmchantier/` | *(non publié — voir README local)* |
| SiteConforme | https://siteconforme.lovable.app | `sites/vague-business/siteconforme/` | [tchal25-IA/siteconforme](https://github.com/tchal25-IA/siteconforme) |

Métadonnées Lovable (IDs, éditeur) : `sites/vague-business/sites.json`.

### Cross-sells

- FactuFront ↔ RelancePro
- ArtisanPipe ↔ CRMChantier
- Conformia ↔ SiteConforme

## Catalogue — Applications

| Produit | URL live | Dossier | Dépôt GitHub source |
|---------|----------|---------|---------------------|
| Quotidien IA | https://votre-quotidien-ia.lovable.app | `sites/apps/quotidien-ia/` | [tchal25-IA/votre-quotidien-ia](https://github.com/tchal25-IA/votre-quotidien-ia) |
| Finzy | https://finzy-v3.lovable.app | `sites/apps/finzy/` | [tchal25-IA/finzy-v3](https://github.com/tchal25-IA/finzy-v3) |
| My Teacher's Journal | https://cahier-de-bord.lovable.app | `sites/apps/teacher-journal/` | [tchal25-IA/cahier-de-bord](https://github.com/tchal25-IA/cahier-de-bord) |
| Paperasse | https://paperasse.lovable.app | `sites/apps/paperasse/` | *(non publié — voir README local)* |

## Stack (typique)

React, TypeScript, Tailwind CSS, shadcn/ui (TanStack Start sur les projets récents).

## Développement local

Dans un sous-projet :

```bash
cd sites/vague-business/netfrontalier   # exemple
bun install && bun dev
# ou : npm install && npm run dev
```

## Synchronisation

Pour mettre à jour le monorepo depuis GitHub :

1. Cloner ou `git pull` chaque dépôt source `tchal25-IA/<slug>`.
2. Copier le contenu (sans `.git`) dans le dossier correspondant ci-dessus.

## Autres dépôts GitHub (compte tchal25-IA)

Dépôts détectés accessibles via `git` (liste non exhaustive sans `gh auth login`) :

| Dépôt | URL |
|-------|-----|
| Projets-IT-T-S- | https://github.com/tchal25-IA/Projets-IT-T-S- |
| Tdb-Projets | https://github.com/tchal25-IA/Tdb-Projets |
| + 16 dépôts Lovable listés dans les tableaux ci-dessus | |

---

Dernière organisation automatisée : juillet 2026.

## Projets en attente (code non synchronisé)

| Produit | Live | ID Lovable | Action |
|---------|------|------------|--------|
| CRMChantier | https://crmchantier.lovable.app | `4d11697f-cd25-4d29-8765-feacc1a1b709` | Publier vers GitHub puis resync |
| Paperasse | https://paperasse.lovable.app | `0a121325-83ca-4402-a145-67e221c5c469` | Publier vers GitHub puis resync |

Dépôts GitHub testés sans succès : voir README dans chaque dossier placeholder.
