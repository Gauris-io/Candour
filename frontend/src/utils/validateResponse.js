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
 * @property {boolean|null} personFound
 * @property {string|null}  matchType
 * @property {{ name: string, nconst: string }[]} candidates
 * @property {string[]}     warnings
 * @property {{ found: number|null, claimed: number|null }} credits
 * @property {{ verified: string[], unverified: string[] }} collaborators
 * @property {{ avgBoxOfficeMultiple: number|null, avgRoi: number|null, projectsWithFinancialData: number|null, score: number|null }} financials
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
    inputName: raw.input_name ?? null,
    role:  typeof raw.role  === 'string' ? raw.role  : '—',

    // Identity resolution metadata — used by ProfileHeader to show interpretation cues
    personFound: raw.person_found ?? null,
    nconst:      raw.name_resolution?.nconst ?? null,
    matchType:   raw.name_resolution?.match_type ?? null,
    candidates:  raw.name_resolution?.candidates ?? [],
    warnings:    Array.isArray(raw.warnings) ? raw.warnings : [],

    credits: {
      found:   raw.credits?.found   ?? null,
      claimed: raw.credits?.claimed ?? null,
    },

    collaborators: {
      verified:   Array.isArray(raw.collaborators?.verified)   ? raw.collaborators.verified   : [],
      unverified: Array.isArray(raw.collaborators?.unverified) ? raw.collaborators.unverified : [],
    },

    financials: {
      avgBoxOfficeMultiple: raw.financials?.avgBoxOfficeMultiple ?? null,
      avgRoi: raw.financials?.avgRoi ?? null,
      projectsWithFinancialData: raw.financials?.projectsWithFinancialData ?? null,
      score: raw.financials?.score ?? null,
    },

    flags: Array.isArray(raw.flags) ? raw.flags : [],
  }
}
