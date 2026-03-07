import { useEffect, useState, useCallback, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useCurrentNode } from '@/contexts'
import { FriendsOnline } from '@/components/FriendsOnline'
import { LatestReplies } from '@/components/LatestReplies'
import { fetchSidebarData } from '@/utils'
import type { OnlineFriend, LatestReply } from '@/types'

const COOLDOWN_MS = 60_000
const LAST_LOADED_KEY = 'kymono.sidebar.lastLoaded'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { currentNode } = useCurrentNode()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/home' || location.pathname === '/bookmarks'
  const isNode = location.pathname.startsWith('/id/')
  const [friends, setFriends] = useState<OnlineFriend[]>([])
  const [replies, setReplies] = useState<LatestReply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFetchedAt = useRef(0)
  const [lastLoadedAt] = useState<string | null>(
    () => localStorage.getItem(LAST_LOADED_KEY)
  )

  const loadSidebar = useCallback(async () => {
    const now = Date.now()
    if (now - lastFetchedAt.current < COOLDOWN_MS) return

    setLoading(true)
    setError(null)
    try {
      const data = await fetchSidebarData()
      setFriends(data.friends)
      setReplies(data.replies)
      lastFetchedAt.current = Date.now()
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
      localStorage.setItem(LAST_LOADED_KEY, timestamp)
    } catch (err) {
      console.error('Failed to load sidebar:', err)
      setError('Failed to load sidebar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && isHome) {
      loadSidebar()
    }
  }, [isOpen, isHome, loadSidebar])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
          {isHome && loading && friends.length === 0 && replies.length === 0 && (
            <div className="sidebar-loading">loading...</div>
          )}

          {isHome && !loading && error && (
            <div className="sidebar-error">{error}</div>
          )}

          {isHome && <LatestReplies replies={replies} lastLoadedAt={lastLoadedAt} />}
          {isHome && <FriendsOnline friends={friends} />}

          {isNode && currentNode && (
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
