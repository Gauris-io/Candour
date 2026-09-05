"""
etl/fetch_wikidata.py

Populates raw_wikidata.film_facts by batch-querying Wikidata's SPARQL endpoint,
seeded from tconsts in raw_imdb.title_basics/title_ratings (numVotes > 5000).

Run this AFTER sql/00_raw/imdb_schema.sql and sql/00_raw/wikidata_schema.sql
have both been applied.

Requires: pip install clickhouse-connect requests

Resumable: on start, it queries which tconsts already exist in
raw_wikidata.film_facts and skips them. Safe to re-run after a crash.
"""

import sys
import time
from datetime import datetime
import requests
import clickhouse_connect

# ---- Config ----------------------------------------------------------------

CH_HOST = "localhost"
CH_PORT = 8123          # ClickHouse HTTP interface (matches docker-compose port mapping)
CH_USER = "default"
CH_PASSWORD = ""

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
# Wikidata asks for a descriptive User-Agent identifying the project/contact.
# Update the email/URL before running at scale.
USER_AGENT = "TrackRecordAgentHackathon/0.1 (contact: your-email@example.com)"

BATCH_SIZE = 50          # imdb ids per SPARQL query
SLEEP_BETWEEN_BATCHES = 1.0   # seconds, politeness delay
MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 5     # multiplied by attempt number on 429/5xx

MIN_NUM_VOTES = 5000

# ---- SPARQL ------------------------------------------------------------------

def build_sparql(imdb_ids):
    values_clause = " ".join(f'"{tid}"' for tid in imdb_ids)
    return f"""
SELECT ?imdbid ?film
       (SAMPLE(?boxOfficeAmount) AS ?boxOffice)
       (SAMPLE(?boxOfficeUnitLabel) AS ?boxOfficeCurrency)
       (SAMPLE(?budgetAmount) AS ?budget)
       (SAMPLE(?budgetUnitLabel) AS ?budgetCurrency)
       (SAMPLE(?releaseDate) AS ?release)
       (GROUP_CONCAT(DISTINCT ?genreLabel; separator="|") AS ?genres)
       (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") AS ?countries)
WHERE {{
  VALUES ?imdbid {{ {values_clause} }}
  ?film wdt:P345 ?imdbid .

  OPTIONAL {{
    ?film p:P2142 ?boStatement .
    ?boStatement psv:P2142 ?boValue .
    ?boValue wikibase:quantityAmount ?boxOfficeAmount .
    ?boValue wikibase:quantityUnit ?boUnit .
    ?boUnit rdfs:label ?boxOfficeUnitLabel .
    FILTER(LANG(?boxOfficeUnitLabel) = "en")
  }}
  OPTIONAL {{
    ?film p:P2130 ?budgetStatement .
    ?budgetStatement psv:P2130 ?budgetValue .
    ?budgetValue wikibase:quantityAmount ?budgetAmount .
    ?budgetValue wikibase:quantityUnit ?buUnit .
    ?buUnit rdfs:label ?budgetUnitLabel .
    FILTER(LANG(?budgetUnitLabel) = "en")
  }}
  OPTIONAL {{ ?film wdt:P577 ?releaseDate . }}
  OPTIONAL {{
    ?film wdt:P136 ?genre .
    ?genre rdfs:label ?genreLabel .
    FILTER(LANG(?genreLabel) = "en")
  }}
  OPTIONAL {{
    ?film wdt:P495 ?country .
    ?country rdfs:label ?countryLabel .
    FILTER(LANG(?countryLabel) = "en")
  }}
}}
GROUP BY ?imdbid ?film
"""


