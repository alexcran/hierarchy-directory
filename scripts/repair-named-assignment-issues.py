#!/usr/bin/env python3
"""Repair named assignment issues caused by titular/historical see matching."""

from __future__ import annotations

from datetime import date
import logging
import os
from pathlib import Path
import sys
from typing import Any
from uuid import uuid4

import psycopg2
from psycopg2.extras import RealDictCursor


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
    path = log_dir / "repair-named-assignment-issues.log"
    logger = logging.getLogger("repair_named_assignments")
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


def one(cur: RealDictCursor, sql: str, params: tuple[Any, ...]) -> dict[str, Any]:
    cur.execute(sql, params)
    row = cur.fetchone()
    if not row:
        raise RuntimeError(f"Expected one row for query: {sql} {params}")
    return dict(row)


def person(cur: RealDictCursor, slug: str) -> dict[str, Any]:
    return one(cur, "SELECT * FROM person WHERE slug = %s", (slug,))


def see(cur: RealDictCursor, name: str, rite: str = "Latin", state: str | None = None) -> dict[str, Any]:
    params: list[Any] = [name, rite]
    state_clause = ""
    if state is not None:
        state_clause = "AND s.state_region = %s"
        params.append(state)
    return one(
        cur,
        f"""
        SELECT s.*
        FROM see s
        JOIN rite r ON r.id = s.rite_id
        WHERE s.name = %s AND r.name = %s {state_clause}
        ORDER BY s.created_at
        LIMIT 1
        """,
        tuple(params),
    )


def ensure_maronite_brooklyn(cur: RealDictCursor, logger: logging.Logger) -> dict[str, Any]:
    cur.execute(
        """
        SELECT s.*
        FROM see s
        JOIN rite r ON r.id = s.rite_id
        WHERE s.name = 'Saint Maron of Brooklyn' AND r.name = 'Maronite'
        LIMIT 1
        """
    )
    existing = cur.fetchone()
    if existing:
        return dict(existing)

    cur.execute("SELECT id FROM rite WHERE name = 'Maronite' LIMIT 1")
    rite_row = cur.fetchone()
    if not rite_row:
        rite_id = str(uuid4())
        cur.execute(
            "INSERT INTO rite (id, name, type, created_at) VALUES (%s, 'Maronite', 'Eastern', now())",
            (rite_id,),
        )
    else:
        rite_id = rite_row["id"]

    country_id = one(cur, "SELECT id FROM country WHERE name = 'United States' LIMIT 1", ())["id"]
    see_id = str(uuid4())
    cur.execute(
        """
        INSERT INTO see (
            id, name, slug, see_type, rite_id, country_id, state_region,
            is_metropolitan, is_usccb_territory, created_at, updated_at
        )
        VALUES (
            %s, 'Saint Maron of Brooklyn', 'saint-maron-of-brooklyn', 'eparchy',
            %s, %s, 'New York', false, true, now(), now()
        )
        """,
        (see_id, rite_id, country_id),
    )
    logger.info("Created missing Maronite see: Saint Maron of Brooklyn")
    return one(cur, "SELECT * FROM see WHERE id = %s", (see_id,))


def reopen_auxiliary(cur: RealDictCursor, slug: str, see_name: str, logger: logging.Logger) -> int:
    p = person(cur, slug)
    s = see(cur, see_name)
    cur.execute(
        """
        UPDATE assignment
        SET end_date = NULL,
            end_reason = NULL,
            is_current = true,
            updated_at = now()
        WHERE person_id = %s
          AND see_id = %s
          AND role = 'auxiliary'
          AND end_date = start_date
        """,
        (p["id"], s["id"]),
    )
    if cur.rowcount:
        logger.info("Reopened auxiliary assignment: %s -> %s", slug, see_name)
    return cur.rowcount


def delete_current_assignment(cur: RealDictCursor, slug: str, see_name: str, role: str, logger: logging.Logger, rite: str = "Latin") -> int:
    p = person(cur, slug)
    s = see(cur, see_name, rite=rite)
    cur.execute(
        """
        DELETE FROM assignment
        WHERE person_id = %s
          AND see_id = %s
          AND role = %s
          AND end_date IS NULL
        """,
        (p["id"], s["id"], role),
    )
    if cur.rowcount:
        logger.info("Deleted bad current assignment: %s | %s @ %s", slug, role, see_name)
    return cur.rowcount


