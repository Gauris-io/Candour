import FolderTabs   from './FolderTabs'
import LedgerRow    from './LedgerRow'
import EvidenceSummary from './EvidenceSummary'

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
  const { name, inputName, role, credits, collaborators, personFound, matchType, candidates, warnings } = result
  const initials      = getInitials(personFound === false ? '?' : name)
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
        <h1 className="font-heading text-4xl text-ink leading-tight tracking-wide flex items-baseline gap-3">
          {personFound === false ? 'No verified match' : name}
          {result.nconst && (
            <span className="font-mono text-xs text-ink-soft tracking-normal uppercase">{result.nconst}</span>
          )}
        </h1>

        {/* Interpretation / not-found sub-line */}
        {personFound && matchType === 'extracted_from_text' && (
          <p className="font-mono text-xs text-ink-soft mt-1">
            Interpreted your query as: {name}
          </p>
        )}
        {personFound === false && warnings.length > 0 && (
          <p className="font-mono text-xs text-pink mt-1">
            {warnings[0]}
          </p>
        )}
        {personFound === false && candidates.length > 0 && (
          <p className="font-mono text-xs text-pink mt-1">
            Multiple people match: {candidates.map(c => c.name).join(', ')} — try a more specific name.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Role pill — labelled as the viewer's perspective */}
          <span className="font-app text-xs font-bold px-3 py-1 rounded-full bg-ink/10 text-ink capitalize">
            viewing as {roleLabel}
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
          label="Producing credits found"
          value={nullLabel(credits.found)}
          flagged={credits.found === 0}
          footnote={
            credits.found === 0
              ? 'No credits found — recorded as insufficient history, not a contradiction.'
              : "Projects where they're credited as producer or director"
          }
        />
        <LedgerRow
          label="Credits they claimed"
          value={nullLabel(credits.claimed)}
          flagged={false}
          footnote={
            credits.claimed > 0
              ? 'What the subject says they have'
              : undefined
          }
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
        <LedgerRow label="People they named"  value={String(total)}                                  flagged={false} />
        <LedgerRow label="Confirmed working relationships"       value={String(collaborators.verified.length)}          flagged={false} />
        <LedgerRow label="Couldn't confirm"     value={String(collaborators.unverified.length)}        flagged={collaborators.unverified.length > 0} footnote={collaborators.unverified.length > 0 ? "Absence of a record isn't proof a claim is false" : undefined} />
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
  const financialFlags = flags.filter(f => /financial|budget|box.?office|roi/i.test(f))

  return (
    <div className="space-y-4">
      <div className="space-y-0">
        <LedgerRow
          label="Box office vs budget"
          value={nullLabel(financials.avgBoxOfficeMultiple)}
          flagged={financials.avgBoxOfficeMultiple === null}
          footnote={
            financials.avgBoxOfficeMultiple === null
              ? 'Data unavailable for this person’s projects — outside dataset scope or no TMDb/Wikidata match.'
              : `Earned about $${financials.avgBoxOfficeMultiple} for every $1 spent across their tracked films`
          }
        />
        <LedgerRow
          label="Average return"
          value={nullLabel(financials.avgRoi)}
          flagged={financials.avgRoi === null}
          footnote={
            financials.avgRoi !== null
              ? 'Profit relative to budget across their tracked films'
              : undefined
          }
        />
        <LedgerRow
          label="Films with financial records"
          value={nullLabel(financials.projectsWithFinancialData)}
          flagged={false}
          footnote={
            financials.projectsWithFinancialData !== null
              ? `${financials.projectsWithFinancialData} of their tracked projects have budget and revenue on file`
              : undefined
          }
        />
        <LedgerRow
          label="Overall viability"
          value={nullLabel(financials.score)}
          flagged={financials.score === null}
          footnote={
            financials.score === null
              ? 'Score requires cohort/genre data — unavailable outside a narrow high-vote-count slice of titles.'
              : `${financials.score} out of 1 — combines financial returns (60%) and delivery record (40%)`
          }
        />
      </div>

      {financialFlags.length > 0 && <EvidenceSummary flags={financialFlags} />}

      {financialFlags.length === 0 && financials.score === null && (
        <p className="font-mono text-xs italic text-ink-soft">
          Financial data unavailable for this entity — see footnotes above for why.
        </p>
      )}
    </div>
  )
}

export default function ReportView({ result, activeTab, setActiveTab }) {
  return (
    <div className="animate-fade-in mb-8 w-full max-w-4xl mx-auto">
      <ProfileHeader result={result} />

      <FolderTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        className="bg-card rounded-b-container rounded-tr-container mx-px shadow-sm"
        role="tabpanel"
        id={`panel-${activeTab.toLowerCase()}`}
        aria-labelledby={`tab-${activeTab.toLowerCase()}`}
      >
        <div className="px-8 py-6">
          <div className={activeTab === 'Credits' ? 'block' : 'hidden print:block'}>
            <CreditsPanel result={result} />
          </div>
          <div className={activeTab === 'Collaborators' ? 'block' : 'hidden print:block'}>
            <CollaboratorsPanel result={result} />
          </div>
          <div className={activeTab === 'Financials' ? 'block' : 'hidden print:block'}>
            <FinancialsPanel result={result} />
          </div>
        </div>
      </div>
    </div>
  )
}
