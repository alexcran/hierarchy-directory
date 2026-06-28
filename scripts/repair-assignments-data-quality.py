#!/usr/bin/env python3
"""Repair assignment timeline data quality issues.

This is a one-off live repair for synthetic transfer rows, open-ended prior
assignments, temporary apostolic administrator assignments, O'Malley/Boston,
current flags, and missing emeritus rows.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime
import logging
import os
from pathlib import Path
import sys
from typing import Any
from uuid import uuid4

import psycopg2
from psycopg2.extras import RealDictCursor


ORDINARY_ROLES = {"ordinary", "diocesan_bishop", "archbishop"}
AUXILIARY_ROLES = {"auxiliary"}
REPAIR_CATEGORIES = {
    "ordinary": ORDINARY_ROLES,
    "auxiliary": AUXILIARY_ROLES,
}
EMERITUS_MAP = {
    "archbishop": "archbishop_emeritus",
    "ordinary": "bishop_emeritus",
    "diocesan_bishop": "bishop_emeritus",
    "auxiliary": "auxiliary_emeritus",
}


def load_env_local() -> None:
    env_path = Path(".env.local")
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def setup_logger() -> logging.Logger:
    log_dir = Path("scripts/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"repair-assignments-data-quality-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
    logger = logging.getLogger("repair_assignments")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s %(levelname)-7s %(message)s")
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter("%(message)s"))

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.info("Log file: %s", log_path)
    return logger


def name(row: dict[str, Any]) -> str:
    return " ".join(part for part in [row.get("first_name"), row.get("middle_name"), row.get("last_name")] if part)


def describe(row: dict[str, Any]) -> str:
    return (
        f"{name(row)} | {row['role']} @ {row['see_name']} "
        f"({row['start_date']} -> {row.get('end_date') or 'open'}, id={row['assignment_id']})"
    )


def fetch_assignments(cur: RealDictCursor) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT a.id AS assignment_id,
               a.person_id,
               a.see_id,
               a.role,
               a.start_date,
               a.end_date,
               a.start_reason,
               a.end_reason,
               a.is_current,
               p.first_name,
               p.middle_name,
               p.last_name,
               p.date_of_death,
               s.name AS see_name,
               s.see_type
        FROM assignment a
        JOIN person p ON p.id = a.person_id
        JOIN see s ON s.id = a.see_id
        ORDER BY p.last_name NULLS LAST, p.first_name NULLS LAST, a.start_date NULLS LAST, a.created_at
        """
    )
    return [dict(row) for row in cur.fetchall()]


def category_for(role: str) -> str | None:
    for category, roles in REPAIR_CATEGORIES.items():
        if role in roles:
            return category
    return None


def is_titular(row: dict[str, Any]) -> bool:
    return row["see_type"] == "titular_see"


def end_assignment(cur: RealDictCursor, assignment_id: str, end_date: Any, end_reason: str) -> None:
    cur.execute(
        """
        UPDATE assignment
        SET end_date = %s,
            end_reason = %s,
            is_current = false,
            updated_at = now()
        WHERE id = %s
        """,
        (end_date, end_reason, assignment_id),
    )


def delete_transferred_rows(cur: RealDictCursor, logger: logging.Logger) -> int:
    cur.execute("SELECT count(*) AS count FROM assignment WHERE start_reason = 'transferred'")
    count = int(cur.fetchone()["count"])
    cur.execute("DELETE FROM assignment WHERE start_reason = 'transferred'")
    logger.info("Deleted synthetic transferred assignments: %s", count)
    return count


