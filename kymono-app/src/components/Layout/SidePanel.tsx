import { useEffect, useState, useCallback } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useCurrentNode } from '@/contexts'
import { config } from '@/config'
import { FriendsOnline } from '@/components/FriendsOnline'
import { PeopleList } from '@/components/PeopleList'
import { LatestReplies } from '@/components/LatestReplies'
import { fetchRepliesData, toggleBookmark, getRequestCount } from '@/utils'
import type { LatestReply } from '@/types'

import { SIDEBAR_LOADED_KEY as LAST_LOADED_KEY } from '@/utils/configStorage'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
  onRepliesShown?: () => void
}

export function SidePanel({ isOpen, onClose, onRepliesShown }: SidePanelProps) {
  const { currentNode, anticsrf } = useCurrentNode()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome =
    location.pathname === '/' ||
    location.pathname === '/home' ||
    location.pathname === '/bookmarks' ||
    location.pathname === '/k' ||
    location.pathname === '/mail'
  const isNode = location.pathname.startsWith('/id/')
  const [replies, setReplies] = useState<LatestReply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(() =>
    localStorage.getItem(LAST_LOADED_KEY)
  )
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)

  const loadSidebar = useCallback(
    async (force = false) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchRepliesData(force)
        setReplies(data)
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
        localStorage.setItem(LAST_LOADED_KEY, timestamp)
        setLastLoadedAt(timestamp)
        onRepliesShown?.()
      } catch (err) {
        console.error('Failed to load sidebar:', err)
        setError('nincsen')
      } finally {
        setLoading(false)
      }
    },
    [onRepliesShown]
  )

  useEffect(() => {
    if (currentNode) {
      setIsBookmarked(currentNode.bookmarked)
      setBookmarking(false)
    }
  }, [currentNode])

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

  const handleToggleBookmark = async () => {
    if (bookmarking || !currentNode) return
    setBookmarking(true)
    try {
      const newState = await toggleBookmark(currentNode.id, isBookmarked, anticsrf)
      setIsBookmarked(newState)
    } catch {
      // user can retry by clicking again
    } finally {
      setBookmarking(false)
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
          {isHome && loading && replies.length === 0 && (
            <div className="sidebar-loading">loading...</div>
          )}

          {isHome && !loading && error && <div className="sidebar-error">{error}</div>}

          {isNode && currentNode && (
            <div className="side-panel-node">
              {/* Node icon/image */}
              {currentNode.nodeImageUrl && (
                <div className="node-image">
                  <img src={currentNode.nodeImageUrl} alt={currentNode.name} />
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
                    {(() => {
                      // Decreasing indent per level: each step smaller than previous
                      const getIndent = (index: number) => {
                        let indent = 0
                        for (let j = 0; j < index; j++) {
                          indent += Math.max(Math.round(7 * Math.pow(0.93, j)), 2)
                        }
                        return indent
                      }
                      return currentNode.ancestors.map((ancestor, i) => (
                        <a
                          key={ancestor.id}
                          href={`#/id/${ancestor.id}`}
                          className="node-ancestor-link"
                          style={{ marginLeft: `${getIndent(i)}px` }}
                          title={ancestor.id}
                          onClick={(e) => handleAncestorClick(e, ancestor.id)}
                        >
                          <span className="node-ancestor-name">{ancestor.name}</span>
                        </a>
                      ))
                    })()}
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

              {/* Visits */}
              {currentNode.views > 0 && (
                <div className="node-visits">{currentNode.views.toLocaleString()} visits</div>
              )}

              {/* Bookmark */}
              <button
                className="sidebar-book-btn"
                onClick={handleToggleBookmark}
                disabled={bookmarking}
              >
                {isBookmarked ? 'unbook' : 'book'}
              </button>
            </div>
          )}

          {isHome && (
            <LatestReplies replies={replies} lastLoadedAt={lastLoadedAt} onNavigate={onClose} />
          )}
          {isHome && <FriendsOnline onNavigate={onClose} />}
          {isHome && <PeopleList onNavigate={onClose} />}
        </div>
        <div className="side-panel-footer">
          <NavLink to="/settings" className="side-panel-link" onClick={onClose}>
            &#9881; Settings
          </NavLink>
          <div className="side-panel-version">
            {config.version} | {getRequestCount()} req
          </div>
        </div>
      </aside>
    </>
  )
}
