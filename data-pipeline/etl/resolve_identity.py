"""
etl/resolve_identity.py

Populates identity.person_bridge by, for each nconst credited (any role) on
a title in scope (numVotes > 5000), calling TMDb's /find/{imdb_id}?external_
source=imdb_id endpoint -- which works for people, not just movies -- to
resolve the matching tmdb_person_id.

Unlike fetch_tmdb.py (movies), this only needs ONE API call per person --
/find already returns the name, no separate "details" call needed for an
identity mapping.

Scope: ~173k unique people across ALL title_principals roles for the
31,673-title scope already used by fetch_wikidata.py / fetch_tmdb.py.
This is a LONG run (expect many hours). It is fully resumable:
  - Safe to stop (Ctrl+C, sleep, shutdown) and re-run later.
  - On start, it skips any nconst already present in identity.person_bridge.
  - Progress is flushed to ClickHouse every INSERT_EVERY people, not just
    at the end, so a crash never loses more than one batch's worth of work.

Requires: pip install clickhouse-connect requests python-dotenv
"""

import os
import sys
import time

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
    # NOTE: deliberately no "Connection: close" here -- that header caused
    # connection resets during the movie fetch by forcing a fresh TCP/TLS
    # handshake on every single request across tens of thousands of calls.
}

CH_HOST = "localhost"
CH_PORT = 8123
CH_USER = "default"
CH_PASSWORD = ""

MIN_NUM_VOTES = 5000
SLEEP_BETWEEN_PEOPLE = 0.1
INSERT_EVERY = 500   # flush to ClickHouse every N people processed

# ---- HTTP session -----------------------------------------------------------

session = requests.Session()
retries = Retry(
    total=5,
    backoff_factor=1,
    status_forcelist=[429, 502, 503, 504],
    connect=5,
)
session.mount("https://", HTTPAdapter(max_retries=retries))


def find_tmdb_person(nconst):
    """Returns (tmdb_person_id, name) or (None, None) if no match."""
    url = f"https://api.themoviedb.org/3/find/{nconst}"
    try:
        resp = session.get(url, headers=HEADERS, params={"external_source": "imdb_id"}, timeout=10)
    except requests.exceptions.ConnectionError as e:
        print(f"  [warn] connection error resolving {nconst}: {e}", file=sys.stderr)
        return None, None

    if resp.status_code != 200:
        return None, None

    results = resp.json().get("person_results", [])
    if not results:
        return None, None
    return results[0]["id"], results[0].get("name", "")


# ---- ClickHouse --------------------------------------------------------------

def get_target_nconsts(client):
    result = client.query(f"""
        SELECT DISTINCT tp.nconst
        FROM raw_imdb.title_principals AS tp
        INNER JOIN raw_imdb.title_ratings AS tr ON tp.tconst = tr.tconst
        WHERE tr.numVotes > {MIN_NUM_VOTES}
    """)
    return [row[0] for row in result.result_rows]


def get_already_fetched_nconsts(client):
    try:
        result = client.query("SELECT DISTINCT nconst FROM identity.person_bridge")
        return set(row[0] for row in result.result_rows)
    except Exception:
        return set()


def insert_rows(client, rows):
    if not rows:
        return
    client.insert(
        "identity.person_bridge",
        rows,
        column_names=["nconst", "tmdb_person_id", "name", "verified"],
    )


# ---- Main ----------------------------------------------------------------

def main():
    client = clickhouse_connect.get_client(
        host=CH_HOST, port=CH_PORT, username=CH_USER, password=CH_PASSWORD,
    )

    print(f"Fetching target nconst list (any role, numVotes > {MIN_NUM_VOTES})...")
    targets = get_target_nconsts(client)
    print(f"  {len(targets)} people match scope.")

    already_done = get_already_fetched_nconsts(client)
    if already_done:
        before = len(targets)
        targets = [n for n in targets if n not in already_done]
        print(f"  {before - len(targets)} already fetched in a prior run, skipping. "
              f"{len(targets)} remaining.")

    if not targets:
        print("Nothing to do.")
        return

    total = len(targets)
    total_written = 0
    total_no_match = 0
    pending_rows = []

    for idx, nconst in enumerate(targets, start=1):
        tmdb_person_id, name = find_tmdb_person(nconst)
        if tmdb_person_id is None:
            pending_rows.append((nconst, 0, "", 0))
            total_no_match += 1
        else:
            pending_rows.append((nconst, tmdb_person_id, name, 1))
            total_written += 1

        if idx % INSERT_EVERY == 0 or idx == total:
            insert_rows(client, pending_rows)
            pending_rows = []
            print(f"Progress {idx}/{total}: {total_written} matched, "
                  f"{total_no_match} unmatched so far")

        time.sleep(SLEEP_BETWEEN_PEOPLE)

    print(f"\nDone. {total_written} people matched, {total_no_match} unmatched "
          f"out of {total} processed.")


if __name__ == "__main__":
    main()