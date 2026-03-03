import { NavLink } from 'react-router-dom'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`side-panel-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className={`side-panel${isOpen ? ' open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="side-panel-content">
          {/* Contextual content will go here */}
        </div>
        <div className="side-panel-footer">
          <NavLink
            to="/settings"
            className="side-panel-link"
            onClick={onClose}
          >
            &#9881; Settings
          </NavLink>
        </div>
      </aside>
    </>
  )
}
