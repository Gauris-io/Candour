CREATE DATABASE IF NOT EXISTS metrics;

CREATE VIEW IF NOT EXISTS metrics.viability_score AS
SELECT
    ptr.nconst,
    ptr.category,
    ptr.completion_rate,
    ptr.avg_roi,
    avg(cp.avg_roi_percentile) AS avg_roi_percentile,
    round((avg(cp.avg_roi_percentile) * 0.6) + (ptr.completion_rate * 0.4), 3) AS viability_score
FROM metrics.person_track_record AS ptr
INNER JOIN metrics.cohort_percentiles AS cp
    ON ptr.nconst = cp.nconst AND ptr.category = cp.category
WHERE cp.avg_roi_percentile IS NOT NULL
GROUP BY ptr.nconst, ptr.category, ptr.completion_rate, ptr.avg_roi;
