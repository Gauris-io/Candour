import clickhouse_connect
from config import CLICKHOUSE_HOST, CLICKHOUSE_PORT, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_DATABASE

_client = None


def get_client():
    """Return the singleton ClickHouse client, creating it on first call.

    On any query failure the caller can set _client = None and retry once
    against a fresh connection — handles ClickHouse Cloud's idle-suspend
    where a pooled connection may be dead after inactivity.
    """
    global _client
    if _client is None:
        _client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=int(CLICKHOUSE_PORT),
            username=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
            database=CLICKHOUSE_DATABASE,
            secure=True if CLICKHOUSE_PORT == "8443" else False,
        )
    return _client


def _execute(client, sql: str, parameters: dict | None) -> list[dict]:
    result = client.query(sql, parameters=parameters)
    columns = result.column_names
    return [dict(zip(columns, row)) for row in result.result_rows]


def run_query(sql: str, parameters: dict = None) -> list[dict]:
    """Execute a query on ClickHouse and return results as a list of dicts.

    Retries once with a fresh client if the first attempt fails (covers
    ClickHouse Cloud idle-suspend scenarios).
    """
    global _client
    try:
        return _execute(get_client(), sql, parameters)
    except Exception:
        # Discard the potentially dead client and retry once.
        _client = None
        return _execute(get_client(), sql, parameters)
