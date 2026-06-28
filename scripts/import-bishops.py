#!/usr/bin/env python3
"""Import US-connected Catholic bishops from Wikidata."""

from __future__ import annotations

import re

from wikidata_import_common import (
    batched,
    commons_file_url,
    common_args,
    connect_db,
    dict_cursor,
    ensure_rite,
    existing_by_wikidata,
    iso_date,
    new_id,
    qid,
    setup_logger,
    slugify,
    sparql,
    unique_slug,
    value,
)

BATCH_SIZE = 10


def bishop_query(known_see_qids: list[str] | None = None) -> str:
    see_values = " ".join(f"wd:{item}" for item in known_see_qids or [])
    us_filter = "?person wdt:P27 wd:Q30 ."
    if known_see_qids:
        us_filter = f"""
        VALUES ?knownSee {{ {see_values} }}
        ?positionStatement (pq:P1001|pq:P642|pq:P276|pq:P361|pq:P131) ?knownSee .
        """
    return f"""
SELECT DISTINCT ?person ?personLabel ?birthDate ?deathDate ?birthPlaceLabel ?birthCountryLabel
       ?orderLabel ?motto ?image ?chId ?gcatholicId ?viafId ?wikipediaUrl
       ?position ?positionLabel ?see ?seeLabel ?startDate ?endDate ?appointedByLabel
       ?consecrator ?consecratorLabel ?cardinalPositionLabel ?cardinalStart ?cardinalOrderLabel ?titularChurchLabel
WHERE {{
  ?person wdt:P31 wd:Q5 ;
          p:P39 ?positionStatement .
  ?positionStatement ps:P39 ?position .
  ?position rdfs:label ?positionLabel FILTER(LANG(?positionLabel) = "en")
  FILTER(
    CONTAINS(LCASE(STR(?positionLabel)), "bishop") ||
    CONTAINS(LCASE(STR(?positionLabel)), "archbishop") ||
    CONTAINS(LCASE(STR(?positionLabel)), "eparch") ||
    CONTAINS(LCASE(STR(?positionLabel)), "apostolic administrator")
  )
  {us_filter}

  OPTIONAL {{ ?person wdt:P569 ?birthDate . }}
  OPTIONAL {{ ?person wdt:P570 ?deathDate . }}
  OPTIONAL {{ ?person wdt:P19 ?birthPlace . OPTIONAL {{ ?birthPlace wdt:P17 ?birthCountry . }} }}
  OPTIONAL {{ ?person wdt:P611 ?order . }}
  OPTIONAL {{ ?person wdt:P1451 ?motto . }}
  OPTIONAL {{ ?person wdt:P18 ?image . }}
  OPTIONAL {{ ?person wdt:P1047 ?chId . }}
  OPTIONAL {{ ?person wdt:P2600 ?gcatholicId . }}
  OPTIONAL {{ ?person wdt:P214 ?viafId . }}
  OPTIONAL {{ ?person wdt:P1598 ?consecrator . }}
  OPTIONAL {{
    ?wikipediaUrl schema:about ?person ;
                  schema:isPartOf <https://en.wikipedia.org/> .
  }}

  OPTIONAL {{ ?positionStatement (pq:P1001|pq:P642|pq:P276|pq:P361|pq:P131) ?see . }}
  OPTIONAL {{ ?positionStatement pq:P580 ?startDate . }}
  OPTIONAL {{ ?positionStatement pq:P582 ?endDate . }}
  OPTIONAL {{ ?positionStatement pq:P748 ?appointedBy . }}

  OPTIONAL {{
    ?person p:P39 ?cardinalStatement .
    ?cardinalStatement ps:P39 ?cardinalPosition .
    ?cardinalPosition rdfs:label ?cardinalPositionLabel FILTER(LANG(?cardinalPositionLabel) = "en")
    FILTER(CONTAINS(LCASE(STR(?cardinalPositionLabel)), "cardinal"))
    OPTIONAL {{ ?cardinalStatement pq:P580 ?cardinalStart . }}
    OPTIONAL {{ ?cardinalStatement pq:P2868 ?cardinalOrder . }}
    OPTIONAL {{ ?cardinalStatement pq:P642 ?titularChurch . }}
  }}

  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
ORDER BY ?personLabel
"""


def parse_name(label: str) -> tuple[str, str | None, str]:
    cleaned = re.sub(r"\b(Cardinal|Bishop|Archbishop|Most Rev\.?|His Eminence|His Excellency)\b", "", label, flags=re.I)
    cleaned = re.sub(r",.*$", "", cleaned).strip()
    parts = [part for part in cleaned.split() if part]
    if not parts:
        return "Unknown", None, "Unknown"
    if len(parts) == 1:
        return parts[0], None, parts[0]
    if len(parts) == 2:
        return parts[0], None, parts[1]
    return parts[0], " ".join(parts[1:-1]), parts[-1]


