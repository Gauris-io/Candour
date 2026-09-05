CREATE DATABASE IF NOT EXISTS raw_tmdb;

CREATE TABLE IF NOT EXISTS raw_tmdb.project
(
    tconst          String,
    tmdb_id         UInt64,
    title           String,
    original_title  String,
    status          String,
    release_date    Nullable(Date32),
    budget          Nullable(UInt64),
    revenue         Nullable(UInt64),
    runtime         Nullable(UInt32),
    fetched_at      DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(fetched_at)
ORDER BY tconst;
