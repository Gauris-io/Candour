# pyrefly: ignore [missing-import]
from google.adk.agents import LlmAgent
from .instructions import TRACK_RECORD_INSTRUCTION
import networkx as nx

def get_track_record(entity_name: str) -> dict:
    # TODO: replace with mcp-clickhouse call to metrics.* views
    return {
        "completion_rate": 0.82,
        "avg_time_to_release_months": 14,
        "credits_found": 6,
        "cohort_percentile": 65,
    }

def get_network_flags(entity_name: str) -> dict:
    # TODO: replace with real verified edges from mcp-clickhouse
    print(f"DEBUG entity_name received: '{entity_name}'")
    G = nx.Graph()
    verified_edges = [
        ("John", "Producer A"),
        ("John", "Editor B"),
        ("John", "DP C"),
    ]
    G.add_edges_from(verified_edges)

    # TODO: replace with claims scraped/entered from the pitch itself
    claimed_connections = ["Producer A", "Actor X", "Studio Y"]

    verified = [c for c in claimed_connections if G.has_edge(entity_name, c)]
    unverified = [c for c in claimed_connections if not G.has_edge(entity_name, c)]

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

def get_financial_score(entity_name: str) -> dict:
    # TODO: replace with mcp-clickhouse call
    return {"budget_to_boxoffice_ratio": None, "score": None}

root_agent = LlmAgent(
    model="gemini-3.7-flash",
    name="track_record_agent",
    instruction=TRACK_RECORD_INSTRUCTION,
    tools=[get_track_record, get_network_flags, get_financial_score],
)
