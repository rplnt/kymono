import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FriendSubmission } from '@/types'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { fetchFriendsSubmissions, formatRelativeString } from '@/utils'
import { HomeModule } from '@/components/HomeModule'

const ITEMS_PER_PAGE = 5
const MAX_LOADS = 3 // initial + 2 "show more"

interface SubmissionsListProps {
  title: string
  slug?: string
  emptyMessage: string
  enabledPath: string
  defaultEnabled?: boolean
  filter?: (item: FriendSubmission) => boolean
  forceRefresh?: boolean
}

export function SubmissionsList({
  title,
  slug,
  emptyMessage,
  enabledPath,
  defaultEnabled = true,
  filter,
  forceRefresh,
}: SubmissionsListProps) {
  const navigate = useNavigate()
  const [items, setItems] = useState<FriendSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(enabledPath, defaultEnabled)
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFriendsSubmissions(force)
      setItems(data)
      setVisibleCount(ITEMS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load submissions:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) loadData(forceRefresh)
  }, [loadData, forceRefresh, enabled])

  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigate(path)
  }

  if (!enabled) return null

  const filtered = filter ? items.filter(filter) : items
  const maxVisible = MAX_LOADS * ITEMS_PER_PAGE
  const visible = filtered.slice(0, visibleCount)
  const canLoadMore = visibleCount < maxVisible && visibleCount < filtered.length
  const nextBatch = Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)

  return (
    <HomeModule
      title={title}
      slug={slug}
      loading={loading}
      error={error}
      empty={filtered.length === 0}
      emptyMessage={emptyMessage}
      onReload={() => loadData(true)}
    >
      {visible.map((item) => (
        <div key={item.id} className="fs-entry">
          <div className="fs-meta">
            <img
              src={item.creatorImageUrl}
              alt=""
              className="fs-avatar"
              onClick={(e) => {
                e.preventDefault()
                navigate(`/id/${item.creatorId}`)
              }}
            />
            <a
              href={`#/id/${item.creatorId}`}
              className="fs-author"
              onClick={(e) => handleLink(e, `/id/${item.creatorId}`)}
            >
              {item.login}
            </a>
            <span className="fs-date">
              {fullTimestamps ? item.createdAt : formatRelativeString(item.createdAt)}
            </span>
            {item.karma > 0 && <span className="fs-karma">{item.karma}K</span>}
          </div>
          <div className="fs-title-line">
            <a
              href={`#/id/${item.id}`}
              className="fs-title"
              onClick={(e) => handleLink(e, `/id/${item.id}`)}
            >
              {item.name}
            </a>
            <span className="fs-in">
              {' in '}
              <a
                href={`#/id/${item.parentId}`}
                className="fs-parent"
                onClick={(e) => handleLink(e, `/id/${item.parentId}`)}
              >
                {item.parentName}
              </a>
            </span>
          </div>
          <div className="fs-content">
            {item.content ? (
              <>
                {item.content.endsWith('...') ? item.content.slice(0, -3) : item.content}
                {item.content.endsWith('...') && <span className="fs-truncated">[...]</span>}
              </>
            ) : (
              <span className="fs-content-empty">...</span>
            )}
          </div>
        </div>
      ))}

      {canLoadMore && (
        <button
          className="btn-show-more"
          onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
        >
          show {nextBatch} more
        </button>
      )}
    </HomeModule>
  )
}
