/**
 * AppShell.jsx
 *
 * Page scaffold:
 *   - Full-height bg-base (olive-green) outer background
 *   - Centered max-w-3xl rounded-[14px] inner container (card-tone)
 *   - Header row: "Candour" wordmark (font-app bold pink) + role/action area
 *
 * Children are slotted into the container body below the header.
 */

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-0 px-8 py-5 bg-card rounded-t-container shadow-sm">
          {/* Wordmark */}
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-app font-bold text-2xl text-pink tracking-tight leading-none"
              aria-label="Candour"
            >
              Candour
            </span>
            <span className="font-app text-xs text-ink-soft font-medium opacity-70 pb-px">
              by Agentic Cinema
            </span>
          </div>

          {/* Header tagline / descriptor */}
          <p className="font-app text-xs text-ink-soft hidden sm:block">
            Due-diligence intelligence for film
          </p>
        </header>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <main className="flex-1">
          {children}
        </main>

      </div>
    </div>
  )
}