def run_batch(session, imdb_ids):
    query = build_sparql(imdb_ids)
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(
                SPARQL_ENDPOINT,
                params={"query": query, "format": "json"},
                headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
                timeout=60,
            )
            if resp.status_code == 200:
                return resp.json()["results"]["bindings"]
            if resp.status_code in (429, 500, 502, 503, 504):
                wait = RETRY_BACKOFF_SECONDS * attempt
                print(f"  [warn] status {resp.status_code}, retrying in {wait}s "
                      f"(attempt {attempt}/{MAX_RETRIES})", file=sys.stderr)
                time.sleep(wait)
                continue
            resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            wait = RETRY_BACKOFF_SECONDS * attempt
            print(f"  [warn] request error: {e}, retrying in {wait}s "
                  f"(attempt {attempt}/{MAX_RETRIES})", file=sys.stderr)
            time.sleep(wait)
    print(f"  [error] batch failed after {MAX_RETRIES} attempts, skipping "
          f"{len(imdb_ids)} titles: {imdb_ids[:3]}...", file=sys.stderr)
    return []


def parse_binding(b):
    imdbid = b["imdbid"]["value"]
    film_uri = b["film"]["value"]
    qid = film_uri.rsplit("/", 1)[-1]

    box_office = float(b["boxOffice"]["value"]) if "boxOffice" in b else None
    box_office_currency = b.get("boxOfficeCurrency", {}).get("value")
    budget = float(b["budget"]["value"]) if "budget" in b else None
    budget_currency = b.get("budgetCurrency", {}).get("value")

    release_date = None
    if "release" in b:
        raw = b["release"]["value"]  # e.g. "1994-09-23T00:00:00Z"
        try:
            parsed = datetime.strptime(raw[:10], "%Y-%m-%d").date()
            if 1900 <= parsed.year <= 2299:  # ClickHouse Date32 supported range
                release_date = parsed
            # else: leave as None -- out of range, e.g. very old/garbled Wikidata date
        except ValueError:
            release_date = None  # malformed date from Wikidata, skip it

    genres = b.get("genres", {}).get("value", "")
    genres = [g for g in genres.split("|") if g]
    countries = b.get("countries", {}).get("value", "")
    countries = [c for c in countries.split("|") if c]

    return (imdbid, qid, box_office, box_office_currency, budget, budget_currency,
            release_date, genres, countries)


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
        result = client.query("SELECT DISTINCT tconst FROM raw_wikidata.film_facts")
        return set(row[0] for row in result.result_rows)
    except Exception:
        # Table might not exist yet on a very first run.
        return set()


def insert_rows(client, rows):
    if not rows:
        return
    client.insert(
        "raw_wikidata.film_facts",
        rows,
        column_names=[
            "tconst", "wikidata_qid", "box_office_amount", "box_office_currency",
            "budget_amount", "budget_currency", "release_date", "genres", "countries",
        ],
    )


# ---- Main ----------------------------------------------------------------

def main():
    client = clickhouse_connect.get_client(
        host=CH_HOST, port=CH_PORT, username=CH_USER, password=CH_PASSWORD,
    )

    print("Fetching target tconst list (numVotes > {})...".format(MIN_NUM_VOTES))
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

    session = requests.Session()
    total_batches = (len(targets) + BATCH_SIZE - 1) // BATCH_SIZE
    total_written = 0
    total_no_match = 0

    for i in range(0, len(targets), BATCH_SIZE):
        batch = targets[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1

        bindings = run_batch(session, batch)
        rows = [parse_binding(b) for b in bindings]
        insert_rows(client, rows)

        matched_ids = {r[0] for r in rows}
        no_match = len(batch) - len(matched_ids)

        total_written += len(rows)
        total_no_match += no_match

        print(f"Batch {batch_num}/{total_batches}: {len(rows)} rows written, "
              f"{no_match} titles with no Wikidata match "
              f"(running total: {total_written} written, {total_no_match} unmatched)")

        time.sleep(SLEEP_BETWEEN_BATCHES)

    print(f"\nDone. {total_written} rows written, {total_no_match} titles had no "
          f"Wikidata match out of {len(targets)} processed.")


if __name__ == "__main__":
    main()