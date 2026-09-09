# Candour

Candour lets an unrepresented actor, indie crew member, writer, or small investor check a producer/director/company's track record before committing to a project — completion rate, financial reliability, and credit/collaborator verification — answered with respect to the role you select, backed by evidence instead of guesswork.

Built for the **Google Cloud Agentic Cinema Hackathon** (ClickHouse track).

- **Live app:** [ADD DEPLOYED URL HERE]
- **Demo video:** [ADD YOUTUBE/VIMEO LINK HERE]

## What it does

You pick a role (actor, writer, indie crew, or investor), name the person or opportunity you're checking, and optionally list the credits or collaborations they've claimed. Candour returns a printable analysis grounded in real data: completion rate, financial reliability, cohort standing, and claim verification — tailored to what actually matters for your role.

## Architecture

Every question runs down two independent paths at once, and both results are shown together:

- **Evidence layer (deterministic).** A fixed SQL engine resolves the person's identity through a tiered match (exact name → case-insensitive → name extraction from a full sentence), then reads pre-computed metrics views in ClickHouse Cloud via `clickhouse-connect`. If the name doesn't resolve, it says so rather than returning a report that looks clean but is empty.
- **Reasoning layer (agentic).** A Gemini agent built on **Google Agent Development Kit (ADK)** reasons about the question and writes its own SQL, reaching ClickHouse Cloud exclusively through the official **mcp-clickhouse** MCP server — every query it runs is a live MCP tool call. It works through a five-step investigation (identity → credits → cohort standing → financials → claim verification), each step composed after seeing the previous result.

Both paths read the same layer-three metrics views computed once in the database, so the agent can reason freely about what to ask but can't produce a different answer than the evidence layer.

### Data pipeline

Three public datasets — IMDb, TMDb, and Wikidata — loaded into ClickHouse Cloud by our own ETL pipeline, held in three layers:

1. **Raw** — each source kept exactly as it arrived.
2. **Reconciliation** — cross-references and links the same person across all three sources, and joins each project to its financial record.
3. **Metrics** — completion rate, returns, cohort standing, and viability score, computed once and read by both engines above.

Where data coverage is thin (for example, credit history for non-producer/director roles, or cohort scoring outside a popularity-filtered slice), Candour returns an honest `null` with a stated reason instead of presenting a number that looks authoritative but isn't.

## Tech stack

- **Agent:** Google ADK + Gemini, querying via the official `mcp-clickhouse` MCP server
- **Backend:** FastAPI, `clickhouse-connect`
- **Database:** ClickHouse Cloud
- **Frontend:** React + Tailwind
- **Data sources:** TMDB, Wikidata, IMDb (non-commercial dataset)

## Key endpoints

- `POST /check` — the deterministic evidence path (direct ClickHouse query)
- `POST /query` — the agentic path; this is the one that spawns the mcp-clickhouse MCP subprocess and issues live tool calls through it
- `GET /search` — name lookup / disambiguation
- `GET /health` — health check

## Repository layout

- `backend/` — FastAPI app, ClickHouse access, the ADK agent (see `backend/README.md` for setup, environment variables, and local run instructions)
- `frontend/` — React + Tailwind app (see `frontend/README.md` for setup and build instructions)
- `data-pipeline/` — ETL that loads TMDB, Wikidata, and IMDb into ClickHouse Cloud (see `data-pipeline/README.md`)

## Running locally

See the README in each subfolder (`backend/`, `frontend/`, `data-pipeline/`) for exact setup steps and required environment variables. At a high level:

1. Provision a ClickHouse Cloud cluster and load it via `data-pipeline/`.
2. Set backend environment variables (ClickHouse host/port/user/password/database, Google API key) and run the FastAPI app.
3. Point the frontend's `VITE_API_BASE_URL` at the backend and run `npm run build` / `npm run dev`.

## License

MIT — see [LICENSE](./LICENSE).
