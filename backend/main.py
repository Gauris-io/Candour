import asyncio
from uuid import uuid4
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# pyrefly: ignore [missing-import]
from google.adk.runners import Runner
# pyrefly: ignore [missing-import]
from google.adk.sessions import InMemorySessionService
# pyrefly: ignore [missing-import]
from google.genai import types

from agent.agent import root_agent
from api.schemas import AskRequest
from api.check import router as check_router
from api.search import router as search_router

# Initialize FastAPI
app = FastAPI(
    title="Candour — Agentic Cinema Backend",
    description="Due-diligence agent for film professionals. Google Cloud ADK + ClickHouse.",
)

# Allow the Vite dev server (and any origin during demo) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(check_router)
app.include_router(search_router)

# Initialize the Session Service and Runner
session_service = InMemorySessionService()

runner = Runner(
    agent=root_agent,
    session_service=session_service,
    app_name="cinema_app",
    auto_create_session=True,
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/query")
async def query_agent(request: AskRequest):
    """Free-text due-diligence query routed through the ADK agent.

    Runs in a thread so it doesn't block the event loop during the
    multi-round-trip MCP → ClickHouse agent execution.

    Session isolation: each request gets its own session by default.
    Pass user_id + session_id explicitly to maintain a multi-turn conversation.
    """
    effective_user_id    = request.user_id    or f"user_{uuid4().hex[:8]}"
    effective_session_id = request.session_id or f"sess_{uuid4().hex[:8]}"

    # When the caller passes a role, prepend a framing sentence so the agent
    # weights the analysis appropriately for that viewer's concerns.
    question_text = request.question
    if request.role:
        question_text = (
            f"The person asking is a {request.role} who has been approached by, "
            f"or is considering working with, the subject of this question. "
            f"Tailor the analysis to what matters for that role.\n\n{request.question}"
        )

    content = types.Content(role="user", parts=[types.Part(text=question_text)])

    # runner.run is a sync generator — offload to a thread so uvicorn's
    # event loop stays free to handle other requests while the agent works.
    try:
        events: list = await asyncio.to_thread(
            lambda: list(runner.run(
                user_id=effective_user_id,
                session_id=effective_session_id,
                new_message=content,
            ))
        )
    except Exception as e:
        print(f"Agent execution failed: {e}")
        return {"response": None, "error": "The analysis agent could not complete this request."}

    response_text = ""
    for event in events:
        if getattr(event, "is_final_response", lambda: False)():
            if getattr(event, "content", None) and event.content.parts:
                response_text = event.content.parts[0].text
            break

    # Fallback: grab last event with text content if is_final_response didn't fire
    if not response_text and events:
        for event in reversed(events):
            if getattr(event, "content", None) and event.content.parts:
                candidate = event.content.parts[0].text
                if candidate:
                    response_text = candidate
                    break

    return {"response": response_text}
