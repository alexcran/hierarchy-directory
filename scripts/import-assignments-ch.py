#!/usr/bin/env python3
"""Import assignments and ordination/consecration data from Catholic-Hierarchy.org."""

from __future__ import annotations

import argparse
import html
import re
import time
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Any

import requests

from wikidata_import_common import connect_db, dict_cursor, new_id, setup_logger

BASE_URL = "https://www.catholic-hierarchy.org/bishop/b{ch_id}.html"
REQUEST_DELAY_SECONDS = 1.5
USER_AGENT = "HierarchyDirectory/1.0 CatholicHierarchyImport (https://hierarchy.directory)"

SEE_ALIASES = {
    "United States of America, Military": "Military Services, USA",
    "Military": "Military Services, USA",
    "Bardstown": "Louisville",
    "Oregon City": "Portland",
    "Portland in Oregon": "Portland",
    "Natchez": "Jackson",
    "Natchesium": "Jackson",
    "Vincennes": "Indianapolis",
    "Alton": "Springfield in Illinois",
    "Kearney": "Grand Island",
    "Jamestown": "Fargo",
    "Lead": "Rapid City",
    "Walla Walla": "Seattle",
    "Nesqually": "Seattle",
    "Sault Sainte Marie": "Marquette",
    "Sault Sainte Marie in Michigan": "Marquette",
    "Louisiana and the Two Floridas (Saint Louis of New Orleans)": "New Orleans",
    "California": "San Francisco",
    "Kansas City": "Kansas City in Kansas",
    "Lafayette": "Lafayette in Indiana",
    "Parma (Ruthenian)": "Parma",
    "Passaic (Ruthenian)": "Passaic",
    "Stamford (Ukrainian)": "Stamford",
    "Van Nuys (Ruthenian)": "Van Nuys",
    "Saint George in Canton (Romanian)": "Saint George in Canton",
    "Munhall (Ruthenian)": "Munhall",
    "United States of America (Ruthenian)": "Pittsburgh",
    "United States of America (Ukrainian)": "Philadelphia",
    "Saint Thomas the Apostle of Detroit (Chaldean)": "Saint Thomas the Apostle of Detroit",
    "Saint Josaphat in Parma (Ukrainian)": "Saint Josaphat in Parma",
    "Philadelphia (Ukrainian)": "Philadelphia",
    "Pittsburgh (Ruthenian)": "Pittsburgh",
    "Leavenworth": "Kansas City in Kansas",
    "Allegheny": "Pittsburgh",
    "Concordia": "Salina",
    "Saints Cyril and Methodius of Toronto (Slovak)": None,
    "Lares": None,
}

SEE_ALIAS_TYPES = {
    "United States of America, Military": "military_ordinariate",
    "Military": "military_ordinariate",
    "Parma (Ruthenian)": "eparchy",
    "Passaic (Ruthenian)": "eparchy",
    "Stamford (Ukrainian)": "eparchy",
    "Van Nuys (Ruthenian)": "eparchy",
    "Saint George in Canton (Romanian)": "eparchy",
    "Munhall (Ruthenian)": "eparchy",
    "United States of America (Ruthenian)": "archeparchy",
    "United States of America (Ukrainian)": "archeparchy",
    "Saint Thomas the Apostle of Detroit (Chaldean)": "eparchy",
    "Saint Josaphat in Parma (Ukrainian)": "eparchy",
    "Philadelphia (Ukrainian)": "archeparchy",
    "Pittsburgh (Ruthenian)": "archeparchy",
}

SEE_ALIAS_RITES = {
    "Philadelphia (Ukrainian)": "Ukrainian",
    "Pittsburgh (Ruthenian)": "Ruthenian",
    "United States of America (Ukrainian)": "Ukrainian",
    "United States of America (Ruthenian)": "Ruthenian",
    "Parma (Ruthenian)": "Ruthenian",
    "Passaic (Ruthenian)": "Ruthenian",
    "Stamford (Ukrainian)": "Ukrainian",
    "Van Nuys (Ruthenian)": "Ruthenian",
    "Saint George in Canton (Romanian)": "Romanian",
    "Munhall (Ruthenian)": "Ruthenian",
    "Saint Thomas the Apostle of Detroit (Chaldean)": "Chaldean",
    "Saint Josaphat in Parma (Ukrainian)": "Ukrainian",
}

