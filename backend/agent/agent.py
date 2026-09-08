# pyrefly: ignore [missing-import]
from google.adk.agents import LlmAgent
# pyrefly: ignore [missing-import]
from google.adk.tools import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters
from .instructions import TRACK_RECORD_INSTRUCTION
import os
import sys
import time
import asyncio

# --- Rate Limit Monkey Patch ---
# gemini-3.5-flash-lite free tier: check AI Studio for current RPM.
# The lock ensures concurrent /query calls queue instead of racing past
# the sleep and both hitting the RPM limit simultaneously.
import google.genai.models
_original_generate_content_async = google.genai.models.AsyncModels.generate_content

_rate_limit_lock = asyncio.Lock()
_last_call_time = 0.0


async def rate_limited_generate_content(self, *args, **kwargs):
    global _last_call_time
    async with _rate_limit_lock:
        elapsed = time.time() - _last_call_time
        if elapsed < 13.0:
            await asyncio.sleep(13.0 - elapsed)
        _last_call_time = time.time()
    return await _original_generate_content_async(self, *args, **kwargs)


google.genai.models.AsyncModels.generate_content = rate_limited_generate_content
# -------------------------------

uvx_executable = "uvx.exe" if os.name == "nt" else "uvx"
uvx_path = os.path.join(os.path.dirname(sys.executable), uvx_executable)
if not os.path.isfile(uvx_path):
    raise RuntimeError(
        f"Could not find {uvx_executable} in the virtual environment at {uvx_path}. "
        "Is uv installed?"
    )

mcp_toolset = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=uvx_path,
            args=["mcp-clickhouse"],
            env={
                "CLICKHOUSE_HOST": os.environ.get("CLICKHOUSE_HOST", ""),
                "CLICKHOUSE_PORT": os.environ.get("CLICKHOUSE_PORT", "8443"),
                "CLICKHOUSE_USER": os.environ.get("CLICKHOUSE_USER", "default"),
                "CLICKHOUSE_PASSWORD": os.environ.get("CLICKHOUSE_PASSWORD", ""),
                "CLICKHOUSE_DATABASE": os.environ.get("CLICKHOUSE_DATABASE", "default"),
                "PATH": os.environ.get("PATH", ""),
            }
        ),
        timeout=60.0
    )
)

root_agent = LlmAgent(
    model="gemini-3.5-flash-lite",
    name="track_record_agent",
    instruction=TRACK_RECORD_INSTRUCTION,
    tools=[mcp_toolset],
)
