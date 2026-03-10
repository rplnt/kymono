import { NavLink, useLocation } from 'react-router-dom'

interface MenuProps {
  onToggleSidePanel: () => void
  onCloseSidePanel: () => void
  mailCount: number
  repliesCount: number
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-menu${isActive ? ' active' : ''}`

export function Menu({ onToggleSidePanel, onCloseSidePanel, mailCount, repliesCount }: MenuProps) {
  const location = useLocation()

  const handleClick = (to: string) => (e: React.MouseEvent) => {
    onCloseSidePanel()
    if (location.pathname === to) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.dispatchEvent(new CustomEvent('menu-nav-reset', { detail: to }))
    }
  }
  return (
    <nav id="main-menu" role="navigation" aria-label="Main navigation">
      <div className="menu-item menu-item-sidebar">
        <button
          className="btn btn-menu btn-sidebar"
          onClick={onToggleSidePanel}
          title="Menu"
          aria-label="Toggle side panel"
        >
          <span className="hamburger-icon">☰</span>
        </button>
        {repliesCount > 0 && <span className="menu-badge">{repliesCount}</span>}
      </div>
      <div className="menu-item">
        <NavLink to="/home" className={navLinkClass} title="Home" onClick={handleClick('/home')}>
          H
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink
          to="/bookmarks"
          className={navLinkClass}
          title="Bookmarks"
          onClick={handleClick('/bookmarks')}
        >
          B
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink to="/k" className={navLinkClass} title="K" onClick={handleClick('/k')}>
          K
        </NavLink>
      </div>
      <div className="menu-item menu-item-mail">
        <NavLink to="/mail" className={navLinkClass} title="Mail" onClick={handleClick('/mail')}>
          M
        </NavLink>
        {mailCount > 0 && <span className="menu-badge">{mailCount}</span>}
      </div>
    </nav>
  )
}