def fix_open_prior_assignments(cur: RealDictCursor, logger: logging.Logger) -> tuple[int, list[str]]:
    rows = fetch_assignments(cur)
    by_person_category: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    review: list[str] = []

    for row in rows:
        if row["end_date"] is not None:
            continue
        if row["role"] == "apostolic_administrator":
            continue
        if is_titular(row):
            continue
        category = category_for(row["role"])
        if category:
            by_person_category[(row["person_id"], category)].append(row)

    fixes: list[tuple[dict[str, Any], dict[str, Any]]] = []
    fixed_ids: set[str] = set()
    for (_person_id, _category), assignments in by_person_category.items():
        assignments = sorted(
            [a for a in assignments if a["start_date"] is not None],
            key=lambda a: (a["start_date"], a["assignment_id"]),
        )
        for earlier, later in zip(assignments, assignments[1:]):
            if earlier["assignment_id"] in fixed_ids:
                continue
            if earlier["see_id"] == later["see_id"]:
                review.append(f"Same-see promotion left alone: {describe(earlier)} before {describe(later)}")
                continue
            if later["start_date"] <= earlier["start_date"]:
                review.append(f"Non-chronological open assignments: {describe(earlier)} / {describe(later)}")
                continue
            fixes.append((earlier, later))
            fixed_ids.add(earlier["assignment_id"])

    for earlier, later in fixes:
        end_assignment(cur, earlier["assignment_id"], later["start_date"], "appointed_elsewhere")
        logger.info("Ended prior assignment: %s | end=%s because later %s", describe(earlier), later["start_date"], describe(later))

    return len(fixes), review


def fix_coadjutor_successions(cur: RealDictCursor, logger: logging.Logger) -> int:
    cur.execute(
        """
        UPDATE assignment coadjutor
        SET end_date = ordinary.start_date,
            end_reason = 'succeeded',
            is_current = false,
            updated_at = now()
        FROM assignment ordinary
        WHERE coadjutor.role = 'coadjutor'
          AND coadjutor.end_date IS NULL
          AND ordinary.person_id = coadjutor.person_id
          AND ordinary.see_id = coadjutor.see_id
          AND ordinary.role = ANY(%s)
          AND ordinary.start_date > coadjutor.start_date
        RETURNING coadjutor.id
        """,
        (list(ORDINARY_ROLES),),
    )
    rows = cur.fetchall()
    logger.info("Ended coadjutor assignments on succession: %s", len(rows))
    return len(rows)


def fix_apostolic_administrators(cur: RealDictCursor, logger: logging.Logger) -> int:
    cur.execute(
        """
        SELECT admin.id AS admin_id,
               admin.start_date AS admin_start_date,
               admin.person_id AS admin_person_id,
               admin.see_id,
               p.first_name,
               p.middle_name,
               p.last_name,
               s.name AS see_name,
               ordinary.id AS ordinary_id,
               ordinary.start_date AS ordinary_start_date
        FROM assignment admin
        JOIN person p ON p.id = admin.person_id
        JOIN see s ON s.id = admin.see_id
        JOIN LATERAL (
            SELECT a2.id, a2.start_date
            FROM assignment a2
            WHERE a2.see_id = admin.see_id
              AND a2.role = ANY(%s)
              AND a2.start_date > admin.start_date
            ORDER BY a2.start_date ASC
            LIMIT 1
        ) ordinary ON true
        WHERE admin.role = 'apostolic_administrator'
          AND admin.end_date IS NULL
          AND s.see_type <> 'titular_see'
        ORDER BY s.name, admin.start_date
        """,
        (list(ORDINARY_ROLES),),
    )
    rows = [dict(row) for row in cur.fetchall()]
    for row in rows:
        end_assignment(cur, row["admin_id"], row["ordinary_start_date"], "completed")
        logger.info(
            "Ended apostolic administrator: %s @ %s (%s -> %s)",
            name(row),
            row["see_name"],
            row["admin_start_date"],
            row["ordinary_start_date"],
        )
    return len(rows)


