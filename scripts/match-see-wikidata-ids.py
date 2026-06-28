#!/usr/bin/env python3
"""Match existing See records to Wikidata Q-IDs without creating new sees."""

from __future__ import annotations

import argparse
import re
from collections import defaultdict

from wikidata_import_common import (
    connect_db,
    dict_cursor,
    qid,
    setup_logger,
    sparql,
    value,
)

QUERY_TEMPLATE = """
PREFIX mwapi: <https://www.mediawiki.org/ontology#API/>
SELECT DISTINCT ?search ?see ?seeLabel ?typeLabel ?stateLabel ?countryLabel ?provinceLabel
WHERE {
  VALUES ?search { __LABELS__ }
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org" ;
                    wikibase:api "EntitySearch" ;
                    mwapi:search ?search ;
                    mwapi:language "en" ;
                    mwapi:limit "8" .
    ?see wikibase:apiOutputItem mwapi:item .
  }
  ?see wdt:P31 ?type .
  ?type rdfs:label ?typeLabel .
  FILTER(LANG(?typeLabel) = "en")
  FILTER(
    CONTAINS(LCASE(STR(?typeLabel)), "diocese") ||
    CONTAINS(LCASE(STR(?typeLabel)), "archdiocese") ||
    CONTAINS(LCASE(STR(?typeLabel)), "eparchy") ||
    CONTAINS(LCASE(STR(?typeLabel)), "exarchate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "apostolic vicariate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "military ordinariate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "personal ordinariate") ||
    CONTAINS(LCASE(STR(?typeLabel)), "territorial prelature")
  )
  OPTIONAL { ?see rdfs:label ?seeLabel FILTER(LANG(?seeLabel) = "en") }
  OPTIONAL { ?see wdt:P131 ?state . }
  OPTIONAL { ?see wdt:P17 ?country . }
  OPTIONAL { ?see wdt:P5765 ?province . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY ?seeLabel
"""

PREFIX_PATTERNS = [
    r"roman catholic archdiocese of",
    r"roman catholic diocese of",
    r"archdiocese of",
    r"diocese of",
    r"archeparchy of",
    r"eparchy of",
    r"apostolic exarchate of",
    r"exarchate of",
    r"apostolic vicariate of",
    r"military ordinariate of",
    r"personal ordinariate of",
    r"territorial prelature of",
]

