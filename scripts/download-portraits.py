#!/usr/bin/env python3
"""Download bishop portraits from Wikimedia Commons, upload processed copies to Supabase Storage.

For each Person record whose portrait_url points to Wikimedia:
  1. Downloads the original image.
  2. Converts TIFF/PNG portraits to JPEG when possible.
  3. Resizes to a max 800px longest edge and compresses JPEGs at quality 85.
  4. Uploads only the processed image to the 'portraits' Supabase Storage bucket.
  5. Updates portrait_url in the database to the Supabase CDN URL.

Transparent PNGs are preserved as PNG. Images still over 10MB after processing are skipped
and logged for manual review.

Respects Wikimedia rate limits with a 1-second delay between downloads.

Dependencies:
  pip install requests psycopg2-binary Pillow
"""

from __future__ import annotations

import argparse
from io import BytesIO
import os
import time
import urllib.parse

import requests
from PIL import Image, ImageOps

from wikidata_import_common import connect_db, dict_cursor, load_env_local, setup_logger

BUCKET = "portraits"
MAX_LONG_EDGE = 800
JPEG_QUALITY = 85
MAX_PROCESSED_BYTES = 10 * 1024 * 1024
RATE_LIMIT_DELAY = 1.0
USER_AGENT = "HierarchyDirectory/1.0 ImageIngestor (https://hierarchy.directory)"


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


def has_transparency(image: Image.Image) -> bool:
    if image.mode in ("RGBA", "LA"):
        return image.getchannel("A").getextrema()[0] < 255
    return image.mode == "P" and "transparency" in image.info


def resize_to_max_edge(image: Image.Image) -> Image.Image:
    width, height = image.size
    longest = max(width, height)
    if longest <= MAX_LONG_EDGE:
        return image

    scale = MAX_LONG_EDGE / longest
    new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def process_portrait(content: bytes) -> tuple[bytes, str, str, tuple[int, int], tuple[int, int]]:
    """Return processed bytes, content type, file extension, original size, processed size."""
    with Image.open(BytesIO(content)) as image:
        image = ImageOps.exif_transpose(image)
        original_size = image.size
        image = resize_to_max_edge(image)
        processed_size = image.size

        output = BytesIO()
        if has_transparency(image):
            if image.mode != "RGBA":
                image = image.convert("RGBA")
            image.save(output, format="PNG", optimize=True)
            return output.getvalue(), "image/png", "png", original_size, processed_size

        if image.mode != "RGB":
            image = image.convert("RGB")

        image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        return output.getvalue(), "image/jpeg", "jpg", original_size, processed_size


def main() -> None:
    args = parse_args()
    logger = setup_logger("download-portraits")

    supabase_url, service_key = supabase_config()
    conn = connect_db()
    stats = {"downloaded": 0, "skipped": 0, "manual_review": 0, "errored": 0}

    try:
        with dict_cursor(conn) as cur:
            cur.execute(
                """
                SELECT id,
                       trim(concat_ws(' ', first_name, last_name)) AS name,
                       portrait_url
                FROM person
                WHERE portrait_url IS NOT NULL
                ORDER BY last_name, first_name
                """
            )
            persons = [dict(row) for row in cur.fetchall()]

        if args.limit:
            persons = persons[: args.limit]

        logger.info("Found %d persons with portrait_url", len(persons))

        for person in persons:
            person_id: str = person["id"]
            person_name: str = person["name"] or person_id
            current_url: str = person["portrait_url"]

            if not is_wikimedia_url(current_url) and not args.force:
                logger.info("SKIP (already on CDN): %s", person_name)
                stats["skipped"] += 1
                continue

            try:
                download_from = original_download_url(current_url)
                logger.info("Downloading: %s", person_name)

                content, content_type = download_image(download_from)
                time.sleep(RATE_LIMIT_DELAY)

                if content_type == "image/svg+xml" or not content_type.startswith("image/"):
                    logger.warning(
                        "  MANUAL REVIEW: %s portrait source is not a supported raster image (%s): %s",
                        person_name,
                        content_type,
                        download_from,
                    )
                    stats["manual_review"] += 1
                    continue

                processed, processed_type, ext, original_size, processed_size = process_portrait(content)
                if len(processed) > MAX_PROCESSED_BYTES:
                    logger.warning(
                        "  MANUAL REVIEW: %s processed image still over 10MB "
                        "(source=%s, original=%d bytes, processed=%d bytes, %sx%s -> %sx%s)",
                        person_name,
                        content_type,
                        len(content),
                        len(processed),
                        original_size[0],
                        original_size[1],
                        processed_size[0],
                        processed_size[1],
                    )
                    stats["manual_review"] += 1
                    continue

                storage_path = f"{person_id}.{ext}"

                if args.dry_run:
                    logger.info(
                        "  DRY RUN: %s (%s, %d bytes, %sx%s) -> %s (%d bytes, %sx%s) -> %s/%s",
                        person_name,
                        content_type,
                        len(content),
                        original_size[0],
                        original_size[1],
                        processed_type,
                        len(processed),
                        processed_size[0],
                        processed_size[1],
                        BUCKET,
                        storage_path,
                    )
                    stats["downloaded"] += 1
                    continue

                public_url = upload_file(supabase_url, service_key, storage_path, processed, processed_type)

                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE person SET portrait_url = %s, updated_at = now() WHERE id = %s",
                        (public_url, person_id),
                    )
                conn.commit()
                logger.info("  Updated: %s -> %s", person_name, public_url)
                stats["downloaded"] += 1

            except Exception as exc:
                stats["errored"] += 1
                logger.exception("ERROR processing %s: %s", person_name, exc)
                try:
                    conn.rollback()
                except Exception:
                    pass

        logger.info(
            "Summary: downloaded=%d  skipped=%d  manual_review=%d  errored=%d",
            stats["downloaded"],
            stats["skipped"],
            stats["manual_review"],
            stats["errored"],
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
