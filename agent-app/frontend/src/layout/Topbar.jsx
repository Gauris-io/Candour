/**
 * Topbar.jsx
 *
 * Header bar above main content area. Tagline + Profile link.
 */

import { Link } from 'react-router-dom'

export default function Topbar() {
  return (
    <header className="h-16 px-8 bg-card border-b border-row-line flex items-center justify-between flex-shrink-0">
      
      {/* Tagline */}
      <div>
        <p className="font-app text-xs text-ink-soft hidden sm:block">
          Due-diligence intelligence for film
        </p>
      </div>

      {/* Right side: Profile Icon */}
      <Link 
        to="/profile" 
        className="w-9 h-9 rounded-full bg-ink/10 flex items-center justify-center hover:bg-ink/20 transition-colors duration-150"
        aria-label="Your Profile"
      >
        <span className="font-heading text-ink text-lg leading-none">U</span>
      </Link>
    </header>
  )
}
