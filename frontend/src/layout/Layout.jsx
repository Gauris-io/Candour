/**
 * Layout.jsx
 *
 * Shared page shell: Full height layout.
 * Left: Sidebar
 * Right: flex-col with Topbar, Outlet (main content), Footer.
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar - Expands on hover and pushes content */}
      <Sidebar />

      {/* Right Content Area - Split into two separate floating cards with a gap */}
      <div className="flex-1 flex flex-col min-w-0 py-4 pr-4 pl-2 gap-4">
        
        {/* Topbar Card - Only top corners rounded */}
        <div className="bg-card rounded-t-[32px] shadow-sm flex-shrink-0 border border-ink/5 overflow-hidden">
          <Topbar />
        </div>

        {/* Main Content Card - Only bottom corners rounded */}
        <div className="flex-1 bg-card rounded-b-[32px] shadow-sm flex flex-col overflow-hidden border border-ink/5 relative">
          <main className="flex-1 overflow-y-auto px-8 py-8 relative">
            <div className="max-w-6xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
