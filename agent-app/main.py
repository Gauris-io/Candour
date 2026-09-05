import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from google.adk.agents.llm_agent import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Initialize FastAPI
app = FastAPI(title="Agentic Cinema Backend", description="Backend for the Google Cloud ADK Track")

# Initialize the Gemini agent using ADK
# Requires GOOGLE_API_KEY environment variable to be set
root_agent = Agent(
    model='gemini-3.6-flash',
    name='cinema_agent',
    description='A helpful assistant for Agentic Cinema.',
    instruction='You are a helpful assistant for the Agentic Cinema project. Answer the user\'s questions clearly and concisely.'
)

# Initialize the Session Service
session_service = InMemorySessionService()

# Initialize the Runner to execute the agent
runner = Runner(
    agent=root_agent, 
    session_service=session_service, 
    app_name="cinema_app", 
    auto_create_session=True
)

class AskRequest(BaseModel):
    question: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/ask")
async def ask_agent(request: AskRequest):
    # Prepare the input content
    content = types.Content(role='user', parts=[types.Part(text=request.question)])
    
    # Run the agent
    events = runner.run(
        user_id="api_user", 
        session_id="default_session", 
        new_message=content
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
