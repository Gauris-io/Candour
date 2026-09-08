/**
 * mockData.js
 *
 * Three named mock responses. Swap ACTIVE_MOCK to test different UI states.
 *
 *   'clean'   — found credits, all verified, no flags
 *   'flagged' — heavily flagged, unverified collaborators (Raj Mehta case)
 *   'empty'   — zero data: no credits found, no collaborators, explanatory flags
 *
 * Change only the line below — nothing else needs to touch this file.
 */

/** @type {'clean' | 'flagged' | 'empty'} */
const ACTIVE_MOCK = 'flagged'

// ── 1. Clean case ──────────────────────────────────────────────────────────
// Well-documented producer: credits found, all connections verified, no flags.
const MOCK_CLEAN = {
  name: 'Elena Vasquez',
  role: 'writer',

  credits: {
    found:   8,
    claimed: null,
  },

  collaborators: {
    verified:   ['Searchlight Pictures', 'A24', 'Barry Jenkins', 'Celine Song'],
    unverified: [],
  },

  financials: {
    avgBoxOfficeMultiple: 3.4,
    avgRoi: 0.85,
    projectsWithFinancialData: 6,
    score: 82,
  },

  flags: [],
}

// ── 2. Flagged case ─────────────────────────────────────────────────────────
// High-risk investor: network suspicion, unverified claims, slow delivery.
const MOCK_FLAGGED = {
  name: 'Raj Mehta',
  role: 'investor',

  credits: {
    found:   3,
    claimed: null,
  },

  collaborators: {
    verified:   ['Priya Nair', 'Studio Fulcrum'],
    unverified: ['A24 (alleged)', 'Denis Villeneuve (alleged)', 'Anonymous EP'],
  },

  financials: {
    avgBoxOfficeMultiple: null,
    avgRoi: null,
    projectsWithFinancialData: null,
    score: null,
  },

  flags: [
    'network suspicion level: medium',
    'financial data unavailable — could not verify budget-to-box-office performance',
    'average time to release is 28 months (above typical 18–24 month range)',
  ],
}

// ── 3. No-data case ─────────────────────────────────────────────────────────
// Unknown entity: nothing verifiable, all fields empty, flags explain why.
const MOCK_EMPTY = {
  name: 'Marcus Holloway',
  role: 'indie_crew',

  credits: {
    found:   0,
    claimed: null,
  },

  collaborators: {
    verified:   [],
    unverified: [],
  },

  financials: {
    avgBoxOfficeMultiple: null,
    avgRoi: null,
    projectsWithFinancialData: null,
    score: null,
  },

  flags: [
    'no producing credits found — flagged as insufficient history, not a contradiction of stated claims',
    'financial data unavailable — could not verify budget-to-box-office performance',
  ],
}

// ── Active export ──────────────────────────────────────────────────────────
const MOCKS = { clean: MOCK_CLEAN, flagged: MOCK_FLAGGED, empty: MOCK_EMPTY }

export function getMockResult(name, role, claimedCredits, claimedCollaborators) {
  const base = MOCKS[ACTIVE_MOCK]
  
  // Create a deep copy so we don't mutate the base mock object between calls
  const result = JSON.parse(JSON.stringify(base))

  // Always reflect what they searched for
  if (name) result.name = name
  if (role) result.role = role

  // Inject claims if provided
  if (claimedCredits !== undefined && claimedCredits !== null && claimedCredits !== '') {
    result.credits.claimed = Number(claimedCredits)
  }

  if (claimedCollaborators && Array.isArray(claimedCollaborators) && claimedCollaborators.length > 0) {
    // For the mock, we'll just lazily treat all claimed collaborators as 'unverified' unless they happen to match our hardcoded 'verified' list exactly.
    const newVerified = []
    const newUnverified = []
    
    for (const claim of claimedCollaborators) {
      if (base.collaborators.verified.includes(claim)) {
        newVerified.push(claim)
      } else {
        newUnverified.push(claim)
      }
    }
    
    result.collaborators.verified = newVerified
    result.collaborators.unverified = newUnverified
  }

  return result
}
