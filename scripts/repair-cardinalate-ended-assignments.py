#!/usr/bin/env python3
"""Repair assignments incorrectly ended on cardinalate creation dates."""

from __future__ import annotations

from datetime import date
import logging
import os
from pathlib import Path
import sys
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor


ORDINARY_ROLES = ("ordinary", "diocesan_bishop", "archbishop")
REPAIR_ROLES = ORDINARY_ROLES + ("auxiliary", "coadjutor")


def load_env() -> None:
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def setup_logger() -> logging.Logger:
    log_dir = Path("scripts/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    path = log_dir / "repair-cardinalate-ended-assignments.log"
    logger = logging.getLogger("repair_cardinalate_endings")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    formatter = logging.Formatter("%(asctime)s %(levelname)-7s %(message)s")
    fh = logging.FileHandler(path, encoding="utf-8")
    fh.setFormatter(formatter)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(fh)
    logger.addHandler(sh)
    logger.info("Log file: %s", path)
    return logger


def full_name(row: dict[str, Any]) -> str:
    return " ".join(part for part in [row["first_name"], row["middle_name"], row["last_name"]] if part)


def fetch_false_endings(cur: RealDictCursor) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT p.id AS person_id,
               p.slug,
               p.first_name,
               p.middle_name,
               p.last_name,
               p.date_of_death,
               c.date_created,
               a.id AS assignment_id,
               a.role,
               a.start_date,
               a.end_date,
               a.end_reason,
               s.id AS see_id,
               s.name AS see_name
        FROM cardinalate c
        JOIN person p ON p.id = c.person_id
        JOIN assignment a ON a.person_id = p.id
        JOIN see s ON s.id = a.see_id
        WHERE a.end_date = c.date_created
          AND a.role = ANY(%s)
        ORDER BY c.date_created DESC, p.last_name, p.first_name
        """,
        (list(REPAIR_ROLES),),
    )
    return [dict(row) for row in cur.fetchall()]


def infer_replacement_end(cur: RealDictCursor, row: dict[str, Any]) -> tuple[date | None, str | None, str]:
    candidates: list[tuple[date, str, str]] = []

    cur.execute(
        """
        SELECT min(start_date) AS next_start
        FROM assignment
        WHERE person_id = %s
          AND id <> %s
          AND role = ANY(%s)
          AND start_date > %s
        """,
        (row["person_id"], row["assignment_id"], list(REPAIR_ROLES), row["date_created"]),
    )
    own_next = cur.fetchone()["next_start"]
    if own_next:
        candidates.append((own_next, "transferred", "next assignment for same person"))

    if row["role"] in ORDINARY_ROLES:
        cur.execute(
            """
            SELECT min(start_date) AS successor_start
            FROM assignment
            WHERE see_id = %s
              AND person_id <> %s
              AND role = ANY(%s)
              AND start_date > %s
            """,
            (row["see_id"], row["person_id"], list(ORDINARY_ROLES), row["date_created"]),
        )
        successor_start = cur.fetchone()["successor_start"]
        if successor_start:
            candidates.append((successor_start, "retired", "next ordinary for same see"))

    if candidates:
        candidates.sort(key=lambda item: item[0])
        return candidates[0]

    if row["date_of_death"]:
        return row["date_of_death"], "died", "date of death; no later assignment/successor found"

    return None, None, "alive with no later assignment/successor found"


def main() -> None:
    load_env()
    logger = setup_logger()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                rows = fetch_false_endings(cur)
                logger.info("Assignments ending on cardinalate creation date: %s", len(rows))

                repaired = 0
                for row in rows:
                    new_end, new_reason, source = infer_replacement_end(cur, row)
                    cur.execute(
                        """
                        UPDATE assignment
                        SET end_date = %s,
                            end_reason = %s,
                            is_current = (%s IS NULL AND %s IS NULL),
                            updated_at = now()
                        WHERE id = %s
                        """,
                        (new_end, new_reason, new_end, row["date_of_death"], row["assignment_id"]),
                    )
                    repaired += cur.rowcount
                    logger.info(
                        "%s | %s @ %s was ended on cardinalate date %s; new end=%s reason=%s (%s)",
                        full_name(row),
                        row["role"],
                        row["see_name"],
                        row["date_created"],
                        new_end,
                        new_reason,
                        source,
                    )

                cur.execute(
                    """
                    UPDATE assignment a
                    SET is_current = (a.end_date IS NULL AND p.date_of_death IS NULL),
                        updated_at = now()
                    FROM person p
                    WHERE p.id = a.person_id
                      AND a.is_current IS DISTINCT FROM (a.end_date IS NULL AND p.date_of_death IS NULL)
                    """
                )
                current_changed = cur.rowcount

                cur.execute(
                    """
                    SELECT s.name AS see_name,
                           string_agg(trim(concat_ws(' ', p.first_name, p.middle_name, p.last_name)) || ' (' || a.role || ', ' || a.start_date::text || ')', '; ' ORDER BY a.start_date) AS holders
                    FROM assignment a
                    JOIN person p ON p.id = a.person_id
                    JOIN see s ON s.id = a.see_id
                    WHERE a.is_current = true
                      AND a.end_date IS NULL
                      AND a.role = ANY(%s)
                      AND s.see_type <> 'titular_see'
                    GROUP BY s.id, s.name
                    HAVING count(*) > 1
                    ORDER BY s.name
                    """,
                    (list(ORDINARY_ROLES),),
                )
                conflicts = [dict(row) for row in cur.fetchall()]

        logger.info("")
        logger.info("SUMMARY")
        logger.info("Assignments repaired: %s", repaired)
        logger.info("isCurrent rows changed by recompute: %s", current_changed)
        logger.info("Remaining active ordinary conflicts: %s", len(conflicts))
        for conflict in conflicts:
            logger.info("- %s: %s", conflict["see_name"], conflict["holders"])
    except Exception:
        conn.rollback()
        logger.exception("Repair failed; rolled back.")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
