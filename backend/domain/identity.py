from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal

from db.clickhouse_client import run_query


@dataclass
class ResolutionResult:
    status: Literal["resolved", "ambiguous", "not_found"]
    nconst: str | None = None
    matched_name: str | None = None
    match_type: str | None = None  # "exact" | "case_insensitive" | "partial"
    candidates: list[dict] = field(default_factory=list)


def _rows_to_candidates(rows: list[dict]) -> list[dict]:
    return [
        {
            "name": r["name"],
            "nconst": r["nconst"],
            "verified": bool(r.get("verified", 0)),
        }
        for r in rows
        if r.get("name")  # exclude the blank sentinel rows (unmatched TMDb)
    ]


def _try_resolve(rows: list[dict], match_type: str) -> ResolutionResult:
    """Given a set of candidate rows, decide resolved vs ambiguous."""
    candidates = _rows_to_candidates(rows)
    if not candidates:
        return ResolutionResult(status="not_found")

    if len(candidates) == 1:
        c = candidates[0]
        return ResolutionResult(
            status="resolved",
            nconst=c["nconst"],
            matched_name=c["name"],
            match_type=match_type,
        )

    # Multiple rows — use verified=1 as tiebreaker.
    verified_only = [c for c in candidates if c["verified"]]
    if len(verified_only) == 1:
        c = verified_only[0]
        return ResolutionResult(
            status="resolved",
            nconst=c["nconst"],
            matched_name=c["name"],
            match_type=match_type,
        )

    # Still ambiguous — return candidates, don't guess.
    return ResolutionResult(
        status="ambiguous",
        candidates=candidates,
        match_type=match_type,
    )


def resolve_identity(name: str) -> ResolutionResult:
    """Three-tier resolution: exact → case-insensitive → partial.

    Only auto-resolves when there is exactly one match, or one uniquely
    verified=1 match. Never silently picks an arbitrary person on collision.
    Partial matches are always returned as 'ambiguous' (never auto-resolved).
    """
    # Tier 1 — exact match
    rows = run_query(
        "SELECT nconst, name, verified FROM identity.person_bridge "
        "WHERE name = {name:String} AND name != '' ORDER BY verified DESC",
        parameters={"name": name},
    )
    if rows:
        result = _try_resolve(rows, "exact")
        if result.status != "not_found":
            return result

    # Tier 2 — case-insensitive
    rows = run_query(
        "SELECT nconst, name, verified FROM identity.person_bridge "
        "WHERE lower(name) = lower({name:String}) AND name != '' ORDER BY verified DESC",
        parameters={"name": name},
    )
    if rows:
        result = _try_resolve(rows, "case_insensitive")
        if result.status != "not_found":
            return result

    # Tier 3 — partial match (always ambiguous, never auto-resolved)
    pattern = f"%{name}%"
    rows = run_query(
        "SELECT nconst, name, verified FROM identity.person_bridge "
        "WHERE name ILIKE {pattern:String} AND name != '' "
        "ORDER BY verified DESC LIMIT 5",
        parameters={"pattern": pattern},
    )
    candidates = _rows_to_candidates(rows)
    if candidates:
        return ResolutionResult(
            status="ambiguous",
            candidates=candidates,
            match_type="partial",
        )

    return ResolutionResult(status="not_found")


def search_person_names(partial: str, limit: int = 10) -> list[dict]:
    """Typeahead search — returns [{name, nconst, verified}] ordered by verified DESC."""
    pattern = f"%{partial}%"
    rows = run_query(
        "SELECT nconst, name, verified FROM identity.person_bridge "
        "WHERE name ILIKE {pattern:String} AND name != '' "
        "ORDER BY verified DESC LIMIT {limit:UInt16}",
        parameters={"pattern": pattern, "limit": limit},
    )
    return _rows_to_candidates(rows)


# ---------------------------------------------------------------------------
# Legacy shim — keeps any caller that still imports resolve_nconst working.
# Will be removed once all callers are updated in Task 3/check.py.
# ---------------------------------------------------------------------------
def resolve_nconst(name: str) -> str | None:
    result = resolve_identity(name)
    return result.nconst if result.status == "resolved" else None
