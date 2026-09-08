from __future__ import annotations
from db.clickhouse_client import run_query


def get_network_flags(nconst: str | None, claimed_connections: list[str]) -> dict:
    """Verify claimed collaborations against derived.collaborator_edges.

    Accepts a pre-resolved nconst — no redundant identity resolution happens here.
    """
    safe_result = {
        "verified_connections": [],
        "unverified_claims": list(claimed_connections),
        "suspicion_level": "low",
    }

    if not claimed_connections:
        return safe_result

    if not nconst:
        safe_result["suspicion_level"] = "unverifiable"
        return safe_result

    # 1. Fetch actual connections for this nconst from collaborator_edges.
    #    The table stores one row per pair where nconst_a < nconst_b,
    #    so we query both sides and extract the other party's nconst.
    sql_edges = """
        SELECT
            if(nconst_a = {nconst:String}, nconst_b, nconst_a) AS connected_nconst
        FROM derived.collaborator_edges
        WHERE nconst_a = {nconst:String} OR nconst_b = {nconst:String}
    """
    edge_rows = run_query(sql_edges, parameters={"nconst": nconst})
    actual_nconsts = {row["connected_nconst"] for row in edge_rows}

    # 2. Resolve claimed names → nconsts via identity.person_bridge (exact match).
    sql_claims = """
        SELECT name, nconst
        FROM identity.person_bridge
        WHERE has({names:Array(String)}, name)
    """
    claim_rows = run_query(sql_claims, parameters={"names": claimed_connections})
    name_to_nconst = {row["name"]: row["nconst"] for row in claim_rows}

    # 3. Classify each claim.
    verified = []
    unverified = []
    for claim in claimed_connections:
        claim_nconst = name_to_nconst.get(claim)
        if claim_nconst and claim_nconst in actual_nconsts:
            verified.append(claim)
        else:
            unverified.append(claim)

    total = len(claimed_connections)
    unverified_ratio = len(unverified) / total if total else 0

    if unverified_ratio >= 0.66:
        suspicion_level = "high"
    elif unverified_ratio >= 0.33:
        suspicion_level = "medium"
    else:
        suspicion_level = "low"

    return {
        "verified_connections": verified,
        "unverified_claims": unverified,
        "suspicion_level": suspicion_level,
    }
