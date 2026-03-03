import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { BookmarkCategory, Bookmark, SearchIndex } from '@/types'
import { TIME_RANGES, CONFIG_PATHS } from '@/config'
import {
  fetchBookmarksData,
  openNode,
  buildSearchIndex,
  searchIndex,
  minutesSince,
  getConfigValue,
} from '@/utils'

function getDefaultTimeRangeIndex(): number {
  const defaultTimespan = getConfigValue<string>(CONFIG_PATHS.DEFAULT_TIMESPAN, '24H')
  const index = TIME_RANGES.findIndex((r) => r.label === defaultTimespan)
  return index >= 0 ? index : 0
}

export function Bookmarks() {
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterText, setFilterText] = useState('')
  const [showNewOnly, setShowNewOnly] = useState(true)
  const [timeRangeIndex, setTimeRangeIndex] = useState(getDefaultTimeRangeIndex)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [index, setIndex] = useState<SearchIndex | null>(null)

  const filterInputRef = useRef<HTMLInputElement>(null)

  // Load bookmarks data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchBookmarksData()
        setCategories(data)

        // Build search index
        const items: Array<[string, string]> = []
        data.forEach((cat) => {
          cat.bookmarks.forEach((bm) => {
            items.push([bm.name, bm.id])
          })
        })
        setIndex(buildSearchIndex(items))
      } catch (error) {
        console.error('Failed to load bookmarks:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-focus filter if setting enabled
  useEffect(() => {
    if (!loading && getConfigValue(CONFIG_PATHS.FOCUS_FILTER, false)) {
      filterInputRef.current?.focus()
    }
  }, [loading])

  const includeDescendants = getConfigValue(CONFIG_PATHS.INCLUDE_DESCENDANTS, true)
  const currentTimeRange = TIME_RANGES[timeRangeIndex]

  // Filter bookmarks based on criteria
  const isBookmarkVisible = useCallback(
    (bookmark: Bookmark, searchIds: string[] | null): boolean => {
      // If searching, only show matching bookmarks
      if (searchIds !== null) {
        return searchIds.includes(bookmark.id)
      }

      // Check time range
      const minutesAgo = minutesSince(bookmark.visitedAt)
      if (minutesAgo > currentTimeRange.minutes) {
        return false
      }

      // Check NEW filter
      if (showNewOnly) {
        const hasUnread = bookmark.unread > 0
        const hasNewDescendants = includeDescendants && bookmark.hasDescendants
        if (!hasUnread && !hasNewDescendants) {
          return false
        }
      }

      return true
    },
    [currentTimeRange.minutes, showNewOnly, includeDescendants]
  )

  // Get visible bookmarks with search applied
  const visibleData = useMemo(() => {
    const searchIds = filterText && index ? searchIndex(index, filterText) : null

    return categories
      .map((cat) => ({
        ...cat,
        visibleBookmarks: cat.bookmarks.filter((bm) => isBookmarkVisible(bm, searchIds)),
      }))
      .filter((cat) => cat.visibleBookmarks.length > 0 || searchIds === null)
  }, [categories, filterText, index, isBookmarkVisible])

  // Count visible bookmarks (for Enter to open single result)
  const totalVisibleBookmarks = useMemo(() => {
    return visibleData.reduce((sum, cat) => sum + cat.visibleBookmarks.length, 0)
  }, [visibleData])

  // Handle filter input change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value)
  }

  // Handle Enter key to open single result
  const handleFilterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && totalVisibleBookmarks === 1) {
      const singleBookmark = visibleData.flatMap((cat) => cat.visibleBookmarks).find(() => true)
      if (singleBookmark) {
        openNode(singleBookmark.node)
      }
    }
  }

  // Toggle NEW/ALL filter
  const toggleNewFilter = () => {
    setShowNewOnly((prev) => !prev)
  }

  // Cycle time range
  const cycleTimeRange = () => {
    setTimeRangeIndex((prev) => (prev + 1) % TIME_RANGES.length)
  }

  // Toggle category collapsed state
  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryName)) {
        next.delete(categoryName)
      } else {
        next.add(categoryName)
      }
      return next
    })
  }

  // Handle bookmark click
  const handleBookmarkClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    openNode(nodeId)
  }

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  return (
    <div>
      <input
        ref={filterInputRef}
        type="search"
        className="book-filter"
        placeholder="Filter Bookmarks"
        value={filterText}
        onChange={handleFilterChange}
        onKeyDown={handleFilterKeyDown}
      />

      <div className="filter-menu">
        <span>Show</span>
        <button className="btn btn-filter" onClick={toggleNewFilter}>
          {showNewOnly ? 'NEW' : 'ALL'}
        </button>
        <span>visited in</span>
        <button className="btn btn-filter" onClick={cycleTimeRange}>
          {currentTimeRange.label}
        </button>
      </div>

      {visibleData.map((cat) => (
        <div key={cat.name} className="book-cat">
          <div className="cat-header" onClick={() => toggleCategory(cat.name)}>
            <span className="cat name">{cat.name}</span>
            {cat.unread > 0 && <span className="cat unread">{cat.unread}</span>}
          </div>

          {!collapsedCategories.has(cat.name) &&
            cat.visibleBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark" data-unread={bookmark.unread}>
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
      ))}
    </div>
  )
}
