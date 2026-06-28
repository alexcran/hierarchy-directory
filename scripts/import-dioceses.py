#!/usr/bin/env python3
"""Import US Catholic sees from Wikidata."""

from __future__ import annotations

import re

from wikidata_import_common import (
    commons_file_url,
    common_args,
    connect_db,
    dict_cursor,
    ensure_country,
    ensure_rite,
    existing_by_wikidata,
    int_value,
    iso_date,
    new_id,
    qid,
    setup_logger,
    slugify,
    sparql,
    unique_slug,
    value,
)

EASTERN_RITES = {
    "maronite": "Maronite",
    "melkite": "Melkite",
    "ukrainian": "Ukrainian",
    "ruthenian": "Ruthenian",
    "romanian": "Romanian",
    "chaldean": "Chaldean",
    "armenian": "Armenian",
    "syro-malabar": "Syro-Malabar",
    "syriac": "Syriac",
}

USCCB_FALSE_REGIONS = {"Puerto Rico", "Guam", "American Samoa", "Northern Mariana Islands"}

QUERY = """
SELECT DISTINCT ?see ?seeLabel ?type ?typeLabel ?established ?cathedralLabel ?latinLabel
       ?patronLabel ?stateLabel ?province ?provinceLabel ?coatOfArms
       ?population ?populationQualifierLabel
WHERE {
  ?see wdt:P31 ?type ;
       wdt:P17 wd:Q30 .
  ?type rdfs:label ?typeLabel .
  FILTER(LANG(?typeLabel) = "en")
  FILTER(
    CONTAINS(LCASE(STR(?typeLabel)), "catholic diocese") ||
    CONTAINS(LCASE(STR(?typeLabel)), "catholic archdiocese") ||
    CONTAINS(LCASE(STR(?typeLabel)), "eparchy") ||
    CONTAINS(LCASE(STR(?typeLabel)), "exarchate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "apostolic vicariate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "military ordinariate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "personal ordinariate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "territorial prelature")
  )

  OPTIONAL { ?see wdt:P571 ?established . }
  OPTIONAL { ?see wdt:P1885 ?cathedral . }
  OPTIONAL { ?see rdfs:label ?latinLabel FILTER(LANG(?latinLabel) = "la") }
  OPTIONAL { ?see wdt:P194 ?patron . }
  OPTIONAL { ?see wdt:P131 ?state . }
  OPTIONAL { ?see wdt:P5765 ?province . }
  OPTIONAL { ?see wdt:P94 ?coatOfArms . }
  OPTIONAL {
    ?see p:P1082 ?populationStatement .
    ?populationStatement ps:P1082 ?population .
    OPTIONAL {
      ?populationStatement pq:P642 ?populationQualifier .
      ?populationQualifier rdfs:label ?populationQualifierLabel FILTER(LANG(?populationQualifierLabel) = "en")
    }
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY ?seeLabel
"""


def clean_name(label: str) -> str:
    prefixes = [
        r"Roman Catholic Archdiocese of ",
        r"Roman Catholic Diocese of ",
        r"Archdiocese of ",
        r"Diocese of ",
        r"Archeparchy of ",
        r"Eparchy of ",
        r"Apostolic Exarchate of ",
        r"Exarchate of ",
        r"Apostolic Vicariate of ",
        r"Military Ordinariate of ",
        r"Personal Ordinariate of ",
        r"Territorial Prelature of ",
    ]
    result = label
    for prefix in prefixes:
        result = re.sub("^" + prefix, "", result, flags=re.IGNORECASE)
    return result.strip()


def see_type(type_label: str, label: str) -> str:
    text = f"{type_label} {label}".lower()
    if "archdiocese" in text or "archeparchy" in text:
        return "archdiocese" if "eparch" not in text else "archeparchy"
    if "eparchy" in text:
        return "eparchy"
    if "exarchate" in text:
        return "exarchate"
    if "military ordinariate" in text:
        return "military_ordinariate"
    if "personal ordinariate" in text:
        return "personal_ordinariate"
    if "apostolic vicariate" in text:
        return "apostolic_vicariate"
    if "territorial prelature" in text:
        return "territorial_prelature"
    return "diocese"


def rite_name_for(label: str, type_label: str) -> str:
    text = f"{label} {type_label}".lower()
    for needle, name in EASTERN_RITES.items():
        if needle in text:
            return name
    if "eparchy" in text or "exarchate" in text or "archeparchy" in text:
        return "Ruthenian"
    return "Latin"


