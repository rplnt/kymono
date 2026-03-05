import { NavLink } from 'react-router-dom'

interface MenuProps {
  onToggleSidePanel: () => void
  onCloseSidePanel: () => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-menu${isActive ? ' active' : ''}`

export function Menu({ onToggleSidePanel, onCloseSidePanel }: MenuProps) {
  return (
    <nav id="main-menu" role="navigation" aria-label="Main navigation">
      <div className="menu-item">
        <button
          className="btn btn-menu"
          onClick={onToggleSidePanel}
          title="Menu"
          aria-label="Toggle side panel"
        >
          &#9776;
        </button>
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
      <div className="menu-item">
        <NavLink to="/friends" className={navLinkClass} title="Friends" onClick={onCloseSidePanel}>
          F
        </NavLink>
      </div>
    </nav>
  )
}
