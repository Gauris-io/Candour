CREATE DATABASE IF NOT EXISTS metrics;

CREATE VIEW IF NOT EXISTS metrics.person_track_record AS
SELECT
    tp.nconst,
    tp.category,
    count() AS total_projects,
    countIf(pf.status = 'Released') AS released_projects,
    round(countIf(pf.status = 'Released') / count(), 3) AS completion_rate,
    round(
        avg(
            if(pf.budget > 0 AND pf.revenue > 0, (pf.revenue - pf.budget) / pf.budget, NULL)
        ),
        3
    ) AS avg_roi
FROM raw_imdb.title_principals AS tp
INNER JOIN derived.project_financials AS pf ON tp.tconst = pf.tconst
WHERE tp.category IN ('director', 'producer')
GROUP BY tp.nconst, tp.category;
