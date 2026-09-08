/**
 * Home.jsx  (/
 *
 * Hero section + SearchForm.
 * On submit: navigates to /report with { name, role } in route state.
 * No loading/error state here — that all lives on the Report page.
 */

import { useNavigate } from 'react-router-dom'
import SearchForm from '../components/SearchForm'

export default function Home() {
  const navigate = useNavigate()

  function handleCheck(name, role, claimedCredits, claimedCollaborators) {
    navigate('/report', { state: { name, role, claimedCredits, claimedCollaborators } })
  }

  return (
    <div className="bg-card border-t border-row-line">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-10 pb-5">
        <h1 className="font-heading text-5xl text-ink leading-tight tracking-wide">
          Know who you're working with.
        </h1>
        <p className="font-app text-sm text-ink-soft mt-3 max-w-lg leading-relaxed">
          Candour pulls together producing credits, collaborator networks, and financial
          track records so you can make informed decisions before signing.
        </p>
      </div>

      {/* ── Search form ──────────────────────────────────────────────────── */}
      <SearchForm
        onCheck={handleCheck}
        loading={false}
        error={null}
      />
    </div>
  )
}
