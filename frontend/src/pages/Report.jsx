/**
 * Report.jsx  (/report)
 *
 * Reads { name, role } from location.state (set by Home's navigate call).
 * On mount calls check(name, role) via useCandourCheck.
 * Shows loading → result (ProfileHeader + FolderTabs + panel content).
 *
 * If no state (direct URL visit), redirects to / with a message.
 *
 * Tab panels are inline here — they're thin wrappers around
 * LedgerRow + EvidenceSummary, no need for separate files yet.
 *
 * Font law:
 *   font-heading → person name h1 ONLY
 *   font-app     → all chrome / labels / role badge
 *   font-mono    → all ledger rows, evidence text, values
 */

import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useCandourCheck } from '../hooks/useCandourCheck'
import FolderTabs   from '../components/FolderTabs'
import LedgerRow    from '../components/LedgerRow'
import EvidenceSummary from '../components/EvidenceSummary'

// ── Helpers ─────────────────────────────────────────────────────────────────

function nullLabel(value) {
  if (value === null || value === undefined) return 'n/a'
  return String(value)
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

// ── Profile header ───────────────────────────────────────────────────────────

function ProfileHeader({ result }) {
  const { name, role, credits, collaborators } = result
  const initials      = getInitials(name)
  const roleLabel     = role.replace('_', ' ')
  const totalCollabs  = collaborators.verified.length + collaborators.unverified.length
  const unverifiedCnt = collaborators.unverified.length
  const hasCredits    = credits.found !== null && credits.found > 0

  return (
    <div className="bg-card rounded-tr-container px-8 pt-8 pb-6 border-b border-row-line flex items-start gap-5">

      {/* Avatar circle */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-full bg-ink flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="font-heading text-xl text-card leading-none">{initials}</span>
      </div>

      {/* Name + pills */}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-4xl text-ink leading-tight tracking-wide">
          {name}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Role */}
          <span className="font-app text-xs font-bold px-3 py-1 rounded-full bg-ink/10 text-ink capitalize">
            {roleLabel}
          </span>

          {/* Credits found */}
          {credits.found !== null && (
            <span
              className={[
                'font-app text-xs font-bold px-2.5 py-0.5 rounded-full border',
                hasCredits
                  ? 'bg-verified/15 text-verified border-verified/30'
                  : 'bg-pink/10 text-pink border-pink/30',
              ].join(' ')}
            >
              {credits.found} credit{credits.found !== 1 ? 's' : ''} found
            </span>
          )}

          {/* Unverified collaborators */}
          {totalCollabs > 0 && unverifiedCnt > 0 && (
            <span className="font-app text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink text-card">
              {unverifiedCnt} of {totalCollabs} collaborators unverified
            </span>
          )}

          {/* All verified */}
          {totalCollabs > 0 && unverifiedCnt === 0 && (
            <span className="font-app text-xs font-bold px-2.5 py-0.5 rounded-full bg-verified/15 text-verified border border-verified/30">
              all collaborators verified
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab panels ───────────────────────────────────────────────────────────────

function CreditsPanel({ result }) {
  const { credits, flags } = result
  return (
    <div className="space-y-4">
      <div className="space-y-0">
        <LedgerRow
          label="producing_credits_found"
          value={nullLabel(credits.found)}
          flagged={credits.found === 0}
          footnote={
            credits.found === 0
              ? 'No credits found — recorded as insufficient history, not a contradiction.'
              : undefined
          }
        />
        <LedgerRow
          label="credits_claimed_by_subject"
          value={nullLabel(credits.claimed)}
          flagged={credits.claimed === null}
          footnote="Not yet available — scraped claim data not yet wired into backend."
        />
      </div>
      {flags.length > 0 && <EvidenceSummary flags={flags} />}
    </div>
  )
}

function CollaboratorsPanel({ result }) {
  const { collaborators, flags } = result
  const total  = collaborators.verified.length + collaborators.unverified.length
  const hasAny = total > 0

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <div className="space-y-0">
        <LedgerRow label="total_claimed_connections"  value={String(total)}                                  flagged={false} />
        <LedgerRow label="verified_connections"       value={String(collaborators.verified.length)}          flagged={false} />
        <LedgerRow label="unverified_connections"     value={String(collaborators.unverified.length)}        flagged={collaborators.unverified.length > 0} />
      </div>

      {/* Verified list */}
      {collaborators.verified.length > 0 && (
        <div>
          <p className="font-mono text-xs font-semibold text-verified uppercase tracking-widest mb-1">
            Verified
          </p>
          <div className="space-y-0">
            {collaborators.verified.map((name, i) => (
              <LedgerRow key={i} label={name} value="confirmed" flagged={false} />
            ))}
          </div>
        </div>
      )}

      {/* Unverified list */}
      {collaborators.unverified.length > 0 && (
        <div>
          <p className="font-mono text-xs font-semibold text-pink uppercase tracking-widest mb-1">
            Unverified claims
          </p>
          <div className="space-y-0">
            {collaborators.unverified.map((name, i) => (
              <LedgerRow key={i} label={name} value="not confirmed" flagged={true} />
            ))}
          </div>
        </div>
      )}

      {!hasAny && (
        <p className="font-mono text-sm italic text-ink-soft">
          No collaborator data available for this entity.
        </p>
      )}

      {flags.length > 0 && (
        <EvidenceSummary flags={flags.filter(f => /network|suspicion/i.test(f))} />
      )}
    </div>
  )
}

function FinancialsPanel({ result }) {
  const { financials, flags } = result
  const financialFlags = flags.filter(f => /financial|budget|box.?office/i.test(f))

  return (
    <div className="space-y-4">
      <div className="space-y-0">
        <LedgerRow
          label="budget_to_box_office_ratio"
          value={nullLabel(financials.budgetToBoxOffice)}
          flagged={financials.budgetToBoxOffice === null}
          footnote={
            financials.budgetToBoxOffice === null
              ? 'Data unavailable — not yet wired from industry databases.'
              : undefined
          }
        />
        <LedgerRow
          label="financial_viability_score"
          value={nullLabel(financials.score)}
          flagged={financials.score === null}
          footnote={
            financials.score === null
              ? 'Score requires budget-to-box-office ratio to compute.'
              : undefined
          }
        />
      </div>

      {financialFlags.length > 0 && <EvidenceSummary flags={financialFlags} />}

      {financialFlags.length === 0 && financials.score === null && (
        <p className="font-mono text-xs italic text-ink-soft">
          Financial data will populate once industry database integration is complete.
        </p>
      )}
    </div>
  )
}

// ── Report page ──────────────────────────────────────────────────────────────

export default function Report() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { result, loading, error, check, activeTab, setActiveTab } = useCandourCheck()

  const { name, role, claimedCredits, claimedCollaborators } = location.state ?? {}

  useEffect(() => {
    // If opened without state (direct URL visit), bounce back home
    if (!name || !role) {
      navigate('/', { replace: true })
      return
    }
    check(name, role, claimedCredits, claimedCollaborators)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-card border-t border-row-line px-8 py-16 flex flex-col items-center gap-3">
        <span className="inline-block w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
        <p className="font-app text-sm text-ink-soft animate-pulse-dot">
          Checking {name}…
        </p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-card border-t border-row-line px-8 py-12 flex flex-col gap-3">
        <p className="font-app text-sm text-pink">⚠ {error}</p>
        <Link to="/" className="font-app text-sm text-ink-soft underline hover:text-ink">
          ← Back to search
        </Link>
      </div>
    )
  }

  // ── No result yet (shouldn't normally show) ────────────────────────────
  if (!result) return null

  // ── Result ─────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <ProfileHeader result={result} />

      <FolderTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        className="bg-card rounded-b-container rounded-tr-container mx-px shadow-sm"
        role="tabpanel"
        id={`panel-${activeTab.toLowerCase()}`}
        aria-labelledby={`tab-${activeTab.toLowerCase()}`}
      >
        <div className="px-8 py-6">
          {activeTab === 'Credits'       && <CreditsPanel       result={result} />}
          {activeTab === 'Collaborators' && <CollaboratorsPanel result={result} />}
          {activeTab === 'Financials'    && <FinancialsPanel    result={result} />}
        </div>
      </div>

      {/* Back link */}
      <div className="pt-4 px-1">
        <Link
          to="/"
          className="font-app text-xs text-ink-soft hover:text-ink transition-colors"
        >
          ← New search
        </Link>
      </div>
    </div>
  )
}