SEE_ALIAS_STATES = {
    "Oregon City": "Oregon",
    "Portland in Oregon": "Oregon",
    "Portland": "Maine",
}

EXPECTED_UNMATCHED_SEES = {
    "Citium",
    "Bencenna",
    "Taraqua",
    "Hirina",
    "Plestia",
    "Lambaesis",
    "Sufes",
    "Tigias",
    "Jaro o Santa Elisabetta",
}

SPLIT_DIOCESES = {
    "Monterey-Los Angeles",
    "Monterey-Fresno",
    "Oklahoma City and Tulsa",
    "Mobile-Birmingham",
    "Baltimore-Washington",
    "Reno-Las Vegas",
}


@dataclass
class Link:
    text: str
    href: str | None


@dataclass
class Cell:
    text_parts: list[str] = field(default_factory=list)
    links: list[Link] = field(default_factory=list)
    is_header: bool = False

    @property
    def text(self) -> str:
        return clean_text(" ".join(self.text_parts))


@dataclass
class Row:
    cells: list[Cell] = field(default_factory=list)


@dataclass
class Table:
    rows: list[Row] = field(default_factory=list)


class ChHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tables: list[Table] = []
        self.title_parts: list[str] = []
        self._in_title = False
        self._table_stack: list[Table] = []
        self._current_row: Row | None = None
        self._current_cell: Cell | None = None
        self._current_link_href: str | None = None
        self._current_link_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "table":
            table = Table()
            self.tables.append(table)
            self._table_stack.append(table)
        elif tag == "tr" and self._table_stack:
            self._current_row = Row()
        elif tag in ("td", "th") and self._current_row is not None:
            self._current_cell = Cell(is_header=(tag == "th"))
        elif tag == "a" and self._current_cell is not None:
            self._current_link_href = attrs_dict.get("href")
            self._current_link_parts = []
        elif tag in ("br", "p", "li") and self._current_cell is not None:
            self._current_cell.text_parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag == "a" and self._current_cell is not None:
            text = clean_text(" ".join(self._current_link_parts))
            if text:
                self._current_cell.links.append(Link(text=text, href=self._current_link_href))
            self._current_link_href = None
            self._current_link_parts = []
        elif tag in ("td", "th") and self._current_cell is not None and self._current_row is not None:
            self._current_row.cells.append(self._current_cell)
            self._current_cell = None
        elif tag == "tr" and self._current_row is not None and self._table_stack:
            if self._current_row.cells:
                self._table_stack[-1].rows.append(self._current_row)
            self._current_row = None
        elif tag == "table" and self._table_stack:
            self._table_stack.pop()

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._current_cell is not None:
            self._current_cell.text_parts.append(data)
        if self._current_link_href is not None:
            self._current_link_parts.append(data)

    @property
    def page_title(self) -> str:
        return clean_text(" ".join(self.title_parts))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import assignments from Catholic-Hierarchy.org bishop pages.")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing to the database.")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N persons.")
    parser.add_argument("--start-after", default=None, help="Skip records until after this Catholic-Hierarchy ID.")
    parser.add_argument(
        "--only-ch-ids",
        default=None,
        help="Comma-separated Catholic-Hierarchy IDs to process, e.g. oconw,oleary.",
    )
    return parser.parse_args()


