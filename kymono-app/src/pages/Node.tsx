import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { NodeData, NodeComment } from '@/types'
import { useCurrentNode, useConfigValue } from '@/contexts'
import { fetchNodeData, formatDate, formatRelativeDate } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { config, CONFIG_PATHS } from '@/config'

// Cycles: relative → full created → full edited → relative (if edited)
//         relative → full created → relative (if not edited)
function Timestamp({
  createdAt,
  updatedAt,
  fullTimestamps,
}: {
  createdAt: Date
  updatedAt: Date | null
  fullTimestamps: boolean
}) {
  // 0 = default (uses fullTimestamps setting), 1 = full created, 2 = full edited
  const [mode, setMode] = useState(0)

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mode === 0) {
      setMode(fullTimestamps ? (updatedAt ? 2 : 0) : 1)
    } else if (mode === 1) {
      setMode(updatedAt ? 2 : 0)
    } else {
      setMode(0)
    }
  }

  const showFull = mode === 1 || mode === 2 || (mode === 0 && fullTimestamps)
  const showEdited = mode === 2
  const date = showEdited && updatedAt ? updatedAt : createdAt

  return (
    <span className="comment-date comment-date-clickable" onClick={cycle}>
      {showFull ? formatDate(date) : formatRelativeDate(createdAt)}
      {showFull && updatedAt && <span className="comment-date-edited">*</span>}
    </span>
  )
}

