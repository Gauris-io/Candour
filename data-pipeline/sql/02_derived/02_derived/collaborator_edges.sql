CREATE DATABASE IF NOT EXISTS derived;

CREATE TABLE IF NOT EXISTS derived.collaborator_edges
ENGINE = MergeTree
ORDER BY (nconst_a, nconst_b)
AS
SELECT
    a.tconst    AS tconst,
    a.nconst    AS nconst_a,
    b.nconst    AS nconst_b,
    a.category  AS category_a,
    b.category  AS category_b
FROM raw_imdb.title_principals AS a
INNER JOIN raw_imdb.title_principals AS b
    ON a.tconst = b.tconst
WHERE a.nconst < b.nconst
  AND a.category NOT IN ('self', 'archive_footage', 'archive_sound')
  AND b.category NOT IN ('self', 'archive_footage', 'archive_sound');