def role_for(position_label: str) -> str:
    text = position_label.lower()
    if "coadjutor" in text:
        return "coadjutor"
    if "auxiliary" in text:
        return "auxiliary"
    if "apostolic administrator" in text:
        return "apostolic_administrator"
    if "archbishop" in text or "archeparch" in text:
        return "archbishop"
    if "eparch" in text:
        return "eparch"
    return "diocesan_bishop"


def cardinal_order(label: str | None) -> str:
    text = (label or "").lower()
    if "bishop" in text:
        return "bishop"
    if "deacon" in text:
        return "deacon"
    return "priest"


def aggregate(rows):
    people = {}
    for row in rows:
        person_qid = qid(value(row, "person"))
        if not person_qid:
            continue
        item = people.setdefault(
            person_qid,
            {
                "wikidata_id": person_qid,
                "label": value(row, "personLabel") or person_qid,
                "birth_date": iso_date(value(row, "birthDate")),
                "death_date": iso_date(value(row, "deathDate")),
                "birth_place": value(row, "birthPlaceLabel"),
                "birth_country": value(row, "birthCountryLabel"),
                "religious_order": value(row, "orderLabel"),
                "motto": value(row, "motto"),
                "portrait_url": commons_file_url(value(row, "image")),
                "catholic_hierarchy_id": value(row, "chId"),
                "gcatholic_id": value(row, "gcatholicId"),
                "viaf_id": value(row, "viafId"),
                "wikipedia_url": value(row, "wikipediaUrl"),
                "consecrator_qid": qid(value(row, "consecrator")),
                "consecrator_label": value(row, "consecratorLabel"),
                "positions": [],
                "cardinalate": None,
            },
        )
        position_qid = qid(value(row, "position"))
        if position_qid:
            position = {
                "position_qid": position_qid,
                "position_label": value(row, "positionLabel") or "",
                "see_qid": qid(value(row, "see")),
                "see_label": value(row, "seeLabel"),
                "start_date": iso_date(value(row, "startDate")),
                "end_date": iso_date(value(row, "endDate")),
                "appointed_by": value(row, "appointedByLabel"),
            }
            if position not in item["positions"]:
                item["positions"].append(position)
        if value(row, "cardinalPositionLabel"):
            item["cardinalate"] = {
                "date_created": iso_date(value(row, "cardinalStart")),
                "cardinal_order": cardinal_order(value(row, "cardinalOrderLabel") or value(row, "cardinalPositionLabel")),
                "titular_church": value(row, "titularChurchLabel"),
            }
    return people


def find_country(conn, country_name: str | None) -> str | None:
    if not country_name:
        return None
    with dict_cursor(conn) as cur:
        cur.execute("select id from country where lower(name) = lower(%s) limit 1", (country_name,))
        row = cur.fetchone()
        return row["id"] if row else None


def find_religious_order(conn, order_name: str | None) -> str | None:
    if not order_name:
        return None
    needle = f"%{order_name.lower()}%"
    with dict_cursor(conn) as cur:
        cur.execute(
            """
            select id from religious_order
            where lower(full_name) like %s or lower(abbreviation) like %s or lower(coalesce(common_name, '')) like %s
            limit 1
            """,
            (needle, needle, needle),
        )
        row = cur.fetchone()
        return row["id"] if row else None


