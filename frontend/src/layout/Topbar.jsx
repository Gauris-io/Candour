/**
 * Topbar.jsx
 *
 * Header bar above main content area. Tagline + Profile link.
 */

import { Link } from 'react-router-dom'

export default function Topbar() {
  return (
    <header className="h-16 px-8 bg-transparent flex items-center justify-between flex-shrink-0 z-10 relative">
      
      {/* Left side: Logo */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center group/logo relative">
          
          {/* SVG Filter to turn black to pink, and white to transparent */}
          <svg width="0" height="0" className="absolute">
            <filter id="topbar-pink-logo-filter" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="
                0 0 0 0 0.890
                0 0 0 0 0.475
                0 0 0 0 0.561
                -0.333 -0.333 -0.333 1 0
              " />
            </filter>
          </svg>

          {/* Subtle glow behind the logo */}
          <div className="absolute left-[6px] top-1/2 -translate-y-1/2 w-8 h-8 bg-pink/40 rounded-full blur-[8px] opacity-70 group-hover/logo:opacity-100 group-hover/logo:scale-110 transition-all duration-300 z-0"></div>
          
          {/* Logo Image */}
          <img 
            src="/logo.png" 
            alt="Candour Logo" 
            className="w-10 h-10 object-contain relative z-10 transition-transform duration-300"
            style={{ filter: 'url(#topbar-pink-logo-filter)' }}
          />

          <span className="ml-3 font-app font-bold text-2xl text-pink tracking-tight drop-shadow-sm">
            Candour
          </span>
        </Link>
      </div>

      {/* Center: Tagline */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <p className="font-app text-xs text-ink-soft hidden sm:block">
          Due-diligence intelligence for film
        </p>
      </div>

      {/* Right side: Profile Icon */}
      <div className="flex items-center justify-end">
        <Link 
          to="/profile" 
          className="w-9 h-9 rounded-full bg-ink/10 flex items-center justify-center hover:bg-ink/20 transition-colors duration-150"
          aria-label="Your Profile"
        >
          <span className="font-heading text-ink text-lg leading-none">U</span>
        </Link>
      </div>
    </header>
  )
}
