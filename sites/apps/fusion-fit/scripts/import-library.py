#!/usr/bin/env python3
"""Import idempotent des 11 modules JSON → library_items (stdout SQL ou --apply via env)."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "library"

MODULE_MAP = {
    "fusionfit_module1_corrige_optimise.json": "module1",
    "fusionfit_module2_corrige_optimise.json": "module2",
    "fusionfit_module3_crossfit_corrige_optimise.json": "module3_crossfit",
    "fusionfit_module3_wodtheque_crossfit_corrige_optimise.json": "module3_wodtheque",
    "fusionfit_module4_hyrox_corrige_optimise.json": "module4_hyrox",
    "fusionfit_module4B_hyrox_strategie_standards_corrige_optimise.json": "module4B_hyrox_strategie",
    "fusionfit_module5_running_trail_corrige_optimise.json": "module5_running",
    "fusionfit_module6A_natation_corrige_optimise.json": "module6A_natation",
    "fusionfit_module6B_cyclisme_triathlon_corrige_optimise.json": "module6B_cyclisme",
    "fusionfit_module8_yoga_pilates_corrige_optimise.json": "module8_yoga",
    "fusionfit_module9_pilates_reformer_corrige_optimise.json": "module9_reformer",
    "fusionfit_module10_fitboxing_corrige_optimise.json": "module10_fitboxing",
    "fusionfit_module11_postural_bureau_corrige_optimise.json": "module11_postural",
}


def sql_str(v: str | None) -> str:
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_text_array(arr) -> str:
    if not arr:
        return "ARRAY[]::text[]"
    parts = []
    for x in arr:
        if x is None:
            continue
        parts.append("'" + str(x).replace("'", "''") + "'")
    if not parts:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ",".join(parts) + "]::text[]"


def sql_json(obj) -> str:
    return sql_str(json.dumps(obj, ensure_ascii=False))


def detect_type(code: str, row: dict) -> str:
    if code.startswith("WOD-"):
        return "wod"
    if code.startswith("HYX-STD-"):
        return "knowledge"
    if row.get("type_fiche") in ("Concept-Lexique", "Concept", "Lexique"):
        return "knowledge"
    if "type_wod" in row:
        return "wod"
    if "titre" in row and "nom_fr" not in row and "niveau_1" not in row:
        return "knowledge"
    return "exercise"


def normalize_row(row: dict, module: str) -> dict | None:
    code = row.get("id") or row.get("code")
    if not code:
        return None
    item_type = detect_type(str(code), row)

    nom_fr = row.get("nom_fr") or row.get("nom") or row.get("titre")
    if not nom_fr:
        return None

    # WOD → niveaux via scaling_*
    n1 = row.get("niveau_1") or row.get("scaling_niveau_1") or row.get("description_detaillee")
    n2 = row.get("niveau_2") or row.get("scaling_niveau_2")
    n3 = row.get("niveau_3") or row.get("rx_niveau_3") or row.get("rx")

    mots = row.get("mots_cles") or []
    if isinstance(mots, str):
        mots = [mots]

    return {
        "code": str(code).strip(),
        "module": module,
        "item_type": item_type,
        "nom_fr": str(nom_fr).strip(),
        "nom_en": row.get("nom_en"),
        "categorie": row.get("categorie") or row.get("type_fiche") or row.get("type_wod"),
        "mots_cles": list(mots),
        "materiel": list(row.get("materiel") or []),
        "muscles_principaux": list(row.get("muscles_principaux") or row.get("muscles_ou_systeme_sollicite") or []),
        "muscles_secondaires": list(row.get("muscles_secondaires") or []),
        "respiration": row.get("respiration"),
        "niveau_1": n1,
        "niveau_2": n2,
        "niveau_3": n3,
        "coach_tip": row.get("coach_tip") or row.get("erreurs_courantes") or row.get("impact_performance"),
        "payload": {k: v for k, v in row.items() if k not in {
            "id", "code", "nom_fr", "nom_en", "nom", "titre", "mots_cles", "categorie",
            "materiel", "muscles_principaux", "muscles_secondaires", "respiration",
            "niveau_1", "niveau_2", "niveau_3", "coach_tip",
        }},
    }


def upsert_sql(r: dict) -> str:
    return f"""INSERT INTO public.library_items (
  code, module, item_type, nom_fr, nom_en, categorie, mots_cles, materiel,
  muscles_principaux, muscles_secondaires, respiration, niveau_1, niveau_2, niveau_3,
  coach_tip, payload, media_thumbnail_url, media_diagram_url, media_video_url
) VALUES (
  {sql_str(r['code'])}, {sql_str(r['module'])}, {sql_str(r['item_type'])},
  {sql_str(r['nom_fr'])}, {sql_str(r.get('nom_en'))}, {sql_str(r.get('categorie'))},
  {sql_text_array(r['mots_cles'])}, {sql_text_array(r['materiel'])},
  {sql_text_array(r['muscles_principaux'])}, {sql_text_array(r['muscles_secondaires'])},
  {sql_str(r.get('respiration'))}, {sql_str(r.get('niveau_1'))},
  {sql_str(r.get('niveau_2'))}, {sql_str(r.get('niveau_3'))},
  {sql_str(r.get('coach_tip'))}, {sql_json(r['payload'])}::jsonb,
  NULL, NULL, NULL
)
ON CONFLICT (code) DO UPDATE SET
  module = EXCLUDED.module,
  item_type = EXCLUDED.item_type,
  nom_fr = EXCLUDED.nom_fr,
  nom_en = EXCLUDED.nom_en,
  categorie = EXCLUDED.categorie,
  mots_cles = EXCLUDED.mots_cles,
  materiel = EXCLUDED.materiel,
  muscles_principaux = EXCLUDED.muscles_principaux,
  muscles_secondaires = EXCLUDED.muscles_secondaires,
  respiration = EXCLUDED.respiration,
  niveau_1 = EXCLUDED.niveau_1,
  niveau_2 = EXCLUDED.niveau_2,
  niveau_3 = EXCLUDED.niveau_3,
  coach_tip = EXCLUDED.coach_tip,
  payload = EXCLUDED.payload,
  revision = public.library_items.revision + 1,
  updated_at = now();
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, help="Fichier SQL de sortie")
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    rows: list[dict] = []
    seen: set[str] = set()
    rejected: list[str] = []

    for fname, module in MODULE_MAP.items():
        path = CONTENT / fname
        if not path.exists():
            rejected.append(f"missing:{fname}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            rejected.append(f"not_list:{fname}")
            continue
        for raw in data:
            n = normalize_row(raw, module)
            if not n:
                rejected.append(f"bad_row:{fname}:{raw.get('id')}")
                continue
            if n["code"] in seen:
                rejected.append(f"dup:{n['code']}")
                continue
            seen.add(n["code"])
            rows.append(n)

    if args.report:
        by_type: dict[str, int] = {}
        for r in rows:
            by_type[r["item_type"]] = by_type.get(r["item_type"], 0) + 1
        print(json.dumps({"ok": len(rows), "rejected": rejected, "by_type": by_type}, ensure_ascii=False, indent=2))

    sql = "-- Seed library_items from content/library\nBEGIN;\n" + "\n".join(upsert_sql(r) for r in rows) + "\nCOMMIT;\n"
    if args.out:
        args.out.write_text(sql, encoding="utf-8")
        print(f"Wrote {len(rows)} upserts → {args.out}", file=sys.stderr)
    else:
        sys.stdout.write(sql)
    return 0 if not any(x.startswith("dup:") for x in rejected) else 1


if __name__ == "__main__":
    raise SystemExit(main())
