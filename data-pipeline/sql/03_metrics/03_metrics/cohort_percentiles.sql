CREATE DATABASE IF NOT EXISTS metrics;

CREATE VIEW IF NOT EXISTS metrics.cohort_percentiles AS
WITH person_genre_stats AS (
    SELECT
        tp.nconst,
        tp.category,
        multiIf(
            positionCaseInsensitive(g, 'comedy') > 0, 'Comedy',
            positionCaseInsensitive(g, 'horror') > 0, 'Horror',
            positionCaseInsensitive(g, 'drama') > 0, 'Drama',
            positionCaseInsensitive(g, 'action') > 0, 'Action',
            positionCaseInsensitive(g, 'thriller') > 0, 'Thriller',
            positionCaseInsensitive(g, 'romance') > 0, 'Romance',
            positionCaseInsensitive(g, 'documentary') > 0, 'Documentary',
            positionCaseInsensitive(g, 'animat') > 0, 'Animation',
            positionCaseInsensitive(g, 'crime') > 0, 'Crime',
            positionCaseInsensitive(g, 'war') > 0, 'War',
            positionCaseInsensitive(g, 'western') > 0, 'Western',
            positionCaseInsensitive(g, 'musical') > 0, 'Musical',
            positionCaseInsensitive(g, 'fantasy') > 0, 'Fantasy',
            (positionCaseInsensitive(g, 'science fiction') > 0) OR (positionCaseInsensitive(g, 'sci-fi') > 0), 'Science Fiction',
            positionCaseInsensitive(g, 'family') > 0, 'Family',
            positionCaseInsensitive(g, 'adventure') > 0, 'Adventure',
            positionCaseInsensitive(g, 'mystery') > 0, 'Mystery',
            positionCaseInsensitive(g, 'biograph') > 0, 'Biography',
            positionCaseInsensitive(g, 'sport') > 0, 'Sports',
            'Other'
        ) AS genre,
        intDiv(toYear(pf.release_date), 10) * 10 AS decade,
        pf.status,
        pf.budget,
        pf.revenue
    FROM raw_imdb.title_principals AS tp
    INNER JOIN derived.project_financials AS pf ON tp.tconst = pf.tconst
    INNER JOIN raw_wikidata.film_facts AS wf ON tp.tconst = wf.tconst
    ARRAY JOIN wf.genres AS g
    WHERE tp.category IN ('director', 'producer')
      AND pf.release_date IS NOT NULL
),
person_genre_decade_agg AS (
    SELECT
        nconst, category, genre, decade,
        count() AS total_projects,
        round(countIf(status = 'Released') / count(), 3) AS completion_rate,
        round(avg(if(budget > 0 AND revenue > 0, (revenue - budget) / budget, NULL)), 3) AS avg_roi
    FROM person_genre_stats
    GROUP BY nconst, category, genre, decade
),
ranked AS (
    SELECT
        *,
        count() OVER (PARTITION BY category, genre, decade) AS cohort_size,
        rank() OVER (PARTITION BY category, genre, decade ORDER BY completion_rate) AS completion_rank,
        rank() OVER (PARTITION BY category, genre, decade ORDER BY avg_roi) AS roi_rank
    FROM person_genre_decade_agg
)
SELECT
    nconst, category, genre, decade, total_projects, completion_rate, avg_roi, cohort_size,
    round((completion_rank - 1) / nullif(cohort_size - 1, 0), 3) AS completion_rate_percentile,
    if(avg_roi IS NULL, NULL, round((roi_rank - 1) / nullif(cohort_size - 1, 0), 3)) AS avg_roi_percentile
FROM ranked;
