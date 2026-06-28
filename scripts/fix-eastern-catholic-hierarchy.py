#!/usr/bin/env python3
"""Repair Eastern Catholic metropolitan relationships.

This keeps Eastern Catholic jurisdictions out of the Latin province system,
while preserving the Ruthenian and Ukrainian US metropolitan structures.
"""

from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor


ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "scripts" / "logs"


def load_database_url() -> str:
    env_path = ROOT / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key == "DATABASE_URL":
                return value.strip().strip('"').strip("'")
    value = os.environ.get("DATABASE_URL")
    if value:
        return value
    raise RuntimeError("DATABASE_URL was not found in .env.local or the environment")


def setup_logger() -> logging.Logger:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("fix-eastern-catholic-hierarchy")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    logger.addHandler(console)

    file_handler = logging.FileHandler(LOG_DIR / "fix-eastern-catholic-hierarchy.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger


def find_see(cur: RealDictCursor, name: str, rite_name: str) -> dict | None:
    cur.execute(
        """
        SELECT s.id, s.name, s.slug, s.see_type, s.is_metropolitan, s.metropolitan_see_id,
               r.name AS rite_name
        FROM see s
        JOIN rite r ON r.id = s.rite_id
        WHERE lower(s.name) = lower(%s)
          AND lower(r.name) = lower(%s)
          AND s.date_suppressed IS NULL
        LIMIT 1
        """,
        (name, rite_name),
    )
    return cur.fetchone()


def update_see(cur: RealDictCursor, see_id: str, is_metropolitan: bool, metropolitan_see_id: str | None) -> int:
    cur.execute(
        """
        UPDATE see
        SET is_metropolitan = %s,
            metropolitan_see_id = %s,
            updated_at = now()
        WHERE id = %s
          AND (is_metropolitan IS DISTINCT FROM %s
               OR metropolitan_see_id IS DISTINCT FROM %s)
        """,
        (is_metropolitan, metropolitan_see_id, see_id, is_metropolitan, metropolitan_see_id),
    )
    return cur.rowcount


def main() -> int:
    parser = argparse.ArgumentParser(description="Repair Eastern Catholic see hierarchy relationships.")
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing them.")
    args = parser.parse_args()

    logger = setup_logger()
    conn = psycopg2.connect(load_database_url())
    try:
      with conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT s.name, r.name AS rite_name, m.name AS metropolitan_name, mr.name AS metropolitan_rite
                FROM see s
                JOIN rite r ON r.id = s.rite_id
                LEFT JOIN see m ON m.id = s.metropolitan_see_id
                LEFT JOIN rite mr ON mr.id = m.rite_id
                WHERE lower(r.name) <> 'latin'
                  AND s.metropolitan_see_id IS NOT NULL
                  AND lower(coalesce(mr.name, '')) = 'latin'
                ORDER BY r.name, s.name
                """
            )
            bad_latin_links = cur.fetchall()
            for row in bad_latin_links:
                logger.info(
                    "CLEAR bad Latin metropolitan link: %s (%s) -> %s (%s)",
                    row["name"],
                    row["rite_name"],
                    row["metropolitan_name"],
                    row["metropolitan_rite"],
                )
            if bad_latin_links and not args.dry_run:
                cur.execute(
                    """
                    UPDATE see s
                    SET metropolitan_see_id = NULL,
                        is_metropolitan = false,
                        updated_at = now()
                    FROM rite r, see m, rite mr
                    WHERE r.id = s.rite_id
                      AND m.id = s.metropolitan_see_id
                      AND mr.id = m.rite_id
                      AND lower(r.name) <> 'latin'
                      AND lower(mr.name) = 'latin'
                    """
                )
                logger.info("Cleared %s Eastern-to-Latin metropolitan links", cur.rowcount)

            changed = 0
            missing: list[str] = []

            ruthenian_metro = find_see(cur, "Pittsburgh", "Ruthenian")
            ukrainian_metro = find_see(cur, "Philadelphia", "Ukrainian")
            if not ruthenian_metro:
                missing.append("Ruthenian Archeparchy of Pittsburgh")
            if not ukrainian_metro:
                missing.append("Ukrainian Archeparchy of Philadelphia")

            assignments = []
            if ruthenian_metro:
                assignments.append((ruthenian_metro, True, None))
                for name in ("Passaic", "Parma", "Phoenix", "Van Nuys"):
                    see = find_see(cur, name, "Ruthenian")
                    if see:
                        assignments.append((see, False, ruthenian_metro["id"]))
            if ukrainian_metro:
                assignments.append((ukrainian_metro, True, None))
                for name in ("Stamford", "Saint Josaphat in Parma"):
                    see = find_see(cur, name, "Ukrainian")
                    if see:
                        assignments.append((see, False, ukrainian_metro["id"]))

            for see, is_metropolitan, metro_id in assignments:
                metro_name = "none"
                if metro_id == ruthenian_metro["id"] if ruthenian_metro else False:
                    metro_name = "Pittsburgh"
                if metro_id == ukrainian_metro["id"] if ukrainian_metro else False:
                    metro_name = "Philadelphia"
                logger.info(
                    "SET %s (%s): is_metropolitan=%s metropolitan=%s",
                    see["name"],
                    see["rite_name"],
                    is_metropolitan,
                    metro_name,
                )
                if not args.dry_run:
                    changed += update_see(cur, see["id"], is_metropolitan, metro_id)

            protected_names = {
                ("Ruthenian", "Pittsburgh"),
                ("Ruthenian", "Passaic"),
                ("Ruthenian", "Parma"),
                ("Ruthenian", "Phoenix"),
                ("Ruthenian", "Van Nuys"),
                ("Ukrainian", "Philadelphia"),
                ("Ukrainian", "Stamford"),
                ("Ukrainian", "Saint Josaphat in Parma"),
            }
            cur.execute(
                """
                SELECT s.id, s.name, r.name AS rite_name
                FROM see s
                JOIN rite r ON r.id = s.rite_id
                WHERE lower(r.name) <> 'latin'
                  AND s.date_suppressed IS NULL
                ORDER BY r.name, s.name
                """
            )
            eastern = cur.fetchall()
            for see in eastern:
                if (see["rite_name"], see["name"]) in protected_names:
                    continue
                logger.info("SET standalone Eastern see: %s (%s)", see["name"], see["rite_name"])
                if not args.dry_run:
                    changed += update_see(cur, see["id"], False, None)

            if missing:
                for item in missing:
                    logger.warning("Missing expected see: %s", item)

            if args.dry_run:
                conn.rollback()
            logger.info(
                "Summary: bad_latin_links=%s hierarchy_updates=%s missing=%s dry_run=%s",
                len(bad_latin_links),
                changed,
                len(missing),
                args.dry_run,
            )
      return 0
    except Exception:
      conn.rollback()
      logger.exception("Failed; transaction rolled back")
      return 1
    finally:
      conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
