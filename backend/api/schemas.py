from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Literal, Optional


class AskRequest(BaseModel):
    question: str
    # Optional session continuity — if not supplied, /query generates a
    # per-request UUID so callers are isolated by default.
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class CheckRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,   # claimed_credits → claimedCredits, etc.
        populate_by_name=True,       # also accept snake_case for direct API calls/tests
    )
    name: str = Field(..., min_length=2, max_length=200)
    role: Literal["actor", "writer", "investor", "indie_crew"]
    claimed_credits: int = Field(default=0, ge=0)
    # The frontend key is "claimedCollaborators" — different word from
    # claimed_connections, not just different casing, so an explicit alias
    # is required (it overrides the alias_generator for this field only).
    claimed_connections: list[str] = Field(
        default_factory=list,
        alias="claimedCollaborators",
        max_length=20,
    )
