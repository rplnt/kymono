import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LatestReply } from '@/types'

const MAX_PER_GROUP = 3

interface ReplyGroup {
  parentId: string
  parentName: string
  replies: LatestReply[]
}

interface LatestRepliesProps {
  replies: LatestReply[]
  lastLoadedAt: string | null
}

function ReplyGroupView({
  group,
  onNavigate,
}: {
  group: ReplyGroup
  onNavigate: (id: string) => void
}) {
  const shown = group.replies.slice(0, MAX_PER_GROUP)
  const extra = group.replies.length - MAX_PER_GROUP

  const handleClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    onNavigate(nodeId)
  }

  return (
    <div className="reply-group">
      <a
        href={`#/id/${group.parentId}`}
        className="reply-group-parent"
        onClick={(e) => handleClick(e, group.parentId)}
      >
        <span className="lr-in">In</span>
        {group.parentName}
      </a>
      {shown.map((reply) => (
        <div key={reply.id} className="lr-entry">
          <span className="lr-branch">{'\u2514'}</span>
          <img
            src={reply.imageUrl}
            alt={reply.login}
            title={reply.login}
            className="lr-avatar"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <a
            href={`#/id/${reply.id}`}
            className="lr-text"
            onClick={(e) => handleClick(e, reply.id)}
          >
            {reply.content}
          </a>
        </div>
      ))}
      {extra > 0 && (
        <a
          href={`#/id/${group.parentId}`}
          className="lr-more"
          onClick={(e) => handleClick(e, group.parentId)}
        >
          +{extra} more
        </a>
      )}
    </div>
  )
}

export function LatestReplies({ replies, lastLoadedAt }: LatestRepliesProps) {
  const navigate = useNavigate()
  const [showOlder, setShowOlder] = useState(false)

  const { newGroups, oldGroups } = useMemo(() => {
    const map = new Map<string, ReplyGroup>()
    for (const reply of replies) {
      const existing = map.get(reply.parentId)
      if (existing) {
        existing.replies.push(reply)
      } else {
        map.set(reply.parentId, {
          parentId: reply.parentId,
          parentName: reply.parentName,
          replies: [reply],
        })
      }
    }

    const all = Array.from(map.values())
    const fresh: ReplyGroup[] = []
    const old: ReplyGroup[] = []

    for (const group of all) {
      const hasNew = !lastLoadedAt || group.replies.some((r) => r.createdAt > lastLoadedAt)
      if (hasNew) {
        fresh.push(group)
      } else {
        old.push(group)
      }
    }

    return { newGroups: fresh, oldGroups: old }
  }, [replies, lastLoadedAt])

  if (newGroups.length === 0 && oldGroups.length === 0) return null

  const handleNavigate = (id: string) => navigate(`/id/${id}`)

  return (
    <div className="latest-replies-section">
      <div className="latest-replies-header">
        <span className="latest-replies-title">latest.replies</span>
      </div>

      <div className="latest-replies-list">
        {newGroups.map((group) => (
          <ReplyGroupView key={group.parentId} group={group} onNavigate={handleNavigate} />
        ))}

        {oldGroups.length > 0 && (
          <>
            <button className="lr-show-older" onClick={() => setShowOlder((prev) => !prev)}>
              {showOlder ? 'hide' : 'show'} older (
              {oldGroups.reduce((n, g) => n + g.replies.length, 0)})
            </button>
            {showOlder &&
              oldGroups.map((group) => (
                <ReplyGroupView key={group.parentId} group={group} onNavigate={handleNavigate} />
              ))}
          </>
        )}
      </div>
    </div>
  )
}
