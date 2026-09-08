/**
 * api.js
 *
 * THE ONLY FILE that knows the backend URL and the HTTP contract.
 * All components and hooks import from here — never fetch() directly.
 *
 * Endpoints:
 *   POST /check  — deterministic structured lookup
 *     Request:  { name, role, claimedCredits?, claimedCollaborators? }
 *     Response: CandourResult (see validateResponse.js for the shape)
 *
 *   POST /query  — AI agent (Gemini + mcp-clickhouse)
 *     Request:  { question, role? }
 *     Response: { response: string }  (markdown prose)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * @param {string} name  - Producer / director name to check
 * @param {string} role  - Viewing role: "actor"|"writer"|"investor"|"indie_crew"
 * @param {number|string} [claimedCredits] - Optional number of claimed producing credits
 * @param {string[]} [claimedCollaborators] - Optional array of claimed collaborator names
 * @returns {Promise<Object>} Raw parsed JSON from /check (call validateResponse on this)
 */
export async function checkCredibility(name, role, claimedCredits, claimedCollaborators) {
  const payload = { name, role }
  if (claimedCredits !== undefined && claimedCredits !== '') {
    payload.claimedCredits = Number(claimedCredits)
  }
  if (claimedCollaborators && claimedCollaborators.length > 0) {
    payload.claimedCollaborators = claimedCollaborators
  }

  const res = await fetch(`${BASE_URL}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`/check returned ${res.status}: ${detail}`)
  }

  return res.json()
}

/**
 * @param {string} question  - Free-text due-diligence question (sent verbatim to the agent)
 * @param {string|null} [role]  - Viewing role for tailored analysis (optional)
 * @returns {Promise<string>} Markdown prose from the Gemini agent
 */
export async function askAgent(question, role) {
  const payload = { question }
  if (role) payload.role = role

  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`/query returned ${res.status}: ${detail}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.response
}
