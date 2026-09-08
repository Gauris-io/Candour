/**
 * useCandourCheck.js
 *
 * Central data hook. Manages:
 *  - loading / error / result state
 *  - active tab (Credits | Collaborators | Financials)
 *  - mock vs live toggle via VITE_USE_MOCK env var
 *
 * Components only consume the returned object — they never call fetch() or
 * know about the API shape.
 */

import { useState, useCallback } from 'react'
import { checkCredibility } from '../api/api'
import { validateResponse } from '../utils/validateResponse'
import { getMockResult } from '../mock/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const TABS = ['Credits', 'Collaborators', 'Financials']

/**
 * @returns {{
 *   result: import('../utils/validateResponse').CandourResult | null,
 *   loading: boolean,
 *   error: string | null,
 *   check: (name: string, role: string, claimedCredits?: string|number, claimedCollaborators?: string[]) => void,
 *   activeTab: string,
 *   setActiveTab: (tab: string) => void,
 * }}
 */
export function useCandourCheck() {
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState(TABS[0])

  const check = useCallback(async (name, role, claimedCredits, claimedCollaborators) => {
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTab(TABS[0]) // reset to Credits tab on each new check

    try {
      let raw

      if (USE_MOCK) {
        // Simulate network latency in mock mode so the loading state is visible
        await new Promise(r => setTimeout(r, 800))
        raw = getMockResult(name.trim(), role, claimedCredits, claimedCollaborators)
      } else {
        raw = await checkCredibility(name.trim(), role, claimedCredits, claimedCollaborators)
      }

      setResult(validateResponse(raw))
    } catch (err) {
      setError(err.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, error, check, activeTab, setActiveTab }
}
