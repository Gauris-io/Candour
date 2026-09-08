/**
 * Sidebar.jsx
 *
 * Left-hand navigation sidebar.
 */

import { Link, NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-row-line bg-card flex flex-col h-screen flex-shrink-0">
      
      {/* Brand */}
      <div className="p-6 border-b border-row-line">
        <Link to="/" className="flex flex-col group">
          <span className="font-app font-bold text-2xl text-pink tracking-tight leading-none group-hover:opacity-85 transition-opacity">
            Candour
          </span>
          <span className="font-app text-xs text-ink-soft font-medium opacity-70 mt-1">
            by Agentic Cinema
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-2" aria-label="Sidebar navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [
              'block px-4 py-2.5 rounded-lg font-app text-sm font-bold transition-all duration-150',
              isActive
                ? 'bg-ink/5 text-ink'
                : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
            ].join(' ')
          }
        >
          Home
        </NavLink>
        
        {/* We keep Report always visible for now, it'll bounce back to home if no state */}
        <NavLink
          to="/report"
          className={({ isActive }) =>
            [
              'block px-4 py-2.5 rounded-lg font-app text-sm font-bold transition-all duration-150',
              isActive
                ? 'bg-ink/5 text-ink'
                : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
            ].join(' ')
          }
        >
          Report
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            [
              'block px-4 py-2.5 rounded-lg font-app text-sm font-bold transition-all duration-150',
              isActive
                ? 'bg-ink/5 text-ink'
                : 'text-ink-soft hover:bg-ink/5 hover:text-ink',
            ].join(' ')
          }
        >
          About
        </NavLink>
      </nav>

    </aside>
  )
}
