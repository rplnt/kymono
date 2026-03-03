import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Bookmark, BookmarkCategory } from '@/types'
import { TIME_RANGES, CONFIG_PATHS } from '@/config'
import { fetchBookmarksData, openNode, minutesSince, getConfigValue } from '@/utils'

export function QuickBookmarks() {
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(() =>
    getConfigValue(CONFIG_PATHS.QUICK_BOOKMARKS_ENABLED, true)
  )
  const [collapsed, setCollapsed] = useState(false)

  // Load bookmarks data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBookmarksData()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Listen for settings changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_PATHS.QUICK_BOOKMARKS_ENABLED) {
        setEnabled(getConfigValue(CONFIG_PATHS.QUICK_BOOKMARKS_ENABLED, true))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

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
    openNode(nodeId)
  }

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation()
    loadData()
  }

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev)
  }

  // Hide if disabled
  if (!enabled) {
    return null
  }

  return (
    <div className="quick-bookmarks home-module">
      <div className="module-header" onClick={toggleCollapse}>
        <span className="module-title">{collapsed ? '▸' : '▾'} quick.bookmarks</span>
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

          {!loading && recentBookmarks.length === 0 && (
            <p className="module-empty">No new replies in the last month</p>
          )}

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
        </div>
      )}
    </div>
  )
}
