import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { NodeData, NodeComment } from '@/types'
import { useCurrentNode, useConfigValue, useFriends, useUser } from '@/contexts'
import { fetchNodeData, submitComment, giveKarma, scrollToElement } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { config, CONFIG_PATHS } from '@/config'
import { ExternalLinkIcon } from '@/components/ExternalLinkIcon'
import { Timestamp } from '@/components/Timestamp'

function getCommentIndent(level: number): number {
  // Logarithmic indent: each level adds less than the previous
  // e.g. 24, 20, 16, 13, 11, 9, 8, 7, 6, 5, 4, 4, 3, 3, 3...
  let indent = 0
  for (let i = 0; i < level; i++) {
    indent += Math.max(Math.round(24 * Math.pow(0.82, i)), 3)
  }
  return indent
}

const CommentContent = memo(function CommentContent({
  html,
  onClick,
}: {
  html: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <div className="comment-content" dangerouslySetInnerHTML={{ __html: html }} onClick={onClick} />
  )
})

export function Node() {
  const { nodeId } = useParams<{ nodeId: string }>()
  const navigate = useNavigate()
  const { setCurrentNode, anticsrf, setAnticsrf } = useCurrentNode()
  const { isFriend } = useFriends()
  const { userId } = useUser()
  const [node, setNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<NodeComment[]>([])
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [collapsedComments, setCollapsedComments] = useState<Map<string, 'body' | 'subtree'>>(
    new Map()
  )
  const [replyTitle, setReplyTitle] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPosRef = useRef<number | null>(null)
  const [insertModal, setInsertModal] = useState<'link' | 'image' | null>(null)
  const [modalUrl, setModalUrl] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [modalWidth, setModalWidth] = useState('')
  const [showCommentToolbar] = useConfigValue<boolean>(CONFIG_PATHS.COMMENT_TOOLBAR)
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)
  const [progressiveComments] = useConfigValue<boolean>(CONFIG_PATHS.NODE_PROGRESSIVE_COMMENTS)
  const [autoLoadCommentsOnScroll] = useConfigValue<boolean>(
    CONFIG_PATHS.NODE_AUTO_LOAD_COMMENTS_SCROLL
  )
  const [hideTopic] = useConfigValue<boolean>(CONFIG_PATHS.NODE_HIDE_TOPIC)
  const [visibleBatches, setVisibleBatches] = useState(1)
  const [childFilter, setChildFilter] = useState('')
  const [nodeKState, setNodeKState] = useState<
    'idle' | 'sending' | 'ok' | 'error' | 'nehul' | 'neda-sa'
  >('idle')
  const [commentKStates, setCommentKStates] = useState<
    Map<string, 'idle' | 'sending' | 'ok' | 'error' | 'nehul' | 'neda-sa'>
  >(new Map())

  useTitle(node?.name)

  const toggleCommentCollapsed = (commentId: string, hasChildren: boolean) => {
    setCollapsedComments((prev) => {
      const next = new Map(prev)
      const current = next.get(commentId)
      if (current === undefined) {
        next.set(commentId, 'body')
      } else if (current === 'body' && hasChildren) {
        next.set(commentId, 'subtree')
      } else {
        next.delete(commentId)
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
    setCollapsedComments(new Map())
    setLoading(true)
    setError(null)
    setReplyTitle('')
    setReplyContent('')
    setReplyError(null)
    setNodeKState('idle')
    setCommentKStates(new Map())
    try {
      const response = await fetchNodeData(nodeId)
      setNode(response.node)
      setComments(response.children)
      setCurrentNode(response.node)
      setAnticsrf(response.anticsrf)
    } catch (err) {
      console.error('Failed to load node:', err)
      setError(err instanceof Error ? err.message : 'Failed to load node')
    } finally {
      setLoading(false)
    }
  }, [nodeId, setCurrentNode, setAnticsrf])

  useEffect(() => {
    window.scrollTo(0, 0)
    loadData()
  }, [loadData])

  // Set initial content collapsed state based on template and hideTopic setting
  useEffect(() => {
    if (node) {
      const tid = node.templateId
      setContentCollapsed(tid === '21' || (hideTopic && tid !== '4'))
    }
  }, [node, hideTopic])

  // Reset visible batches when comments change
  useEffect(() => {
    setVisibleBatches(1)
  }, [comments])

  const minDepth = useMemo(
    () =>
      comments.length > 0
        ? comments.reduce((min, c) => (c.depth < min ? c.depth : min), comments[0].depth)
        : 0,
    [comments]
  )

  const topLevelCount = useMemo(
    () => comments.filter((c) => c.depth === minDepth).length,
    [comments, minDepth]
  )

  // Auto-load comments on scroll
  useEffect(() => {
    if (!progressiveComments || !autoLoadCommentsOnScroll || comments.length === 0) return
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleBatches((prev) => (prev < topLevelCount ? prev + 1 : prev))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [progressiveComments, autoLoadCommentsOnScroll, comments, topLevelCount])

  // Fill screen on initial load when content is short
  useEffect(() => {
    if (!progressiveComments || !autoLoadCommentsOnScroll || comments.length === 0) return
    const raf = requestAnimationFrame(() => {
      if (window.innerHeight >= document.body.offsetHeight - 100) {
        setVisibleBatches((prev) => (prev < topLevelCount ? prev + 1 : prev))
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [progressiveComments, autoLoadCommentsOnScroll, comments, visibleBatches, topLevelCount])

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (!replyContent.trim()) return
    if (!anticsrf) {
      setReplyError('Missing CSRF token. Try reloading.')
      return
    }
    if (!nodeId) return

    submittingRef.current = true
    setSubmitting(true)
    setReplyError(null)
    try {
      await submitComment(nodeId, replyTitle, replyContent, anticsrf)
      setReplyTitle('')
      setReplyContent('')
      await loadData()
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to submit comment')
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  const openInsertModal = (type: 'link' | 'image') => {
    cursorPosRef.current = textareaRef.current?.selectionStart ?? null
    setModalUrl('')
    setModalTitle('')
    setModalWidth('')
    setInsertModal(type)
  }

  const handleInsert = () => {
    if (!modalUrl.trim()) return
    const widthAttr = modalWidth.trim() ? ` width="${modalWidth.trim()}"` : ''
    const html =
      insertModal === 'image'
        ? `<img src="${modalUrl.trim()}"${widthAttr}>`
        : `<a href="${modalUrl.trim()}">${modalTitle.trim() || modalUrl.trim()}</a>`

    const pos = cursorPosRef.current ?? replyContent.length
    const before = replyContent.slice(0, pos)
    const after = replyContent.slice(pos)
    setReplyContent(before + html + after)
    setInsertModal(null)
  }

  // Clear current node when leaving
  useEffect(() => {
    return () => {
      setCurrentNode(null)
    }
  }, [setCurrentNode])

  const handleGiveNodeK = async () => {
    if (nodeKState !== 'idle' || !node) return
    setNodeKState('sending')
    try {
      const result = await giveKarma(node.id, anticsrf)
      setNodeKState(result)
      if (result === 'ok') {
        setNode((prev) => prev && { ...prev, karma: prev.karma + 1 })
      }
    } catch {
      setNodeKState('error')
    }
  }

  const handleGiveCommentK = async (commentId: string) => {
    const state = commentKStates.get(commentId) || 'idle'
    if (state !== 'idle') return
    setCommentKStates((prev) => new Map(prev).set(commentId, 'sending'))
    try {
      const result = await giveKarma(commentId, anticsrf)
      setCommentKStates((prev) => new Map(prev).set(commentId, result))
      if (result === 'ok') {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, karma: c.karma + 1 } : c))
        )
      }
    } catch {
      setCommentKStates((prev) => new Map(prev).set(commentId, 'error'))
    }
  }

  // Handle clicks on local links in content
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [navigate]
  )

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
    if (commentsEl) scrollToElement(commentsEl)
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
                  className={`comment-author${node.creatorId === userId ? ' is-self' : isFriend(node.creatorId) ? ' is-friend' : ''}`}
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
              <ExternalLinkIcon />
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
          <div className="give-k-wrap">
            {node.givenK || nodeKState === 'ok' ? (
              <span className="give-k-given">k given</span>
            ) : nodeKState === 'nehul' ? (
              <span className="give-k-err">nehul</span>
            ) : nodeKState === 'neda-sa' ? (
              <span className="give-k-err">neda sa</span>
            ) : nodeKState === 'error' ? (
              <span className="give-k-err">err</span>
            ) : (
              <button
                className="give-k-btn"
                onClick={handleGiveNodeK}
                disabled={nodeKState === 'sending'}
              >
                give k
              </button>
            )}
          </div>
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
                <ExternalLinkIcon />
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
          <div className="give-k-wrap">
            {node.givenK || nodeKState === 'ok' ? (
              <span className="give-k-given">k given</span>
            ) : nodeKState === 'nehul' ? (
              <span className="give-k-err">nehul</span>
            ) : nodeKState === 'neda-sa' ? (
              <span className="give-k-err">neda sa</span>
            ) : nodeKState === 'error' ? (
              <span className="give-k-err">err</span>
            ) : (
              <button
                className="give-k-btn"
                onClick={handleGiveNodeK}
                disabled={nodeKState === 'sending'}
              >
                give k
              </button>
            )}
          </div>
        </>
      )}

      {/* Reply form - hidden for list templates (2, 14) */}
      {node.templateId !== '2' && node.templateId !== '14' && !node.canWrite && (
        <p className="node-readonly">prava nie sa</p>
      )}

      {node.templateId !== '2' && node.templateId !== '14' && node.canWrite && (
        <div className="reply-form">
          <input
            type="text"
            className="reply-title"
            placeholder="Title"
            value={replyTitle}
            onChange={(e) => setReplyTitle(e.target.value)}
            disabled={submitting}
            autoComplete="off"
            autoCorrect="off"
          />
          <textarea
            ref={textareaRef}
            className="reply-content"
            placeholder="Content"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            disabled={submitting}
            autoComplete="off"
            autoCorrect="off"
          />
          {replyError && <p className="reply-error">{replyError}</p>}
          <div className="reply-actions">
            <button
              className="reply-submit"
              disabled={submitting || !replyContent.trim()}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : 'Add'}
            </button>
            <div className="reply-toolbar">
              <button
                className="reply-toolbar-btn"
                title="Insert link"
                disabled={submitting}
                onClick={() => openInsertModal('link')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
              <button
                className="reply-toolbar-btn"
                title="Insert image"
                disabled={submitting}
                onClick={() => openInsertModal('image')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
            </div>
          </div>
          {insertModal && (
            <div className="insert-modal-backdrop" onClick={() => setInsertModal(null)}>
              <div className="insert-modal" onClick={(e) => e.stopPropagation()}>
                <div className="insert-modal-title">Insert {insertModal}</div>
                <input
                  type="url"
                  className="insert-modal-input"
                  placeholder="URL"
                  value={modalUrl}
                  onChange={(e) => setModalUrl(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInsert()
                  }}
                />
                {insertModal === 'link' && (
                  <input
                    type="text"
                    className="insert-modal-input"
                    placeholder="Title (optional)"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInsert()
                    }}
                  />
                )}
                {insertModal === 'image' && (
                  <input
                    type="number"
                    className="insert-modal-input"
                    placeholder="Width (optional, e.g. 300)"
                    value={modalWidth}
                    onChange={(e) => setModalWidth(e.target.value)}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInsert()
                    }}
                  />
                )}
                <div className="insert-modal-actions">
                  <button
                    className="reply-submit"
                    disabled={!modalUrl.trim()}
                    onClick={handleInsert}
                  >
                    Insert
                  </button>
                  <button className="reply-submit" onClick={() => setInsertModal(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comments section */}
      <div className="node-comments">
        {comments.length > 0 && (node.templateId === '2' || node.templateId === '14')
          ? (() => {
              const sorted = [...comments].sort((a, b) => a.name.localeCompare(b.name))
              const filtered = childFilter
                ? sorted.filter((c) => c.name.toLowerCase().includes(childFilter.toLowerCase()))
                : sorted
              return (
                <>
                  <input
                    type="search"
                    className="child-filter"
                    placeholder="Filter..."
                    value={childFilter}
                    onChange={(e) => setChildFilter(e.target.value)}
                    autoComplete="off"
                  />
                  {filtered.map((child) => (
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
                  ))}
                </>
              )
            })()
          : comments.length > 0
            ? (() => {
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

                let skipBelowDepth: number | null = null
                let skipParentId: string | null = null
                const visibleComments: NodeComment[] = []
                const hiddenCounts = new Map<string, number>()
                for (const comment of displayComments) {
                  if (skipBelowDepth !== null && comment.depth > skipBelowDepth) {
                    hiddenCounts.set(skipParentId!, (hiddenCounts.get(skipParentId!) || 0) + 1)
                    continue
                  }
                  if (collapsedComments.get(comment.id) === 'subtree') {
                    skipBelowDepth = comment.depth
                    skipParentId = comment.id
                  } else {
                    skipBelowDepth = null
                    skipParentId = null
                  }
                  visibleComments.push(comment)
                }

                return (
                  <>
                    {visibleComments.map((comment) => {
                      // Depths are in increments of 8, normalize to levels
                      const level = Math.floor((comment.depth - minDepth) / 8)
                      const hiddenCount = hiddenCounts.get(comment.id)
                      return (
                        <div key={comment.id}>
                          <div
                            id={`comment-${comment.id}`}
                            className={`comment${comment.isOrphan ? ' comment-orphan' : ''}`}
                            style={{ marginLeft: `${getCommentIndent(level)}px` }}
                          >
                            <div
                              className="comment-header"
                              onClick={() =>
                                toggleCommentCollapsed(comment.id, comment.childrenCount > 0)
                              }
                            >
                              {comment.creatorImageUrl ? (
                                <img
                                  src={comment.creatorImageUrl}
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
                                    className={`comment-author${comment.creatorId === userId ? ' is-self' : isFriend(comment.creatorId) ? ' is-friend' : ''}`}
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
                                  {comment.contentChanged &&
                                    !comment.isNew &&
                                    !comment.isOrphan && (
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
                            {!collapsedComments.get(comment.id) && (
                              <div className="comment-body">
                                <CommentContent
                                  html={comment.content}
                                  onClick={handleContentClick}
                                />
                              </div>
                            )}
                            {(() => {
                              const kS = commentKStates.get(comment.id) || 'idle'
                              const kBtn =
                                comment.givenK || kS === 'ok' ? (
                                  <span className="give-k-given">k given</span>
                                ) : kS === 'nehul' ? (
                                  <span className="give-k-err">nehul</span>
                                ) : kS === 'neda-sa' ? (
                                  <span className="give-k-err">neda sa</span>
                                ) : kS === 'error' ? (
                                  <span className="give-k-err">err</span>
                                ) : (
                                  <button
                                    className="give-k-btn"
                                    onClick={() => handleGiveCommentK(comment.id)}
                                    disabled={kS === 'sending'}
                                  >
                                    give k
                                  </button>
                                )

                              if (!showCommentToolbar) {
                                return (
                                  <div className="comment-toolbar">
                                    <span className="toolbar-k-right">{kBtn}</span>
                                  </div>
                                )
                              }

                              const idx = visibleComments.findIndex((c) => c.id === comment.id)
                              const findSibling = (dir: 'prev' | 'next') => {
                                if (dir === 'next') {
                                  for (let i = idx + 1; i < visibleComments.length; i++) {
                                    if (
                                      visibleComments[i].depth === comment.depth &&
                                      visibleComments[i].parentId === comment.parentId
                                    )
                                      return visibleComments[i].id
                                    if (visibleComments[i].depth < comment.depth) break
                                  }
                                } else {
                                  for (let i = idx - 1; i >= 0; i--) {
                                    if (
                                      visibleComments[i].depth === comment.depth &&
                                      visibleComments[i].parentId === comment.parentId
                                    )
                                      return visibleComments[i].id
                                    if (visibleComments[i].depth < comment.depth) break
                                  }
                                }
                                return null
                              }
                              const prevId =
                                findSibling('prev') ||
                                (idx > 0 ? visibleComments[idx - 1].id : null)
                              const nextId = findSibling('next')
                              const scrollTo = (elId: string) => {
                                const el = document.getElementById(`comment-${elId}`)
                                if (el) scrollToElement(el)
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
                                  <span className="toolbar-k-right">{kBtn}</span>
                                </div>
                              )
                            })()}
                          </div>
                          {hiddenCount && (
                            <div
                              className="hidden-subtree-indicator"
                              style={{ marginLeft: `${getCommentIndent(level + 1)}px` }}
                            >
                              {hiddenCount} {hiddenCount === 1 ? 'child' : 'children'} hidden
                            </div>
                          )}
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
