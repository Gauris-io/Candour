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
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
}
