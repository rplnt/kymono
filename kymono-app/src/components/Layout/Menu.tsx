import { NavLink } from 'react-router-dom'

interface MenuProps {
  onToggleSidePanel: () => void
  onCloseSidePanel: () => void
  mailCount: number
  repliesCount: number
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-menu${isActive ? ' active' : ''}`

export function Menu({ onToggleSidePanel, onCloseSidePanel, mailCount, repliesCount }: MenuProps) {
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
        <NavLink to="/home" className={navLinkClass} title="Home" onClick={onCloseSidePanel}>
          H
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink
          to="/bookmarks"
          className={navLinkClass}
          title="Bookmarks"
          onClick={onCloseSidePanel}
        >
          B
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink to="/k" className={navLinkClass} title="K" onClick={onCloseSidePanel}>
          K
        </NavLink>
      </div>
      <div className="menu-item menu-item-mail">
        <NavLink to="/mail" className={navLinkClass} title="Mail" onClick={onCloseSidePanel}>
          M
        </NavLink>
        {mailCount > 0 && <span className="menu-badge">{mailCount}</span>}
      </div>
    </nav>
  )
}
