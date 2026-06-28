#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
import os
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor


def load_env() -> None:
    for line in Path(".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> None:
    load_env()
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    with conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        deleted = 0
        # False titular/historical rows that had already been ended.
        for slug, see_name in [
            ("salvatore-cordileone", "Jackson"),
            ("gregory-kelly", "Fargo"),
        ]:
            cur.execute(
                """
                DELETE FROM assignment a
                USING person p, see s
                WHERE a.person_id = p.id
                  AND a.see_id = s.id
                  AND p.slug = %s
                  AND s.name = %s
                  AND a.role = 'diocesan_bishop'
                """,
                (slug, see_name),
            )
            print(f"Deleted false historical assignment for {slug} @ {see_name}: {cur.rowcount}")
            deleted += cur.rowcount

        # Aymond's New Orleans archbishop assignment was incorrectly ended by
        # his concurrent Alexandria administrator role. End it at Checchio's
        # appointment instead.
        cur.execute(
            """
            UPDATE assignment a
            SET end_date = %s,
                end_reason = 'retired',
                is_current = false,
                updated_at = now()
            FROM person p, see s
            WHERE a.person_id = p.id
              AND a.see_id = s.id
              AND p.slug = 'gregory-aymond'
              AND s.name = 'New Orleans'
              AND a.role = 'archbishop'
            """,
            (date(2026, 2, 11),),
        )
        print(f"Updated Aymond New Orleans archbishop assignment: {cur.rowcount}")

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
        print(f"Recomputed isCurrent rows changed: {cur.rowcount}")

        cur.execute(
            """
            SELECT s.name AS see_name,
                   string_agg(trim(concat_ws(' ', p.first_name, p.middle_name, p.last_name)) || ' (' || a.role || ')', '; ' ORDER BY a.start_date) AS holders
            FROM assignment a
            JOIN person p ON p.id = a.person_id
            JOIN see s ON s.id = a.see_id
            WHERE a.is_current = true
              AND a.end_date IS NULL
              AND a.role IN ('ordinary', 'diocesan_bishop', 'archbishop')
              AND s.see_type <> 'titular_see'
            GROUP BY s.id, s.name
            HAVING count(*) > 1
            ORDER BY s.name
            """
        )
        conflicts = cur.fetchall()
        print(f"Remaining active ordinary conflicts: {len(conflicts)}")
        for row in conflicts:
            print(f"- {row['see_name']}: {row['holders']}")
    conn.close()


if __name__ == "__main__":
    main()
