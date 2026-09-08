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
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const [agentResponse, setAgentResponse] = useState(null)
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
        setResult(validateResponse(raw))
      } catch (err) {
        setError(err.message ?? 'Unknown error')
      } finally {
        setLoading(false)
        setAgentLoading(false)
      }
      return
    }

    // Live mode: fire both in parallel, settle independently
    const [checkOutcome, agentOutcome] = await Promise.allSettled([
      checkCredibility(name.trim(), role, claimedCredits, claimedCollaborators),
      // The agent receives the raw name as a natural-language subject
      // (the role-framing is added server-side when role is supplied)
      askAgent(name.trim(), role),
    ])

    // /check result
    if (checkOutcome.status === 'fulfilled') {
      try {
        setResult(validateResponse(checkOutcome.value))
      } catch (err) {
        setError(err.message ?? 'Response validation error')
      }
    } else {
      setError(checkOutcome.reason?.message ?? 'Unknown error from /check')
    }
    setLoading(false)

    // /query (agent) result
    if (agentOutcome.status === 'fulfilled') {
      setAgentResponse(agentOutcome.value)
    } else {
      setAgentError(agentOutcome.reason?.message ?? 'Unknown error from /query')
    }
    setAgentLoading(false)

  }, [])

  return {
    result, loading, error,
    agentResponse, agentLoading, agentError,
    check, activeTab, setActiveTab,
  }
}
