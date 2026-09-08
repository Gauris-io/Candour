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
# gemini-3.5-flash-lite: 15 RPM on the free tier.
# Floor = 60s / 15 = 4.0s, bumped to 4.5s as a safety margin because
# each /query turn may include multiple tool-calling round trips, each
# of which counts toward the RPM budget.
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
        if elapsed < 4.5:
            await asyncio.sleep(4.5 - elapsed)
        _last_call_time = time.time()
    return await _original_generate_content_async(self, *args, **kwargs)


google.genai.models.AsyncModels.generate_content = rate_limited_generate_content
# -------------------------------

import shutil

# 1. Prefer mcp-clickhouse's own console script (it is a dependency)
cmd_path = shutil.which("mcp-clickhouse")
mcp_args = []

# 2. Fall back to uvx on PATH
if not cmd_path:
    uvx_cmd = "uvx.exe" if os.name == "nt" else "uvx"
    cmd_path = shutil.which(uvx_cmd)
    if cmd_path:
        mcp_args = ["mcp-clickhouse"]

# 3. Fall back to the old next-to-sys.executable check
if not cmd_path:
    uvx_executable = "uvx.exe" if os.name == "nt" else "uvx"
    uvx_path = os.path.join(os.path.dirname(sys.executable), uvx_executable)
    if os.path.isfile(uvx_path):
        cmd_path = uvx_path
        mcp_args = ["mcp-clickhouse"]

if not cmd_path:
    raise RuntimeError(
        "Could not find mcp-clickhouse or uvx in the environment or on PATH. "
        "Please ensure mcp-clickhouse or uv is installed."
    )

mcp_toolset = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=cmd_path,
            args=mcp_args,
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
