#!/usr/bin/env python3
"""Apply manually verified See.wikidata_id overrides from a CSV file."""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

from wikidata_import_common import connect_db, dict_cursor, setup_logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply manual See Wikidata ID overrides.")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default="see-wikidata-overrides.csv",
        help="CSV path with name, see_type, state_region, wikidata_id, notes columns.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing to the database.")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite an existing different wikidata_id.")
    return parser.parse_args()


def normalize(value: str | None) -> str:
    if value is None:
        return ""
    text = value.strip().lower()
    text = text.replace("&", " and ")
    text = re.sub(r"\bst\.?\b", "saint", text)
    text = re.sub(r"\bste\.?\b", "sainte", text)
    text = re.sub(r"[-\u2010-\u2015]+", "-", text)
    text = re.sub(r"[^a-z0-9-]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def valid_qid(value: str) -> bool:
    return re.fullmatch(r"Q\d+", value.strip()) is not None


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"name", "see_type", "state_region", "wikidata_id"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise RuntimeError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
        return [dict(row) for row in reader]


def find_local_see(conn, row: dict[str, str]):
    name = row["name"].strip()
    see_type = row["see_type"].strip()
    state_region = row["state_region"].strip()
    with dict_cursor(conn) as cur:
        cur.execute(
            """
            select id, name, see_type, state_region, wikidata_id
            from see
            where lower(name) = lower(%s)
              and lower(see_type) = lower(%s)
              and lower(coalesce(state_region, '')) = lower(%s)
            """,
            (name, see_type, state_region),
        )
        exact = [dict(item) for item in cur.fetchall()]
        if len(exact) == 1:
            return exact[0], False
        if len(exact) > 1:
            return exact, False

        cur.execute(
            """
            select id, name, see_type, state_region, wikidata_id
            from see
            where lower(name) = lower(%s)
              and lower(coalesce(state_region, '')) = lower(%s)
            """,
            (name, state_region),
        )
        state_matches = [dict(item) for item in cur.fetchall()]
        if len(state_matches) == 1:
            return state_matches[0], True
        if len(state_matches) > 1:
            return state_matches, True

        cur.execute("select id, name, see_type, state_region, wikidata_id from see")
        normalized_matches = []
        target_name = normalize(name)
        target_state = normalize(state_region)
        target_type = normalize(see_type)
        for item in cur.fetchall():
            local = dict(item)
            if normalize(local["name"]) == target_name and normalize(local["state_region"]) == target_state:
                if normalize(local["see_type"]) == target_type:
                    return local, False
                normalized_matches.append(local)
        if len(normalized_matches) == 1:
            return normalized_matches[0], True
        return normalized_matches, False


def qid_already_used(conn, wikidata_id: str, current_see_id: str) -> dict | None:
    with dict_cursor(conn) as cur:
        cur.execute(
            "select id, name, see_type, state_region from see where wikidata_id = %s and id <> %s limit 1",
            (wikidata_id, current_see_id),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def main() -> None:
    args = parse_args()
    logger = setup_logger("apply-see-wikidata-overrides")
    path = Path(args.csv_path)
    if not path.is_absolute():
        path = Path.cwd() / path

    rows = load_rows(path)
    conn = connect_db()
    stats = {"updated": 0, "skipped": 0, "same": 0, "missing": 0, "ambiguous": 0, "errored": 0, "type_mismatch": 0}

    try:
        conn.autocommit = False
        for row in rows:
            row = {key: (value or "").strip() for key, value in row.items()}
            wikidata_id = row["wikidata_id"]
            label = f"{row['name']} | {row['see_type']} | {row['state_region']}"
            try:
                if not valid_qid(wikidata_id):
                    stats["errored"] += 1
                    logger.error("INVALID Q-ID: %s -> %s", label, wikidata_id)
                    continue

                local, type_mismatch = find_local_see(conn, row)
                if isinstance(local, list):
                    if local:
                        stats["ambiguous"] += 1
                        logger.error("AMBIGUOUS local match for %s: %s", label, local)
                    else:
                        stats["missing"] += 1
                        logger.error("NO LOCAL SEE: %s", label)
                    continue

                if type_mismatch:
                    stats["type_mismatch"] += 1
                    logger.warning(
                        "TYPE MISMATCH, matching by name/state: CSV %s vs DB %s | %s | %s",
                        row["see_type"],
                        local["see_type"],
                        local["name"],
                        local["state_region"],
                    )

                duplicate = qid_already_used(conn, wikidata_id, local["id"])
                if duplicate:
                    stats["errored"] += 1
                    logger.error("Q-ID already used: %s -> %s by %s", label, wikidata_id, duplicate)
                    continue

                existing = local.get("wikidata_id")
                if existing == wikidata_id:
                    stats["same"] += 1
                    logger.info("SAME: %s already has %s", label, wikidata_id)
                    continue
                if existing and existing != wikidata_id and not args.overwrite:
                    stats["skipped"] += 1
                    logger.warning("SKIP existing different ID: %s has %s, CSV has %s", label, existing, wikidata_id)
                    continue

                stats["updated"] += 1
                logger.info("UPDATE: %s -> %s", label, wikidata_id)
                if not args.dry_run:
                    with conn.cursor() as cur:
                        cur.execute("update see set wikidata_id = %s, updated_at = now() where id = %s", (wikidata_id, local["id"]))
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR applying %s: %s", label, exc)

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info(
            "Summary: updated=%s same=%s skipped=%s missing=%s ambiguous=%s type_mismatch=%s errored=%s dry_run=%s",
            stats["updated"],
            stats["same"],
            stats["skipped"],
            stats["missing"],
            stats["ambiguous"],
            stats["type_mismatch"],
            stats["errored"],
            args.dry_run,
        )
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
