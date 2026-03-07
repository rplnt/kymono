import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { NodeData, NodeComment } from '@/types'
import { useCurrentNode } from '@/contexts'
import { fetchNodeData, getConfigValue } from '@/utils'
import { config, CONFIG_PATHS } from '@/config'

function formatDate(date: Date): string {
  return date.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCommentIndent(level: number): number {
  // 24px (avatar width) per level, halving every 4 levels
  let indent = 0
  let remaining = level
  let increment = 24

  while (remaining > 0) {
    const levelsAtThisIncrement = Math.min(remaining, 4)
    indent += levelsAtThisIncrement * increment
    remaining -= levelsAtThisIncrement
    increment = Math.max(Math.floor(increment / 2), 3)
  }

  return indent
}

function formatRelativeDate(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  if (weeks < 5) return `${weeks}w`
  if (months < 12) return `${months}mo`
  return `${years}y`
}

export function Node() {
  const { nodeId } = useParams<{ nodeId: string }>()
  const navigate = useNavigate()
  const { setCurrentNode } = useCurrentNode()
  const [node, setNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<NodeComment[]>([])
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set())
  const [replyTitle, setReplyTitle] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const showCommentToolbar = getConfigValue(CONFIG_PATHS.COMMENT_TOOLBAR, true)
  const useRelativeTime = getConfigValue(CONFIG_PATHS.RELATIVE_TIME, true)

  const toggleCommentCollapsed = (commentId: string) => {
    setCollapsedComments((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const loadData = useCallback(async () => {
    if (!nodeId) {
      setError('No node ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetchNodeData(nodeId)
      setNode(response.node)
      setComments(response.children)
      setCurrentNode(response.node)
    } catch (err) {
      console.error('Failed to load node:', err)
      setError('Failed to load node')
    } finally {
      setLoading(false)
    }
  }, [nodeId, setCurrentNode])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Clear current node when leaving
  useEffect(() => {
    return () => {
      setCurrentNode(null)
    }
  }, [setCurrentNode])

  // Handle clicks on local links in content
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const anchor = target.closest('a')
    if (!anchor) return

    const href = anchor.getAttribute('href')
    if (!href) return

    // Check for local /id/ links
    const match = href.match(/^\/id\/(\d+)/)
    if (match) {
      e.preventDefault()
      navigate(`/id/${match[1]}`)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-retry" onClick={loadData}>
          Retry
        </button>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="error-container">
        <p className="error-message">Node not found</p>
      </div>
    )
  }

  const externalUrl = `${config.externalBase}/id/${node.id}`

  const scrollToComments = () => {
    const commentsEl = document.querySelector('.node-comments')
    if (commentsEl) {
      const menuHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
      const top = commentsEl.getBoundingClientRect().top + window.scrollY - menuHeight - 8
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className="node-view">
      {/* Node header */}
      <div
        className={`node-header${contentCollapsed ? ' collapsed' : ''}`}
        onClick={() => setContentCollapsed((prev) => !prev)}
      >
        <div className="node-header-row">
          <h1 className="node-title" dangerouslySetInnerHTML={{ __html: node.nameHtml }} />
          {node.karma >= 1 && (
            <span className="node-karma">{node.karma} K</span>
          )}
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="node-external-link"
            title="Open on kyberia.sk"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
        <div className="node-header-row">
          <span className="node-meta">
            <span className="node-meta-label">by</span>
            <a
              className="node-meta-link"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                navigate(`/id/${node.creatorId}`)
              }}
            >
              {node.owner}
            </a>
          </span>
          {node.childrenCount > 0 && (
            <button
              className="node-children-link"
              onClick={(e) => {
                e.stopPropagation()
                scrollToComments()
              }}
            >
              {node.childrenCount} children
            </button>
          )}
        </div>
      </div>

      {/* Node content */}
      {!contentCollapsed && (
        <div className="node-content-box">
          <div
            className="node-content"
            dangerouslySetInnerHTML={{ __html: node.content }}
            onClick={handleContentClick}
          />
        </div>
      )}

      {/* Reply form - always visible when user can write */}
      {node.canWrite && (
        <div className="reply-form">
          <input
            type="text"
            className="reply-title"
            placeholder="Title"
            value={replyTitle}
            onChange={(e) => setReplyTitle(e.target.value)}
          />
          <textarea
            className="reply-content"
            placeholder="Content"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
          />
          <div className="reply-actions">
            <button className="reply-submit">Add</button>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="node-comments">
        {comments.length > 0 ? (
          (() => {
            const minDepth = Math.min(...comments.map((c) => c.depth))
            return comments.map((comment) => {
              // Depths are in increments of 8, normalize to levels
              const level = Math.floor((comment.depth - minDepth) / 8)
              return (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className={`comment${comment.isOrphan ? ' comment-orphan' : ''}`}
                style={{ marginLeft: `${getCommentIndent(level)}px` }}
              >
              <div className="comment-header" onClick={() => toggleCommentCollapsed(comment.id)}>
                {comment.imageUrl ? (
                  <img
                    src={comment.imageUrl}
                    alt=""
                    className="comment-avatar"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/id/${comment.creatorId}`)
                    }}
                  />
                ) : (
                  <div
                    className="comment-avatar comment-avatar-placeholder"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/id/${comment.creatorId}`)
                    }}
                  />
                )}
                <div className="comment-meta">
                  <div className="comment-meta-line">
                    <a
                      className="comment-author"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/id/${comment.creatorId}`)
                      }}
                    >
                      {comment.owner}
                    </a>
                    <span className="comment-date">
                      {useRelativeTime ? formatRelativeDate(comment.createdAt) : formatDate(comment.createdAt)}
                      {comment.updatedAt && (
                        <span className="comment-date-edit">
                          {' '}({useRelativeTime ? formatRelativeDate(comment.updatedAt) : formatDate(comment.updatedAt)})
                        </span>
                      )}
                    </span>
                    {comment.karma > 0 && (
                      <span className="comment-karma">{comment.karma}K</span>
                    )}
                    {(comment.isNew || comment.isOrphan) && <span className="comment-badge comment-new">NEW</span>}
                    {comment.contentChanged && <span className="comment-badge comment-changed">changed</span>}
                    {comment.isHardlink && <span className="comment-badge comment-hardlink">link</span>}
                  </div>
                  <a
                    className="comment-title"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      navigate(`/id/${comment.id}`)
                    }}
                  >
                    {comment.name || `node ${comment.id}`}
                  </a>
                </div>
              </div>
              {!collapsedComments.has(comment.id) && (
                <div className="comment-body">
                  <div
                    className="comment-content"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                    onClick={handleContentClick}
                  />
                </div>
              )}
              {showCommentToolbar && (
                <div className="comment-toolbar">
                  <button
                    className="toolbar-btn"
                    onClick={() => {
                      const el = document.getElementById(`comment-${comment.id}`)
                      if (el) {
                        const menuHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
                        const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                        window.scrollTo({ top, behavior: 'smooth' })
                      }
                    }}
                  >
                    up
                  </button>
                  <span className="toolbar-sep">|</span>
                  <button
                    className="toolbar-btn"
                    onClick={() => {
                      const menuHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
                      // Find next sibling (same depth, same parent)
                      const idx = comments.findIndex((c) => c.id === comment.id)
                      for (let i = idx + 1; i < comments.length; i++) {
                        if (comments[i].depth === comment.depth && comments[i].parentId === comment.parentId) {
                          const el = document.getElementById(`comment-${comments[i].id}`)
                          if (el) {
                            const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                            window.scrollTo({ top, behavior: 'smooth' })
                          }
                          break
                        }
                        if (comments[i].depth < comment.depth) break
                      }
                    }}
                  >
                    next
                  </button>
                </div>
              )}
            </div>
            )})
          })()
        ) : null}
      </div>
    </div>
  )
}