def fix_omalley_boston(cur: RealDictCursor, logger: logging.Logger) -> tuple[int, int]:
    cur.execute(
        """
        SELECT a.id AS assignment_id,
               a.person_id,
               a.see_id,
               a.role,
               a.start_date,
               a.end_date,
               p.first_name,
               p.middle_name,
               p.last_name,
               s.name AS see_name
        FROM assignment a
        JOIN person p ON p.id = a.person_id
        JOIN see s ON s.id = a.see_id
        WHERE s.name = 'Boston'
          AND a.role = ANY(%s)
          AND p.last_name ILIKE %s
        ORDER BY a.start_date DESC
        LIMIT 1
        """,
        (list(ORDINARY_ROLES), "%Malley%"),
    )
    omalley = cur.fetchone()
    if not omalley:
        logger.warning("O'Malley/Boston assignment not found for manual fix.")
        return 0, 0
    omalley = dict(omalley)

    cur.execute(
        """
        SELECT start_date
        FROM assignment
        WHERE see_id = %s
          AND id <> %s
          AND role = ANY(%s)
          AND start_date > %s
        ORDER BY start_date ASC
        LIMIT 1
        """,
        (omalley["see_id"], omalley["assignment_id"], list(ORDINARY_ROLES), omalley["start_date"]),
    )
    successor = cur.fetchone()
    if not successor:
        logger.warning("No later Boston ordinary found after O'Malley; manual review needed.")
        return 0, 0

    end_date = successor["start_date"]
    end_assignment(cur, omalley["assignment_id"], end_date, "resigned")
    logger.info("Set O'Malley Boston assignment end date to %s with reason resigned.", end_date)

    created = ensure_emeritus(
        cur=cur,
        person_id=omalley["person_id"],
        see_id=omalley["see_id"],
        source_role=omalley["role"],
        start_date=end_date,
        logger=logger,
        specific_name="O'Malley",
    )
    return 1, created


def recompute_current(cur: RealDictCursor) -> int:
    cur.execute(
        """
        UPDATE assignment a
        SET is_current = (a.end_date IS NULL AND p.date_of_death IS NULL),
            updated_at = now()
        FROM person p
        WHERE p.id = a.person_id
          AND a.is_current IS DISTINCT FROM (a.end_date IS NULL AND p.date_of_death IS NULL)
        """,
    )
    return cur.rowcount


def ensure_emeritus(
    cur: RealDictCursor,
    person_id: str,
    see_id: str,
    source_role: str,
    start_date: Any,
    logger: logging.Logger,
    specific_name: str | None = None,
) -> int:
    emeritus_role = EMERITUS_MAP.get(source_role)
    if not emeritus_role:
        return 0
    cur.execute(
        """
        SELECT count(*) AS count
        FROM assignment
        WHERE person_id = %s
          AND see_id = %s
          AND role = %s
        """,
        (person_id, see_id, emeritus_role),
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
        (str(uuid4()), person_id, see_id, emeritus_role, start_date),
    )
    label = specific_name or person_id
    logger.info("Created emeritus assignment for %s: %s @ see %s starting %s", label, emeritus_role, see_id, start_date)
    return 1


def create_missing_emeritus(cur: RealDictCursor, logger: logging.Logger) -> int:
    cur.execute(
        """
        WITH ranked AS (
            SELECT a.*,
                   p.date_of_death,
                   row_number() OVER (
                       PARTITION BY a.person_id
                       ORDER BY a.end_date DESC NULLS LAST, a.start_date DESC
                   ) AS rn
            FROM assignment a
            JOIN person p ON p.id = a.person_id
            WHERE a.end_date IS NOT NULL
              AND a.end_reason IN ('retired', 'resigned')
              AND a.role = ANY(%s)
              AND p.date_of_death IS NULL
        )
        SELECT r.id AS assignment_id,
               r.person_id,
               r.see_id,
               r.role,
               r.end_date,
               p.first_name,
               p.middle_name,
               p.last_name,
               s.name AS see_name
        FROM ranked r
        JOIN person p ON p.id = r.person_id
        JOIN see s ON s.id = r.see_id
        WHERE r.rn = 1
          AND NOT EXISTS (
              SELECT 1
              FROM assignment e
              WHERE e.person_id = r.person_id
                AND e.role = CASE
                    WHEN r.role = 'archbishop' THEN 'archbishop_emeritus'
                    WHEN r.role IN ('ordinary', 'diocesan_bishop') THEN 'bishop_emeritus'
                    WHEN r.role = 'auxiliary' THEN 'auxiliary_emeritus'
                    ELSE '__none__'
                END
          )
        ORDER BY p.last_name, p.first_name
        """,
        (list(EMERITUS_MAP.keys()),),
    )
    rows = [dict(row) for row in cur.fetchall()]
    created = 0
    for row in rows:
        created += ensure_emeritus(
            cur=cur,
            person_id=row["person_id"],
            see_id=row["see_id"],
            source_role=row["role"],
            start_date=row["end_date"],
            logger=logger,
            specific_name=f"{name(row)} @ {row['see_name']}",
        )
    return created


