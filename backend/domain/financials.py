from __future__ import annotations
from db.clickhouse_client import run_query
from domain.track_record import METRICS_ROLES


def get_financial_score(nconst: str | None, role: str) -> dict:
    """Return real financial metrics for a resolved nconst + role.

    Uses derived.project_financials for the real budget/revenue data.
    Accepts a pre-resolved nconst — no extra identity resolution happens here.

    The CTE deduplicates via DISTINCT tconst before joining to project_financials —
    a person can have more than one title_principals row for the same film
    (e.g. credited as both writer and director), and joining straight through
    would double-count that film in the averages.
    """
    if not nconst:
        return {
            "avg_box_office_multiple": None,
            "avg_roi": None,
            "projects_with_financial_data": None,
            "score": None,
        }

    role = role.lower()
    category = METRICS_ROLES.get(role)  # None for actor/writer/indie_crew

    # --- Real budget/revenue from derived.project_financials ---
    if category:
        sql_fin = """
            WITH person_titles AS (
                SELECT DISTINCT tconst
                FROM raw_imdb.title_principals
                WHERE nconst = {nconst:String} AND category = {category:String}
            )
            SELECT
                round(avg(pf.revenue) / nullIf(avg(pf.budget), 0), 3)      AS avg_box_office_multiple,
                count()                                                     AS projects_with_financial_data
            FROM derived.project_financials AS pf
            INNER JOIN person_titles AS pt ON pf.tconst = pt.tconst
            WHERE pf.budget > 0 AND pf.revenue > 0
        """
        fin_rows = run_query(sql_fin, parameters={"nconst": nconst, "category": category})

        # avg_roi comes from the pre-computed metrics view — same source the agent
        # uses — which has far better coverage than the sparse budget/revenue join.
        sql_roi = """
            SELECT avg_roi
            FROM metrics.person_track_record
            WHERE nconst = {nconst:String} AND category = {category:String}
        """
        roi_rows = run_query(sql_roi, parameters={"nconst": nconst, "category": category})
        metrics_avg_roi = roi_rows[0]["avg_roi"] if roi_rows else None
    else:
        # For actor/writer/indie_crew: no category filter, all projects they appear on
        sql_fin = """
            WITH person_titles AS (
                SELECT DISTINCT tconst
                FROM raw_imdb.title_principals
                WHERE nconst = {nconst:String}
            )
            SELECT
                round(avg(pf.revenue) / nullIf(avg(pf.budget), 0), 3)      AS avg_box_office_multiple,
                count()                                                     AS projects_with_financial_data
            FROM derived.project_financials AS pf
            INNER JOIN person_titles AS pt ON pf.tconst = pt.tconst
            WHERE pf.budget > 0 AND pf.revenue > 0
        """
        fin_rows = run_query(sql_fin, parameters={"nconst": nconst})

        # This branch is currently unreachable because check.py always passes
        # SUBJECT_LOOKUP_ROLE ('investor' -> 'producer'). If it is ever called
        # with an actor/writer role, attempt to read ROI without a category filter
        # so the value isn't silently nulled.
        sql_roi = """
            SELECT avg_roi
            FROM metrics.person_track_record
            WHERE nconst = {nconst:String}
        """
        roi_rows = run_query(sql_roi, parameters={"nconst": nconst})
        metrics_avg_roi = roi_rows[0]["avg_roi"] if roi_rows else None

    if fin_rows and fin_rows[0]["projects_with_financial_data"]:
        row = fin_rows[0]
        avg_box_office_multiple = row["avg_box_office_multiple"]
        projects_with_financial_data = row["projects_with_financial_data"]
    else:
        avg_box_office_multiple = None
        projects_with_financial_data = 0

    # Use the metrics-derived ROI (better coverage) when available.
    avg_roi = metrics_avg_roi

    # --- Viability score (metrics view — director/producer only) ---
    score = None
    if category:
        sql_vs = """
            SELECT avg(viability_score) AS score
            FROM metrics.viability_score
            WHERE nconst = {nconst:String} AND category = {category:String}
            GROUP BY nconst
        """
        vs_rows = run_query(sql_vs, parameters={"nconst": nconst, "category": category})
        score = vs_rows[0]["score"] if vs_rows else None

    return {
        "avg_box_office_multiple": avg_box_office_multiple,
        "avg_roi": avg_roi,
        "projects_with_financial_data": projects_with_financial_data,
        "score": score,
    }