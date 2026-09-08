CREATE DATABASE IF NOT EXISTS derived;

CREATE TABLE IF NOT EXISTS derived.project_financials
ENGINE = MergeTree
ORDER BY tconst
AS
SELECT
    t.tconst,
    t.budget,
    coalesce(
        t.revenue,
        if(w.box_office_currency = 'United States dollar', toUInt64OrNull(toString(w.box_office_amount)), NULL)
    ) AS revenue,
    multiIf(
        t.revenue IS NOT NULL, 'tmdb',
        w.box_office_currency = 'United States dollar', 'wikidata_usd',
        'none'
    ) AS revenue_source,
    t.status,
    coalesce(t.release_date, w.release_date) AS release_date
FROM raw_tmdb.project AS t
FULL OUTER JOIN raw_wikidata.film_facts AS w ON t.tconst = w.tconst;
