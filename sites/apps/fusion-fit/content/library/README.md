# Catalogue FusionFit — 11 modules JSON

Fichiers source éditoriaux importés via :

```bash
python3 scripts/import-library.py --report --out /tmp/library_seed.sql
```

Tables cibles : `library_items`, `library_media` (URLs V2 : diagramme + micro-vidéo), `library_synonyms`.

Recherche : RPC `search_library_items(q, modules, types, limit)`.

Attribution Atelier : `atelier_sessions` (template | instance) + `assign_atelier_template(...)`.
