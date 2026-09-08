from fastapi import APIRouter, Query
from domain.identity import search_person_names

router = APIRouter()


@router.get("/search")
async def search_people(
    q: str = Query(..., min_length=2, description="Partial name to search for"),
    limit: int = Query(10, ge=1, le=50),
):
    """Typeahead search over identity.person_bridge.

    Returns up to `limit` matches ordered by verified status (verified=True first).
    Use this to discover valid names before calling /check.

    Response: [{name, nconst, verified}]
    """
    return search_person_names(q, limit)
