import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BookmarkCategory, Bookmark, SearchIndex } from '@/types'
import { TIME_RANGES, CONFIG_PATHS } from '@/config'
import { fetchBookmarksData, buildSearchIndex, searchIndex, minutesSince } from '@/utils'
import { useConfigValue } from '@/contexts'
import { useTitle } from '@/utils/useTitle'
import { usePullToRefresh } from '@/utils/usePullToRefresh'

const STORAGE_KEY = 'kymono.bookmarks.filters'

interface BookmarkFilters {
  showNewOnly: boolean
  timeRangeIndex: number
}

function loadFilters(): BookmarkFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        showNewOnly: typeof parsed.showNewOnly === 'boolean' ? parsed.showNewOnly : false,
        timeRangeIndex:
          typeof parsed.timeRangeIndex === 'number' &&
          parsed.timeRangeIndex >= 0 &&
          parsed.timeRangeIndex < TIME_RANGES.length
            ? parsed.timeRangeIndex
            : TIME_RANGES.length - 1,
      }
    }
  } catch {
    // Invalid JSON, use defaults
  }
  return { showNewOnly: false, timeRangeIndex: TIME_RANGES.length - 1 }
}

function saveFilters(filters: BookmarkFilters): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

export function Bookmarks() {
  useTitle('Bookmarks')
  const navigate = useNavigate()
  const [includeDescendants] = useConfigValue(CONFIG_PATHS.INCLUDE_DESCENDANTS)
  const [categories, setCategories] = useState<BookmarkCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')
  const [showNewOnly, setShowNewOnly] = useState(() => loadFilters().showNewOnly)
  const [timeRangeIndex, setTimeRangeIndex] = useState(() => loadFilters().timeRangeIndex)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [index, setIndex] = useState<SearchIndex | null>(null)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBookmarksData(force)
      setCategories(data)

      // Build search index
      const items: Array<[string, string]> = []
      data.forEach((cat) => {
        cat.bookmarks.forEach((bm) => {
          items.push([bm.name, bm.id])
        })
      })
      setIndex(buildSearchIndex(items))
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      setError('Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }, [])

  usePullToRefresh(() => loadData(true))

  useEffect(() => {
    loadData()
  }, [loadData])

  const currentTimeRange = TIME_RANGES[timeRangeIndex]

  // Filter bookmarks based on criteria
  const isBookmarkVisible = useCallback(
    (bookmark: Bookmark, searchIds: string[] | null): boolean => {
      // If searching, only show matching bookmarks
      if (searchIds !== null) {
        return searchIds.includes(bookmark.id)
      }

      // Check time range (0 = ALL, no filtering)
      if (currentTimeRange.minutes > 0) {
        const minutesAgo = minutesSince(bookmark.visitedAt)
        if (minutesAgo > currentTimeRange.minutes) {
          return false
        }
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
      const singleBookmark = visibleData.flatMap((cat) => cat.visibleBookmarks).at(0)
      if (singleBookmark) {
        navigate(`/id/${singleBookmark.node}`)
      }
    }
  }

  // Toggle NEW/ALL filter
  const toggleNewFilter = () => {
    setShowNewOnly((prev) => {
      const next = !prev
      saveFilters({ showNewOnly: next, timeRangeIndex })
      return next
    })
  }

  // Cycle time range
  const cycleTimeRange = () => {
    setTimeRangeIndex((prev) => {
      const next = (prev + 1) % TIME_RANGES.length
      saveFilters({ showNewOnly, timeRangeIndex: next })
      return next
    })
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
    navigate(`/id/${nodeId}`)
  }

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-retry" onClick={() => loadData(true)}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <input
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

      {visibleData.map((cat, catIndex) => (
        <div key={`${catIndex}-${cat.name}`} className="book-cat">
          <div className="cat-header" onClick={() => toggleCategory(cat.name)}>
            <span className="cat name">{cat.name}</span>
            {cat.unread > 0 && <span className="cat-unread">{cat.unread}</span>}
          </div>

          {!collapsedCategories.has(cat.name) &&
            cat.visibleBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bookmark list-row" data-unread={bookmark.unread}>
                <a
                  href={`/id/${bookmark.node}`}
                  className="book-name node-link text-fade-right"
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
