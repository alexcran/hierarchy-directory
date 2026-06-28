#!/usr/bin/env python3
"""Enrich existing See records from Wikidata."""

from __future__ import annotations

import re

from wikidata_import_common import (
    batched,
    commons_file_url,
    common_args,
    connect_db,
    dict_cursor,
    int_value,
    qid,
    setup_logger,
    sparql,
    value,
)

BATCH_SIZE = 25


def enrichment_query(qids: list[str]) -> str:
    values = " ".join(f"wd:{item}" for item in qids)
    return f"""
SELECT DISTINCT ?see ?latinLabel ?cathedralLabel ?cathedralDedicationLabel ?cathedralAddress
       ?cathedralCoord ?coatOfArms ?patronLabel ?population ?populationQualifierLabel
       ?area ?areaUnitLabel ?wikipediaUrl ?parishes
WHERE {{
  VALUES ?see {{ {values} }}
  OPTIONAL {{ ?see rdfs:label ?latinLabel FILTER(LANG(?latinLabel) = "la") }}
  OPTIONAL {{ ?see wdt:P94 ?coatOfArms . }}
  OPTIONAL {{ ?see wdt:P194 ?patron . }}
  OPTIONAL {{
    ?see wdt:P1885 ?cathedral .
    OPTIONAL {{ ?cathedral rdfs:label ?cathedralLabel FILTER(LANG(?cathedralLabel) = "en") }}
    OPTIONAL {{ ?cathedral wdt:P825 ?cathedralDedication . }}
    OPTIONAL {{ ?cathedral wdt:P6375 ?cathedralAddress . }}
    OPTIONAL {{ ?cathedral wdt:P625 ?cathedralCoord . }}
  }}
  OPTIONAL {{
    ?see p:P1082 ?populationStatement .
    ?populationStatement ps:P1082 ?population .
    OPTIONAL {{
      ?populationStatement pq:P642 ?populationQualifier .
      ?populationQualifier rdfs:label ?populationQualifierLabel FILTER(LANG(?populationQualifierLabel) = "en")
    }}
  }}
  OPTIONAL {{
    ?see p:P2046 ?areaStatement .
    ?areaStatement ps:P2046 ?area .
    OPTIONAL {{
      ?areaStatement psv:P2046 ?areaValue .
      ?areaValue wikibase:quantityUnit ?areaUnit .
      ?areaUnit rdfs:label ?areaUnitLabel FILTER(LANG(?areaUnitLabel) = "en")
    }}
  }}
  OPTIONAL {{ ?see wdt:P2547 ?parishes . }}
  OPTIONAL {{
    ?wikipediaUrl schema:about ?see ;
                  schema:isPartOf <https://en.wikipedia.org/> .
  }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
"""


def parse_point(point: str | None) -> tuple[str, str] | tuple[None, None]:
    if not point:
        return None, None
    match = re.match(r"Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)", point)
    if not match:
        return None, None
    longitude, latitude = match.groups()
    return latitude, longitude


def square_miles(area: str | None, unit: str | None) -> int | None:
    if area is None:
        return None
    try:
        amount = float(area)
    except ValueError:
        return None
    unit_text = (unit or "").lower()
    if "square kilometre" in unit_text or "square kilometer" in unit_text or "km" in unit_text:
        return round(amount * 0.386102)
    return round(amount)


def aggregate(rows):
    records = {}
    for row in rows:
        see_qid = qid(value(row, "see"))
        item = records.setdefault(see_qid, {})
        item.setdefault("latin_name", value(row, "latinLabel"))
        item.setdefault("cathedral_name", value(row, "cathedralLabel"))
        item.setdefault("cathedral_dedication", value(row, "cathedralDedicationLabel"))
        item.setdefault("cathedral_address", value(row, "cathedralAddress"))
        lat, lon = parse_point(value(row, "cathedralCoord"))
        item.setdefault("cathedral_latitude", lat)
        item.setdefault("cathedral_longitude", lon)
        item.setdefault("coat_of_arms_url", commons_file_url(value(row, "coatOfArms")))
        item.setdefault("patron_saint", value(row, "patronLabel"))
        item.setdefault("wikipedia_url", value(row, "wikipediaUrl"))
        item.setdefault("num_parishes", int_value(value(row, "parishes")))
        item.setdefault("square_miles", square_miles(value(row, "area"), value(row, "areaUnitLabel")))

        pop = int_value(value(row, "population"))
        qualifier = (value(row, "populationQualifierLabel") or "").lower()
        if pop:
            if "catholic" in qualifier and item.get("catholic_population") is None:
                item["catholic_population"] = pop
            elif item.get("total_population") is None:
                item["total_population"] = pop
    return records


def main() -> None:
    args = common_args("Enrich existing See records from Wikidata.")
    logger = setup_logger("enrich-dioceses")
    conn = connect_db()
    stats = {"enriched": 0, "skipped": 0, "errored": 0, "no_data": 0}

    try:
        conn.autocommit = False
        with dict_cursor(conn) as cur:
            cur.execute('select * from see where wikidata_id is not null order by name')
            sees = [dict(row) for row in cur.fetchall()]
        if args.limit:
            sees = sees[: args.limit]

        by_qid = {see["wikidata_id"]: see for see in sees}
        all_data = {}
        for batch in batched(list(by_qid.keys()), BATCH_SIZE):
            logger.info("Querying Wikidata for %s sees...", len(batch))
            all_data.update(aggregate(sparql(enrichment_query(batch), logger)))

        nullable_fields = [
            "latin_name",
            "cathedral_name",
            "cathedral_dedication",
            "cathedral_address",
            "cathedral_latitude",
            "cathedral_longitude",
            "coat_of_arms_url",
            "patron_saint",
            "catholic_population",
            "total_population",
            "num_parishes",
            "square_miles",
        ]

        for see in sees:
            try:
                data = all_data.get(see["wikidata_id"], {})
                updates = {field: data.get(field) for field in nullable_fields if see.get(field) is None and data.get(field) is not None}
                if not updates:
                    stats["no_data"] += 1
                    logger.info("NO NEW DATA: %s", see["name"])
                    continue
                stats["enriched"] += 1
                logger.info("UPDATE %s: %s", see["name"], ", ".join(updates.keys()))
                if not args.dry_run:
                    assignments = ", ".join(f"{field} = %s" for field in updates)
                    params = list(updates.values()) + [see["id"]]
                    with conn.cursor() as cur:
                        cur.execute(f"update see set {assignments}, updated_at = now() where id = %s", params)
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR enriching %s: %s", see["name"], exc)

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info("Summary: enriched=%s no_additional_data=%s skipped=%s errored=%s",
                    stats["enriched"], stats["no_data"], stats["skipped"], stats["errored"])
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