def main() -> None:
    args = common_args("Import US-connected Catholic bishops from Wikidata.")
    logger = setup_logger("import-bishops")
    conn = connect_db()
    stats = {
        "persons_created": 0,
        "persons_skipped": 0,
        "assignments_created": 0,
        "cardinalates_created": 0,
        "errored": 0,
    }
    unmatched_orders = set()
    unmatched_positions = []

    try:
        conn.autocommit = False
        latin_rite_id = ensure_rite(conn, "Latin", "latin", args.dry_run, logger)
        with dict_cursor(conn) as cur:
            cur.execute("select id, wikidata_id, name from see where wikidata_id is not null")
            sees = [dict(row) for row in cur.fetchall()]
        see_by_qid = {row["wikidata_id"]: row for row in sees}

        all_people = {}
        qids = list(see_by_qid.keys())
        if qids:
            for batch in batched(qids, BATCH_SIZE):
                logger.info("Querying bishops connected to %s known sees...", len(batch))
                all_people.update(aggregate(sparql(bishop_query(batch), logger)))
        logger.info("Querying US citizen bishops...")
        all_people.update(aggregate(sparql(bishop_query(None), logger)))

        people = list(all_people.values())
        if args.limit:
            people = people[: args.limit]

        for person in people:
            try:
                if existing_by_wikidata(conn, "person", person["wikidata_id"]):
                    stats["persons_skipped"] += 1
                    logger.info("SKIP existing person: %s (%s)", person["label"], person["wikidata_id"])
                    continue

                first_name, middle_name, last_name = parse_name(person["label"])
                religious_order_id = find_religious_order(conn, person["religious_order"])
                if person["religious_order"] and not religious_order_id:
                    unmatched_orders.add(person["religious_order"])
                country_id = find_country(conn, person["birth_country"])
                person_id = new_id()
                slug = unique_slug(conn, "person", slugify(f"{first_name}-{last_name}")) if not args.dry_run else slugify(f"{first_name}-{last_name}")

                logger.info("CREATE person: %s (%s)", person["label"], person["wikidata_id"])
                stats["persons_created"] += 1
                if not args.dry_run:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            insert into person (
                              id, first_name, middle_name, last_name, religious_order_id, date_of_birth,
                              place_of_birth, country_of_birth_id, date_of_death, rite_id, slug,
                              portrait_url, photo_credit, photo_license, motto, catholic_hierarchy_id,
                              gcatholic_id, viaf_id, wikipedia_url, wikidata_id, created_at, updated_at
                            )
                            values (
                              %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                              %s, %s, %s, %s, now(), now()
                            )
                            """,
                            (
                                person_id,
                                first_name,
                                middle_name,
                                last_name,
                                religious_order_id,
                                person["birth_date"],
                                person["birth_place"],
                                country_id,
                                person["death_date"],
                                latin_rite_id,
                                slug,
                                person["portrait_url"],
                                "Wikimedia Commons" if person["portrait_url"] else None,
                                "CC BY-SA" if person["portrait_url"] else None,
                                person["motto"],
                                person["catholic_hierarchy_id"],
                                person["gcatholic_id"],
                                person["viaf_id"],
                                person["wikipedia_url"],
                                person["wikidata_id"],
                            ),
                        )

                for position in person["positions"]:
                    see = see_by_qid.get(position["see_qid"])
                    if not see or not position["start_date"]:
                        unmatched_positions.append((person["label"], position["position_label"], position["see_label"], position["see_qid"]))
                        continue
                    role = role_for(position["position_label"])
                    logger.info("  CREATE assignment: %s at %s (%s)", role, see["name"], position["start_date"])
                    stats["assignments_created"] += 1
                    if not args.dry_run:
                        with conn.cursor() as cur:
                            cur.execute(
                                """
                                insert into assignment (
                                  id, person_id, see_id, role, start_date, installed_date, end_date,
                                  start_reason, appointing_pope, is_current, created_at, updated_at
                                )
                                values (%s, %s, %s, %s, %s, %s, %s, 'appointed', %s, %s, now(), now())
                                """,
                                (
                                    new_id(),
                                    person_id,
                                    see["id"],
                                    role,
                                    position["start_date"],
                                    position["start_date"],
                                    position["end_date"],
                                    position["appointed_by"],
                                    position["end_date"] is None,
                                ),
                            )

                card = person["cardinalate"]
                if card and card["date_created"]:
                    logger.info("  CREATE cardinalate: %s", card["date_created"])
                    stats["cardinalates_created"] += 1
                    if not args.dry_run:
                        with conn.cursor() as cur:
                            cur.execute(
                                """
                                insert into cardinalate (
                                  id, person_id, date_created, cardinal_order, titular_church,
                                  is_elector, created_at, updated_at
                                )
                                values (%s, %s, %s, %s, %s, false, now(), now())
                                on conflict (person_id) do nothing
                                """,
                                (new_id(), person_id, card["date_created"], card["cardinal_order"], card["titular_church"]),
                            )

                if person["consecrator_qid"]:
                    logger.info("  consecrator from Wikidata: %s (%s)", person["consecrator_label"], person["consecrator_qid"])
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR importing %s: %s", person.get("label"), exc)

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info("Summary: persons_created=%s persons_skipped=%s assignments_created=%s cardinalates_created=%s errored=%s",
                    stats["persons_created"], stats["persons_skipped"], stats["assignments_created"], stats["cardinalates_created"], stats["errored"])
        logger.info("Unmatched religious orders: %s", ", ".join(sorted(unmatched_orders)) if unmatched_orders else "none")
        logger.info("Positions not matched to a See or missing start date: %s", len(unmatched_positions))
        for person_label, position_label, see_label, see_qid in unmatched_positions:
            logger.info("- %s | %s | %s (%s)", person_label, position_label, see_label or "no see", see_qid or "no qid")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
