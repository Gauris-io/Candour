from __future__ import annotations
from fastapi import APIRouter
from typing import Optional

from api.schemas import CheckRequest
from domain.identity import resolve_identity
from domain.track_record import get_track_record
from domain.network import get_network_flags
from domain.financials import get_financial_score

router = APIRouter()


@router.post("/check")
async def check_credibility(request: CheckRequest):
    """Credibility check — single identity resolution, structured JSON response.

    Resolution happens exactly once at the top of this handler; all domain
    functions receive the already-resolved nconst so there are no redundant
    ClickHouse round trips and no risk of three domain calls resolving the
    same ambiguous name to three different people.
    """
    name = request.name
    role = request.role
    claimed_connections = request.claimed_connections
    credits_claimed: int = request.claimed_credits

    warnings: list[str] = []
    flags: list[str] = []

    # ------------------------------------------------------------------
    # 1. Resolve identity exactly once.
    # ------------------------------------------------------------------
    resolution = resolve_identity(name)
    person_found = resolution.status == "resolved"
    nconst = resolution.nconst  # None unless resolved
    matched_name = resolution.matched_name or name

    name_resolution = {
        "input": name,
        "matched_as": matched_name,
        "nconst": resolution.nconst,
        "match_type": resolution.match_type,
        "status": resolution.status,
        "candidates": [c.model_dump() for c in resolution.candidates] if resolution.status == "ambiguous" else [],
    }

    if resolution.status == "ambiguous":
        warnings.append(
            f"'{name}' matched multiple people — returning candidates. "
            "Use /search or provide a more specific name."
        )
    elif resolution.status == "not_found":
        warnings.append(f"'{name}' could not be matched to any record in the industry database.")

    # ------------------------------------------------------------------
    # 2. Domain calls — all receive nconst (None-safe).
    # ------------------------------------------------------------------
    # The role pill is the VIEWER's role, not the subject's. The subject being
    # vetted is whoever is offering the work — a producer/director — so always
    # look up their producing record. `role` is still returned in the response
    # and still drives the agent's persona framing on /query.
    SUBJECT_LOOKUP_ROLE = "investor"   # maps to category='producer'
    try:
        track: dict = get_track_record(nconst, SUBJECT_LOOKUP_ROLE)
    except Exception as e:
        warnings.append(f"track record data unavailable — {type(e).__name__}")
        track = {}

    try:
        network: dict = get_network_flags(nconst, claimed_connections)
    except Exception as e:
        warnings.append(f"network verification unavailable — {type(e).__name__}")
        network = {}

    try:
        financials_raw: dict = get_financial_score(nconst, SUBJECT_LOOKUP_ROLE)
    except Exception as e:
        warnings.append(f"financial data unavailable — {type(e).__name__}")
        financials_raw = {}

    # ------------------------------------------------------------------
    # 3. Extract values.
    # ------------------------------------------------------------------
    credits_found: Optional[int] = track.get("credits_found", None)
    released_projects: Optional[int] = track.get("released_projects", None)
    completion_rate: Optional[float] = track.get("completion_rate", None)
    cohort_percentile: Optional[float] = track.get("cohort_percentile", None)
    data_sources: list[str] = track.get("data_sources", [])

    verified_collabs: list[str] = network.get("verified_connections", [])
    unverified_collabs: list[str] = network.get("unverified_claims", [])
    suspicion_level: Optional[str] = network.get("suspicion_level", None)

    avg_box_office_multiple: Optional[float] = financials_raw.get("avg_box_office_multiple", None)
    avg_roi: Optional[float] = financials_raw.get("avg_roi", None)
    projects_with_financial_data: Optional[int] = financials_raw.get("projects_with_financial_data", None)
    financial_score: Optional[float] = financials_raw.get("score", None)

    # ------------------------------------------------------------------
    # 4. Flag generation.
    # ------------------------------------------------------------------

    # --- Identity / credit discrepancy (three-way branch on resolution status) ---
    if not person_found:
        if credits_claimed > 0:
            flags.append("could not verify this identity against any industry database record")
    elif credits_found == 0:
        if credits_claimed > 0:
            flags.append("no verifiable credits found — claimed count cannot be confirmed")
        else:
            flags.append("no producing or directing credits found for this person in verified records")
    elif credits_found is not None and credits_claimed > 0 and credits_claimed > credits_found * 1.5:
        flags.append(
            f"credit count discrepancy: {credits_claimed} claimed, "
            f"{credits_found} found in verified records"
        )

    # --- Network ---
    if suspicion_level and suspicion_level != "low":
        flags.append(f"network suspicion level: {suspicion_level}")

    # --- Completion rate (only meaningful for roles with metrics coverage) ---
    if completion_rate is not None and completion_rate < 0.5:
        flags.append(f"low project completion rate: {completion_rate:.0%}")

    if (cohort_percentile is not None and cohort_percentile < 0.25
        and (completion_rate is None or completion_rate < 0.9)):
        flags.append(
            f"completion-rate cohort percentile is {cohort_percentile:.0%} "
            f"(bottom quartile for comparable professionals)"
        )

    # --- Financial ---
    if person_found and avg_box_office_multiple is None and avg_roi is None and financial_score is None:
        warnings.append(
            "no financial data available for this person's projects — "
            "either budget/revenue not in TMDb/Wikidata, or projects outside "
            "the dataset scope (>5,000 votes)"
        )

    # ------------------------------------------------------------------
    # 5. Assemble response.
    # ------------------------------------------------------------------
    return {
        "name": matched_name if person_found else None,
        "input_name": name,
        "role": role,
        "person_found": person_found,
        "name_resolution": name_resolution,
        "credits": {
            "found": credits_found,
            "claimed": credits_claimed,
            "released": released_projects,
            "completionRate": completion_rate,
        },
        "collaborators": {
            "verified": verified_collabs,
            "unverified": unverified_collabs,
        },
        "financials": {
            "avgBoxOfficeMultiple": avg_box_office_multiple,
            "avgRoi": avg_roi,
            "projectsWithFinancialData": projects_with_financial_data,
            "score": financial_score,
        },
        "flags": flags,
        "warnings": warnings,
        "data_sources": data_sources,
    }
