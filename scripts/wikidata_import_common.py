#!/usr/bin/env python3
"""Shared helpers for Wikidata import scripts."""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote

import psycopg2
import psycopg2.extras
import requests

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "HierarchyDirectory/1.0 WikidataImport (https://hierarchy.directory)"


def script_dir() -> Path:
    return Path(__file__).resolve().parent


def project_root() -> Path:
    return script_dir().parent


def load_env_local() -> None:
    path = project_root() / ".env.local"
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def setup_logger(name: str) -> logging.Logger:
    log_dir = script_dir() / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"{name}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"

    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    logger = logging.getLogger(name)
    logger.handlers.clear()
    logger.setLevel(logging.INFO)

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(console)

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(file_handler)

    logger.info("Logging to %s", log_file)
    return logger


def common_args(description: str) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing to the database.")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N rows.")
    return parser.parse_args()


def connect_db():
    load_env_local()
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is missing from .env.local")
    return psycopg2.connect(url)


def dict_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


def sparql(query: str, logger: logging.Logger, *, timeout: int = 75, retries: int = 5) -> list[dict[str, Any]]:
    delay = 2.0
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(
                SPARQL_ENDPOINT,
                params={"query": query, "format": "json"},
                headers={"Accept": "application/sparql-results+json", "User-Agent": USER_AGENT},
                timeout=timeout,
            )
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                sleep_for = float(retry_after) if retry_after and retry_after.isdigit() else delay
                logger.warning("Wikidata returned 429; sleeping %.1fs", sleep_for)
                time.sleep(sleep_for)
                delay = min(delay * 2, 60)
                continue
            response.raise_for_status()
            time.sleep(1.0)
            return response.json()["results"]["bindings"]
        except (requests.Timeout, requests.ConnectionError) as exc:
            if attempt == retries:
                raise
            logger.warning("SPARQL attempt %s/%s failed: %s", attempt, retries, exc)
            time.sleep(delay)
            delay = min(delay * 2, 60)
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else "unknown"
            if status in (500, 502, 503, 504) and attempt < retries:
                logger.warning("SPARQL returned %s; retrying in %.1fs", status, delay)
                time.sleep(delay)
                delay = min(delay * 2, 60)
                continue
            raise
    return []


def value(row: dict[str, Any], key: str) -> str | None:
    item = row.get(key)
    return item.get("value") if item else None


def qid(raw: str | None) -> str | None:
    if not raw:
        return None
    match = re.search(r"(Q\d+)$", raw)
    return match.group(1) if match else raw


def iso_date(raw: str | None) -> str | None:
    if not raw:
        return None
    match = re.match(r"^\+?(\d{4}-\d{2}-\d{2})", raw)
    return match.group(1) if match else None


def int_value(raw: str | None) -> int | None:
    if raw is None:
        return None
    try:
        return int(float(raw))
    except ValueError:
        return None


def commons_file_url(filename: str | None) -> str | None:
    """Convert a Wikimedia Commons filename or URL to a direct renderable image URL.

    Wikimedia returns CommonsMedia values as Special:FilePath URIs. We normalise
    to https and add ?width=400 so the URL resolves to a raster PNG everywhere,
    including contexts that cannot render SVG (PDF generators, og:image, etc.).
    The download-coat-of-arms / download-portraits scripts strip this param before
    downloading the original file for re-hosting on Supabase Storage.
    """
    if not filename:
        return None
    if filename.startswith("http://"):
        filename = "https://" + filename[7:]
    if filename.startswith("https://"):
        # Convert /wiki/File: description page URLs to Special:FilePath image URLs
        if "/wiki/File:" in filename:
            file_part = filename.split("/wiki/File:", 1)[1]
            filename = "https://commons.wikimedia.org/wiki/Special:FilePath/" + quote(file_part.replace(" ", "_"))
        # Add ?width=400 if not already parameterised
        if "Special:FilePath/" in filename and "?" not in filename:
            return filename + "?width=400"
        return filename
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + quote(filename.replace(" ", "_")) + "?width=400"


def slugify(text: str) -> str:
    slug = text.lower()
    slug = re.sub(r"['`]", "", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug or "item"


def unique_slug(conn, table: str, base: str) -> str:
    slug = base
    index = 2
    with conn.cursor() as cur:
        while True:
            cur.execute(f'select 1 from "{table}" where slug = %s limit 1', (slug,))
            if cur.fetchone() is None:
                return slug
            slug = f"{base}-{index}"
            index += 1


def new_id() -> str:
    return str(uuid.uuid4())


def ensure_country(conn, name: str, iso_code: str, dry_run: bool, logger: logging.Logger) -> str:
    with dict_cursor(conn) as cur:
        cur.execute("select id from country where iso_code = %s or name = %s limit 1", (iso_code, name))
        row = cur.fetchone()
        if row:
            return row["id"]
        country_id = new_id()
        logger.info("CREATE country: %s", name)
        if not dry_run:
            cur.execute("insert into country (id, name, iso_code) values (%s, %s, %s)", (country_id, name, iso_code))
        return country_id


def ensure_rite(conn, name: str, rite_type: str, dry_run: bool, logger: logging.Logger) -> str:
    with dict_cursor(conn) as cur:
        cur.execute("select id from rite where lower(name) = lower(%s) limit 1", (name,))
        row = cur.fetchone()
        if row:
            return row["id"]
        rite_id = new_id()
        logger.info("CREATE rite: %s", name)
        if not dry_run:
            cur.execute("insert into rite (id, name, type) values (%s, %s, %s)", (rite_id, name, rite_type))
        return rite_id


def existing_by_wikidata(conn, table: str, wikidata_id: str) -> dict[str, Any] | None:
    with dict_cursor(conn) as cur:
        cur.execute(f'select * from "{table}" where wikidata_id = %s limit 1', (wikidata_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def batched(items: list[str], size: int) -> list[list[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]
