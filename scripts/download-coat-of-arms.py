#!/usr/bin/env python3
"""Download coat-of-arms images from Wikimedia Commons, upload to Supabase Storage, update database.

For each See record whose coat_of_arms_url points to Wikimedia:
  1. Downloads the original file (strips ?width= params to get full-res).
  2. Uploads to the 'coat-of-arms' Supabase Storage bucket as {slug}.{ext}.
  3. For SVG files, renders a 150 DPI PNG with svglib/reportlab and uploads as {slug}.png.
  4. Updates coat_of_arms_url in the database to the PNG URL for SVGs, otherwise the image URL.

Respects Wikimedia rate limits with a 1-second delay between downloads.

Dependencies:
  pip install requests psycopg2-binary
  pip install svglib reportlab
"""

from __future__ import annotations

import argparse
import os
import tempfile
import time
import urllib.parse

import requests
from reportlab.graphics import renderPM
from svglib.svglib import svg2rlg

from wikidata_import_common import connect_db, dict_cursor, load_env_local, setup_logger

BUCKET = "coat-of-arms"
RATE_LIMIT_DELAY = 1.0
USER_AGENT = "HierarchyDirectory/1.0 ImageIngestor (https://hierarchy.directory)"
CONTENT_TYPE_EXT: dict[str, str] = {
    "image/svg+xml": "svg",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--dry-run", action="store_true", help="Print what would happen without writing anything.")
    p.add_argument("--limit", type=int, default=None, help="Process at most N records.")
    p.add_argument(
        "--force",
        action="store_true",
        help="Re-download and overwrite records already hosted on Supabase.",
    )
    return p.parse_args()


def supabase_config() -> tuple[str, str]:
    load_env_local()
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local")
    return url, key


def is_wikimedia_url(url: str) -> bool:
    return "wikimedia.org" in url or "wikipedia.org" in url


def original_download_url(stored_url: str) -> str:
    """Strip query params to download the full-resolution original."""
    parsed = urllib.parse.urlparse(stored_url)
    return urllib.parse.urlunparse(parsed._replace(query=""))


def download_image(url: str) -> tuple[bytes, str]:
    """Download an image following redirects. Returns (bytes, content_type)."""
    resp = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=60,
        allow_redirects=True,
    )
    resp.raise_for_status()
    content_type = resp.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
    return resp.content, content_type


def download_wikimedia_png_thumbnail(stored_url: str) -> bytes:
    """Download Wikimedia's rendered PNG thumbnail for an SVG FilePath URL."""
    content, content_type = download_image(stored_url)
    if content_type != "image/png":
        raise RuntimeError(f"Wikimedia thumbnail was {content_type}, not image/png")
    return content


def upload_file(supabase_url: str, service_key: str, path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to Supabase Storage and return the public CDN URL."""
    endpoint = f"{supabase_url}/storage/v1/object/{BUCKET}/{path}"
    resp = requests.post(
        endpoint,
        data=data,
        headers={
            "Authorization": f"Bearer {service_key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        timeout=120,
    )
    resp.raise_for_status()
    return f"{supabase_url}/storage/v1/object/public/{BUCKET}/{path}"


def render_svg_to_png(svg_content: bytes) -> bytes:
    """Render SVG bytes to PNG bytes using svglib/reportlab at 150 DPI."""
    with tempfile.TemporaryDirectory() as temp_dir:
        svg_path = os.path.join(temp_dir, "coat-of-arms.svg")
        png_path = os.path.join(temp_dir, "coat-of-arms.png")

        with open(svg_path, "wb") as svg_file:
            svg_file.write(svg_content)

        drawing = svg2rlg(svg_path)
        if drawing is None:
            raise RuntimeError("svglib could not parse SVG")

        renderPM.drawToFile(drawing, png_path, fmt="PNG", dpi=150)
        with open(png_path, "rb") as png_file:
            return png_file.read()


def main() -> None:
    args = parse_args()
    logger = setup_logger("download-coat-of-arms")

    supabase_url, service_key = supabase_config()
    conn = connect_db()
    stats = {"downloaded": 0, "skipped": 0, "errored": 0}

    try:
        with dict_cursor(conn) as cur:
            cur.execute(
                "SELECT id, name, slug, coat_of_arms_url FROM see WHERE coat_of_arms_url IS NOT NULL ORDER BY name"
            )
            sees = [dict(row) for row in cur.fetchall()]

        if args.limit:
            sees = sees[: args.limit]

        logger.info("Found %d sees with coat_of_arms_url", len(sees))

        for see in sees:
            see_id: str = see["id"]
            see_name: str = see["name"]
            see_slug: str = see["slug"] or see_id
            current_url: str = see["coat_of_arms_url"]

            if not is_wikimedia_url(current_url) and not args.force:
                logger.info("SKIP (already on CDN): %s", see_name)
                stats["skipped"] += 1
                continue

            try:
                download_from = original_download_url(current_url)
                logger.info("Downloading: %s", see_name)

                content, content_type = download_image(download_from)
                time.sleep(RATE_LIMIT_DELAY)

                ext = CONTENT_TYPE_EXT.get(content_type, "jpg")
                storage_path = f"{see_slug}.{ext}"
                png_data = None
                png_path = f"{see_slug}.png"

                if content_type == "image/svg+xml":
                    try:
                        png_data = render_svg_to_png(content)
                    except Exception as exc:
                        logger.warning(
                            "  Local SVG->PNG render failed for %s: %s; trying Wikimedia thumbnail",
                            see_name,
                            exc,
                        )
                        png_data = download_wikimedia_png_thumbnail(current_url)

                if args.dry_run:
                    logger.info(
                        "  DRY RUN: %s (%s, %d bytes) -> %s/%s",
                        see_name,
                        content_type,
                        len(content),
                        BUCKET,
                        storage_path,
                    )
                    if png_data is not None:
                        logger.info(
                            "  DRY RUN: rendered PNG (%d bytes) -> %s/%s",
                            len(png_data),
                            BUCKET,
                            png_path,
                        )
                    stats["downloaded"] += 1
                    continue

                public_url = upload_file(supabase_url, service_key, storage_path, content, content_type)
                logger.info("  Uploaded: %s", storage_path)
                db_url = public_url

                if png_data is not None:
                    db_url = upload_file(supabase_url, service_key, png_path, png_data, "image/png")
                    logger.info("  PNG render: %s", png_path)

                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE see SET coat_of_arms_url = %s, updated_at = now() WHERE id = %s",
                        (db_url, see_id),
                    )
                conn.commit()
                logger.info("  DB updated: %s -> %s", see_name, db_url)
                stats["downloaded"] += 1

            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR processing %s: %s", see_name, exc)
                try:
                    conn.rollback()
                except Exception:
                    pass

        logger.info(
            "Summary: downloaded=%d  skipped=%d  errored=%d",
            stats["downloaded"],
            stats["skipped"],
            stats["errored"],
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
