#!/usr/bin/env python3
"""Import episcopal consecration relationships from Wikidata."""

from __future__ import annotations

from wikidata_import_common import (
    batched,
    common_args,
    connect_db,
    dict_cursor,
    iso_date,
    new_id,
    qid,
    setup_logger,
    sparql,
    value,
)

BATCH_SIZE = 50


def consecration_query(qids: list[str]) -> str:
    values = " ".join(f"wd:{item}" for item in qids)
    return f"""
SELECT DISTINCT ?person ?personLabel ?consecrator ?consecratorLabel
       ?bishopStart ?consecrationDate ?locationLabel
WHERE {{
  VALUES ?person {{ {values} }}
  ?person wdt:P1598 ?consecrator .
  OPTIONAL {{ ?person wdt:P1135 ?consecrationDate . }}
  OPTIONAL {{
    ?person p:P39 ?positionStatement .
    ?positionStatement ps:P39 ?position .
    ?position rdfs:label ?positionLabel FILTER(LANG(?positionLabel) = "en")
    FILTER(CONTAINS(LCASE(STR(?positionLabel)), "bishop") || CONTAINS(LCASE(STR(?positionLabel)), "eparch"))
    OPTIONAL {{ ?positionStatement pq:P580 ?bishopStart . }}
    OPTIONAL {{ ?positionStatement pq:P276 ?location . }}
  }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
ORDER BY ?personLabel
"""


def aggregate(rows):
    records = {}
    for row in rows:
        person_qid = qid(value(row, "person"))
        consecrator_qid = qid(value(row, "consecrator"))
        if not person_qid or not consecrator_qid:
            continue
        item = records.setdefault(
            person_qid,
            {
                "person_qid": person_qid,
                "person_label": value(row, "personLabel"),
                "date": iso_date(value(row, "consecrationDate")) or iso_date(value(row, "bishopStart")),
                "location": value(row, "locationLabel"),
                "consecrators": [],
            },
        )
        if not item["date"]:
            item["date"] = iso_date(value(row, "consecrationDate")) or iso_date(value(row, "bishopStart"))
        if not item["location"]:
            item["location"] = value(row, "locationLabel")
        consecrator = {
            "qid": consecrator_qid,
            "label": value(row, "consecratorLabel") or consecrator_qid,
        }
        if consecrator not in item["consecrators"]:
            item["consecrators"].append(consecrator)
    return records


def main() -> None:
    args = common_args("Import episcopal consecration relationships from Wikidata.")
    logger = setup_logger("import-consecrations")
    conn = connect_db()
    stats = {
        "created": 0,
        "skipped": 0,
        "found_principal": 0,
        "missing_principal": 0,
        "co_consecrators_created": 0,
        "errored": 0,
    }
    missing_consecrators = []

    try:
        conn.autocommit = False
        with dict_cursor(conn) as cur:
            cur.execute("select id, wikidata_id, first_name, last_name from person where wikidata_id is not null order by last_name")
            people = [dict(row) for row in cur.fetchall()]
        if args.limit:
            people = people[: args.limit]

        person_by_qid = {row["wikidata_id"]: row for row in people}
        all_records = {}
        for batch in batched(list(person_by_qid.keys()), BATCH_SIZE):
            logger.info("Querying consecrations for %s persons...", len(batch))
            all_records.update(aggregate(sparql(consecration_query(batch), logger)))

        for record in all_records.values():
            try:
                person = person_by_qid.get(record["person_qid"])
                if not person:
                    continue
                with dict_cursor(conn) as cur:
                    cur.execute("select id from episcopal_consecration where person_id = %s limit 1", (person["id"],))
                    if cur.fetchone():
                        stats["skipped"] += 1
                        logger.info("SKIP existing consecration: %s", record["person_label"])
                        continue

                if not record["date"]:
                    stats["errored"] += 1
                    logger.warning("NO DATE, cannot create consecration for %s (%s)", record["person_label"], record["person_qid"])
                    continue

                principal = record["consecrators"][0] if record["consecrators"] else None
                principal_person = person_by_qid.get(principal["qid"]) if principal else None
                principal_id = principal_person["id"] if principal_person else None
                if principal_id:
                    stats["found_principal"] += 1
                elif principal:
                    stats["missing_principal"] += 1
                    missing_consecrators.append(principal)

                consecration_id = new_id()
                logger.info(
                    "CREATE consecration: %s on %s by %s",
                    record["person_label"],
                    record["date"],
                    principal["label"] if principal else "unknown",
                )
                stats["created"] += 1
                if not args.dry_run:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            insert into episcopal_consecration (
                              id, person_id, date, location, principal_consecrator_id, created_at, updated_at
                            )
                            values (%s, %s, %s, %s, %s, now(), now())
                            """,
                            (consecration_id, person["id"], record["date"], record["location"], principal_id),
                        )

                for ordinal, co in enumerate(record["consecrators"][1:], start=1):
                    co_person = person_by_qid.get(co["qid"])
                    if not co_person:
                        logger.info("  co-consecrator not in database: %s (%s)", co["label"], co["qid"])
                        continue
                    logger.info("  CREATE co-consecrator: %s", co["label"])
                    stats["co_consecrators_created"] += 1
                    if not args.dry_run:
                        with conn.cursor() as cur:
                            cur.execute(
                                """
                                insert into episcopal_consecration_co_consecrator (
                                  id, consecration_id, co_consecrator_id, ordinal
                                )
                                values (%s, %s, %s, %s)
                                """,
                                (new_id(), consecration_id, co_person["id"], ordinal),
                            )
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR importing consecration for %s: %s", record.get("person_label"), exc)

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info("Summary: created=%s skipped=%s principal_found=%s principal_missing=%s co_consecrators_created=%s errored=%s",
                    stats["created"], stats["skipped"], stats["found_principal"], stats["missing_principal"],
                    stats["co_consecrators_created"], stats["errored"])
        if missing_consecrators:
            logger.info("Principal consecrators not found in database:")
            seen = set()
            for item in missing_consecrators:
                key = (item["qid"], item["label"])
                if key in seen:
                    continue
                seen.add(key)
                logger.info("- %s (%s)", item["label"], item["qid"])
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
