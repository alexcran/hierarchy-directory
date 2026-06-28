#!/usr/bin/env python3
"""Generate a Person data quality report."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from wikidata_import_common import connect_db, dict_cursor

FIELDS = [
    ("first_name", "firstName"),
    ("middle_name", "middleName"),
    ("last_name", "lastName"),
    ("suffix", "suffix"),
    ("religious_order_id", "religiousOrderId"),
    ("date_of_birth", "dateOfBirth"),
    ("place_of_birth", "placeOfBirth"),
    ("country_of_birth_id", "countryOfBirthId"),
    ("date_of_death", "dateOfDeath"),
    ("rite_id", "riteId"),
    ("slug", "slug"),
    ("style_of_address", "styleOfAddress"),
    ("portrait_url", "portraitUrl"),
    ("photo_credit", "photoCredit"),
    ("photo_license", "photoLicense"),
    ("motto", "motto"),
    ("catholic_hierarchy_id", "catholicHierarchyId"),
    ("gcatholic_id", "gcatholicId"),
    ("wikidata_id", "wikidataId"),
    ("viaf_id", "viafId"),
    ("wikipedia_url", "wikipediaUrl"),
    ("diocesan_bio_url", "diocesanBioUrl"),
    ("nationality", "nationality"),
    ("bio_summary", "bioSummary"),
]


def present(value) -> bool:
    return value is not None and value != ""


def pct(count: int, total: int) -> str:
    if total == 0:
        return "0.0%"
    return f"{(count / total) * 100:.1f}%"


def display_name(row) -> str:
    parts = [row["first_name"], row["middle_name"], row["last_name"]]
    return " ".join(str(part) for part in parts if part)


def main() -> None:
    conn = connect_db()
    try:
        with dict_cursor(conn) as cur:
            cur.execute(
                """
                select
                  p.*,
                  exists(select 1 from assignment a where a.person_id = p.id) as has_assignment,
                  exists(select 1 from cardinalate c where c.person_id = p.id) as has_cardinalate,
                  exists(select 1 from episcopal_consecration ec where ec.person_id = p.id) as has_consecration
                from person p
                order by p.last_name, p.first_name, p.middle_name
                """
            )
            people = [dict(row) for row in cur.fetchall()]

        total = len(people)
        counts = {label: 0 for _, label in FIELDS}
        relationship_counts = {"hasAssignment": 0, "hasCardinalate": 0, "hasConsecration": 0}

        rows = []
        for person in people:
            populated = []
            missing = []
            for column, label in FIELDS:
                if present(person.get(column)):
                    populated.append(label)
                    counts[label] += 1
                else:
                    missing.append(label)

            if person["has_assignment"]:
                relationship_counts["hasAssignment"] += 1
            if person["has_cardinalate"]:
                relationship_counts["hasCardinalate"] += 1
            if person["has_consecration"]:
                relationship_counts["hasConsecration"] += 1

            rows.append((display_name(person), populated, missing, person))

        out_dir = Path(__file__).resolve().parent / "logs"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"person-data-quality-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"

        lines = [
            "# Person Data Quality Report",
            "",
            f"Generated: {datetime.now().isoformat(timespec='seconds')}",
            f"Total Person records: {total}",
            "",
            "## Field Completeness",
            "",
            "| Field | Populated | Missing | Percent populated |",
            "|---|---:|---:|---:|",
        ]
        for _, label in FIELDS:
            populated_count = counts[label]
            lines.append(f"| {label} | {populated_count} | {total - populated_count} | {pct(populated_count, total)} |")

        lines.extend(
            [
                "",
                "## Relationship Coverage",
                "",
                "| Relationship | Count | Percent |",
                "|---|---:|---:|",
                f"| At least one Assignment matched to a See | {relationship_counts['hasAssignment']} | {pct(relationship_counts['hasAssignment'], total)} |",
                f"| Cardinalate | {relationship_counts['hasCardinalate']} | {pct(relationship_counts['hasCardinalate'], total)} |",
                f"| Episcopal consecration | {relationship_counts['hasConsecration']} | {pct(relationship_counts['hasConsecration'], total)} |",
                "",
                "## Per-Person Field Inventory",
                "",
            ]
        )

        for name, populated, missing, person in rows:
            lines.extend(
                [
                    f"### {name or person['id']}",
                    "",
                    f"- ID: `{person['id']}`",
                    f"- Populated: {', '.join(populated) if populated else 'none'}",
                    f"- Null: {', '.join(missing) if missing else 'none'}",
                    f"- Has assignment matched to See: {'yes' if person['has_assignment'] else 'no'}",
                    f"- Has cardinalate: {'yes' if person['has_cardinalate'] else 'no'}",
                    f"- Has consecration: {'yes' if person['has_consecration'] else 'no'}",
                    "",
                ]
            )

        out_path.write_text("\n".join(lines), encoding="utf-8")
        print(out_path)
        print(f"total={total}")
        for _, label in FIELDS:
            print(f"{label}={counts[label]}/{total} ({pct(counts[label], total)})")
        for label, count in relationship_counts.items():
            print(f"{label}={count}/{total} ({pct(count, total)})")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
