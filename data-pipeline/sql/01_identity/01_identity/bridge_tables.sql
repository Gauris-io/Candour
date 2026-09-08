CREATE DATABASE IF NOT EXISTS identity;

CREATE VIEW IF NOT EXISTS identity.title_bridge AS
SELECT
    tb.tconst,
    tp.tmdb_id,
    wf.wikidata_qid,
    tp.tmdb_id IS NOT NULL AS has_tmdb,
    wf.wikidata_qid != '' AS has_wikidata
FROM raw_imdb.title_basics AS tb
LEFT JOIN raw_tmdb.project AS tp ON tb.tconst = tp.tconst
LEFT JOIN raw_wikidata.film_facts AS wf ON tb.tconst = wf.tconst;

CREATE TABLE IF NOT EXISTS identity.person_bridge
(
    nconst          String,
    tmdb_person_id  UInt64,
    name            String,
    verified        UInt8,
    fetched_at      DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(fetched_at)
ORDER BY nconst;
