import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FriendSubmission } from '@/types'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { fetchFriendsSubmissions } from '@/utils'
import { HomeModule } from '@/components/HomeModule'

const MAX_DISPLAY = 8
const MIN_SUBMISSIONS = 2

interface HotNode {
  parentId: string
  parentName: string
  count: number
  latestCreatedAt: string
}

export function HotNodes() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<FriendSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.HOT_NODES_ENABLED, false)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFriendsSubmissions(force)
      setSubmissions(data)
    } catch (err) {
      console.error('Failed to load hot nodes:', err)
      setError('Failed to load hot nodes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      loadData()
    }
  }, [loadData, enabled])

  const hotNodes = useMemo(() => {
    const grouped = new Map<string, HotNode>()

    for (const sub of submissions) {
      const existing = grouped.get(sub.parentId)
      if (existing) {
        existing.count++
        if (sub.createdAt > existing.latestCreatedAt) {
          existing.latestCreatedAt = sub.createdAt
        }
      } else {
        grouped.set(sub.parentId, {
          parentId: sub.parentId,
          parentName: sub.parentName,
          count: 1,
          latestCreatedAt: sub.createdAt,
        })
      }
    }

    return Array.from(grouped.values())
      .filter((node) => node.count > MIN_SUBMISSIONS)
      .sort((a, b) => b.count - a.count || (b.latestCreatedAt > a.latestCreatedAt ? 1 : -1))
      .slice(0, MAX_DISPLAY)
  }, [submissions])

  const handleClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    navigate(`/id/${nodeId}`)
  }

  if (!enabled) {
    return null
  }

  return (
    <HomeModule
      title="hot.nodes"
      slug="hot-nodes"
      loading={loading}
      error={error}
      empty={hotNodes.length === 0}
      emptyMessage="No hot nodes right now"
      onReload={() => loadData(true)}
    >
      {hotNodes.length > 0 && (
        <div className="quick-bookmarks-list">
          {hotNodes.map((node) => (
            <div key={node.parentId} className="bookmark">
              <a
                href={`/id/${node.parentId}`}
                className="book-name node-link"
                onClick={(e) => handleClick(e, node.parentId)}
              >
                {node.parentName}
              </a>
              <span className="book-unread">
                <span className="book-unread-count">{node.count}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </HomeModule>
  )
}