def clean_text(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def normalize(text: str | None) -> str:
    text = clean_text(text).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"\bst\.?\b", "saint", text)
    text = re.sub(r"\bste\.?\b", "sainte", text)
    text = re.sub(r"[-\u2010-\u2015]+", "-", text)
    text = re.sub(r"[^a-z0-9-]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_ch_date(raw: str | None) -> str | None:
    text = clean_text(raw)
    if not text:
        return None
    months = {
        "jan": "01",
        "feb": "02",
        "mar": "03",
        "apr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "aug": "08",
        "sep": "09",
        "oct": "10",
        "nov": "11",
        "dec": "12",
    }
    full = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\b", text)
    if full:
        month = months.get(full.group(2).lower())
        return f"{full.group(3)}-{month}-{full.group(1).zfill(2)}" if month else None
    month_year = re.search(r"\b([A-Za-z]{3})\s+(\d{4})\b", text)
    if month_year:
        month = months.get(month_year.group(1).lower())
        return f"{month_year.group(2)}-{month}-01" if month else None
    year = re.search(r"\b(\d{4})\b", text)
    return f"{year.group(1)}-01-01" if year else None


def bishop_href_to_ch_id(href: str | None) -> str | None:
    if not href:
        return None
    match = re.search(r"(?:^|/)b([^/.]+)\.html", href)
    return match.group(1) if match else None


def strip_crosses(name: str) -> str:
    return clean_text(re.sub(r"[\u2020\u271d\u2021*]+", "", name))


def parse_name_from_page_title(title: str) -> tuple[str, str | None, str] | None:
    title = re.sub(r"\s*\[Catholic-Hierarchy\].*$", "", title, flags=re.I)
    title = re.sub(r"^(Bishop|Archbishop|Cardinal|Patriarch|Metropolitan)\s+", "", title, flags=re.I)
    title = re.sub(r",.*$", "", title).strip()
    parts = [part for part in title.split() if part]
    if len(parts) < 2:
        return None
    return parts[0], " ".join(parts[1:-1]) or None, parts[-1]


def person_needs_name_fix(person: dict[str, Any]) -> bool:
    fields = [person.get("first_name"), person.get("middle_name"), person.get("last_name")]
    return any(value and re.fullmatch(r"Q\d+", str(value)) for value in fields)


def title_role(title: str) -> str | None:
    lower = title.lower()
    if "auxiliary bishop" in lower:
        return "auxiliary"
    if "coadjutor archbishop" in lower:
        return "coadjutor"
    if "coadjutor bishop" in lower:
        return "coadjutor"
    if "apostolic administrator" in lower:
        return "apostolic_administrator"
    if re.search(r"\barchbishop of\b", lower):
        return "archbishop"
    if re.search(r"\bbishop of\b", lower):
        return "diocesan_bishop"
    return None


def appointment_event(event: str) -> bool:
    lower = event.lower()
    return any(token in lower for token in ("appointed", "installed", "succeeded", "named", "elected"))


def installation_event(event: str) -> bool:
    return "installed" in event.lower()


def end_event(event: str) -> bool:
    lower = event.lower()
    return any(token in lower for token in ("resigned", "retired", "died", "transferred", "appointed"))


def end_reason(event: str) -> str | None:
    lower = event.lower()
    if "resign" in lower:
        return "resigned"
    if "retir" in lower:
        return "retired"
    if "died" in lower or "death" in lower:
        return "died"
    if "transfer" in lower or "appoint" in lower:
        return "transferred"
    return "other"


def appointing_pope(title: str) -> str | None:
    match = re.search(r"\bby Pope\s+([^,.;()]+)", title, flags=re.I)
    return clean_text(match.group(1)) if match else None


def title_without_pope(title: str) -> str:
    return re.sub(r"\s+by Pope\s+[^,.;()]+", "", title, flags=re.I)


def parse_see_name(title: str, links: list[Link]) -> str | None:
    for link in links:
        if link.href and "/diocese/" in link.href:
            return clean_text(link.text)
    text = title_without_pope(title)
    patterns = [
        r"^(?:Auxiliary Bishop|Coadjutor Bishop|Coadjutor Archbishop|Archbishop|Bishop|Apostolic Administrator)\s+of\s+(.+)$",
        r"^(?:Appointed|Installed|Succeeded as)\s+(?:Auxiliary Bishop|Coadjutor Bishop|Coadjutor Archbishop|Archbishop|Bishop)\s+of\s+(.+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            see = re.split(r"\s+by Pope\b|,", match.group(1), maxsplit=1, flags=re.I)[0]
            return clean_text(see)
    return None


def parse_event_rows(parser: ChHtmlParser) -> list[dict[str, Any]]:
    event_table = None
    for table in parser.tables:
        if not table.rows:
            continue
        headers = [normalize(cell.text) for cell in table.rows[0].cells]
        if "date" in headers and "event" in headers:
            event_table = table
            break
    if event_table is None:
        return []

    rows = []
    for row in event_table.rows[1:]:
        if len(row.cells) < 3:
            continue
        title_cell = row.cells[3] if len(row.cells) >= 4 else row.cells[-1]
        rows.append(
            {
                "date_text": row.cells[0].text,
                "date": parse_ch_date(row.cells[0].text),
                "event": row.cells[2].text,
                "title": title_cell.text,
                "links": title_cell.links,
            }
        )
    return rows


def parse_place_rows(parser: ChHtmlParser) -> dict[str, str]:
    places: dict[str, str] = {}
    for table in parser.tables:
        if not table.rows:
            continue
        headers = [normalize(cell.text) for cell in table.rows[0].cells]
        if "event" not in headers or "place" not in headers:
            continue
        for row in table.rows[1:]:
            if len(row.cells) >= 2:
                places[normalize(row.cells[0].text)] = row.cells[1].text
    return places


def parse_ch_page(html_text: str) -> dict[str, Any]:
    parser = ChHtmlParser()
    parser.feed(html_text)
    events = parse_event_rows(parser)
    places = parse_place_rows(parser)

    principal = None
    principal_ch_id = None
    co_consecrators = []

    principal_match = re.search(r"Principal Consecrator:.*?<ul>(.*?)</ul>", html_text, flags=re.I | re.S)
    if principal_match:
        links = extract_links(principal_match.group(1))
        if links:
            principal = strip_crosses(links[0].text)
            principal_ch_id = bishop_href_to_ch_id(links[0].href)

    co_match = re.search(r"Principal Co-Consecrators?:.*?<ul>(.*?)</ul>", html_text, flags=re.I | re.S)
    if co_match:
        for link in extract_links(co_match.group(1)):
            ch_id = bishop_href_to_ch_id(link.href)
            if ch_id:
                co_consecrators.append({"name": strip_crosses(link.text), "ch_id": ch_id})

    return {
        "page_title": parser.page_title,
        "events": events,
        "places": places,
        "principal_consecrator": principal,
        "principal_consecrator_ch_id": principal_ch_id,
        "co_consecrators": co_consecrators,
    }


def extract_links(fragment: str) -> list[Link]:
    parser = ChHtmlParser()
    parser.feed(f"<table><tr><td>{fragment}</td></tr></table>")
    if not parser.tables or not parser.tables[0].rows or not parser.tables[0].rows[0].cells:
        return []
    return parser.tables[0].rows[0].cells[0].links


def load_people(conn) -> list[dict[str, Any]]:
    with dict_cursor(conn) as cur:
        cur.execute(
            """
            select id, first_name, middle_name, last_name, catholic_hierarchy_id, wikidata_id
            from person
            where catholic_hierarchy_id is not null
            order by last_name, first_name, catholic_hierarchy_id
            """
        )
        return [dict(row) for row in cur.fetchall()]


def load_sees(conn) -> list[dict[str, Any]]:
    with dict_cursor(conn) as cur:
        cur.execute(
            """
            select s.id, s.name, s.see_type, s.state_region, r.name as rite_name, r.type as rite_type
            from see s
            join rite r on r.id = s.rite_id
            """
        )
        return [dict(row) for row in cur.fetchall()]


def rite_hint(raw_name: str | None) -> str | None:
    if not raw_name:
        return None
    raw = raw_name.lower()
    if "ukrainian" in raw:
        return "Ukrainian"
    if "ruthenian" in raw or "byzantine" in raw:
        return "Ruthenian"
    if "romanian" in raw:
        return "Romanian"
    if "chaldean" in raw:
        return "Chaldean"
    if "melkite" in raw:
        return "Melkite"
    if "maronite" in raw:
        return "Maronite"
    return None


def choose_see(
    candidates: list[dict[str, Any]],
    raw_name: str | None,
    alias_type: str | None,
    alias_rite: str | None,
    alias_state: str | None,
) -> dict[str, Any] | None:
    if not candidates:
        return None

    filtered = candidates
    if alias_state:
        state_matches = [see for see in filtered if normalize(see.get("state_region")) == normalize(alias_state)]
        if len(state_matches) == 1:
            return state_matches[0]
        if state_matches:
            filtered = state_matches

    target_rite = alias_rite or rite_hint(raw_name)
    if target_rite:
        rite_matches = [see for see in filtered if normalize(see.get("rite_name")) == normalize(target_rite)]
        if len(rite_matches) == 1:
            return rite_matches[0]
        if rite_matches:
            filtered = rite_matches

    if alias_type:
        type_matches = [see for see in filtered if normalize(see["see_type"]) == normalize(alias_type)]
        if len(type_matches) == 1:
            return type_matches[0]
        if type_matches:
            filtered = type_matches

    latin = [see for see in filtered if normalize(see.get("rite_name")) == "latin" or normalize(see.get("rite_type")) == "latin"]
    if len(latin) == 1:
        return latin[0]

    return filtered[0] if len(filtered) == 1 else None


def match_see(raw_name: str | None, sees: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not raw_name:
        return None
    alias_type = SEE_ALIAS_TYPES.get(raw_name)
    alias_rite = SEE_ALIAS_RITES.get(raw_name)
    alias_state = SEE_ALIAS_STATES.get(raw_name)
    aliased = SEE_ALIASES.get(raw_name, raw_name)
    if aliased is None:
        return None
    clean = aliased
    clean = clean_see_name(clean)
    norm = normalize(clean)
    exact = [see for see in sees if normalize(see["name"]) == norm]
    matched = choose_see(exact, raw_name, alias_type, alias_rite, alias_state)
    if matched:
        return matched

    city = normalize(re.split(r",|\bin\b", clean, maxsplit=1, flags=re.I)[0])
    city_matches = [see for see in sees if normalize(see["name"]) == city]
    matched = choose_see(city_matches, raw_name, alias_type, alias_rite, alias_state)
    if matched:
        return matched

    substring = [see for see in sees if city and (city in normalize(see["name"]) or normalize(see["name"]) in city)]
    return choose_see(substring, raw_name, alias_type, alias_rite, alias_state)


def is_split_diocese(raw_name: str | None) -> bool:
    if not raw_name:
        return False
    return normalize(raw_name) in {normalize(name) for name in SPLIT_DIOCESES}


def is_expected_unmatched(raw_name: str | None) -> bool:
    if not raw_name:
        return False
    if raw_name in SEE_ALIASES and SEE_ALIASES[raw_name] is None:
        return True
    return normalize(raw_name) in {normalize(name) for name in EXPECTED_UNMATCHED_SEES}


def clean_see_name(raw_name: str) -> str:
    text = clean_text(raw_name)
    text = re.sub(r"^(Archdiocese|Diocese|Eparchy|Archeparchy)\s+of\s+", "", text, flags=re.I)
    text = re.sub(r",\s*(USA|United States).*$", "", text, flags=re.I)
    return text.strip()


def find_person_by_ch_id(conn, ch_id: str | None) -> dict[str, Any] | None:
    if not ch_id:
        return None
    with dict_cursor(conn) as cur:
        cur.execute("select id, first_name, middle_name, last_name from person where catholic_hierarchy_id = %s limit 1", (ch_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def find_person_by_name(conn, name: str | None) -> dict[str, Any] | None:
    if not name:
        return None
    parts = [part for part in re.sub(r",.*$", "", name).split() if part]
    if len(parts) < 2:
        return None
    first, last = parts[0], parts[-1]
    with dict_cursor(conn) as cur:
        cur.execute(
            """
            select id, first_name, middle_name, last_name
            from person
            where lower(first_name) = lower(%s) and lower(last_name) = lower(%s)
            limit 2
            """,
            (first, last),
        )
        rows = [dict(row) for row in cur.fetchall()]
        return rows[0] if len(rows) == 1 else None


def assignment_exists(conn, person_id: str, see_id: str, role: str, start_date: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            select 1 from assignment
            where person_id = %s and see_id = %s and role = %s and start_date = %s
            limit 1
            """,
            (person_id, see_id, role, start_date),
        )
        return cur.fetchone() is not None


def create_assignment(conn, person_id: str, see: dict[str, Any], assignment: dict[str, Any], dry_run: bool) -> bool:
    if not assignment["start_date"] or assignment_exists(conn, person_id, see["id"], assignment["role"], assignment["start_date"]):
        return False
    if dry_run:
        return True
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into assignment (
              id, person_id, see_id, role, start_date, installed_date, end_date, start_reason,
              end_reason, appointing_pope, is_current, created_at, updated_at
            )
            values (%s, %s, %s, %s, %s, %s, %s, 'appointed', %s, %s, %s, now(), now())
            """,
            (
                new_id(),
                person_id,
                see["id"],
                assignment["role"],
                assignment["start_date"],
                assignment["installed_date"],
                assignment["end_date"],
                assignment["end_reason"],
                assignment["appointing_pope"],
                assignment["end_date"] is None,
            ),
        )
    return True


def build_assignments(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    assignments = []
    open_assignment = None

    for event in events:
        role = title_role(event["title"])
        see_name = parse_see_name(event["title"], event["links"])
        is_appt = appointment_event(event["event"]) and role and see_name
        is_install = installation_event(event["event"]) and see_name

        if is_appt:
            if open_assignment and normalize(open_assignment["see_name"]) != normalize(see_name):
                open_assignment["end_date"] = event["date"]
                open_assignment["end_reason"] = "transferred"
                assignments.append(open_assignment)
                open_assignment = None
            if open_assignment and is_install:
                open_assignment["installed_date"] = event["date"]
            else:
                open_assignment = {
                    "role": role,
                    "see_name": see_name,
                    "start_date": event["date"],
                    "installed_date": event["date"] if is_install else None,
                    "end_date": None,
                    "end_reason": None,
                    "appointing_pope": appointing_pope(event["title"]),
                }
            continue

        if is_install and open_assignment and normalize(open_assignment["see_name"]) == normalize(see_name):
            open_assignment["installed_date"] = event["date"]
            continue

        if end_event(event["event"]) and open_assignment:
            open_assignment["end_date"] = event["date"]
            open_assignment["end_reason"] = end_reason(event["event"])
            assignments.append(open_assignment)
            open_assignment = None

    if open_assignment:
        assignments.append(open_assignment)
    return assignments


def ordained_priest_event(events: list[dict[str, Any]]) -> dict[str, Any] | None:
    for event in events:
        if "ordained priest" in event["event"].lower():
            return event
    return None


def ordained_bishop_event(events: list[dict[str, Any]]) -> dict[str, Any] | None:
    for event in events:
        if "ordained bishop" in event["event"].lower():
            return event
    return None


def ensure_priesthood_ordination(conn, person_id: str, event: dict[str, Any], sees: list[dict[str, Any]], dry_run: bool) -> bool:
    if not event or not event["date"]:
        return False
    with conn.cursor() as cur:
        cur.execute("select 1 from priesthood_ordination where person_id = %s limit 1", (person_id,))
        if cur.fetchone():
            return False
    see = match_see(parse_see_name(event["title"], event["links"]), sees)
    if dry_run:
        return True
    with conn.cursor() as cur:
        cur.execute(
            """
            insert into priesthood_ordination (
              id, person_id, date, location, ordaining_bishop_id, incardination_see_id,
              ordination_see_id, created_at, updated_at
            )
            values (%s, %s, %s, %s, null, %s, %s, now(), now())
            """,
            (new_id(), person_id, event["date"], None, see["id"] if see else None, see["id"] if see else None),
        )
    return True


def ensure_episcopal_consecration(
    conn,
    person_id: str,
    event: dict[str, Any] | None,
    parsed: dict[str, Any],
    dry_run: bool,
) -> tuple[bool, int]:
    date = event["date"] if event else None
    if not date:
        return False, 0

    principal = find_person_by_ch_id(conn, parsed["principal_consecrator_ch_id"]) or find_person_by_name(conn, parsed["principal_consecrator"])
    location = parsed["places"].get("ordained bishop")
    with dict_cursor(conn) as cur:
        cur.execute("select id from episcopal_consecration where person_id = %s limit 1", (person_id,))
        existing = cur.fetchone()

    consecration_id = existing["id"] if existing else new_id()
    changed = False
    co_created = 0
    if dry_run:
        changed = True
    elif existing:
        with conn.cursor() as cur:
            cur.execute(
                """
                update episcopal_consecration
                set date = coalesce(date, %s),
                    location = coalesce(location, %s),
                    principal_consecrator_id = coalesce(principal_consecrator_id, %s),
                    updated_at = now()
                where id = %s
                """,
                (date, location, principal["id"] if principal else None, consecration_id),
            )
            changed = cur.rowcount > 0
    else:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into episcopal_consecration (
                  id, person_id, date, location, principal_consecrator_id, created_at, updated_at
                )
                values (%s, %s, %s, %s, %s, now(), now())
                """,
                (consecration_id, person_id, date, location, principal["id"] if principal else None),
            )
            changed = True

    for ordinal, co in enumerate(parsed["co_consecrators"], start=1):
        co_person = find_person_by_ch_id(conn, co["ch_id"]) or find_person_by_name(conn, co["name"])
        if not co_person:
            continue
        if dry_run:
            co_created += 1
            continue
        with conn.cursor() as cur:
            cur.execute(
                """
                select 1 from episcopal_consecration_co_consecrator
                where consecration_id = %s and co_consecrator_id = %s
                limit 1
                """,
                (consecration_id, co_person["id"]),
            )
            if cur.fetchone():
                continue
            cur.execute(
                """
                insert into episcopal_consecration_co_consecrator (
                  id, consecration_id, co_consecrator_id, ordinal
                )
                values (%s, %s, %s, %s)
                """,
                (new_id(), consecration_id, co_person["id"], ordinal),
            )
            co_created += 1

    return changed, co_created


def verify_cardinalate(conn, person_id: str, events: list[dict[str, Any]]) -> bool:
    has_cardinal_event = any("cardinal" in event["event"].lower() or "cardinal" in event["title"].lower() for event in events)
    if not has_cardinal_event:
        return False
    with conn.cursor() as cur:
        cur.execute("select 1 from cardinalate where person_id = %s limit 1", (person_id,))
        return cur.fetchone() is not None


def fetch_page(ch_id: str) -> str:
    response = requests.get(BASE_URL.format(ch_id=ch_id), headers={"User-Agent": USER_AGENT}, timeout=30)
    response.raise_for_status()
    return response.text


def main() -> None:
    args = parse_args()
    logger = setup_logger("import-assignments-ch")
    conn = connect_db()
    stats = {
        "processed": 0,
        "fetched": 0,
        "fetch_errors": 0,
        "assignments_created": 0,
        "ordinations_created": 0,
        "consecrations_updated": 0,
        "co_consecrators_created": 0,
        "names_corrected": 0,
        "cardinalates_verified": 0,
        "cardinalates_missing": 0,
        "errored": 0,
    }
    unmatched_sees: list[tuple[str, str, str]] = []
    split_dioceses: list[tuple[str, str, str | None, str | None, str]] = []
    expected_unmatched: list[tuple[str, str, str]] = []

    try:
        conn.autocommit = False
        people = load_people(conn)
        if args.only_ch_ids:
            wanted = {item.strip() for item in args.only_ch_ids.split(",") if item.strip()}
            people = [person for person in people if person["catholic_hierarchy_id"] in wanted]
        if args.start_after:
            passed = False
            filtered = []
            for person in people:
                if passed:
                    filtered.append(person)
                elif person["catholic_hierarchy_id"] == args.start_after:
                    passed = True
            people = filtered
        if args.limit:
            people = people[: args.limit]
        sees = load_sees(conn)

        logger.info("Processing %s persons with Catholic-Hierarchy IDs", len(people))
        for index, person in enumerate(people, start=1):
            ch_id = person["catholic_hierarchy_id"]
            label = f"{person['first_name']} {person['last_name']} ({ch_id})"
            stats["processed"] += 1
            try:
                logger.info("[%s/%s] Fetching %s", index, len(people), label)
                html_text = fetch_page(ch_id)
                stats["fetched"] += 1
                parsed = parse_ch_page(html_text)
                events = parsed["events"]

                if person_needs_name_fix(person):
                    parsed_name = parse_name_from_page_title(parsed["page_title"])
                    if parsed_name:
                        logger.info("  UPDATE name from CH title: %s -> %s %s", label, parsed_name[0], parsed_name[2])
                        stats["names_corrected"] += 1
                        if not args.dry_run:
                            with conn.cursor() as cur:
                                cur.execute(
                                    """
                                    update person
                                    set first_name = %s, middle_name = %s, last_name = %s, updated_at = now()
                                    where id = %s
                                    """,
                                    (parsed_name[0], parsed_name[1], parsed_name[2], person["id"]),
                                )

                for assignment in build_assignments(events):
                    if is_split_diocese(assignment["see_name"]):
                        split_dioceses.append(
                            (
                                label,
                                assignment["role"],
                                assignment["start_date"],
                                assignment["end_date"],
                                assignment["see_name"],
                            )
                        )
                        logger.warning(
                            "  SPLIT DIOCESE — manual review needed: %s | %s | %s to %s | %s",
                            label,
                            assignment["role"],
                            assignment["start_date"],
                            assignment["end_date"],
                            assignment["see_name"],
                        )
                        continue
                    if is_expected_unmatched(assignment["see_name"]):
                        expected_unmatched.append((label, assignment["role"], assignment["see_name"]))
                        logger.info("  EXPECTED UNMATCHED SEE: %s | %s | %s", label, assignment["role"], assignment["see_name"])
                        continue
                    see = match_see(assignment["see_name"], sees)
                    if not see:
                        unmatched_sees.append((label, assignment["role"], assignment["see_name"]))
                        logger.warning("  NO SEE MATCH: %s | %s | %s", label, assignment["role"], assignment["see_name"])
                        continue
                    if create_assignment(conn, person["id"], see, assignment, args.dry_run):
                        stats["assignments_created"] += 1
                        logger.info("  CREATE assignment: %s @ %s (%s)", assignment["role"], see["name"], assignment["start_date"])

                if ensure_priesthood_ordination(conn, person["id"], ordained_priest_event(events), sees, args.dry_run):
                    stats["ordinations_created"] += 1
                    logger.info("  CREATE priesthood ordination")

                consecration_changed, co_created = ensure_episcopal_consecration(
                    conn,
                    person["id"],
                    ordained_bishop_event(events),
                    parsed,
                    args.dry_run,
                )
                if consecration_changed:
                    stats["consecrations_updated"] += 1
                    logger.info("  UPSERT episcopal consecration")
                stats["co_consecrators_created"] += co_created

                if any("cardinal" in event["event"].lower() or "cardinal" in event["title"].lower() for event in events):
                    if verify_cardinalate(conn, person["id"], events):
                        stats["cardinalates_verified"] += 1
                    else:
                        stats["cardinalates_missing"] += 1
                        logger.warning("  CARDINAL EVENT without Cardinalate record: %s", label)

                time.sleep(REQUEST_DELAY_SECONDS)
            except requests.HTTPError as exc:
                stats["fetch_errors"] += 1
                logger.warning("  FETCH ERROR for %s: %s", label, exc)
                time.sleep(REQUEST_DELAY_SECONDS)
            except Exception as exc:
                stats["errored"] += 1
                logger.exception("  ERROR processing %s: %s", label, exc)
                time.sleep(REQUEST_DELAY_SECONDS)

        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()

        logger.info("")
        logger.info(
            "Summary: processed=%s fetched=%s fetch_errors=%s assignments_created=%s ordinations_created=%s "
            "consecrations_updated=%s co_consecrators_created=%s names_corrected=%s "
            "cardinalates_verified=%s cardinalates_missing=%s unmatched_sees=%s expected_unmatched=%s split_dioceses=%s errored=%s dry_run=%s",
            stats["processed"],
            stats["fetched"],
            stats["fetch_errors"],
            stats["assignments_created"],
            stats["ordinations_created"],
            stats["consecrations_updated"],
            stats["co_consecrators_created"],
            stats["names_corrected"],
            stats["cardinalates_verified"],
            stats["cardinalates_missing"],
            len(unmatched_sees),
            len(expected_unmatched),
            len(split_dioceses),
            stats["errored"],
            args.dry_run,
        )
        if expected_unmatched:
            logger.info("Expected unmatched sees:")
            for person_label, role, see_name in expected_unmatched:
                logger.info("- %s | %s | %s", person_label, role, see_name)
        if split_dioceses:
            logger.info("Split dioceses requiring manual review:")
            for person_label, role, start_date, end_date, see_name in split_dioceses:
                logger.info("- %s | %s | %s to %s | %s", person_label, role, start_date, end_date, see_name)
        if unmatched_sees:
            logger.info("Unmatched sees:")
            for person_label, role, see_name in unmatched_sees:
                logger.info("- %s | %s | %s", person_label, role, see_name)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
