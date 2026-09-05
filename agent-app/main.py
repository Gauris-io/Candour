from fastapi import FastAPI

app = FastAPI(title="Agentic Cinema Backend", description="Backend for the Google Cloud ADK Track")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
