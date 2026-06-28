#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor


NAMES = [
    ("Aymond", None),
    ("Mansour", None),
    ("Brennan", "Robert"),
    ("Folda", None),
    ("Studniewski", None),
    ("Nevares", None),
    ("Kopacz", None),
    ("Konzen", None),
    ("McKnight", None),
    ("Doherty", None),
    ("Deshotel", None),
    ("Holley", None),
    ("Talley", None),
    ("Waltersheid", None),
    ("Cordileone", None),
    ("Strickland", None),
    ("Kelly", "Gregory"),
]


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
        for last, first in NAMES:
            if first:
                cur.execute(
                    """
                    SELECT id, first_name, middle_name, last_name, slug, date_of_death
                    FROM person
                    WHERE last_name ILIKE %s AND first_name ILIKE %s
                    ORDER BY first_name
                    """,
                    (f"%{last}%", f"%{first}%"),
                )
            else:
                cur.execute(
                    """
                    SELECT id, first_name, middle_name, last_name, slug, date_of_death
                    FROM person
                    WHERE last_name ILIKE %s
                    ORDER BY first_name
                    """,
                    (f"%{last}%",),
                )
            people = cur.fetchall()
            print(f"\n=== {first or ''} {last} ({len(people)}) ===")
            for p in people:
                print(f"{p['first_name']} {p['middle_name'] or ''} {p['last_name']} | slug={p['slug']} | death={p['date_of_death']} | id={p['id']}")
                cur.execute(
                    """
                    SELECT a.id, a.role, a.start_date, a.installed_date, a.end_date, a.start_reason, a.end_reason, a.is_current,
                           s.name AS see_name, s.see_type, s.state_region, r.name AS rite_name
                    FROM assignment a
                    JOIN see s ON s.id = a.see_id
                    JOIN rite r ON r.id = s.rite_id
                    WHERE a.person_id = %s
                    ORDER BY a.start_date, a.created_at
                    """,
                    (p["id"],),
                )
                for a in cur.fetchall():
                    print(
                        f"  {a['id']} | {a['role']} | {a['see_name']} ({a['see_type']}, {a['rite_name']}, {a['state_region']}) "
                        f"| {a['start_date']} -> {a['end_date']} | start={a['start_reason']} end={a['end_reason']} current={a['is_current']}"
                    )

        print("\n=== relevant sees ===")
        for term in ["Brooklyn", "Fargo", "Washington", "Phoenix", "Jackson", "Atlanta", "Kansas City", "Lafayette", "Memphis", "Pittsburgh", "San Francisco", "Tyler", "New Orleans", "Austin"]:
            cur.execute(
                """
                SELECT s.id, s.name, s.slug, s.see_type, s.state_region, r.name AS rite_name
                FROM see s
                JOIN rite r ON r.id = s.rite_id
                WHERE s.name ILIKE %s
                ORDER BY s.name, r.name
                """,
                (f"%{term}%",),
            )
            rows = cur.fetchall()
            print(f"\n-- {term} ({len(rows)})")
            for s in rows:
                print(f"  {s['id']} | {s['name']} | {s['see_type']} | {s['rite_name']} | {s['state_region']} | slug={s['slug']}")
    conn.close()


if __name__ == "__main__":
    main()
