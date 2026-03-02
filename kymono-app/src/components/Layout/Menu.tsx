import { NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-menu${isActive ? ' active' : ''}`

export function Menu() {
  return (
    <nav id="main-menu" role="navigation" aria-label="Main navigation">
      <div className="menu-item">
        <NavLink to="/home" className={navLinkClass} title="Home">
          H
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink to="/bookmarks" className={navLinkClass} title="Bookmarks">
          B
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink to="/mail" className={navLinkClass} title="Mail">
          M
        </NavLink>
      </div>
      <div className="menu-item">
        <NavLink to="/k" className={navLinkClass} title="K">
          K
        </NavLink>
      </div>
      <div className="main-menu-right">
        <div className="menu-item">
          <NavLink to="/settings" className={navLinkClass} title="Settings">
            &#9881;
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
