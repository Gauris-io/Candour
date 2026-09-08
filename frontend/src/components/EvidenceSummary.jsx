/**
 * EvidenceSummary.jsx
 *
 * A callout block inside a report panel that surfaces qualitative flags.
 *
 * Visual anatomy:
 *   left border in pink (border-l-4 border-pink)
 *   font-mono paragraph — key facts bolded, caveats/uncertainty italicised
 *
 * CRITICAL: font-mono only inside this component.
 * Pink border signals "needs attention" — consistent with the colour rule.
 *
 * @param {{ flags: string[] }} props
 */
export default function EvidenceSummary({ flags }) {
  if (!flags || flags.length === 0) return null

  return (
    <div
      className="border-l-4 border-pink bg-pink/5 rounded-r-lg px-4 py-3 space-y-1"
      role="region"
      aria-label="Evidence flags"
    >
      <p className="font-mono text-xs font-semibold text-pink uppercase tracking-widest mb-2">
        Flagged signals
      </p>
      {flags.map((flag, i) => {
        // Heuristic: sentences containing "unavailable" or "could not" are caveats → italic
        const isCaveat =
          /unavailable|could not|no .+ found|insufficient/i.test(flag)

        return (
          <p
            key={i}
            className={[
              'font-mono text-sm text-ink leading-relaxed',
              isCaveat ? 'italic text-ink-soft' : 'font-semibold',
            ].join(' ')}
          >
            — {flag}
          </p>
        )
      })}
    </div>
  )
}
