/**
 * Home.jsx  (/)
 *
 * Hero section + SearchForm.
 * On submit: fires both /check (structured ledger) and /query (AI brief) in parallel.
 *
 * Layout (after a search):
 *   1. AgentBrief  — narrative panel (Gemini response, markdown)
 *   2. ReportView  — tabbed evidence ledger (deterministic /check data)
 */

import { useCandourCheck } from '../hooks/useCandourCheck'
import SearchForm from '../components/SearchForm'
import ReportView from '../components/ReportView'
// react-markdown installed successfully; used to render the agent's markdown prose.
// If this import ever fails, swap the ReactMarkdown JSX below for the pre-wrap fallback.
import ReactMarkdown from 'react-markdown'

// ── Agent brief panel ──────────────────────────────────────────────────────

function AgentBrief({ agentResponse, agentLoading, agentError }) {
  if (!agentLoading && !agentResponse && !agentError) return null

  return (
    <div className="w-full max-w-4xl px-8 mb-2 animate-fade-in">
      <div className="bg-card rounded-container border border-row-line shadow-sm">

        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-row-line flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ink"
            aria-hidden="true"
          >
            {/* Spark icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="#F5F1DC"/>
            </svg>
          </span>
          <h2 className="font-heading text-lg text-ink tracking-wide">Analysis</h2>
          {agentLoading && (
            <span className="ml-auto inline-block w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          )}
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {agentLoading && !agentResponse && (
            <p className="font-app text-sm text-ink-soft animate-pulse-dot">
              Agent is querying the database…
            </p>
          )}

          {agentError && (
            <p className="font-app text-sm text-pink">⚠ {agentError}</p>
          )}

          {agentResponse && (
            ReactMarkdown ? (
              <div className="prose prose-sm max-w-none font-app text-ink leading-relaxed
                              [&_h3]:font-heading [&_h3]:text-base [&_h3]:text-ink [&_h3]:mt-5 [&_h3]:mb-1
                              [&_strong]:font-bold [&_strong]:text-ink
                              [&_p]:mb-3 [&_ul]:mb-3 [&_li]:mb-1
                              [&_code]:font-mono [&_code]:text-xs [&_code]:bg-ink/8 [&_code]:px-1 [&_code]:rounded">
                <ReactMarkdown>{agentResponse}</ReactMarkdown>
              </div>
            ) : (
              <div
                className="font-app text-sm text-ink leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {agentResponse}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function Home() {
  const {
    result, loading, error,
    agentResponse, agentLoading, agentError,
    check, activeTab, setActiveTab,
  } = useCandourCheck()

  function handleCheck(name, role, claimedCredits, claimedCollaborators) {
    check(name, role, claimedCredits, claimedCollaborators)
  }

  const hasAnyResult = result || loading || error || agentResponse || agentLoading || agentError

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
        loading={loading || agentLoading}
        error={null}
      />

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {hasAnyResult && (
        <div className="w-full flex flex-col items-center pb-16">

          {/* 1. Agent brief — narrative panel */}
          <AgentBrief
            agentResponse={agentResponse}
            agentLoading={agentLoading}
            agentError={agentError}
          />

          {/* 2. /check error (independent of agent) */}
          {error && (
            <div className="w-full max-w-4xl px-8 mb-2">
              <div className="bg-card border border-pink/30 rounded-lg px-8 py-6 text-center">
                <p className="font-app text-sm text-pink">⚠ {error}</p>
              </div>
            </div>
          )}

          {/* Loading spinner for /check */}
          {loading && !result && (
            <div className="flex flex-col items-center gap-3 mt-4 mb-2">
              <span className="inline-block w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
              <p className="font-app text-sm text-ink-soft animate-pulse-dot">
                Checking records…
              </p>
            </div>
          )}

          {/* 3. Tabbed evidence ledger */}
          {result && !loading && (
            <div className="w-full max-w-4xl px-8 animate-fade-in">
              <h2 className="font-heading text-sm text-ink-soft uppercase tracking-widest mb-3 pl-1">
                Evidence layer
              </h2>
              <ReportView
                result={result}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            </div>
          )}

        </div>
      )}

    </div>
  )
}
