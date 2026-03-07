import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Bookmark, BookmarkCategory } from '@/types'
import { useConfigValue } from '@/contexts'
import { TIME_RANGES, CONFIG_PATHS } from '@/config'
import { fetchBookmarksData, minutesSince } from '@/utils'
import { HomeModule } from '@/components/HomeModule'

export function QuickBookmarks() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.QUICK_BOOKMARKS_ENABLED, true)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBookmarksData(force)
      setCategories(data)
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      setError('Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter to bookmarks from last month with new replies, sorted by last visited, limit 10
  // Prioritize those with unread, then fill with descendants-only
  const recentBookmarks = useMemo(() => {
    const maxMinutes = TIME_RANGES[2].minutes // 1M = 30 days
    const withUnread: Bookmark[] = []
    const descendantsOnly: Bookmark[] = []

    for (const cat of categories) {
      for (const bookmark of cat.bookmarks) {
        const minutesAgo = minutesSince(bookmark.visitedAt)

        // Only include if visited in last month
        if (minutesAgo > maxMinutes) continue

        if (bookmark.unread > 0) {
          withUnread.push(bookmark)
        } else if (bookmark.hasDescendants) {
          descendantsOnly.push(bookmark)
        }
      }
    }

    // Sort both by last visited (most recent first)
    const sortByVisited = (a: Bookmark, b: Bookmark) => {
      return minutesSince(a.visitedAt) - minutesSince(b.visitedAt)
    }
    withUnread.sort(sortByVisited)
    descendantsOnly.sort(sortByVisited)

    // Prioritize unread, fill remaining slots with descendants-only
    const result = withUnread.slice(0, 10)
    if (result.length < 10) {
      result.push(...descendantsOnly.slice(0, 10 - result.length))
    }

    return result
  }, [categories])

  // Handle bookmark click
  const handleBookmarkClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    navigate(`/id/${nodeId}`)
  }

  // Hide if disabled
  if (!enabled) {
    return null
  }

  return (
    <HomeModule
      title="quick.bookmarks"
      loading={loading}
      error={error}
      empty={recentBookmarks.length === 0}
      emptyMessage="No new replies in the last month"
      onReload={() => loadData(true)}
    >
      {recentBookmarks.length > 0 && (
        <div className="quick-bookmarks-list">
          {recentBookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark">
              <a
                href={`/id/${bookmark.node}`}
                className="book-name node-link"
                onClick={(e) => handleBookmarkClick(e, bookmark.node)}
                dangerouslySetInnerHTML={{ __html: bookmark.nameHtml }}
              />
              {(bookmark.unread > 0 || bookmark.hasDescendants) && (
                <span className="book-unread">
                  {bookmark.unread > 0 && (
                    <span className="book-unread-count">{bookmark.unread}</span>
                  )}
                  {bookmark.hasDescendants && (
                    <span className="book-unread-descendants" title="New in thread" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </HomeModule>
  )
}