def active_ordinary_conflicts(cur: RealDictCursor) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT s.name AS see_name,
               s.see_type,
               count(*) AS active_count,
               string_agg(
                   trim(concat_ws(' ', p.first_name, p.middle_name, p.last_name)) || ' (' || a.role || ', ' || a.start_date::text || ')',
                   '; ' ORDER BY a.start_date
               ) AS holders
        FROM assignment a
        JOIN person p ON p.id = a.person_id
        JOIN see s ON s.id = a.see_id
        WHERE a.is_current = true
          AND a.end_date IS NULL
          AND a.role = ANY(%s)
          AND s.see_type <> 'titular_see'
        GROUP BY s.id, s.name, s.see_type
        HAVING count(*) > 1
        ORDER BY s.name
        """,
        (list(ORDINARY_ROLES),),
    )
    return [dict(row) for row in cur.fetchall()]


def main() -> None:
    load_env_local()
    logger = setup_logger()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in .env.local")

    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                transferred_deleted = delete_transferred_rows(cur, logger)
                assignments_ended, review = fix_open_prior_assignments(cur, logger)
                coadjutors_ended = fix_coadjutor_successions(cur, logger)
                admins_ended = fix_apostolic_administrators(cur, logger)
                omalley_fixed, omalley_emeritus_created = fix_omalley_boston(cur, logger)
                current_updated_before_emeritus = recompute_current(cur)
                emeritus_created = create_missing_emeritus(cur, logger)
                current_updated_after_emeritus = recompute_current(cur)
                conflicts = active_ordinary_conflicts(cur)

        logger.info("")
        logger.info("SUMMARY")
        logger.info("Assignments deleted where startReason='transferred': %s", transferred_deleted)
        logger.info("Assignments ended as appointed_elsewhere: %s", assignments_ended)
        logger.info("Coadjutor assignments ended as succeeded: %s", coadjutors_ended)
        logger.info("Apostolic administrator assignments ended as completed: %s", admins_ended)
        logger.info("O'Malley/Boston assignments fixed: %s", omalley_fixed)
        logger.info("O'Malley emeritus assignments created: %s", omalley_emeritus_created)
        logger.info("Emeritus assignments created total: %s", emeritus_created)
        logger.info("isCurrent rows updated before emeritus creation: %s", current_updated_before_emeritus)
        logger.info("isCurrent rows updated after emeritus creation: %s", current_updated_after_emeritus)
        logger.info("Manual review notes: %s", len(review))
        for item in review[:100]:
            logger.info("REVIEW: %s", item)
        if len(review) > 100:
            logger.info("REVIEW: ... %s additional notes omitted from console/log summary", len(review) - 100)

        logger.info("")
        logger.info("Active sees with multiple diocesan_bishop/archbishop/ordinary assignments: %s", len(conflicts))
        for row in conflicts:
            logger.info("- %s (%s): %s", row["see_name"], row["see_type"], row["holders"])

    except Exception:
        conn.rollback()
        logger.exception("Repair failed; transaction rolled back.")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
