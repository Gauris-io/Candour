/**
 * validateResponse.js
 *
 * Thin pass-through validator for the POST /check response.
 *
 * The backend already returns clean structured JSON, so this is NOT a parser.
 * Its only job is to guarantee that every key the components depend on is
 * present, filling any accidentally-missing field with a safe default so
 * components never have to guard for undefined.
 *
 * If you ever tighten the backend contract further (e.g. add new top-level
 * fields), add the defaults here — components stay untouched.
 */

/**
 * @typedef {Object} CandourResult
 * @property {string}   name
 * @property {string}   role
 * @property {{ found: number|null, claimed: number|null }} credits
 * @property {{ verified: string[], unverified: string[] }} collaborators
 * @property {{ budgetToBoxOffice: number|null, score: number|null }} financials
 * @property {string[]} flags
 */

/**
 * Validates and normalises a raw /check API response.
 * @param {unknown} raw - The parsed JSON body from POST /check
 * @returns {CandourResult}
 */
export function validateResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('validateResponse: received non-object response')
  }

  return {
    name:  typeof raw.name  === 'string' ? raw.name  : '—',
    role:  typeof raw.role  === 'string' ? raw.role  : '—',

    credits: {
      found:   raw.credits?.found   ?? null,
      claimed: raw.credits?.claimed ?? null,
    },

    collaborators: {
      verified:   Array.isArray(raw.collaborators?.verified)   ? raw.collaborators.verified   : [],
      unverified: Array.isArray(raw.collaborators?.unverified) ? raw.collaborators.unverified : [],
    },

    financials: {
      budgetToBoxOffice: raw.financials?.budgetToBoxOffice ?? null,
      score:             raw.financials?.score             ?? null,
    },

    flags: Array.isArray(raw.flags) ? raw.flags : [],
  }
}
