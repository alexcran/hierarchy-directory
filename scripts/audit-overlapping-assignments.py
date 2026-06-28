#!/usr/bin/env python3
"""Audit and optionally fix overlapping active assignments.

Only auto-fixes this narrow case:
  - same person
  - two active assignments where end_date is null
  - same role, and role is diocesan_bishop or archbishop
  - different non-titular sees

The earlier assignment is ended at the later assignment's start_date with end_reason = transferred.
All other non-allowed overlaps are logged for manual review.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import date
import os
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor


AUTO_FIX_ROLES = {"diocesan_bishop", "archbishop"}
ADMIN_COMPATIBLE_ROLES = {"diocesan_bishop", "archbishop"}
AUXILIARY_OR_COADJUTOR_ROLES = {
    "auxiliary",
    "coadjutor",
    "auxiliary_emeritus",
    "coadjutor_emeritus",
}
EMERITUS_ROLES = {
    "archbishop_emeritus",
    "bishop_emeritus",
    "auxiliary_emeritus",
    "coadjutor_emeritus",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Apply the narrow auto-fix. Default is audit only.")
    return parser.parse_args()


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


def full_name(row: dict[str, Any]) -> str:
    return " ".join(part for part in [row["first_name"], row["middle_name"], row["last_name"]] if part)


def describe_assignment(row: dict[str, Any]) -> str:
    return (
        f"{row['role']} @ {row['see_name']} "
        f"(seeType={row['see_type']}, start={row['start_date'] or 'unknown'}, id={row['assignment_id']})"
    )


def is_titular(row: dict[str, Any]) -> bool:
    return row["see_type"] == "titular_see"


def is_allowed_overlap(a: dict[str, Any], b: dict[str, Any]) -> tuple[bool, str | None]:
    roles = {a["role"], b["role"]}

    if is_titular(a) or is_titular(b):
        return True, "titular see assignment can overlap"

    if "apostolic_administrator" in roles and roles & ADMIN_COMPATIBLE_ROLES:
        return True, "apostolic administrator can overlap with ordinary assignment"

    if a["role"] in AUXILIARY_OR_COADJUTOR_ROLES or b["role"] in AUXILIARY_OR_COADJUTOR_ROLES:
        return True, "auxiliary/coadjutor assignment can overlap"

    if a["role"] in EMERITUS_ROLES or b["role"] in EMERITUS_ROLES:
        return True, "emeritus assignment can overlap during transition"

    return False, None


def is_auto_fixable(a: dict[str, Any], b: dict[str, Any]) -> bool:
    return (
        a["role"] == b["role"]
        and a["role"] in AUTO_FIX_ROLES
        and a["see_id"] != b["see_id"]
        and not is_titular(a)
        and not is_titular(b)
        and a["start_date"] is not None
        and b["start_date"] is not None
    )


def earlier_later(a: dict[str, Any], b: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    if a["start_date"] <= b["start_date"]:
        return a, b
    return b, a


def main() -> None:
    args = parse_args()
    load_env_local()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in .env.local")

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.id AS person_id,
                       p.first_name,
                       p.middle_name,
                       p.last_name,
                       a.id AS assignment_id,
                       a.role,
                       a.start_date,
                       a.end_date,
                       a.is_current,
                       s.id AS see_id,
                       s.name AS see_name,
                       s.see_type
                FROM assignment a
                JOIN person p ON p.id = a.person_id
                JOIN see s ON s.id = a.see_id
                WHERE a.end_date IS NULL
                ORDER BY p.last_name NULLS LAST, p.first_name NULLS LAST, a.start_date NULLS LAST
                """
            )
            rows = [dict(row) for row in cur.fetchall()]

        by_person: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in rows:
            by_person[row["person_id"]].append(row)

        allowed: list[tuple[str, str, dict[str, Any], dict[str, Any]]] = []
        review: list[tuple[str, str, dict[str, Any], dict[str, Any]]] = []
        fixes: list[tuple[str, dict[str, Any], dict[str, Any]]] = []
        seen_pairs: set[tuple[str, str]] = set()

        for assignments in by_person.values():
            if len(assignments) < 2:
                continue
            name = full_name(assignments[0])
            for i, a in enumerate(assignments):
                for b in assignments[i + 1 :]:
                    pair_key = tuple(sorted([a["assignment_id"], b["assignment_id"]]))
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    allowed_overlap, reason = is_allowed_overlap(a, b)
                    if allowed_overlap:
                        allowed.append((name, reason or "allowed overlap", a, b))
                    elif is_auto_fixable(a, b):
                        earlier, later = earlier_later(a, b)
                        fixes.append((name, earlier, later))
                    else:
                        review.append((name, "active overlap does not match an allowed or auto-fixable pattern", a, b))

        print(f"Allowed overlaps: {len(allowed)}")
        print(f"Auto-fixable ordinary overlaps: {len(fixes)}")
        print(f"Review needed: {len(review)}")

        if fixes:
            print("\nAuto-fixable:")
            for name, earlier, later in fixes:
                print(f"- {name}: close {describe_assignment(earlier)} at {later['start_date']} before {describe_assignment(later)}")

        if review:
            print("\nReview needed:")
            for name, reason, a, b in review:
                print(f"- {name}: {reason}")
                print(f"  A: {describe_assignment(a)}")
                print(f"  B: {describe_assignment(b)}")

        if args.apply and fixes:
            with conn.cursor() as cur:
                for _name, earlier, later in fixes:
                    cur.execute(
                        """
                        UPDATE assignment
                        SET end_date = %s,
                            end_reason = 'transferred',
                            is_current = false,
                            updated_at = now()
                        WHERE id = %s
                        """,
                        (later["start_date"], earlier["assignment_id"]),
                    )
            conn.commit()
            print(f"\nApplied fixes: {len(fixes)}")
        else:
            conn.rollback()
            print("\nNo changes applied. Re-run with --apply to auto-fix the narrow ordinary-overlap cases.")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
