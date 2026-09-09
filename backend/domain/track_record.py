from __future__ import annotations
from db.clickhouse_client import run_query

# ---------------------------------------------------------------------------
# Role → ClickHouse category mapping
# ---------------------------------------------------------------------------
# metrics.person_track_record / viability_score only cover director + producer.
# actor, writer, indie_crew fall back to a raw count from raw_imdb.title_principals.
# ---------------------------------------------------------------------------
METRICS_ROLES = {"investor": "producer", "director": "director", "producer": "producer"}

FALLBACK_ROLES = {"actor": "actor", "writer": "writer"}

INDIE_CREW_EXCLUDE = ("self", "archive_footage", "archive_sound")


def get_track_record(nconst: str | None, role: str) -> dict:
    """Return credit and completion metrics for a resolved nconst + role.

    Accepts a pre-resolved nconst so identity resolution happens exactly once
    per /check request. Returns an empty dict if nconst is None.
    """
    if not nconst:
        return {}

    role = role.lower()

    # --- Roles covered by the metrics views (director / producer / investor) ---
    if role in METRICS_ROLES:
        category = METRICS_ROLES[role]

        sql_track = """
            SELECT
                total_projects  AS credits_found,
                released_projects,
                completion_rate
            FROM metrics.person_track_record
            WHERE nconst = {nconst:String} AND category = {category:String}
        """
        track_rows = run_query(sql_track, parameters={"nconst": nconst, "category": category})

        credits_found = 0
        released_projects = 0
        completion_rate = None
        if track_rows:
            row = track_rows[0]
            credits_found = row["credits_found"]
            released_projects = row["released_projects"]
            completion_rate = row["completion_rate"]  # already computed in the view

        sql_cohort = """
            SELECT avg(completion_rate_percentile) AS cohort_percentile
            FROM metrics.cohort_percentiles
            WHERE nconst = {nconst:String} AND category = {category:String}
            GROUP BY nconst
        """
        cohort_rows = run_query(sql_cohort, parameters={"nconst": nconst, "category": category})
        cohort_percentile = cohort_rows[0]["cohort_percentile"] if cohort_rows else None

        return {
            "credits_found": credits_found,
            "released_projects": released_projects,
            "completion_rate": completion_rate,
            "cohort_percentile": cohort_percentile,
            "data_sources": [f"metrics.person_track_record (category={category})"],
        }

    # --- Actor / Writer fallback — raw credit count from title_principals ---
    if role in FALLBACK_ROLES:
        category = FALLBACK_ROLES[role]
        sql = """
            SELECT count() AS credits_found
            FROM raw_imdb.title_principals
            WHERE nconst = {nconst:String} AND category = {category:String}
        """
        rows = run_query(sql, parameters={"nconst": nconst, "category": category})
        credits_found = rows[0]["credits_found"] if rows else 0
        return {
            "credits_found": credits_found,
            "completion_rate": None,
            "cohort_percentile": None,
            "data_sources": [
                f"raw_imdb.title_principals (category={category}) — "
                "completion-rate history not available for this role"
            ],
        }

    # --- indie_crew — all credited roles except self/archive categories ---
    sql = """
        SELECT count() AS credits_found
        FROM raw_imdb.title_principals
        WHERE nconst = {nconst:String}
          AND category NOT IN {exclude:Array(String)}
    """
    rows = run_query(sql, parameters={"nconst": nconst, "exclude": list(INDIE_CREW_EXCLUDE)})
    credits_found = rows[0]["credits_found"] if rows else 0
    return {
        "credits_found": credits_found,
        "completion_rate": None,
        "cohort_percentile": None,
        "data_sources": [
            "raw_imdb.title_principals (all non-self/archive categories) — "
            "completion-rate history not available for indie_crew role"
        ],
    }
