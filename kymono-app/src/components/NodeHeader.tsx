import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NodeData } from '@/types'
import { useCurrentNode, useConfigValue, useFriends, useUser } from '@/contexts'
import { giveKarma } from '@/utils'
import { config, CONFIG_PATHS } from '@/config'
import { ExternalLinkIcon } from '@/components/ExternalLinkIcon'
import { Timestamp } from '@/components/Timestamp'

interface NodeHeaderProps {
  node: NodeData
  contentCollapsed: boolean
  onToggleContentCollapsed: () => void
  starred: boolean
  onToggleStar: () => void
  onScrollToComments: () => void
}

export function NodeHeader({
  node,
  contentCollapsed,
  onToggleContentCollapsed,
  starred,
  onToggleStar,
  onScrollToComments,
}: NodeHeaderProps) {
  const navigate = useNavigate()
  const { userId } = useUser()
  const { isFriend } = useFriends()
  const { anticsrf } = useCurrentNode()
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)

  const [kState, setKState] = useState<'idle' | 'sending' | 'ok' | 'error' | 'nehul' | 'neda-sa'>('idle')
  const [karmaOffset, setKarmaOffset] = useState(0)

  const handleGiveK = async () => {
    if (kState !== 'idle') return
    setKState('sending')
    try {
      const result = await giveKarma(node.id, anticsrf)
      setKState(result)
      if (result === 'ok') {
        setKarmaOffset(1)
      }
    } catch {
      setKState('error')
    }
  }

  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      const match = href.match(/^\/id\/(\d+)/)
      if (match) {
        e.preventDefault()
        navigate(`/id/${match[1]}`)
      }
    },
    [navigate]
  )

  const externalUrl = `${config.externalBase}/id/${node.id}`
  const displayKarma = node.karma + karmaOffset

  const kWrap = (
    <div className="give-k-wrap">
      {node.givenK || kState === 'ok' ? (
        <span className="give-k-given">k given</span>
      ) : kState === 'nehul' ? (
        <span className="give-k-err">nehul</span>
      ) : kState === 'neda-sa' ? (
        <span className="give-k-err">neda sa</span>
      ) : kState === 'error' ? (
        <span className="give-k-err">err</span>
      ) : (
        <button
          className="give-k-btn"
          onClick={handleGiveK}
          disabled={kState === 'sending'}
        >
          give k
        </button>
      )}
    </div>
  )

  return (
    <>
      <div className="node-parent-ref">
        {node.parentId && (
          <>
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
          </>
        )}
        <button
          className={`star-btn${starred ? ' active' : ''}`}
          onClick={onToggleStar}
          title={starred ? 'Unstar' : 'Star'}
        >
          {starred ? '\u2605' : '\u2606'}
        </button>
      </div>
      {node.templateId === '4' ? (
        /* Submission: render like a comment */
        <div className="comment node-as-comment">
          <div className="comment-header" onClick={onToggleContentCollapsed}>
            {node.creatorImageUrl ? (
              <img
                src={node.creatorImageUrl}
                alt=""
                className="comment-avatar avatar-img"
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
                {displayKarma >= 1 && (
                  <span className="comment-karma karma-value">{displayKarma}K</span>
                )}
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
          {kWrap}
        </div>
      ) : (
        <>
          {/* Node header */}
          <div
            className={`node-header${contentCollapsed ? ' collapsed' : ''}`}
            onClick={onToggleContentCollapsed}
          >
            <div className="node-header-row">
              <h1 className="node-title" dangerouslySetInnerHTML={{ __html: node.nameHtml }} />
              {displayKarma >= 1 && node.templateId !== '2' && node.templateId !== '3' && (
                <span className="node-karma karma-value">{displayKarma} K</span>
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
                    onScrollToComments()
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
          {kWrap}
        </>
      )}
    </>
  )
}
