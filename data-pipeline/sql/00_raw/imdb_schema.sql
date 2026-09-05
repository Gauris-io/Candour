CREATE DATABASE IF NOT EXISTS raw_imdb;

-- title.basics
CREATE TABLE IF NOT EXISTS raw_imdb.title_basics
(
    tconst String,
    titleType LowCardinality(String),
    primaryTitle String,
    originalTitle String,
    isAdult UInt8,
    startYear Nullable(UInt16),
    endYear Nullable(UInt16),
    runtimeMinutes Nullable(UInt32),
    genres Array(String)
)
ENGINE = MergeTree
ORDER BY tconst;

INSERT INTO raw_imdb.title_basics
SELECT
    tconst,
    titleType,
    primaryTitle,
    originalTitle,
    toUInt8OrZero(isAdult),
    toUInt16OrNull(startYear),
    toUInt16OrNull(endYear),
    toUInt32OrNull(runtimeMinutes),
    splitByChar(',', genres)
FROM url(
    'https://datasets.imdbws.com/title.basics.tsv.gz',
    TSVWithNames,
    'tconst String, titleType String, primaryTitle String, originalTitle String, isAdult String, startYear String, endYear String, runtimeMinutes String, genres String'
)
SETTINGS max_http_get_redirects = 3;

-- title.ratings
CREATE TABLE IF NOT EXISTS raw_imdb.title_ratings
(
    tconst String,
    averageRating Float32,
    numVotes UInt32
)
ENGINE = MergeTree
ORDER BY tconst;

INSERT INTO raw_imdb.title_ratings
SELECT
    tconst,
    toFloat32OrZero(averageRating),
    toUInt32OrZero(numVotes)
FROM url(
    'https://datasets.imdbws.com/title.ratings.tsv.gz',
    TSVWithNames,
    'tconst String, averageRating String, numVotes String'
)
SETTINGS max_http_get_redirects = 3;

-- title.principals (producer/director/writer credits per title)
CREATE TABLE IF NOT EXISTS raw_imdb.title_principals
(
    tconst String,
    ordering UInt32,
    nconst String,
    category LowCardinality(String),
    job String,
    characters String
)
ENGINE = MergeTree
ORDER BY (tconst, nconst);

INSERT INTO raw_imdb.title_principals
SELECT
    tconst,
    toUInt32OrZero(ordering),
    nconst,
    category,
    job,
    characters
FROM url(
    'https://datasets.imdbws.com/title.principals.tsv.gz',
    TSVWithNames,
    'tconst String, ordering String, nconst String, category String, job String, characters String'
)
SETTINGS max_http_get_redirects = 3;

-- title.crew (directors/writers, denormalized array form)
CREATE TABLE IF NOT EXISTS raw_imdb.title_crew
(
    tconst String,
    directors Array(String),
    writers Array(String)
)
ENGINE = MergeTree
ORDER BY tconst;

INSERT INTO raw_imdb.title_crew
SELECT
    tconst,
    splitByChar(',', directors),
    splitByChar(',', writers)
FROM url(
    'https://datasets.imdbws.com/title.crew.tsv.gz',
    TSVWithNames,
    'tconst String, directors String, writers String'
)
SETTINGS max_http_get_redirects = 3;

-- name.basics
CREATE TABLE IF NOT EXISTS raw_imdb.name_basics
(
    nconst String,
    primaryName String,
    birthYear Nullable(UInt16),
    deathYear Nullable(UInt16),
    primaryProfession Array(String),
    knownForTitles Array(String)
)
ENGINE = MergeTree
ORDER BY nconst;

INSERT INTO raw_imdb.name_basics
SELECT
    nconst,
    primaryName,
    toUInt16OrNull(birthYear),
    toUInt16OrNull(deathYear),
    splitByChar(',', primaryProfession),
    splitByChar(',', knownForTitles)
FROM url(
    'https://datasets.imdbws.com/name.basics.tsv.gz',
    TSVWithNames,
    'nconst String, primaryName String, birthYear String, deathYear String, primaryProfession String, knownForTitles String'
)
SETTINGS max_http_get_redirects = 3;