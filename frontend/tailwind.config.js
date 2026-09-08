/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Font families ──────────────────────────────────────────────────────
      // font-heading  → "Oleo Script Swash Caps"  (person name headline ONLY)
      // font-app      → "Baloo 2"                  (all UI chrome)
      // font-mono     → "IBM Plex Mono"             (report/evidence data ONLY)
      fontFamily: {
        heading: ['"Merriweather"', 'serif'],
        app:     ['"Baloo 2"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },

      // ── Color tokens ───────────────────────────────────────────────────────
      // Never hardcode hex in components — use these named tokens only.
      colors: {
        base:      '#D4D0AB',   // page / outer background (olive-green)
        card:      '#F5F1DC',   // report card background (warm beige)
        pink:      '#E0718C',   // flagged / unverified / attention ONLY
        ink:       '#5C2A28',   // primary text
        'ink-soft':'#7A4A32',   // secondary / muted text
        verified:  '#7A9A6E',   // confirmed status ONLY
        'row-line':'#D4D0AB',   // hairline dividers between ledger rows
      },

      // ── Border radius ──────────────────────────────────────────────────────
      borderRadius: {
        container: '14px',
      },
    },
  },
  plugins: [],
}
