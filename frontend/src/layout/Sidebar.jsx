import { Link, NavLink } from 'react-router-dom'

const HomeIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[26px] h-[26px] transition-colors" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? "0" : "2"}>
    <path strokeLinecap="round" strokeLinejoin="round" d={active ? "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"} />
  </svg>
)

const AboutIcon = ({ active }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-[26px] h-[26px] transition-colors" fill="currentColor" viewBox="0 0 24 24" stroke="none">
    {/* Custom SVG path combining two figures similar to the user's reference */}
    <circle cx="9" cy="7.5" r="3.5" />
    <circle cx="16" cy="10" r="2.5" />
    <path d="M12.5 13.5c-1.5-1.5-4-1.5-6.5-1-1.5.5-2.5 2-2 4 .5 2 1.5 6.5 1.5 6.5h7V15c0-.5-.2-1-.5-1.5z" />
    <path d="M14 16v7h6.5s1-4 1.5-5.5c.5-1.5-.5-3-2-3.5-1.5-.5-4 1-6 2z" />
  </svg>
)

function NavItem({ to, end, title, Icon }) {
  return (
    <NavLink to={to} end={end} className="flex items-center outline-none h-[64px] group/item w-[240px] relative">
      {({ isActive }) => (
        <>
          {/* Animated Spotlight Glow Effect */}
          <div className={[
            "absolute left-[36px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-pink/25 blur-md pointer-events-none transition-all duration-500",
            isActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
          ].join(' ')} />

          {/* Icon Container */}
          <div className={['relative z-10 w-[72px] flex justify-center items-center transition-all duration-300', isActive ? 'text-pink drop-shadow-[0_0_8px_rgba(227,121,143,0.6)]' : 'text-ink/80 group-hover/item:text-pink'].join(' ')}>
            <Icon active={isActive} />
          </div>
          
          {/* Text Container */}
          <div className="flex-1 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pl-1 relative z-10">
            <span className={[
              'font-app font-bold text-[15px] inline-block transition-all duration-300',
              isActive ? 'bg-pink text-white px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(227,121,143,0.4)]' : 'text-ink/80'
            ].join(' ')}>
              {title}
            </span>
          </div>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <div className="w-[88px] hover:w-[256px] transition-[width] duration-300 ease-out flex-shrink-0 flex flex-col sticky top-0 self-start h-screen py-4 px-2 group z-50 print:hidden">
      <aside className="flex-1 bg-card rounded-[32px] shadow-sm flex flex-col justify-center overflow-hidden border border-ink/5 w-full transition-all duration-300 relative">

        {/* Nav Items - Centered vertically */}
        <nav className="flex-col flex w-[240px]" aria-label="Sidebar navigation">
          <NavItem to="/" end title="Home" Icon={HomeIcon} />
          
          <NavItem to="/about" title="About Us" Icon={AboutIcon} />
        </nav>

      </aside>
    </div>
  )
}
