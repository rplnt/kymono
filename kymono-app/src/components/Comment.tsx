import { useState, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NodeComment } from '@/types'
import { useCurrentNode, useConfigValue, useFriends, useUser } from '@/contexts'
import { giveKarma, scrollToElement } from '@/utils'
import { CONFIG_PATHS } from '@/config'
import { Timestamp } from '@/components/Timestamp'

export function getCommentIndent(level: number): number {
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

export interface CommentProps {
  comment: NodeComment
  level: number
  collapsed: 'body' | 'subtree' | undefined
  onToggleCollapse: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

export function Comment({
  comment,
  level,
  collapsed,
  onToggleCollapse,
  onPrev,
  onNext,
}: CommentProps) {
  const navigate = useNavigate()
  const { userId } = useUser()
  const { isFriend } = useFriends()
  const { anticsrf } = useCurrentNode()
  const [showCommentToolbar] = useConfigValue<boolean>(CONFIG_PATHS.COMMENT_TOOLBAR)
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)

  const [kState, setKState] = useState<'idle' | 'sending' | 'ok' | 'error' | 'nehul' | 'neda-sa'>(
    'idle'
  )
  const [karmaOffset, setKarmaOffset] = useState(0)

  const handleGiveK = async () => {
    if (kState !== 'idle') return
    setKState('sending')
    try {
      const result = await giveKarma(comment.id, anticsrf)
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

  const displayKarma = comment.karma + karmaOffset

  const kBtn =
    comment.givenK || kState === 'ok' ? (
      <span className="give-k-given">k given</span>
    ) : kState === 'nehul' ? (
      <span className="give-k-err">nehul</span>
    ) : kState === 'neda-sa' ? (
      <span className="give-k-err">neda sa</span>
    ) : kState === 'error' ? (
      <span className="give-k-err">err</span>
    ) : (
      <button className="give-k-btn" onClick={handleGiveK} disabled={kState === 'sending'}>
        give k
      </button>
    )

  return (
    <div
      id={`comment-${comment.id}`}
      className={`comment${comment.isOrphan ? ' comment-orphan' : ''}`}
      style={{ marginLeft: `${getCommentIndent(level)}px` }}
    >
      <div className="comment-header" onClick={onToggleCollapse}>
        {comment.creatorImageUrl ? (
          <img
            src={comment.creatorImageUrl}
            alt=""
            className="comment-avatar avatar-img"
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
            {displayKarma > 0 && <span className="comment-karma karma-value">{displayKarma}K</span>}
            {(comment.isNew || comment.isOrphan) && (
              <span className="comment-badge comment-new">NEW</span>
            )}
            {comment.contentChanged && !comment.isNew && !comment.isOrphan && (
              <span className="comment-badge comment-changed">changed</span>
            )}
            {comment.isHardlink && <span className="comment-badge comment-hardlink">link</span>}
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
      {!collapsed && (
        <div className="comment-body">
          <CommentContent html={comment.content} onClick={handleContentClick} />
        </div>
      )}
      {!showCommentToolbar ? (
        <div className="comment-toolbar">
          <span className="toolbar-k-right">{kBtn}</span>
        </div>
      ) : (
        <div className="comment-toolbar">
          <button className="toolbar-btn" disabled={!onPrev} onClick={() => onPrev?.()}>
            prev
          </button>
          <span className="toolbar-sep">|</span>
          <button
            className="toolbar-btn"
            onClick={() => {
              const el = document.getElementById(`comment-${comment.id}`)
              if (el) scrollToElement(el)
            }}
          >
            up
          </button>
          <span className="toolbar-sep">|</span>
          <button className="toolbar-btn" disabled={!onNext} onClick={() => onNext?.()}>
            next
          </button>
          <span className="toolbar-k-right">{kBtn}</span>
        </div>
      )}
    </div>
  )
}
