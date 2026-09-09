/**
 * useCandourCheck.js
 *
 * Central data hook. Manages:
 *  - loading / error / result state for /check (deterministic ledger)
 *  - agentResponse / agentLoading / agentError state for /query (AI brief)
 *  - active tab (Credits | Collaborators | Financials)
 *  - mock vs live toggle via VITE_USE_MOCK env var
 *
 * Both calls fire in parallel via Promise.allSettled so one failing
 * doesn't blank the other — the narrative panel and the ledger are
 * independently resilient.
 */

import { useState, useCallback } from 'react'
import { checkCredibility, askAgent } from '../api/api'
import { validateResponse } from '../utils/validateResponse'
import { getMockResult } from '../mock/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const TABS = ['Credits', 'Collaborators', 'Financials']

/**
 * @returns {{
 *   result: import('../utils/validateResponse').CandourResult | null,
 *   loading: boolean,
 *   error: string | null,
 *   agentResponse: string | null,
 *   agentLoading: boolean,
 *   agentError: string | null,
 *   check: (name: string, role: string, claimedCredits?: string|number, claimedCollaborators?: string[]) => void,
 *   activeTab: string,
 *   setActiveTab: (tab: string) => void,
 * }}
 */
export function useCandourCheck() {
  const [result, setResult] = useState(() => {
    try {
      const stored = sessionStorage.getItem('candour.lastReport')
      if (stored) return JSON.parse(stored).result || null
    } catch (e) {}
    return null
  })
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const [agentResponse, setAgentResponse] = useState(() => {
    try {
      const stored = sessionStorage.getItem('candour.lastReport')
      if (stored) return JSON.parse(stored).agentResponse || null
    } catch (e) {}
    return null
  })
  const [agentLoading, setAgentLoading]   = useState(false)
  const [agentError, setAgentError]       = useState(null)

  const [activeTab, setActiveTab] = useState(TABS[0])

  const check = useCallback(async (name, role, claimedCredits, claimedCollaborators) => {
    if (!name.trim()) return

    // Reset all state
    setLoading(true)
    setError(null)
    setResult(null)
    setAgentLoading(true)
    setAgentError(null)
    setAgentResponse(null)
    setActiveTab(TABS[0])

    if (USE_MOCK) {
      // Mock mode: only the /check path is mocked; agent panel shows nothing
      try {
        await new Promise(r => setTimeout(r, 800))
        const raw = getMockResult(name.trim(), role, claimedCredits, claimedCollaborators)
        const validatedResult = validateResponse(raw)
        setResult(validatedResult)
        try {
          const existingStr = sessionStorage.getItem('candour.lastReport')
          const existing = existingStr ? JSON.parse(existingStr) : {}
          const toSave = { 
            ...existing,
            query: name.trim(), 
            role, 
            claimedCredits, 
            claimedCollaborators, 
            result: validatedResult 
          }
          sessionStorage.setItem('candour.lastReport', JSON.stringify(toSave))
        } catch(e) {}
      } catch (err) {
        setError(err.message ?? 'Unknown error')
      } finally {
        setLoading(false)
        setAgentLoading(false)
      }
      return
    }

    // Live mode: fire both in parallel, update state independently as soon as each resolves
    checkCredibility(name.trim(), role, claimedCredits, claimedCollaborators)
      .then(raw => {
        const validatedResult = validateResponse(raw)
        setResult(validatedResult)
        try {
          const existingStr = sessionStorage.getItem('candour.lastReport')
          const existing = existingStr ? JSON.parse(existingStr) : {}
          const toSave = { 
            ...existing,
            query: name.trim(), 
            role, 
            claimedCredits, 
            claimedCollaborators, 
            result: validatedResult 
          }
          sessionStorage.setItem('candour.lastReport', JSON.stringify(toSave))
        } catch(e) {}
      })
      .catch(err => setError(err.message ?? 'Unknown error from /check'))
      .finally(() => setLoading(false))

    // The agent receives the raw name as a natural-language subject
    // (the role-framing is added server-side when role is supplied)
    let agentQuestion = name.trim()

    try {
      const stored = localStorage.getItem('candour.profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.name && parsed.name !== 'User') {
          agentQuestion = `The person asking is named ${parsed.name}. ` + agentQuestion
        }
      }
    } catch (e) {
      // ignore
    }

    const claimParts = []
    if (claimedCredits !== undefined && claimedCredits !== '' && Number(claimedCredits) > 0) {
      claimParts.push(`The subject claims ${Number(claimedCredits)} producing credits.`)
    }
    if (claimedCollaborators && claimedCollaborators.length > 0) {
      claimParts.push(`The subject claims to have worked with: ${claimedCollaborators.join(', ')}.`)
    }
    if (claimParts.length > 0) {
      agentQuestion += `\n\n${claimParts.join(' ')} Verify these claims against the data and state plainly which are corroborated and which are not.`
    }

    askAgent(agentQuestion, role)
      .then(text => {
        setAgentResponse(text)
        try {
          const existingStr = sessionStorage.getItem('candour.lastReport')
          const existing = existingStr ? JSON.parse(existingStr) : {}
          existing.agentResponse = text
          sessionStorage.setItem('candour.lastReport', JSON.stringify(existing))
        } catch (e) {}
      })
      .catch(err => setAgentError(err.message ?? 'Unknown error from /query'))
      .finally(() => setAgentLoading(false))

  }, [])

  return {
    result, loading, error,
    agentResponse, agentLoading, agentError,
    check, activeTab, setActiveTab,
  }
}