function getCommentIndent(level: number): number {
  // Logarithmic indent: each level adds less than the previous
  // e.g. 24, 20, 16, 13, 11, 9, 8, 7, 6, 5, 4, 4, 3, 3, 3...
  let indent = 0
  for (let i = 0; i < level; i++) {
    indent += Math.max(Math.round(24 * Math.pow(0.82, i)), 3)
  }
  return indent
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
  const [showCommentToolbar] = useConfigValue(CONFIG_PATHS.COMMENT_TOOLBAR, true)
  const [fullTimestamps] = useConfigValue(CONFIG_PATHS.FULL_TIMESTAMPS, true)
  const [progressiveComments] = useConfigValue(CONFIG_PATHS.NODE_PROGRESSIVE_COMMENTS, false)
  const [autoLoadCommentsOnScroll] = useConfigValue(
    CONFIG_PATHS.NODE_AUTO_LOAD_COMMENTS_SCROLL,
    false
  )
  const [visibleBatches, setVisibleBatches] = useState(1)

  useTitle(node?.name)

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

    setNode(null)
    setComments([])
    setCollapsedComments(new Set())
    setLoading(true)
    setError(null)
    try {
      const response = await fetchNodeData(nodeId)
      setNode(response.node)
      setComments(response.children)
      setCurrentNode(response.node)
      setContentCollapsed(response.node.templateId === '21')
    } catch (err) {
      console.error('Failed to load node:', err)
      setError(err instanceof Error ? err.message : 'Failed to load node')
    } finally {
      setLoading(false)
    }
  }, [nodeId, setCurrentNode])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset visible batches when comments change
  useEffect(() => {
    setVisibleBatches(1)
  }, [comments])

  // Auto-load comments on scroll
  useEffect(() => {
    if (!progressiveComments || !autoLoadCommentsOnScroll || comments.length === 0) return
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleBatches((prev) => prev + 1)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [progressiveComments, autoLoadCommentsOnScroll, comments.length])

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
      const menuHeight =
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
      const top = commentsEl.getBoundingClientRect().top + window.scrollY - menuHeight - 8
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <div className="node-view">
      {node.parentId && (
        <div className="node-parent-ref">
          <span className="node-parent-in">in </span>
          <a
            href={`#/id/${node.parentId}`}
            className="node-parent-link"
            onClick={(e) => {
              e.preventDefault()
              navigate(`/id/${node.parentId}`)
            }}
          >
            {node.parentName || `node ${node.parentId}`}
          </a>
        </div>
      )}
      {node.templateId === '4' ? (
        /* Submission: render like a comment */
        <div className="comment node-as-comment">
          <div className="comment-header" onClick={() => setContentCollapsed((prev) => !prev)}>
            {node.creatorImageUrl ? (
              <img
                src={node.creatorImageUrl}
                alt=""
                className="comment-avatar"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/id/${node.creatorId}`)
                }}
              />
            ) : (
              <div
                className="comment-avatar comment-avatar-placeholder"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/id/${node.creatorId}`)
                }}
              />
            )}
            <div className="comment-meta">
              <div className="comment-meta-line">
                <a
                  href={`#/id/${node.creatorId}`}
                  className="comment-author"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    navigate(`/id/${node.creatorId}`)
                  }}
                >
                  {node.owner}
                </a>
                <Timestamp
                  createdAt={node.createdAt}
                  updatedAt={node.updatedAt}
                  fullTimestamps={fullTimestamps}
                />
                {node.karma >= 1 && <span className="comment-karma">{node.karma}K</span>}
              </div>
              <div className="comment-meta-line">
                <span className="comment-title">{node.name || `node ${node.id}`}</span>
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
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="node-external-link"
              title="Open on kyberia.sk"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
          {!contentCollapsed && (
            <div className="comment-body">
              <div
                className="comment-content"
                dangerouslySetInnerHTML={{ __html: node.content }}
                onClick={handleContentClick}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Node header */}
          <div
            className={`node-header${contentCollapsed ? ' collapsed' : ''}`}
            onClick={() => setContentCollapsed((prev) => !prev)}
          >
            <div className="node-header-row">
              <h1 className="node-title" dangerouslySetInnerHTML={{ __html: node.nameHtml }} />
              {node.karma >= 1 && node.templateId !== '2' && node.templateId !== '3' && (
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
                  href={`#/id/${node.creatorId}`}
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
              {node.templateId === '14' ? (
                <pre className="node-content node-content-mono">{node.content}</pre>
              ) : (
                <div
                  className="node-content"
                  dangerouslySetInnerHTML={{ __html: node.content }}
                  onClick={handleContentClick}
                />
              )}
            </div>
          )}
        </>
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
            disabled
          />
          <textarea
            className="reply-content"
            placeholder="Content"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            disabled
          />
          <div className="reply-actions">
            <button className="reply-submit" disabled>
              Add
            </button>
          </div>
        </div>
      )}

      {/* Comments section */}
      <div className="node-comments">
        {comments.length > 0 && (node.templateId === '2' || node.templateId === '14')
          ? comments.map((child) => (
              <div key={child.id} className="node-child-item">
                <a
                  href={`#/id/${child.id}`}
                  className="node-child-name"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/id/${child.id}`)
                  }}
                >
                  {child.name || `node ${child.id}`}
                </a>
                {child.childrenCount > 0 && (
                  <span className="node-child-children">{child.childrenCount}</span>
                )}
                {child.karma > 0 && <span className="node-child-karma">{child.karma}K</span>}
                <a
                  href={`#/id/${child.creatorId}`}
                  className="node-child-author"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/id/${child.creatorId}`)
                  }}
                >
                  {child.owner}
                </a>
              </div>
            ))
          : comments.length > 0
            ? (() => {
                const minDepth = Math.min(...comments.map((c) => c.depth))

                // Find top-level comment indices (level === 0)
                const topLevelIndices: number[] = []
                comments.forEach((c, i) => {
                  if (c.depth === minDepth) topLevelIndices.push(i)
                })

                // Determine which comments to display
                let displayComments = comments
                let remainingBatches = 0
                let nextBatchSize = 0
                if (progressiveComments && topLevelIndices.length > 0) {
                  const cutoffBatch = Math.min(visibleBatches, topLevelIndices.length)
                  remainingBatches = topLevelIndices.length - cutoffBatch
                  if (cutoffBatch < topLevelIndices.length) {
                    displayComments = comments.slice(0, topLevelIndices[cutoffBatch])
                    const nextEnd =
                      cutoffBatch + 1 < topLevelIndices.length
                        ? topLevelIndices[cutoffBatch + 1]
                        : comments.length
                    nextBatchSize = nextEnd - topLevelIndices[cutoffBatch]
                  }
                }

                return (
                  <>
                    {displayComments.map((comment) => {
                      // Depths are in increments of 8, normalize to levels
                      const level = Math.floor((comment.depth - minDepth) / 8)
                      return (
                        <div
                          key={comment.id}
                          id={`comment-${comment.id}`}
                          className={`comment${comment.isOrphan ? ' comment-orphan' : ''}`}
                          style={{ marginLeft: `${getCommentIndent(level)}px` }}
                        >
                          <div
                            className="comment-header"
                            onClick={() => toggleCommentCollapsed(comment.id)}
                          >
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
                                  href={`#/id/${comment.creatorId}`}
                                  className="comment-author"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    navigate(`/id/${comment.creatorId}`)
                                  }}
                                >
                                  {comment.owner}
                                </a>
                                <Timestamp
                                  createdAt={comment.createdAt}
                                  updatedAt={comment.updatedAt}
                                  fullTimestamps={fullTimestamps}
                                />
                                {comment.karma > 0 && (
                                  <span className="comment-karma">{comment.karma}K</span>
                                )}
                                {(comment.isNew || comment.isOrphan) && (
                                  <span className="comment-badge comment-new">NEW</span>
                                )}
                                {comment.contentChanged && (
                                  <span className="comment-badge comment-changed">changed</span>
                                )}
                                {comment.isHardlink && (
                                  <span className="comment-badge comment-hardlink">link</span>
                                )}
                              </div>
                              <a
                                href={`#/id/${comment.id}`}
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
                          {showCommentToolbar &&
                            (() => {
                              const idx = displayComments.findIndex((c) => c.id === comment.id)
                              const findSibling = (dir: 'prev' | 'next') => {
                                if (dir === 'next') {
                                  for (let i = idx + 1; i < displayComments.length; i++) {
                                    if (
                                      displayComments[i].depth === comment.depth &&
                                      displayComments[i].parentId === comment.parentId
                                    )
                                      return displayComments[i].id
                                    if (displayComments[i].depth < comment.depth) break
                                  }
                                } else {
                                  for (let i = idx - 1; i >= 0; i--) {
                                    if (
                                      displayComments[i].depth === comment.depth &&
                                      displayComments[i].parentId === comment.parentId
                                    )
                                      return displayComments[i].id
                                    if (displayComments[i].depth < comment.depth) break
                                  }
                                }
                                return null
                              }
                              const prevId = findSibling('prev')
                              const nextId = findSibling('next')
                              const scrollTo = (elId: string) => {
                                const menuHeight =
                                  parseInt(
                                    getComputedStyle(document.documentElement).getPropertyValue(
                                      '--menu-height'
                                    )
                                  ) || 56
                                const el = document.getElementById(`comment-${elId}`)
                                if (el) {
                                  const top =
                                    el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                                  window.scrollTo({ top, behavior: 'smooth' })
                                }
                              }
                              return (
                                <div className="comment-toolbar">
                                  <button
                                    className="toolbar-btn"
                                    disabled={!prevId}
                                    onClick={() => prevId && scrollTo(prevId)}
                                  >
                                    prev
                                  </button>
                                  <span className="toolbar-sep">|</span>
                                  <button
                                    className="toolbar-btn"
                                    onClick={() => scrollTo(comment.id)}
                                  >
                                    up
                                  </button>
                                  <span className="toolbar-sep">|</span>
                                  <button
                                    className="toolbar-btn"
                                    disabled={!nextId}
                                    onClick={() => nextId && scrollTo(nextId)}
                                  >
                                    next
                                  </button>
                                </div>
                              )
                            })()}
                        </div>
                      )
                    })}
                    {progressiveComments && remainingBatches > 0 && (
                      <button
                        className="btn btn-show-more"
                        onClick={() => setVisibleBatches((prev) => prev + 1)}
                      >
                        display next {nextBatchSize} ({remainingBatches} remaining)
                      </button>
                    )}
                  </>
                )
              })()
            : null}
      </div>
    </div>
  )
}
