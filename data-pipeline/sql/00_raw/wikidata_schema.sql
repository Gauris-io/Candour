CREATE DATABASE IF NOT EXISTS raw_wikidata;

CREATE TABLE IF NOT EXISTS raw_wikidata.film_facts
(
    tconst               String,
    wikidata_qid         String,
    box_office_amount    Nullable(Float64),
    box_office_currency  Nullable(String),
    budget_amount        Nullable(Float64),
    budget_currency      Nullable(String),
    release_date         Nullable(Date),
    genres               Array(String),
    countries            Array(String),
    fetched_at           DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(fetched_at)
ORDER BY tconst;