def aggregate_rows(rows):
    sees = {}
    for row in rows:
        see_qid = qid(value(row, "see"))
        if not see_qid:
            continue
        item = sees.setdefault(
            see_qid,
            {
                "wikidata_id": see_qid,
                "label": value(row, "seeLabel") or see_qid,
                "type_label": value(row, "typeLabel") or "",
                "date_erected": iso_date(value(row, "established")),
                "cathedral_name": value(row, "cathedralLabel"),
                "latin_name": value(row, "latinLabel"),
                "patron_saint": value(row, "patronLabel"),
                "state_region": value(row, "stateLabel"),
                "province_qid": qid(value(row, "province")),
                "province_label": value(row, "provinceLabel"),
                "coat_of_arms_url": commons_file_url(value(row, "coatOfArms")),
                "catholic_population": None,
                "total_population": None,
            },
        )
        pop = int_value(value(row, "population"))
        qualifier = (value(row, "populationQualifierLabel") or "").lower()
        if pop:
            if "catholic" in qualifier:
                item["catholic_population"] = pop
            elif item["total_population"] is None:
                item["total_population"] = pop
    return list(sees.values())


def is_usccb_territory(name: str, state_region: str | None, see_type_value: str) -> bool:
    if see_type_value == "personal_ordinariate" and "Chair of St. Peter" in name:
        return True
    if state_region in USCCB_FALSE_REGIONS:
        return False
    return True


def main() -> None:
    args = common_args("Import US Catholic dioceses, archdioceses, and related jurisdictions from Wikidata.")
    logger = setup_logger("import-dioceses")
    conn = connect_db()
    stats = {"created": 0, "skipped": 0, "errored": 0, "unmapped": 0, "metro_set": 0}
    imported = []

    try:
        conn.autocommit = False
        country_id = ensure_country(conn, "United States", "USA", args.dry_run, logger)
        rite_ids = {"Latin": ensure_rite(conn, "Latin", "latin", args.dry_run, logger)}
        for rite in EASTERN_RITES.values():
            rite_ids[rite] = ensure_rite(conn, rite, "eastern", args.dry_run, logger)

        logger.info("Querying Wikidata for US sees...")
        records = aggregate_rows(sparql(QUERY, logger))
        if args.limit:
            records = records[: args.limit]

        for record in records:
            try:
                label = record["label"]
                name = clean_name(label)
                mapped_type = see_type(record["type_label"], label)
                rite_name = rite_name_for(label, record["type_label"])
                rite_id = rite_ids.get(rite_name, rite_ids["Latin"])
                existing = existing_by_wikidata(conn, "see", record["wikidata_id"])
                if existing:
                    stats["skipped"] += 1
                    imported.append((existing["id"], name, mapped_type, record["state_region"], record["province_label"], record["province_qid"]))
                    logger.info("SKIP existing see: %s (%s)", label, record["wikidata_id"])
                    continue

                see_id = new_id()
                slug = unique_slug(conn, "see", slugify(name)) if not args.dry_run else slugify(name)
                imported.append((see_id, name, mapped_type, record["state_region"], record["province_label"], record["province_qid"]))
                logger.info("CREATE see: %s [%s, %s]", name, mapped_type, record["state_region"] or "unknown state")
                stats["created"] += 1

                if not args.dry_run:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            insert into see (
                              id, name, slug, see_type, rite_id, country_id, state_region,
                              latin_name, date_erected, cathedral_name, coat_of_arms_url,
                              wikidata_id, patron_saint, catholic_population, total_population,
                              is_metropolitan, is_usccb_territory, created_at, updated_at
                            )
                            values (
                              %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                              %s, %s, now(), now()
                            )
                            """,
                            (
                                see_id,
                                name,
                                slug,
                                mapped_type,
                                rite_id,
                                country_id,
                                record["state_region"],
                                record["latin_name"],
                                record["date_erected"],
                                record["cathedral_name"],
                                record["coat_of_arms_url"],
                                record["wikidata_id"],
                                record["patron_saint"],
                                record["catholic_population"],
                                record["total_population"],
                                mapped_type == "archdiocese",
                                is_usccb_territory(label, record["state_region"], mapped_type),
                            ),
                        )
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR importing %s: %s", record.get("label"), exc)

        with dict_cursor(conn) as cur:
            cur.execute("select id, wikidata_id, name, see_type from see where wikidata_id is not null")
            see_by_qid = {row["wikidata_id"]: row for row in cur.fetchall()}

        for _see_id, name, mapped_type, state, province_label, province_qid in imported:
            if not province_qid:
                continue
            metro = see_by_qid.get(province_qid)
            if not metro:
                stats["unmapped"] += 1
                logger.warning("Could not map province for %s: %s (%s)", name, province_label, province_qid)
                continue
            logger.info("SET province: %s -> %s", name, metro["name"])
            stats["metro_set"] += 1
            if not args.dry_run:
                with conn.cursor() as cur:
                    cur.execute("update see set metropolitan_see_id = %s, updated_at = now() where id = %s", (metro["id"], _see_id))
                    cur.execute("update see set is_metropolitan = true, updated_at = now() where id = %s", (metro["id"],))

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info("Summary: created=%s skipped=%s errored=%s unmapped_provinces=%s metropolitan_links=%s",
                    stats["created"], stats["skipped"], stats["errored"], stats["unmapped"], stats["metro_set"])
        logger.info("Verification list:")
        for _, name, mapped_type, state, province_label, _ in sorted(imported, key=lambda item: item[1]):
            logger.info("- %s | %s | %s | province: %s", name, mapped_type, state or "", province_label or "")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
