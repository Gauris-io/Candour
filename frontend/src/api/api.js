/**
 * api.js
 *
 * THE ONLY FILE that knows the backend URL and the HTTP contract.
 * All components and hooks import from here — never fetch() directly.
 *
 * Endpoint: POST /check
 * Request:  { name: string, role: "actor"|"writer"|"investor"|"indie_crew" }
 * Response: CandourResult (see validateResponse.js for the shape)
 *
 * To swap the backend URL or adjust the request shape, change this file only.
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
