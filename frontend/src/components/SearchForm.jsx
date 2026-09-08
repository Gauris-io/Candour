/**
 * SearchForm.jsx
 *
 * Name input + 4 role selector pills.
 * Triggers useCandourCheck on submit.
 *
 * Loading state: input + button disabled, spinner shown.
 * Error state: inline message below the form.
 *
 * All text: font-app.
 */

import { useState, useEffect } from 'react'

const ROLES = [
  { value: 'actor', label: 'Actor' },
  { value: 'writer', label: 'Writer' },
  { value: 'investor', label: 'Investor' },
  { value: 'indie_crew', label: 'Indie Crew' },
]

/**
 * @param {{
 *   onCheck:  (name: string, role: string) => void,
 *   loading:  boolean,
 *   error:    string | null,
 * }} props
 */
export default function SearchForm({ onCheck, loading, error }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('actor')
  const [nameError, setNameError] = useState('')
  const [claimedCredits, setClaimedCredits] = useState('')
  const [claimedCollaborators, setClaimedCollaborators] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('candour.profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.role) setRole(parsed.role)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  function handleNameChange(e) {
    setName(e.target.value)
    if (nameError) setNameError('') // clear inline error as soon as user types
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    if (!name.trim()) {
      setNameError('Please enter a name before checking.')
      return
    }
    setNameError('')
    
    const collabArray = claimedCollaborators
      ? claimedCollaborators.split(',').map(s => s.trim()).filter(Boolean)
      : undefined

    onCheck(name.trim(), role, claimedCredits, collabArray)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-8 pb-10 pt-6 flex flex-col gap-8 w-full max-w-4xl mx-auto items-center print:hidden"
      aria-label="Credibility check form"
    >
      {/* Role selector pills */}
      <div className="flex flex-col items-center gap-2 w-full">
        <label className="font-app text-sm font-bold text-ink">Your role</label>
        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Select your role">
        {ROLES.map(({ value, label }) => {
          const active = role === value
          return (
            <button
              key={value}
              type="button"
              id={`role-${value}`}
              aria-pressed={active}
              onClick={() => setRole(value)}
              disabled={loading}
              className={[
                'font-app text-sm font-bold px-4 py-1.5 rounded-full border transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink',
                active
                  ? 'bg-ink text-card border-ink'
                  : 'bg-transparent text-ink-soft border-ink/20 hover:border-ink/50 hover:text-ink',
                loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
        </div>
      </div>

      {/* Name input + submit */}
      <div className="flex gap-3 items-stretch w-full">

        {/* ── Wrapper: checker via inline style (bypasses Tailwind/Vite url() quirks) ── */}
        <div
          className={[
            'group flex-1 relative rounded-lg border border-ink/15 overflow-hidden transition-all duration-300',
            loading ? 'opacity-50' : '',
          ].join(' ')}
          style={{
            backgroundImage: "url('/checker.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Blur layer: Softens the checker lines underneath */}
          <div className="absolute inset-0 pointer-events-none backdrop-blur-[3px] group-focus-within:backdrop-blur-md group-focus-within:bg-[#F5F1DC]/80 transition-all duration-300 z-0" />

          {/* True Marbling overlay: High-quality marble texture tinting the checker */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-60 group-focus-within:opacity-20 transition-all duration-300 z-0"
            style={{
              backgroundImage: "url('/marble.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Silky sheen: Warm, soft flowing highlight that blends into the pink/beige without looking icy or white */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-pink/25 to-transparent mix-blend-overlay opacity-80 group-focus-within:opacity-40 transition-all duration-300 z-0" />

          {/* Retro mic — never dims (sits above the ::before overlay in z-order) */}
          <img
            src="/mic.jpg"
            alt=""
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-7 w-auto pointer-events-none mix-blend-multiply z-30"
          />

          {/* Input — appearance:none strips OS chrome; background:transparent reveals checker */}
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Ask about a producer or director…"
            disabled={loading}
            aria-invalid={!!nameError}
            aria-label="Producer or director name"
            style={{
              background: 'transparent',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
            className={[
              'relative z-20 w-full font-app text-base text-ink placeholder-ink-soft/70',
              'px-4 py-3',
              'focus:outline-none text-center',
              loading ? 'cursor-not-allowed' : '',
            ].join(' ')}
          />
        </div>


        <button
          type="submit"
          id="check-submit"
          disabled={loading || !name.trim()}
          className={[
            'font-app font-bold text-sm px-6 py-2.5 rounded-lg transition-all duration-150',
            'bg-ink text-card hover:bg-ink/85 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink',
            (loading || !name.trim()) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
          aria-busy={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-card/30 border-t-card rounded-full animate-spin" />
              Checking…
            </span>
          ) : (
            'Check'
          )}
        </button>
      </div>

      {/* Validation error (blank name) */}
      {nameError && (
        <p role="alert" className="font-app text-sm text-pink -mt-1">
          ⚠ {nameError}
        </p>
      )}

      {/* Claim inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4 w-full">
        <div className="flex flex-col items-center">
          <label htmlFor="claimed-credits" className="block font-app text-sm font-bold text-ink mb-2 text-center">
            Credits claimed (optional)
          </label>
          <input
            id="claimed-credits"
            type="number"
            min="0"
            value={claimedCredits}
            onChange={(e) => setClaimedCredits(e.target.value)}
            disabled={loading}
            className="w-full font-app text-sm text-ink placeholder-ink-soft/70 border border-ink/15 rounded-lg px-4 py-2.5 focus:outline-none focus:border-ink/40 transition-colors bg-transparent text-center"
          />
        </div>
        
        <div className="flex flex-col items-center">
          <label htmlFor="claimed-collaborators" className="block font-app text-sm font-bold text-ink mb-2 text-center">
            Named collaborators (comma-separated)
          </label>
          <textarea
            id="claimed-collaborators"
            rows={1}
            placeholder="e.g. Producer A, Studio Y"
            value={claimedCollaborators}
            onChange={(e) => setClaimedCollaborators(e.target.value)}
            disabled={loading}
            className="w-full font-app text-sm text-ink placeholder-ink-soft/70 border border-ink/15 rounded-lg px-4 py-2.5 focus:outline-none focus:border-ink/40 transition-colors bg-transparent resize-y min-h-[42px] text-center"
          />
        </div>
      </div>

      {/* API / network error */}
      {error && (
        <p role="alert" className="font-app text-sm text-pink">
          ⚠ {error}
        </p>
      )}
    </form>
  )
}