def move_assignment(cur: RealDictCursor, slug: str, from_see: str, to_see: str, role: str, logger: logging.Logger, to_state: str | None = None) -> int:
    p = person(cur, slug)
    source = see(cur, from_see)
    target = see(cur, to_see, state=to_state)
    cur.execute(
        """
        UPDATE assignment
        SET see_id = %s,
            role = %s,
            updated_at = now()
        WHERE person_id = %s
          AND see_id = %s
          AND end_date IS NULL
        """,
        (target["id"], role, p["id"], source["id"]),
    )
    if cur.rowcount:
        logger.info("Moved assignment: %s | %s -> %s as %s", slug, from_see, to_see, role)
    return cur.rowcount


def end_current(cur: RealDictCursor, slug: str, see_name: str, end_date: date, end_reason: str, logger: logging.Logger) -> int:
    p = person(cur, slug)
    s = see(cur, see_name)
    cur.execute(
        """
        UPDATE assignment
        SET end_date = %s,
            end_reason = %s,
            is_current = false,
            updated_at = now()
        WHERE person_id = %s
          AND see_id = %s
          AND end_date IS NULL
          AND role IN ('ordinary', 'diocesan_bishop', 'archbishop')
        """,
        (end_date, end_reason, p["id"], s["id"]),
    )
    if cur.rowcount:
        logger.info("Ended current ordinary assignment: %s @ %s -> %s (%s)", slug, see_name, end_date, end_reason)
    return cur.rowcount


def ensure_emeritus(cur: RealDictCursor, slug: str, see_name: str, role: str, start_date: date, logger: logging.Logger) -> int:
    p = person(cur, slug)
    s = see(cur, see_name)
    cur.execute(
        """
        SELECT count(*) AS count
        FROM assignment
        WHERE person_id = %s AND see_id = %s AND role = %s
        """,
        (p["id"], s["id"], role),
    )
    if int(cur.fetchone()["count"]) > 0:
        return 0
    cur.execute(
        """
        INSERT INTO assignment (
            id, person_id, see_id, role, start_date, start_reason,
            end_date, end_reason, is_current, created_at, updated_at
        )
        VALUES (%s, %s, %s, %s, %s, 'retired', NULL, NULL, true, now(), now())
        """,
        (str(uuid4()), p["id"], s["id"], role, start_date),
    )
    logger.info("Created emeritus assignment: %s | %s @ %s from %s", slug, role, see_name, start_date)
    return 1


def fix_same_day_auxiliaries(cur: RealDictCursor, logger: logging.Logger) -> int:
    cur.execute(
        """
        WITH next_assignment AS (
            SELECT aux.id AS aux_id,
                   p.date_of_death,
                   (
                       SELECT min(next_a.start_date)
                       FROM assignment next_a
                       WHERE next_a.person_id = aux.person_id
                         AND next_a.id <> aux.id
                         AND next_a.start_date > aux.start_date
                         AND next_a.role IN ('ordinary', 'diocesan_bishop', 'archbishop', 'coadjutor')
                   ) AS next_start
            FROM assignment aux
            JOIN person p ON p.id = aux.person_id
            WHERE aux.role = 'auxiliary'
              AND aux.end_date = aux.start_date
              AND aux.end_reason = 'transferred'
        )
        UPDATE assignment aux
        SET end_date = next_assignment.next_start,
            end_reason = CASE WHEN next_assignment.next_start IS NULL THEN NULL ELSE 'appointed_elsewhere' END,
            is_current = CASE WHEN next_assignment.next_start IS NULL AND next_assignment.date_of_death IS NULL THEN true ELSE false END,
            updated_at = now()
        FROM next_assignment
        WHERE aux.id = next_assignment.aux_id
        """
    )
    logger.info("Repaired same-day auxiliary artifacts: %s", cur.rowcount)
    return cur.rowcount


def recompute_current(cur: RealDictCursor) -> int:
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
    return cur.rowcount


