import { NavLink, useNavigate } from 'react-router-dom'
import { useCurrentNode } from '@/contexts'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { currentNode } = useCurrentNode()
  const navigate = useNavigate()

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (currentNode?.creatorId) {
      navigate(`/id/${currentNode.creatorId}`)
      onClose()
    }
  }

  const handleAncestorClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    navigate(`/id/${nodeId}`)
    onClose()
  }

  const handleParentClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (currentNode?.parentId) {
      navigate(`/id/${currentNode.parentId}`)
      onClose()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`side-panel-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside className={`side-panel${isOpen ? ' open' : ''}`} aria-hidden={!isOpen}>
        <div className="side-panel-content">
          {currentNode && (
            <div className="side-panel-node">
              {/* Node icon/image */}
              {currentNode.imageUrl && (
                <div className="node-image">
                  <img src={currentNode.imageUrl} alt={currentNode.name} />
                </div>
              )}

              {/* Node name */}
              <div className="node-name">{currentNode.name}</div>

              {/* Author (by:) */}
              <div className="node-meta">
                <span className="node-meta-label">by:</span>
                <a
                  href={`#/id/${currentNode.creatorId}`}
                  className="node-link"
                  onClick={handleAuthorClick}
                >
                  {currentNode.owner}
                </a>
              </div>

              {/* Parent (in:) */}
              {currentNode.parentId && (
                <div className="node-meta">
                  <span className="node-meta-label">in:</span>
                  <a
                    href={`#/id/${currentNode.parentId}`}
                    className="node-link"
                    onClick={handleParentClick}
                  >
                    {currentNode.parentName}
                  </a>
                </div>
              )}

              {/* Created date (at:) */}
              <div className="node-meta">
                <span className="node-meta-label">at:</span>
                <span className="node-meta-value">
                  {currentNode.createdAt.toLocaleDateString('sk-SK', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Edited date (ed:) - always shown when available */}
              {currentNode.updatedAt && (
                <div className="node-meta">
                  <span className="node-meta-label">ed:</span>
                  <span className="node-meta-value">
                    {currentNode.updatedAt.toLocaleDateString('sk-SK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Ancestors (cwbe coordinates) */}
              {currentNode.ancestors.length > 0 && (
                <div className="node-ancestors">
                  <div className="node-ancestors-label">coordinates</div>
                  <div className="node-ancestors-list">
                    {currentNode.ancestors.map((ancestor) => (
                      <a
                        key={ancestor.id}
                        href={`#/id/${ancestor.id}`}
                        className="node-ancestor-link"
                        title={ancestor.id}
                        onClick={(e) => handleAncestorClick(e, ancestor.id)}
                      >
                        <span className="node-ancestor-name">{ancestor.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Karma */}
              {currentNode.karma > 0 && (
                <div className="node-karma">
                  <span className="node-karma-value">{currentNode.karma}</span>
                  <span className="node-karma-icon">K</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="side-panel-footer">
          <NavLink to="/settings" className="side-panel-link" onClick={onClose}>
            &#9881; Settings
          </NavLink>
        </div>
      </aside>
    </>
  )
}
