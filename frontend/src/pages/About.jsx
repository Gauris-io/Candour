/**
 * About.jsx  (/about)
 *
 * Explains what Candour is and how it works.
 * Static content — no data fetching.
 */

export default function About() {
  return (
    <div className="bg-card border-t border-row-line px-8 py-10 space-y-8">

      {/* ── Headline ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-heading text-4xl text-ink leading-tight tracking-wide">
          About Candour
        </h1>
        <p className="font-app text-sm text-ink-soft mt-2">
          Built by Agentic Cinema for the film industry.
        </p>
      </div>

      {/* ── What it is ───────────────────────────────────────────────────── */}
      <section aria-labelledby="what-heading">
        <h2 id="what-heading" className="font-app font-bold text-base text-ink mb-2">
          What Candour does
        </h2>
        <p className="font-app text-sm text-ink-soft leading-relaxed">
          Candour is a due-diligence intelligence tool for the film industry. Given a name
          and a role — actor, writer, investor, or indie crew — it assembles a credibility
          report from producing credits, verified collaborator networks, and financial
          track records.
        </p>
        <p className="font-app text-sm text-ink-soft leading-relaxed mt-3">
          The goal is not to pass verdicts. It surfaces evidence: what can be confirmed,
          what can't, and what patterns are worth a second look.
        </p>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-app font-bold text-base text-ink mb-3">
          How it works
        </h2>
        <div className="space-y-0">
          {[
            ['Credits',       'Cross-references producing credits against public databases to verify track record depth.'],
            ['Collaborators', 'Checks claimed connections against verified co-production records, flagging unconfirmed associations.'],
            ['Financials',    'Where data exists, computes budget-to-box-office ratios and a composite financial viability score.'],
            ['Flags',         'Qualitative signals — suspicion levels, slow delivery, outlier completion rates — surfaced as evidence, not accusations.'],
          ].map(([label, desc]) => (
            <div key={label} className="border-b border-row-line last:border-b-0 py-3 flex gap-4">
              <span className="font-mono text-xs font-semibold text-verified uppercase tracking-widest w-24 flex-shrink-0 pt-0.5">
                {label}
              </span>
              <p className="font-app text-sm text-ink-soft leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <section className="border-l-4 border-pink bg-pink/5 rounded-r-lg px-4 py-3">
        <p className="font-mono text-xs font-semibold text-pink uppercase tracking-widest mb-1">
          Important
        </p>
        <p className="font-app text-sm text-ink-soft leading-relaxed">
          Candour is an intelligence aid, not a background-check service. Data completeness
          varies. Use reports to inform questions — not to replace conversation or legal due diligence.
        </p>
      </section>

    </div>
  )
}