def active_conflicts(cur: RealDictCursor) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT s.name AS see_name,
               s.see_type,
               string_agg(trim(concat_ws(' ', p.first_name, p.middle_name, p.last_name)) || ' (' || a.role || ', ' || a.start_date::text || ')', '; ' ORDER BY a.start_date) AS holders
        FROM assignment a
        JOIN person p ON p.id = a.person_id
        JOIN see s ON s.id = a.see_id
        WHERE a.is_current = true
          AND a.end_date IS NULL
          AND a.role IN ('ordinary', 'diocesan_bishop', 'archbishop')
          AND s.see_type <> 'titular_see'
        GROUP BY s.id, s.name, s.see_type
        HAVING count(*) > 1
        ORDER BY s.name
        """
    )
    return [dict(row) for row in cur.fetchall()]


def main() -> None:
    load_env()
    logger = setup_logger()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                maronite_brooklyn = ensure_maronite_brooklyn(cur, logger)

                # Repair systematic same-day auxiliary artifacts first.
                same_day_aux_fixed = fix_same_day_auxiliaries(cur, logger)

                deleted = 0
                reopened = 0
                moved = 0
                ended = 0
                emeritus = 0

                # Eastern/rite-specific ordinary.
                mansour = person(cur, "gregory-mansour")
                cur.execute(
                    """
                    UPDATE assignment
                    SET see_id = %s,
                        role = 'diocesan_bishop',
                        end_date = NULL,
                        end_reason = NULL,
                        is_current = true,
                        updated_at = now()
                    WHERE person_id = %s
                      AND role = 'diocesan_bishop'
                      AND end_date IS NULL
                    """,
                    (maronite_brooklyn["id"], mansour["id"]),
                )
                moved += cur.rowcount
                logger.info("Moved Mansour to Maronite Eparchy of Saint Maron of Brooklyn.")

                # Bad titular/historical aliases that created false current ordinaries.
                for slug, bad_see, good_see in [
                    ("gary-studniewski", "Fargo", "Washington"),
                    ("eduardo-nevares", "Jackson", "Phoenix"),
                    ("joel-konzen", "Kansas City in Kansas", "Atlanta"),
                    ("william-waltersheid", "San Francisco", "Pittsburgh"),
                ]:
                    deleted += delete_current_assignment(cur, slug, bad_see, "diocesan_bishop", logger)
                    reopened += reopen_auxiliary(cur, slug, good_see, logger)

                # Other named cross-see fixes.
                moved += move_assignment(cur, "john-deshotel", "Lafayette in Indiana", "Lafayette in Louisiana", "diocesan_bishop", logger, to_state="Louisiana")
                reopened += reopen_auxiliary(cur, "john-deshotel", "Dallas", logger)

                deleted += delete_current_assignment(cur, "salvatore-cordileone", "Jackson", "diocesan_bishop", logger)
                reopened += reopen_auxiliary(cur, "salvatore-cordileone", "San Diego", logger)

                deleted += delete_current_assignment(cur, "gregory-kelly", "Fargo", "diocesan_bishop", logger)
                reopened += reopen_auxiliary(cur, "gregory-kelly", "Dallas", logger)

                # Emeritus/correct current ordinary cases.
                ended += end_current(cur, "martin-holley", "Memphis", date(2018, 10, 24), "retired", logger)
                emeritus += ensure_emeritus(cur, "martin-holley", "Memphis", "bishop_emeritus", date(2018, 10, 24), logger)

                ended += end_current(cur, "joseph-strickland", "Tyler", date(2023, 11, 11), "retired", logger)
                emeritus += ensure_emeritus(cur, "joseph-strickland", "Tyler", "bishop_emeritus", date(2023, 11, 11), logger)

                # New Orleans: Aymond is emeritus as of Checchio's appointment.
                ended += end_current(cur, "gregory-aymond", "New Orleans", date(2026, 2, 11), "retired", logger)
                emeritus += ensure_emeritus(cur, "gregory-aymond", "New Orleans", "archbishop_emeritus", date(2026, 2, 11), logger)

                current_updated = recompute_current(cur)
                conflicts = active_conflicts(cur)

        logger.info("")
        logger.info("SUMMARY")
        logger.info("Same-day auxiliary artifacts fixed: %s", same_day_aux_fixed)
        logger.info("Bad current ordinary assignments deleted: %s", deleted)
        logger.info("Auxiliary assignments reopened/extended: %s", reopened)
        logger.info("Assignments moved to correct see: %s", moved)
        logger.info("Ordinary assignments ended: %s", ended)
        logger.info("Emeritus assignments created: %s", emeritus)
        logger.info("isCurrent rows recomputed/changed: %s", current_updated)
        logger.info("Remaining active ordinary conflicts: %s", len(conflicts))
        for row in conflicts:
            logger.info("- %s (%s): %s", row["see_name"], row["see_type"], row["holders"])
    except Exception:
        conn.rollback()
        logger.exception("Repair failed; rolled back.")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
