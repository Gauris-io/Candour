"""
etl/fetch_tmdb.py

Populates raw_tmdb.project by, for each tconst in scope:
  1. Calling /find/{imdb_id}?external_source=imdb_id to resolve the TMDb movie ID
     (avoids fragile title-name matching -- same principle used for Wikidata's
     wdt:P345 lookup).
  2. Calling /movie/{tmdb_id} for full details (budget, revenue, status, runtime).

Scope matches fetch_wikidata.py: titles from raw_imdb.title_basics/title_ratings
with numVotes > 5000 -- keeps all three sources aligned on the same title set.

Run this AFTER sql/00_raw/imdb_schema.sql and sql/00_raw/tmdb_schema.sql have
both been applied.

Requires: pip install clickhouse-connect requests python-dotenv

Resumable: on start, it queries which tconsts already exist in
raw_tmdb.project and skips them. Safe to re-run after a crash.
"""

import os
import sys
import time
from datetime import datetime

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv
import clickhouse_connect

# ---- Config ----------------------------------------------------------------

load_dotenv()
bearer_token = os.getenv("TMDB_BEARER_TOKEN")
if not bearer_token:
    raise ValueError("API token not found. Please check your .env file.")

HEADERS = {
    "accept": "application/json",
    "Authorization": f"Bearer {bearer_token}",
    
}

CH_HOST = "localhost"
CH_PORT = 8123
CH_USER = "default"
CH_PASSWORD = ""

MIN_NUM_VOTES = 5000
SLEEP_BETWEEN_TITLES = 0.1  # politeness delay; TMDb's limits are generous but stay courteous
INSERT_EVERY = 200            # flush to ClickHouse every N processed titles, not just at the end

# ---- HTTP session (same retry pattern as the original test script) --------

session = requests.Session()
retries = Retry(
    total=5,
    backoff_factor=1,
    status_forcelist=[429, 502, 503, 504],
    connect=5,
)
session.mount("https://", HTTPAdapter(max_retries=retries))


def find_tmdb_id(tconst):
    url = f"https://api.themoviedb.org/3/find/{tconst}"
    try:
        resp = session.get(url, headers=HEADERS, params={"external_source": "imdb_id"}, timeout=10)
    except requests.exceptions.ConnectionError as e:
        print(f"  [warn] connection error resolving {tconst}: {e}", file=sys.stderr)
        return None

    if resp.status_code != 200:
        return None

    results = resp.json().get("movie_results", [])
    if not results:
        return None
    return results[0]["id"]  # first match; TMDb rarely returns >1 for a given imdb_id


def get_movie_details(tmdb_id):
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    try:
        resp = session.get(url, headers=HEADERS, timeout=10)
    except requests.exceptions.ConnectionError as e:
        print(f"  [warn] connection error fetching movie {tmdb_id}: {e}", file=sys.stderr)
        return None

    if resp.status_code != 200:
        return None
    return resp.json()


def parse_release_date(raw):
    if not raw:
        return None
    try:
        parsed = datetime.strptime(raw, "%Y-%m-%d").date()
        if 1900 <= parsed.year <= 2299:  # same Date32-safe range used for the Wikidata fetch
            return parsed
    except ValueError:
        pass
    return None


def build_row(tconst, details):
    budget = details.get("budget") or None      # TMDb uses 0 for "unknown" -- treat as NULL
    revenue = details.get("revenue") or None
    runtime = details.get("runtime") or None
    return (
        tconst,
        details.get("id"),
        details.get("title", ""),
        details.get("original_title", ""),
        details.get("status", ""),
        parse_release_date(details.get("release_date")),
        budget,
        revenue,
        runtime,
    )


# ---- ClickHouse --------------------------------------------------------------

def get_target_tconsts(client):
    result = client.query(f"""
        SELECT tb.tconst
        FROM raw_imdb.title_basics AS tb
        INNER JOIN raw_imdb.title_ratings AS tr ON tb.tconst = tr.tconst
        WHERE tr.numVotes > {MIN_NUM_VOTES}
    """)
    return [row[0] for row in result.result_rows]


def get_already_fetched_tconsts(client):
    try:
        result = client.query("SELECT DISTINCT tconst FROM raw_tmdb.project")
        return set(row[0] for row in result.result_rows)
    except Exception:
        return set()


def insert_rows(client, rows):
    if not rows:
        return
    client.insert(
        "raw_tmdb.project",
        rows,
        column_names=[
            "tconst", "tmdb_id", "title", "original_title", "status",
            "release_date", "budget", "revenue", "runtime",
        ],
    )


# ---- Main ----------------------------------------------------------------

def main():
    client = clickhouse_connect.get_client(
        host=CH_HOST, port=CH_PORT, username=CH_USER, password=CH_PASSWORD,
    )

    print(f"Fetching target tconst list (numVotes > {MIN_NUM_VOTES})...")
    targets = get_target_tconsts(client)
    print(f"  {len(targets)} titles match scope.")

    already_done = get_already_fetched_tconsts(client)
    if already_done:
        before = len(targets)
        targets = [t for t in targets if t not in already_done]
        print(f"  {before - len(targets)} already fetched in a prior run, skipping. "
              f"{len(targets)} remaining.")

    if not targets:
        print("Nothing to do.")
        return

    total = len(targets)
    total_written = 0
    total_no_match = 0
    pending_rows = []

    for idx, tconst in enumerate(targets, start=1):
        tmdb_id = find_tmdb_id(tconst)
        if tmdb_id is None:
            total_no_match += 1
        else:
            details = get_movie_details(tmdb_id)
            if details is not None:
                pending_rows.append(build_row(tconst, details))
                total_written += 1
            else:
                total_no_match += 1

        if idx % INSERT_EVERY == 0 or idx == total:
            insert_rows(client, pending_rows)
            pending_rows = []
            print(f"Progress {idx}/{total}: {total_written} written, "
                  f"{total_no_match} unmatched so far")

        time.sleep(SLEEP_BETWEEN_TITLES)

    print(f"\nDone. {total_written} rows written, {total_no_match} titles had no "
          f"TMDb match out of {total} processed.")


if __name__ == "__main__":
    main()