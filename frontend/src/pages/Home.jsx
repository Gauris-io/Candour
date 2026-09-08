/**
 * Home.jsx  (/
 *
 * Hero section + SearchForm.
 * On submit: navigates to /report with { name, role } in route state.
 * No loading/error state here — that all lives on the Report page.
 */

import { useCandourCheck } from '../hooks/useCandourCheck'
import SearchForm from '../components/SearchForm'
import ReportView from '../components/ReportView'

export default function Home() {
  const { result, loading, error, check, activeTab, setActiveTab } = useCandourCheck()

  function handleCheck(name, role, claimedCredits, claimedCollaborators) {
    check(name, role, claimedCredits, claimedCollaborators)
  }

  return (
    <div className="bg-transparent flex flex-col items-center">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="px-8 pt-16 pb-8 flex flex-col items-center text-center">
        <h1 className="font-heading text-6xl text-ink leading-tight tracking-wide">
          Know who you're working with.
        </h1>
        <p className="font-app text-base text-ink-soft mt-4 max-w-2xl leading-relaxed">
          Candour pulls together producing credits, collaborator networks, and financial
          track records so you can make informed decisions before signing.
        </p>
      </div>

      {/* ── Search form ──────────────────────────────────────────────────── */}
      <SearchForm
        onCheck={handleCheck}
        loading={loading}
        error={null} // We'll handle the API error globally below instead of inline in the form
      />

      {/* ── Report Container ─────────────────────────────────────────────── */}
      <div className="w-full max-w-4xl px-8 flex flex-col items-center pb-16">
        
        {loading && (
          <div className="flex flex-col items-center gap-3 mt-8">
            <span className="inline-block w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
            <p className="font-app text-sm text-ink-soft animate-pulse-dot">
              Checking records…
            </p>
          </div>
        )}

        {error && (
          <div className="bg-card border border-pink/30 rounded-lg px-8 py-6 mt-8 w-full text-center">
            <p className="font-app text-sm text-pink">⚠ {error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="w-full mt-8 animate-fade-in">
            <h2 className="font-heading text-3xl text-ink mb-4 pl-1">Report:</h2>
            <ReportView 
              result={result} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>
        )}

      </div>
    </div>
  )
}
