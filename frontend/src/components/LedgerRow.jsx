/**
 * LedgerRow.jsx
 *
 * A single data row inside a report panel.
 *
 * Anatomy:
 *   [status dot] [snake_case label]    [value]
 *                [optional footnote in italic]
 *
 * Status dot:
 *   bg-pink     → flagged / unverified (needs attention)
 *   bg-verified → confirmed
 *
 * Label: font-mono, ink-soft
 * Value: font-mono, pink+bold if flagged | ink+normal if verified
 * Footnote: font-mono italic, ink-soft, smaller
 *
 * CRITICAL: font-mono only. Never font-app here.
 */

/**
 * @param {{
 *   label:     string,   // snake_case label, e.g. "producing_credits_found"
 *   value:     string,   // display value
 *   flagged?:  boolean,  // true → pink dot + pink bold value
 *   footnote?: string,   // optional italic secondary note below the row
 * }} props
 */
export default function LedgerRow({ label, value, flagged = false, footnote }) {
  return (
    <div className="border-b border-row-line last:border-b-0 py-3">
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <span
          className={[
            'mt-1.5 flex-shrink-0 w-2 h-2 rounded-full',
            flagged ? 'bg-pink' : 'bg-verified',
          ].join(' ')}
          aria-label={flagged ? 'flagged' : 'verified'}
        />

        {/* Label */}
        <span className="font-mono text-sm text-ink-soft flex-1 min-w-0 break-words">
          {label}
        </span>

        {/* Value */}
        <span
          className={[
            'font-mono text-sm flex-shrink-0 text-right',
            flagged
              ? 'text-pink font-semibold'
              : 'text-ink font-normal',
          ].join(' ')}
        >
          {value}
        </span>
      </div>

      {/* Optional footnote */}
      {footnote && (
        <p className="font-mono text-xs italic text-ink-soft mt-1 pl-5">
          {footnote}
        </p>
      )}
    </div>
  )
}
