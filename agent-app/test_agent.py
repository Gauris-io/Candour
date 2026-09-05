import os
from dotenv import load_dotenv
load_dotenv()

from google.adk.agents.llm_agent import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

root_agent = Agent(
    model='gemini-3.6-flash',
    name='cinema_agent',
    description='test',
    instruction='test'
)

session_service = InMemorySessionService()
runner = Runner(
    agent=root_agent, 
    session_service=session_service, 
    app_name="cinema_app", 
    auto_create_session=True
)

content = types.Content(role='user', parts=[types.Part(text="who are you?")])

events = runner.run(
    user_id="api_user", 
    session_id="default_session", 
    new_message=content
)

for event in events:
    print(event)
