import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FriendSubmission } from '@/types'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { fetchFriendsSubmissions } from '@/utils'

const ITEMS_PER_PAGE = 5

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function FriendsSubmissions() {
  const navigate = useNavigate()
  const [items, setItems] = useState<FriendSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.FRIENDS_SUBMISSIONS_ENABLED, true)
  const [useRelative] = useConfigValue(CONFIG_PATHS.RELATIVE_TIME, true)
  const [collapsed, setCollapsed] = useState(false)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFriendsSubmissions()
      setItems(data)
      setVisibleCount(ITEMS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load friends submissions:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation()
    loadData()
  }

  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigate(path)
  }

  if (!enabled) return null

  const visible = items.slice(0, visibleCount)
  const remaining = items.length - visibleCount

  return (
    <div className="home-module">
      <div className="module-header" onClick={() => setCollapsed((prev) => !prev)}>
        <span className="module-title">{collapsed ? '▸' : '▾'} friends.submissions</span>
        <button className="module-reload" onClick={handleReload} title="Reload">
          ↻
        </button>
      </div>

      {!collapsed && (
        <div className="module-content">
          {loading && (
            <div className="module-loading">
              <div className="sp-circle" />
            </div>
          )}

          {!loading && error && (
            <p className="module-error">
              {error}{' '}
              <button className="module-retry" onClick={handleReload}>
                Retry
              </button>
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="module-empty">No submissions from friends</p>
          )}

          {visible.map((item) => (
            <div key={item.id} className="friend-submission">
              <div className="comment-header">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="comment-avatar"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/id/${item.creatorId}`)
                  }}
                />
                <div className="comment-meta">
                  <div className="comment-meta-line">
                    <a
                      href={`#/id/${item.creatorId}`}
                      className="comment-author"
                      onClick={(e) => handleLink(e, `/id/${item.creatorId}`)}
                    >
                      {item.login}
                    </a>
                    <span className="comment-date">
                      {useRelative ? relativeTime(item.createdAt) : item.createdAt}
                    </span>
                    {item.karma > 0 && (
                      <span className="comment-karma">{item.karma}K</span>
                    )}
                  </div>
                  <div className="fs-title-line">
                    <a
                      href={`#/id/${item.id}`}
                      className="comment-title"
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
                </div>
              </div>
              {item.content
                ? <div className="fs-content">{item.content}</div>
                : <div className="fs-content fs-content-empty">¯\_(ツ)_/¯</div>
              }
            </div>
          ))}

          {remaining > 0 && (
            <button
              className="btn-show-more"
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            >
              show more ({remaining} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