STATE_ALIASES = {
    "District of Columbia": {"Washington, D.C.", "Washington DC", "DC"},
    "United States Virgin Islands": {"U.S. Virgin Islands", "Virgin Islands"},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Match existing sees to Wikidata Q-IDs.")
    parser.add_argument("--dry-run", action="store_true", help="Preview matches without writing wikidata_id.")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N unmatched local sees.")
    parser.add_argument(
        "--min-score",
        type=int,
        default=90,
        help="Minimum confidence score required to update a see. Default: 90.",
    )
    return parser.parse_args()


def clean_name(label: str) -> str:
    result = label
    for pattern in PREFIX_PATTERNS:
        result = re.sub(rf"^{pattern}\s+", "", result, flags=re.IGNORECASE)
    return result.strip()


def normalize(text: str | None) -> str:
    if not text:
        return ""
    text = clean_name(text).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"\bst\.?\b", "saint", text)
    text = re.sub(r"\bste\.?\b", "sainte", text)
    text = re.sub(r"\bthe\b", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def sparql_en_literal(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"@en'


def sparql_string(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def candidate_labels(local_sees: list[dict]) -> list[str]:
    labels = set()
    for see in local_sees:
        name = see["name"].strip()
        if not name:
            continue
        see_type = see["see_type"]
        if see_type == "archdiocese":
            prefixes = ["Roman Catholic Archdiocese of", "Archdiocese of"]
        elif see_type == "eparchy":
            prefixes = ["Eparchy of", "Roman Catholic Eparchy of"]
        elif see_type == "archeparchy":
            prefixes = ["Archeparchy of", "Roman Catholic Archeparchy of"]
        elif see_type == "exarchate":
            prefixes = ["Apostolic Exarchate of", "Exarchate of"]
        elif see_type == "military_ordinariate" or see_type == "military":
            prefixes = ["Roman Catholic Archdiocese for", "Military Ordinariate of", "Military Ordinariate for"]
        elif see_type == "personal_ordinariate":
            prefixes = ["Personal Ordinariate of", "Personal Ordinariate of the"]
        else:
            prefixes = ["Roman Catholic Diocese of", "Diocese of"]
        state = see.get("state_region")
        for prefix in prefixes:
            labels.add(f"{prefix} {name}")
            if state:
                labels.add(f"{prefix} {name} in {state}")
    return sorted(labels)


def type_from_wikidata(type_label: str, label: str) -> str:
    text = f"{type_label} {label}".lower()
    if "military ordinariate" in text:
        return "military_ordinariate"
    if "personal ordinariate" in text:
        return "personal_ordinariate"
    if "apostolic vicariate" in text:
        return "apostolic_vicariate"
    if "territorial prelature" in text:
        return "territorial_prelature"
    if "exarchate" in text:
        return "exarchate"
    if "archeparchy" in text:
        return "archeparchy"
    if "eparchy" in text:
        return "eparchy"
    if "archdiocese" in text:
        return "archdiocese"
    return "diocese"


def type_compatible(local_type: str, remote_type: str) -> bool:
    local = local_type.lower()
    if local == remote_type:
        return True
    if local == "military" and remote_type == "military_ordinariate":
        return True
    if local == "archdiocese" and remote_type == "archeparchy":
        return False
    return False


def state_match(local_state: str | None, remote_state: str | None) -> bool:
    if not local_state or not remote_state:
        return False
    if normalize(local_state) == normalize(remote_state):
        return True
    aliases = STATE_ALIASES.get(local_state, set()) | STATE_ALIASES.get(remote_state, set())
    return normalize(local_state) in {normalize(item) for item in aliases} or normalize(remote_state) in {normalize(item) for item in aliases}


def score(local: dict, remote: dict) -> int:
    if remote.get("country") and remote["country"] != "United States":
        return 0

    local_name = normalize(local["name"])
    remote_name = normalize(remote["name"])
    score_value = 0

    if local_name == remote_name:
        score_value += 70
    elif local_name and remote_name and (local_name in remote_name or remote_name in local_name):
        score_value += 45
    else:
        local_words = set(local_name.split())
        remote_words = set(remote_name.split())
        if local_words and remote_words:
            overlap = len(local_words & remote_words) / max(len(local_words), len(remote_words))
            score_value += round(overlap * 40)

    if type_compatible(local["see_type"], remote["see_type"]):
        score_value += 20
    elif local["see_type"] in ("diocese", "archdiocese") and remote["see_type"] in ("diocese", "archdiocese"):
        score_value += 5

    if state_match(local.get("state_region"), remote.get("state_region")):
        score_value += 10

    if normalize(local.get("see_city")) and normalize(local.get("see_city")) in remote_name:
        score_value += 5

    return min(score_value, 100)


def fetch_wikidata_sees(logger, local_sees: list[dict]) -> list[dict]:
    rows = []
    labels = candidate_labels(local_sees)
    batch_size = 20
    for index in range(0, len(labels), batch_size):
        batch = labels[index : index + batch_size]
        logger.info("Querying Wikidata search batch %s-%s of %s...", index + 1, index + len(batch), len(labels))
        query = QUERY_TEMPLATE.replace("__LABELS__", " ".join(sparql_string(item) for item in batch))
        rows.extend(sparql(query, logger, timeout=45, retries=3))

    seen = {}
    for row in rows:
        remote_qid = qid(value(row, "see"))
        if not remote_qid:
            continue
        label = value(row, "seeLabel") or remote_qid
        seen[remote_qid] = {
            "wikidata_id": remote_qid,
            "label": label,
            "name": clean_name(label),
            "see_type": type_from_wikidata(value(row, "typeLabel") or "", label),
            "type_label": value(row, "typeLabel") or "",
            "state_region": value(row, "stateLabel"),
            "country": value(row, "countryLabel"),
            "province": value(row, "provinceLabel"),
        }
    return list(seen.values())


def main() -> None:
    args = parse_args()
    logger = setup_logger("match-see-wikidata-ids")
    conn = connect_db()
    stats = {"matched": 0, "skipped": 0, "ambiguous": 0, "unmatched": 0, "errored": 0}

    try:
        conn.autocommit = False
        with dict_cursor(conn) as cur:
            cur.execute(
                """
                select id, name, see_type, state_region, see_city, wikidata_id
                from see
                order by state_region nulls last, name
                """
            )
            local_sees = [dict(row) for row in cur.fetchall()]

        already_linked = {row["wikidata_id"] for row in local_sees if row.get("wikidata_id")}
        local_unmatched = [row for row in local_sees if not row.get("wikidata_id")]
        if args.limit:
            local_unmatched = local_unmatched[: args.limit]

        logger.info("Local sees: %s total, %s missing wikidata_id", len(local_sees), len(local_unmatched))
        logger.info("Querying Wikidata candidate sees...")
        remote_sees = [row for row in fetch_wikidata_sees(logger, local_unmatched) if row["wikidata_id"] not in already_linked]
        logger.info("Wikidata candidates: %s", len(remote_sees))

        claimed_remote_ids = set()
        match_rows = []
        for local in local_unmatched:
            try:
                candidates = []
                for remote in remote_sees:
                    if remote["wikidata_id"] in claimed_remote_ids:
                        continue
                    candidate_score = score(local, remote)
                    if candidate_score >= args.min_score:
                        candidates.append((candidate_score, remote))

                candidates.sort(key=lambda item: item[0], reverse=True)
                if not candidates:
                    stats["unmatched"] += 1
                    logger.warning("NO MATCH: %s | %s | %s", local["name"], local["see_type"], local["state_region"] or "")
                    continue

                top_score, top_remote = candidates[0]
                tied = [item for item in candidates if item[0] == top_score]
                if len(tied) > 1:
                    stats["ambiguous"] += 1
                    logger.warning("AMBIGUOUS: %s | candidates: %s", local["name"], ", ".join(f"{r['label']} {s}" for s, r in tied))
                    continue

                stats["matched"] += 1
                claimed_remote_ids.add(top_remote["wikidata_id"])
                match_rows.append((local, top_remote, top_score))
                logger.info(
                    "MATCH %s -> %s (%s) score=%s state=%s",
                    local["name"],
                    top_remote["label"],
                    top_remote["wikidata_id"],
                    top_score,
                    top_remote["state_region"] or "",
                )

                if not args.dry_run:
                    with conn.cursor() as cur:
                        cur.execute("update see set wikidata_id = %s, updated_at = now() where id = %s", (top_remote["wikidata_id"], local["id"]))
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR matching %s: %s", local.get("name"), exc)

        duplicate_remote = defaultdict(list)
        for local, remote, _ in match_rows:
            duplicate_remote[remote["wikidata_id"]].append(local["name"])
        duplicates = {key: names for key, names in duplicate_remote.items() if len(names) > 1}
        if duplicates:
            logger.warning("Duplicate remote Q-IDs selected; rolling back for safety: %s", duplicates)
            conn.rollback()
            return

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info(
            "Summary: matched=%s unmatched=%s ambiguous=%s skipped=%s errored=%s dry_run=%s",
            stats["matched"],
            stats["unmatched"],
            stats["ambiguous"],
            stats["skipped"],
            stats["errored"],
            args.dry_run,
        )
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
