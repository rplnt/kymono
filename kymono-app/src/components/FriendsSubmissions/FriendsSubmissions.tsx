import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FriendSubmission } from '@/types'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { fetchFriendsSubmissions, formatRelativeString } from '@/utils'
import { HomeModule } from '@/components/HomeModule'

const ITEMS_PER_PAGE = 5

export function FriendsSubmissions() {
  const navigate = useNavigate()
  const [items, setItems] = useState<FriendSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.FRIENDS_SUBMISSIONS_ENABLED, true)
  const [fullTimestamps] = useConfigValue(CONFIG_PATHS.FULL_TIMESTAMPS, true)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFriendsSubmissions(force)
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

  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigate(path)
  }

  if (!enabled) return null

  const visible = items.slice(0, visibleCount)
  const remaining = items.length - visibleCount

  return (
    <HomeModule
      title="friends.submissions"
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyMessage="No submissions from friends"
      onReload={() => loadData(true)}
    >
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
                  {fullTimestamps ? item.createdAt : formatRelativeString(item.createdAt)}
                </span>
                {item.karma > 0 && <span className="comment-karma">{item.karma}K</span>}
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
          <div className="comment-body">
            <div className="comment-content">
              {item.content ? (
                <>
                  {item.content.endsWith('...') ? item.content.slice(0, -3) : item.content}
                  {item.content.endsWith('...') && <span className="fs-truncated">[...]</span>}
                </>
              ) : (
                <span className="fs-content-empty">¯\_(ツ)_/¯</span>
              )}
            </div>
          </div>
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
    </HomeModule>
  )
}
