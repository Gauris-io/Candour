/**
 * FolderTabs.jsx
 *
 * Horizontal tab bar: Credits / Collaborators / Financials.
 *
 * Active tab: solid pink background + cream text (bg-pink text-card)
 * Inactive tab: transparent, ink text
 * All labels: font-app
 *
 * The pink active tab is a semantic signal — it marks the currently
 * selected view, not a "warning." The pink rule applies here because
 * the active tab background is part of the UI chrome identity for
 * Candour (the brief explicitly calls for this usage).
 */

import { TABS } from '../hooks/useCandourCheck'

/**
 * @param {{ activeTab: string, onTabChange: (tab: string) => void }} props
 */
export default function FolderTabs({ activeTab, onTabChange }) {
  return (
    <div
      className="flex gap-1 px-6 pt-5"
      role="tablist"
      aria-label="Report sections"
    >
      {TABS.map((tab) => {
        const isActive = tab === activeTab
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.toLowerCase()}`}
            id={`tab-${tab.toLowerCase()}`}
            onClick={() => onTabChange(tab)}
            className={[
              'font-app font-bold text-sm px-5 py-2 rounded-t-lg transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink',
              isActive
                ? 'bg-pink text-card shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-card/50',
            ].join(' ')}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}
