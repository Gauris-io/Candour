/**
 * ReportCard.jsx
 *
 * The cream report card rendered below the FolderTabs.
 * Shows: person name (font-heading), role + credit subtitle (font-app),
 * unverified pill badge (bg-pink font-app), then the tab panel content.
 *
 * @param {{
 *   result:    import('../utils/validateResponse').CandourResult,
 *   activeTab: string,
 *   children:  React.ReactNode,   // tab panel content injected by App
 * }} props
 */

export default function ReportCard({ result, activeTab, children }) {
  const { name, role, credits, collaborators } = result

  const totalCollabs  = collaborators.verified.length + collaborators.unverified.length
  const unverifiedCnt = collaborators.unverified.length

  const roleLabel = role.replace('_', ' ')

  return (
    <div
      className="bg-card rounded-b-container rounded-tr-container mx-px shadow-sm animate-fade-in"
      role="tabpanel"
      id={`panel-${activeTab.toLowerCase()}`}
      aria-labelledby={`tab-${activeTab.toLowerCase()}`}
    >
      {/* ── Header strip ─────────────────────────────────────────────── */}
      <div className="px-8 pt-7 pb-5 border-b border-row-line">
        {/* Person name — font-heading ONLY */}
        <h1 className="font-heading text-4xl text-ink leading-tight tracking-wide">
          {name}
        </h1>

        {/* Subtitle row: role pill + unverified count badge */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Role label */}
          <span className="font-app text-sm text-ink-soft capitalize">
            checked as&nbsp;
            <strong className="text-ink font-bold">{roleLabel}</strong>
          </span>

          {/* Credits found chip — neutral */}
          {credits.found !== null && (
            <span className="font-app text-xs font-bold px-2.5 py-0.5 rounded-full bg-verified/15 text-verified border border-verified/30">
              {credits.found} credit{credits.found !== 1 ? 's' : ''} found
            </span>
          )}

          {/* Unverified collaborators badge — pink = needs attention */}
          {totalCollabs > 0 && unverifiedCnt > 0 && (
            <span className="font-app text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink text-card">
              {unverifiedCnt} of {totalCollabs} collaborator claims unverified
            </span>
          )}

          {/* All verified badge */}
          {totalCollabs > 0 && unverifiedCnt === 0 && (
            <span className="font-app text-xs font-bold px-2.5 py-0.5 rounded-full bg-verified/15 text-verified border border-verified/30">
              all collaborators verified
            </span>
          )}
        </div>
      </div>

      {/* ── Tab panel content ──────────────────────────────────────────── */}
      <div className="px-8 py-6">
        {children}
      </div>
    </div>
  )
}
