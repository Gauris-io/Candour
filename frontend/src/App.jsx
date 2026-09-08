/**
 * App.jsx
 *
 * Router root. All three routes nest under Layout so Navbar + Footer
 * are rendered once, never duplicated per-page.
 *
 *   /        → Home    (hero + search form)
 *   /report  → Report  (profile header + tab ledger)
 *   /about   → About   (static explainer)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import Home   from './pages/Home'
import Report from './pages/Report'
import About  from './pages/About'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index         element={<Home />}    />
          <Route path="report"  element={<Report />}  />
          <Route path="about"   element={<About />}   />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
