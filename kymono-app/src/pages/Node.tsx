import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { NodeData, NodeComment } from '@/types'
import { useCurrentNode, useConfigValue } from '@/contexts'
import { fetchNodeData, scrollToElement, recordVisit, toggleStar, isStarred } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { CONFIG_PATHS } from '@/config'
import { ChildList } from '@/components/ChildList'
import { Comment, getCommentIndent } from '@/components/Comment'
import { NodeHeader } from '@/components/NodeHeader'
import { ReplyForm } from '@/components/ReplyForm'

export function Node() {
  const { nodeId } = useParams<{ nodeId: string }>()
  const { setCurrentNode, anticsrf, setAnticsrf } = useCurrentNode()
  const [node, setNode] = useState<NodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<NodeComment[]>([])
  const [contentCollapsed, setContentCollapsed] = useState(false)
  const [collapsedComments, setCollapsedComments] = useState<Map<string, 'body' | 'subtree'>>(
    new Map()
  )
  const [progressiveComments] = useConfigValue<boolean>(CONFIG_PATHS.NODE_PROGRESSIVE_COMMENTS)
  const [autoLoadCommentsOnScroll] = useConfigValue<boolean>(
    CONFIG_PATHS.NODE_AUTO_LOAD_COMMENTS_SCROLL
  )
  const [hideTopic] = useConfigValue<boolean>(CONFIG_PATHS.NODE_HIDE_TOPIC)
  const [visibleBatches, setVisibleBatches] = useState(1)
  const [starred, setStarred] = useState(false)

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
    try {
      const response = await fetchNodeData(nodeId)
      setNode(response.node)
      setComments(response.children)
      setCurrentNode(response.node)
      setAnticsrf(response.anticsrf)
      recordVisit(nodeId, response.node.name)
      setStarred(isStarred(nodeId))
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

  // Clear current node when leaving
  useEffect(() => {
    return () => {
      setCurrentNode(null)
    }
  }, [setCurrentNode])

  const scrollToComments = () => {
    const commentsEl = document.querySelector('.node-comments')
    if (commentsEl) scrollToElement(commentsEl)
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

  return (
    <div className="node-view">
      <NodeHeader
        node={node}
        contentCollapsed={contentCollapsed}
        onToggleContentCollapsed={() => setContentCollapsed((prev) => !prev)}
        starred={starred}
        onToggleStar={() => setStarred(toggleStar(node.id, node.name))}
        onScrollToComments={scrollToComments}
      />

      {/* Reply form - hidden for list templates (2, 14) */}
      {node.templateId !== '2' && node.templateId !== '14' && !node.canWrite && (
        <p className="node-readonly">prava nie sa</p>
      )}

      {node.templateId !== '2' && node.templateId !== '14' && node.canWrite && nodeId && (
        <ReplyForm nodeId={nodeId} anticsrf={anticsrf} onSubmitted={loadData} />
      )}

      {/* Comments section */}
      <div className="node-comments">
        {comments.length > 0 && (node.templateId === '2' || node.templateId === '14') ? (
          <ChildList items={comments} />
        ) : comments.length > 0 ? (
          (() => {
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
                {visibleComments.map((comment, idx) => {
                  const level = Math.floor((comment.depth - minDepth) / 8)
                  const hiddenCount = hiddenCounts.get(comment.id)

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
                    findSibling('prev') || (idx > 0 ? visibleComments[idx - 1].id : null)
                  const nextId = findSibling('next')
                  const scrollTo = (elId: string) => {
                    const el = document.getElementById(`comment-${elId}`)
                    if (el) scrollToElement(el)
                  }

                  return (
                    <div key={comment.id}>
                      <Comment
                        comment={comment}
                        level={level}
                        collapsed={collapsedComments.get(comment.id)}
                        onToggleCollapse={() =>
                          toggleCommentCollapsed(comment.id, comment.childrenCount > 0)
                        }
                        onPrev={prevId ? () => scrollTo(prevId) : null}
                        onNext={nextId ? () => scrollTo(nextId) : null}
                      />
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
        ) : null}
      </div>
    </div>
  )
}
