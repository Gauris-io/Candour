import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional

# pyrefly: ignore [missing-import]
from google.adk.runners import Runner
# pyrefly: ignore [missing-import]
from google.adk.sessions import InMemorySessionService
# pyrefly: ignore [missing-import]
from google.genai import types

from agent.agent import root_agent
from agent.agent import get_track_record, get_network_flags, get_financial_score

# Initialize FastAPI
app = FastAPI(
    title="Agentic Cinema Backend",
    description="Backend for the Google Cloud ADK Track",
)

# Allow the Vite dev server (and any origin during demo) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Session Service
session_service = InMemorySessionService()

# Initialize the Runner to execute the agent
runner = Runner(
    agent=root_agent,
    session_service=session_service,
    app_name="cinema_app",
    auto_create_session=True,
)


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    question: str

class CheckRequest(BaseModel):
    name: str
    role: Literal["actor", "writer", "investor", "indie_crew"]


# ---------------------------------------------------------------------------
# Existing endpoints — untouched
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/query")
async def query_agent(request: AskRequest):
    # Prepare the input content
    content = types.Content(role='user', parts=[types.Part(text=request.question)])

    # Run the agent
    events = runner.run(
        user_id="api_user",
        session_id="default_session",
        new_message=content,
    )

    response_text = ""
    for event in events:
        if getattr(event, 'is_final_response', lambda: False)():
            if getattr(event, 'content', None) and event.content.parts:
                response_text = event.content.parts[0].text
            break

    # Fallback if no final_response method or it doesn't trigger
    if not response_text and events:
        # Just grab the last event's content if possible
        try:
            last_event = list(events)[-1]
            if getattr(last_event, 'content', None) and last_event.content.parts:
                response_text = last_event.content.parts[0].text
        except Exception:
            pass

    return {"response": response_text}


# ---------------------------------------------------------------------------
# New deterministic endpoint — no LLM in the critical path
# ---------------------------------------------------------------------------

@app.post("/check")
async def check_credibility(request: CheckRequest):
    """
    Credibility check that calls the three agent tools directly and assembles
    their output into a guaranteed-shape JSON response.  Every key is always
    present; missing / unavailable data uses null rather than omission so the
    frontend never has to guard for undefined fields.
    """
    name = request.name
    role = request.role

    # --- Call tools directly (synchronous, deterministic, no LLM round-trip) ---
    try:
        track: dict = get_track_record(name)
    except Exception:
        track = {}

    try:
        network: dict = get_network_flags(name)
    except Exception:
        network = {}

    try:
        financials_raw: dict = get_financial_score(name)
    except Exception:
        financials_raw = {}

    # --- Credits ---
    credits_found: Optional[int] = track.get("credits_found", None)
    # "claimed" has no tool source yet; stays null until scraped-data wiring is done
    credits_claimed: Optional[int] = None

    # --- Collaborators ---
    verified_collabs: list[str] = network.get("verified_connections") or []
    unverified_collabs: list[str] = network.get("unverified_claims") or []

    # --- Financials ---
    budget_ratio: Optional[float] = financials_raw.get("budget_to_boxoffice_ratio", None)
    financial_score: Optional[float] = financials_raw.get("score", None)

    # --- Flags: qualitative signals derived from the tool returns ---
    flags: list[str] = []

    suspicion_level: Optional[str] = network.get("suspicion_level", None)
    if suspicion_level and suspicion_level != "low":
        flags.append(f"network suspicion level: {suspicion_level}")

    if credits_found == 0:
        flags.append(
            "no producing credits found — flagged as insufficient history, "
            "not a contradiction of stated claims"
        )

    completion_rate: Optional[float] = track.get("completion_rate", None)
    if completion_rate is not None and completion_rate < 0.5:
        flags.append(f"low project completion rate: {completion_rate:.0%}")

    avg_release: Optional[int] = track.get("avg_time_to_release_months", None)
    if avg_release is not None and avg_release > 24:
        flags.append(
            f"average time to release is {avg_release} months "
            "(above typical 18–24 month range)"
        )

    cohort_percentile: Optional[int] = track.get("cohort_percentile", None)
    if cohort_percentile is not None and cohort_percentile < 25:
        flags.append(
            f"completion-rate cohort percentile is {cohort_percentile} "
            "(bottom quartile for comparable producers)"
        )

    if budget_ratio is None and financial_score is None:
        flags.append(
            "financial data unavailable — could not verify budget-to-box-office performance"
        )

    # --- Assemble and return ---
    return {
        "name": name,
        "role": role,
        "credits": {
            "found": credits_found,
            "claimed": credits_claimed,
        },
        "collaborators": {
            "verified": verified_collabs,
            "unverified": unverified_collabs,
        },
        "financials": {
            "budgetToBoxOffice": budget_ratio,
            "score": financial_score,
        },
        "flags": flags,
    }
